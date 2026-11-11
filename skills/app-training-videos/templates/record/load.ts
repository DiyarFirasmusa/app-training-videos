import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { VideoDef } from './types.ts';
import { ROOT } from './runner.ts';

/** Every `videos/NN-name.ts`, in number order. */
export async function loadVideos(): Promise<VideoDef[]> {
  const dir = join(ROOT, 'videos');
  const files = readdirSync(dir).filter((f) => /^\d\d-.*\.ts$/.test(f)).sort();
  const defs: VideoDef[] = [];
  for (const file of files) {
    const mod = (await import(join(dir, file))) as { default: VideoDef };
    defs.push(mod.default);
  }
  return defs;
}
