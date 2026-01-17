/**
 * @unbrowser/core - Type Definitions
 *
 * Comprehensive type definitions for the Unbrowser SDK.
 * Every type is documented with descriptions, examples, and usage guidance
 * to enable LLM agents to discover and use the SDK effectively.
 *
 * @module types
 * @packageDocumentation
 */

// ============================================
// Configuration Types
// ============================================

/**
 * Configuration options for creating an Unbrowser client.
 *
 * @description
 * Use this to configure authentication, timeouts, and retry behavior.
 * The only required field is `apiKey`.
 *
 * @example
 * ```typescript
 * // Minimal configuration
 * const config: UnbrowserConfig = {
 *   apiKey: 'ub_live_xxxxx'
 * };
 *
 * // Full configuration with all options
 * const fullConfig: UnbrowserConfig = {
 *   apiKey: 'ub_live_xxxxx',
 *   baseUrl: 'https://api.unbrowser.ai',
 *   timeout: 60000,
 *   retry: true,
 *   maxRetries: 3
 * };
 * ```
 */
export interface UnbrowserConfig {
  /**
   * API key for authentication.
   * Must start with 'ub_live_' for production or 'ub_test_' for testing.
   * Get your API key at https://unbrowser.ai/dashboard
   */
  apiKey: string;

  /**
   * Base URL for the API.
   * @default 'https://api.unbrowser.ai'
   */
  baseUrl?: string;

  /**
   * Request timeout in milliseconds.
   * Increase for slow networks or complex pages.
   * @default 60000 (60 seconds)
   */
  timeout?: number;

  /**
   * Whether to retry failed requests automatically.
   * Uses exponential backoff between retries.
   * @default true
   */
  retry?: boolean;

  /**
   * Maximum number of retry attempts for failed requests.
   * Only applies when `retry` is true.
   * @default 3
   */
  maxRetries?: number;
}

// ============================================
// Browse Options
// ============================================

/**
 * Options for controlling how a URL is browsed and content is extracted.
 *
 * @description
 * Configure content type, wait conditions, cost limits, and verification.
 * All options are optional - sensible defaults are used if omitted.
 *
 * @example
 * ```typescript
 * // Fast extraction for simple pages
 * const fastOptions: BrowseOptions = {
 *   contentType: 'markdown',
 *   maxLatencyMs: 2000
 * };
 *
 * // Thorough extraction with verification
 * const thoroughOptions: BrowseOptions = {
 *   contentType: 'markdown',
 *   waitForSelector: '.content-loaded',
 *   scrollToLoad: true,
 *   includeTables: true,
 *   verify: { enabled: true, mode: 'thorough' }
 * };
 *
 * // Debug mode to see what's happening
 * const debugOptions: BrowseOptions = {
 *   debug: { visible: true, slowMotion: 500, screenshots: true }
 * };
 * ```
 */
export interface BrowseOptions {
  /**
   * Format for extracted content.
   * - 'markdown': Clean, readable markdown (best for LLMs)
   * - 'text': Plain text without formatting
   * - 'html': Raw HTML (largest, includes markup)
   * @default 'markdown'
   */
  contentType?: 'markdown' | 'text' | 'html';

  /**
   * CSS selector to wait for before extracting content.
   * Useful for SPAs that load content dynamically.
   * @example '.article-content', '#main-content', '[data-loaded="true"]'
   */
  waitForSelector?: string;

  /**
   * Whether to scroll the page to trigger lazy loading.
   * Enable for infinite scroll pages or lazy-loaded images.
   * @default false
   */
  scrollToLoad?: boolean;

  /**
   * Maximum characters to return in content.
   * Useful for limiting response size and costs.
   */
  maxChars?: number;

  /**
   * Whether to extract and structure tables from the page.
   * Tables are returned as arrays with headers and rows.
   * @default false
   */
  includeTables?: boolean;

  /**
   * Maximum latency allowed in milliseconds.
   * If exceeded, slower tiers are skipped and the request may fail.
   * Use to enforce time budgets.
   */
  maxLatencyMs?: number;

  /**
   * Maximum cost tier to use.
   * - 'intelligence': Fastest, lowest cost (~50-200ms), uses learned patterns
   * - 'lightweight': Medium speed (~200-500ms), uses linkedom
   * - 'playwright': Slowest, highest cost (~2-5s), full browser
   */
  maxCostTier?: 'intelligence' | 'lightweight' | 'playwright';

  /**
   * Content verification options.
   * Enable to validate extracted content meets quality thresholds.
   */
  verify?: VerificationOptions;

  /**
   * Debug mode options for Playwright tier.
   * Use to troubleshoot extraction issues.
   */
  debug?: DebugOptions;
}

/**
 * Options for content verification during browsing.
 *
 * @description
 * Verification checks ensure extracted content meets quality standards.
 * Use 'thorough' mode for critical data extraction.
 *
 * @example
 * ```typescript
 * const verify: VerificationOptions = {
 *   enabled: true,
 *   mode: 'thorough'
 * };
 * ```
 */
export interface VerificationOptions {
  /**
   * Enable content verification.
   * @default true for 'basic' mode
   */
  enabled?: boolean;

