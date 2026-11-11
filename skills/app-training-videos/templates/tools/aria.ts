import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import config from '../training.config.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Reads pages as text instead of screenshots: the accessibility tree lists every label, button and
 * link with the exact accessible names that the step targets use (`getByRole('button', { name })`).
 * A page costs a few hundred tokens as text, an image costs far more.
 *
 *   node tools/aria.ts <role|none> /path /other/path      -> aria/<path>.txt
 */
const [role = 'none', ...paths] = process.argv.slice(2);
const server = await config.startServer(Number(process.env.PORT ?? 3170));
const browser = await chromium.launch();
try {
  const context = await browser.newContext({ viewport: config.viewport ?? { width: 1920, height: 1080 }, locale: config.locale });
  await config.prepareContext?.(context, server.url);
  config.resetMock();
  await config.attachMock(context, { delay: false });
  const page = await context.newPage();
  if (role !== 'none') {
    await config.signIn?.(page, role, server.url);
  }
  mkdirSync(join(root, 'aria'), { recursive: true });
  for (const path of paths) {
    await page.goto(`${server.url}${path}`);
    await page.waitForLoadState('networkidle').catch(() => undefined);
    const tree = await page.locator('body').ariaSnapshot();
    const file = join(root, 'aria', `${path === '/' ? 'home' : path.replace(/[^A-Za-z0-9]+/g, '_')}.txt`);
    writeFileSync(file, tree);
    console.log(`${path} -> ${file} (${tree.split('\n').length} lines)`);
  }
} finally {
  await browser.close();
  server.stop();
}
