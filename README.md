# @unbrowser/core

Official SDK for the Unbrowser cloud API - intelligent web browsing for AI agents.

## What is Unbrowser?

Unbrowser is an intelligent web browsing API that learns from patterns, discovers APIs automatically, and progressively optimizes to bypass browser rendering entirely.

**Key capabilities:**
- Extract content from any webpage as markdown, text, or HTML
- Automatic API discovery for 10x faster subsequent requests
- Workflow recording and replay for automation
- Session management for authenticated browsing
- Self-describing API designed for LLM agents

## Installation

```bash
npm install @unbrowser/core
```

## Quick Start

```typescript
import { createUnbrowser } from '@unbrowser/core';

const client = createUnbrowser({
  apiKey: process.env.UNBROWSER_API_KEY
});

// Browse a URL and extract content
const result = await client.browse('https://example.com');
console.log(result.content.markdown);
```

## LLM-Friendly Design

This SDK is designed specifically for AI agents. Every method is self-describing and the SDK can explain its own capabilities.

### Discover What the SDK Can Do

```typescript
// Get a high-level overview of capabilities
const caps = client.describe();
console.log(caps.description);
// "Official SDK for the Unbrowser cloud API. Provides intelligent web
// browsing with learned patterns, API discovery, and progressive optimization."

// List all categories
for (const category of caps.categories) {
  console.log(`${category.name}: ${category.methods.join(', ')}`);
}
// Content Extraction: browse, previewBrowse, browseWithProgress, fetch, batch
// Intelligence: getDomainIntelligence, discoverApis
// Workflows: startRecording, stopRecording, replayWorkflow, ...
// Skill Packs: exportSkillPack, importSkillPack, ...
// Account: getUsage, health
```

### Get Details About Any Method

```typescript
// Get complete information about a specific method
const info = client.getMethodInfo('browse');
console.log(info.description);
// "Browse a URL and extract its content as markdown, text, or HTML."

console.log(info.parameters);
// [{ name: 'url', type: 'string', required: true, description: '...' }, ...]

console.log(info.example);
// Full code example

console.log(info.useCases);
// ['Extract article content from a news site', 'Scrape product information', ...]
```

### Search for Methods

```typescript
// Find the right method for your task
const results = client.searchMethods('extract content from webpage');
for (const { method, relevance } of results) {
  if (relevance === 'high') {
    console.log(method); // 'browse'
  }
}
```

### Generate llms.txt

```typescript
// Generate an llms.txt file for LLM consumption
const llmsTxt = client.generateLlmsTxt();
// Save to file or serve at /llms.txt
```

## Core Methods

### browse(url, options?, session?)

Extract content from a URL. Uses tiered rendering for optimal speed:

1. **Intelligence tier** (~50-200ms): Uses learned patterns
2. **Lightweight tier** (~200-500ms): Uses linkedom
3. **Playwright tier** (~2-5s): Full browser for complex pages

```typescript
const result = await client.browse('https://example.com', {
  contentType: 'markdown',    // 'markdown' | 'text' | 'html'
  includeTables: true,        // Extract tables as structured data
  waitForSelector: '.loaded', // Wait for element before extracting
  verify: {                   // Content verification
    enabled: true,
    mode: 'thorough'          // 'basic' | 'standard' | 'thorough'
  }
});

console.log(result.title);              // Page title
console.log(result.content.markdown);   // Extracted content
console.log(result.tables);             // Structured tables
console.log(result.metadata.tier);      // Which tier was used
```

### batch(urls, options?, session?)

Browse multiple URLs in parallel:

```typescript
const result = await client.batch([
  'https://example.com/page1',
  'https://example.com/page2',
  'https://example.com/page3'
]);

for (const item of result.results) {
  if (item.success) {
    console.log(`${item.url}: ${item.data?.title}`);
  } else {
    console.log(`${item.url} failed: ${item.error?.message}`);
  }
}
```

### previewBrowse(url, options?)

Preview execution plan without browsing:

```typescript
const preview = await client.previewBrowse('https://example.com');

console.log(`Expected time: ${preview.estimatedTime.expected}ms`);
console.log(`Confidence: ${preview.confidence.overall}`);
console.log(`Will use: ${preview.plan.tier} tier`);
```

### getDomainIntelligence(domain)

Query learned patterns for a domain:

