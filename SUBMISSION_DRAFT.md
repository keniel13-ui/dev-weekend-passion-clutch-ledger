---
title: "Clutch Receipts: A Take Is Just Talk Until the Game Scores It"
published: true
tags: devchallenge, weekendchallenge, javascript, webdev
---

*This is a submission for [Weekend Challenge: Passion Edition](https://dev.to/challenges/weekend-2026-07-09).*

Published: https://dev.to/kenielzep97/clutch-receipts-a-take-is-just-talk-until-the-game-scores-it-28jf

I built this because of one night.

Me and my childhood friends have watched and played ball our whole lives, and the real game between us has always been who called it right. [Game 4 of the 2026 Finals](https://apnews.com/article/ba83cdcb98f92d0c9fffd32a5745c97c), the Spurs had been up as much as 29. I'm not going to tell you I called a comeback from the bottom of that hole. What I called was the run. Basketball is a game of runs, and when the lead started to shrink and the Knicks got theirs going, you could feel the game tilt. That's when I told the boys the Spurs weren't holding this one. It wasn't hope, it was a read: the Knicks had already beaten this Spurs team in the [NBA Cup](https://www.washingtonpost.com/sports/2025/12/17/knicks-spurs-nba-cup-championship/), they had the veterans who stay locked in when a game actually matters, and San Antonio was one of the youngest teams ever to reach a Finals. Young legs build leads. Veterans and pressure take them back.

The Knicks came all the way back and won it, the largest comeback in Finals history. I got to watch my read play out in real time, out loud, in front of the people who swore it was over.

That is the whole feeling this is built on. Not luck, not noise, but calling the turn before it finished turning and having something to point at when you were right. The problem is that feeling never lasts. The take gets buried in a group chat that scrolls right past it, and by next week nobody remembers who said it first. So I wanted the receipt. Something that holds the take still long enough for the game to answer it, and keeps the proof when it does.

## What I Built

Clutch Receipts is a no-login, local-first NBA fan tool for locking takes before the game settles them. You write the take, tag it, set your confidence, and after the game you mark the result: cashed, missed, half-right, or shameless cope.

It also has an optional transparent quarter projection model. If you want to follow a game with numbers, you enter a small stat line after a quarter (points, FG%, and turnovers for each team). The model projects the next quarter and the final margin, shows the exact formula it used, then grades itself when you enter the real numbers later.

It now has an optional Google AI layer too: Gemini can read the local receipt ledger and generate a short coach readback. The important boundary is that Gemini does not make the prediction or grade the game. The model stays transparent; Gemini summarizes the receipts.

No hidden prediction model. No live feed. No accuracy theater. Receipts, not vibes.

## Demo

Demo: https://keniel13-ui.github.io/dev-weekend-passion-clutch-ledger/

![Screenshot of the Clutch Receipts app showing NBA take tracking, receipt status buttons, and a quarter projection model](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/cjrysksbvssv4zfcwyeu.jpeg)

Try it in this order:

1. Press the **+** button to load a sample NBA night.
2. Mark a take as cashed, missed, half-right, or shameless cope.
3. Read the receipt summary and hit rate.
4. Run the quarter projection model and inspect the reasoning lines.
5. Optional: paste a Gemini API key and generate the coach readback.
6. Hit **Receipt card** to generate a shareable PNG.

Everything runs in the browser with localStorage. No account, backend, live data feed, or tracking. The Gemini feature uses a bring-your-own-key flow for that request only, so no API secret is shipped in the static site.

## Code

Repo: https://github.com/keniel13-ui/dev-weekend-passion-clutch-ledger

## How I Built It

Vanilla HTML, CSS, and JavaScript. No framework, no build step, no dependencies, no backend.

The pieces:

- **The take engine** stores one-line fan takes with a type, confidence level, and a mutable result marker in localStorage.
- **The receipt score** counts cashed takes as full credit and half-right takes as half credit, so the hit rate stays simple and inspectable.
- **The projection model** is a deterministic heuristic on recent quarter margin, current margin, FG% edge, and turnover edge. The exact formula renders in the UI, so a fan can argue with the math in real time.
- **The grading loop** checks the model's next-quarter and final calls against the actual numbers you enter later.
- **The Google AI readback** sends the local receipt summary to Gemini and asks for a short coach readback: what kind of fan you were, what you got right, where you were coping, and one sharper next-game take.
- **The receipt card** uses the canvas API to turn the current ledger (hit rate, results, best take) into a downloadable PNG.
- **The court** stays as the visual metaphor, but the dots now represent receipt status: pending, cashed, half-right, missed, or cope.

The most important choice was honesty. The projection model is not trained AI or machine learning. It does not know real NBA history or fetch live data. It is a transparent heuristic you can read and argue with while the game is on. Gemini is deliberately kept in the readback lane: it explains the receipt, it does not pretend to be the scoreboard.

## What I'd Add Next

The obvious next version is API-backed stat import, so fans don't have to type quarter numbers by hand. After that, private friend groups and season-long receipt boards, so a group can actually track who calls games right over time.

I kept those out of this build on purpose. The weekend rewarded one complete, honest loop over a bigger unfinished idea.

## Prize Categories

This submission now includes **Google AI** through the optional Gemini coach readback. I kept the prediction model separate and transparent on purpose: Google AI is used for the language readback over the user's receipts, not for pretending a black-box model can predict the game.

## Why This Fits the Theme

The prompt asked for something inspired by passion: rivalry, obsession, the things people can't engage with casually.

Basketball passion is not just "I love this team." It's calling the run before it happens, defending your player agenda, blaming the coach too early, keeping the receipts on your rival, and finding out after the game whether you were sharp or just loud.

Clutch Receipts turns that into a small tool. Call it, grade it, keep the receipt.
