import { appendFileSync, copyFileSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Browser, BrowserContext } from 'playwright';
import config from '../training.config.ts';
import { CURSOR_SCRIPT } from './cursor.ts';
import { Helpers, sleep } from './helpers.ts';
import type { Box, StepDef, StepRecord, VideoDef, VideoRecord } from './types.ts';

/** Vite's HMR socket reloads the page whenever it drops and reconnects (it does under load), which
 *  wipes a half-filled form in the middle of a recording. Recordings never need HMR, so the socket is stubbed. */
const NO_HMR_SOCKET = `(() => {
  const Native = window.WebSocket;
  class Silent extends EventTarget {
    readyState = 0;
    send() {}
    close() {}
  }
  window.WebSocket = function (url, protocols) {
    const list = Array.isArray(protocols) ? protocols : [protocols];
    return list.includes('vite-hmr') ? new Silent() : new Native(url, protocols);
  };
  Object.assign(window.WebSocket, { CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3, prototype: Native.prototype });
})();`;

export const ROOT = fileURLToPath(new URL('../', import.meta.url));
/** Fast mode (default): record only the actions; the renderer freezes the frame for the reading time. `REALTIME=1` waits for real. */
const FAST = process.env.REALTIME !== '1';
const FAST_HOLD = 0.9;
export const VIEWPORT = config.viewport ?? { width: 1920, height: 1080 };

export function logIssue(videoId: string, message: string): void {
  appendFileSync(join(ROOT, 'ISSUES.md'), `- **${videoId}** (${new Date().toISOString().slice(0, 16)}): ${message}\n`);
}

function wordCount(...parts: Array<string | undefined>): number {
  return parts.filter(Boolean).join(' ').split(/\s+/).filter(Boolean).length;
}

/** Seconds the callout stays before the action: enough to read, never under three. */
export function holdSeconds(step: StepDef): number {
  return Math.max(3, wordCount(step.title, step.text, step.tip, step.warn) / 2.5 + 1) + (step.extraHold ?? 0);
}

async function newBaseContext(browser: Browser, baseUrl: string, extra: Parameters<Browser['newContext']>[0] = {}): Promise<BrowserContext> {
  const context = await browser.newContext({ viewport: VIEWPORT, locale: config.locale, deviceScaleFactor: 1, ...extra });
  await config.prepareContext?.(context, baseUrl);
  return context;
}

async function signedInState(browser: Browser, baseUrl: string, role: string) {
  const context = await newBaseContext(browser, baseUrl);
  await config.attachMock(context, { delay: false });
  const page = await context.newPage();
  await config.signIn?.(page, role, baseUrl);
  const state = await context.storageState();
  await context.close();
  return state;
}

export interface RunResult {
  ok: boolean;
  record?: VideoRecord;
  error?: string;
}

