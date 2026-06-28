import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/hud";
import { SectionLabel } from "@/components/primitives";
import { RitualKnot } from "@/components/ritual-knot";
import { OPPONENTS } from "@/lib/game";

export const metadata: Metadata = {
  title: "How to Play · RitualKnot",
  description:
    "What RitualKnot is, how to play step by step, what you earn for winning, and the Ritual team roster you'll face. Onchain tic-tac-toe on the Ritual testnet.",
};

const STEPS: { n: string; t: string; d: string }[] = [
  { n: "01", t: "Connect your wallet", d: "Point any EVM wallet (MetaMask works best) at Ritual Chain — the app prompts to add network 1979 for you." },
  { n: "02", t: "Get test tokens", d: "Grab free RITUAL from the faucet. Testnet only, no real value." },
  { n: "03", t: "Enter a match — free", d: "No entry fee. The endless knot spins as your opponent is drawn." },
  { n: "04", t: "Meet your opponent", d: "The knot flips to reveal a random Ritual team member. Tune the win-ease slider to set the challenge." },
  { n: "05", t: "Play & win", d: "Standard 3×3 tic-tac-toe — you're X, they're O. Close it out in fewer moves for a bigger bonus." },
  { n: "06", t: "Submit onchain", d: "Record your win for 0.001 RITUAL. Your score and win count update on the leaderboard." },
];

const REWARDS: { t: string; d: string }[] = [
  { t: "Permanent proof", d: "Your win is written onchain — verifiable by anyone on the Explorer." },
  { t: "Points", d: "100 base + a speed bonus. The fewer moves to win, the higher you score." },
  { t: "Leaderboard", d: "Your wallet climbs a global ranking read straight from the contract." },
];

function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`clip relative border border-chrome-1/15 bg-carbon/50 p-5 ${className ?? ""}`}
      style={{ backdropFilter: "blur(6px)" }}
    >
      <div
        className="absolute left-[18px] right-[12px] top-0 h-px"
        style={{ background: "linear-gradient(90deg,transparent,rgba(234,242,236,.22),transparent)" }}
      />
      {children}
    </div>
  );
}

export default function HowToPlayPage() {
  return (
    <main
      className="relative min-h-screen overflow-hidden px-3.5 py-5"
      style={{ background: "radial-gradient(120% 70% at 50% 0%, #0c1712 0%, var(--color-void) 55%)" }}
    >
      {/* atmosphere */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(47,208,138,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(47,208,138,.05) 1px,transparent 1px)",
          backgroundSize: "46px 46px",
          maskImage: "radial-gradient(100% 60% at 50% 30%,#000 35%,transparent 80%)",
          WebkitMaskImage: "radial-gradient(100% 60% at 50% 30%,#000 35%,transparent 80%)",
        }}
      />
      <RitualKnot
        decorative
        size={620}
        color="var(--color-bone)"
        className="pointer-events-none fixed left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2"
        style={{ opacity: 0.04, mixBlendMode: "screen" }}
      />

      <div className="relative z-[1] mx-auto flex w-full max-w-[560px] flex-col gap-4">
        <Header />

        {/* hero */}
        <Panel className="flex flex-col items-center gap-4 text-center">
          <RitualKnot
            color="var(--color-bone)"
            background="var(--color-ritual-green)"
            className="clip h-[110px] w-[110px] border border-ritual-glow"
          />
          <div>
            <div className="mb-2 font-data text-[10px] tracking-[0.34em] text-ritual-glow">ONCHAIN ARENA</div>
            <h1 className="font-display text-[30px] font-bold leading-none tracking-[0.04em]">How to Play</h1>
          </div>
          <p className="max-w-[420px] font-body text-[13px] leading-[1.6] text-bone/70">
            <span className="text-bone">RitualKnot</span> is a fully onchain tic-tac-toe arena on the Ritual
            testnet. Face a randomly drawn Ritual team member, beat them, and write your win to the chain to climb
            a verifiable global leaderboard.
          </p>
        </Panel>

        {/* steps */}
        <Panel>
          <SectionLabel className="mb-4">HOW TO PLAY</SectionLabel>
          <ol className="flex flex-col gap-3.5">
            {STEPS.map((s) => (
              <li key={s.n} className="flex gap-3.5">
                <span className="clip-sm flex h-7 w-7 shrink-0 items-center justify-center border border-ritual-glow/60 bg-ritual-glow/[0.08] font-data text-[12px] font-bold text-ritual-glow">
                  {s.n}
                </span>
                <div>
                  <div className="font-display text-[14px] font-semibold tracking-[0.02em] text-bone">{s.t}</div>
                  <div className="mt-0.5 font-body text-[12.5px] leading-[1.5] text-bone/60">{s.d}</div>
                </div>
              </li>
            ))}
          </ol>
        </Panel>

        {/* rewards */}
        <Panel>
          <SectionLabel className="mb-4">WHAT YOU EARN</SectionLabel>
          <div className="flex flex-col gap-3">
            {REWARDS.map((r) => (
              <div key={r.t} className="flex gap-2.5">
                <i className="mt-1.5 block h-1.5 w-1.5 shrink-0 rotate-45 bg-ritual-glow" />
                <div>
                  <span className="font-display text-[13px] font-semibold text-ritual-glow">{r.t}</span>
                  <span className="font-body text-[12.5px] leading-[1.5] text-bone/65"> — {r.d}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 font-body text-[12px] text-chrome-1/55">
            Only wins touch the chain — losses and draws are never submitted.
          </p>
        </Panel>

        {/* roster */}
        <Panel>
          <SectionLabel className="mb-1">THE ROSTER</SectionLabel>
          <p className="mb-4 font-body text-[12px] text-bone/55">
            Nine Ritual team members. One is drawn at random each match.
          </p>
          <div className="grid grid-cols-3 gap-2.5">
            {OPPONENTS.map((o) => (
              <div
                key={o.name}
                className="clip-sm flex flex-col items-center gap-2 border border-chrome-1/12 bg-carbon/40 p-2.5 text-center"
              >
                <img src={o.img} alt={o.name} className="clip-sm h-14 w-14 object-cover" />
                <div className="leading-tight">
                  <div className="font-display text-[12px] font-semibold text-bone">{o.name}</div>
                  <div className="mt-0.5 font-body text-[10px] text-bone/45">{o.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* disclaimer */}
        <div
          className="clip-sm flex items-start gap-2.5 border px-4 py-3.5"
          style={{ borderColor: "rgba(229,72,77,.4)", background: "rgba(229,72,77,.06)" }}
        >
          <i className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--color-signal-red)" }} />
          <p className="font-body text-[12.5px] leading-[1.5] text-bone/75">
            <span className="font-semibold" style={{ color: "rgba(229,72,77,.95)" }}>
              Always use a burner / testnet wallet.
            </span>{" "}
            RitualKnot runs on the Ritual testnet — no real funds are ever involved.
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-2.5 pt-1">
          <Link href="/" className="btn-cost no-underline">
            Play RitualKnot
          </Link>
          <div className="flex justify-center gap-4 font-body text-[12px] text-bone/55">
            <a href="https://faucet.ritualfoundation.org" target="_blank" rel="noopener noreferrer" className="no-underline hover:text-ritual-glow">
              Faucet →
            </a>
            <a href="https://explorer.ritualfoundation.org" target="_blank" rel="noopener noreferrer" className="no-underline hover:text-ritual-glow">
              Explorer →
            </a>
          </div>
        </div>

        <div className="h-2" />
      </div>
    </main>
  );
}
