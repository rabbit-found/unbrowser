/**
 * Example 12: TypeScript Usage
 *
 * Full TypeScript example showing proper type imports and usage.
 * Compile: npx tsc examples/12-typescript-usage.ts --module NodeNext --moduleResolution NodeNext
 * Run: node examples/12-typescript-usage.js
 */

import {
  // Client and config
  createLLMBrowser,
  type LLMBrowserConfig,

  // Browse options and result
  type SmartBrowseOptions,
  type SmartBrowseResult,
  type RenderTier,

  // Error handling
  validateUrlOrThrow,
  UrlSafetyError,
  StructuredError,
  classifyFailure,

  // Content types
  type ContentResult,
  type ExtractedTable,

  // Learning types
  type ApiPattern,
  type ConfidenceLevel,

  // Session types
  type SessionHealth,

  // Stealth
  generateFingerprint,
  type BrowserFingerprint,
  BehavioralDelays,
} from '../dist/index.js';

// Type-safe configuration
const config: LLMBrowserConfig = {
  sessionsDir: './sessions',
  enableLearning: true,
  enableProceduralMemory: true,
  browser: {
    headless: true,
    slowMo: 0,
  },
};

// Type-safe browse options
const browseOptions: SmartBrowseOptions = {
  forceTier: 'intelligence' as RenderTier,
  timeout: 30000,
  includeDecisionTrace: true,
  enableLearning: true,
  minContentLength: 100,
};

async function main(): Promise<void> {
  const browser = await createLLMBrowser(config);

  try {
    // URL validation with typed error handling
    const url = 'https://example.com';
    try {
      validateUrlOrThrow(url);
    } catch (error: unknown) {
      if (error instanceof UrlSafetyError) {
        console.error(`URL blocked: ${error.category} - ${error.message}`);
        return;
      }
      throw error;
    }

    // Browse with typed result
    const result: SmartBrowseResult = await browser.browse(url, browseOptions);

    // Access typed content
    const title: string = result.title || '';
    const content: ContentResult = result.content;
    const tier: RenderTier = result.learning.renderTier;
    const confidence: ConfidenceLevel = result.learning.confidenceLevel;

    console.log(`Title: ${title}`);
    console.log(`Tier: ${tier}`);
    console.log(`Confidence: ${confidence}`);
    console.log(`Content length: ${content.text.length}`);

    // Access tables with types
    const tables: ExtractedTable[] = content.tables || [];
    for (const table of tables) {
      console.log(`Table headers: ${table.headers.join(', ')}`);
      console.log(`Table rows: ${table.rows.length}`);
    }

    // Access discovered APIs with types
    const apis: ApiPattern[] = result.discoveredApis || [];
    for (const api of apis) {
      console.log(`API: ${api.method} ${api.endpoint}`);
      console.log(`  Confidence: ${api.confidence}`);
    }

    // Session health check with types
    const health: SessionHealth = await browser.getSessionHealth('default');
    console.log(`Session healthy: ${health.isHealthy}`);

    // Fingerprint generation with types
    const fingerprint: BrowserFingerprint = generateFingerprint('example.com');
    console.log(`Fingerprint UA: ${fingerprint.userAgent}`);

    // Behavioral delay
    await BehavioralDelays.sleep(100, 200);

    // Error handling with types
    try {
      await browser.browse('https://nonexistent-domain-12345.com');
    } catch (error: unknown) {
      if (error instanceof StructuredError) {
        const code: string = error.code;
        const message: string = error.message;
        const retryable: boolean = error.retryable;
        console.log(`Error ${code}: ${message} (retryable: ${retryable})`);
      } else if (error instanceof Error) {
        const classified = classifyFailure(undefined, error);
        console.log(`Classified: ${classified.category}`);
      }
    }
  } finally {
    await browser.cleanup();
  }
}

main().catch(console.error);
