"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  createSession,
  getRoomLeaderboard,
  type CumulativeLeaderboard,
} from "@/lib/api";

interface QuestionDraft {
  text: string;
  options: string[];
  correctOption: string;
  timeLimitSec: number;
}

function emptyQuestion(): QuestionDraft {
  return { text: "", options: ["", ""], correctOption: "", timeLimitSec: 15 };
}

export function RoomClient({ roomId }: { roomId: string }) {
  const [leaderboard, setLeaderboard] = useState<
    CumulativeLeaderboard["cumulative"]
  >([]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [entryFee, setEntryFee] = useState("5");
  const [minEntries, setMinEntries] = useState("3");
  const [questions, setQuestions] = useState<QuestionDraft[]>([
    emptyQuestion(),
  ]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdSessionIds, setCreatedSessionIds] = useState<string[]>([]);

  useEffect(() => {
    getRoomLeaderboard(roomId)
      .then((res) => setLeaderboard(res.cumulative))
      .catch(() => {});
  }, [roomId]);

  function updateQuestion(index: number, patch: Partial<QuestionDraft>) {
    setQuestions((qs) =>
      qs.map((q, i) => (i === index ? { ...q, ...patch } : q)),
    );
  }

  function updateOption(qIndex: number, oIndex: number, value: string) {
    setQuestions((qs) =>
      qs.map((q, i) =>
        i === qIndex
          ? {
              ...q,
              options: q.options.map((o, j) => (j === oIndex ? value : o)),
            }
          : q,
      ),
    );
  }

  const isValid =
    scheduledAt &&
    Number(entryFee) > 0 &&
    questions.length > 0 &&
    questions.every(
      (q) =>
        q.text &&
        q.correctOption &&
        q.options.filter(Boolean).includes(q.correctOption),
    );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { sessionId } = await createSession(roomId, {
        scheduledAt: new Date(scheduledAt).toISOString(),
        entryFee: Number(entryFee),
        minEntries: Number(minEntries),
        questions: questions.map((q) => ({
          text: q.text,
          options: q.options.filter(Boolean),
          correctOption: q.correctOption,
          timeLimitSec: q.timeLimitSec,
        })),
      });
      setCreatedSessionIds((ids) => [sessionId, ...ids]);
      setQuestions([emptyQuestion()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create session");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Room</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{roomId}</p>
      </header>

      <section>
        <h2 className="text-lg font-semibold">Cumulative Leaderboard</h2>
        {leaderboard.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">No sessions played yet.</p>
        ) : (
          <ol className="mt-3 flex flex-col gap-1">
            {leaderboard.map((entry, i) => (
              <li
                key={entry.userId}
                className="flex items-center justify-between rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/10"
              >
                <span>
                  #{i + 1} {entry.userId}
                </span>
                <span className="text-zinc-500">
                  {entry.totalScore} pts · {entry.sessionsPlayed} sessions
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      {createdSessionIds.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold">Sessions created this visit</h2>
          <ul className="mt-2 flex flex-col gap-1">
            {createdSessionIds.map((id) => (
              <li key={id}>
                <Link
                  href={`/sessions/${id}`}
                  className="text-sm underline underline-offset-2"
                >
                  /sessions/{id}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold">Schedule a Session</h2>
        <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-4">
          <div className="flex gap-4">
            <label className="flex flex-1 flex-col gap-1 text-sm font-medium">
              Scheduled at
              <input
                required
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="rounded-lg border border-black/10 bg-transparent px-3 py-2 text-base outline-none focus:border-black dark:border-white/15 dark:focus:border-white"
              />
            </label>
            <label className="flex w-28 flex-col gap-1 text-sm font-medium">
              Entry fee (NIM)
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={entryFee}
                onChange={(e) => setEntryFee(e.target.value)}
                className="rounded-lg border border-black/10 bg-transparent px-3 py-2 text-base outline-none focus:border-black dark:border-white/15 dark:focus:border-white"
              />
            </label>
            <label className="flex w-28 flex-col gap-1 text-sm font-medium">
              Min entries
              <input
                required
                type="number"
                min="1"
                value={minEntries}
                onChange={(e) => setMinEntries(e.target.value)}
                className="rounded-lg border border-black/10 bg-transparent px-3 py-2 text-base outline-none focus:border-black dark:border-white/15 dark:focus:border-white"
              />
            </label>
          </div>

          <div className="flex flex-col gap-4">
            {questions.map((q, qIndex) => (
              <div
                key={qIndex}
                className="flex flex-col gap-3 rounded-lg border border-black/10 p-4 dark:border-white/10"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Question {qIndex + 1}
                  </span>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setQuestions((qs) => qs.filter((_, i) => i !== qIndex))
                      }
                      className="text-xs text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <input
                  required
                  placeholder="Question text"
                  value={q.text}
                  onChange={(e) =>
                    updateQuestion(qIndex, { text: e.target.value })
                  }
                  className="rounded-lg border border-black/10 bg-transparent px-3 py-2 text-base outline-none focus:border-black dark:border-white/15 dark:focus:border-white"
                />
                <div className="flex flex-col gap-2">
                  {q.options.map((opt, oIndex) => (
                    <div key={oIndex} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-${qIndex}`}
                        checked={q.correctOption === opt && opt !== ""}
                        onChange={() =>
                          updateQuestion(qIndex, { correctOption: opt })
                        }
                        disabled={!opt}
                      />
                      <input
                        placeholder={`Option ${oIndex + 1}`}
                        value={opt}
                        onChange={(e) =>
                          updateOption(qIndex, oIndex, e.target.value)
                        }
                        className="flex-1 rounded-lg border border-black/10 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-black dark:border-white/15 dark:focus:border-white"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      updateQuestion(qIndex, { options: [...q.options, ""] })
                    }
                    className="self-start text-xs underline underline-offset-2"
                  >
                    Add option
                  </button>
                </div>
                <label className="flex w-32 flex-col gap-1 text-xs font-medium">
                  Time limit (sec)
                  <input
                    type="number"
                    min="1"
                    value={q.timeLimitSec}
                    onChange={(e) =>
                      updateQuestion(qIndex, {
                        timeLimitSec: Number(e.target.value),
                      })
                    }
                    className="rounded-lg border border-black/10 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-black dark:border-white/15 dark:focus:border-white"
                  />
                </label>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setQuestions((qs) => [...qs, emptyQuestion()])}
              className="self-start rounded-full border border-black/10 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
            >
              + Add question
            </button>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting || !isValid}
            className="mt-2 rounded-full bg-black px-5 py-3 text-base font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {submitting ? "Scheduling…" : "Schedule Session"}
          </button>
        </form>
      </section>
    </div>
  );
}
