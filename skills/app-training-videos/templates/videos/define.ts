import type { Locator, Page } from 'playwright';
import { sleep } from '../record/helpers.ts';
import type { Helpers } from '../record/helpers.ts';
import type { VideoDef } from '../record/types.ts';

export const defineVideo = (video: VideoDef): VideoDef => video;

export const press = (key: string) => async (h: Helpers) => {
  await h.page.keyboard.press(key);
  await sleep(500);
};

export const sidebar = (page: Page): Locator => page.getByRole('navigation', { name: 'القائمة الرئيسية' });
export const group = (name: string) => (page: Page): Locator => sidebar(page).getByRole('button', { name });
export const link = (name: string | RegExp) => (page: Page): Locator => sidebar(page).getByRole('link', { name });
export const banner = (page: Page): Locator => page.getByRole('banner');
export const main = (page: Page): Locator => page.getByRole('main');
export const popup = (page: Page): Locator => page.locator('[role="dialog"], [role="menu"], [role="listbox"]');
