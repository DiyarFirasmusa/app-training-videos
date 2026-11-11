import type { BrowserContext, Page } from 'playwright';
import type { DevServer } from './server.ts';

/** Everything that is specific to the app being recorded. One file: `training.config.ts`. */
export interface TrainingConfig {
  /** Shown on the chapter card. */
  appName: string;
  /** Language of the on-screen text. */
  lang: 'ar' | 'en';
  /** Browser locale, e.g. 'ar-IQ', 'en-US'. */
  locale: string;
  viewport?: { width: number; height: number };
  /** Start the app's dev server on this port (see `startCommandServer`). */
  startServer: (port: number) => Promise<DevServer>;
  /** Cookies, localStorage (language, theme) before any page loads. */
  prepareContext?: (context: BrowserContext, baseUrl: string) => Promise<void> | void;
  /** Sign in as a role once; the session is reused by every video of that role. Omit when the app has no login. */
  signIn?: (page: Page, role: string, baseUrl: string) => Promise<void>;
  /** Stub Vite's HMR socket in recordings (stops random page reloads under load). Vite apps: true. */
  noHmrSocket?: boolean;
  /** Answer every request the app makes to its backend (see mock/router.ts). */
  attachMock: (context: BrowserContext, options: { delay: boolean }) => Promise<void>;
  /** Put the fake data back to its seed state (called before every video). */
  resetMock: () => void;
  /** Requests nobody answered. They are logged to ISSUES.md. */
  unmocked: string[];
  /** Exposed to steps as `h.mock` (the data store, fault switches). */
  mock: unknown;
}
