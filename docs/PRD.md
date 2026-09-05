# Overtime — Product Requirements Document

## Problem Statement
Community groups — church youth groups, alumni networks, fan clubs, WhatsApp and Telegram communities — want a recurring shared ritual with real stakes, but nothing today gives them a hosted, fair, skill-scored way to run one. Ad hoc trivia via Google Forms or Kahoot has no stakes and no payout. The wager-style apps already in this exact competition (Nimiq Pools, TeTe) are single-session prediction/stakes tools, not built around a recurring community habit that a group owns week after week.

## Target User
- **Primary — Community/group hosts:** people who already run a WhatsApp group, alumni network, fan club, or similar, and want a weekly ritual with stakes for their existing group.
- **Secondary — Group members:** people who want a regular, competitive, social outlet inside a group they're already part of.

## Goals
1. Give a community a weekly live trivia/prediction "room" it owns and keeps coming back to.
2. Rank by accuracy and speed — skill, not chance — satisfying the competition's skill-based carve-out (chance-based gambling is explicitly disallowed).
3. Pay out to the top N finishers, not winner-take-all, so more people have a reason to keep playing.
4. Make it obviously NOT another wager/duel app on first look — the room and the weekly cadence are the product, not the bet.

## Non-Goals (explicitly out of scope for the demo)
- Multi-room tournament brackets or cross-room leaderboards
- Custom question-bank marketplace or user-submitted question moderation tooling
- Voice/video chat during sessions
- Push notification reminders
- USDT support at launch — NIM only; USDT is a stretch goal
- Spectator (non-participant) viewing mode

## User Stories

**MVP (must work for submission):**
1. As a host, I can create a Room (title, topic, weekly recurring schedule) for my group.
2. As a host, I can schedule a live Session with a question set and an entry fee in NIM.
3. As a participant, I can join a Session and pay the entry fee through my Nimiq Pay wallet.
4. As a participant, I see questions pushed live with a countdown timer and answer in real time.
5. As a participant, I see the leaderboard re-rank live as answers land.
6. As a host, when the session ends, the top N finishers are paid automatically from the pooled entry fees.
7. As a participant, I can see my Room's cumulative leaderboard across past weeks.
8. As a host, a session with fewer than a minimum threshold of entries doesn't go live — entry fees are refunded instead.

**Stretch:**
9. USDT support.
10. Host-customizable payout split (top 3 vs top 5, etc.) beyond a fixed default.
11. Auto-generated weekly question sets by topic.

## Success Metrics (tied to the actual judging criteria)
| Category | Points | Overtime target |
|---|---|---|
| Functionality, reliability & usefulness | 45 | Full join → play → live-rank → payout loop runs with zero dead ends; explicit differentiated framing (recurring, community-hosted, top-N split) so it never reads as "another wager game" |
| Nimiq Pay & Nimiq integration | 25 | NIM entry-fee collection plus automated top-N payout split at session close |
| Real usage | 15 | ≥4 live sessions run in the same Room before submission (proves the weekly-cadence claim), ≥20 unique participants, visible repeat participants across weeks |
| Design & UX | 10 | Live leaderboard re-ranks visibly within ~1 second of an answer; playable one-handed on mobile |
| Builder promotion | 5 | Recorded session clips shared as the natural weekly promotional content |
