---
title: "Clutch Ledger: The Box Score Never Says Why the Game Mattered"
published: false
tags: devchallenge, weekendchallenge, javascript, webdev
---

*This is a submission for [Weekend Challenge: Passion Edition](https://dev.to/challenges/weekend-2026-07-09).*

## What I Built

Every sports app tracks the score. None of them track the reason you were on your feet in your living room over a regular season game.

Clutch Ledger is a basketball passion tracker. You log the moments that made a game personal: the matchup, your side, the push (the opponent, or whatever was pressing on you), what drove the moment (fire, joy, pride, nerves, or respect), the moment itself, and how hard it hit (intensity and stakes). The app plots every moment on a live court, scores the night, and reads your passion profile back to you.

Here is the part I actually care about: **the profile has to show its receipts.**

Plenty of apps will hand you a label like "you're a superfan!" from nothing. Clutch Ledger only claims a profile it can back with your own entries, and it shows the evidence right under the claim:

> **Rivalry Heat** — The opponent is the fuel. The moments that move you are the ones where the push has a name and every possession feels personal.
> - Fire drove 4 of 6 moments.
> - Average intensity 8.2/10, average stakes 7.5/10.
> - A named push shows up in 5 of 6 moments. The opponent is part of why it matters.

The profile is computed from the pattern of the ledger, not from a single score threshold. If no emotion dominates your night, it tells you that too, instead of forcing you into a box.

## Demo

Demo: https://dev-weekend-passion-clutch-ledger.vercel.app

Try it in this order:

1. Press the **+** button to load sample moments and watch the court light up.
2. Read **Tonight's profile** and the receipts under it.
3. Hit **Replay the night** — the app walks back through your moments in order, spotlighting each one on the court with the story of why it mattered.
4. Hit **Film room card** — it renders a shareable PNG card of your night (profile, score, emotion breakdown, top moment) straight from the ledger, entirely in your browser.

Then clear it and log a real one. Your data never leaves the page: everything lives in localStorage, there is no backend, no account, no tracking.

## Code

Repo: TODO

## How I Built It

Vanilla HTML, CSS, and JavaScript. No framework, no build step, no dependencies, no API keys. I wanted the whole thing to be inspectable in three files.

The pieces:

- **The court** is a single `<canvas>` render loop. Every logged moment gets a deterministic position and a pulse, colored by its emotional driver. During replay, the court dims everything except the active moment and draws the path of the night behind it.
- **The scoring** is simple on purpose: intensity and stakes are weighted, then adjusted by the emotion driving the moment (fire burns hotter than respect). Simple also means auditable — you can read the whole formula in `app.js` in under a minute.
- **The profile engine** counts what actually happened in your ledger: which emotion dominated, how heavy the average night was, whether your biggest moments had a named opponent. Each profile ships with the evidence lines that justify it. A profile the app can't back with your data is a profile it doesn't get to claim.
- **The film room card** is rendered fresh from the ledger every time by an offscreen canvas, so the shareable artifact can never disagree with the data behind it.

Honest limits, because a weekend build should say them: the scoring weights are heuristics, not science. Five emotions is a small vocabulary for what a rivalry game actually does to a person. And the ledger lives in one browser — there's no sync. Those are v2 problems.

## Prize Categories

No prize category technology was used. This is an entry for the overall Weekend Challenge.

## Why This Fits the Theme

The prompt asked for something inspired by passion: rivalry, team spirit, obsession, the things you can't engage with casually. Basketball is that for me — playing it, watching it, arguing about it. What I've never had is a record of *why* a specific night mattered, and the box score has never once explained it.

Clutch Ledger is my answer: not "I love this team," but the exact possession, the exact push, the exact pressure that made the game personal — written down, scored, and read back to me with receipts.
