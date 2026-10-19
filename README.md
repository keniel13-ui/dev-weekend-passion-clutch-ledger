# Clutch Receipts

A no-login NBA fan tool built fresh for DEV Weekend Challenge: Passion Edition.

Clutch Receipts lets a fan call one-line takes, mark whether they cashed, optionally run a transparent quarter model that grades itself against later game data, and generate a Gemini coach readback from the receipts. The point is receipts: a take is just talk until the game scores it.

Live demo: https://keniel13-ui.github.io/dev-weekend-passion-clutch-ledger/

## Features

- Lock one-line NBA takes with a tag and confidence level.
- Mark each take as pending, cashed, half-right, missed, or shameless cope.
- Optional readable quarter model using only manual points, FG%, and turnover inputs.
- Model receipts show the formula and later grade the call against actual next-quarter or final margins.
- Optional Google AI readback with Gemini. The user brings a Gemini API key for that request only; the key is not saved.
- Receipt card renders a shareable PNG with hit rate, best take, and model receipts.
- Animated court visualization maps pending, cashed, half-right, and missed receipts.
- Fully client-side. No account, backend, live feed, or tracking.

## Running locally

Open `index.html` in a browser.

No build step and no dependencies are required.

## Tests

```bash
node --test
```

Needs Node 20 or newer and nothing else. `test/app.test.js` runs `app.js` against a small fake DOM: the model formula and self-grading, saved-data recovery, HTML escaping, storage failures, the Gemini timeout, and that the Gemini key is never saved.

## Honesty Boundary

The model is a transparent heuristic, not trained AI or machine learning. It does not fetch NBA data. The user enters the numbers manually, and the app shows the math it used.

The Google AI feature is separate: Gemini does not make the prediction or grade the game. It reads the local receipt ledger and writes a short coach readback. The app uses a bring-your-own-key flow so no secret is shipped in the static site.

## Where This Goes Next

The real v2 upgrade is data import: a clean way to pull live or post-game NBA stats so fans do not have to type quarter numbers by hand. That needs an API/backend and is intentionally out of scope for this weekend build.

## Challenge Fit

The challenge theme is passion. This project treats NBA passion as takes, rivalry talk, predictions, and the need to prove what you called before the result was obvious.

## Post-deadline note

If any commits are made after the challenge deadline, they should be listed here before submission, per the challenge rules.

- 2026-10-19 (after the published submission): reliability, safety and accessibility fixes with no feature changes. Saved data is checked on load, storage failures no longer break the app, whitespace-only takes are rejected, the Gemini request times out after 45 seconds, long text no longer runs off the receipt card, Clear and the sample night ask before replacing receipts, plus screen reader labels, reduced-motion support, and tests.
