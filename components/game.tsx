"use client";

import { useCallback, useEffect, useState } from "react";
import { Header, HudFrame } from "@/components/hud";
import { DifficultySlider } from "@/components/difficulty-slider";
import { Chip, CostButton, FlipCard, GhostButton, GlowDot, Knot, SectionLabel } from "@/components/primitives";
import { RitualKnot } from "@/components/ritual-knot";
import { easeToSharp, type Opponent, opponentId, sharpLabel, shortAddress } from "@/lib/game";
import { txUrl } from "@/lib/ritual-chain";
import { type GameActions, type GameState, useGame } from "@/lib/use-game";
import { useArena } from "@/lib/use-arena";
import { cn } from "@/lib/utils";

const SUBMIT_FEE = "0.001 RITUAL";

/** Best-effort human-readable message from a viem/wallet error. */
function errMessage(e: unknown): string {
  if (e && typeof e === "object") {
    const err = e as { shortMessage?: string; message?: string };
    if (err.shortMessage) return err.shortMessage;
    if (err.message) return err.message.split("\n")[0];
  }
  return "Transaction failed.";
}

type Arena = ReturnType<typeof useArena>;

// ── Reusable flip faces ──────────────────────────────────────────
// The card is portrait/landscape but the knot mark is square, so the emerald
// lives on the card itself (not the square SVG bg) — the whole face is one
// uniform color with the centered knot on it. (logo bg === card bg)
function KnotFace() {
  return (
    <div
      className="clip relative h-full w-full overflow-hidden border border-ritual-glow bg-ritual-green"
      style={{ boxShadow: "0 0 34px rgba(47,208,138,.3)" }}
    >
      <RitualKnot color="var(--color-bone)" className="h-full w-full" />
    </div>
  );
}

function OpponentCardFace({ opp, sharp }: { opp: Opponent; sharp: number }) {
  const { band, pct } = sharpLabel(sharp);
  return (
    <div
      className="clip relative h-full w-full overflow-hidden border border-ritual-glow bg-carbon"
      style={{ boxShadow: "0 0 34px rgba(47,208,138,.28)" }}
    >
      <img src={opp.img} alt={opp.name} className="absolute inset-0 h-full w-full object-cover" />
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg,rgba(7,11,9,.05) 38%,rgba(7,11,9,.94))" }}
      />
      <div className="absolute left-[11px] top-[11px] h-3.5 w-3.5 border-l-2 border-t-2 border-ritual-glow" />
      <div className="absolute inset-x-0 bottom-0" style={{ padding: "16px 18px" }}>
        <div className="mb-[7px] font-data text-[10px] tracking-[0.22em] text-ritual-glow">
          {band} · SHARPNESS {pct}
        </div>
        <div className="font-display text-[27px] font-bold leading-none tracking-[0.03em]">{opp.name}</div>
        <div className="mt-1 font-body text-[12px] text-bone/[0.62]">{opp.desc}</div>
      </div>
    </div>
  );
}

// ── A · Connect / Landing ────────────────────────────────────────
function ConnectScreen({
  onConnect,
  connecting,
  error,
}: {
  onConnect: () => void;
  connecting: boolean;
  error: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
      <Knot size={148} className="anim-floaty" innerClassName="anim-pulse" animate="draw" />
      <div>
        <div className="mb-2.5 font-data text-[11px] tracking-[0.34em] text-ritual-glow">ONCHAIN ARENA</div>
        <div className="font-display text-[40px] font-bold leading-[0.95] tracking-[0.05em]">
          TIC·TAC
          <br />
          ·TOE
        </div>
        <div className="mx-auto mt-3.5 max-w-[240px] font-body text-[13px] text-bone/60">
          Beat a Ritual team member. Write your win to the chain.
        </div>
      </div>
      <Chip className="text-chrome-1/60">
        <GlowDot />
        Ritual Chain · testnet
      </Chip>
      <div className="flex w-full max-w-[300px] flex-col gap-3">
        <CostButton amount={null} onClick={onConnect}>
          {connecting ? "Connecting…" : "Connect Wallet"}
        </CostButton>
        {error && (
          <div className="flex flex-col gap-1.5">
            <div className="font-body text-[12px]" style={{ color: "var(--color-signal-red)" }}>{error}</div>
            {/no evm wallet|provider not found/i.test(error) && (
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-body text-[12px] text-ritual-glow no-underline"
              >
                Install MetaMask →
              </a>
            )}
          </div>
        )}
        <a
          href="https://faucet.ritualfoundation.org"
          target="_blank"
          rel="noopener noreferrer"
          className="font-body text-[12px] text-bone/55 no-underline"
        >
          Need test tokens? Visit the faucet →
        </a>
      </div>
    </div>
  );
}

