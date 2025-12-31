/**
 * Unbrowser HTTP Client
 *
 * Client for interacting with the Unbrowser cloud API.
 * Provides a simple interface for browsing URLs via the cloud service.
 */

// ============================================
// Types
// ============================================

export interface UnbrowserConfig {
  /** API key for authentication (required) */
  apiKey: string;
  /** Base URL for the API (default: https://api.unbrowser.ai) */
  baseUrl?: string;
  /** Request timeout in milliseconds (default: 60000) */
  timeout?: number;
  /** Retry failed requests (default: true) */
  retry?: boolean;
  /** Maximum retry attempts (default: 3) */
  maxRetries?: number;
}

export interface BrowseOptions {
  /** Content type to return (default: markdown) */
  contentType?: 'markdown' | 'text' | 'html';
  /** CSS selector to wait for before extraction */
  waitForSelector?: string;
  /** Scroll page to trigger lazy loading */
  scrollToLoad?: boolean;
  /** Maximum characters to return */
  maxChars?: number;
  /** Include tables in response */
  includeTables?: boolean;
  /** Maximum latency allowed (will skip slower tiers) */
  maxLatencyMs?: number;
  /** Maximum cost tier to use */
  maxCostTier?: 'intelligence' | 'lightweight' | 'playwright';
  /** Verification options (COMP-015) */
  verify?: {
    /** Enable verification (default: true for basic mode) */
    enabled?: boolean;
    /** Verification mode: basic, standard, or thorough */
    mode?: 'basic' | 'standard' | 'thorough';
  };
  /** Debug mode for Playwright tier (PLAY-001) */
  debug?: {
    /** Show browser window (headless: false) */
    visible?: boolean;
    /** ms delay between actions */
    slowMotion?: number;
    /** Capture screenshots after actions */
    screenshots?: boolean;
    /** Collect browser console output */
    consoleLogs?: boolean;
  };
}

export interface FuzzDiscoveryOptions {
  /** Paths to probe (default: common API paths) */
  paths?: string[];
  /** HTTP methods to test (default: ['GET']) */
  methods?: string[];
  /** Timeout per probe in ms (default: 3000) */
  probeTimeout?: number;
  /** Maximum total discovery time in ms (default: 30000) */
  maxDuration?: number;
  /** Whether to learn patterns from discoveries (default: true) */
  learnPatterns?: boolean;
  /** Custom headers for probes */
  headers?: Record<string, string>;
  /** Status codes considered successful (default: [200, 201, 301, 302, 307, 308]) */
  successCodes?: number[];
}

export interface FuzzDiscoveryResult {
  /** Domain that was fuzzed */
  domain: string;
  /** Base URL used for fuzzing */
  baseUrl: string;
  /** Successfully discovered endpoints */
  discovered: Array<{
    path: string;
    method: string;
    statusCode: number;
    responseTime: number;
    contentType?: string;
  }>;
  /** Discovery statistics */
  stats: {
    totalProbes: number;
    successfulEndpoints: number;
    failedProbes: number;
    patternsLearned: number;
    duration: number;
  };
  /** Request metadata */
  metadata: {
    timestamp: number;
    requestDuration: number;
  };
}

export interface SessionData {
  /** Cookies to send with the request */
  cookies?: Cookie[];
  /** LocalStorage values to set */
  localStorage?: Record<string, string>;
}

export interface Cookie {
  name: string;
  value: string;
  domain?: string;
  path?: string;
}

export interface BrowseResult {
  /** The original URL requested */
  url: string;
  /** The final URL after redirects */
  finalUrl: string;
  /** Page title */
  title: string;
  /** Extracted content */
  content: {
    markdown: string;
    text: string;
    html?: string;
  };
  /** Extracted tables (if includeTables was true) */
  tables?: Array<{
    headers: string[];
    rows: string[][];
  }>;
  /** Discovered API endpoints */
  discoveredApis?: Array<{
    url: string;
    method: string;
    contentType: string;
  }>;
  /** Request metadata */
  metadata: {
    loadTime: number;
    tier: string;
    tiersAttempted: string[];
  };
  /** New cookies set during the request */
  newCookies?: Cookie[];
  /** Verification result (COMP-015) */
  verification?: {
    /** Whether all checks passed */
    passed: boolean;
    /** Overall confidence (0-1) */
    confidence: number;
    /** Number of checks run */
    checksRun: number;
    /** Error messages from failed checks */
    errors?: string[];
    /** Warning messages */
    warnings?: string[];
  };
}

