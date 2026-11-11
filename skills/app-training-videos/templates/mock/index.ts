import type { BrowserContext } from 'playwright';
import { get, installMock, post, resetFaults, unmocked } from './router.ts';
import { db, resetDb } from './db.ts';

/**
 * Register one handler per endpoint the app calls, shaped exactly like the real API (read the
 * OpenAPI spec or the service layer for field names, paging, and error bodies). Mutations should
 * change `db` so the next list shows the change.
 */
get('/api/items', ({ query }) => {
  const q = query.get('q');
  return { content: db.items.filter((i) => !q || i.name.includes(q)), total: db.items.length };
});
post('/api/items', ({ body }) => {
  const item = { id: db.items.length + 1, ...body };
  db.items.push(item);
  return item;
});

export const resetMock = (): void => {
  resetDb();
  resetFaults();
  unmocked.length = 0;
};

export const attachMock = (context: BrowserContext, options: { delay: boolean }) =>
  installMock(context, /^https?:\/\/api\.mock\.test\//, options);

export { unmocked };
export const mock = { db };
