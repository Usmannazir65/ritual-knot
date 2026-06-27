import type { CSSProperties, ReactNode } from "react";
import { RitualKnot } from "@/components/ritual-knot";
import { cn } from "@/lib/utils";

// ── Knot ─────────────────────────────────────────────────────────
// The endless-knot logo — the coin we flip and the loading totem for every
// pending transaction. The through-line of the whole UI (brief §1). Renders
// the vector mark (white knot on emerald), so it stays crisp at every size
// and the segments can animate.
export function Knot({
  size,
  className,
  innerClassName,
  style,
  bordered,
  animate = "none",
  alt = "Ritual endless knot",
}: {
  size: number | string;
  className?: string;
  /** Inner layer — lets a transform animation (spin/floaty) on the outer
      compose with a filter animation (pulse) on the inner. */
  innerClassName?: string;
  style?: CSSProperties;
  bordered?: boolean;
  /** "draw" = per-segment grid-lock reveal on mount. */
  animate?: "none" | "draw";
  alt?: string;
}) {
  const dim = typeof size === "number" ? `${size}px` : size;
  return (
    <div className={cn(className)} style={{ width: dim, height: dim, ...style }}>
      <div className={cn("h-full w-full", innerClassName)}>
        <RitualKnot
          size="100%"
          color="var(--color-bone)"
          background="var(--color-ritual-green)"
          animate={animate}
          title={alt}
          className={cn("clip h-full w-full", bordered && "border border-ritual-glow")}
        />
      </div>
    </div>
  );
}

// ── FlipCard ─────────────────────────────────────────────────────
// The reveal primitive: a two-faced card whose back is always the knot. A 3D
// Y-axis rotation normally; a quick cross-fade under prefers-reduced-motion.
export function FlipCard({
  flipped,
  front,
  back,
  reducedMotion,
  className,
  style,
}: {
  flipped: boolean;
  front: ReactNode;
  back: ReactNode;
  reducedMotion: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  if (reducedMotion) {
    return (
      <div className={cn("flip-wrap", className)} style={style}>
        <div className="flip-inner">
          <div
            className="flip-face"
            style={{ opacity: flipped ? 0 : 1, transition: "opacity .3s ease", backfaceVisibility: "visible" }}
          >
            {front}
          </div>
          <div
            className="flip-face"
            style={{
              opacity: flipped ? 1 : 0,
              transition: "opacity .3s ease",
              backfaceVisibility: "visible",
              transform: "none",
            }}
          >
            {back}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className={cn("flip-wrap", className)} style={style}>
      <div className={cn("flip-inner", flipped && "flipped")}>
        <div className="flip-face">{front}</div>
        <div className="flip-face flip-back">{back}</div>
      </div>
    </div>
  );
}

// ── Buttons ──────────────────────────────────────────────────────
export function CostButton({
  children,
  amount = "0.001 RITUAL",
  onClick,
  className,
}: {
  children: ReactNode;
  /** Token amount shown inline; pass null to omit (e.g. "Begin"). */
  amount?: string | null;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button type="button" onClick={onClick} className={cn("btn-cost", className)}>
      {children}
      {amount && <span className="btn-cost__amount">· {amount}</span>}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button type="button" onClick={onClick} className={cn("btn-ghost", className)}>
      {children}
    </button>
  );
}

// ── Small glyphs / chips ─────────────────────────────────────────

/** Glowing status dot — the "live network" indicator. */
export function GlowDot({ className }: { className?: string }) {
  return (
    <i
      className={cn("block h-1.5 w-1.5 rounded-full bg-ritual-glow", className)}
      style={{ boxShadow: "0 0 8px var(--color-ritual-glow)" }}
    />
  );
}

/** A small rotated square — the section-marker diamond. */
export function Diamond() {
  return <i className="block h-1.5 w-1.5 rotate-45 bg-ritual-glow" />;
}

/** Section title flanked by diamond glyphs (brief §5.4). */
export function SectionLabel({
  children,
  centered,
  className,
}: {
  children: ReactNode;
  centered?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", centered && "justify-center", className)}>
      <Diamond />
      <span
        className="font-data text-ritual-glow"
        style={{ fontSize: centered ? 11 : 10, letterSpacing: centered ? "0.34em" : "0.28em" }}
      >
        {children}
      </span>
      {centered && <Diamond />}
    </div>
  );
}

/** Mono chip with a notched border — wallet / network readouts (brief §8). */
export function Chip({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={cn(
        "clip-sm flex items-center gap-2 border border-chrome-1/[0.18] bg-carbon/60 px-3 py-2.5 font-data text-[11px]",
        className,
      )}
      style={style}
    >
      {children}
    </div>
  );
}
