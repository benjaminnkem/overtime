"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getSession,
  joinSession,
  recordDeposit,
  settleSession,
  type SettleResult,
} from "@/lib/api";
import { getSocket, type LiveQuestion, type LiveLeaderboard } from "@/lib/socket";
import { getNimiqProvider } from "@/lib/nimiq";
import { getStoredHostToken } from "@/lib/host-token";
import type { NimiqProvider } from "@nimiq/mini-app-sdk";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field, Input } from "@/components/ui/field";
import { LiveDot } from "@/components/live-dot";
import { Leaderboard, type LeaderboardEntry } from "@/components/leaderboard";

function entryStorageKey(sessionId: string) {
  return `overtime:entry:${sessionId}`;
}

export function SessionClient({ sessionId }: { sessionId: string }) {
  const queryClient = useQueryClient();

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
  const hostToken = sessionInfo ? getStoredHostToken(sessionInfo.roomId) : null;

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
    function join() {
      socket.emit("session:join", { sessionId });
    }
    join();
    socket.on("connect", join);

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
      socket.off("connect", join);
      socket.off("question", onQuestion);
      socket.off("leaderboard", onLeaderboard);
    };
  }, [sessionId]);

  useEffect(() => {
    if (!questionState || answered) return;
    const interval = setInterval(() => setNow(Date.now()), 100);
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
    },
  });

  const settleMutation = useMutation({
    mutationFn: () => {
      if (!hostToken) throw new Error("Only the host who created this room can settle sessions");
      return settleSession(sessionId, hostToken);
    },
    onSuccess: (result) => {
      setSettleResult(result);
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
    },
  });

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    joinMutation.mutate();
  }

  function startQuestion(index: number) {
    if (!hostToken) return;
    getSocket().emit("host:startQuestion", { sessionId, questionIndex: index, hostToken });
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
  const msLeft = questionState
    ? Math.max(0, questionState.question.timeLimitSec * 1000 - (now - questionState.broadcastAtMs))
    : 0;
  const secondsLeft = Math.ceil(msLeft / 1000);
  const timePct = questionState ? msLeft / (questionState.question.timeLimitSec * 1000) : 0;
  const urgent = timePct < 0.3;

  const liveEntries: LeaderboardEntry[] = rankings.map((r) => ({
    userId: r.userId,
    rank: r.rank,
    detail: `${r.score} correct`,
  }));

  const settleEntries: LeaderboardEntry[] = settleResult?.refunded
    ? (settleResult.entries ?? []).map((e, i) => ({
        userId: e.userId,
        rank: i + 1,
        detail: `${e.amount} refunded`,
      }))
    : (settleResult?.results ?? []).map((r) => ({
        userId: r.userId,
        rank: r.rank,
        detail: r.payoutAmount ? `${r.payoutAmount} NIM` : "—",
      }));

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10 sm:py-14">
      <header className="animate-rise-in flex flex-col gap-2">
        <div className="flex items-center gap-2">
          {questionState && !settleResult && <LiveDot />}
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
            {questionState && !settleResult ? "Live now" : "Session"}
          </p>
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-paper">
          {sessionInfo ? `${sessionInfo.entryFee} ${sessionInfo.currency} Entry` : "Live Session"}
        </h1>
        {sessionInfo && (
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-muted">
            <span>{sessionInfo.entryCount} joined</span>
            <Badge tone="neutral">{sessionInfo.status}</Badge>
          </div>
        )}
      </header>

      {!entryId ? (
        <Card className="animate-rise-in p-6 sm:p-8">
          <form onSubmit={handleJoin} className="flex flex-col gap-4">
            <Field>
              Your wallet address
              <Input
                required
                readOnly={nimiqStatus === "available"}
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="NQ..."
              />
            </Field>
            {joinMutation.error && (
              <p className="text-sm text-coral">{joinMutation.error.message}</p>
            )}
            <Button
              type="submit"
              disabled={joinMutation.isPending || nimiqStatus === "checking"}
              className="w-full"
            >
              {joinMutation.isPending
                ? paymentStatus === "paying"
                  ? "Confirm in Nimiq Pay…"
                  : "Joining…"
                : `Join & Pay ${sessionInfo?.entryFee ?? ""} ${sessionInfo?.currency ?? ""}`}
            </Button>
            <p className="text-xs text-muted">
              {nimiqStatus === "available"
                ? "Detected your Nimiq Pay wallet — you'll get a native confirmation dialog for the entry fee."
                : "Not running inside Nimiq Pay, so payment collection isn't wired to a real wallet in this mode — joining records your entry without moving funds."}
            </p>
          </form>
        </Card>
      ) : (
        <div className="animate-rise-in flex flex-col gap-1 font-mono text-xs text-muted">
          <p>
            Entry <span className="text-paper">{entryId}</span>
          </p>
          {paymentStatus === "paid" && <p className="text-lime">Entry fee paid.</p>}
          {paymentStatus === "error" && <p className="text-coral">Payment failed: {paymentError}</p>}
        </div>
      )}

      {hostToken && (
        <Card className="animate-rise-in flex flex-col gap-4 p-6 sm:p-8">
          <div className="flex items-center gap-2">
            <Badge tone="lime">Host</Badge>
          </div>
          <div className="flex gap-3">
            {!allQuestionsDone && (
              <Button variant="secondary" size="sm" onClick={() => startQuestion(nextIndex)}>
                Start Question {nextIndex + 1}
              </Button>
            )}
            {allQuestionsDone && !settleResult && (
              <Button size="sm" onClick={() => settleMutation.mutate()} disabled={settleMutation.isPending}>
                {settleMutation.isPending ? "Settling…" : "Settle Session"}
              </Button>
            )}
          </div>
        </Card>
      )}

      {questionState && !settleResult && (
        <motion.div
          key={questionState.question.id}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="overflow-hidden p-6 sm:p-8">
            <div className="flex items-center justify-between font-mono text-xs uppercase tracking-wider text-muted">
              <span>
                Question {questionState.index + 1} / {questionState.total}
              </span>
              <span
                className={`text-2xl font-bold tabular-nums ${urgent ? "text-coral" : "text-lime"}`}
              >
                {answered ? "✓" : secondsLeft}
              </span>
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
              <motion.div
                className={`h-full rounded-full ${urgent ? "bg-coral" : "bg-lime"}`}
                animate={{ width: `${Math.max(0, timePct * 100)}%` }}
                transition={{ ease: "linear", duration: 0.1 }}
              />
            </div>
            <h3 className="mt-6 font-display text-2xl font-bold text-paper sm:text-3xl">
              {questionState.question.text}
            </h3>
            <div className="mt-6 flex flex-col gap-3">
              {questionState.question.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => submitAnswer(opt)}
                  disabled={answered || !entryId}
                  className={`min-h-14 rounded-xl border px-5 py-4 text-left font-display text-base font-medium transition-all disabled:cursor-not-allowed ${
                    selectedOption === opt
                      ? "border-lime bg-lime/15 text-paper"
                      : "border-border bg-surface text-paper hover:border-lime/40 disabled:opacity-50"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      <Card className="animate-rise-in p-6 sm:p-8">
        <h2 className="font-display text-lg font-semibold text-paper">Live Leaderboard</h2>
        <div className="mt-4">
          <Leaderboard entries={liveEntries} emptyLabel="No answers yet." />
        </div>
      </Card>

      {settleResult && (
        <Card className="animate-rise-in p-6 sm:p-8">
          <h2 className="font-display text-lg font-semibold text-paper">
            {settleResult.refunded ? "Session Refunded" : "Final Results"}
          </h2>
          {settleResult.refunded && (
            <p className="mt-1 text-sm text-muted">
              Didn&apos;t meet the minimum entries — everyone is refunded.
            </p>
          )}
          <div className="mt-4">
            <Leaderboard entries={settleEntries} emptyLabel="No entries." />
          </div>
          <p className="mt-4 text-xs text-muted">
            Payout amounts are computed, but sending the real on-chain transaction isn&apos;t
            wired up yet — that needs the Nimiq settlement integration.
          </p>
        </Card>
      )}
    </div>
  );
}
