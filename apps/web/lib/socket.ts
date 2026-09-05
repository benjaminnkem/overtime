import { io, Socket } from "socket.io-client";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:4000";

let socket: Socket | null = null;

export function getSocket(): Socket {
  socket ??= io(WS_URL);
  return socket;
}

export interface LiveQuestion {
  question: {
    id: string;
    text: string;
    options: string[];
    timeLimitSec: number;
  };
  index: number;
  total: number;
  broadcastAtMs: number;
}

export interface LiveLeaderboard {
  rankings: { userId: string; score: number; rank: number }[];
}
