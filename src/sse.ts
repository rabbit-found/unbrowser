/**
 * @unbrowser/cloud - Server-Sent Events reader
 *
 * Minimal, dependency-free SSE parser following the WHATWG event-stream
 * format: events are separated by a blank line, `data:` lines accumulate,
 * and lines may end in `\n`, `\r\n` or `\r`. Network chunks can split an
 * event (or a single line) anywhere; the reader buffers until each event is
 * complete before dispatching it.
 *
 * @module sse
 * @internal
 */

/** One dispatched SSE event. */
export interface SseEvent {
  /** Event type from the `event:` field, `'message'` when absent. */
  event: string;
  /** Concatenated `data:` lines, joined with `\n`. */
  data: string;
}

/**
 * Incremental SSE parser. Feed it decoded text with `push()`, then call
 * `end()` once the stream closes to flush an event that lacked a trailing
 * blank line.
 */
export class SseParser {
  private buffer = '';
  private eventType = '';
  private dataLines: string[] = [];

  constructor(private readonly onEvent: (event: SseEvent) => void) {}

  /** Feed a chunk of decoded text. */
  push(chunk: string): void {
    this.buffer += chunk;
    let start = 0;
    for (let i = 0; i < this.buffer.length; i++) {
      const ch = this.buffer[i];
      if (ch !== '\n' && ch !== '\r') continue;
      // A trailing '\r' may be the first half of '\r\n'; wait for more input.
      if (ch === '\r' && i === this.buffer.length - 1) break;
      this.processLine(this.buffer.slice(start, i));
      if (ch === '\r' && this.buffer[i + 1] === '\n') i++;
      start = i + 1;
    }
    this.buffer = this.buffer.slice(start);
  }

  /** Flush any buffered line and pending event at end of stream. */
  end(): void {
    if (this.buffer.length > 0) {
      this.processLine(this.buffer.replace(/\r$/, ''));
      this.buffer = '';
    }
    this.dispatch();
  }

  private processLine(line: string): void {
    if (line === '') {
      this.dispatch();
      return;
    }
    if (line.startsWith(':')) return; // comment / keep-alive

    const colon = line.indexOf(':');
    const field = colon === -1 ? line : line.slice(0, colon);
    let value = colon === -1 ? '' : line.slice(colon + 1);
    if (value.startsWith(' ')) value = value.slice(1);

    if (field === 'event') this.eventType = value;
    else if (field === 'data') this.dataLines.push(value);
    // `id` and `retry` are not used by the Unbrowser API.
  }

  private dispatch(): void {
    if (this.dataLines.length > 0) {
      this.onEvent({ event: this.eventType || 'message', data: this.dataLines.join('\n') });
    }
    this.eventType = '';
    this.dataLines = [];
  }
}

/**
 * Read a fetch response body as SSE, calling `onEvent` for each event in
 * order. Resolves when the stream ends.
 */
export async function readSseStream(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: SseEvent) => void
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  const parser = new SseParser(onEvent);

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    parser.push(decoder.decode(value, { stream: true }));
  }
  parser.push(decoder.decode());
  parser.end();
}
