import type { HTMLAttributes } from "react";

type Tone = "lime" | "coral" | "neutral";

const tones: Record<Tone, string> = {
  lime: "bg-lime/15 text-lime border-lime/30",
  coral: "bg-coral/15 text-coral border-coral/30",
  neutral: "bg-surface-2 text-muted border-border",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ tone = "neutral", className = "", ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-xs uppercase tracking-wider ${tones[tone]} ${className}`}
      {...props}
    />
  );
}
