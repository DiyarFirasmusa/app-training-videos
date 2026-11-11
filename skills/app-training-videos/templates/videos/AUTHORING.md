# How to write and record a video definition

One file per video: `videos/NN-slug.ts`, default export `defineVideo({...})` (every field is in `record/types.ts`). `videos/01-example.ts` is the pattern.

## Rules that never change

- **No real backend, no real data.** Only the dev server runs; `mock/` answers every API call. Fake names, IDs, phones, passwords. Never call a production URL, never use real credentials.
- Keep everything inside `training-video/`. Do not edit the app. Do not commit or push unless the user asks.
- An unmocked request is answered with 501 and logged to `ISSUES.md`. Add the endpoint to the mock; do not hide it.

## Text (the viewer has no sound)

- `title`: at most 6 words (an action or a name). `text`: at most two short lines (about 70 characters). Use the app's own labels exactly as shown on screen.
- `tip` (green) / `warn` (red): optional, one short line, only where a real beginner mistake happens.
- First step: no target (welcome card). Last step: show the result.
- 12 to 26 steps per video (2 to 6 minutes). Reading time is added by the renderer: `max(3 s, words / 2.5 + 1 s)`. Add `extraHold` for a busy screen.
- `learn`: 3 to 6 bullets for the summary card. `subtitle`: one line. `chapter`: the group name.

## Step mechanics

- `target: (page) => Locator`, preferably `getByRole`/`getByLabel`/`getByText` with the visible name. Read the names with `node tools/aria.ts <role> /path` (text, cheap) instead of taking screenshots.
- `act`: `'click'` (default with a target), `'hover'`, `'none'`, `{ fill: 'text' }`, `{ type }`, or `(h, target) => ...` with the helpers in `record/helpers.ts` (`h.click`, `h.fill`, `h.pick(trigger, option, search?)` for dropdowns, `h.goto`, `h.page`, `h.mock`).
- A click happens at the end of the reading time (right when the page changes). If the click opens something (menu, popover, dialog) use `clickAt: 'early'` and `avoid: popup` so the viewer sees it and the callout stays clear.
- Close menus before the next step with `before: press('Escape')` (from `define.ts`).
- `before(h)` runs unseen before the step (navigate, wait). `prepare(h)` runs once before the recording (set up data, switch on a fault: `h.mock`). The mock is reset before every video.
- `side` is a preference for where the callout goes (physical `left`/`right`/`top`/`bottom`; the renderer moves it if it would cover the target). Point at a small element, not a whole table. `area` highlights a bigger region while the cursor goes to `target`.
- `role` is passed to `signIn` in `training.config.ts`. Use the role that really has the permission; a 403 inside a how-to is a bug in the script.

## Record and check (cheap loop)

```bash
npm run typecheck
PORT=3150 node record/run.ts NN      # one video; recording is fast (reading time is added when rendering)
node tools/check.ts                  # text length, step time, stopped recordings, unmocked requests
```

Look at pictures only when `check.ts` is clean, and then only at `frames/<id>/overview.jpg` (every step in one small image) after `node tools/frames.ts NN`; open a `sheet-NN.jpg` only for a step that looks wrong. If a video cannot be finished after two re-record rounds on the same blocker, cut the failing steps, keep the working part, and write one line in `ISSUES.md`.
