import { afterEach, describe, expect, it, vi } from 'vitest';
import { SseParser, type SseEvent } from '../src/sse.js';
import { UnbrowserError } from '../src/errors.js';
import { client, json, mockFetch, sseResponse } from './helpers.js';

afterEach(() => vi.unstubAllGlobals());

function parse(chunks: string[]): SseEvent[] {
  const events: SseEvent[] = [];
  const parser = new SseParser((e) => events.push(e));
  for (const chunk of chunks) parser.push(chunk);
  parser.end();
  return events;
}

/** Split `text` into chunks of `size` characters. */
const chunk = (text: string, size: number) =>
  Array.from({ length: Math.ceil(text.length / size) }, (_, i) => text.slice(i * size, (i + 1) * size));

describe('SseParser', () => {
  const stream = (eol: string) =>
    ['event: progress', 'data: {"n":1}', '', 'event: result', 'data: {"n":2}', '', ''].join(eol);

  it.each([
    ['\\n', '\n'],
    ['\\r\\n', '\r\n'],
    ['\\r', '\r'],
  ])('parses %s line endings regardless of chunk size', (_, eol) => {
    for (const size of [1, 2, 3, 5, 1000]) {
      expect(parse(chunk(stream(eol), size))).toEqual([
        { event: 'progress', data: '{"n":1}' },
        { event: 'result', data: '{"n":2}' },
      ]);
    }
  });

  it('does not split \\r\\n across chunks into two line breaks', () => {
    expect(parse(['data: a\r', '\ndata: b\r\n\r\n'])).toEqual([{ event: 'message', data: 'a\nb' }]);
  });

  it('joins multi-line data with newlines', () => {
    expect(parse(['data: a\ndata: b\n\n'])).toEqual([{ event: 'message', data: 'a\nb' }]);
  });

  it('ignores comments and unknown fields, and handles no space after the colon', () => {
    expect(parse([': keep-alive\nid: 7\nretry: 10\nevent:x\ndata:y\n\n'])).toEqual([
      { event: 'x', data: 'y' },
    ]);
  });

  it('flushes a final event that has no trailing blank line', () => {
    expect(parse(['event: result\ndata: done'])).toEqual([{ event: 'result', data: 'done' }]);
  });

  it('does not dispatch events without data, and resets the event type', () => {
    expect(parse(['event: orphan\n\ndata: plain\n\n'])).toEqual([
      { event: 'message', data: 'plain' },
    ]);
  });
});

describe('browseWithProgress', () => {
  const body = [
    ': keep-alive',
    '',
    'event: progress',
    'data: {"stage":"fetch","elapsed":1}',
    '',
    'event: progress',
    'data: {"stage":"fetch","elapsed":1}', // identical lines: old indexOf lookup misread these
    '',
    'event: result',
    'data: {"data":{"url":"https://x.com","title":"Café"}}', // no trailing blank line
  ].join('\r\n');

  it.each([1, 2, 7, 64, 100_000])('delivers every event with %i-byte chunks', async (size) => {
    mockFetch(() => sseResponse(body, size));
    const progress: unknown[] = [];
    const result = await client().browseWithProgress('https://x.com', (e) => progress.push(e));
    expect(progress).toHaveLength(2);
    expect(result.title).toBe('Café');
  });

  it('sends Accept: text/event-stream', async () => {
    const { calls } = mockFetch(() => sseResponse(body));
    await client().browseWithProgress('https://x.com', () => {});
    expect(calls[0].headers.Accept).toBe('text/event-stream');
  });

  it('throws the server error event', async () => {
    mockFetch(() =>
      sseResponse('event: error\ndata: {"error":{"code":"TIMEOUT","message":"slow"}}\n\n')
    );
    await expect(client().browseWithProgress('https://x.com', () => {})).rejects.toMatchObject({
      code: 'TIMEOUT',
      message: 'slow',
    });
  });

  it('throws SSE_ERROR when the stream ends without a result', async () => {
    mockFetch(() => sseResponse('event: progress\ndata: {}\n\n'));
    await expect(client().browseWithProgress('https://x.com', () => {})).rejects.toMatchObject({
      code: 'SSE_ERROR',
    });
  });

  it('throws SSE_ERROR on malformed JSON', async () => {
    mockFetch(() => sseResponse('event: result\ndata: {nope\n\n'));
    await expect(client().browseWithProgress('https://x.com', () => {})).rejects.toMatchObject({
      code: 'SSE_ERROR',
    });
  });

  it('keeps the structured error code on an HTTP error', async () => {
    mockFetch(() => json({ success: false, error: { code: 'UNAUTHORIZED', message: 'bad key' } }, 401));
    const err = await client().browseWithProgress('https://x.com', () => {}).catch((e) => e);
    expect(err).toBeInstanceOf(UnbrowserError);
    expect(err).toMatchObject({ code: 'UNAUTHORIZED', message: 'bad key', statusCode: 401 });
  });

  it('reports a non-JSON HTTP error as SSE_ERROR with the status', async () => {
    mockFetch(() => new Response('<html>bad gateway</html>', { status: 502 }));
    await expect(client().browseWithProgress('https://x.com', () => {})).rejects.toMatchObject({
      code: 'SSE_ERROR',
      statusCode: 502,
    });
  });
});

describe('researchWithProgress', () => {
  it('returns the result event payload', async () => {
    mockFetch(() =>
      sseResponse(
        'event: progress\ndata: {"stage":"search"}\n\nevent: result\ndata: {"answer":42}\n\n',
        3
      )
    );
    const progress: unknown[] = [];
    const result = await client().researchWithProgress({ scope: 'q' } as any, (e) => {
      progress.push(e);
    });
    expect(progress).toEqual([{ stage: 'search' }]);
    expect(result).toEqual({ answer: 42 });
  });
});
