import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { cpus } from 'node:os';
import { findBrowser } from './browser.ts';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const recordings = join(root, 'recordings');
const output = join(root, 'output');
const remotionDir = join(root, 'remotion');

interface Meta {
  id: string;
  number: number;
  title: string;
}

const plannedCount = (): number =>
  readdirSync(join(root, 'videos')).filter((f) => /^\d\d-.*\.ts$/.test(f)).length;

const loadAll = (): { id: string; data: Meta & Record<string, unknown> }[] =>
  readdirSync(recordings)
    .filter((d) => existsSync(join(recordings, d, 'steps.json')))
    .map((id) => ({ id, data: JSON.parse(readFileSync(join(recordings, id, 'steps.json'), 'utf8')) }))
    .sort((a, b) => a.data.number - b.data.number);

/** Hash of everything that changes a video: its steps, its recording and the overlay code. */
const fingerprint = (id: string): string => {
  const hash = createHash('sha1');
  hash.update(readFileSync(join(recordings, id, 'steps.json')));
  hash.update(String(statSync(join(recordings, id, 'raw.webm')).size));
  const walk = (dir: string): void => {
    for (const name of readdirSync(dir).sort()) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) {
        walk(path);
      } else {
        hash.update(readFileSync(path));
      }
    }
  };
  walk(join(remotionDir, 'src'));
  return hash.digest('hex');
};

const force = process.argv.includes('--force');
const wanted = process.argv.slice(2).filter((a) => a !== '--force');
const browser = findBrowser();
const all = loadAll();
const total = plannedCount();
mkdirSync(output, { recursive: true });

const failures: string[] = [];
for (const [i, item] of all.entries()) {
  if (wanted.length > 0 && !wanted.some((w) => item.id.startsWith(w) || String(item.data.number) === w)) {
    continue;
  }
  const next = all[i + 1]?.data.title ?? null;
  const propsFile = join(recordings, item.id, 'props.json');
  writeFileSync(propsFile, JSON.stringify({ data: item.data, nextTitle: next, totalVideos: total }));
  const out = join(output, `${item.id}.mp4`);
  const stamp = join(recordings, item.id, 'rendered.sha');
  const print = fingerprint(item.id);
  if (!force && existsSync(out) && existsSync(stamp) && readFileSync(stamp, 'utf8') === print) {
    console.log(`skip ${item.id} (unchanged)`);
    continue;
  }
  console.log(`render ${item.id}`);
  const run = spawnSync(
    'bunx',
    ['remotion', 'render', 'src/index.ts', 'Training', out, `--props=${propsFile}`, `--public-dir=${recordings}`, '--log=warn', `--concurrency=${Math.max(2, cpus().length - 2)}`, ...(browser ? [`--browser-executable=${browser}`] : [])],
    { cwd: remotionDir, stdio: 'inherit' },
  );
  if (run.status === 0) {
    writeFileSync(stamp, print);
  } else {
    failures.push(item.id);
    console.error(`FAILED ${item.id}`);
  }
}
if (failures.length > 0) {
  console.error(`render failures: ${failures.join(', ')}`);
  process.exit(1);
}