export interface BatchResult {
  results: Array<{
    url: string;
    success: boolean;
    data?: BrowseResult;
    error?: { code: string; message: string };
  }>;
  totalTime: number;
}

// ============================================
// Plan Preview Types
// ============================================

export interface ExecutionStep {
  order: number;
  action: string;
  description: string;
  tier: 'intelligence' | 'lightweight' | 'playwright';
  expectedDuration: number; // milliseconds
  confidence: 'high' | 'medium' | 'low';
  reason?: string;
}

export interface ExecutionPlan {
  steps: ExecutionStep[];
  tier: 'intelligence' | 'lightweight' | 'playwright';
  reasoning: string;
  fallbackPlan?: ExecutionPlan;
}

export interface TimeEstimate {
  min: number; // milliseconds
  max: number;
  expected: number;
  breakdown: {
    [tier: string]: number;
  };
}

export interface ConfidenceFactors {
  hasLearnedPatterns: boolean;
  domainFamiliarity: 'high' | 'medium' | 'low' | 'none';
  apiDiscovered: boolean;
  requiresAuth: boolean;
  botDetectionLikely: boolean;
  skillsAvailable: boolean;
  patternCount: number;
  patternSuccessRate: number;
}

export interface ConfidenceLevel {
  overall: 'high' | 'medium' | 'low';
  factors: ConfidenceFactors;
}

export interface BrowsePreview {
  schemaVersion: string;
  plan: ExecutionPlan;
  estimatedTime: TimeEstimate;
  confidence: ConfidenceLevel;
  alternativePlans?: ExecutionPlan[];
}

export interface DomainIntelligence {
  domain: string;
  knownPatterns: number;
  selectorChains: number;
  validators: number;
  paginationPatterns: number;
  recentFailures: number;
  successRate: number;
  domainGroup: string | null;
  recommendedWaitStrategy: string;
  shouldUseSession: boolean;
}

export interface ProgressEvent {
  stage: string;
  tier?: string;
  elapsed: number;
  message?: string;
}

export type ProgressCallback = (event: ProgressEvent) => void;

// ============================================
// Skill Pack Types (PACK-001)
// ============================================

export type SkillVertical =
  | 'developer'
  | 'ecommerce'
  | 'social'
  | 'news'
  | 'finance'
  | 'research'
  | 'travel'
  | 'general';

export type SkillTier = 'essential' | 'domain-specific' | 'advanced';

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
  actionSequence: Array<{ type: string; [key: string]: any }>;
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

export interface AntiPattern {
  id: string;
  pattern: string;
  reason: string;
  learnedFrom: string;
  occurrences: number;
}

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

export interface SkillPack {
  metadata: SkillPackMetadata;
  skills: BrowsingSkill[];
  antiPatterns: AntiPattern[];
  workflows: SkillWorkflow[];
}

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

export type SkillConflictResolution = 'skip' | 'overwrite' | 'merge' | 'rename';

export interface SkillImportOptions {
  conflictResolution?: SkillConflictResolution;
  domainFilter?: string[];
  verticalFilter?: SkillVertical[];
  importAntiPatterns?: boolean;
  importWorkflows?: boolean;
  resetMetrics?: boolean;
  namePrefix?: string;
}

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

export class UnbrowserError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'UnbrowserError';
  }
}

// ============================================
// Client Implementation
// ============================================

export class UnbrowserClient {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;
  private retry: boolean;
  private maxRetries: number;

