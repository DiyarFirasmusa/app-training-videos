import { mkdirSync, readdirSync, existsSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import config from '../training.config.ts';
import { findBrowser } from './browser.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const remotionDir = join(root, 'remotion');
const need = createRequire(join(remotionDir, 'package.json'));

/**
 * The design test: draws every overlay design (chapter card, callouts below / beside the target with a
 * tip or a warning, the welcome card, the zoom, the summary, the outro) as stills on one picture,
 * in a few seconds, without recording anything. Change `remotion/src/theme.ts` (colours, sizes,
 * DESIGN knobs) or any component, run this, look at ONE image.
 *
 *   node tools/design-preview.ts [--lang ar|en] [--bg recordings/<id>/shots/02.png]
 *   -> design-preview/preview.jpg
 */
const args = process.argv.slice(2);
const option = (name: string): string | undefined => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const lang = (option('--lang') ?? config.lang) as 'ar' | 'en';

const recordings = join(root, 'recordings');
const firstShot = (): string | null => {
  if (!existsSync(recordings)) {
    return null;
  }
  for (const dir of readdirSync(recordings).sort()) {
    const shot = join(recordings, dir, 'shots', '02.png');
    if (existsSync(shot)) {
      return `${dir}/shots/02.png`;
    }
  }
  return null;
};
const given = option('--bg');
const background = given ? given.replace(/^recordings\//, '') : firstShot();

// Loaded from remotion/node_modules (installed there, not in this folder), so typed by hand.
interface Bundler {
  bundle: (options: { entryPoint: string; publicDir: string }) => Promise<string>;
}
interface Renderer {
  selectComposition: (options: Record<string, unknown>) => Promise<unknown>;
  renderStill: (options: Record<string, unknown>) => Promise<unknown>;
}
const { bundle } = (await import(pathToFileURL(need.resolve('@remotion/bundler')).href)) as Bundler;
const { renderStill, selectComposition } = (await import(pathToFileURL(need.resolve('@remotion/renderer')).href)) as Renderer;

const out = join(root, 'design-preview');
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const serveUrl = await bundle({ entryPoint: join(remotionDir, 'src', 'index.ts'), publicDir: recordings });
const browserExecutable = findBrowser();
const kinds = ['welcome', 'below-tip', 'left-warn', 'zoom', 'chapter', 'summary', 'outro'] as const;
const files: string[] = [];
for (const kind of kinds) {
  const inputProps = { kind, lang, background, brand: config.appName };
  const composition = await selectComposition({ serveUrl, id: 'DesignPreview', inputProps, browserExecutable });
  const output = join(out, `${kind}.jpg`);
  await renderStill({ composition, serveUrl, output, inputProps, frame: 100, imageFormat: 'jpeg', jpegQuality: 85, browserExecutable });
  files.push(`${kind}.jpg`);
}

const cells = files.map((f) => `<img src="${f}" style="width:480px;height:270px;display:block">`).join('');
writeFileSync(join(out, 'sheet.html'), `<body style="margin:0;display:grid;grid-template-columns:repeat(4,480px);background:#000">${cells}</body>`);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 540 } });
await page.goto(pathToFileURL(join(out, 'sheet.html')).href);
await page.waitForLoadState('load');
await page.screenshot({ path: join(out, 'preview.jpg'), type: 'jpeg', quality: 88 });
await browser.close();
rmSync(join(out, 'sheet.html'), { force: true });
console.log(`design preview: ${join(out, 'preview.jpg')} (${kinds.join(', ')})`);
