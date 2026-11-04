import { vi } from 'vitest';
import { createUnbrowser } from '../src/client.js';
import type { BrowseResult, UnbrowserConfig } from '../src/types.js';

export interface RecordedCall {
  url: string;
  path: string;
  method: string;
  headers: Record<string, string>;
  body: any;
  signal?: AbortSignal;
}

type Handler = (call: RecordedCall) => Response | Promise<Response>;

/**
 * Replace global fetch. Each call is answered by the next queued handler,
 * or by the last one once the queue is down to one.
 */
export function mockFetch(...handlers: Handler[]) {
  const calls: RecordedCall[] = [];
  const queue = [...handlers];
  const fn = vi.fn(async (input: string | URL, init?: RequestInit) => {
    const url = String(input);
    const call: RecordedCall = {
      url,
      path: new URL(url).pathname,
      method: init?.method ?? 'GET',
      headers: (init?.headers ?? {}) as Record<string, string>,
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
      signal: init?.signal ?? undefined,
    };
    calls.push(call);
    const handler = queue.length > 1 ? queue.shift()! : queue[0];
    if (!handler) throw new Error(`Unexpected fetch to ${url}`);
    return handler(call);
  });
  vi.stubGlobal('fetch', fn);
  return { calls, fn };
}

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export const ok = (data: unknown) => json({ success: true, data });

export const fail = (code: string, message: string, status = 400) =>
  json({ success: false, error: { code, message } }, status);

/** A Response whose body is `text` delivered in chunks of `size` bytes. */
export function sseResponse(text: string, size = 1_000_000): Response {
  const bytes = new TextEncoder().encode(text);
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (let i = 0; i < bytes.length; i += size) controller.enqueue(bytes.slice(i, i + size));
      controller.close();
    },
  });
  return new Response(stream, { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
}

export function client(config: Partial<UnbrowserConfig> = {}) {
  return createUnbrowser({ apiKey: 'ub_test_key', retry: false, ...config });
}

export function browseResult(overrides: Partial<BrowseResult> = {}): BrowseResult {
  return {
    url: 'https://example.com',
    finalUrl: 'https://example.com',
    title: 'Example',
    content: { markdown: '# Example', text: 'Example', html: '<h1>Example</h1>' },
    metadata: { loadTime: 120, tier: 'lightweight', tiersAttempted: ['lightweight'] },
    ...overrides,
  };
}
