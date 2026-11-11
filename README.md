# app-training-videos

A Claude Code skill that makes **narration-free training videos for any web app**: it records the real UI with Playwright against a fake in-memory backend, then Remotion draws a highlight ring, an arrow callout with a step badge, tips and warnings, zoom, a progress bar, a "what you learned" card and an outro. You get one 1080p MP4 per task, a merged video, a written guide with screenshots, and a playlist. Works with the sound off. Arabic (RTL) and English are built in; add a language in two small files.

## Install

Pick one.

```bash
# 1. Any agent that supports the skills CLI
npx skills add DiyarFirasmusa/app-training-videos

# 2. Claude Code plugin
#    inside Claude Code:
/plugin marketplace add DiyarFirasmusa/app-training-videos
/plugin install app-training-videos@diyar-skills

# 3. Plain copy into your personal skills folder (works everywhere)
mkdir -p ~/.claude/skills && curl -sL https://github.com/DiyarFirasmusa/app-training-videos/archive/refs/heads/main.tar.gz \
  | tar -xz --strip-components=2 -C ~/.claude/skills app-training-videos-main/skills/app-training-videos
```

## Use

Open Claude Code in your project and say, for example:

> Make training videos for the users of this app, in Arabic. Use the app-training-videos skill.

The skill sets up `training-video/` in the project, reads your routes and API, builds a fake backend from them, writes one video per task, records, checks, renders, and puts the videos plus one merged video in `~/Desktop/<app>-Training-Videos/`.

Needs: Node 24+ (runs TypeScript directly), bun or npm, Playwright's Chromium (installed by the setup script), Internet access to fetch the Cairo font while rendering.

## What makes it cheap

It was extracted from a run that made 18 videos and was far too expensive. The skill encodes the fixes: no sub-agents for authoring, pages read as text (`tools/aria.ts`) instead of screenshots, automated checks before looking at anything (`tools/check.ts`), one small overview image per video, fast recording with the reading time added at render time (about 3x faster), and a render cache that skips unchanged videos.

## Safety

Only fake data and a mocked API. The recorder never contacts a real backend and never uses real credentials. Nothing is committed or pushed by the toolkit.

MIT licensed.