  /**
   * Verification thoroughness level.
   * - 'basic': Quick checks (content exists, reasonable length)
   * - 'standard': Moderate checks (structure validation)
   * - 'thorough': Comprehensive checks (semantic validation)
   * @default 'basic'
   */
  mode?: 'basic' | 'standard' | 'thorough';
}

/**
 * Debug options for Playwright browser tier.
 *
 * @description
 * Use debug mode to troubleshoot extraction issues.
 * Only applies when Playwright tier is used.
 *
 * @example
 * ```typescript
 * // Watch the browser in action
 * const debug: DebugOptions = {
 *   visible: true,
 *   slowMotion: 500,
 *   screenshots: true,
 *   consoleLogs: true
 * };
 * ```
 */
export interface DebugOptions {
  /**
   * Show browser window instead of running headless.
   * Useful for watching extraction in real-time.
   * @default false
   */
  visible?: boolean;

  /**
   * Delay in milliseconds between browser actions.
   * Makes it easier to follow what's happening.
   */
  slowMotion?: number;

  /**
   * Capture screenshots after each action.
   * Screenshots are included in the response.
   * @default false
   */
  screenshots?: boolean;

  /**
   * Collect browser console output.
   * Useful for debugging JavaScript errors.
   * @default false
   */
  consoleLogs?: boolean;
}

// ============================================
// Browse Results
// ============================================

/**
 * Result from browsing a URL.
 *
 * @description
 * Contains extracted content, metadata, discovered APIs, and verification results.
 * The `content.markdown` field is typically most useful for LLMs.
 *
 * @example
 * ```typescript
 * const result = await client.browse('https://example.com');
 *
 * // Access extracted content
 * console.log(result.content.markdown);
 *
 * // Check which tier was used
 * console.log(result.metadata.tier); // 'intelligence', 'lightweight', or 'playwright'
 *
 * // Access any discovered APIs
 * for (const api of result.discoveredApis || []) {
 *   console.log(`Found API: ${api.method} ${api.url}`);
 * }
 *
 * // Check verification results
 * if (result.verification?.passed) {
 *   console.log(`Content verified with ${result.verification.confidence * 100}% confidence`);
 * }
 * ```
 */
export interface BrowseResult {
  /**
   * The original URL that was requested.
   */
  url: string;

  /**
   * The final URL after any redirects.
   * May differ from `url` if the page redirected.
   */
  finalUrl: string;

  /**
   * Page title extracted from &lt;title&gt; tag or og:title.
   */
  title: string;

  /**
   * Extracted page content in multiple formats.
   */
  content: ContentResult;

  /**
   * Extracted tables from the page.
   * Only populated if `includeTables: true` was specified.
   */
  tables?: ExtractedTable[];

  /**
   * API endpoints discovered during browsing.
   * These can be used directly with fetch() for faster future access.
   */
  discoveredApis?: DiscoveredApi[];

  /**
   * Request metadata including timing and tier information.
   */
  metadata: BrowseMetadata;

  /**
   * Cookies set during the browse operation.
   * Pass these in future requests to maintain session state.
   */
  newCookies?: Cookie[];

  /**
   * Verification results if verification was enabled.
   * Check `passed` to see if content met quality thresholds.
   */
  verification?: VerificationResult;
}

/**
 * Extracted content in multiple formats.
 *
 * @description
 * Contains the page content converted to markdown, plain text, and optionally HTML.
 * Use `markdown` for LLM consumption - it preserves structure while being readable.
 */
export interface ContentResult {
  /**
   * Content converted to clean markdown.
   * Best format for LLM consumption - preserves headings, lists, links.
   */
  markdown: string;

  /**
   * Plain text content without formatting.
   * Useful for simple text analysis or embedding.
   */
  text: string;

  /**
   * Raw HTML content.
   * Only included if `contentType: 'html'` was specified.
   */
  html?: string;
}

/**
 * A table extracted from the page.
 *
 * @description
 * Tables are extracted and structured with headers and rows.
 * Enable with `includeTables: true` in browse options.
 *
 * @example
 * ```typescript
 * const result = await client.browse(url, { includeTables: true });
 *
 * for (const table of result.tables || []) {
 *   console.log('Headers:', table.headers.join(' | '));
 *   for (const row of table.rows) {
 *     console.log('Row:', row.join(' | '));
 *   }
 * }
 * ```
 */
export interface ExtractedTable {
  /**
   * Column headers extracted from &lt;th&gt; elements.
   */
  headers: string[];

  /**
   * Table rows, each containing cell values as strings.
   */
  rows: string[][];
}

/**
 * An API endpoint discovered during browsing.
 *
 * @description
 * The SDK automatically detects API calls made by the page.
 * You can use these endpoints directly with fetch() for faster access.
 *
 * @example
 * ```typescript
 * const result = await client.browse('https://example.com');
 *
 * for (const api of result.discoveredApis || []) {
 *   // Call the API directly next time
 *   const response = await fetch(api.url, { method: api.method });
 * }
 * ```
 */
export interface DiscoveredApi {
  /**
   * Full URL of the API endpoint.
   */
  url: string;

  /**
   * HTTP method used (GET, POST, etc.).
   */
  method: string;

  /**
   * Content type of the response (e.g., 'application/json').
   */
  contentType: string;
}

/**
 * Metadata about the browse request.
 */
export interface BrowseMetadata {
  /**
   * Total time in milliseconds to complete the request.
   */
  loadTime: number;

