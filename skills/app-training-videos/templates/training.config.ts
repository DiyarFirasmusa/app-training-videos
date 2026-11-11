import { fileURLToPath } from 'node:url';
import type { TrainingConfig } from './record/config-types.ts';
import { startCommandServer } from './record/server.ts';
import { attachMock, mock, resetMock, unmocked } from './mock/index.ts';

/** The app's folder (one level above training-video/). */
const appDir = fileURLToPath(new URL('../', import.meta.url));

const config: TrainingConfig = {
  appName: 'My app',
  lang: 'en',
  locale: 'en-US',
  startServer: (port) =>
    startCommandServer({
      cmd: ['npm', 'run', 'dev', '--', '--port', String(port)],
      cwd: appDir,
      port,
      // Point the app's API at the fake host the mock answers (the variable name depends on the app).
      env: { VITE_API_BASE_URL: 'http://api.mock.test' },
    }),
  prepareContext: async (context, baseUrl) => {
    await context.addInitScript(() => window.localStorage.setItem('theme', 'light'));
    void baseUrl;
  },
  signIn: async (page, role, baseUrl) => {
    // Sign in through the real login form with the fake account for `role`. Delete this when the app has no login.
    await page.goto(`${baseUrl}/login`);
    await page.getByLabel(/user/i).fill(`${role}@example.test`);
    await page.getByLabel(/password/i).fill('Demo@12345');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForLoadState('networkidle');
  },
  noHmrSocket: true,
  attachMock,
  resetMock,
  unmocked,
  mock,
};

export default config;
