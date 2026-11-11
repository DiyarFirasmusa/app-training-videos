import type { Locator, Page } from 'playwright';
import type { Box } from './types.ts';

export const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Everything a step can use to drive the app. */
export class Helpers<M = any> {
  page: Page;
  baseUrl: string;
  /** Whatever `training.config.ts` exposes as `mock` (the fake data store, fault switches). */
  mock: M;
  lastPoint = { x: 960, y: 540 };

  constructor(page: Page, baseUrl: string, mock: M) {
    this.mock = mock;
    this.page = page;
    this.baseUrl = baseUrl;
  }

  async settle(ms = 450): Promise<void> {
    await this.page.waitForLoadState('networkidle', { timeout: 6000 }).catch(() => undefined);
    await sleep(ms);
  }

  async goto(path: string): Promise<void> {
    await this.page.goto(`${this.baseUrl}${path}`);
    await this.settle();
  }

  async box(target: Locator): Promise<Box | null> {
    const b = await target.first().boundingBox();
    return b ? { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) } : null;
  }

  async moveTo(x: number, y: number, wait = 800): Promise<void> {
    await this.page.evaluate(([px, py]) => (window as unknown as { __moveCursor: (a: number, b: number) => void }).__moveCursor(px as number, py as number), [x, y]);
    this.lastPoint = { x, y };
    await sleep(wait);
  }

  async moveToBox(box: Box, wait = 800): Promise<void> {
    await this.moveTo(Math.round(box.x + Math.min(box.w - 8, Math.max(12, box.w * 0.5))), Math.round(box.y + box.h * 0.5), wait);
  }

  async ripple(): Promise<void> {
    await this.page.evaluate(([px, py]) => (window as unknown as { __ripple: (a: number, b: number) => void }).__ripple(px as number, py as number), [this.lastPoint.x, this.lastPoint.y]);
  }

  /** Waits for the element, scrolls it into view and returns its box. */
  async ready(target: Locator, timeout = 25000): Promise<Box> {
    const first = target.first();
    await first.waitFor({ state: 'visible', timeout });
    await first.scrollIntoViewIfNeeded();
    await sleep(120);
    const box = await this.box(first);
    if (!box) {
      throw new Error('target has no box');
    }
    return box;
  }

  async click(target: Locator): Promise<void> {
    const box = await this.ready(target);
    await this.moveToBox(box, 650);
    await this.ripple();
    await target.first().click({ timeout: 8000 });
    await this.settle();
  }

  async fill(target: Locator, text: string, delay = 70): Promise<void> {
    const box = await this.ready(target);
    await this.moveToBox(box, 700);
    await this.ripple();
    await target.first().click();
    await target.first().fill('');
    await target.first().pressSequentially(text, { delay });
    await sleep(250);
  }

  /** Opens a combobox or select and chooses an option, moving the cursor to both. */
  async pick(trigger: Locator, option: RegExp | string, search?: string): Promise<void> {
    await this.click(trigger);
    if (search) {
      const input = this.page.getByRole('combobox').or(this.page.locator('input[type="text"]')).last();
      await input.pressSequentially(search, { delay: 80 }).catch(() => undefined);
      await sleep(900);
    }
    const opt = this.page.getByRole('option', { name: option }).first();
    await opt.waitFor({ state: 'visible', timeout: 8000 });
    const box = await this.box(opt);
    if (box) {
      await this.moveToBox(box, 650);
      await this.ripple();
    }
    await opt.click();
    await this.settle(300);
  }

  /** Clicks a sidebar group then one of its pages. */
  async nav(group: RegExp | string | null, item: RegExp | string): Promise<void> {
    const side = this.page.locator('aside, nav').first();
    if (group) {
      const g = side.getByRole('button', { name: group }).first();
      if (await g.isVisible().catch(() => false)) {
        const expanded = await g.getAttribute('aria-expanded');
        if (expanded !== 'true') {
          await this.click(g);
        }
      }
    }
    await this.click(side.getByRole('link', { name: item }).first());
  }
}