  /**
   * The rendering tier that was used.
   * - 'intelligence': Direct API/cache (fastest)
   * - 'lightweight': linkedom rendering (medium)
   * - 'playwright': Full browser (slowest)
   */
  tier: string;

  /**
   * All tiers that were attempted, in order.
   * Useful for understanding fallback behavior.
   */
  tiersAttempted: string[];
}

/**
 * Results from content verification.
 *
 * @description
 * Shows whether extracted content passed quality checks.
 * Use `confidence` to gauge reliability of the extraction.
 */
export interface VerificationResult {
  /**
   * Whether all verification checks passed.
   */
  passed: boolean;

  /**
   * Overall confidence score from 0 to 1.
   * Higher values indicate more reliable extraction.
   */
  confidence: number;

  /**
   * Number of verification checks that were run.
   */
  checksRun: number;

  /**
   * Error messages from failed checks.
   * Only present if some checks failed.
   */
  errors?: string[];

  /**
   * Warning messages from checks.
   * Present even if all checks passed.
   */
  warnings?: string[];
}

// ============================================
// Session and Cookie Types
// ============================================

/**
 * Session data to send with a browse request.
 *
 * @description
 * Use session data to maintain authenticated state across requests.
 * Pass cookies and localStorage values from previous requests.
 *
 * @example
 * ```typescript
 * // Login and capture session
 * const loginResult = await client.browse('https://example.com/login', {}, {
 *   cookies: [{ name: 'csrf', value: 'token123' }]
 * });
 *
 * // Use captured session for subsequent requests
 * const session: SessionData = {
 *   cookies: loginResult.newCookies,
 *   localStorage: { 'auth_token': 'xxx' }
 * };
 *
 * const protectedResult = await client.browse('https://example.com/dashboard', {}, session);
 * ```
 */
export interface SessionData {
  /**
   * Cookies to send with the request.
   */
  cookies?: Cookie[];

  /**
   * localStorage values to set before browsing.
   * Keys are localStorage keys, values are the data to store.
   */
  localStorage?: Record<string, string>;
}

/**
 * A browser cookie.
 *
 * @description
 * Standard cookie representation with name, value, and optional domain/path.
 */
export interface Cookie {
  /**
   * Cookie name.
   */
  name: string;

  /**
   * Cookie value.
   */
  value: string;

  /**
   * Domain the cookie is valid for.
   */
  domain?: string;

  /**
   * Path the cookie is valid for.
   */
  path?: string;
}

// ============================================
// Batch Operations
// ============================================

/**
 * Result from a batch browse operation.
 *
 * @description
 * Contains results for all URLs in the batch request.
 * Check `success` for each result to handle individual failures.
 *
 * @example
 * ```typescript
 * const result = await client.batch(['https://a.com', 'https://b.com']);
 *
 * for (const item of result.results) {
 *   if (item.success) {
 *     console.log(`${item.url}: ${item.data?.content.markdown.slice(0, 100)}`);
 *   } else {
 *     console.log(`${item.url} failed: ${item.error?.message}`);
 *   }
 * }
 *
 * console.log(`Total time: ${result.totalTime}ms`);
 * ```
 */
export interface BatchResult {
  /**
   * Results for each URL in the batch.
   */
  results: Array<{
    /**
     * The URL that was browsed.
     */
    url: string;

    /**
     * Whether the browse succeeded.
     */
    success: boolean;

    /**
     * Browse result if successful.
     */
    data?: BrowseResult;

    /**
     * Error information if failed.
     */
    error?: {
      code: string;
      message: string;
    };
  }>;

  /**
   * Total time in milliseconds for the entire batch.
   */
  totalTime: number;
}

// ============================================
// Domain Intelligence
// ============================================

/**
 * Intelligence gathered about a domain from previous browsing.
 *
 * @description
 * Shows learned patterns, success rates, and recommendations for a domain.
 * Use this to understand how well the SDK knows a domain.
 *
 * @example
 * ```typescript
 * const intel = await client.getDomainIntelligence('github.com');
 *
 * console.log(`Known patterns: ${intel.knownPatterns}`);
 * console.log(`Success rate: ${intel.successRate * 100}%`);
 * console.log(`Recommended wait: ${intel.recommendedWaitStrategy}`);
 *
 * if (intel.knownPatterns > 5 && intel.successRate > 0.9) {
 *   console.log('Domain is well-known, expect fast responses');
 * }
 * ```
 */
export interface DomainIntelligence {
  /**
   * The domain this intelligence is for.
   */
  domain: string;

  /**
   * Number of learned browsing patterns for this domain.
   * Higher numbers indicate better optimization.
   */
  knownPatterns: number;

  /**
   * Number of CSS selector chains learned.
   */
  selectorChains: number;

  /**
   * Number of content validators for this domain.
   */
  validators: number;

  /**
   * Number of pagination patterns discovered.
   */
  paginationPatterns: number;

  /**
   * Count of recent failures on this domain.
   * High numbers may indicate site changes or blocking.
   */
  recentFailures: number;

  /**
   * Success rate for requests to this domain (0 to 1).
   */
  successRate: number;

  /**
   * Domain group this site belongs to (e.g., 'ecommerce', 'social').
   */
  domainGroup: string | null;

