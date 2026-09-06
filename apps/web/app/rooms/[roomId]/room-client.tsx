"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createSession, getRoom, getRoomLeaderboard, getRoomSessions } from "@/lib/api";
import { getStoredHostToken } from "@/lib/host-token";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field, Input } from "@/components/ui/field";
import { Leaderboard } from "@/components/leaderboard";

interface QuestionDraft {
  text: string;
  options: string[];
  correctOption: string;
  timeLimitSec: number;
}

function emptyQuestion(): QuestionDraft {
  return { text: "", options: ["", ""], correctOption: "", timeLimitSec: 15 };
}

const STATUS_TONE = {
  scheduled: "neutral",
  settled: "lime",
  refunded: "coral",
} as const;

export function RoomClient({ roomId }: { roomId: string }) {
  const queryClient = useQueryClient();

  const { data: room } = useQuery({
    queryKey: ["room", roomId],
    queryFn: () => getRoom(roomId),
  });

  const { data: leaderboard } = useQuery({
    queryKey: ["room-leaderboard", roomId],
    queryFn: () => getRoomLeaderboard(roomId),
    select: (res) => res.cumulative,
  });

  const { data: sessions } = useQuery({
    queryKey: ["room-sessions", roomId],
    queryFn: () => getRoomSessions(roomId),
  });

  const [scheduledAt, setScheduledAt] = useState("");
  const [entryFee, setEntryFee] = useState("5");
  const [minEntries, setMinEntries] = useState("3");
  const [questions, setQuestions] = useState<QuestionDraft[]>([emptyQuestion()]);
  const [hostToken, setHostToken] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from a browser-only store, not a derived-state loop
    setHostToken(getStoredHostToken(roomId));
  }, [roomId]);

  const { mutate, isPending, error } = useMutation({
    mutationFn: () => {
      if (!hostToken)
        throw new Error("Only the host who created this room can schedule sessions");
      return createSession(
        roomId,
        {
          scheduledAt: new Date(scheduledAt).toISOString(),
          entryFee: Number(entryFee),
          minEntries: Number(minEntries),
          questions: questions.map((q) => ({
            text: q.text,
            options: q.options.filter(Boolean),
            correctOption: q.correctOption,
            timeLimitSec: q.timeLimitSec,
          })),
        },
        hostToken,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room-sessions", roomId] });
      setQuestions([emptyQuestion()]);
    },
  });

  function updateQuestion(index: number, patch: Partial<QuestionDraft>) {
    setQuestions((qs) => qs.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  }

  function updateOption(qIndex: number, oIndex: number, value: string) {
    setQuestions((qs) =>
      qs.map((q, i) =>
        i === qIndex
          ? { ...q, options: q.options.map((o, j) => (j === oIndex ? value : o)) }
          : q,
      ),
    );
  }

  const isValid =
    scheduledAt &&
    Number(entryFee) > 0 &&
    questions.length > 0 &&
    questions.every(
      (q) => q.text && q.correctOption && q.options.filter(Boolean).includes(q.correctOption),
    );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutate();
  }

  const leaderboardEntries = (leaderboard ?? []).map((entry, i) => ({
    userId: entry.userId,
    rank: i + 1,
    detail: `${entry.totalScore} pts · ${entry.sessionsPlayed} sessions`,
  }));

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10 sm:py-14">
      <header className="animate-rise-in">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
          {room?.topic || "Room"}
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-paper sm:text-4xl">
          {room?.title ?? "Loading…"}
        </h1>
        <p className="mt-2 break-all font-mono text-xs text-muted">{roomId}</p>
      </header>

      <Card className="animate-rise-in p-6 sm:p-8">
        <h2 className="font-display text-lg font-semibold text-paper">
          Cumulative Leaderboard
        </h2>
        <div className="mt-4">
          <Leaderboard entries={leaderboardEntries} emptyLabel="No sessions played yet." />
        </div>
      </Card>

      <Card className="animate-rise-in p-6 sm:p-8">
        <h2 className="font-display text-lg font-semibold text-paper">Sessions</h2>
        {!sessions || sessions.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No sessions scheduled yet.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {sessions.map((session) => (
              <li key={session.id}>
                <Link
                  href={`/sessions/${session.id}`}
                  className="flex flex-col gap-2 rounded-xl border border-border bg-surface px-4 py-3 transition-colors hover:border-lime/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="font-display text-sm text-paper">
                    {new Date(session.scheduledAt).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                  <span className="flex items-center gap-3 font-mono text-xs text-muted">
                    <span>
                      {session.entryFee} {session.currency}
                    </span>
                    <span>{session.entryCount} joined</span>
                    <Badge
                      tone={STATUS_TONE[session.status as keyof typeof STATUS_TONE] ?? "neutral"}
                    >
                      {session.status}
                    </Badge>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="animate-rise-in p-6 sm:p-8">
        <h2 className="font-display text-lg font-semibold text-paper">Schedule a Session</h2>
        {!hostToken && (
          <p className="mt-2 text-sm text-muted">
            Only the host who created this room can schedule sessions.
          </p>
        )}
        <form
          onSubmit={handleSubmit}
          className={`mt-5 flex flex-col gap-5 ${!hostToken ? "pointer-events-none opacity-40" : ""}`}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field className="sm:col-span-1">
              Scheduled at
              <Input
                required
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            </Field>
            <Field>
              Entry fee (NIM)
              <Input
                required
                type="number"
                min="0"
                step="0.01"
                value={entryFee}
                onChange={(e) => setEntryFee(e.target.value)}
              />
            </Field>
            <Field>
              Min entries
              <Input
                required
                type="number"
                min="1"
                value={minEntries}
                onChange={(e) => setMinEntries(e.target.value)}
              />
            </Field>
          </div>

          <div className="flex flex-col gap-4">
            {questions.map((q, qIndex) => (
              <div
                key={qIndex}
                className="flex flex-col gap-3 rounded-xl border border-border bg-surface-2/60 p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase tracking-wider text-muted">
                    Question {qIndex + 1}
                  </span>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setQuestions((qs) => qs.filter((_, i) => i !== qIndex))}
                      className="font-mono text-xs uppercase tracking-wider text-coral hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <Input
                  required
                  placeholder="Question text"
                  value={q.text}
                  onChange={(e) => updateQuestion(qIndex, { text: e.target.value })}
                />
                <div className="flex flex-col gap-2">
                  {q.options.map((opt, oIndex) => {
                    const isCorrect = q.correctOption === opt && opt !== "";
                    return (
                      <div key={oIndex} className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={!opt}
                          onClick={() => updateQuestion(qIndex, { correctOption: opt })}
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border font-mono text-sm transition-colors disabled:opacity-30 ${
                            isCorrect
                              ? "border-lime bg-lime text-lime-ink"
                              : "border-border text-muted hover:border-lime/50"
                          }`}
                          aria-label="Mark as correct answer"
                        >
                          ✓
                        </button>
                        <Input
                          placeholder={`Option ${oIndex + 1}`}
                          value={opt}
                          onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => updateQuestion(qIndex, { options: [...q.options, ""] })}
                    className="self-start font-mono text-xs uppercase tracking-wider text-muted hover:text-lime"
                  >
                    + Add option
                  </button>
                </div>
                <Field className="w-32">
                  Time limit (sec)
                  <Input
                    type="number"
                    min="1"
                    value={q.timeLimitSec}
                    onChange={(e) => updateQuestion(qIndex, { timeLimitSec: Number(e.target.value) })}
                  />
                </Field>
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setQuestions((qs) => [...qs, emptyQuestion()])}
              className="self-start"
            >
              + Add question
            </Button>
          </div>

          {error && <p className="text-sm text-coral">{error.message}</p>}

          <Button type="submit" disabled={isPending || !isValid || !hostToken} className="w-full">
            {isPending ? "Scheduling…" : "Schedule Session"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
