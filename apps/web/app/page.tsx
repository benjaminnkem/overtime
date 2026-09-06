"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { createRoom } from "@/lib/api";
import { storeHostToken } from "@/lib/host-token";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { LiveDot } from "@/components/live-dot";

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
    <div className="flex flex-1 items-center justify-center px-4 py-16 sm:py-24">
      <div className="w-full max-w-md animate-rise-in">
        <div className="mb-8 flex flex-col items-center gap-4 text-center sm:items-start sm:text-left">
          <div className="flex items-center gap-2">
            <LiveDot />
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
              Weekly · Live · Real stakes
            </span>
          </div>
          <h1 className="font-display text-5xl font-bold tracking-tight text-paper sm:text-6xl">
            OVER<span className="text-lime">TIME</span>
          </h1>
          <p className="max-w-sm text-sm text-muted">
            Your group chat&apos;s trivia debates, as a weekly live event with real
            stakes.
          </p>
        </div>

        <Card className="p-6 sm:p-8">
          <h2 className="font-display text-lg font-semibold text-paper">
            Create a Room
          </h2>
          <p className="mt-1 text-sm text-muted">Stand up a live trivia room for your group.</p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <Field>
              Your wallet address (host)
              <Input
                required
                value={hostId}
                onChange={(e) => setHostId(e.target.value)}
                placeholder="NQ..."
              />
            </Field>

            <Field>
              Room title
              <Input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Friday Night Trivia"
              />
            </Field>

            <Field>
              Topic (optional)
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="General knowledge"
              />
            </Field>

            {error && <p className="text-sm text-coral">{error.message}</p>}

            <Button type="submit" disabled={isPending} className="mt-2 w-full">
              {isPending ? "Creating…" : "Create Room"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