  /**
   * Recommended wait strategy for this domain.
   * May be 'none', 'short', 'standard', or 'long'.
   */
  recommendedWaitStrategy: string;

  /**
   * Whether to use session persistence for this domain.
   * True for sites that require authentication.
   */
  shouldUseSession: boolean;
}

// ============================================
// Execution Preview Types
// ============================================

/**
 * Preview of how a browse request will be executed.
 *
 * @description
 * Call `previewBrowse()` to see the execution plan without actually browsing.
 * Useful for estimating time and cost before committing.
 *
 * @example
 * ```typescript
 * const preview = await client.previewBrowse('https://example.com');
 *
 * console.log(`Expected time: ${preview.estimatedTime.expected}ms`);
 * console.log(`Confidence: ${preview.confidence.overall}`);
 * console.log(`Will use ${preview.plan.tier} tier`);
 *
 * // Check if we should proceed
 * if (preview.estimatedTime.expected > 5000) {
 *   console.log('This will be slow, consider alternative approach');
 * }
 * ```
 */
export interface BrowsePreview {
  /**
   * Schema version for this preview format.
   */
  schemaVersion: string;

  /**
   * The planned execution approach.
   */
  plan: ExecutionPlan;

  /**
   * Estimated time breakdown for the request.
   */
  estimatedTime: TimeEstimate;

  /**
   * Confidence level for the execution plan.
   */
  confidence: ConfidenceLevel;

  /**
   * Alternative execution plans if the primary fails.
   */
  alternativePlans?: ExecutionPlan[];
}

/**
 * A planned sequence of actions to browse a URL.
 */
export interface ExecutionPlan {
  /**
   * Individual steps in the execution plan.
   */
  steps: ExecutionStep[];

  /**
   * The rendering tier that will be used.
   */
  tier: 'intelligence' | 'lightweight' | 'playwright';

  /**
   * Human-readable explanation of why this plan was chosen.
   */
  reasoning: string;

  /**
   * Backup plan if this one fails.
   */
  fallbackPlan?: ExecutionPlan;
}

/**
 * A single step in an execution plan.
 */
export interface ExecutionStep {
  /**
   * Order of this step (1-based).
   */
  order: number;

  /**
   * Action type (e.g., 'fetch', 'render', 'extract').
   */
  action: string;

  /**
   * Human-readable description of what this step does.
   */
  description: string;

  /**
   * Which tier this step uses.
   */
  tier: 'intelligence' | 'lightweight' | 'playwright';

  /**
   * Expected duration in milliseconds.
   */
  expectedDuration: number;

  /**
   * How confident we are this step will succeed.
   */
  confidence: 'high' | 'medium' | 'low';

  /**
   * Additional context about this step.
   */
  reason?: string;
}

/**
 * Estimated time for a browse operation.
 */
export interface TimeEstimate {
  /**
   * Minimum expected time in milliseconds.
   */
  min: number;

  /**
   * Maximum expected time in milliseconds.
   */
  max: number;

  /**
   * Most likely time in milliseconds.
   */
  expected: number;

  /**
   * Time breakdown by tier.
   */
  breakdown: Record<string, number>;
}

/**
 * Confidence assessment for an execution plan.
 */
export interface ConfidenceLevel {
  /**
   * Overall confidence level.
   */
  overall: 'high' | 'medium' | 'low';

  /**
   * Detailed factors affecting confidence.
   */
  factors: ConfidenceFactors;
}

/**
 * Factors that affect execution confidence.
 */
export interface ConfidenceFactors {
  /**
   * Whether we have learned patterns for this URL/domain.
   */
  hasLearnedPatterns: boolean;

  /**
   * How familiar we are with this domain.
   */
  domainFamiliarity: 'high' | 'medium' | 'low' | 'none';

  /**
   * Whether we discovered an API for this URL.
   */
  apiDiscovered: boolean;

  /**
   * Whether the page requires authentication.
   */
  requiresAuth: boolean;

  /**
   * Whether bot detection is likely present.
   */
  botDetectionLikely: boolean;

  /**
   * Whether we have skills available for this URL.
   */
  skillsAvailable: boolean;

  /**
   * Number of patterns available.
   */
  patternCount: number;

  /**
   * Historical success rate for these patterns.
   */
  patternSuccessRate: number;
}

// ============================================
// Progress Events
// ============================================

/**
 * Progress event during a browse operation.
 *
 * @description
 * Receive these via `browseWithProgress()` to track long-running operations.
 */
export interface ProgressEvent {
  /**
   * Current stage of the operation.
   */
  stage: string;

  /**
   * Tier being used (if applicable).
   */
  tier?: string;

  /**
   * Elapsed time in milliseconds.
   */
  elapsed: number;

  /**
   * Human-readable status message.
   */
  message?: string;
}

/**
 * Callback function for progress events.
 */
export type ProgressCallback = (event: ProgressEvent) => void;

// ============================================
// API Discovery Types
// ============================================

/**
 * Options for API endpoint discovery via fuzzing.
 *
 * @description
 * Configure which paths and methods to test when discovering APIs.
 * Discovery results are learned and used for future requests.
 *
 * @example
 * ```typescript
 * // Conservative discovery (safe)
 * const options: FuzzDiscoveryOptions = {
 *   methods: ['GET'],
 *   learnPatterns: true
 * };
 *
 * // Aggressive discovery
 * const aggressiveOptions: FuzzDiscoveryOptions = {
 *   methods: ['GET', 'POST', 'PUT', 'DELETE'],
 *   paths: ['/api', '/api/v1', '/api/v2', '/graphql'],
 *   probeTimeout: 5000,
 *   maxDuration: 60000
 * };
 * ```
 */
