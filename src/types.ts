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
