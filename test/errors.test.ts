import { describe, expect, it } from 'vitest';
import {
  ERROR_RECOVERY,
  UnbrowserError,
  isRetryableError,
  isUnbrowserError,
  rateLimitError,
  timeoutError,
} from '../src/errors.js';

describe('ERROR_RECOVERY', () => {
  it('gives every code a suggestion and a retry flag', () => {
    for (const [code, recovery] of Object.entries(ERROR_RECOVERY)) {
      expect(recovery.suggestion, code).toBeTruthy();
      expect(typeof recovery.canRetry, code).toBe('boolean');
    }
  });
});

describe('UnbrowserError', () => {
  it('is an Error and an UnbrowserError', () => {
    const err = new UnbrowserError('TIMEOUT', 'slow');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(UnbrowserError);
    expect(err.name).toBe('UnbrowserError');
    expect(err.message).toBe('slow');
  });

  it('attaches the recovery guidance for its code', () => {
    expect(new UnbrowserError('RATE_LIMITED', 'x').recovery).toEqual(ERROR_RECOVERY.RATE_LIMITED);
  });

  it('merges custom recovery over the defaults', () => {
    const err = new UnbrowserError('RATE_LIMITED', 'x', { customRecovery: { retryAfter: 5 } });
    expect(err.recovery).toEqual({ ...ERROR_RECOVERY.RATE_LIMITED, retryAfter: 5 });
  });

  it('keeps statusCode, cause and context', () => {
    const cause = new Error('root');
    const err = new UnbrowserError('NETWORK_ERROR', 'x', { statusCode: 0, cause, context: { a: 1 } });
    expect(err).toMatchObject({ statusCode: 0, cause, context: { a: 1 } });
  });

  it('reports retryability and delay from its recovery', () => {
    expect(new UnbrowserError('TIMEOUT', 'x').isRetryable()).toBe(true);
    expect(new UnbrowserError('TIMEOUT', 'x').getRetryDelay()).toBe(5000);
    expect(new UnbrowserError('UNAUTHORIZED', 'x').isRetryable()).toBe(false);
    expect(new UnbrowserError('UNAUTHORIZED', 'x').getRetryDelay()).toBe(0);
  });

  describe('fromResponse', () => {
    it('uses the code and message from the body', () => {
      const err = UnbrowserError.fromResponse(
        { status: 403, statusText: 'Forbidden' },
        { error: { code: 'FORBIDDEN', message: 'nope' } }
      );
      expect(err).toMatchObject({ code: 'FORBIDDEN', message: 'nope', statusCode: 403 });
    });

    it('falls back to UNKNOWN_ERROR and the status text', () => {
      const err = UnbrowserError.fromResponse({ status: 500, statusText: 'Server Error' });
      expect(err).toMatchObject({ code: 'UNKNOWN_ERROR', message: 'Server Error' });
    });

    it('falls back to a generic message when there is no status text', () => {
      expect(UnbrowserError.fromResponse({ status: 500, statusText: '' }).message).toBe(
        'Request failed'
      );
    });
  });

  describe('toDetailedString', () => {
    it('includes status, suggestion, alternatives, retry delay and context', () => {
      const text = new UnbrowserError('RATE_LIMITED', 'slow down', {
        statusCode: 429,
        context: { url: 'u' },
        customRecovery: { alternatives: ['wait'] },
      }).toDetailedString();
      expect(text).toContain('UnbrowserError [RATE_LIMITED]: slow down (429)');
      expect(text).toContain(`Suggestion: ${ERROR_RECOVERY.RATE_LIMITED.suggestion}`);
      expect(text).toContain('Alternatives:\n  - wait');
      expect(text).toContain('Retry after: 60000ms');
      expect(text).toContain('Context: {"url":"u"}');
    });

    it('omits the optional parts when absent', () => {
      const text = new UnbrowserError('SSL_ERROR', 'bad cert', {
        customRecovery: { alternatives: [] },
      }).toDetailedString();
      expect(text).toBe(
        `UnbrowserError [SSL_ERROR]: bad cert\nSuggestion: ${ERROR_RECOVERY.SSL_ERROR.suggestion}`
      );
    });
  });

  it('serializes to JSON with its fields', () => {
    const err = new UnbrowserError('TIMEOUT', 'slow', { statusCode: 504, context: { a: 1 } });
    expect(JSON.parse(JSON.stringify(err))).toEqual({
      name: 'UnbrowserError',
      code: 'TIMEOUT',
      message: 'slow',
      statusCode: 504,
      recovery: ERROR_RECOVERY.TIMEOUT,
      context: { a: 1 },
    });
  });
});

describe('helpers', () => {
  it('isUnbrowserError', () => {
    expect(isUnbrowserError(new UnbrowserError('TIMEOUT', 'x'))).toBe(true);
    expect(isUnbrowserError(new Error('x'))).toBe(false);
    expect(isUnbrowserError(null)).toBe(false);
  });

  it('isRetryableError', () => {
    expect(isRetryableError(new UnbrowserError('TIMEOUT', 'x'))).toBe(true);
    expect(isRetryableError(new UnbrowserError('FORBIDDEN', 'x'))).toBe(false);
    expect(isRetryableError(new Error('x'))).toBe(false);
  });

  it('rateLimitError', () => {
    const err = rateLimitError(1234);
    expect(err).toMatchObject({ code: 'RATE_LIMITED', statusCode: 429 });
    expect(err.getRetryDelay()).toBe(1234);
  });

  it('timeoutError with and without a URL', () => {
    expect(timeoutError(100, 'https://x.com')).toMatchObject({
      code: 'TIMEOUT',
      message: 'Request to https://x.com timed out after 100ms',
      context: { timeoutMs: 100, url: 'https://x.com' },
    });
    expect(timeoutError(100).message).toBe('Request timed out after 100ms');
  });
});
