import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';

export interface DevServer {
  url: string;
  stop: () => void;
}

export interface CommandServerOptions {
  /** The command that starts the app's dev server, with the port already in it. */
  cmd: string[];
  /** The app's folder. */
  cwd: string;
  port: number;
  /** Extra environment, normally the setting that points the app's API at a fake host. */
  env?: Record<string, string>;
  /** Seconds to wait for the server to answer. */
  timeout?: number;
}

/** Starts any dev server (vite, next, webpack, ...) and waits until it answers on `http://localhost:<port>`. */
export async function startCommandServer(options: CommandServerOptions): Promise<DevServer> {
  const url = `http://localhost:${options.port}`;
  const [bin, ...args] = options.cmd;
  const child: ChildProcess = spawn(bin!, args, {
    cwd: options.cwd,
    env: { ...process.env, BROWSER: 'none', ...options.env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let log = '';
  const echo = process.env.DEV_LOG === '1';
  for (const stream of [child.stdout, child.stderr]) {
    stream?.on('data', (d) => {
      log += String(d);
      if (echo) {
        process.stderr.write(`[dev] ${String(d)}`);
      }
    });
  }
  const deadline = Date.now() + (options.timeout ?? 120) * 1000;
  for (;;) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        break;
      }
    } catch {
      // not up yet
    }
    if (child.exitCode !== null) {
      throw new Error(`dev server exited early:\n${log}`);
    }
    if (Date.now() > deadline) {
      child.kill();
      throw new Error(`dev server did not start:\n${log}`);
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return { url, stop: () => child.kill('SIGTERM') };
}
