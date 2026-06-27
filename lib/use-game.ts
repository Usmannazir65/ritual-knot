"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  type Board,
  type Mark,
  type Opponent,
  type Score,
  chooseOpponentMove,
  computeScore,
  easeToSharp,
  emptyBoard,
  getResult,
  OPPONENTS,
  randomItem,
} from "@/lib/game";

export type Screen =
  | "connect"
  | "lobby"
  | "reveal"
  | "board"
  | "win"
  | "lose"
  | "submitting"
  | "leaderboard";

export type RevealPhase = "drawing" | "flip" | "done";
export type ResultKind = "lose" | "draw" | null;
export type SubmitStatus = "idle" | "pending" | "success" | "error";

// Pure match/UI state. Wallet, balance, scores, and the leaderboard are NOT
// here — those are real Ritual-Chain reads/writes via useArena.
export type GameState = {
  screen: Screen;
  opponent: Opponent | null;
  board: Board;
  turn: Mark;
  playerMoves: number;
  winLine: number[] | null;
  thinking: boolean;
  revealPhase: RevealPhase;
  revealFlipped: boolean;
  showBegin: boolean;
  result: ResultKind;
  lastScore: Score | null;
  winFlipped: boolean;
  // Player-controlled win-ease (0 hard … 1 easy). Drives opponent sharpness.
  ease: number;
  // Submit-tx UI status, driven by the real chain call in the orchestrator.
  submitStatus: SubmitStatus;
  txHash: string;
  submitError: string;
};

const INITIAL: GameState = {
  screen: "connect",
  opponent: null,
  board: emptyBoard(),
  turn: "X",
  playerMoves: 0,
  winLine: null,
  thinking: false,
  revealPhase: "drawing",
  revealFlipped: false,
  showBegin: false,
  result: null,
  lastScore: null,
  winFlipped: false,
  ease: 0.65,
  submitStatus: "idle",
  txHash: "",
  submitError: "",
};

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** Tracks the user's reduced-motion preference, reactively + SSR-safe. */
function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(REDUCED_MOTION_QUERY);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  );
}

export type GameActions = {
  goConnect: () => void;
  goLobby: () => void;
  goLeaderboard: () => void;
  enterMatch: () => void;
  begin: () => void;
  playCell: (i: number) => void;
  setEase: (ease: number) => void;
  startSubmitting: () => void;
  setTxHash: (hash: string) => void;
  submitSucceeded: () => void;
  submitFailed: (message: string) => void;
};

export function useGame() {
  const [state, setState] = useState<GameState>(INITIAL);
  const reducedMotion = usePrefersReducedMotion();

  // Read-only mirror of the latest state for use inside timeout chains, so the
  // AI/animation sequencing never closes over stale values.
  const stateRef = useRef(state);
  const rmRef = useRef(reducedMotion);
  useEffect(() => {
    stateRef.current = state;
    rmRef.current = reducedMotion;
  });

  const d = useCallback((ms: number) => (rmRef.current ? Math.min(ms, 150) : ms), []);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const schedule = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  }, []);
  useEffect(() => {
    const ids = timers.current;
    return () => ids.forEach(clearTimeout);
  }, []);

  const patch = useCallback(
    (partial: Partial<GameState> | ((s: GameState) => Partial<GameState>)) =>
      setState((s) => ({ ...s, ...(typeof partial === "function" ? partial(s) : partial) })),
    [],
  );

  const setWin = useCallback(
    (opponent: Opponent, playerMoves: number) => {
      patch({ screen: "win", opponent, winFlipped: false, lastScore: computeScore(playerMoves) });
      schedule(() => patch({ winFlipped: true }), d(500));
    },
    [patch, schedule, d],
  );

  const endGame = useCallback(
    (winner: Mark | "draw", line: number[] | null) => {
      if (winner === "X") {
        patch({ winLine: line });
        schedule(() => setWin(stateRef.current.opponent!, stateRef.current.playerMoves), d(900));
      } else if (winner === "O") {
        patch({ winLine: line });
        schedule(() => patch({ screen: "lose", result: "lose" }), d(900));
      } else {
        schedule(() => patch({ screen: "lose", result: "draw" }), d(650));
      }
    },
    [patch, schedule, d, setWin],
  );

  const opponentMove = useCallback(
    (b: Board) => {
      const s = stateRef.current;
      if (s.screen !== "board" || !s.opponent) return;
      const mv = chooseOpponentMove(b, easeToSharp(s.ease));
      if (mv < 0) return;
      const next = b.slice();
      next[mv] = "O";
      patch({ board: next, turn: "X", thinking: false });
      const r = getResult(next);
      if (r) endGame(r.winner, r.line);
    },
    [patch, endGame],
  );

  const playCell = useCallback(
    (i: number) => {
      const s = stateRef.current;
      if (s.winLine || s.board[i] || s.turn !== "X") return;
      const next = s.board.slice();
      next[i] = "X";
      const playerMoves = s.playerMoves + 1;
      patch({ board: next, playerMoves });
      const r = getResult(next);
      if (r) {
        endGame(r.winner, r.line);
        return;
      }
      patch({ turn: "O", thinking: true });
      schedule(() => opponentMove(next), d(720));
    },
    [patch, schedule, d, endGame, opponentMove],
  );

  const startGame = useCallback(() => {
    patch({
      screen: "board",
      board: emptyBoard(),
      turn: "X",
      playerMoves: 0,
      winLine: null,
      thinking: false,
    });
  }, [patch]);

  // Entering a match is free: just draw a random opponent and reveal it.
  const enterMatch = useCallback(() => {
    const opponent = randomItem(OPPONENTS);
    patch({
      screen: "reveal",
      opponent,
      revealPhase: "drawing",
      revealFlipped: false,
      showBegin: false,
    });
    schedule(() => {
      patch({ revealPhase: "flip" });
      schedule(() => patch({ revealFlipped: true }), d(450));
      schedule(() => patch({ revealPhase: "done", showBegin: true }), d(1250));
    }, d(1700));
  }, [patch, schedule, d]);

  const actions: GameActions = {
    goConnect: useCallback(() => patch({ screen: "connect" }), [patch]),
    goLobby: useCallback(() => patch({ screen: "lobby" }), [patch]),
    goLeaderboard: useCallback(() => patch({ screen: "leaderboard" }), [patch]),
    enterMatch,
    begin: startGame,
    playCell,
    setEase: useCallback((ease: number) => patch({ ease }), [patch]),
    startSubmitting: useCallback(
      () => patch({ screen: "submitting", submitStatus: "pending", txHash: "", submitError: "" }),
      [patch],
    ),
    setTxHash: useCallback((hash: string) => patch({ txHash: hash }), [patch]),
    submitSucceeded: useCallback(() => patch({ submitStatus: "success" }), [patch]),
    submitFailed: useCallback(
      (message: string) => patch({ submitStatus: "error", submitError: message }),
      [patch],
    ),
  };

  return { state, actions, reducedMotion };
}
