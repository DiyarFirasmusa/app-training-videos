import type { BrowserContext, Route } from 'playwright';

/**
 * A tiny fake backend for Playwright. Register handlers with `get/post/...`, attach to a browser
 * context, and every request to the fake API origin is answered from memory. A request nobody
 * handles is answered with 501 and recorded in `unmocked` (the runner writes it to ISSUES.md),
 * so a missing endpoint never reaches the network and never goes unnoticed.
 */

export interface Ctx {
  method: string;
  url: URL;
  path: string;
  query: URLSearchParams;
  body: any;
  params: Record<string, string>;
}

export class Reply {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown = null) {
    this.status = status;
    this.body = body;
  }
}

export const created = (body: unknown) => new Reply(201, body);
export const noContent = () => new Reply(204);
export type Handler = (ctx: Ctx) => unknown | Promise<unknown>;

interface RouteDef {
  method: string;
  re: RegExp;
  keys: string[];
  handler: Handler;
}

const routes: RouteDef[] = [];
export const unmocked: string[] = [];
/** Switches for error scenarios: `faults.fail['GET /api/items'] = 500` makes that call fail. */
export const faults: { fail: Record<string, number>; delayMs: number } = { fail: {}, delayMs: 0 };
export const resetFaults = (): void => {
  faults.fail = {};
  faults.delayMs = 0;
};

const add = (method: string, pattern: string, handler: Handler): void => {
  const keys: string[] = [];
  const source = pattern.replace(/:([A-Za-z]+)/g, (_m, key: string) => {
    keys.push(key);
    return '([^/]+)';
  });
  routes.push({ method, re: new RegExp(`^${source}/?$`), keys, handler });
};
export const get = (p: string, h: Handler) => add('GET', p, h);
export const post = (p: string, h: Handler) => add('POST', p, h);
export const put = (p: string, h: Handler) => add('PUT', p, h);
export const patch = (p: string, h: Handler) => add('PATCH', p, h);
export const del = (p: string, h: Handler) => add('DELETE', p, h);

const json = (route: Route, status: number, body: unknown) =>
  route.fulfill({
    status,
    contentType: 'application/json',
    headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' },
    body: body === null ? '' : JSON.stringify(body),
  });

/** `origins` matches the fake hosts, e.g. /^https?:\/\/api\.mock\.test\//. */
export async function installMock(context: BrowserContext, origins: RegExp, options: { delay: boolean }): Promise<void> {
  await context.route(origins, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() === 'OPTIONS') {
      return json(route, 204, null);
    }
    if (options.delay) {
      await new Promise((r) => setTimeout(r, faults.delayMs || 200 + Math.random() * 300));
    }
    const key = `${request.method()} ${url.pathname}`;
    const forced = faults.fail[key];
    if (forced) {
      return json(route, forced, { message: 'Simulated failure' });
    }
    for (const def of routes) {
      if (def.method !== request.method()) {
        continue;
      }
      const m = def.re.exec(url.pathname);
      if (!m) {
        continue;
      }
      const params = Object.fromEntries(def.keys.map((k, i) => [k, decodeURIComponent(m[i + 1] ?? '')]));
      let body: unknown = null;
      const raw = request.postData();
      if (raw) {
        try {
          body = JSON.parse(raw);
        } catch {
          body = raw;
        }
      }
      const result = await def.handler({ method: request.method(), url, path: url.pathname, query: url.searchParams, body, params });
      const reply = result instanceof Reply ? result : new Reply(200, result);
      return json(route, reply.status, reply.body);
    }
    unmocked.push(key);
    return json(route, 501, { message: `No mock for ${key}` });
  });
}
