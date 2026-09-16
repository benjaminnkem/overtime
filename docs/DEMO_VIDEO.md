# Overtime — Demo Video Guide

A shot-by-shot script for the submission demo video. Target runtime is **90 seconds**
(a shorter 60s cut is marked inline) — check the hackathon portal for an exact cap and
trim to fit if it specifies one. Built on the beats already agreed in
[`docs/PITCH.md`](PITCH.md) (the leaderboard flip is the moment to lead with) and the
fallbacks in [`docs/RISKS.md`](RISKS.md) if anything misbehaves on the day.

## Before you record

- [ ] Seed the Room with a few of your own accounts so the leaderboard has 4-5 entries,
      not 2. It's fine that they're your own — just don't claim otherwise if asked.
- [ ] Warm up every wallet/device beforehand (open the app, get past any first-load
      lag) so nothing stalls on camera.
- [ ] Pick **one** real Room/Session to record in a single continuous pass if you can —
      cutting between different sessions is fine too, but one real run is more
      convincing than a patchwork.
- [ ] Close Slack/notifications, hide your dock, full-screen the browser.
- [ ] Decide narration style: voiceover recorded separately (cleaner audio, easier to
      redo a flubbed line) beats talking live while clicking. Record the screen
      capture and voiceover as two separate passes and sync them in the edit.

**One honesty note:** don't narrate the payout as "landing on-chain live" — the
settlement math and leaderboard are real and instant, but real payout transactions are
currently blocked by the `@nimiq/core` Node.js bug documented in
[`docs/ARCHITECTURE.md`](ARCHITECTURE.md). Showing the computed leaderboard and payout
split at settlement is accurate and still lands well; save the bug explanation for
written submission material and judge Q&A, not the video's narration.

## Shot list + script

### 0:00–0:08 — Hook (talking head or voiceover over a dark title card)

**Shot:** Either you on camera, or the `OVERTIME` title card / opening screen of the
app, static.

**Script:**
> "Every group chat has that friend who says 'I'd win' every time trivia comes up.
> Overtime turns that into an actual weekly event — with real stakes."

### 0:08–0:20 — Create a Room (host flow)

**Shot:** Screen recording. Land on the homepage, fill in wallet address / room title /
topic, hit Create Room. Cut on the moment the room page loads.

**Script:**
> "A host spins up a Room for their group in seconds — this is ours, running live
> right now."

### 0:20–0:32 — Schedule a Session

**Shot:** On the room page, scroll to Schedule a Session. Show the entry fee and a
question being typed in — don't type the whole form on camera, speed this part up in
the edit (2x) or jump-cut straight to a completed form, then hit Schedule Session.

**Script:**
> "The host sets an entry fee in NIM and a question set, and schedules it. That's the
> whole setup."

### 0:32–0:44 — Join + pay the entry fee

**Shot:** From a second device or browser profile, open the session, tap Join, and show
the Nimiq Pay wallet approval prompt (this may need to be a phone camera shot of the
actual wallet app if the approval dialog is native and doesn't show cleanly in a screen
recording).

**Script:**
> "Everyone joins with a small entry fee, paid straight through their Nimiq Pay
> wallet — no separate signup."

*(60s cut: trim this shot to a quick 4-second cutaway instead of the full approval
flow.)*

### 0:44–1:05 — THE moment: live question + leaderboard flip

**Shot:** This is the centerpiece — give it the most screen time. Show a question
going live with the countdown visibly ticking, an answer being tapped, and then the
leaderboard re-ranking — ideally catch someone jumping rank live. If you can run this
with 2-3 real participants answering at different speeds, the rank shuffle sells
itself; if solo, answer from two devices back to back so the reorder is visible.

**Script:**
> "Questions go out live with a countdown. Answers are timestamped the instant they
> land, server-side — and watch the leaderboard: it re-ranks in real time as people
> answer."
>
> *(pause narration here for 2-3 seconds — let the re-rank animation speak for
> itself)*

### 1:05–1:18 — Settlement / payout split

**Shot:** Trigger settle (host-only control), show the final leaderboard with rank and
payout amount per person.

**Script:**
> "When the session ends, the pooled entry fees split automatically across the top
> finishers — ranked by accuracy and speed, not luck."

### 1:18–1:28 — Cumulative Room leaderboard

**Shot:** Scroll up to the Room's cumulative leaderboard showing standings across
sessions (run at least 2 sessions beforehand so this isn't empty).

**Script:**
> "And the Room remembers — a running leaderboard across every session, so there's a
> reason to come back next week."

### 1:28–1:35 — Close

**Shot:** Back to the title card, or a wide shot of the leaderboard mid-animation.

**Script:**
> "That's Overtime — your group chat's trivia debates, as a weekly event with real
> stakes."

## 60-second cut (if the portal caps it shorter)

Keep: Hook (trim to 5s) → Live question + leaderboard flip (keep full, it's the
centerpiece) → Settlement (trim to 6s) → Close (trim to 5s). Cut: the room-creation and
join shots — summarize both in one voiceover line laid over a fast-forwarded (3-4x)
montage of the setup screens instead of showing each step in real time.

## Recording setup

- **Screen capture:** QuickTime Player → File → New Screen Recording (Mac), or the
  Browser pane here if you want me to drive a specific shot for you.
- **Wallet approval dialogs:** if Nimiq Pay's native approval doesn't render inside a
  browser screen recording, shoot that one moment on your phone camera pointed at the
  screen, then splice it in.
- **Audio:** record narration separately in a quiet room; a phone voice memo is fine,
  it'll sound better than live mic-over-clicking audio.
- **Captions:** burn in captions for the key lines — most people watch muted on their
  first pass through a hackathon submissions queue.

## Editing

Once you've got the raw clips (screen recordings, any phone footage, voiceover), send
them my way and I can assemble the cut with `ffmpeg` — trims, concatenation, text
overlays/captions, and a final export — entirely from the command line, no DaVinci
Resolve needed. Tell me the file locations and roughly which take goes where and I'll
build it.
