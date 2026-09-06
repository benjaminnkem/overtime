"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { createRoom } from "@/lib/api";
import { storeHostToken } from "@/lib/host-token";

export default function Home() {
  const router = useRouter();
  const [hostId, setHostId] = useState("");
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");

  const { mutate, isPending, error } = useMutation({
    mutationFn: createRoom,
    onSuccess: ({ roomId, hostToken }) => {
      storeHostToken(roomId, hostToken);
      router.push(`/rooms/${roomId}`);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutate({ hostId, title, topic: topic || undefined });
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-black">
      <main className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950">
        <h1 className="text-2xl font-bold tracking-tight">Overtime</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Create a live trivia Room for your group.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Your wallet address (host)
            <input
              required
              value={hostId}
              onChange={(e) => setHostId(e.target.value)}
              placeholder="NQ..."
              className="rounded-lg border border-black/10 bg-transparent px-3 py-2 text-base outline-none focus:border-black dark:border-white/15 dark:focus:border-white"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium">
            Room title
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Friday Night Trivia"
              className="rounded-lg border border-black/10 bg-transparent px-3 py-2 text-base outline-none focus:border-black dark:border-white/15 dark:focus:border-white"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium">
            Topic (optional)
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="General knowledge"
              className="rounded-lg border border-black/10 bg-transparent px-3 py-2 text-base outline-none focus:border-black dark:border-white/15 dark:focus:border-white"
            />
          </label>

          {error && <p className="text-sm text-red-600">{error.message}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="mt-2 rounded-full bg-black px-5 py-3 text-base font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {isPending ? "Creating…" : "Create Room"}
          </button>
        </form>
      </main>
    </div>
  );
}
