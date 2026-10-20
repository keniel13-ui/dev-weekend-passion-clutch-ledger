# CLAUDE.md

Clutch Receipts is a static, dependency-free web app (DEV Weekend Challenge: Passion Edition). Three files do
everything: `index.html` (markup), `styles.css`, `app.js` (state, rendering, canvas, quarter model, Gemini call).
It is published on GitHub Pages; there is no build step and no backend.

## How it works
- All state lives in one object saved to `localStorage["clutch-receipts-v1"]`. `normalizeState()` cleans whatever
  is loaded; `render()` redraws everything and saves. Keep that single flow.
- The quarter model (`projectFromQuarter`, `gradeModelCalls`) is a visible heuristic. Do not change the weights or
  grading thresholds without the author: the published DEV post (`SUBMISSION_DRAFT.md`) describes this model and the UI shows the exact formula.
- Gemini is optional and bring-your-own-key. The key goes only in the `x-goog-api-key` header and must never be
  stored. Its reply is rendered with `textContent`.

## Rules
- Any user or saved text inserted with `innerHTML` goes through `escapeHtml`. Prefer `textContent`.
- No dependencies, no bundler. Plain browser JS.
- Post-deadline changes are listed in the README "Post-deadline note" (challenge rule).

## Commands
```bash
node --check app.js   # syntax
node --test           # test/app.test.js, fake DOM, no browser or network
open index.html       # run it (macOS); any static server works too
```
