import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

interface Step {
  index: number;
  title: string;
  text: string;
  tip?: string;
  warn?: string;
  tStart: number;
  tEnd: number;
  box: unknown;
  hold?: number;
}

/**
 * Cheap checks over the recorded steps, so nothing needs to be looked at to find the obvious
 * problems: a recording that stopped early, text that is too long or broken, a step too short to
 * read. Run it before rendering; look at frames only for what it flags.
 */
let bad = 0;
const dirs = readdirSync(join(root, 'recordings')).filter((d) => existsSync(join(root, 'recordings', d, 'steps.json')));
for (const dir of dirs.sort()) {
  const data = JSON.parse(readFileSync(join(root, 'recordings', dir, 'steps.json'), 'utf8')) as { steps: Step[]; duration: number };
  const problems: string[] = [];
  for (const step of data.steps) {
    const all = [step.title, step.text, step.tip, step.warn].filter(Boolean).join(' ');
    if (/undefined|NaN|\[object/.test(all)) {
      problems.push(`step ${step.index}: broken text`);
    }
    if (step.title.split(/\s+/).length > 6) {
      problems.push(`step ${step.index}: title over 6 words`);
    }
    if (step.text.length > 110) {
      problems.push(`step ${step.index}: text over 110 characters`);
    }
    const shown = step.hold ?? step.tEnd - step.tStart;
    if (shown < 2.8) {
      problems.push(`step ${step.index}: only ${shown.toFixed(1)}s on screen`);
    }
  }
  const reading = data.steps.reduce((sum, s) => sum + Math.max(s.hold ?? 0, s.tEnd - s.tStart), 0);
  console.log(`${problems.length === 0 ? 'ok ' : 'BAD'} ${dir}: ${data.steps.length} steps, about ${Math.round(reading / 60 * 10) / 10} min${problems.length ? `\n    ${problems.join('\n    ')}` : ''}`);
  bad += problems.length;
}
const issues = existsSync(join(root, 'ISSUES.md')) ? readFileSync(join(root, 'ISSUES.md'), 'utf8').split('\n').filter((l) => l.startsWith('- ')) : [];
if (issues.length > 0) {
  console.log(`\nISSUES.md has ${issues.length} line(s): a recording stopped early or a request was not mocked.`);
  bad += issues.length;
}
process.exit(bad === 0 ? 0 : 1);
