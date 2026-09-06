export function LiveDot({ className = "" }: { className?: string }) {
  return (
    <span className={`relative flex h-2 w-2 ${className}`}>
      <span className="absolute inline-flex h-full w-full animate-pulse-dot rounded-full bg-coral" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-coral" />
    </span>
  );
}
