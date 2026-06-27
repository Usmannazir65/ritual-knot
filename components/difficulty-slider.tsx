"use client";

import { useCallback, useRef } from "react";
import { easeToSharp, sharpLabel } from "@/lib/game";
import { cn } from "@/lib/utils";

const TRACK_H = 150;

/**
 * Vertical "win-ease" slider that lives on the HUD's right rail. Full (top) =
 * easiest, empty (bottom) = hardest. Drives the opponent's sharpness.
 * Drag, click, or arrow-key to set; reports the resulting band for a11y.
 */
export function DifficultySlider({
  value,
  onChange,
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  className?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const fill = Math.round(Math.min(1, Math.max(0, value)) * 100);
  const { band, pct } = sharpLabel(easeToSharp(value));

  const setFromY = useCallback(
    (clientY: number) => {
      const el = trackRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const v = 1 - (clientY - r.top) / r.height; // top = 1 (easy)
      onChange(Math.min(1, Math.max(0, Math.round(v * 100) / 100)));
    },
    [onChange],
  );

  return (
    <div className={cn("flex select-none flex-col items-center gap-1.5", className)}>
      <span className="font-data text-[8px] tracking-[0.18em] text-ritual-glow/80">EASY</span>
      <div
        ref={trackRef}
        role="slider"
        aria-label="Win-ease level"
        aria-orientation="vertical"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={fill}
        aria-valuetext={`${band} · ${pct} sharpness`}
        tabIndex={0}
        className="relative w-5 cursor-pointer touch-none outline-none"
        style={{ height: TRACK_H }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          setFromY(e.clientY);
        }}
        onPointerMove={(e) => {
          if (e.buttons === 1) setFromY(e.clientY);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp" || e.key === "ArrowRight") {
            onChange(Math.min(1, Math.round((value + 0.05) * 100) / 100));
            e.preventDefault();
          } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
            onChange(Math.max(0, Math.round((value - 0.05) * 100) / 100));
            e.preventDefault();
          }
        }}
      >
        {/* rail */}
        <div className="absolute left-1/2 top-0 h-full w-[3px] -translate-x-1/2 rounded-full bg-chrome-1/20" />
        {/* ticks — echo the old stacked squares */}
        {[0, 1, 2, 3].map((i) => (
          <i
            key={i}
            className="absolute left-1/2 h-[3px] w-[3px] -translate-x-1/2 -translate-y-1/2 bg-chrome-1/30"
            style={{ top: `${(i / 3) * 100}%` }}
          />
        ))}
        {/* fill */}
        <div
          className="absolute bottom-0 left-1/2 w-[3px] -translate-x-1/2 rounded-full bg-ritual-glow"
          style={{ height: `${fill}%`, boxShadow: "0 0 8px var(--color-ritual-glow)" }}
        />
        {/* thumb */}
        <div
          className="absolute left-1/2 h-3 w-3 -translate-x-1/2 translate-y-1/2 rotate-45 border border-ritual-glow bg-carbon"
          style={{ bottom: `${fill}%`, boxShadow: "0 0 10px var(--color-ritual-glow)" }}
        />
      </div>
      <span className="font-data text-[8px] tracking-[0.18em] text-chrome-1/55">HARD</span>
    </div>
  );
}