// ── B · Lobby ────────────────────────────────────────────────────
function StatCell({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={cn(
        "clip-sm border px-3 py-4",
        highlight ? "border-ritual-glow" : "border-chrome-1/[0.14] bg-carbon/55",
      )}
      style={highlight ? { background: "linear-gradient(180deg,rgba(47,208,138,.12),rgba(47,208,138,.02))" } : undefined}
    >
      <div className={cn("font-data text-[9px] tracking-[0.18em]", highlight ? "text-ritual-glow/80" : "text-chrome-1/55")}>
        {label}
      </div>
      <div className={cn("mt-1.5 font-data text-[24px] font-bold", highlight ? "text-ritual-glow" : "text-bone")}>
        {value}
      </div>
    </div>
  );
}

function LobbyScreen({ arena, actions }: { arena: Arena; actions: GameActions }) {
  return (
    <div className="flex flex-1 flex-col gap-4.5">
      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={() => arena.disconnect()}
          title="Disconnect wallet"
          className="group clip-sm flex flex-1 items-center gap-2 border border-chrome-1/[0.18] bg-carbon/60 px-3 py-2.5 font-data text-[11px] transition-colors hover:border-signal-red/60"
        >
          <GlowDot />
          {arena.address ? shortAddress(arena.address) : "—"}
          <span className="ml-auto text-chrome-1/45 transition-colors group-hover:text-signal-red" aria-hidden>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 3.5V11" />
              <path d="M6.8 7A7.5 7.5 0 1 0 17.2 7" />
            </svg>
          </span>
        </button>
        <Chip className="whitespace-nowrap text-ritual-glow">
          {arena.balanceText} <span className="ml-1.5 text-bone/50">RITUAL</span>
        </Chip>
      </div>

      {!arena.onRitualChain && (
        <button
          type="button"
          onClick={() => arena.switchToRitual()}
          className="clip-sm flex items-center gap-2 border border-[color:var(--color-signal-red)]/60 bg-carbon/50 px-3 py-2 text-left font-data text-[11px]"
          style={{ color: "rgba(229,72,77,.9)" }}
        >
          <i className="block h-1.5 w-1.5 rounded-full" style={{ background: "var(--color-signal-red)" }} />
          Wrong network — tap to switch to Ritual Chain
        </button>
      )}

      <SectionLabel className="mt-1.5">YOUR RECORD</SectionLabel>

      <div className="grid grid-cols-3 gap-2.5">
        <StatCell label="SCORE" value={arena.score.toLocaleString()} />
        <StatCell label="WINS" value={String(arena.wins)} />
        <StatCell label="RANK" value={arena.rank ? `#${arena.rank}` : "—"} highlight />
      </div>

      <div className="flex-1" />

      <div className="clip-sm border border-chrome-1/[0.14] bg-carbon/45 px-[15px] py-[13px] font-body text-[12.5px] leading-[1.5] text-bone/70">
        Entry is free. Beat your opponent, then record the win onchain for{" "}
        <span className="font-data text-ritual-glow">{SUBMIT_FEE}</span> to climb the leaderboard.
      </div>

      <div className="flex flex-col gap-2.5">
        <CostButton amount={null} onClick={actions.enterMatch}>
          Enter Match
        </CostButton>
        <GhostButton onClick={actions.goLeaderboard}>Leaderboard</GhostButton>
      </div>
    </div>
  );
}

