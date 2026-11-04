import { afterEach, describe, expect, it, vi } from 'vitest';
import { UnbrowserClient, createUnbrowser } from '../src/client.js';
import { UnbrowserError } from '../src/errors.js';
import { browseResult, client, fail, mockFetch, ok } from './helpers.js';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('constructor', () => {
  it('requires an API key', () => {
    expect(() => createUnbrowser({ apiKey: '' })).toThrow(
      expect.objectContaining({ code: 'MISSING_API_KEY' })
    );
  });

  it('rejects keys without the ub_ prefix', () => {
    expect(() => createUnbrowser({ apiKey: 'sk_123' })).toThrow(
      expect.objectContaining({ code: 'INVALID_API_KEY' })
    );
  });

  it('returns an UnbrowserClient', () => {
    expect(client()).toBeInstanceOf(UnbrowserClient);
  });
});

describe('requests', () => {
  it('posts to the API with auth and unwraps { success, data }', async () => {
    const { calls } = mockFetch(() => ok(browseResult({ title: 'Hi' })));
    const result = await client({ baseUrl: 'https://api.test/' }).browse('https://x.com', {
      contentType: 'text',
    });

    expect(result.title).toBe('Hi');
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('https://api.test/v1/browse');
    expect(calls[0].method).toBe('POST');
    expect(calls[0].headers.Authorization).toBe('Bearer ub_test_key');
    expect(calls[0].body).toEqual({ url: 'https://x.com', options: { contentType: 'text' } });
  });

  it('sends batch URLs in a single request', async () => {
    const { calls } = mockFetch(() => ok({ results: [], totalTime: 0 }));
    await client().batch(['https://a.com', 'https://b.com']);
    expect(calls).toHaveLength(1);
    expect(calls[0].path).toBe('/v1/batch');
    expect(calls[0].body.urls).toEqual(['https://a.com', 'https://b.com']);
  });

  it('turns { success: false } into an UnbrowserError with code and status', async () => {
    mockFetch(() => fail('INVALID_URL', 'bad url', 400));
    const err = await client().browse('nope').catch((e) => e);
    expect(err).toBeInstanceOf(UnbrowserError);
    expect(err.code).toBe('INVALID_URL');
    expect(err.message).toBe('bad url');
    expect(err.statusCode).toBe(400);
  });
});

describe('retries', () => {
  it('retries retryable failures with exponential backoff', async () => {
    vi.useFakeTimers();
    const { calls } = mockFetch(
      () => fail('SERVICE_UNAVAILABLE', 'down', 503),
      () => fail('SERVICE_UNAVAILABLE', 'down', 503),
      () => ok(browseResult())
    );
    const promise = client({ retry: true, maxRetries: 3 }).browse('https://x.com');

    await vi.advanceTimersByTimeAsync(1999);
    expect(calls).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1); // 2s backoff
    expect(calls).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(4000); // 4s backoff
    expect(calls).toHaveLength(3);
    await expect(promise).resolves.toMatchObject({ title: 'Example' });
  });

  it('gives up after maxRetries and throws the last error', async () => {
    vi.useFakeTimers();
    const { calls } = mockFetch(() => fail('SERVICE_UNAVAILABLE', 'down', 503));
    const promise = client({ retry: true, maxRetries: 2 }).browse('https://x.com');
    const assertion = expect(promise).rejects.toMatchObject({ code: 'SERVICE_UNAVAILABLE' });
    await vi.runAllTimersAsync();
    await assertion;
    expect(calls).toHaveLength(2);
  });

  it.each(['UNAUTHORIZED', 'FORBIDDEN', 'INVALID_REQUEST', 'INVALID_URL', 'INVALID_API_KEY'])(
    'does not retry %s',
    async (code) => {
      const { calls } = mockFetch(() => fail(code, 'no', 400));
      await expect(client({ retry: true }).browse('https://x.com')).rejects.toMatchObject({ code });
      expect(calls).toHaveLength(1);
    }
  );
});

describe('timeouts', () => {
  /** A fetch that never answers but rejects when its signal aborts. */
  const hang = (call: { signal?: AbortSignal }) =>
    new Promise<Response>((_, reject) => {
      call.signal?.addEventListener('abort', () =>
        reject(Object.assign(new Error('aborted'), { name: 'AbortError' }))
      );
    });

  it('aborts at the configured timeout with REQUEST_ABORTED', async () => {
    vi.useFakeTimers();
    mockFetch(hang);
    const promise = client({ timeout: 5000 }).browse('https://x.com');
    const assertion = expect(promise).rejects.toMatchObject({ code: 'REQUEST_ABORTED' });
    await vi.advanceTimersByTimeAsync(5000);
    await assertion;
  });

  it('extends the timeout to maxLatencyMs + 30s', async () => {
    vi.useFakeTimers();
    mockFetch(hang);
    const promise = client({ timeout: 5000 }).browse('https://x.com', { maxLatencyMs: 10_000 });
    let settled = false;
    promise.catch(() => {}).finally(() => (settled = true));

    await vi.advanceTimersByTimeAsync(39_999);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await expect(promise).rejects.toMatchObject({ code: 'REQUEST_ABORTED' });
  });

  it('disables retries when maxLatencyMs exceeds 30s', async () => {
    vi.useFakeTimers();
    const { calls } = mockFetch(() => fail('SERVICE_UNAVAILABLE', 'down', 503));
    const promise = client({ retry: true }).browse('https://x.com', { maxLatencyMs: 45_000 });
    const assertion = expect(promise).rejects.toMatchObject({ code: 'SERVICE_UNAVAILABLE' });
    await vi.runAllTimersAsync();
    await assertion;
    expect(calls).toHaveLength(1);
  });
});
