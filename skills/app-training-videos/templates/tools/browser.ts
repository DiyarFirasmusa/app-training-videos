import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

/**
 * Remotion's own headless Chrome can crash its GPU process on some machines (paths with spaces or
 * brackets). The Chromium that Playwright installed works, so use it. `REMOTION_BROWSER` overrides.
 */
export const findBrowser = (): string | null => {
  if (process.env.REMOTION_BROWSER) {
    return process.env.REMOTION_BROWSER;
  }
  const bases = [
    join(homedir(), 'Library', 'Caches', 'ms-playwright'),
    join(homedir(), '.cache', 'ms-playwright'),
    join(process.env.LOCALAPPDATA ?? '', 'ms-playwright'),
  ];
  for (const base of bases) {
    if (!existsSync(base)) {
      continue;
    }
    const shells = readdirSync(base).filter((d) => d.startsWith('chromium_headless_shell-')).sort().reverse();
    for (const dir of shells) {
      for (const sub of readdirSync(join(base, dir))) {
        for (const name of ['chrome-headless-shell', 'chrome-headless-shell.exe']) {
          const exe = join(base, dir, sub, name);
          if (existsSync(exe)) {
            return exe;
          }
        }
      }
    }
  }
  return null;
};