```typescript
const intel = await client.getDomainIntelligence('github.com');

console.log(`Known patterns: ${intel.knownPatterns}`);
console.log(`Success rate: ${(intel.successRate * 100).toFixed(0)}%`);
console.log(`Should use session: ${intel.shouldUseSession}`);
```

### discoverApis(domain, options?)

Discover API endpoints via fuzzing:

```typescript
const result = await client.discoverApis('api.example.com', {
  methods: ['GET'],
  learnPatterns: true
});

console.log(`Discovered ${result.discovered.length} endpoints`);
for (const endpoint of result.discovered) {
  console.log(`  ${endpoint.method} ${endpoint.path}`);
}
```

## Workflow Recording

Record and replay browsing workflows:

```typescript
// Start recording
const session = await client.startRecording({
  name: 'Extract product pricing',
  description: 'Navigate to product page and extract price',
  domain: 'shop.example.com'
});

// Browse operations are now recorded
await client.browse('https://shop.example.com/product/123');

// Stop and save
const workflow = await client.stopRecording(session.recordingId);
console.log(`Saved workflow: ${workflow.workflowId}`);

// Replay later with different parameters
const results = await client.replayWorkflow(workflow.workflowId, {
  productId: '456'
});
```

## Session Management

Browse with authentication:

```typescript
const result = await client.browse(
  'https://example.com/dashboard',
  { contentType: 'markdown' },
  {
    cookies: [
      { name: 'session_id', value: 'your-session-token' }
    ],
    localStorage: {
      'auth_token': 'your-auth-token'
    }
  }
);

// Capture new cookies for future requests
const newCookies = result.newCookies;
```

## Error Handling

All errors include recovery guidance:

```typescript
import { UnbrowserError, isRetryableError } from '@unbrowser/core';

try {
  await client.browse(url);
} catch (error) {
  if (error instanceof UnbrowserError) {
    console.log(`Error: ${error.code} - ${error.message}`);
    console.log(`Suggestion: ${error.recovery.suggestion}`);

    if (error.isRetryable()) {
      console.log(`Retry after: ${error.getRetryDelay()}ms`);
    }

    for (const alt of error.recovery.alternatives || []) {
      console.log(`Alternative: ${alt}`);
    }
  }
}
```

### Error Codes

| Code | Description | Retryable |
|------|-------------|-----------|
| `MISSING_API_KEY` | API key not provided | No |
| `INVALID_API_KEY` | Invalid API key format | No |
| `UNAUTHORIZED` | Invalid or expired API key | No |
| `RATE_LIMITED` | Too many requests | Yes |
| `TIMEOUT` | Request timed out | Yes |
| `CONTENT_BLOCKED` | Site blocked access | Yes |
| `CAPTCHA_DETECTED` | CAPTCHA detected | Yes |
| `BOT_DETECTED` | Bot detection triggered | Yes |

## Configuration

```typescript
const client = createUnbrowser({
  // Required
  apiKey: 'ub_live_xxxxx',

  // Optional
  baseUrl: 'https://api.unbrowser.ai',  // API base URL
  timeout: 60000,                        // Request timeout (ms)
  retry: true,                           // Retry failed requests
  maxRetries: 3                          // Max retry attempts
});
```

## Types

All types are fully documented and exported:

```typescript
import type {
  // Configuration
  UnbrowserConfig,

  // Browse
  BrowseOptions,
  BrowseResult,
  SessionData,
  Cookie,

  // Intelligence
  DomainIntelligence,
  BrowsePreview,
  FuzzDiscoveryResult,

  // Workflows
  SkillPack,
  SkillExportOptions,

  // Errors
  ErrorCode,
  ErrorRecovery,

  // Introspection
  SDKCapabilities,
  MethodInfo,
} from '@unbrowser/core';
```

## Standalone Introspection Functions

These functions are also available without a client instance:

```typescript
import {
  getCapabilities,
  getMethodInfo,
  listMethods,
  searchMethods,
  getExampleFor,
  generateLlmsTxt,
} from '@unbrowser/core';

// Get SDK capabilities
const caps = getCapabilities();

// Get method info
const info = getMethodInfo('browse');

// Search methods
const results = searchMethods('extract content');

// Get example for use case
const example = getExampleFor('scrape product pages');

// Generate llms.txt
const llmsTxt = generateLlmsTxt();
```

## Resources

- **Documentation**: https://docs.unbrowser.ai
- **API Reference**: https://docs.unbrowser.ai/api
- **Dashboard**: https://unbrowser.ai/dashboard
- **Status**: https://status.unbrowser.ai

## License

MIT
