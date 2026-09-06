import type { InputHTMLAttributes, LabelHTMLAttributes } from "react";

export function Field({ className = "", ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={`flex flex-col gap-1.5 font-mono text-xs uppercase tracking-wider text-muted ${className}`}
      {...props}
    />
  );
}

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`rounded-xl border border-border bg-surface px-4 py-3 font-display text-base normal-case tracking-normal text-paper outline-none placeholder:text-muted/60 focus:border-lime read-only:opacity-70 ${className}`}
      {...props}
    />
  );
}
