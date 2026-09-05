# Overtime
**Your group chat's trivia debates, as a weekly live event with real stakes.**

## Problem / Solution
Communities want a recurring ritual with stakes, but nothing today gives them a hosted, fair, skill-scored way to run one. Overtime lets a host stand up a weekly live trivia Room for their group — entry fee in NIM, live leaderboard, top finishers paid automatically when the session ends. Skill decides rank, not luck. Built on the Nimiq Pay Mini Apps Framework.

## Setup & Run
```bash
git clone https://github.com/tochison/overtime.git
cd overtime
pnpm install

# Frontend (Next.js)
cd apps/web
cp .env.example .env.local   # NEXT_PUBLIC_API_URL, NEXT_PUBLIC_WS_URL, NEXT_PUBLIC_NIMIQ_APP_ORIGIN
pnpm dev

# Backend (NestJS + socket.io)
cd ../api
cp .env.example .env         # DATABASE_URL, NIMIQ_CUSTODIAL_WALLET_SEED
pnpm prisma migrate dev
pnpm start:dev
```
Confirm the exact required Mini App SDK env keys against the current `@nimiq/mini-app-sdk` docs before first run.

## Tech Stack
Next.js · TypeScript · Tailwind CSS · TanStack Query · NestJS · socket.io · PostgreSQL · Prisma · @nimiq/mini-app-sdk

## Team
- Teammate — lead
- Benjamin Nkem ([@tochison](https://github.com/tochison)) — fullstack engineer

## Links
- Repo: `github.com/tochison/overtime` (create on kickoff)
- Live demo: add once deployed
- Deck: add before submission