  constructor(config: UnbrowserConfig) {
    if (!config.apiKey) {
      throw new UnbrowserError('MISSING_API_KEY', 'apiKey is required');
    }

    if (!config.apiKey.startsWith('ub_')) {
      throw new UnbrowserError('INVALID_API_KEY', 'Invalid API key format');
    }

    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl || 'https://api.unbrowser.ai').replace(/\/$/, '');
    this.timeout = config.timeout || 60000;
    this.retry = config.retry !== false;
    this.maxRetries = config.maxRetries || 3;
  }

  /**
   * Make an authenticated request to the API
   */
  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    options?: { signal?: AbortSignal }
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;

    let lastError: Error | null = null;
    const attempts = this.retry ? this.maxRetries : 1;

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: options?.signal || controller.signal,
        });

        clearTimeout(timeoutId);

        const result = (await response.json()) as { success: boolean; data?: T; error?: { code: string; message: string } };

        if (!result.success) {
          const error = result.error || { code: 'UNKNOWN_ERROR', message: 'Unknown error' };
          throw new UnbrowserError(error.code, error.message);
        }

        return result.data as T;
      } catch (error) {
        lastError = error as Error;

        // Don't retry on auth errors or bad requests
        if (error instanceof UnbrowserError) {
          if (['UNAUTHORIZED', 'FORBIDDEN', 'INVALID_REQUEST', 'INVALID_URL'].includes(error.code)) {
            throw error;
          }
        }

        // Don't retry on user abort
        if (error instanceof Error && error.name === 'AbortError') {
          throw new UnbrowserError('REQUEST_ABORTED', 'Request was aborted');
        }

        // Wait before retrying (exponential backoff)
        if (attempt < attempts) {
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw lastError || new UnbrowserError('UNKNOWN_ERROR', 'Request failed');
  }

  /**
   * Browse a URL and extract content
   */
  async browse(url: string, options?: BrowseOptions, session?: SessionData): Promise<BrowseResult> {
    return this.request<BrowseResult>('POST', '/v1/browse', {
      url,
      options,
      session,
    });
  }

  /**
   * Preview what will happen when browsing a URL (without executing)
   *
   * Returns execution plan, time estimates, and confidence levels.
   * Completes in <50ms vs 2-5s for browser automation.
   *
   * @example
   * ```typescript
   * const preview = await client.previewBrowse('https://reddit.com/r/programming');
   * console.log(`Expected time: ${preview.estimatedTime.expected}ms`);
   * console.log(`Confidence: ${preview.confidence.overall}`);
   * console.log(`Plan: ${preview.plan.steps.length} steps using ${preview.plan.tier} tier`);
   * ```
   */
  async previewBrowse(url: string, options?: BrowseOptions): Promise<BrowsePreview> {
    return this.request<BrowsePreview>('POST', '/v1/browse/preview', {
      url,
      options,
    });
  }

  /**
   * Browse a URL with progress updates via SSE
   */
  async browseWithProgress(
    url: string,
    onProgress: ProgressCallback,
    options?: BrowseOptions,
    session?: SessionData
  ): Promise<BrowseResult> {
    const fullUrl = `${this.baseUrl}/v1/browse`;

    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ url, options, session }),
    });

    if (!response.ok) {
      const text = await response.text();
      try {
        const error = JSON.parse(text);
        throw new UnbrowserError(error.error?.code || 'HTTP_ERROR', error.error?.message || `HTTP ${response.status}`);
      } catch {
        throw new UnbrowserError('HTTP_ERROR', `HTTP ${response.status}: ${text}`);
      }
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new UnbrowserError('SSE_ERROR', 'Failed to get response reader');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let result: BrowseResult | null = null;
    let error: UnbrowserError | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          const eventType = line.slice(7).trim();

          // Read the data line
          const dataLineIndex = lines.indexOf(line) + 1;
          if (dataLineIndex < lines.length && lines[dataLineIndex].startsWith('data: ')) {
            const data = JSON.parse(lines[dataLineIndex].slice(6));

            if (eventType === 'progress') {
              onProgress(data as ProgressEvent);
            } else if (eventType === 'result') {
              result = data.data as BrowseResult;
            } else if (eventType === 'error') {
              error = new UnbrowserError(data.error?.code || 'BROWSE_ERROR', data.error?.message || 'Browse failed');
            }
          }
        }
      }
    }

    if (error) throw error;
    if (!result) throw new UnbrowserError('SSE_ERROR', 'No result received');

    return result;
  }

  /**
   * Fast content fetch (tiered rendering)
   */
  async fetch(url: string, options?: BrowseOptions, session?: SessionData): Promise<BrowseResult> {
    return this.request<BrowseResult>('POST', '/v1/fetch', {
      url,
      options,
      session,
    });
  }

  /**
   * Browse multiple URLs in parallel
   */
  async batch(urls: string[], options?: BrowseOptions, session?: SessionData): Promise<BatchResult> {
    return this.request<BatchResult>('POST', '/v1/batch', {
      urls,
      options,
      session,
    });
  }

  /**
   * Get domain intelligence summary
   */
  async getDomainIntelligence(domain: string): Promise<DomainIntelligence> {
    return this.request<DomainIntelligence>('GET', `/v1/domains/${encodeURIComponent(domain)}/intelligence`);
  }

  /**
   * Get usage statistics for the current billing period
   */
  async getUsage(): Promise<{
    period: { start: string; end: string };
    requests: { total: number; byTier: Record<string, number> };
    limits: { daily: number; remaining: number };
  }> {
    return this.request('GET', '/v1/usage');
  }

  /**
   * Check API health (no auth required)
   */
  async health(): Promise<{ status: string; version: string; uptime?: number }> {
    const url = `${this.baseUrl}/health`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new UnbrowserError('HEALTH_CHECK_FAILED', `Health check failed: HTTP ${response.status}`);
    }

    return response.json() as Promise<{ status: string; version: string; uptime?: number }>;
  }

  // ============================================
  // Workflow Recording (COMP-010)
  // ============================================

  /**
   * Start a workflow recording session
   *
   * Records all browse operations for later replay.
   * Use with browse() by passing the recordingId in headers.
   *
   * @example
   * ```typescript
   * // Start recording
   * const session = await client.startRecording({
   *   name: 'Extract product pricing',
   *   description: 'Navigate to product page and extract price',
   *   domain: 'example.com'
   * });
   *
   * // Browse (auto-captured)
   * await client.browse('https://example.com/products/123', {
   *   headers: { 'X-Recording-Session': session.recordingId }
   * });
   *
   * // Stop and save
   * const workflow = await client.stopRecording(session.recordingId);
   * ```
   */
  async startRecording(request: {
    name: string;
    description: string;
    domain: string;
    tags?: string[];
  }): Promise<{ recordingId: string; status: string; startedAt: string }> {
    return this.request('POST', '/v1/workflows/record/start', request);
  }

  /**
   * Stop a recording session and optionally save as workflow
   */
  async stopRecording(recordingId: string, save: boolean = true): Promise<{
    workflowId: string;
    skillId: string;
    name: string;
    steps: number;
    estimatedDuration: number;
  } | null> {
    return this.request('POST', `/v1/workflows/record/${recordingId}/stop`, { save });
  }

  /**
   * Annotate a step in an active recording
   *
   * Mark steps as critical/important/optional and add descriptions.
   */
  async annotateRecording(recordingId: string, annotation: {
    stepNumber: number;
    annotation: string;
    importance?: 'critical' | 'important' | 'optional';
  }): Promise<{ recordingId: string; stepNumber: number; annotated: boolean }> {
    return this.request('POST', `/v1/workflows/record/${recordingId}/annotate`, annotation);
  }

  /**
   * Replay a saved workflow with optional variable substitution
   *
   * @example
   * ```typescript
   * // Replay with different product ID
   * const results = await client.replayWorkflow('wf_xyz789', {
   *   productId: '456'
   * });
   *
   * console.log(results.overallSuccess); // true
   * console.log(results.results[0].data); // First step result
   * ```
   */
  async replayWorkflow(workflowId: string, variables?: Record<string, string | number | boolean>): Promise<{
    workflowId: string;
    overallSuccess: boolean;
    totalDuration: number;
    results: Array<{
      stepNumber: number;
      success: boolean;
      duration: number;
      tier?: 'intelligence' | 'lightweight' | 'playwright';
      error?: string;
    }>;
  }> {
    return this.request('POST', `/v1/workflows/${workflowId}/replay`, { variables });
  }

  /**
   * List saved workflows
   */
  async listWorkflows(options?: {
    domain?: string;
    tags?: string[];
  }): Promise<{
    workflows: Array<{
      id: string;
      name: string;
      description: string;
      domain: string;
      tags: string[];
      steps: number;
      version: number;
      usageCount: number;
      successRate: number;
      createdAt: string;
      updatedAt: string;
    }>;
    total: number;
  }> {
    const params = new URLSearchParams();
    if (options?.domain) params.set('domain', options.domain);
    if (options?.tags) params.set('tags', options.tags.join(','));

    const query = params.toString();
    return this.request('GET', `/v1/workflows${query ? `?${query}` : ''}`);
  }

  /**
   * Get workflow details including full step information
   */
  async getWorkflow(workflowId: string): Promise<{
    id: string;
    name: string;
    description: string;
    domain: string;
    tags: string[];
    version: number;
    usageCount: number;
    successRate: number;
    skillId?: string;
    steps: Array<{
      stepNumber: number;
      action: string;
      url?: string;
      description: string;
      userAnnotation?: string;
      importance: 'critical' | 'important' | 'optional';
      tier?: 'intelligence' | 'lightweight' | 'playwright';
      duration?: number;
      success: boolean;
    }>;
    createdAt: string;
    updatedAt: string;
  }> {
    return this.request('GET', `/v1/workflows/${workflowId}`);
  }

  /**
   * Delete a saved workflow
   */
  async deleteWorkflow(workflowId: string): Promise<{ workflowId: string; deleted: boolean }> {
    return this.request('DELETE', `/v1/workflows/${workflowId}`);
  }

  // ============================================
  // Skill Pack Management (PACK-001)
  // ============================================

  /**
   * Export skills as a portable skill pack
   *
   * Create a JSON skill pack that can be shared via npm, GitHub, or imported
   * into other Unbrowser instances. Filter by domain, vertical, or quality metrics.
   *
   * @example
   * ```typescript
   * // Export all GitHub skills
   * const pack = await client.exportSkillPack({
   *   domainPatterns: ['github.com'],
   *   minSuccessRate: 0.8,
   *   packName: 'My GitHub Skills'
   * });
   *
   * // Save to file
   * await fs.writeFile('github-skills.json', JSON.stringify(pack, null, 2));
   * ```
   */
  async exportSkillPack(options?: SkillExportOptions): Promise<{
    success: boolean;
    pack: SkillPack;
    metadata: {
      skillCount: number;
      antiPatternCount: number;
      workflowCount: number;
      version: string;
      createdAt: number;
    };
  }> {
    return this.request('POST', '/v1/skill-packs/export', options || {});
  }

  /**
   * Import a skill pack into ProceduralMemory
   *
   * Install skills from a downloaded pack, npm package, or custom source.
   * Configure conflict resolution and filtering options.
   *
   * @example
   * ```typescript
   * // Import skills from a pack
   * const packJson = await fs.readFile('github-skills.json', 'utf-8');
   * const pack = JSON.parse(packJson);
   *
   * const result = await client.importSkillPack(pack, {
   *   conflictResolution: 'skip',
   *   resetMetrics: false
   * });
   *
   * console.log(`Imported ${result.result.skillsImported} skills`);
   * console.log(`Skipped ${result.result.skillsSkipped} duplicates`);
   * ```
   */
  async importSkillPack(
    pack: SkillPack,
    options?: SkillImportOptions
  ): Promise<{
    success: boolean;
    result: SkillImportResult;
  }> {
    return this.request('POST', '/v1/skill-packs/import', { pack, options });
  }

  /**
   * Browse official skill pack library
   *
   * List verified skill packs published by Unbrowser and the community.
   * Filter by vertical or search by keywords.
   *
   * @example
   * ```typescript
   * // List all developer-focused packs
   * const { packs } = await client.listSkillPackLibrary({ vertical: 'developer' });
   *
   * packs.forEach(pack => {
   *   console.log(`${pack.name}: ${pack.skillCount} skills`);
   * });
   * ```
   */
  async listSkillPackLibrary(options?: {
    vertical?: SkillVertical;
    search?: string;
  }): Promise<{
    success: boolean;
    packs: Array<{
      id: string;
      name: string;
      description: string;
      version: string;
      verticals: SkillVertical[];
      domains: string[];
      skillCount: number;
      downloadCount: number;
      verified: boolean;
      npmUrl: string;
    }>;
    total: number;
  }> {
    const params = new URLSearchParams();
    if (options?.vertical) params.set('vertical', options.vertical);
    if (options?.search) params.set('search', options.search);

    const query = params.toString();
    return this.request('GET', `/v1/skill-packs/library${query ? `?${query}` : ''}`);
  }

  /**
   * Install a skill pack from the official library
   *
   * Download and install a published skill pack by ID. Currently returns
   * 501 Not Implemented - use exportSkillPack() and importSkillPack() instead.
   *
   * @example
   * ```typescript
   * // Install GitHub skills (when implemented)
   * const result = await client.installSkillPack('@unbrowser/skills-github', {
   *   conflictResolution: 'skip'
   * });
   * ```
   */
  async installSkillPack(
    packId: string,
    options?: SkillImportOptions
  ): Promise<{
    success: boolean;
    result: SkillImportResult;
  }> {
    return this.request('POST', '/v1/skill-packs/install', { packId, options });
  }

  /**
   * Get statistics about loaded skills
   *
   * Returns skill counts by vertical and tier, plus progressive loading stats.
   * Useful for monitoring memory usage and lazy loading behavior.
   *
   * @example
   * ```typescript
   * const stats = await client.getSkillPackStats();
   *
   * console.log(`Total skills: ${stats.totalSkills}`);
   * console.log(`Essential (loaded): ${stats.loadingStats.totalLoaded}`);
   * console.log(`Domain-specific (lazy): ${stats.byTier['domain-specific']}`);
   * console.log(`Memory savings: ${stats.loadingStats.totalUnloaded} skills unloaded`);
   * ```
   */
  async getSkillPackStats(): Promise<{
    success: boolean;
    totalSkills: number;
    totalWorkflows: number;
    totalAntiPatterns: number;
    byVertical: Record<SkillVertical, number>;
    byTier: {
      essential: number;
      'domain-specific': number;
      advanced: number;
    };
    loadingStats: {
      totalLoaded: number;
      totalUnloaded: number;
      loadedDomains: string[];
    };
  }> {
    return this.request('GET', '/v1/skill-packs/stats');
  }

  /**
   * Discover API endpoints via fuzzing (FUZZ-001)
   *
   * Proactively discovers API endpoints by testing common path patterns.
   * Once discovered, APIs are cached and used directly for future requests,
   * bypassing browser rendering for 10x speedup.
   *
   * @param domain - Domain to discover APIs on (e.g., 'api.example.com')
   * @param options - Discovery options (paths, methods, timeouts)
   * @returns Discovery results with found endpoints and statistics
   *
   * @example
   * ```typescript
   * // Conservative discovery (GET only, safe)
   * const result = await client.discoverApis('api.github.com', {
   *   methods: ['GET'],
   *   learnPatterns: true,
   * });
   *
   * console.log(`Discovered ${result.discovered.length} endpoints`);
   * console.log(`Learned ${result.stats.patternsLearned} patterns`);
   *
   * // Now browse() will use discovered APIs directly
   * const data = await client.browse('https://api.github.com/users/octocat');
   * ```
   *
   * @example
   * ```typescript
   * // Aggressive discovery (all methods)
   * const result = await client.discoverApis('api.example.com', {
   *   methods: ['GET', 'POST', 'PUT', 'DELETE'],
   *   paths: ['/api', '/api/v1', '/graphql'],
   *   probeTimeout: 5000,
   *   maxDuration: 60000,
   * });
   * ```
   */
  async discoverApis(domain: string, options?: FuzzDiscoveryOptions): Promise<FuzzDiscoveryResult> {
    return this.request<FuzzDiscoveryResult>('POST', '/v1/discover/fuzz', {
      domain,
      options,
    });
  }
}

// ============================================
// Factory Function
// ============================================

/**
 * Create an Unbrowser client for cloud API access
 *
 * @example
 * ```typescript
 * import { createUnbrowser } from '@unbrowser/core';
 *
 * const client = createUnbrowser({
 *   apiKey: 'ub_live_xxxxx',
 * });
 *
 * const result = await client.browse('https://example.com');
 * console.log(result.content.markdown);
 * ```
 */
export function createUnbrowser(config: UnbrowserConfig): UnbrowserClient {
  return new UnbrowserClient(config);
}
