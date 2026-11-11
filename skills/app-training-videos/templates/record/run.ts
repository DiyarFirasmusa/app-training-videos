import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { loadVideos } from './load.ts';
import config from '../training.config.ts';
import { ROOT, recordVideo } from './runner.ts';

const wanted = process.argv.slice(2);
const all = await loadVideos();
const todo = wanted.length === 0 ? all : all.filter((v) => wanted.some((w) => v.id === w || String(v.number) === w || v.id.startsWith(w.padStart(2, '0'))));
if (todo.length === 0) {
  console.error('no videos matched', wanted);
  process.exit(1);
}
const server = await config.startServer(Number(process.env.PORT ?? 3150));
const browser = await chromium.launch();
const summary: Array<{ id: string; ok: boolean; seconds?: number; error?: string }> = [];
try {
  for (const def of todo) {
    console.log(`recording ${def.id} (${def.steps.length} steps)`);
    const result = await recordVideo(def, browser, server.url);
    console.log(`  ${result.ok ? 'ok' : 'FAILED'} ${result.record?.duration ?? 0}s ${result.error ?? ''}`);
    summary.push({ id: def.id, ok: result.ok, seconds: result.record?.duration, error: result.error });
  }
} finally {
  await browser.close();
  server.stop();
}
writeFileSync(join(ROOT, 'recordings', `summary-${process.env.PORT ?? '3150'}.json`), JSON.stringify(summary, null, 2));
process.exit(summary.every((s) => s.ok) ? 0 : 2);
