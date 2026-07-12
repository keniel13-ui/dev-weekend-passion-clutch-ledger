---
title: Clutch Ledger: A Passion Tracker for the Games You Cannot Watch Casually
published: false
tags: devchallenge, weekendchallenge, javascript, webdev
---

*This is a submission for [Weekend Challenge: Passion Edition](https://dev.to/challenges/weekend-2026-07-09).*

## What I Built

Clutch Ledger is a basketball passion tracker. It is for the games, rivalries, pickup runs, and coaching moments you cannot watch casually.

You log a moment with:

- the matchup or passion lane
- your side and the opponent/push
- what drove the moment: fire, joy, pride, nerves, or respect
- the actual moment
- intensity and stakes

The app turns those entries into a live court visualization, a passion score, and a profile for the night.

## Demo

Demo link: TODO

Open the app, press the plus button to load sample moments, or log your own game moment. The court updates immediately. The ledger stays local in the browser through localStorage.

## Code

Repo: TODO

The app is intentionally small: HTML, CSS, and vanilla JavaScript. No build step and no external dependencies.

## How I Built It

I wanted the app to feel like a tool a fan, player, or coach could actually use during a heated night, not a landing page about passion. The first screen is the working interface: court, score, profile, and the log form.

The core mechanic is simple:

1. Each logged moment gets a score from intensity, stakes, and the chosen emotion.
2. The average moment score becomes the overall Passion Score.
3. The score maps to a profile such as Rivalry Heat, Team Devotion, Game Joy, or Obsession Mode.
4. Every moment is plotted on a canvas court with a color tied to its emotional driver.

The data never leaves the browser. Entries are stored in localStorage, and the export button gives the user raw JSON if they want to keep or share their ledger.

## Prize Categories

No prize category technology was used. This submission is for the overall Weekend Challenge.

## Why This Fits the Theme

The prompt asked for something inspired by passion: rivalry, team spirit, devotion, hobbies, and the things people love enough to track. Basketball is that for me. Clutch Ledger turns that feeling into a small usable tool: not just "I love this team," but the exact possession, opponent, pressure, and emotion that made the game matter.
