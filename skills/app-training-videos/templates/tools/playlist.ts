import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { text } from './text.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

interface Meta {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  learn: string[];
  steps: unknown[];
}

const seconds = (file: string): number => {
  const run = spawnSync(
    'bunx',
    ['remotion', 'ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file],
    { cwd: join(root, 'remotion'), encoding: 'utf8' },
  );
  return Number.parseFloat(run.stdout.trim()) || 0;
};

const clock = (total: number): string => {
  const m = Math.floor(total / 60);
  const s = Math.round(total % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
};

const metas: Meta[] = readdirSync(join(root, 'recordings'))
  .filter((d) => existsSync(join(root, 'recordings', d, 'steps.json')))
  .map((d) => JSON.parse(readFileSync(join(root, 'recordings', d, 'steps.json'), 'utf8')) as Meta)
  .sort((a, b) => a.number - b.number);

const rows: string[] = [];
let sum = 0;
for (const meta of metas) {
  const file = join(root, 'output', `${meta.id}.mp4`);
  if (!existsSync(file)) {
    continue;
  }
  const length = seconds(file);
  sum += length;
  rows.push(
    `| ${String(meta.number).padStart(2, '0')} | [${meta.title}](output/${meta.id}.mp4) | ${clock(length)} | ${meta.steps.length} | ${meta.subtitle}; ${meta.learn.join(', ')} |`,
  );
}
const out = [
  `# ${text.playlist}`,
  '',
  text.playlistIntro,
  '',
  `| ${text.columns.join(' | ')} |`,
  '|---|---|---|---|---|',
  ...rows,
  '',
  text.total(rows.length, clock(sum)),
  '',
].join('\n');
writeFileSync(join(root, 'playlist.md'), out);
console.log(`playlist: ${rows.length} videos, ${clock(sum)}`);