export interface FuzzDiscoveryOptions {
  /**
   * Paths to probe for API endpoints.
   * @default Common API paths like '/api', '/api/v1', etc.
   */
  paths?: string[];

  /**
   * HTTP methods to test.
   * @default ['GET']
   */
  methods?: string[];

  /**
   * Timeout per probe in milliseconds.
   * @default 3000
   */
  probeTimeout?: number;

  /**
   * Maximum total discovery time in milliseconds.
   * @default 30000
   */
  maxDuration?: number;

  /**
   * Whether to learn patterns from discoveries.
   * @default true
   */
  learnPatterns?: boolean;

  /**
   * Custom headers to send with probes.
   */
  headers?: Record<string, string>;

  /**
   * HTTP status codes considered successful.
   * @default [200, 201, 301, 302, 307, 308]
   */
  successCodes?: number[];
}

/**
 * Result from API endpoint discovery.
 *
 * @example
 * ```typescript
 * const result = await client.discoverApis('api.example.com');
 *
 * console.log(`Found ${result.discovered.length} endpoints`);
 * for (const endpoint of result.discovered) {
 *   console.log(`  ${endpoint.method} ${endpoint.path} (${endpoint.responseTime}ms)`);
 * }
 *
 * console.log(`Learned ${result.stats.patternsLearned} patterns`);
 * ```
 */
export interface FuzzDiscoveryResult {
  /**
   * Domain that was fuzzed.
   */
  domain: string;

  /**
   * Base URL used for fuzzing.
   */
  baseUrl: string;

  /**
   * Successfully discovered endpoints.
   */
  discovered: Array<{
    path: string;
    method: string;
    statusCode: number;
    responseTime: number;
    contentType?: string;
  }>;

  /**
   * Discovery statistics.
   */
  stats: {
    totalProbes: number;
    successfulEndpoints: number;
    failedProbes: number;
    patternsLearned: number;
    duration: number;
  };

  /**
   * Request metadata.
   */
  metadata: {
    timestamp: number;
    requestDuration: number;
  };
}

// ============================================
// Skill Pack Types
// ============================================

/**
 * Domain verticals for skill categorization.
 */
export type SkillVertical =
  | 'developer'
  | 'ecommerce'
  | 'social'
  | 'news'
  | 'finance'
  | 'research'
  | 'travel'
  | 'general';

/**
 * Skill loading priority tiers.
 */
export type SkillTier = 'essential' | 'domain-specific' | 'advanced';

/**
 * A learned browsing skill that can be replayed.
 *
 * @description
 * Skills are learned action sequences that can be reused across similar pages.
 * They enable automation without explicit programming.
 */
export interface BrowsingSkill {
  id: string;
  name: string;
  description: string;
  preconditions: {
    urlPatterns?: string[];
    domainPatterns?: string[];
    requiredSelectors?: string[];
    pageType?: string;
  };
  actionSequence: Array<{ type: string; [key: string]: unknown }>;
  metrics: {
    successCount: number;
    failureCount: number;
    timesUsed: number;
  };
  sourceDomain?: string;
  tier?: SkillTier;
  loadPriority?: number;
  sizeEstimate?: number;
}

/**
 * A pattern to avoid during browsing.
 */
export interface AntiPattern {
  id: string;
  pattern: string;
  reason: string;
  learnedFrom: string;
  occurrences: number;
}

/**
 * A multi-step workflow combining multiple skills.
 */
export interface SkillWorkflow {
  id: string;
  name: string;
  description: string;
  domain: string;
  steps: Array<{
    skillId?: string;
    action: string;
    description: string;
  }>;
}

/**
 * Metadata for a skill pack.
 */
export interface SkillPackMetadata {
  id: string;
  name: string;
  description: string;
  version: string;
  createdAt: number;
  sourceInstance?: string;
  verticals: SkillVertical[];
  domains: string[];
  stats: {
    skillCount: number;
    antiPatternCount: number;
    workflowCount: number;
    totalSuccessCount: number;
    avgSuccessRate: number;
  };
  compatibility: {
    minVersion: string;
    schemaVersion: string;
  };
}

/**
 * A portable collection of skills, anti-patterns, and workflows.
 *
 * @description
 * Skill packs can be exported, shared, and imported to transfer learned capabilities.
 */
export interface SkillPack {
  metadata: SkillPackMetadata;
  skills: BrowsingSkill[];
  antiPatterns: AntiPattern[];
  workflows: SkillWorkflow[];
}

/**
 * Options for exporting a skill pack.
 */
export interface SkillExportOptions {
  domainPatterns?: string[];
  verticals?: SkillVertical[];
  includeAntiPatterns?: boolean;
  includeWorkflows?: boolean;
  minSuccessRate?: number;
  minUsageCount?: number;
  packName?: string;
  packDescription?: string;
}

/**
 * Strategy for resolving skill conflicts during import.
 */
export type SkillConflictResolution = 'skip' | 'overwrite' | 'merge' | 'rename';

/**
 * Options for importing a skill pack.
 */
