# Overtime — Architecture

## Stack & Why
- **Next.js (App Router) + TypeScript** — same reasoning as TurnUp; also needs a fast, low-latency client for live question rendering.
- **Tailwind CSS** — shared design system across both apps saves real time.
- **TanStack Query** — room/session/leaderboard state for everything that isn't real-time.
- **NestJS + socket.io** — this app leans harder on real-time than TurnUp: question broadcast, answer intake, and live leaderboard push all run over a socket.io namespace per session.
- **PostgreSQL + Prisma** — rooms, sessions, questions, answers, results.
- **@nimiq/mini-app-sdk** — entry-fee collection.
- **Shares `@team/nimiq-settlement`** with TurnUp for entry-fee collection and payout-split settlement — same module, different call site (top-N split instead of refund/forfeit split).

## System Diagram (text)
```
[Participant's Nimiq Pay Wallet]
        |  (native approval — entry fee)
        v
[Overtime Next.js frontend — WebView]
        |  REST (join/room data)             |  WebSocket (live session)
        v                                     v
[Overtime NestJS API] ------------> [socket.io session gateway]
        |                                     |
        v                                     v
[PostgreSQL: rooms, sessions,        [Live leaderboard broadcast
 questions, answers, results]         to all connected clients]
        |
        v
[@team/nimiq-settlement] --> [Custodial NIM wallet] --> top-N payout transactions
```

## Data Models (Prisma schema, abridged)
```prisma
model Room {
  id         String    @id @default(cuid())
  hostId     String
  title      String
  topic      String?
  schedule   String?
  sessions   Session[]
  createdAt  DateTime  @default(now())
}

model Session {
  id             String     @id @default(cuid())
  roomId         String
  room           Room       @relation(fields: [roomId], references: [id])
  scheduledAt    DateTime
  entryFee       Decimal
  currency       String     @default("NIM")
  status         String     @default("scheduled")
  minEntries     Int        @default(3)
  questions      Question[]
  entries        Entry[]
  results        Result[]
}

model Question {
  id             String    @id @default(cuid())
  sessionId      String
  session        Session   @relation(fields: [sessionId], references: [id])
  text           String
  options        Json
  correctOption  String
  order          Int
  timeLimitSec   Int       @default(15)
}

model Entry {
  id             String    @id @default(cuid())
  sessionId      String
  session        Session   @relation(fields: [sessionId], references: [id])
  userId         String
  depositTxHash  String?
  answers        Answer[]
}

model Answer {
  id             String    @id @default(cuid())
  entryId        String
  entry          Entry     @relation(fields: [entryId], references: [id])
  questionId     String
  selectedOption String
  answeredAtMs   Int
  isCorrect      Boolean
}

model Result {
  id             String    @id @default(cuid())
  sessionId      String
  session        Session   @relation(fields: [sessionId], references: [id])
  userId         String
  score          Int
  rank           Int
  payoutAmount   Decimal?
  payoutTxHash   String?
}
```

## API Contracts
```
POST   /rooms
  body: { title, topic?, schedule? }
  res:  { roomId }

POST   /rooms/:id/sessions
  body: { scheduledAt, entryFee, currency, minEntries?, questions: [{ text, options, correctOption, timeLimitSec }] }
  res:  { sessionId }

POST   /sessions/:id/join
  body: { walletAddress }
  res:  { entryId, paymentRequest }

WS     /sessions/:id   (socket.io namespace)
  server -> client: { type: "question", question: {...}, index, total }
  client -> server: { type: "answer", entryId, questionId, selectedOption }
  server -> client: { type: "leaderboard", rankings: [{ userId, score, rank }] }

POST   /sessions/:id/settle
  res:  { results: [{ userId, rank, payoutAmount, txHash }] }
  // if entries < minEntries: session cancelled, all entry fees refunded instead

GET    /rooms/:id/leaderboard
  res:  { cumulative: [{ userId, totalScore, sessionsPlayed }] }
```

## Third-Party Services, APIs, SDKs
- `@nimiq/mini-app-sdk` — https://nimiq.dev/mini-apps
- Nimiq backend signing — same open item as TurnUp; confirm the current recommended package against https://nimiq.dev before Week 1 build starts
- `socket.io` — the real-time layer; heavier lift here than in TurnUp, budget real testing time under actual venue wifi conditions, not just localhost
- Hosting: Vercel for the Next.js frontend, plus a small always-on Node host (e.g. Railway or Fly.io) for the NestJS/socket.io API — Vercel's serverless functions don't reliably hold persistent socket connections, so the real-time API should not run as serverless functions
