/** Transport behaviour shared by every API method: errors, retries, timers. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createUnbrowser } from '../src/client.js';
import { ERROR_RECOVERY, UnbrowserError, type ErrorCode } from '../src/errors.js';
import { browseResult, client, fail, json, mockFetch, ok } from './helpers.js';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('non-JSON responses', () => {
  it.each([
    [502, 'SERVICE_UNAVAILABLE'],
    [503, 'SERVICE_UNAVAILABLE'],
    [504, 'SERVICE_UNAVAILABLE'],
    [500, 'INTERNAL_ERROR'],
    [429, 'RATE_LIMITED'],
    [404, 'UNKNOWN_ERROR'],
  ])('HTTP %i with an HTML body becomes %s', async (status, code) => {
    mockFetch(() => new Response('<html>oops</html>', { status }));
    const err = await client().browse('https://x.com').catch((e) => e);
    expect(err).toBeInstanceOf(UnbrowserError);
    expect(err).toMatchObject({ code, statusCode: status });
    expect(err.message).toContain('<html>oops</html>');
  });

  it('truncates long bodies in the message', async () => {
    mockFetch(() => new Response('x'.repeat(5000), { status: 500 }));
    const err = await client().browse('https://x.com').catch((e) => e);
    expect(err.message.length).toBeLessThan(300);
  });

  it('treats a JSON non-object (e.g. null) as non-JSON', async () => {
    mockFetch(() => new Response('null', { status: 500 }));
    await expect(client().browse('https://x.com')).rejects.toMatchObject({ code: 'INTERNAL_ERROR' });
  });

  it('applies to unwrapped (research) endpoints too', async () => {
    mockFetch(() => new Response('<html>', { status: 503 }));
    await expect(client().quickResearch('q')).rejects.toMatchObject({ code: 'SERVICE_UNAVAILABLE' });
  });
});

describe('network failures', () => {
  it('become NETWORK_ERROR with the original error as cause', async () => {
    const cause = new TypeError('fetch failed');
    mockFetch(() => {
      throw cause;
    });
    const err = await client().browse('https://x.com').catch((e) => e);
    expect(err).toBeInstanceOf(UnbrowserError);
    expect(err.code).toBe('NETWORK_ERROR');
    expect(err.cause).toBe(cause);
    expect(err.message).toContain('/v1/browse');
  });

  it('handle a thrown non-Error value', async () => {
    mockFetch(() => {
      throw 'socket hang up';
    });
    const err = await client().browse('https://x.com').catch((e) => e);
    expect(err).toMatchObject({ code: 'NETWORK_ERROR', cause: undefined });
    expect(err.message).toContain('socket hang up');
  });

  it('are retried, then succeed', async () => {
    vi.useFakeTimers();
    const { calls } = mockFetch(
      () => {
        throw new TypeError('fetch failed');
      },
      () => ok(browseResult())
    );
    const promise = client({ retry: true }).browse('https://x.com');
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toMatchObject({ title: 'Example' });
    expect(calls).toHaveLength(2);
  });
});

describe('retry policy follows ERROR_RECOVERY', () => {
  const nonRetryable = (Object.keys(ERROR_RECOVERY) as ErrorCode[]).filter(
    (code) => !ERROR_RECOVERY[code].canRetry
  );

  it('covers the codes the old hard-coded list missed', () => {
    for (const code of ['EXPIRED_API_KEY', 'QUOTA_EXCEEDED', 'URL_BLOCKED', 'CONTENT_NOT_FOUND', 'SSL_ERROR']) {
      expect(nonRetryable).toContain(code);
    }
  });

  it.each(nonRetryable)('does not retry %s', async (code) => {
    const { calls } = mockFetch(() => fail(code, 'no', 400));
    await expect(client({ retry: true }).browse('https://x.com')).rejects.toMatchObject({ code });
    expect(calls).toHaveLength(1);
  });

  it('retries a code the SDK does not know', async () => {
    vi.useFakeTimers();
    const { calls } = mockFetch(() => fail('BRAND_NEW_CODE', 'eh', 500));
    const promise = client({ retry: true, maxRetries: 2 }).browse('https://x.com');
    const assertion = expect(promise).rejects.toMatchObject({ code: 'BRAND_NEW_CODE' });
    await vi.runAllTimersAsync();
    await assertion;
    expect(calls).toHaveLength(2);
  });

  it('caps backoff at 30 seconds', async () => {
    vi.useFakeTimers();
    const { calls } = mockFetch(() => fail('SERVICE_UNAVAILABLE', 'down', 503));
    const promise = client({ retry: true, maxRetries: 7 }).browse('https://x.com');
    promise.catch(() => {});
    // Backoffs: 2, 4, 8, 16, 30, 30 seconds.
    await vi.advanceTimersByTimeAsync((2 + 4 + 8 + 16 + 30) * 1000);
    expect(calls).toHaveLength(6);
    await vi.advanceTimersByTimeAsync(29_999);
    expect(calls).toHaveLength(6);
    await vi.advanceTimersByTimeAsync(1);
    expect(calls).toHaveLength(7);
  });

  it.each([0, 1, -2])('makes a single attempt when maxRetries is %i', async (maxRetries) => {
    vi.useFakeTimers();
    const { calls } = mockFetch(() => fail('SERVICE_UNAVAILABLE', 'down', 503));
    const promise = client({ retry: true, maxRetries }).browse('https://x.com');
    const assertion = expect(promise).rejects.toMatchObject({ code: 'SERVICE_UNAVAILABLE' });
    await vi.runAllTimersAsync();
    await assertion;
    expect(calls).toHaveLength(1);
  });

  it('uses 3 attempts by default', async () => {
    vi.useFakeTimers();
    const { calls } = mockFetch(() => fail('SERVICE_UNAVAILABLE', 'down', 503));
    const promise = createUnbrowser({ apiKey: 'ub_test_key' }).browse('https://x.com');
    promise.catch(() => {});
    await vi.runAllTimersAsync();
    expect(calls).toHaveLength(3);
  });
});

describe('timers', () => {
  it('clears the timeout when fetch throws', async () => {
    vi.useFakeTimers();
    mockFetch(() => {
      throw new TypeError('fetch failed');
    });
    await client().browse('https://x.com').catch(() => {});
    expect(vi.getTimerCount()).toBe(0);
  });

  it('clears the timeout after success', async () => {
    vi.useFakeTimers();
    mockFetch(() => ok(browseResult()));
    await client().browse('https://x.com');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('times out a response body that never finishes', async () => {
    vi.useFakeTimers();
    mockFetch((call) => {
      return {
        status: 200,
        text: () =>
          new Promise<string>((_, reject) =>
            call.signal?.addEventListener('abort', () =>
              reject(Object.assign(new Error('aborted'), { name: 'AbortError' }))
            )
          ),
      } as unknown as Response;
    });
    const promise = client({ timeout: 1000 }).browse('https://x.com');
    const assertion = expect(promise).rejects.toMatchObject({ code: 'REQUEST_ABORTED' });
    await vi.advanceTimersByTimeAsync(1000);
    await assertion;
  });
});

describe('unwrapped (research) endpoints', () => {
  it('throw the error when success is false', async () => {
    mockFetch(() => json({ success: false, error: { code: 'QUOTA_EXCEEDED', message: 'out' } }, 402));
    await expect(client().research({ scope: 'q' } as any)).rejects.toMatchObject({
      code: 'QUOTA_EXCEEDED',
      statusCode: 402,
    });
  });

  it('return the body when success is false without an error', async () => {
    mockFetch(() => json({ success: false, partial: true }));
    await expect(client().getResearchStatus()).resolves.toEqual({ success: false, partial: true });
  });
});

describe('wrapped endpoints', () => {
  it('throw UNKNOWN_ERROR when success is false without an error', async () => {
    mockFetch(() => json({ success: false }));
    await expect(client().getUsage()).rejects.toMatchObject({ code: 'UNKNOWN_ERROR' });
  });

  it('strip every trailing slash from a caller-supplied base URL', async () => {
    const { calls } = mockFetch(() => ok({}));
    await client({ baseUrl: 'http://localhost:8787///' }).getUsage();
    expect(calls[0].url).toBe('http://localhost:8787/v1/usage');
  });
});
