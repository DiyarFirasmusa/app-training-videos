import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadVideos } from '../record/load.ts';
import { text } from './text.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
/** One markdown file per video with the on-screen text, generated from the definitions. */
const videos = await loadVideos();
mkdirSync(join(root, 'scripts'), { recursive: true });
for (const video of videos) {
  const meta = join(root, 'recordings', video.id, 'steps.json');
  const length = existsSync(meta)
    ? (JSON.parse(readFileSync(meta, 'utf8')) as { duration: number }).duration
    : null;
  const lines: string[] = [
    `# ${String(video.number).padStart(2, '0')} — ${video.title}`,
    '',
    `- ${text.chapter}: ${video.chapter}`,
    `- ${text.role}: ${video.role}`,
    `- ${text.oneLine}: ${video.subtitle}`,
    ...(length === null ? [] : [`- ${text.seconds}: ${Math.round(length)}`]),
    '',
    `## ${text.scriptSteps}`,
    '',
  ];
  for (const [i, step] of video.steps.entries()) {
    lines.push(`### ${i + 1}. ${step.title}`, '', step.text, '');
    if (step.tip) {
      lines.push(`> ${text.tip}: ${step.tip}`, '');
    }
    if (step.warn) {
      lines.push(`> ${text.warn}: ${step.warn}`, '');
    }
  }
  lines.push(`## ${text.learned}`, '', ...video.learn.map((item) => `- ${item}`), '');
  writeFileSync(join(root, 'scripts', `${video.id}.md`), lines.join('\n'));
}
console.log(`scripts: ${videos.length} files in scripts/`);