export interface SkillImportOptions {
  conflictResolution?: SkillConflictResolution;
  domainFilter?: string[];
  verticalFilter?: SkillVertical[];
  importAntiPatterns?: boolean;
  importWorkflows?: boolean;
  resetMetrics?: boolean;
  namePrefix?: string;
}

/**
 * Result from importing a skill pack.
 */
export interface SkillImportResult {
  success: boolean;
  skillsImported: number;
  skillsSkipped: number;
  skillsMerged: number;
  antiPatternsImported: number;
  workflowsImported: number;
  errors: string[];
  warnings: string[];
}

// ============================================
// Usage Statistics
// ============================================

/**
 * Usage statistics for the current billing period.
 *
 * @description
 * Track API usage, remaining quota, and request breakdown by tier.
 *
 * @example
 * ```typescript
 * const usage = await client.getUsage();
 *
 * console.log(`Period: ${usage.period.start} to ${usage.period.end}`);
 * console.log(`Total requests: ${usage.requests.total}`);
 * console.log(`Remaining: ${usage.limits.remaining} of ${usage.limits.daily}`);
 *
 * // Check tier usage
 * for (const [tier, count] of Object.entries(usage.requests.byTier)) {
 *   console.log(`  ${tier}: ${count}`);
 * }
 * ```
 */
export interface UsageStats {
  period: {
    start: string;
    end: string;
  };
  requests: {
    total: number;
    byTier: Record<string, number>;
  };
  limits: {
    daily: number;
    remaining: number;
  };
}

/**
 * Health check response.
 */
export interface HealthStatus {
  status: string;
  version: string;
  uptime?: number;
}

// ============================================
// Content Change Prediction Types
// ============================================

/**
 * Urgency level for content change predictions.
 * - 0: Low - content rarely changes
 * - 1: Normal - typical update patterns
 * - 2: High - frequent updates expected
 * - 3: Critical - imminent change predicted
 */
export type UrgencyLevel = 0 | 1 | 2 | 3;

/**
 * Calendar-based trigger for content changes.
 *
 * @description
 * Represents a detected pattern where content changes at specific calendar times.
 * For example, government rates that update annually on January 1st.
 */
export interface CalendarTrigger {
  /** Month when change typically occurs (1-12) */
  month: number;
  /** Day of month when change occurs (optional) */
  dayOfMonth?: number;
  /** Human-readable description */
  description: string;
  /** Confidence in this trigger (0-1) */
  confidence: number;
  /** Number of historical observations supporting this trigger */
  historicalCount: number;
}

/**
 * A single content change prediction.
 */
export interface ContentPrediction {
  /** Unix timestamp in milliseconds when change is predicted */
  predictedAt: number;
  /** Confidence in this prediction (0-1) */
  confidence: number;
  /** Explanation of why this prediction was made */
  reason: string;
}

/**
 * Pattern describing content change behavior for a URL.
 *
 * @description
 * Represents learned patterns about when and how content changes.
 * Used to optimize polling intervals and predict upcoming changes.
 *
 * @example
 * ```typescript
 * const predictions = await client.getPredictionsByDomain('boe.es');
 * for (const pattern of predictions.data.patterns) {
 *   console.log(`${pattern.urlPattern}: ${pattern.detectedPattern}`);
 *   if (pattern.nextPrediction) {
 *     console.log(`  Next change: ${new Date(pattern.nextPrediction.predictedAt)}`);
 *   }
 * }
 * ```
 */
export interface ContentChangePattern {
  /** Unique pattern identifier */
  id: string;
  /** Domain this pattern applies to */
  domain: string;
  /** URL pattern (path portion) */
  urlPattern: string;
  /** Detected change frequency pattern */
  detectedPattern: 'static' | 'daily' | 'weekly' | 'monthly' | 'annual' | 'irregular';
  /** Urgency level for monitoring */
  urgencyLevel: UrgencyLevel;
  /** Next predicted content change */
  nextPrediction: ContentPrediction | null;
  /** Calendar-based triggers detected */
  calendarTriggers: CalendarTrigger[];
  /** Seasonal patterns in change frequency */
  seasonalPattern: {
    /** Months with higher change frequency */
    highChangeMonths: number[];
    /** Total observations used for analysis */
    totalObservations: number;
  } | null;
  /** Recommended polling interval in milliseconds */
  recommendedPollIntervalMs: number;
}

/**
 * Data returned from getting all predictions.
 */
export interface PredictionsData {
  patterns: ContentChangePattern[];
  summary?: {
    totalPatterns: number;
    byUrgency: {
      critical: number;
      high: number;
      normal: number;
      low: number;
    };
    withCalendarTriggers: number;
  };
  metadata: {
    timestamp: number;
    requestDuration: number;
  };
}

/**
 * Data returned from getting predictions for a specific domain.
 */
export interface DomainPredictionsData {
  domain: string;
  patterns: ContentChangePattern[];
  metadata: {
    timestamp: number;
    requestDuration: number;
  };
}

/**
 * Data returned from getting prediction accuracy statistics.
 */
export interface PredictionAccuracyData {
  domain: string;
  urlPattern?: string;
  accuracy: {
    totalPredictions: number;
    correctPredictions: number;
    successRate: number;
    averageErrorHours?: number;
  };
  metadata: {
    timestamp: number;
  };
}

