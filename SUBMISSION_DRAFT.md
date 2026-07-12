---
title: "Clutch Receipts: A Take Is Just Talk Until the Game Scores It"
published: false
tags: devchallenge, weekendchallenge, javascript, webdev
---

*This is a submission for [Weekend Challenge: Passion Edition](https://dev.to/challenges/weekend-2026-07-09).*

## What I Built

NBA passion is not quiet. It shows up as takes, predictions, trash talk, player agendas, rivalry receipts, and the one thing every fan wants after the game:

> I called it before everyone else saw it.

Clutch Receipts is a no-login NBA fan tool for that loop. You lock a take, tag it, set your confidence, and after the game you mark whether it cashed, missed, landed half-right, or turned into shameless cope.

The app also has an optional transparent quarter model. If you want to follow a game with numbers, you can enter a tiny stat line after a quarter: points, FG%, and turnovers for each team. The model projects the next quarter and final margin, shows the formula it used, then grades itself when you enter later game data.

No hidden AI. No live feed. No accuracy theater. Receipts, not vibes.

## Demo

Demo: https://keniel13-ui.github.io/dev-weekend-passion-clutch-ledger/

Try it in this order:

1. Press the **+** button to load a sample NBA night.
2. Mark a take as cashed, missed, half-right, or shameless cope.
3. Read the receipt summary and hit rate.
4. Run the readable model with quarter stats and inspect the reasoning lines.
5. Hit **Receipt card** to generate a shareable PNG.

Everything runs in the browser with localStorage. There is no account, backend, API key, live data feed, or tracking.

## Code

Repo: https://github.com/keniel13-ui/dev-weekend-passion-clutch-ledger

## How I Built It

Vanilla HTML, CSS, and JavaScript. No framework, no build step, no dependencies.

The pieces:

- **The take engine** stores one-line fan takes with a type, confidence level, and result marker.
- **The receipt score** counts cashed takes as full credit and half-right takes as half credit, so the hit rate is simple and inspectable.
- **The readable model** uses a small heuristic: recent quarter margin, current margin, FG% edge, and turnover edge. The formula is shown in the app instead of hidden behind "the algorithm."
- **The grading loop** checks the model's next-quarter and final calls against the actual numbers the user enters later.
- **The receipt card** renders a PNG from the current ledger: hit rate, take results, best receipt, and model receipt if one exists.
- **The court** stays as the visual language, but now the dots represent receipt status: pending, cashed, half-right, missed, or cope.

The most important design choice was honesty. The model is not trained AI. It is not machine learning. It does not know real NBA history or fetch live data. It is a transparent heuristic a fan can argue with while watching the game.

That limitation is also the next obvious upgrade: API-backed stat import, so fans do not have to type quarter numbers manually. I kept that out of the weekend build because it needs a backend, keys, and more failure surface than this challenge window deserves.

## Prize Categories

No prize category technology was used. This is an entry for the overall Weekend Challenge.

## Why This Fits the Theme

The prompt asked for something inspired by passion: rivalry, team spirit, obsession, and the things people cannot engage with casually.

Basketball passion is not just "I love this team." It is calling the run before it happens, defending your player agenda, blaming the coach too early, keeping the receipts, and finding out after the game whether you were sharp or just loud.

Clutch Receipts turns that into a small tool: call it, grade it, and keep the receipt.
