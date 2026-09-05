# Overtime — Risks

Top technical risks that could break the live demo, and what to show instead if each one hits.

## 1. WebSocket connection breaks under venue wifi
Real-time leaderboard push depends on a stable socket connection, and conference/venue wifi is often the least reliable network in the building.
**Fallback:** A pre-recorded clip of a full live session, plus a "replay" mode that steps through pre-computed results without needing a live socket connection at all.

## 2. Question timing/sync issues across devices
If questions don't advance in sync across multiple screens, the "live" feeling breaks immediately.
**Fallback:** A single-screen demo mode where the host controls pacing manually on one shared display, instead of relying on push-synced timers across several devices.

## 3. Entry-fee payment approval friction during a live, multi-participant demo
Same underlying risk as TurnUp's deposit flow — native approval dialogs can stall, especially with several people approving at once.
**Fallback:** Pre-authenticated, warmed-up devices for every demo participant, plus a short recorded backup clip of a successful join-and-pay flow.

## 4. Payout settlement lags or fails right at session end
The moment everyone's watching is the payout — if the settlement transaction is slow, the demo can go quiet at the worst time.
**Fallback:** Compute and display the final leaderboard and payout amounts on screen immediately (this is deterministic and doesn't need to wait on-chain), narrate that on-chain settlement follows automatically, and have a transaction hash from an earlier dry run ready to show as proof it works.

## 5. Low live turnout during the actual demo
Fewer real participants show up live than expected, and a leaderboard with two entries doesn't sell the "room" concept.
**Fallback:** Seed the room with a few team-controlled test accounts ahead of time so the leaderboard always looks alive, and say so plainly if asked ("this is our test squad filling out the room") rather than implying they're real outside participants.
