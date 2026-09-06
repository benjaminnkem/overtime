"use client";

import { AnimatePresence, motion } from "framer-motion";

export interface LeaderboardEntry {
  userId: string;
  rank: number;
  detail: string;
}

export function Leaderboard({
  entries,
  emptyLabel,
}: {
  entries: LeaderboardEntry[];
  emptyLabel: string;
}) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted">{emptyLabel}</p>;
  }

  return (
    <ol className="flex flex-col gap-2">
      <AnimatePresence initial={false}>
        {entries.map((entry) => (
          <motion.li
            key={entry.userId}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 40 }}
            className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
              entry.rank === 1
                ? "border-lime/50 bg-lime/10"
                : "border-border bg-surface"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="w-7 font-mono text-lg font-bold tabular-nums text-muted">
                {String(entry.rank).padStart(2, "0")}
              </span>
              <span className="font-display text-sm text-paper">{entry.userId}</span>
            </div>
            <span className="font-mono text-sm text-muted">{entry.detail}</span>
          </motion.li>
        ))}
      </AnimatePresence>
    </ol>
  );
}
