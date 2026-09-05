"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getSession,
  joinSession,
  recordDeposit,
  settleSession,
  type SettleResult,
} from "@/lib/api";
import { getSocket, type LiveQuestion, type LiveLeaderboard } from "@/lib/socket";
import { getNimiqProvider } from "@/lib/nimiq";
import type { NimiqProvider } from "@nimiq/mini-app-sdk";

function entryStorageKey(sessionId: string) {
  return `overtime:entry:${sessionId}`;
}

export function SessionClient({ sessionId }: { sessionId: string }) {
  const { data: sessionInfo } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => getSession(sessionId),
  });

  const [walletAddress, setWalletAddress] = useState("");
  const [entryId, setEntryId] = useState<string | null>(null);

  const [nimiqProvider, setNimiqProvider] = useState<NimiqProvider | null>(null);
  const [nimiqStatus, setNimiqStatus] = useState<"checking" | "available" | "unavailable">(
    "checking",
  );
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "paying" | "paid" | "error">("idle");
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const [questionState, setQuestionState] = useState<LiveQuestion | null>(null);
  const [answered, setAnswered] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [rankings, setRankings] = useState<LiveLeaderboard["rankings"]>([]);
  const [now, setNow] = useState(() => Date.now());

  const [settleResult, setSettleResult] = useState<SettleResult | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(entryStorageKey(sessionId));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from a browser-only store, not a derived-state loop
    if (stored) setEntryId(stored);
  }, [sessionId]);

  useEffect(() => {
    getNimiqProvider()
      .then(async (provider) => {
        setNimiqProvider(provider);
        setNimiqStatus("available");
        const accounts = await provider.listAccounts();
        if (Array.isArray(accounts) && accounts[0]) {
          setWalletAddress(accounts[0]);
        }
      })
      .catch(() => setNimiqStatus("unavailable"));
  }, []);

  useEffect(() => {
    const socket = getSocket();
    socket.emit("session:join", { sessionId });

    function onQuestion(msg: LiveQuestion) {
      setQuestionState(msg);
      setAnswered(false);
      setSelectedOption(null);
    }
    function onLeaderboard(msg: LiveLeaderboard) {
      setRankings(msg.rankings);
    }

    socket.on("question", onQuestion);
    socket.on("leaderboard", onLeaderboard);
    return () => {
      socket.off("question", onQuestion);
      socket.off("leaderboard", onLeaderboard);
    };
  }, [sessionId]);

  useEffect(() => {
    if (!questionState || answered) return;
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, [questionState, answered]);

  const joinMutation = useMutation({
    mutationFn: async () => {
      const { entryId: newEntryId, paymentRequest } = await joinSession(sessionId, walletAddress);
      localStorage.setItem(entryStorageKey(sessionId), newEntryId);
      setEntryId(newEntryId);

      if (nimiqProvider && paymentRequest.recipient) {
        setPaymentStatus("paying");
        const result = await nimiqProvider.sendBasicTransaction({
          recipient: paymentRequest.recipient,
          value: paymentRequest.amountLuna,
        });
        if (typeof result === "string") {
          await recordDeposit(sessionId, newEntryId, result);
          setPaymentStatus("paid");
        } else {
          setPaymentStatus("error");
          setPaymentError(result.error.message);
        }
      }
    },
  });

  const settleMutation = useMutation({
    mutationFn: () => settleSession(sessionId),
    onSuccess: setSettleResult,
  });

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    joinMutation.mutate();
  }

  function startQuestion(index: number) {
    getSocket().emit("host:startQuestion", { sessionId, questionIndex: index });
  }

  function submitAnswer(option: string) {
    if (!entryId || !questionState || answered) return;
    setSelectedOption(option);
    setAnswered(true);
    getSocket().emit("answer", {
      sessionId,
      entryId,
      questionId: questionState.question.id,
      selectedOption: option,
    });
  }

  const nextIndex = questionState ? questionState.index + 1 : 0;
  const allQuestionsDone = questionState ? questionState.index + 1 >= questionState.total : false;
  const secondsLeft = questionState
    ? Math.max(
        0,
        questionState.question.timeLimitSec -
          Math.floor((now - questionState.broadcastAtMs) / 1000),
      )
    : 0;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Live Session</h1>
        {sessionInfo && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Entry fee {sessionInfo.entryFee} {sessionInfo.currency} · {sessionInfo.entryCount}{" "}
            joined · status: {sessionInfo.status}
          </p>
        )}
      </header>

      {!entryId ? (
        <form onSubmit={handleJoin} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Your wallet address
            <input
              required
              readOnly={nimiqStatus === "available"}
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="NQ..."
              className="rounded-lg border border-black/10 bg-transparent px-3 py-2 text-base outline-none read-only:opacity-70 focus:border-black dark:border-white/15 dark:focus:border-white"
            />
          </label>
          {joinMutation.error && (
            <p className="text-sm text-red-600">{joinMutation.error.message}</p>
          )}
          <button
            type="submit"
            disabled={joinMutation.isPending || nimiqStatus === "checking"}
            className="rounded-full bg-black px-5 py-3 text-base font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {joinMutation.isPending
              ? paymentStatus === "paying"
                ? "Confirm in Nimiq Pay…"
                : "Joining…"
              : `Join & Pay ${sessionInfo?.entryFee ?? ""} ${sessionInfo?.currency ?? ""}`}
          </button>
          <p className="text-xs text-zinc-500">
            {nimiqStatus === "available"
              ? "Detected your Nimiq Pay wallet — you'll get a native confirmation dialog for the entry fee."
              : "Not running inside Nimiq Pay, so payment collection isn't wired to a real wallet in this mode — joining records your entry without moving funds."}
          </p>
        </form>
      ) : (
        <div className="flex flex-col gap-1 text-sm text-zinc-500">
          <p>
            You&apos;re in as entry <span className="font-mono">{entryId}</span>
          </p>
          {paymentStatus === "paid" && (
            <p className="text-emerald-600 dark:text-emerald-400">Entry fee paid.</p>
          )}
          {paymentStatus === "error" && (
            <p className="text-red-600">Payment failed: {paymentError}</p>
          )}
        </div>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Host controls</h2>
        <div className="flex gap-3">
          {!allQuestionsDone && (
            <button
              onClick={() => startQuestion(nextIndex)}
              className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
            >
              Start Question {nextIndex + 1}
            </button>
          )}
          {allQuestionsDone && !settleResult && (
            <button
              onClick={() => settleMutation.mutate()}
              disabled={settleMutation.isPending}
              className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              {settleMutation.isPending ? "Settling…" : "Settle Session"}
            </button>
          )}
        </div>
        <p className="text-xs text-zinc-500">
          No host authentication yet — these controls are visible to anyone on this page.
        </p>
      </section>

      {questionState && !settleResult && (
        <section className="rounded-2xl border border-black/10 p-5 dark:border-white/10">
          <div className="flex items-center justify-between text-sm text-zinc-500">
            <span>
              Question {questionState.index + 1} / {questionState.total}
            </span>
            <span>{answered ? "Answered" : `${secondsLeft}s`}</span>
          </div>
          <h3 className="mt-2 text-xl font-semibold">{questionState.question.text}</h3>
          <div className="mt-4 flex flex-col gap-2">
            {questionState.question.options.map((opt) => (
              <button
                key={opt}
                onClick={() => submitAnswer(opt)}
                disabled={answered || !entryId}
                className={`rounded-lg border px-4 py-3 text-left text-base transition-colors disabled:opacity-60 ${
                  selectedOption === opt
                    ? "border-black bg-black/5 dark:border-white dark:bg-white/10"
                    : "border-black/10 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold">Live Leaderboard</h2>
        {rankings.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">No answers yet.</p>
        ) : (
          <ol className="mt-3 flex flex-col gap-1">
            {rankings.map((entry) => (
              <li
                key={entry.userId}
                className="flex items-center justify-between rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/10"
              >
                <span>
                  #{entry.rank} {entry.userId}
                </span>
                <span className="text-zinc-500">{entry.score} correct</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      {settleResult && (
        <section className="rounded-2xl border border-black/10 p-5 dark:border-white/10">
          <h2 className="text-lg font-semibold">
            {settleResult.refunded ? "Session refunded" : "Final Results"}
          </h2>
          {settleResult.refunded ? (
            <>
              <p className="mt-1 text-sm text-zinc-500">
                Didn&apos;t meet the minimum entries — everyone is refunded.
              </p>
              <ul className="mt-3 flex flex-col gap-1">
                {settleResult.entries?.map((e) => (
                  <li key={e.userId} className="text-sm">
                    {e.userId}: {e.amount} refunded
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <ol className="mt-3 flex flex-col gap-1">
              {settleResult.results?.map((r) => (
                <li
                  key={r.userId}
                  className="flex items-center justify-between rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/10"
                >
                  <span>
                    #{r.rank} {r.userId}
                  </span>
                  <span className="text-zinc-500">
                    {r.payoutAmount ? `${r.payoutAmount} NIM` : "—"}
                  </span>
                </li>
              ))}
            </ol>
          )}
          <p className="mt-3 text-xs text-zinc-500">
            Payout amounts are computed, but sending the real on-chain transaction isn&apos;t
            wired up yet — that needs the Nimiq settlement integration.
          </p>
        </section>
      )}
    </div>
  );
}
