import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import config from '../training.config.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(root, 'output');
const target = join(process.env.DELIVER_DIR ?? join(homedir(), 'Desktop'), `${config.appName.replace(/[^A-Za-z0-9]+/g, '-')}-Training-Videos`);

/** Copies every video to the Desktop and merges them, in order, into one file. */
const files = readdirSync(output)
  .filter((f) => /^\d\d-.*\.mp4$/.test(f))
  .sort();
if (files.length === 0) {
  console.error('no videos in output/');
  process.exit(1);
}
mkdirSync(target, { recursive: true });
for (const file of files) {
  copyFileSync(join(output, file), join(target, file));
}
const list = join(output, 'concat.txt');
writeFileSync(list, files.map((f) => `file '${join(output, f).replace(/'/g, "'\\''")}'`).join('\n'));
const merged = join(target, 'ALL-VIDEOS.mp4');
const run = spawnSync(
  'bunx',
  ['remotion', 'ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-movflags', '+faststart', merged],
  { cwd: join(root, 'remotion'), stdio: 'inherit' },
);
if (run.status !== 0) {
  console.error('merge failed');
  process.exit(1);
}
console.log(`delivered ${files.length} videos + merged file to ${target}`);
