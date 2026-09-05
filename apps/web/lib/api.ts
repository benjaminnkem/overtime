const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${body}`);
  }
  return res.json() as Promise<T>;
}

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
    currency: string;
    recipient: string | null;
  };
}

export interface SettleResult {
  refunded?: boolean;
  entries?: { userId: string; amount: string }[];
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

export function createRoom(input: CreateRoomInput) {
  return request<{ roomId: string }>("/rooms", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function createSession(roomId: string, input: CreateSessionInput) {
  return request<{ sessionId: string }>(`/rooms/${roomId}/sessions`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getSession(sessionId: string) {
  return request<SessionInfo>(`/sessions/${sessionId}`);
}

export function joinSession(sessionId: string, walletAddress: string) {
  return request<JoinResult>(`/sessions/${sessionId}/join`, {
    method: "POST",
    body: JSON.stringify({ walletAddress }),
  });
}

export function settleSession(sessionId: string) {
  return request<SettleResult>(`/sessions/${sessionId}/settle`, {
    method: "POST",
  });
}

export function getRoomLeaderboard(roomId: string) {
  return request<CumulativeLeaderboard>(`/rooms/${roomId}/leaderboard`);
}
