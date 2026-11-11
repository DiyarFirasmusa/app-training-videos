import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { text } from './text.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

interface Step {
  index: number;
  title: string;
  text: string;
  tip?: string;
  warn?: string;
  shot: string;
}
interface Meta {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  learn: string[];
  steps: Step[];
}

const metas: Meta[] = readdirSync(join(root, 'recordings'))
  .filter((d) => existsSync(join(root, 'recordings', d, 'steps.json')))
  .map((d) => JSON.parse(readFileSync(join(root, 'recordings', d, 'steps.json'), 'utf8')) as Meta)
  .sort((a, b) => a.number - b.number);

/** A written guide made from the same steps as the videos, with the screenshot of each step. */
const out: string[] = [
  `# ${text.guide}`,
  '',
  text.guideIntro,
  '',
  `## ${text.contents}`,
  '',
  ...metas.map((m) => `- [${m.number}. ${m.title}](#video-${m.number})`),
  '',
];
for (const meta of metas) {
  out.push(`<a id="video-${meta.number}"></a>`, '', `## ${meta.number}. ${meta.title}`, '', meta.subtitle, '');
  for (const step of meta.steps) {
    out.push(`### ${meta.number}.${step.index} ${step.title}`, '', step.text, '');
    if (step.tip) {
      out.push(`> ${text.tip}: ${step.tip}`, '');
    }
    if (step.warn) {
      out.push(`> ${text.warn}: ${step.warn}`, '');
    }
    out.push(`![${step.title}](recordings/${meta.id}/${step.shot})`, '');
  }
  out.push(`**${text.learned}:**`, '', ...meta.learn.map((l) => `- ${l}`), '');
}
writeFileSync(join(root, 'guide.md'), out.join('\n'));
console.log(`guide: ${metas.length} videos`);