// ── C · Opponent Reveal (the signature screen) ───────────────────
function RevealScreen({
  state,
  actions,
  reducedMotion,
}: {
  state: GameState;
  actions: GameActions;
  reducedMotion: boolean;
}) {
  const opp = state.opponent;
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      <SectionLabel centered>YOUR OPPONENT</SectionLabel>

      {state.revealPhase === "drawing" ? (
        <div className="flex flex-col items-center gap-5 py-10">
          <Knot size={140} className="anim-spin" innerClassName="anim-pulse" alt="Drawing opponent" />
          <div className="anim-blink font-data text-[11px] tracking-[0.24em] text-chrome-1/55">
            DRAWING OPPONENT…
          </div>
        </div>
      ) : (
        opp && (
          <FlipCard
            flipped={state.revealFlipped}
            reducedMotion={reducedMotion}
            style={{ width: 258, height: 352 }}
            front={<KnotFace />}
            back={<OpponentCardFace opp={opp} sharp={easeToSharp(state.ease)} />}
          />
        )
      )}

      {state.showBegin && (
        <CostButton
          amount={null}
          onClick={actions.begin}
          className="anim-fade-up !w-[258px] tracking-[0.14em]"
        >
          Begin
        </CostButton>
      )}
    </div>
  );
}

// ── D · Game Board ───────────────────────────────────────────────
function BoardScreen({ state, actions }: { state: GameState; actions: GameActions }) {
  const opp = state.opponent;
  const yourTurn = state.turn === "X" && !state.winLine;
  const moveCount = state.board.filter(Boolean).length;
  const turnText = state.turn === "X" ? "Your move" : opp ? `${opp.name} is thinking` : "Thinking";
  const { band, pct } = sharpLabel(easeToSharp(state.ease));

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* opponent mini-card */}
      <div className="clip-sm flex items-center gap-3 border border-chrome-1/[0.18] bg-carbon/60 px-3 py-2.5">
        {opp && <img src={opp.img} alt={opp.name} className="clip-sm h-10 w-10 object-cover" />}
        <div className="leading-[1.25]">
          <div className="font-display text-[15px] font-semibold">{opp?.name}</div>
          <div className="mt-[3px] font-data text-[9px] text-chrome-1/55">{band} · {pct}</div>
        </div>
        <div className="ml-auto text-right">
          {state.thinking ? (
            <div className="anim-blink font-data text-[11px] text-bone/70">thinking…</div>
          ) : (
            yourTurn && <div className="font-data text-[11px] text-ritual-glow">your move</div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between px-0.5">
        <div className="font-display text-[18px] font-semibold tracking-[0.04em]">{turnText}</div>
        <div className="font-data text-[11px] text-chrome-1/55">MOVE {moveCount}/9</div>
      </div>

      <div className="grid grid-cols-3 gap-[9px]">
        {state.board.map((mark, i) => {
          const isWin = !!state.winLine?.includes(i);
          const locked = !!state.winLine || !!mark || state.turn !== "X";
          return (
            <button
              key={i}
              type="button"
              aria-label={`Board cell ${i + 1}`}
              disabled={locked}
              onClick={() => actions.playCell(i)}
              className="cell-btn"
            >
              {mark && (
                <span
                  className="anim-mark-in"
                  style={{ color: mark === "X" ? "var(--color-ritual-glow)" : "var(--color-bone)", textShadow: "0 0 18px currentColor" }}
                >
                  {mark}
                </span>
              )}
              {isWin && (
                <div
                  className="clip-sm absolute inset-0 border-[1.5px] border-ritual-glow"
                  style={{ boxShadow: "inset 0 0 22px rgba(47,208,138,.55)" }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-0.5 flex justify-center gap-[18px] font-data text-[10px] text-chrome-1/50">
        <span>
          <span className="text-ritual-glow">X</span> you
        </span>
        <span>
          <span className="text-bone">O</span> {opp?.name}
        </span>
      </div>
    </div>
  );
}

// ── E · Result — Win ─────────────────────────────────────────────
function WinScreen({
  state,
  reducedMotion,
  onSubmit,
  onLobby,
}: {
  state: GameState;
  reducedMotion: boolean;
  onSubmit: () => void;
  onLobby: () => void;
}) {
  const opp = state.opponent;
  const score = state.lastScore ?? { base: 100, bonus: 60, total: 160, moves: 3 };
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5">
      <FlipCard
        flipped={state.winFlipped}
        reducedMotion={reducedMotion}
        style={{ width: 258, height: 200 }}
        front={<KnotFace />}
        back={
          <div
            className="clip relative flex h-full w-full flex-col items-center justify-center gap-2 overflow-hidden border border-ritual-glow"
            style={{ background: "linear-gradient(160deg,#184b38,#0a0f0c)", boxShadow: "0 0 40px rgba(47,208,138,.3)" }}
          >
            <div
              className="font-display text-[42px] font-bold tracking-[0.08em] text-ritual-glow"
              style={{ textShadow: "0 0 28px rgba(47,208,138,.6)" }}
            >
              VICTORY
            </div>
            <div className="flex items-center gap-2.5">
              {opp && <img src={opp.img} alt={opp.name} className="clip-sm h-7 w-7 object-cover" />}
              <span className="font-body text-[13px] text-bone/75">You beat {opp?.name}</span>
            </div>
          </div>
        }
      />

      <div className="clip-sm flex w-full max-w-[300px] flex-col gap-2.5 border border-chrome-1/16 bg-carbon/55 px-[18px] py-[15px] font-data text-[13px]">
        <div className="flex justify-between text-bone/70">
          <span>Base</span>
          <span>{score.base}</span>
        </div>
        <div className="flex justify-between text-bone/70">
          <span>Speed bonus · {score.moves} moves</span>
          <span className="text-ritual-glow">+{score.bonus}</span>
        </div>
        <div className="h-px bg-chrome-1/[0.18]" />
        <div className="flex justify-between text-[17px] font-bold">
          <span>Total</span>
          <span className="text-ritual-glow">{score.total}</span>
        </div>
      </div>

      <div className="flex w-full max-w-[300px] flex-col gap-2.5">
        <CostButton amount={SUBMIT_FEE} onClick={onSubmit}>
          Submit Score
        </CostButton>
        <div className="text-center font-body text-[11px] text-chrome-1/50">
          Records this win onchain.
        </div>
        <GhostButton onClick={onLobby}>Back to Lobby</GhostButton>
      </div>
    </div>
  );
}

// ── F · Result — Lose / Draw ─────────────────────────────────────
function LoseScreen({ state, actions }: { state: GameState; actions: GameActions }) {
  const opp = state.opponent;
  const isDraw = state.result === "draw";
  const word = isDraw ? "Draw" : "Defeat";
  const msg = isDraw
    ? "A stalemate writes nothing onchain. Play again and force the win."
    : "Only wins touch the chain. Play again and take the match.";
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5.5 text-center">
      <div className="relative h-[150px] w-[150px]">
        {opp && (
          <img
            src={opp.img}
            alt={opp.name}
            className="clip h-full w-full border border-chrome-1/20 object-cover"
            style={{ filter: "grayscale(.55) brightness(.7)" }}
          />
        )}
        <div className="clip absolute inset-0" style={{ boxShadow: "inset 0 0 40px rgba(7,11,9,.7)" }} />
      </div>
      <div>
        <div className="font-display text-[38px] font-bold tracking-[0.06em] text-bone">{word}</div>
        <div className="mx-auto mt-3 h-0.5 w-[54px] opacity-70" style={{ background: "var(--color-signal-red)" }} />
      </div>
      <div className="inline-flex items-center gap-2 font-data text-[11px]" style={{ color: "rgba(229,72,77,.85)" }}>
        <i className="block h-1.5 w-1.5 rounded-full" style={{ background: "var(--color-signal-red)" }} />
        No score this round
      </div>
      <div className="max-w-[250px] font-body text-[13px] text-bone/65">{msg}</div>
      <div className="flex w-full max-w-[300px] flex-col gap-2.5">
        <CostButton amount={null} onClick={actions.enterMatch}>
          Play Again
        </CostButton>
        <GhostButton onClick={actions.goLobby}>Back to Lobby</GhostButton>
      </div>
    </div>
  );
}

// ── G · Submitting (pending → success / error) ───────────────────
function SubmittingScreen({
  state,
  onRetry,
  onLeaderboard,
  onLobby,
}: {
  state: GameState;
  onRetry: () => void;
  onLeaderboard: () => void;
  onLobby: () => void;
}) {
  const opp = state.opponent;
  const score = state.lastScore ?? { base: 100, bonus: 60, total: 160, moves: 3 };
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5.5 text-center">
      {state.submitStatus === "pending" && (
        <>
          <Knot size={138} className="anim-spin" innerClassName="anim-pulse" alt="Pending transaction" />
          <div className="font-display text-[18px] font-semibold tracking-[0.04em]">
            {state.txHash ? "Confirming onchain…" : "Awaiting wallet signature…"}
          </div>
          <Chip className="text-chrome-1/55">
            submitScore(&quot;{opp?.name}&quot;, {score.moves}) · {SUBMIT_FEE}
          </Chip>
          {state.txHash && (
            <a
              href={txUrl(state.txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-body text-[12px] text-ritual-glow no-underline"
            >
              tx {shortAddress(state.txHash)} →
            </a>
          )}
        </>
      )}

      {state.submitStatus === "success" && (
        <div className="anim-fade-up flex flex-col items-center gap-5.5">
          <div
            className="clip relative flex h-[120px] w-[120px] items-center justify-center border border-ritual-glow"
            style={{ background: "linear-gradient(160deg,rgba(26,107,78,.4),rgba(7,11,9,.9))", boxShadow: "0 0 36px rgba(47,208,138,.3)" }}
          >
            <div
              style={{
                width: 42,
                height: 22,
                borderLeft: "4px solid var(--color-ritual-glow)",
                borderBottom: "4px solid var(--color-ritual-glow)",
                transform: "rotate(-45deg)",
                marginTop: -8,
              }}
            />
          </div>
          <div>
            <div className="font-display text-[24px] font-bold tracking-[0.04em] text-ritual-glow">Score recorded</div>
            <div className="mt-1.5 font-body text-[13px] text-bone/65">
              +{score.total} points written to the chain.
            </div>
          </div>
          <Chip className="text-chrome-1/60">tx {shortAddress(state.txHash)}</Chip>
          <a
            href={txUrl(state.txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-body text-[12px] text-ritual-glow no-underline"
          >
            View on Explorer →
          </a>
          <div className="flex w-full max-w-[300px] flex-col gap-2.5">
            <CostButton amount={null} onClick={onLeaderboard}>
              View Leaderboard
            </CostButton>
            <GhostButton onClick={onLobby}>Back to Lobby</GhostButton>
          </div>
        </div>
      )}

      {state.submitStatus === "error" && (
        <div className="flex flex-col items-center gap-5 text-center">
          <div
            className="flex h-[110px] w-[110px] items-center justify-center clip border"
            style={{ borderColor: "rgba(229,72,77,.6)", background: "rgba(229,72,77,.08)" }}
          >
            <span className="font-display text-[44px] font-bold" style={{ color: "var(--color-signal-red)" }}>
              ✕
            </span>
          </div>
          <div>
            <div className="font-display text-[20px] font-bold tracking-[0.04em] text-bone">Submission failed</div>
            <div className="mx-auto mt-2 max-w-[270px] font-body text-[12.5px] text-bone/65">
              {state.submitError}
            </div>
          </div>
          <div className="flex w-full max-w-[300px] flex-col gap-2.5">
            <CostButton amount={SUBMIT_FEE} onClick={onRetry}>
              Try Again
            </CostButton>
            <GhostButton onClick={onLobby}>Back to Lobby</GhostButton>
          </div>
        </div>
      )}
    </div>
  );
}

// ── H · Leaderboard ──────────────────────────────────────────────
function LeaderboardScreen({ arena, actions }: { arena: Arena; actions: GameActions }) {
  const rows = arena.leaderboard;
  return (
    <div className="flex flex-1 flex-col gap-3.5">
      <div>
        <div className="font-display text-[26px] font-bold tracking-[0.04em]">Leaderboard</div>
        <div className="mt-1 font-body text-[11.5px] text-chrome-1/55">
          Ranked by total score · verifiable on the Explorer
        </div>
      </div>

      <div className="flex items-center gap-2 px-1 py-[5px] font-data text-[9px] tracking-[0.16em] text-chrome-1/45">
        <span className="w-[30px]">RANK</span>
        <span className="flex-1">WALLET</span>
        <span className="w-[42px] text-right">WINS</span>
        <span className="w-[64px] text-right">SCORE</span>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-6 text-center font-body text-[13px] text-bone/55">
          {arena.leaderboardLoading
            ? "Loading standings…"
            : "No wins recorded yet. Beat an opponent and submit the first score."}
        </div>
      ) : (
        <div className="flex flex-col gap-[7px]">
          {rows.map((row) => (
            <div
              key={row.address}
              className="clip-sm flex items-center gap-2 px-3 py-[11px]"
              style={
                row.me
                  ? {
                      border: "1px solid var(--color-ritual-glow)",
                      background: "linear-gradient(90deg,rgba(47,208,138,.14),rgba(47,208,138,.02))",
                      boxShadow: "0 0 20px rgba(47,208,138,.15)",
                    }
                  : { border: "1px solid rgba(184,199,191,.1)", background: "rgba(16,26,21,.5)" }
              }
            >
              <span className="w-[30px] font-data text-[13px] font-bold text-ritual-glow">
                {String(row.rank).padStart(2, "0")}
              </span>
              <span className="flex flex-1 items-center gap-[7px] font-data text-[12px] text-bone">
                {shortAddress(row.address)}
                {row.me && (
                  <span className="clip-sm border border-ritual-glow px-[5px] py-0.5 font-display text-[8px] font-bold tracking-[0.1em] text-ritual-glow">
                    YOU
                  </span>
                )}
              </span>
              <span className="w-[42px] text-right font-data text-[12px] text-bone/70">{row.wins}</span>
              <span className="w-[64px] text-right font-data text-[13px] font-bold text-bone">
                {row.score.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex-1" />
      <div className="text-center font-body text-[11px] text-chrome-1/45">
        Standings read directly from the contract — anyone can verify on the Explorer.
      </div>
      <GhostButton onClick={actions.goLobby}>Back to Lobby</GhostButton>
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────
export function Game() {
  const { state, actions, reducedMotion } = useGame();
  const arena = useArena();
  const [connectError, setConnectError] = useState("");

  const { goConnect, goLobby } = actions;
  const { isConnected } = arena;

  // Mirror wallet connection into the screen flow.
  useEffect(() => {
    if (isConnected) goLobby();
    else goConnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run only on connect change
  }, [isConnected]);

  const onConnect = useCallback(async () => {
    setConnectError("");
    try {
      await arena.connect();
    } catch (e) {
      const msg = errMessage(e);
      setConnectError(
        /provider not found|no .*wallet|not found/i.test(msg)
          ? "No EVM wallet detected. Install MetaMask, unlock it, then refresh."
          : msg,
      );
    }
  }, [arena]);

  const submitNow = useCallback(async () => {
    const opp = state.opponent;
    if (!opp) return;
    actions.startSubmitting();
    if (!arena.contractReady) {
      actions.submitFailed("Arena contract isn't configured yet (set NEXT_PUBLIC_ARENA_ADDRESS).");
      return;
    }
    try {
      if (!arena.onRitualChain) await arena.switchToRitual();
      const moves = state.lastScore?.moves ?? Math.max(3, state.playerMoves);
      const hash = await arena.submit(opponentId(opp), moves);
      actions.setTxHash(hash);
      await arena.waitForReceipt(hash);
      actions.submitSucceeded();
      arena.refresh();
    } catch (e) {
      const msg = errMessage(e);
      // Some wallets (e.g. Rabby on a chain it doesn't yet flag as EIP-1559)
      // build a legacy type-0 tx and ignore the 1559 fields we pass; Ritual
      // rejects those. Give an actionable message instead of the raw RPC error.
      actions.submitFailed(
        /transaction type not supported|legacy|type 0|type-0/i.test(msg)
          ? "Your wallet sent a legacy transaction, which Ritual Chain rejects. In your wallet, remove and re-add Ritual Chain (so it detects EIP-1559), or use MetaMask — then Try Again."
          : msg,
      );
    }
  }, [arena, actions, state.opponent, state.lastScore, state.playerMoves]);

  const label =
    state.screen === "connect" ? "RITUAL TESTNET" : `ROUND · ${String(arena.wins + 1).padStart(2, "0")}`;

  // The win-ease slider is relevant while setting up / playing a match.
  const showSlider = state.screen === "lobby" || state.screen === "reveal" || state.screen === "board";

  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-3.5 py-5"
      style={{ background: "radial-gradient(120% 90% at 50% 0%, #0c1712 0%, var(--color-void) 60%)" }}
    >
      {/* atmosphere: circuit grid + faint knot watermark + vignette (brief §5.5) */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(47,208,138,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(47,208,138,.05) 1px,transparent 1px)",
          backgroundSize: "46px 46px",
          maskImage: "radial-gradient(100% 80% at 50% 40%,#000 40%,transparent 85%)",
          WebkitMaskImage: "radial-gradient(100% 80% at 50% 40%,#000 40%,transparent 85%)",
        }}
      />
      <RitualKnot
        decorative
        size={560}
        color="var(--color-bone)"
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ opacity: 0.05, mixBlendMode: "screen" }}
      />
      <div className="pointer-events-none absolute inset-0" style={{ boxShadow: "inset 0 0 220px rgba(0,0,0,.7)" }} />

      <div className="relative z-[1] flex w-full max-w-[470px] flex-col">
        <Header />
        <HudFrame
          label={label}
          rightRail={showSlider ? <DifficultySlider value={state.ease} onChange={actions.setEase} /> : undefined}
        >
          {state.screen === "connect" && (
            <ConnectScreen onConnect={onConnect} connecting={arena.isConnecting} error={connectError} />
          )}
          {state.screen === "lobby" && <LobbyScreen arena={arena} actions={actions} />}
          {state.screen === "reveal" && (
            <RevealScreen state={state} actions={actions} reducedMotion={reducedMotion} />
          )}
          {state.screen === "board" && <BoardScreen state={state} actions={actions} />}
          {state.screen === "win" && (
            <WinScreen state={state} reducedMotion={reducedMotion} onSubmit={submitNow} onLobby={actions.goLobby} />
          )}
          {state.screen === "lose" && <LoseScreen state={state} actions={actions} />}
          {state.screen === "submitting" && (
            <SubmittingScreen
              state={state}
              onRetry={submitNow}
              onLeaderboard={actions.goLeaderboard}
              onLobby={actions.goLobby}
            />
          )}
          {state.screen === "leaderboard" && <LeaderboardScreen arena={arena} actions={actions} />}
        </HudFrame>
      </div>
    </main>
  );
}
