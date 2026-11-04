import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_AGENT_MAX_CHARS,
  isAgentPageError,
  toAgentBatch,
  toAgentPage,
} from '../src/agent.js';
import { browseResult, client, mockFetch, ok } from './helpers.js';

afterEach(() => vi.unstubAllGlobals());

const paragraph = 'A sentence that repeats. '.repeat(20);
const longMarkdown = Array.from({ length: 40 }, () => paragraph).join('\n\n');

describe('toAgentPage', () => {
  it('keeps only the fields a model needs', () => {
    const page = toAgentPage(browseResult());
    expect(page).toEqual({
      url: 'https://example.com',
      title: 'Example',
      content: '# Example',
      truncated: false,
      tier: 'lightweight',
      loadTimeMs: 120,
    });
  });

  it('includes finalUrl only when it differs', () => {
    const page = toAgentPage(browseResult({ finalUrl: 'https://example.com/after' }));
    expect(page.finalUrl).toBe('https://example.com/after');
  });

  it('uses text when format is text', () => {
    expect(toAgentPage(browseResult(), { format: 'text' }).content).toBe('Example');
  });

  it('includes tables only when requested', () => {
    const tables = [{ headers: ['a'], rows: [['1']] }];
    expect(toAgentPage(browseResult({ tables })).tables).toBeUndefined();
    expect(toAgentPage(browseResult({ tables }), { includeTables: true }).tables).toEqual(tables);
  });

  it('cuts long content at a paragraph break within the budget', () => {
    const page = toAgentPage(browseResult({ content: { markdown: longMarkdown, text: '' } }), {
      maxChars: 1200,
    });
    expect(page.truncated).toBe(true);
    expect(page.content.length).toBeLessThanOrEqual(1200);
    expect(page.content.length).toBeGreaterThanOrEqual(960); // not cut far below the budget
    expect(longMarkdown.startsWith(page.content)).toBe(true);
    expect(longMarkdown.slice(page.content.length)).toMatch(/^\s*\n\n/); // ends at a paragraph break
  });

  it('cuts hard when there is no break near the limit', () => {
    const page = toAgentPage(browseResult({ content: { markdown: 'x'.repeat(5000), text: '' } }), {
      maxChars: 100,
    });
    expect(page.content).toBe('x'.repeat(100));
    expect(page.truncated).toBe(true);
  });

  it('defaults to an 8000 character budget', () => {
    const page = toAgentPage(browseResult({ content: { markdown: 'y'.repeat(9000), text: '' } }));
    expect(page.content.length).toBe(DEFAULT_AGENT_MAX_CHARS);
  });

  it.each([0, -1, NaN, Infinity])('rejects maxChars %s', (maxChars) => {
    expect(() => toAgentPage(browseResult(), { maxChars })).toThrow(RangeError);
  });
});

describe('toAgentBatch', () => {
  it('maps successes and failures in order', () => {
    const batch = toAgentBatch({
      totalTime: 50,
      results: [
        { url: 'https://a.com', success: false, error: { code: 'TIMEOUT', message: 'slow' } },
        { url: 'https://b.com', success: true, data: browseResult({ url: 'https://b.com' }) },
        { url: 'https://c.com', success: false },
      ],
    });
    expect(batch.totalTimeMs).toBe(50);
    expect(batch.pages.map((p) => p.url)).toEqual(['https://a.com', 'https://b.com', 'https://c.com']);
    expect(isAgentPageError(batch.pages[0])).toBe(true);
    expect(isAgentPageError(batch.pages[1])).toBe(false);
    expect(batch.pages[2]).toMatchObject({ error: { code: 'UNKNOWN_ERROR' } });
  });
});

describe('browseForAgent', () => {
  it('asks the server for one character over the budget, as markdown', async () => {
    const { calls } = mockFetch(() => ok(browseResult()));
    await client().browseForAgent('https://x.com', { maxChars: 500, waitForSelector: '#main' });
    expect(calls[0].body.options).toEqual({
      contentType: 'markdown',
      includeTables: false,
      maxChars: 501,
      waitForSelector: '#main',
    });
  });

  it('marks the page truncated when the server returns more than the budget', async () => {
    mockFetch(() => ok(browseResult({ content: { markdown: 'z'.repeat(501), text: '' } })));
    const page = await client().browseForAgent('https://x.com', { maxChars: 500 });
    expect(page.truncated).toBe(true);
    expect(page.content.length).toBe(500);
  });

  it('is not truncated when the page fits exactly', async () => {
    mockFetch(() => ok(browseResult({ content: { markdown: 'z'.repeat(500), text: '' } })));
    const page = await client().browseForAgent('https://x.com', { maxChars: 500 });
    expect(page.truncated).toBe(false);
  });

  it('rejects an invalid budget without calling the API', async () => {
    const { calls } = mockFetch(() => ok(browseResult()));
    await expect(client().browseForAgent('https://x.com', { maxChars: 0 })).rejects.toThrow(
      RangeError
    );
    expect(calls).toHaveLength(0);
  });
});

describe('batchForAgent', () => {
  it('splits maxTotalChars evenly and uses one request', async () => {
    const { calls } = mockFetch(() =>
      ok({
        totalTime: 10,
        results: ['https://a.com', 'https://b.com', 'https://c.com'].map((url) => ({
          url,
          success: true,
          data: browseResult({ url, content: { markdown: 'q'.repeat(5000), text: '' } }),
        })),
      })
    );
    const { pages } = await client().batchForAgent(
      ['https://a.com', 'https://b.com', 'https://c.com'],
      { maxTotalChars: 3000 }
    );
    expect(calls).toHaveLength(1);
    expect(calls[0].body.options.maxChars).toBe(1001);
    expect(calls[0].body.options).not.toHaveProperty('maxTotalChars');
    for (const page of pages) {
      expect(isAgentPageError(page)).toBe(false);
      if (!isAgentPageError(page)) expect(page.content.length).toBe(1000);
    }
  });

  it('keeps maxChars when it is smaller than the share', async () => {
    const { calls } = mockFetch(() => ok({ totalTime: 0, results: [] }));
    await client().batchForAgent(['https://a.com'], { maxChars: 200, maxTotalChars: 10_000 });
    expect(calls[0].body.options.maxChars).toBe(201);
  });

  it('returns immediately for an empty list', async () => {
    const { calls } = mockFetch(() => ok({ totalTime: 0, results: [] }));
    await expect(client().batchForAgent([])).resolves.toEqual({ pages: [], totalTimeMs: 0 });
    expect(calls).toHaveLength(0);
  });

  it('rejects a total budget smaller than one character per URL', async () => {
    mockFetch(() => ok({ totalTime: 0, results: [] }));
    await expect(
      client().batchForAgent(['https://a.com', 'https://b.com', 'https://c.com'], { maxTotalChars: 2 })
    ).rejects.toThrow(RangeError);
  });
});
