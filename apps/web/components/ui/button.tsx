import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "md" | "sm";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-display font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.97]";

const variants: Record<Variant, string> = {
  primary:
    "bg-lime text-lime-ink shadow-[0_0_0_1px_rgba(215,255,63,0.4),0_8px_24px_-8px_rgba(215,255,63,0.5)] hover:brightness-110",
  secondary: "border border-border bg-surface text-paper hover:border-lime/40 hover:bg-surface-2",
  danger: "bg-coral text-paper hover:brightness-110",
  ghost: "text-muted hover:text-paper",
};

const sizes: Record<Size, string> = {
  md: "px-6 py-3.5 text-base min-h-12",
  sm: "px-4 py-2 text-sm min-h-10",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}
