import { http } from "./http";

export interface CreateRoomInput {
  hostId: string;
  title: string;
  topic?: string;
  schedule?: string;
}

export interface CreateQuestionInput {
  text: string;
  options: string[];
  correctOption: string;
  timeLimitSec?: number;
}

export interface CreateSessionInput {
  scheduledAt: string;
  entryFee: number;
  currency?: string;
  minEntries?: number;
  questions: CreateQuestionInput[];
}

export interface SessionInfo {
  id: string;
  roomId: string;
  scheduledAt: string;
  entryFee: string;
  currency: string;
  status: string;
  minEntries: number;
  entryCount: number;
}

export interface JoinResult {
  entryId: string;
  paymentRequest: {
    amount: string;
    amountLuna: number;
    currency: string;
    recipient: string | null;
  };
}

export interface SettleResult {
  refunded?: boolean;
  entries?: { userId: string; amount: string; txHash: string | null }[];
  results?: {
    userId: string;
    rank: number;
    payoutAmount: string | null;
    txHash: string | null;
  }[];
}

export interface CumulativeLeaderboard {
  cumulative: { userId: string; totalScore: number; sessionsPlayed: number }[];
}

export async function createRoom(input: CreateRoomInput) {
  const { data } = await http.post<{ roomId: string }>("/rooms", input);
  return data;
}

export async function createSession(roomId: string, input: CreateSessionInput) {
  const { data } = await http.post<{ sessionId: string }>(
    `/rooms/${roomId}/sessions`,
    input,
  );
  return data;
}

export async function getSession(sessionId: string) {
  const { data } = await http.get<SessionInfo>(`/sessions/${sessionId}`);
  return data;
}

export async function joinSession(sessionId: string, walletAddress: string) {
  const { data } = await http.post<JoinResult>(`/sessions/${sessionId}/join`, {
    walletAddress,
  });
  return data;
}

export async function recordDeposit(
  sessionId: string,
  entryId: string,
  depositTxHash: string,
) {
  const { data } = await http.post<{
    entryId: string;
    depositTxHash: string;
    depositVerified: boolean;
  }>(`/sessions/${sessionId}/entries/${entryId}/deposit`, { depositTxHash });
  return data;
}

export async function settleSession(sessionId: string) {
  const { data } = await http.post<SettleResult>(
    `/sessions/${sessionId}/settle`,
  );
  return data;
}

export async function getRoomLeaderboard(roomId: string) {
  const { data } = await http.get<CumulativeLeaderboard>(
    `/rooms/${roomId}/leaderboard`,
  );
  return data;
}
