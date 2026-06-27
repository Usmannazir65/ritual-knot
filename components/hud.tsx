import type { ReactNode } from "react";
import { GlowDot, Knot } from "@/components/primitives";

// ── App header ───────────────────────────────────────────────────
export function Header() {
  return (
    <div className="flex items-center gap-3 px-1 pb-3.5 pt-0.5">
      <Knot
        size={34}
        className="clip-sm shrink-0"
        style={{ boxShadow: "0 0 14px rgba(47,208,138,.35)" }}
      />
      <div className="leading-none">
        <div className="font-display text-[15px] font-bold tracking-[0.3em] text-bone">RITUAL</div>
        <div className="mt-1 font-data text-[9px] tracking-[0.28em] text-ritual-glow">
          TIC·TAC·TOE ARENA
        </div>
      </div>
      <div className="ml-auto flex items-center gap-2 font-data text-[10px] text-chrome-1/65">
        <GlowDot />
        Ritual Chain
      </div>
    </div>
  );
}

// ── HUD Panel ────────────────────────────────────────────────────
// The notched, chrome-bordered glass frame from the reference, recolored to
// Ritual's palette. Every surface is one (brief §5.4, §8). Carries the
// decorative edge accents: top inner highlight, L-shaped corner brackets, a
// vertical column of stacked squares, and a rotated sidebar label.
export function HudFrame({
  children,
  label = "RITUAL TESTNET",
  rightRail,
}: {
  children: ReactNode;
  label?: string;
  /** Replaces the default stacked-squares decoration (e.g. a difficulty slider). */
  rightRail?: ReactNode;
}) {
  return (
    <div
      className="clip relative flex p-px"
      style={{
        background: "linear-gradient(135deg, var(--color-chrome-1), var(--color-chrome-2))",
        minHeight: 620,
      }}
    >
      <div
        className="clip relative flex flex-1 flex-col overflow-hidden"
        style={{
          background: "linear-gradient(160deg, rgba(16,26,21,.95), rgba(7,11,9,.97))",
          backdropFilter: "blur(8px)",
          padding: "26px 30px 26px 32px",
        }}
      >
        {/* top inner highlight */}
        <div
          className="absolute left-[22px] right-[14px] top-0 h-px"
          style={{ background: "linear-gradient(90deg,transparent,rgba(234,242,236,.28),transparent)" }}
        />
        {/* L-shaped corner brackets */}
        <div className="absolute right-[9px] top-[9px] h-4 w-4 border-r-2 border-t-2 border-ritual-glow opacity-75" />
        <div className="absolute bottom-[9px] left-[9px] h-4 w-4 border-b-2 border-l-2 border-ritual-glow opacity-75" />
        {/* right rail: a difficulty slider when provided, else the stacked squares */}
        {rightRail ? (
          <div className="absolute right-1 top-1/2 -translate-y-1/2">{rightRail}</div>
        ) : (
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 flex-col gap-[5px]">
            <i className="h-1.5 w-1.5 bg-ritual-glow" style={{ boxShadow: "0 0 6px var(--color-ritual-glow)" }} />
            <i className="h-1.5 w-1.5 bg-chrome-1/40" />
            <i className="h-1.5 w-1.5 bg-chrome-1/25" />
            <i className="h-1.5 w-1.5 bg-chrome-1/[0.15]" />
          </div>
        )}
        {/* rotated sidebar label — always something true (brief §5.4) */}
        <div
          className="absolute left-[7px] top-1/2 font-data text-[9px] tracking-[0.4em] text-chrome-1/40"
          style={{ transform: "translateY(-50%) rotate(180deg)", writingMode: "vertical-rl" }}
        >
          {label}
        </div>

        {children}
      </div>
    </div>
  );
}
