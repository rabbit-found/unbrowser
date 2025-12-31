# @unbrowser/core Examples

⚠️ **WARNING: These examples are outdated and use incorrect imports.**

**Problem**: These examples import `createLLMBrowser` from the local dist, but `@unbrowser/core` only exports `createUnbrowser` (HTTP client wrapper). The `createLLMBrowser` function is from the root `llm-browser` package (local MCP server).

**Status**: These examples need to be either:
1. **Moved to root package** (`/examples/`) where `createLLMBrowser` actually exists
2. **Rewritten** to use `createUnbrowser()` and demonstrate HTTP client usage

**For now**: Use the root package examples at `/examples/` instead, or see the main README for HTTP client usage with `createUnbrowser()`.

---

## Original Documentation (Outdated)

This directory contains runnable examples demonstrating various SDK features.

## Prerequisites

```bash
# From the packages/core directory
npm install
npm run build
```

## Running Examples

All examples can be run directly with Node.js:

```bash
# Basic browsing
node examples/01-basic-browse.mjs

# Tier control
node examples/02-tier-control.mjs

# API discovery
node examples/03-api-discovery.mjs

# And so on...
```

## Examples Overview

| Example | Description |
|---------|-------------|
| 01-basic-browse | Simple URL browsing and content extraction |
| 02-tier-control | Control rendering tiers (intelligence, lightweight, playwright) |
| 03-api-discovery | Automatic API endpoint discovery from network traffic |
| 04-session-management | Save and restore authenticated sessions |
| 05-batch-browsing | Browse multiple URLs in parallel |
| 06-content-extraction | Extract tables, links, and structured data |
| 07-stealth-mode | Anti-bot evasion with fingerprint rotation |
| 08-error-handling | Structured error handling and retry patterns |
| 09-content-change-tracking | Monitor websites for content changes |
| 10-procedural-memory | Skill learning and replay |
| 11-analytics-dashboard | Usage tracking and performance metrics |
| 12-typescript-usage | Full TypeScript example with type imports |

## TypeScript Example

The TypeScript example (12-typescript-usage.ts) requires compilation:

```bash
# Compile
npx tsc examples/12-typescript-usage.ts --module NodeNext --moduleResolution NodeNext --target ES2022 --outDir examples/dist

# Run
node examples/dist/12-typescript-usage.js
```

## Common Patterns

### Initialize and Cleanup

Always clean up browser resources:

```javascript
import { createLLMBrowser } from '../dist/index.js';

const browser = await createLLMBrowser();
try {
  // Your code here
} finally {
  await browser.cleanup();
}
```

### Configuration Options

```javascript
const browser = await createLLMBrowser({
  sessionsDir: './my-sessions',
  enableLearning: true,
  enableProceduralMemory: true,
  browser: {
    headless: true,
    slowMo: 0,
  },
});
```

### Browse Options

```javascript
const result = await browser.browse('https://example.com', {
  forceTier: 'intelligence',  // 'intelligence' | 'lightweight' | 'playwright'
  timeout: 30000,
  enableLearning: true,
  includeDecisionTrace: true,
  captureNetwork: true,
});
```

### Error Handling

```javascript
import { validateUrlOrThrow, UrlSafetyError, StructuredError } from '../dist/index.js';

try {
  validateUrlOrThrow(url);
  const result = await browser.browse(url);
} catch (error) {
  if (error instanceof UrlSafetyError) {
    // SSRF protection blocked the URL
  } else if (error instanceof StructuredError) {
    // Structured error with code, severity, retryable flag
  }
}
```

## Need Help?

- See the main [README.md](../README.md) for full API documentation
- Check [SDK_ARCHITECTURE.md](../../../docs/SDK_ARCHITECTURE.md) for architecture details
- File issues at https://github.com/anthropics/llm-browser/issues