/**
 * Data returned from recording a content observation.
 */
export interface ObservationData {
  domain: string;
  urlPattern: string;
  pattern: ContentChangePattern;
  metadata: {
    timestamp: number;
  };
}

// ============================================
// Research Types
// ============================================

/**
 * JSON Schema property definition for research output.
 */
export interface ResearchJsonSchemaProperty {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  enum?: (string | number)[];
  items?: ResearchJsonSchemaProperty;
  properties?: Record<string, ResearchJsonSchemaProperty>;
}

/**
 * JSON Schema for defining expected research output structure.
 *
 * @description
 * Provide a schema to get structured data from research.
 * The engine will extract data matching this schema from sources.
 *
 * @example
 * ```typescript
 * const schema: ResearchJsonSchema = {
 *   type: 'object',
 *   properties: {
 *     monthly: { type: 'number', description: 'Monthly amount in EUR' },
 *     annual: { type: 'number', description: 'Annual amount' },
 *     effectiveDate: { type: 'string', description: 'When this rate became effective' }
 *   },
 *   required: ['monthly']
 * };
 * ```
 */
export interface ResearchJsonSchema {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean';
  properties?: Record<string, ResearchJsonSchemaProperty>;
  items?: ResearchJsonSchemaProperty;
  required?: string[];
  description?: string;
}

/**
 * Research request options.
 *
 * @description
 * Configure how the research engine searches and extracts data.
 *
 * @example
 * ```typescript
 * const options: ResearchOptions = {
 *   scope: 'current IPREM rates in Spain for 2025',
 *   outputSchema: {
 *     type: 'object',
 *     properties: {
 *       monthly: { type: 'number', description: 'Monthly IPREM in EUR' }
 *     }
 *   },
 *   strategy: 'authoritative',
 *   maxSources: 5,
 *   preferredDomains: ['boe.es', 'seg-social.es']
 * };
 * ```
 */
export interface ResearchOptions {
  /**
   * Natural language description of what to research.
   * Be specific - include dates, locations, and what data you need.
   */
  scope: string;

  /**
   * JSON schema for the expected output structure.
   * If provided, the engine extracts data matching this schema.
   */
  outputSchema?: ResearchJsonSchema;

  /**
   * Research strategy:
   * - "authoritative": Prioritize government/official sources (default)
   * - "comprehensive": Cast wide net, gather multiple perspectives
   * - "quick": Fast results from top 3 sources only
   */
  strategy?: 'authoritative' | 'comprehensive' | 'quick';

  /**
   * Maximum number of sources to consult.
   * Default: 5 for authoritative, 10 for comprehensive, 3 for quick
   */
  maxSources?: number;

  /**
   * Language hint for search and extraction.
   */
  language?: string;

  /**
   * Preferred domains - prioritize these if relevant.
   * Useful for government or official sources.
   */
  preferredDomains?: string[];

  /**
   * Previous research result for change detection.
   * If provided, the result will include what changed.
   */
  previousResult?: ResearchResult;

  /**
   * Enable progressive mode for faster results.
   * When enabled, returns early once quality threshold is met.
   * Default: true for authoritative strategy, false otherwise.
   */
  progressiveMode?: boolean;

  /**
   * Quality threshold for progressive mode early return.
   * Higher values wait longer for more/better sources.
   */
  progressiveThreshold?: {
    /** Min high-authority sources (score >= 0.8) before early return. Default: 2 */
    minHighAuthority?: number;
    /** Min total successful sources before early return. Default: 3 */
    minTotalSources?: number;
    /** Max wait time in ms. Default: 5000 */
    maxWaitMs?: number;
    /** Min wait time in ms (ensures fast sources get a chance). Default: 500 */
    minWaitMs?: number;
  };

  /**
   * Try to discover and use APIs instead of browser rendering.
   * Significantly faster for sites with available APIs.
   * Default: true for government domains.
   */
  tryApiFirst?: boolean;
}

/**
 * A source consulted during research.
 */
export interface ResearchSource {
  /** Source URL */
  url: string;
  /** Page title */
  title: string;
  /** Domain */
  domain: string;
  /** Source type classification */
  sourceType: 'government' | 'official' | 'news' | 'reference' | 'blog' | 'unknown';
  /** Authority score (0-1) */
  authorityScore: number;
  /** When the source was fetched */
  fetchedAt: string;
  /** Relevant excerpt from source */
  excerpt?: string;
  /** Data extracted from this source */
  extractedData?: Record<string, unknown>;
  /** Whether extraction succeeded */
  extractionSuccess: boolean;
  /** Error if extraction failed */
  extractionError?: string;
}

/**
 * Cross-verification result from multiple sources.
 */
export interface ResearchVerification {
  /** Whether sources agree on the data */
  sourcesAgree: boolean;
  /** Number of sources that agree */
  agreementCount: number;
  /** Total sources consulted */
  totalSources: number;
  /** Disagreements found between sources */
  disagreements?: Array<{
    field: string;
    values: Array<{ source: string; value: unknown }>;
  }>;
  /** Confidence from verification (0-1) */
  verificationConfidence: number;
}

/**
 * Change detection result when comparing to previous research.
 */
