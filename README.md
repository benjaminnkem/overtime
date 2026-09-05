# Overtime

**Your group chat's trivia debates, as a weekly live event with real stakes.**

Overtime turns the "I bet I'd win" energy of every community WhatsApp or Telegram group into an actual scheduled event. A host stands up a live trivia **Room** for their group, members join a **Session** with a small NIM entry fee, questions go out in real time with a countdown, the leaderboard re-ranks live as answers land, and the top finishers are paid out automatically the moment the session ends — no manual settlement, no winner-take-all.

Built on the [Nimiq Pay Mini Apps Framework](https://nimiq.dev/mini-apps) for the Nimiq Pay Mini Apps hackathon.

## Table of Contents

- [The Problem](#the-problem)
- [How It Works](#how-it-works)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Repository Structure](#repository-structure)
- [Getting Started](#getting-started)
- [Project Status](#project-status)
- [Documentation](#documentation)
- [Team](#team)
- [License](#license)

## The Problem

Communities want a recurring ritual with stakes, but nothing today gives them a hosted, fair, skill-scored way to run one. Ad hoc trivia via Google Forms or Kahoot has no stakes and no payout. Existing wager-style Mini Apps are single-session prediction tools, not something a group owns and returns to week after week.

Overtime is a *room*, not a bet: the same group, the same weekly slot, a cumulative leaderboard across sessions, and payouts split across the top finishers so more people have a reason to come back — ranked by accuracy and speed, not chance.

## How It Works

1. A **host** creates a Room for their group (title, topic, recurring schedule) and schedules a live Session with a question set and a NIM entry fee.
2. **Participants** join the Session and pay the entry fee through their Nimiq Pay wallet.
3. Questions are pushed live with a countdown timer; participants answer in real time.
4. The leaderboard re-ranks live as answers land — server-timestamped, so network lag doesn't cost you your rank.
5. When the session ends, the top N finishers are paid automatically from the pooled entry fees. If a session doesn't meet the minimum entry threshold, it doesn't go live and everyone is refunded instead.
6. The Room keeps a cumulative leaderboard across every session it's run.

## Features

**MVP**
- Host-created Rooms with a recurring weekly Session schedule
- NIM entry-fee collection via Nimiq Pay
- Live question broadcast with a per-question countdown
- Real-time, server-authoritative leaderboard
- Automatic top-N payout at session close, with a minimum-entries refund path
- Per-Room cumulative leaderboard across past sessions

**Stretch**
- USDT support alongside NIM
- Host-customizable payout splits (top 3, top 5, etc.)
- Auto-generated weekly question sets by topic

See [`docs/PRD.md`](docs/PRD.md) for the full requirements and non-goals.

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS, TanStack Query |
| Backend | NestJS, socket.io |
| Database | PostgreSQL, Prisma |
| Payments | [`@nimiq/mini-app-sdk`](https://nimiq.dev/mini-apps) |
| Monorepo | Turborepo, pnpm workspaces |

## Architecture

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
[nimiq-settlement] --> [Custodial NIM wallet] --> top-N payout transactions
```

Full data models and API contracts are in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Repository Structure

```
overtime/
├── apps/
│   ├── web/     # Next.js frontend (Mini App WebView)
│   └── api/     # NestJS API + socket.io gateway
├── packages/
│   ├── ui/                  # Shared React component library
│   ├── eslint-config/       # Shared ESLint configs
│   └── typescript-config/   # Shared tsconfig bases
└── docs/        # Product/architecture/planning docs
```

## Getting Started

### Prerequisites

- Node.js `>=24`
- pnpm `11.25.0` (see `packageManager` in [`package.json`](package.json))
- A local PostgreSQL instance

### Installation

```bash
git clone https://github.com/tochison/overtime.git
cd overtime
pnpm install
```

### Running the apps

```bash
# Frontend — http://localhost:3000
pnpm --filter web dev

# Backend API
pnpm --filter api start:dev
```

Or run everything through Turborepo from the repo root:

```bash
pnpm dev
```

Copy each app's example env file before running it:

- `apps/web/.env.local.example` → `.env.local`: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`
- `apps/api/.env.example` → `.env`: `DATABASE_URL`, `NIMIQ_CUSTODIAL_PRIVATE_KEY` (a hex private key — see the comment in the example file for how to generate a throwaway one), `PORT`

## Project Status

Actively in development for a **September 18, 2026** hackathon submission deadline. The full MVP loop works end-to-end: create a Room, schedule a Session, join, live question broadcast with a server-timestamped countdown, live leaderboard, and settlement (top-N payout split or minimum-entries refund).

Nimiq integration is partial: the frontend uses the real `@nimiq/mini-app-sdk` to detect the user's wallet and collect the entry fee via `sendBasicTransaction` when running inside Nimiq Pay (falls back to manual entry outside it, e.g. for local dev), and the backend derives a real custodial NIM address via `@nimiq/core`. Still open: verifying deposits on-chain and actually sending payout transactions — both need a connected Nimiq client, not just address derivation.

Track detailed phase-by-phase progress in [`docs/BUILD_PLAN.md`](docs/BUILD_PLAN.md).

Track detailed phase-by-phase progress in [`docs/BUILD_PLAN.md`](docs/BUILD_PLAN.md).

## Documentation

| Doc | Contents |
|---|---|
| [`docs/PRD.md`](docs/PRD.md) | Problem statement, target users, user stories, success metrics |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Data models, API contracts, third-party services |
| [`docs/BUILD_PLAN.md`](docs/BUILD_PLAN.md) | Phased build plan and checkpoints |
| [`docs/PITCH.md`](docs/PITCH.md) | Stage pitch and anticipated judge Q&A |
| [`docs/RISKS.md`](docs/RISKS.md) | Live-demo risks and fallbacks |

## Team

- Teammate — lead
- Benjamin Nkem ([@tochison](https://github.com/tochison)) — fullstack engineer

## License

Not yet added — an MIT license is planned before submission (see [`docs/BUILD_PLAN.md`](docs/BUILD_PLAN.md)).
