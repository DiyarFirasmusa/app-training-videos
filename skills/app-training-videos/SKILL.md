---
name: app-training-videos
description: Make narration-free training videos for any web app, in any language (Arabic RTL tested). Records the real UI against a fake in-memory backend with Playwright, then renders callouts, highlights, step badges, zoom, summary cards and a merged video with Remotion. Use when the user asks for training/tutorial/onboarding/demo videos or a user guide with screenshots for a web project, or says "make videos that explain my system".
---

# App training videos

Turns a web app into a series of short on-screen-text videos (one per task, 2-6 min, 1080p, no audio), plus a written guide, a playlist, and one merged video. No voice: every explanation is a callout beside the element, so the video works with the sound off.

Everything runs against **fake data**: the dev server starts alone, Playwright answers every API call from a mock. Never contact a real backend, never use real credentials, never commit or push unless the user asks.

## Work this way (it keeps tokens and time low)

These rules come from a first run that was far too expensive. Follow them.

1. **Do not spawn sub-agents to write videos.** Each one re-reads the same files and re-learns the same traps; four of them cost over a million tokens. Read the app once, write all the video files yourself.
2. **Read pages as text, not pictures.** `node tools/aria.ts <role> /path` prints the accessible names a step needs. Look at an image only when `check.ts` is clean, and then only at `frames/<id>/overview.jpg` (all steps of a video in one small image).
3. **Record fast.** The recorder does the actions in about a third of the time; the renderer freezes the frame for the reading time. `REALTIME=1` forces real-time waiting (almost never needed).
4. **Run one recording at a time** on one warmed dev server. Parallel recordings fought over the CPU and the Vite cache and produced timeouts and page reloads (every one was re-recorded).
5. **Render once, at the end.** `render.ts` skips videos whose steps, recording and overlay code did not change (`--force` overrides). Decide visual changes (zoom, colours) before the first full render; a change to `remotion/src` re-renders everything.
6. **Check before you look.** `node tools/check.ts` flags stopped recordings, unmocked requests, text over the limits and steps too short to read.

## Steps

1. **Set up** (once per project): `bash <skill-dir>/scripts/setup.sh` from the project root. It copies the toolkit into `training-video/` and installs Playwright and Remotion.
2. **Understand the app.** Read the routes/pages, roles and permissions, forms, and the API calls (OpenAPI spec or the service layer). Write `training-video/PLAN.md`: who watches, the roles, and one video per main task in the order a new user needs: intro, sign-in and tour, each daily task, reading data, administration, common mistakes, getting help. Do not invent features; if the app lacks a screen, say so in the video and in `ISSUES.md`.
3. **Configure** `training-video/training.config.ts`: app name, language (`ar` or `en`), locale, the dev-server command and the env var that points the app's API at a fake host, sign-in for each role, `noHmrSocket: true` for Vite apps.
4. **Build the mock** in `training-video/mock/`: seed 20-50 realistic records per big resource (names, IDs, phones, dates in the app's language); one handler per endpoint, shaped exactly like the real API (field names, paging, error bodies); mutations change the store; plus error scenarios for the mistakes video (`faults`). Derive everything from the code or spec; ask or note anything undocumented.
5. **Write the videos** (`videos/NN-slug.ts`) following `videos/AUTHORING.md`. Text rules: title at most 6 words, text at most two short lines, optional tip and warning.
6. **Record and check** each video: `PORT=3150 node record/run.ts NN`, then `node tools/check.ts`. Fix the definition or the mock and re-record until clean.
7. **Render:** `node tools/render.ts` (all) or `node tools/render.ts NN`. Then `node tools/frames.ts` and look at each `frames/<id>/overview.jpg`: the callout is beside the right element, nothing overlaps, Arabic/English text is not cut, data looks real.
8. **Deliver:** `node tools/make-all.ts` runs record, scripts, render, frames, guide, playlist and deliver; or run `scripts-md`, `guide`, `playlist`, `deliver` alone. `deliver` copies the videos to `~/Desktop/<app>-Training-Videos/` and merges them into `ALL-VIDEOS.mp4` (`DELIVER_DIR` changes the folder).
9. Write `training-video/README.md` (the one command to redo everything), `ASSUMPTIONS.md` (choices made without asking) and `ISSUES.md` (what failed or was left out). Report in a few lines: what was produced, what failed, what you assumed.

## Notes

- Remotion renders with its own headless Chrome. If it crashes (GPU process exits, common when the path has spaces or brackets), `render.ts` falls back to the Playwright Chromium; `REMOTION_BROWSER=/path/to/chrome-headless-shell` overrides it.
- The font is fetched from Google Fonts at render time (Cairo, Arabic + Latin).
- Add more languages in `remotion/src/labels.ts` and `tools/text.ts`.
- A recording of a real-time app is wall-clock based; if the machine is overloaded steps can time out. Close other heavy work and retry before changing the script.