export interface ResearchChangeDetection {
  /** Whether data changed from previous result */
  hasChanged: boolean;
  /** Fields that changed */
  changedFields: Array<{
    field: string;
    previousValue: unknown;
    currentValue: unknown;
    changeType: 'added' | 'removed' | 'modified';
  }>;
  /** Change severity */
  severity: 'none' | 'minor' | 'major' | 'breaking';
  /** Human-readable summary */
  summary: string;
}

// ============================================================================
// Contradiction Detection Types
// ============================================================================

/**
 * Severity level of a contradiction or policy change indicator.
 */
export type ContradictionSeverity = 'critical' | 'major' | 'minor' | 'info';

/**
 * Category of contradiction detected.
 */
export type ContradictionCategory =
  | 'value_mismatch'     // Sources extract different values for the same field
  | 'policy_change'      // Content contains markers indicating policy has changed
  | 'denial_indicator';  // Content suggests denials/rejections are occurring

/**
 * A single contradiction or policy change alert.
 */
export interface ContradictionAlert {
  /** Unique identifier for this alert */
  id: string;
  /** Category of the contradiction */
  category: ContradictionCategory;
  /** Severity level */
  severity: ContradictionSeverity;
  /** Short title describing the issue */
  title: string;
  /** Detailed description */
  description: string;
  /** Field name if this is a value mismatch */
  field?: string;
  /** Conflicting values from different sources */
  conflictingValues?: Array<{
    value: unknown;
    source: string;
    sourceType: string;
    authorityScore: number;
  }>;
  /** Evidence supporting this alert */
  evidence: Array<{
    source: string;
    excerpt: string;
    matchedPattern?: string;
  }>;
  /** Recommended action to resolve */
  suggestedAction: string;
}

/**
 * Summary of all contradictions detected.
 */
export interface ContradictionSummary {
  /** Total number of alerts */
  total: number;
  /** Count by severity level */
  bySeverity: Record<ContradictionSeverity, number>;
  /** Whether any critical alerts exist */
  hasCritical: boolean;
  /** Human-readable summary */
  summary: string;
}

/**
 * Contradiction detection result.
 */
export interface ContradictionResult {
  /** Summary statistics */
  summary: ContradictionSummary;
  /** Individual alerts */
  items: ContradictionAlert[];
}

/**
 * Complete research result.
 *
 * @description
 * Contains extracted data, sources, confidence scores, and metadata.
 *
 * @example
 * ```typescript
 * const result = await client.research({
 *   scope: 'Spain IPREM 2025'
 * });
 *
 * if (result.success && result.confidence > 0.8) {
 *   console.log('High confidence result:', result.data);
 *   console.log('From', result.sources.length, 'sources');
 * }
 * ```
 */
export interface ResearchResult {
  /** Whether research succeeded */
  success: boolean;

  /** Error message if failed */
  error?: string;

  /** The research scope that was requested */
  scope: string;

  /**
   * Extracted data matching the output schema.
   * If no schema provided, contains unstructured findings.
   */
  data: Record<string, unknown> | null;

  /** Overall confidence score (0-1) */
  confidence: number;

  /** Confidence breakdown by factor */
  confidenceFactors: {
    sourceQuality: number;
    extractionSuccess: number;
    crossVerification: number;
    schemaMatch: number;
  };

  /** Sources consulted during research */
  sources: ResearchSource[];

  /** Cross-verification results */
  verification: ResearchVerification;

  /** Change detection (if previousResult was provided) */
  changes?: ResearchChangeDetection;

  /**
   * Whether contradictions or policy changes were detected.
   * Check `alerts` for details when true.
   */
  hasContradictions?: boolean;

  /**
   * Contradiction and policy change alerts.
   * Present when sources disagree or policy change markers are detected.
   */
  alerts?: ContradictionResult;

  /** Research metadata */
  metadata: {
    durationMs: number;
    searchQueries: string[];
    strategy: string;
    performedAt: string;
  };
}

/**
 * Simplified result from quick research.
 */
export interface QuickResearchResult {
  success: boolean;
  data: Record<string, unknown> | null;
  confidence: number;
  sources: Array<{
    url: string;
    title: string;
    sourceType: string;
  }>;
  durationMs: number;
}

/**
 * Research engine status.
 */
export interface ResearchStatus {
  status: {
    searchProvider: string;
    searchConfigured: boolean;
    engineInitialized: boolean;
  };
  capabilities: {
    naturalLanguageScope: boolean;
    outputSchema: boolean;
    crossVerification: boolean;
    changeDetection: boolean;
    strategies: string[];
  };
  configuration: {
    searchProviderRequired: boolean;
    preferredDomainsAlternative: boolean;
    maxSourcesLimit: number;
  };
}

/**
 * Research progress event for SSE streaming.
 */
export interface ResearchProgressEvent {
  /** Stage of research */
  stage: 'started' | 'searching' | 'browsing' | 'extracting' | 'verifying' | 'completed' | 'error';
  /** Elapsed time in ms */
  elapsed: number;
  /** Current source index (1-based) */
  currentSource?: number;
  /** Total sources to process */
  totalSources?: number;
  /** URL currently being processed */
  currentUrl?: string;
  /** Message for display */
  message?: string;
  /** Error message if stage is 'error' */
  error?: string;
}

/**
 * Callback for research progress events.
 */
export type ResearchProgressCallback = (event: ResearchProgressEvent) => void | Promise<void>;
