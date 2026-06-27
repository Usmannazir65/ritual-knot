// ════════════════════════════════════════════════════════════════
// Ritual · Tic Tac Toe — game engine
//
// Single-player tic-tac-toe against a "machine opponent" drawn from the
// Ritual team roster. Each opponent has one knob — `sharp` — the chance it
// plays the optimal (minimax) move on a given turn; otherwise it plays a
// random legal move. Capped below 1 so every match stays winnable, which is
// what keeps the onchain submit loop alive.
//
// Ported from the design prototype (Ritual Tic Tac Toe.dc.html). Scoring
// math here mirrors what the contract is specified to compute onchain.
// ════════════════════════════════════════════════════════════════

export type Mark = "X" | "O";
export type Cell = Mark | null;
export type Board = Cell[];

/** Player is always X; the machine opponent is always O. */
export const PLAYER: Mark = "X";
export const OPPONENT: Mark = "O";

export type DifficultyBand = "Loose" | "Balanced" | "Sharp";

export type Opponent = {
  name: string;
  img: string;
  band: DifficultyBand;
  /** Probability of playing the optimal move on a given turn. */
  sharp: number;
  desc: string;
};

// Difficulty bands assigned by persona (see brief §3). Sharp is capped at
// 0.90 — never 1.0 — so a clean player always has a path through.
export const OPPONENTS: Opponent[] = [
  { name: "TheCutest", img: "/assets/opp-thecutest.jpg", band: "Loose", sharp: 0.55, desc: "Lavender oracle" },
  { name: "MajorProject", img: "/assets/opp-majorproject.jpg", band: "Loose", sharp: 0.55, desc: "Knot-bearer" },
  { name: "Stefan", img: "/assets/opp-stefan.jpg", band: "Sharp", sharp: 0.9, desc: "Lab-coat strategist" },
  { name: "Dunken", img: "/assets/opp-dunken.jpg", band: "Sharp", sharp: 0.9, desc: "Stone philosopher" },
  { name: "Jez", img: "/assets/opp-jez.jpg", band: "Loose", sharp: 0.55, desc: "Festive orb-holder" },
  { name: "Josh", img: "/assets/opp-josh.jpg", band: "Balanced", sharp: 0.75, desc: "Abstract drifter" },
  { name: "Arka", img: "/assets/opp-arka.jpg", band: "Sharp", sharp: 0.9, desc: "Arithmancy wizard" },
  { name: "Niraj", img: "/assets/opp-niraj.jpg", band: "Balanced", sharp: 0.75, desc: "Pink witch" },
  { name: "Arshan", img: "/assets/opp-arshan.jpg", band: "Balanced", sharp: 0.75, desc: "Hand-drawn duelist" },
];

export const WIN_LINES: ReadonlyArray<readonly [number, number, number]> = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6], // diagonals
];

export type GameResult = { winner: Mark | "draw"; line: number[] | null };

export function emptyBoard(): Board {
  return Array(9).fill(null);
}

/** Detect a finished board: a completed line, a draw, or null if in play. */
export function getResult(b: Board): GameResult | null {
  for (const [a, c, d] of WIN_LINES) {
    if (b[a] && b[a] === b[c] && b[a] === b[d]) {
      return { winner: b[a] as Mark, line: [a, c, d] };
    }
  }
  if (b.every((cell) => cell)) return { winner: "draw", line: null };
  return null;
}

// Minimax from the opponent's perspective (O maximizes). Because the optimal
// move already includes "take an available win" and "block an available
// loss", `sharp` alone controls how often the opponent finds it.
function minimax(b: Board, player: Mark): { i: number; score: number } {
  const r = getResult(b);
  if (r) {
    if (r.winner === OPPONENT) return { i: -1, score: 10 };
    if (r.winner === PLAYER) return { i: -1, score: -10 };
    return { i: -1, score: 0 };
  }
  const moves: { i: number; score: number }[] = [];
  for (let i = 0; i < 9; i++) {
    if (!b[i]) {
      const next = b.slice();
      next[i] = player;
      moves.push({ i, score: minimax(next, player === OPPONENT ? PLAYER : OPPONENT).score });
    }
  }
  return player === OPPONENT
    ? moves.reduce((acc, m) => (m.score > acc.score ? m : acc))
    : moves.reduce((acc, m) => (m.score < acc.score ? m : acc));
}

export function bestMove(b: Board): number {
  return minimax(b, OPPONENT).i;
}

export function legalMoves(b: Board): number[] {
  const out: number[] = [];
  for (let i = 0; i < 9; i++) if (!b[i]) out.push(i);
  return out;
}

/**
 * Pick the opponent's move: the optimal move with probability `sharp`,
 * otherwise a random legal move.
 */
export function chooseOpponentMove(b: Board, sharp: number): number {
  const legal = legalMoves(b);
  if (!legal.length) return -1;
  if (Math.random() < sharp) return bestMove(b);
  return legal[Math.floor(Math.random() * legal.length)];
}

// ── Scoring ──────────────────────────────────────────────────────
// A win = 100 base + a speed bonus. Fewer player moves to close out the win
// → bigger bonus. Mirrors the onchain scoring the contract is specified to do.

export type Score = { base: number; bonus: number; total: number; moves: number };

export function computeScore(playerMoves: number): Score {
  const moves = Math.max(3, playerMoves);
  const bonus = Math.max(0, 6 - moves) * 20;
  return { base: 100, bonus, total: 100 + bonus, moves };
}

// ── Win-ease (player-controlled difficulty) ──────────────────────
// The player sets how easy a match is via a slider. `ease` 0→1 maps to the
// opponent's sharpness (chance of an optimal move). Higher ease = lower
// sharpness = easier to win. Capped in [0.4, 0.9] so it's never a coin flip
// and never a perfect wall.
export function easeToSharp(ease: number): number {
  const e = Math.min(1, Math.max(0, ease));
  return Math.round((0.9 - e * 0.5) * 100) / 100; // 0.40 … 0.90
}

export function bandForSharp(sharp: number): DifficultyBand {
  if (sharp >= 0.85) return "Sharp";
  if (sharp >= 0.65) return "Balanced";
  return "Loose";
}

export function sharpLabel(sharp: number): { band: DifficultyBand; pct: string } {
  return { band: bandForSharp(sharp), pct: `${Math.round(sharp * 100)}%` };
}

export function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Roster index of an opponent — this is the `opponentId` sent on-chain. */
export function opponentId(opponent: Opponent): number {
  return OPPONENTS.indexOf(opponent);
}

/** Shorten an address for display: 0x1234… abCD. */
export function shortAddress(address: string): string {
  return address.length > 10 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address;
}
