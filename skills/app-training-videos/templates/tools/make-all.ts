import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const only = process.argv.slice(2);

const run = (label: string, args: string[], allowFail = false): void => {
  console.log(`\n=== ${label}`);
  const result = spawnSync('node', args, { cwd: root, stdio: 'inherit' });
  if (result.status !== 0 && !allowFail) {
    console.error(`${label} failed`);
    process.exit(result.status ?? 1);
  }
};

/** Everything, in order. Pass video numbers to redo only those (e.g. `make-videos 02 05`). */
run('record', ['record/run.ts', ...only], true);
run('scripts', ['tools/scripts-md.ts']);
run('render', ['tools/render.ts', ...only]);
run('frames', ['tools/frames.ts', ...only]);
run('guide', ['tools/guide.ts']);
run('playlist', ['tools/playlist.ts']);
run('deliver', ['tools/deliver.ts']);
console.log('\nDone. Videos: output/  Playlist: playlist.md  Desktop copy + merged ALL-VIDEOS.mp4: ~/Desktop/<app>-Training-Videos  Guide: guide.md  Problems: ISSUES.md');
