/**
 * @unbrowser/cloud - Agent-facing output helpers
 *
 * A full `BrowseResult` carries the page three times (markdown, text and
 * optionally HTML) plus tier/timing metadata. Agents that paste that whole
 * object into a model's context pay for all of it on every turn.
 *
 * These helpers apply two lessons from LangChain's "How we optimized browser
 * use for Deep Agents" write-up:
 *
 * 1. Only the final, useful output should enter the model's context.
 *    Intermediate data (other formats, raw metadata) stays in code.
 * 2. Trim at the source, not after the fact. The size limit is sent to the
 *    server as `maxChars`, so oversized pages are never transferred, and the
 *    agent is told explicitly when content was cut so it does not loop
 *    re-fetching the same page hoping for more.
 *
 * @module agent
 */

import type { BatchResult, BrowseOptions, BrowseResult, ExtractedTable } from './types.js';

/** Default per-page character budget for agent output. */
export const DEFAULT_AGENT_MAX_CHARS = 8000;

/**
 * Options controlling the compact, agent-ready view of a page.
 */
export interface AgentViewOptions {
  /**
   * Maximum characters of page content to return.
   * Sent to the server as `maxChars` so trimming happens at the source.
   * @default 8000
   */
  maxChars?: number;

  /**
   * Content format. HTML is not offered: it is the largest format and the
   * least useful to a model.
   * @default 'markdown'
   */
  format?: 'markdown' | 'text';

  /**
   * Include structured tables. Tables are often denser than the same data
   * rendered as markdown, so this is opt-in.
   * @default false
   */
  includeTables?: boolean;
}

/**
 * Compact, model-ready view of one page.
 */
export interface AgentPage {
  /** URL that was requested. */
  url: string;
  /** URL after redirects, only present when it differs from `url`. */
  finalUrl?: string;
  /** Page title. */
  title: string;
  /** Page content in the requested format, at most `maxChars` characters. */
  content: string;
  /**
   * True when the page had more content than was returned. Re-fetching the
   * same URL with the same budget will return the same content.
   */
  truncated: boolean;
  /** Structured tables, only when `includeTables` was requested. */
  tables?: ExtractedTable[];
  /** Rendering tier that served the page. */
  tier: string;
  /** Server-side load time in milliseconds. */
  loadTimeMs: number;
}

/**
 * A page in a batch that failed.
 */
export interface AgentPageError {
  url: string;
  error: { code: string; message: string };
}

/**
 * Result of `batchForAgent`.
 */
export interface AgentBatchResult {
  /** One entry per requested URL, in request order. */
  pages: Array<AgentPage | AgentPageError>;
  /** Total server time for the batch in milliseconds. */
  totalTimeMs: number;
}

/**
 * Options for `batchForAgent`.
 */
export interface AgentBatchOptions extends AgentViewOptions {
  /**
   * Character budget shared by all pages in the batch. Each page gets
   * `min(maxChars, floor(maxTotalChars / urls.length))`.
   */
  maxTotalChars?: number;
}

/** Type guard for a failed batch entry. */
export function isAgentPageError(page: AgentPage | AgentPageError): page is AgentPageError {
  return 'error' in page;
}

/**
 * Resolve the per-page character budget, validating user input.
 * @internal
 */
export function resolveMaxChars(maxChars: number | undefined): number {
  const value = maxChars ?? DEFAULT_AGENT_MAX_CHARS;
  if (!Number.isFinite(value) || value < 1) {
    throw new RangeError(`maxChars must be a positive number, got ${maxChars}`);
  }
  return Math.floor(value);
}

/**
 * Build the `BrowseOptions` sent to the server for an agent request.
 *
 * Asks for one character more than the budget: if the server returns more
 * than `maxChars`, the page was longer than the budget and the client marks
 * it truncated. If the server ignores `maxChars`, client-side trimming in
 * `toAgentPage` still enforces the budget.
 *
 * @internal
 */
export function toServerOptions(
  options: (BrowseOptions & AgentViewOptions) | undefined,
  maxChars: number
): BrowseOptions {
  const { format, maxChars: _ignored, ...rest } = options ?? {};
  return {
    ...rest,
    contentType: format ?? 'markdown',
    includeTables: options?.includeTables ?? false,
    maxChars: maxChars + 1,
  };
}

/**
 * Cut `content` to at most `maxChars`, preferring a paragraph or line break
 * in the last fifth of the budget so the model does not see a half sentence.
 */
function trimContent(content: string, maxChars: number): { text: string; truncated: boolean } {
  if (content.length <= maxChars) return { text: content, truncated: false };

  const hard = content.slice(0, maxChars);
  const floor = Math.floor(maxChars * 0.8);
  for (const sep of ['\n\n', '\n', '. ']) {
    const idx = hard.lastIndexOf(sep);
    if (idx >= floor) {
      return { text: hard.slice(0, idx + (sep === '. ' ? 1 : 0)).trimEnd(), truncated: true };
    }
  }
  return { text: hard, truncated: true };
}

/**
 * Convert a full `BrowseResult` into a compact `AgentPage`.
 *
 * Drops the formats and metadata the model does not need and enforces the
 * character budget.
 *
 * @example
 * ```typescript
 * const result = await client.browse(url);
 * const page = toAgentPage(result, { maxChars: 4000 });
 * messages.push({ role: 'user', content: JSON.stringify(page) });
 * ```
 */
export function toAgentPage(result: BrowseResult, options?: AgentViewOptions): AgentPage {
  const maxChars = resolveMaxChars(options?.maxChars);
  const format = options?.format ?? 'markdown';
  const raw = (format === 'text' ? result.content?.text : result.content?.markdown) ?? '';
  const { text, truncated } = trimContent(raw, maxChars);

  const page: AgentPage = {
    url: result.url,
    title: result.title ?? '',
    content: text,
    truncated,
    tier: result.metadata?.tier ?? 'unknown',
    loadTimeMs: result.metadata?.loadTime ?? 0,
  };
  if (result.finalUrl && result.finalUrl !== result.url) page.finalUrl = result.finalUrl;
  if (options?.includeTables && result.tables?.length) page.tables = result.tables;
  return page;
}

/**
 * Convert a `BatchResult` into compact agent pages, preserving order.
 */
export function toAgentBatch(result: BatchResult, options?: AgentViewOptions): AgentBatchResult {
  return {
    pages: result.results.map((item) => {
      if (item.success && item.data) return toAgentPage(item.data, options);
      return {
        url: item.url,
        error: item.error ?? { code: 'UNKNOWN_ERROR', message: 'Browse failed' },
      };
    }),
    totalTimeMs: result.totalTime,
  };
}