export async function recordVideo(def: VideoDef, browser: Browser, baseUrl: string): Promise<RunResult> {
  const dir = join(ROOT, 'recordings', def.id);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(join(dir, 'shots'), { recursive: true });
  mkdirSync(join(dir, 'tmp'), { recursive: true });
  config.resetMock();
  const storageState = def.role === 'none' ? undefined : await signedInState(browser, baseUrl, def.role);
  config.resetMock();
  const context = await newBaseContext(browser, baseUrl, { storageState, recordVideo: { dir: join(dir, 'tmp'), size: VIEWPORT } });
  await context.addInitScript(CURSOR_SCRIPT);
  if (config.noHmrSocket) {
    await context.addInitScript(NO_HMR_SOCKET);
  }
  await config.attachMock(context, { delay: true });
  const t0 = Date.now();
  const page = await context.newPage();
  page.on('console', (m) => {
    if (/\[vite\].*(reload|optimized|invalidate)/i.test(m.text())) {
      console.error(`  [vite] ${m.text().slice(0, 140)} (t=${((Date.now() - t0) / 1000).toFixed(1)}s)`);
    }
  });
  const now = () => (Date.now() - t0) / 1000;
  const h = new Helpers(page, baseUrl, config.mock);
  const steps: StepRecord[] = [];
  let failure: string | undefined;
  try {
    await def.prepare?.(h);
    await page.goto(`${baseUrl}${def.startPath}`);
    await h.settle(900);
    for (let i = 0; i < def.steps.length; i += 1) {
      const step = def.steps[i]!;
      let attempt = 0;
      for (;;) {
        try {
          steps.push(await runStep(step, i + 1, h, dir, now));
          break;
        } catch (error) {
          attempt += 1;
          const message = error instanceof Error ? error.message.split('\n')[0]! : String(error);
          console.error(`  step ${i + 1} failed (attempt ${attempt}): ${message}`);
          if (attempt >= 2) {
            throw new Error(`step ${i + 1} "${step.title}": ${message}`);
          }
          await sleep(800);
        }
      }
    }
    await sleep(1300);
  } catch (error) {
    failure = error instanceof Error ? error.message : String(error);
  }
  const duration = now();
  await page.waitForTimeout(200).catch(() => undefined);
  await context.close();
  const files = readdirSync(join(dir, 'tmp')).filter((f) => f.endsWith('.webm'));
  if (files[0]) {
    copyFileSync(join(dir, 'tmp', files[0]), join(dir, 'raw.webm'));
  }
  rmSync(join(dir, 'tmp'), { recursive: true, force: true });
  if (config.unmocked.length > 0) {
    logIssue(def.id, `unmocked requests: ${[...new Set(config.unmocked)].join('; ')}`);
  }
  if (failure) {
    logIssue(def.id, `recording stopped: ${failure}`);
  }
  const record: VideoRecord = {
    lang: config.lang, brand: config.appName,
    id: def.id, number: def.number, title: def.title, chapter: def.chapter, subtitle: def.subtitle, learn: def.learn, role: def.role,
    video: 'raw.webm', width: VIEWPORT.width, height: VIEWPORT.height, duration: Math.round(duration * 100) / 100, steps,
  };
  writeFileSync(join(dir, 'steps.json'), JSON.stringify(record, null, 2));
  return failure ? { ok: false, record, error: failure } : { ok: true, record };
}

async function runStep(step: StepDef, index: number, h: Helpers, dir: string, now: () => number): Promise<StepRecord> {
  await step.before?.(h);
  const page = h.page;
  const tStart = now();
  const target = step.target ? step.target(page) : null;
  let box: Box | null = null;
  if (target) {
    box = await h.ready(target);
  }
  const area = step.area ? await h.box(step.area(page)) : null;
  if (box) {
    await h.moveToBox(box, 850);
  }
  const shot = `shots/${String(index).padStart(2, '0')}.png`;
  await page.screenshot({ path: join(dir, shot) });
  const act = step.act ?? (target ? 'click' : 'none');
  const readHold = holdSeconds(step);
  const hold = FAST ? FAST_HOLD : readHold;
  let tClick: number | null = null;
  const waitRest = async () => {
    const left = hold - (now() - tStart);
    if (left > 0) {
      await sleep(left * 1000);
    }
  };
  let action = 'none';
  let avoid: Box | null = null;
  if (act === 'click') {
    action = 'click';
    const early = step.clickAt === 'early';
    if (early) {
      await sleep(hold * 550);
    } else {
      await waitRest();
    }
    tClick = now();
    await h.ripple();
    await target!.first().click({ timeout: 8000 });
    await h.settle();
    if (early) {
      const popup = step.avoid ? step.avoid(page) : null;
      avoid = popup && (await popup.count()) > 0 ? await h.box(popup) : null;
      await waitRest();
    }
  } else if (act === 'hover') {
    action = 'hover';
    await target!.first().hover();
    await waitRest();
  } else if (act === 'none') {
    await waitRest();
  } else if (typeof act === 'function') {
    action = 'custom';
    await act(h, target);
    await waitRest();
  } else if ('fill' in act) {
    action = 'fill';
    await h.ripple();
    await target!.first().click();
    await target!.first().fill('');
    await target!.first().pressSequentially(act.fill, { delay: 75 });
    await sleep(250);
    await waitRest();
  } else {
    action = 'type';
    await target!.first().pressSequentially(act.type, { delay: 75 });
    await waitRest();
  }
  const tEnd = now();
  const small = box ? box.w * box.h < 90000 : false;
  return {
    index, title: step.title, text: step.text, tip: step.tip, warn: step.warn, tStart: Math.round(tStart * 100) / 100,
    tClick: tClick === null ? null : Math.round(tClick * 100) / 100, tEnd: Math.round(tEnd * 100) / 100, box, area, avoid,
    side: box ? (step.side ?? 'auto') : 'center', zoom: step.zoom ?? small, shot, action,
    hold: FAST ? readHold : undefined,
    tFreeze: Math.round((tClick !== null && step.clickAt !== 'early' ? tClick : tEnd) * 100) / 100,
  };
}
