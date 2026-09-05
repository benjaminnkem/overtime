# Overtime — Build Plan

**Deadline:** **September 18, 2026** — **13 days** from today (September 5). Not 8 weeks; the timeline below is compressed to fit.

**Open scope question (unresolved):** the PRD's "Real usage" success metric (≥4 live sessions in the same Room, spaced _weekly_, ≥20 unique participants, visible repeat participants across weeks) was written for an 8-week runway and does not fit a 13-day window on a literal weekly cadence. Before Phase 2 below, decide explicitly whether to (a) run several sessions days apart in the same Room instead of weekly, to still show repeat participation and a cumulative leaderboard, or (b) drop the multi-session proof entirely and lead with one polished live session, reweighting effort toward functionality and Nimiq integration. This plan assumes that decision is made by the end of Phase 1 and does not pick for you.

**Team split:** teammate leads Overtime; Benjamin leads TurnUp. Days 1–2 are paired on the shared `@team/nimiq-settlement` module — this is the same work described in TurnUp's Phase 0, don't duplicate it.

## Phase 0 — Days 1–2 (Sep 5–6): Shared foundation

- [Both] `@team/nimiq-settlement` — collect deposit, hold in custodial wallet, send payout transactions
- [Both] Confirm the exact Mini App SDK payment-request method against the live docs
- [Teammate] Scaffold the Overtime Next.js app, NestJS API, socket.io gateway, and Postgres/Prisma schema
- **Checkpoint:** a socket.io connection can push a test message from server to client reliably inside the Nimiq Pay WebView

## Phase 1 — Days 3–7 (Sep 7–11): Core loop

- Room + Session creation (host side)
- Join + entry-fee flow
- Live question broadcast with countdown timer
- Answer intake + live leaderboard recompute and broadcast
- Session settle → top-N payout split (with the minimum-entries refund path)
- Resolve the open scope question above
- **Checkpoint (end Day 7):** a full session runs with 3+ real devices, the leaderboard updates live, and payout fires correctly

## Phase 2 — Days 8–10 (Sep 12–14): Real session(s), start the usage proof

- Run session #1 with a real group — ideally one Benjamin or teammate is already part of, to keep cold-start risk low
- If pursuing the multi-session proof, run session #2 (and #3 if time allows) days apart rather than a week apart, same Room
- **Checkpoint:** at least one real session completed with real payouts landing on-chain

## Phase 3 — Days 11–12 (Sep 15–16): Polish

- Load-test the socket layer under worse network conditions than a quiet office
- Design pass: countdown timer legibility, leaderboard animation, mobile-first layout
- Fix anything that broke during the real session(s) in Phase 2

## Phase 4 — Day 13 minus 1 (Sep 17): Submission prep

- Repo cleanup, MIT license, README, secret scan
- ≤250-word description, framed around whatever the Phase 1 scope decision landed on — avoid the words "wager" or "prediction" alone regardless
- Record a demo video from an actual live session, not a staged one
- **Checkpoint:** submission-ready with a buffer day left

## Phase 5 — Day 13 (Sep 18): Submit

- Final bug triage
- Submit through the portal

**Demo-day checkpoint (non-negotiable — must work 24 hours before submission, no matter what):**

1. Join a live session with a real deposit, answer questions, watch the leaderboard re-rank live
2. Session settles, top-N payout visibly fires on screen
3. The Room leaderboard shows evidence matching whatever the Phase 1 scope decision landed on (multi-session proof, or a single polished session)
