# Overtime — Architecture

## Stack & Why

- **Next.js (App Router) + TypeScript** — same reasoning as TurnUp; also needs a fast, low-latency client for live question rendering.
- **Tailwind CSS** — shared design system across both apps saves real time.
- **TanStack Query** — room/session/leaderboard state for everything that isn't real-time.
- **NestJS + socket.io** — this app leans harder on real-time than TurnUp: question broadcast, answer intake, and live leaderboard push all run over a socket.io namespace per session.
- **PostgreSQL + Prisma** — rooms, sessions, questions, answers, results.
- **@nimiq/mini-app-sdk** — entry-fee collection.
- **@nimiq/core** — custodial wallet + on-chain deposit verification and payout sending (`apps/api/src/nimiq`). Originally planned as a shared `@team/nimiq-settlement` package with TurnUp, but built directly inside `apps/api` instead — revisit extracting it only if TurnUp actually needs the same logic.

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
[NimiqService + NimiqClientService] --> [Custodial NIM wallet] --> top-N payout transactions
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
  id              String    @id @default(cuid())
  sessionId       String
  session         Session   @relation(fields: [sessionId], references: [id])
  userId          String
  depositTxHash   String?
  depositVerified Boolean   @default(false)
  answers         Answer[]
}

model Answer {
  id             String    @id @default(cuid())
  entryId        String
  entry          Entry     @relation(fields: [entryId], references: [id])
  questionId     String
  selectedOption String
  answeredAtMs   Int
  isCorrect      Boolean

  @@unique([entryId, questionId])
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

GET    /sessions/:id
  res:  { id, roomId, scheduledAt, entryFee, currency, status, minEntries, entryCount }

POST   /sessions/:id/join
  body: { walletAddress }
  res:  { entryId, paymentRequest: { amount, amountLuna, currency, recipient } }
  // recipient is the custodial wallet's real NIM address once NIMIQ_CUSTODIAL_PRIVATE_KEY
  // is configured server-side, null otherwise. The client pays it directly via
  // @nimiq/mini-app-sdk's nimiq.sendBasicTransaction({ recipient, value: amountLuna }).

POST   /sessions/:id/entries/:entryId/deposit
  body: { depositTxHash }
  res:  { entryId, depositTxHash, depositVerified }
  // Records the tx hash and attempts to verify it on-chain (recipient, amount,
  // confirmed state) via the Nimiq client. depositVerified is false whenever
  // that check fails OR the client isn't connected — see the known
  // connectivity issue below. Never throws on a failed/unavailable check;
  // the entry is recorded either way.

WS     /sessions/:id   (socket.io namespace)
  server -> client: { type: "question", question: {...}, index, total }
  client -> server: { type: "answer", entryId, questionId, selectedOption }
  server -> client: { type: "leaderboard", rankings: [{ userId, score, rank }] }

POST   /sessions/:id/settle
  res:  { results: [{ userId, rank, payoutAmount, txHash }] }
  // if entries < minEntries: res: { refunded: true, entries: [{ userId, amount, txHash }] }
  // Attempts a real payout/refund transaction from the custodial wallet for
  // each entrant; txHash is null (not an error) whenever the client isn't
  // connected — settlement still completes with correct computed amounts.

GET    /rooms/:id/leaderboard
  res:  { cumulative: [{ userId, totalScore, sessionsPlayed }] }
```

## Third-Party Services, APIs, SDKs

- `@nimiq/mini-app-sdk` — https://nimiq.dev/mini-apps — client-side entry-fee payment, verified against the actual published package
- `@nimiq/core` (v2.21.0) — server-side custodial wallet (`NimiqService`) and live chain access (`NimiqClientService`)
- `socket.io` — the real-time layer; heavier lift here than in TurnUp, budget real testing time under actual venue wifi conditions, not just localhost
- Hosting: Vercel for the Next.js frontend (https://overtime-web.vercel.app), Render for the NestJS/socket.io API + Postgres (https://overtime-api-j0u4.onrender.com, defined in `render.yaml` as a Blueprint) — Vercel's serverless functions don't reliably hold persistent socket connections, so the real-time API should not run as serverless functions. Render's free web service tier spins down after 15 minutes idle and takes a short cold-start hit on the next request — worth remembering during a live demo.

### Known issue: `@nimiq/core` Node.js client never reaches consensus (confirmed on real infrastructure)

`Nimiq.Client` (TestAlbatross) connects to seed nodes at the transport level but every
peer connection is dropped immediately, logging `TypeError: arg0.addEventListener is
not a function` from inside the WASM bindings. Peer count never rises above 0 and
consensus never establishes, even after 40+ seconds. This reproduces the symptoms of
an open upstream issue,
[nimiq/core-rs-albatross#3101](https://github.com/nimiq/core-rs-albatross/issues/3101)
("Light Web Node panic after restart" — same `addEventListener` error). A related
issue (nimiq/core-rs-albatross#3417, "Node.js/WebContainer compatibility") was closed
without a documented fix.

**This was first found in local dev, then confirmed reproducing identically on the
live Render deployment** (`overtime-api`, a normal cloud container with unrestricted
outbound networking) — same error, same stuck-at-`connecting` behavior. That rules out
a sandbox-specific network restriction as the cause; this looks like a genuine bug in
`@nimiq/core@2.21.0`'s Node.js build, not an environment quirk.

Because of this, `verifyDeposit`/`sendPayout` in `NimiqClientService` are implemented
against the verified API (`getTransaction`, `TransactionBuilder.newBasic`,
`sendTransaction`, etc.) but have **not** been exercised against a real network — the
client itself never gets past `connecting`, on any environment tested so far.
`SessionsService` degrades gracefully when this happens (records deposits as
unverified, settles with `txHash: null`) rather than blocking or crashing, but real
on-chain deposit verification and payout sending do not currently work anywhere. There
are currently no public Nimiq open RPC servers listed either
(`nimiq.dev/rpc/open-servers` shows "No data" for both mainnet and testnet), so an
RPC-based fallback isn't available out of the box. Worth raising with Nimiq's own
Discord/support before the demo, since this blocks the "automated payout" half of the
pitch working for real.
