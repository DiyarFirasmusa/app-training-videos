import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { CHAPTER_S, buildTimeline } from '../remotion/src/timeline.ts';
import type { VideoData } from '../remotion/src/types.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

interface Step {
  index: number;
  title: string;
  tStart: number;
  tEnd: number;
  tClick: number | null;
}

const ffmpeg = (args: string[]): boolean => {
  const run = spawnSync('bunx', ['remotion', 'ffmpeg', '-y', '-loglevel', 'error', ...args], {
    cwd: join(root, 'remotion'),
    encoding: 'utf8',
  });
  if (run.status !== 0) {
    console.error(run.stderr);
  }
  return run.status === 0;
};

/** One frame per step (as seen in the finished MP4), plus 2x2 contact sheets for review. */
const extract = async (id: string): Promise<void> => {
  const meta = JSON.parse(readFileSync(join(root, 'recordings', id, 'steps.json'), 'utf8')) as { steps: Step[] };
  const mp4 = join(root, 'output', `${id}.mp4`);
  if (!existsSync(mp4)) {
    console.error(`missing ${mp4}`);
    return;
  }
  const dir = join(root, 'frames', id);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const timeline = buildTimeline(meta as unknown as VideoData);
  const stamps: number[] = [];
  for (const [i, window] of timeline.windows.entries()) {
    const step = meta.steps[i]!;
    const span = window.outEnd - window.outStart;
    const early = step.tClick !== null && step.tClick - step.tStart < (step.tEnd - step.tStart) * 0.8;
    const at = early ? window.outEnd - Math.min(0.9, span * 0.2) : window.outStart + Math.min(1.8, span * 0.6);
    stamps.push(CHAPTER_S + at);
  }
  stamps.push(1.8);
  for (const [i, at] of stamps.entries()) {
    const name = i === stamps.length - 1 ? 'chapter' : String(i + 1).padStart(2, '0');
    ffmpeg(['-ss', at.toFixed(2), '-i', mp4, '-frames:v', '1', '-q:v', '3', join(dir, `${name}.jpg`)]);
  }
  const jpgs = readdirSync(dir).filter((f) => /^\d\d\.jpg$/.test(f)).sort();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  for (let i = 0; i < jpgs.length; i += 4) {
    const group = jpgs.slice(i, i + 4);
    const cells = group
      .map((f) => `<img src="${f}" style="width:960px;height:540px;display:block">`)
      .join('');
    const html = join(dir, 'sheet.html');
    writeFileSync(html, `<body style="margin:0;display:grid;grid-template-columns:960px 960px;background:#000">${cells}</body>`);
    await page.goto(pathToFileURL(html).href);
    await page.waitForLoadState('load');
    await page.screenshot({ path: join(dir, `sheet-${String(i / 4 + 1).padStart(2, '0')}.jpg`), type: 'jpeg', quality: 88 });
  }
  const cells = jpgs.map((f) => `<img src="${f}" style="width:320px;height:180px;display:block">`).join('');
  const overview = join(dir, 'overview.html');
  writeFileSync(overview, `<body style="margin:0;display:grid;grid-template-columns:repeat(6,320px);background:#000">${cells}</body>`);
  await page.setViewportSize({ width: 1920, height: Math.ceil(jpgs.length / 6) * 180 });
  await page.goto(pathToFileURL(overview).href);
  await page.waitForLoadState('load');
  await page.screenshot({ path: join(dir, 'overview.jpg'), type: 'jpeg', quality: 85 });
  rmSync(overview, { force: true });
  await browser.close();
  rmSync(join(dir, 'sheet.html'), { force: true });
  console.log(`frames ${id}: ${jpgs.length} steps in ${dir}`);
};

const wanted = process.argv.slice(2);
const ids = readdirSync(join(root, 'output'))
  .filter((f) => f.endsWith('.mp4'))
  .map((f) => f.replace(/\.mp4$/, ''))
  .filter((id) => wanted.length === 0 || wanted.some((w) => id.startsWith(w)));
for (const id of ids) {
  await extract(id);
}
