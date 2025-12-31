/**
 * @unbrowser/core - Client Implementation
 *
 * The main UnbrowserClient class with all browsing, workflow,
 * and skill pack functionality.
 *
 * @module client
 * @packageDocumentation
 */

import {
  UnbrowserError,
  isRetryableError,
  type ErrorCode,
} from './errors.js';

import type {
  UnbrowserConfig,
  BrowseOptions,
  BrowseResult,
  BatchResult,
  SessionData,
  DomainIntelligence,
  BrowsePreview,
  FuzzDiscoveryOptions,
  FuzzDiscoveryResult,
  ProgressEvent,
  ProgressCallback,
  UsageStats,
  HealthStatus,
  SkillPack,
  SkillExportOptions,
  SkillImportOptions,
  SkillImportResult,
  SkillVertical,
  SkillTier,
} from './types.js';

import {
  getCapabilities,
  getMethodInfo,
  listMethods,
  searchMethods,
  generateLlmsTxt,
  type SDKCapabilities,
  type MethodInfo,
} from './introspection.js';

/**
 * Official client for the Unbrowser cloud API.
 *
 * @description
 * UnbrowserClient provides intelligent web browsing for AI agents.
 * It learns from browsing patterns, discovers APIs automatically,
 * and progressively optimizes to bypass browser rendering.
 *
 * ## Key Features
 *
 * - **Tiered Rendering**: Intelligence (~50ms) -> Lightweight (~200ms) -> Playwright (~2-5s)
 * - **API Discovery**: Automatically discovers and caches API patterns
 * - **Workflow Recording**: Record and replay browsing workflows
 * - **Skill Packs**: Export and import portable skill collections
 *
 * ## Quick Start
 *
 * ```typescript
 * import { createUnbrowser } from '@unbrowser/core';
 *
 * const client = createUnbrowser({
 *   apiKey: process.env.UNBROWSER_API_KEY
 * });
 *
 * // Browse a URL
 * const result = await client.browse('https://example.com');
 * console.log(result.content.markdown);
 *
 * // Discover this client's capabilities
 * const caps = client.describe();
 * console.log(caps.description);
 * ```
 *
 * ## Self-Discovery
 *
 * This SDK is designed for LLM agents. Use these methods to discover capabilities:
 *
 * - `describe()` - Get high-level SDK capabilities
 * - `getMethodInfo(name)` - Get detailed info about a method
 * - `listMethods()` - List all available methods
 * - `searchMethods(query)` - Search for methods by description
 *
 * @see https://docs.unbrowser.ai for full documentation
 */
export class UnbrowserClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly retry: boolean;
  private readonly maxRetries: number;

  /**
   * Create a new UnbrowserClient.
   *
   * @param config - Configuration options including API key
   * @throws {UnbrowserError} If API key is missing or invalid
   *
   * @example
   * ```typescript
   * const client = new UnbrowserClient({
   *   apiKey: 'ub_live_xxxxx',
   *   timeout: 60000
   * });
   * ```
   */
  constructor(config: UnbrowserConfig) {
    if (!config.apiKey) {
      throw new UnbrowserError('MISSING_API_KEY', 'apiKey is required');
    }

    if (!config.apiKey.startsWith('ub_')) {
      throw new UnbrowserError(
        'INVALID_API_KEY',
        'Invalid API key format. API keys must start with "ub_live_" or "ub_test_"'
      );
    }

    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl || 'https://api.unbrowser.ai').replace(/\/$/, '');
    this.timeout = config.timeout || 60000;
    this.retry = config.retry !== false;
    this.maxRetries = config.maxRetries || 3;
  }

  // ============================================
  // Self-Discovery Methods (LLM-Friendly)
  // ============================================

  /**
   * Get a high-level description of SDK capabilities.
   *
   * @description
   * Returns an overview of what this SDK can do, organized by category.
   * Use this to understand the SDK before diving into specific methods.
   *
   * This method is designed for LLM discovery - call it first to understand
   * what's available.
   *
   * @example
   * ```typescript
   * const caps = client.describe();
   * console.log(caps.description);
   *
   * for (const category of caps.categories) {
   *   console.log(`${category.name}:`);
   *   for (const method of category.methods) {
   *     console.log(`  - ${method}`);
   *   }
   * }
   * ```
   */
  describe(): SDKCapabilities {
    return getCapabilities();
  }

  /**
   * Get detailed information about a specific method.
   *
   * @description
   * Returns comprehensive information about a method including:
   * - Description and details
   * - All parameters with types and examples
   * - Return type
   * - Example code
   * - Related methods and use cases
   *
   * @param methodName - Name of the method to get info about
   * @returns Method information or undefined if not found
   *
   * @example
   * ```typescript
   * const info = client.getMethodInfo('browse');
   * console.log(info?.description);
   * console.log(info?.example);
   *
   * for (const param of info?.parameters || []) {
   *   console.log(`${param.name}: ${param.type} - ${param.description}`);
   * }
   * ```
   */
  getMethodInfo(methodName: string): MethodInfo | undefined {
    return getMethodInfo(methodName);
  }

  /**
   * List all available methods on this client.
   *
   * @description
   * Returns an array of method names. Use with getMethodInfo() to
   * get details about each method.
   *
   * @example
   * ```typescript
   * const methods = client.listMethods();
   * console.log(`Available methods: ${methods.length}`);
   *
   * for (const name of methods) {
   *   const info = client.getMethodInfo(name);
   *   console.log(`${name}: ${info?.description}`);
   * }
   * ```
   */
  listMethods(): string[] {
    return listMethods();
  }

  /**
   * Search for methods matching a query.
   *
   * @description
   * Searches method names, descriptions, and use cases for matching terms.
   * Returns results sorted by relevance.
   *
   * @param query - Search query (e.g., "extract content", "batch")
   * @returns Array of matching methods with relevance scores
   *
   * @example
   * ```typescript
   * const results = client.searchMethods('extract content from web page');
   *
   * for (const { method, relevance } of results) {
   *   if (relevance === 'high') {
   *     const info = client.getMethodInfo(method);
   *     console.log(`${method}: ${info?.description}`);
   *   }
   * }
   * ```
   */
  searchMethods(query: string): Array<{ method: string; relevance: 'high' | 'medium' | 'low' }> {
    return searchMethods(query);
  }

  /**
   * Generate llms.txt content for this SDK.
   *
   * @description
   * Creates content following the llms.txt specification (llmstxt.org).
   * This provides a curated, LLM-readable summary of the SDK.
   *
   * @example
   * ```typescript
   * const llmsTxt = client.generateLlmsTxt();
   * // Save to file or serve at /llms.txt
   * ```
   */
  generateLlmsTxt(): string {
    return generateLlmsTxt();
  }

  // ============================================
  // Core Browsing Methods
  // ============================================

  /**
   * Browse a URL and extract content.
   *
   * @description
   * The primary method for web content extraction. Uses a tiered approach:
   *
   * 1. **Intelligence tier** (~50-200ms): Uses learned patterns and cached data
   * 2. **Lightweight tier** (~200-500ms): Uses linkedom for simple rendering
   * 3. **Playwright tier** (~2-5s): Full browser for complex pages
   *
   * The SDK automatically selects the best tier based on domain knowledge.
   *
   * @param url - URL to browse (must include protocol)
   * @param options - Extraction options (content type, wait conditions, etc.)
   * @param session - Session data for authenticated browsing
   * @returns Extracted content with metadata
   *
   * @throws {UnbrowserError} On network, authentication, or extraction errors
   *
   * @example Basic usage
   * ```typescript
   * const result = await client.browse('https://example.com');
   * console.log(result.content.markdown);
   * ```
   *
   * @example With options
   * ```typescript
   * const result = await client.browse('https://example.com', {
   *   contentType: 'markdown',
   *   includeTables: true,
   *   waitForSelector: '.content-loaded',
   *   verify: { enabled: true, mode: 'thorough' }
   * });
   *
   * if (result.verification?.passed) {
   *   console.log('Content verified');
   * }
   * ```
   *
   * @example With session
   * ```typescript
   * const result = await client.browse('https://example.com/dashboard', {}, {
   *   cookies: [{ name: 'session', value: 'token123' }]
   * });
   * ```
   */
  async browse(url: string, options?: BrowseOptions, session?: SessionData): Promise<BrowseResult> {
    return this.request<BrowseResult>('POST', '/v1/browse', {
      url,
      options,
      session,
    });
  }

  /**
   * Preview how a URL will be browsed without executing.
   *
   * @description
   * Returns the execution plan, estimated time, and confidence level
   * without actually browsing. Use this to:
   *
   * - Estimate time before committing
   * - Check if a URL is worth browsing
   * - Understand the SDK's approach
   *
   * Preview completes in ~50ms vs 2-5s for actual browsing.
   *
   * @param url - URL to preview
   * @param options - Browse options to preview
   * @returns Execution plan with time estimates
   *
   * @example
   * ```typescript
   * const preview = await client.previewBrowse('https://example.com');
   *
   * console.log(`Expected time: ${preview.estimatedTime.expected}ms`);
   * console.log(`Confidence: ${preview.confidence.overall}`);
   * console.log(`Will use ${preview.plan.tier} tier`);
   *
   * // Decide whether to proceed
   * if (preview.estimatedTime.expected < 5000) {
   *   const result = await client.browse('https://example.com');
   * }
   * ```
   */
  async previewBrowse(url: string, options?: BrowseOptions): Promise<BrowsePreview> {
    return this.request<BrowsePreview>('POST', '/v1/browse/preview', {
      url,
      options,
    });
  }

  /**
   * Browse with real-time progress updates.
   *
   * @description
   * Same as browse() but provides progress callbacks as the operation proceeds.
   * Uses Server-Sent Events for real-time updates.
   *
   * @param url - URL to browse
   * @param onProgress - Callback for progress events
   * @param options - Browse options
   * @param session - Session data
   * @returns Same as browse()
   *
   * @example
   * ```typescript
   * const result = await client.browseWithProgress(
   *   'https://example.com',
   *   (event) => {
   *     console.log(`Stage: ${event.stage}`);
   *     console.log(`Elapsed: ${event.elapsed}ms`);
   *     if (event.tier) console.log(`Tier: ${event.tier}`);
   *   }
   * );
   * ```
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
        const body = JSON.parse(text);
        throw UnbrowserError.fromResponse(response, body);
      } catch {
        throw new UnbrowserError('SSE_ERROR', `HTTP ${response.status}: ${text}`);
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
          const dataLineIndex = lines.indexOf(line) + 1;

          if (dataLineIndex < lines.length && lines[dataLineIndex].startsWith('data: ')) {
            const data = JSON.parse(lines[dataLineIndex].slice(6));

            if (eventType === 'progress') {
              onProgress(data as ProgressEvent);
            } else if (eventType === 'result') {
              result = data.data as BrowseResult;
            } else if (eventType === 'error') {
              error = new UnbrowserError(
                data.error?.code || 'SSE_ERROR',
                data.error?.message || 'Browse failed'
              );
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
   * Fast content fetch with tiered rendering.
   *
   * @description
   * Optimized version of browse() for speed.
   * May skip some extraction steps to reduce latency.
   *
   * @param url - URL to fetch
   * @param options - Fetch options
   * @param session - Session data
   * @returns Extracted content
   *
   * @example
   * ```typescript
   * const result = await client.fetch('https://api.example.com/data');
   * console.log(result.content.text);
   * ```
   */
  async fetch(url: string, options?: BrowseOptions, session?: SessionData): Promise<BrowseResult> {
    return this.request<BrowseResult>('POST', '/v1/fetch', {
      url,
      options,
      session,
    });
  }

  /**
   * Browse multiple URLs in parallel.
   *
   * @description
   * Efficiently browse many URLs at once. Returns results for each URL
   * with individual success/failure status.
   *
   * More efficient than sequential browse() calls due to:
   * - Connection pooling
   * - Parallel execution
   * - Shared domain intelligence
   *
   * @param urls - Array of URLs to browse
   * @param options - Options applied to all URLs
   * @param session - Session data applied to all URLs
   * @returns Results for each URL
   *
   * @example
   * ```typescript
   * const result = await client.batch([
   *   'https://example.com/page1',
   *   'https://example.com/page2',
   *   'https://example.com/page3'
   * ], { contentType: 'markdown' });
   *
   * for (const item of result.results) {
   *   if (item.success) {
   *     console.log(`${item.url}: ${item.data?.title}`);
   *   } else {
   *     console.log(`${item.url} failed: ${item.error?.message}`);
   *   }
   * }
   * ```
   */
  async batch(
    urls: string[],
    options?: BrowseOptions,
    session?: SessionData
  ): Promise<BatchResult> {
    return this.request<BatchResult>('POST', '/v1/batch', {
      urls,
      options,
      session,
    });
  }

  // ============================================
  // Intelligence Methods
  // ============================================

  /**
   * Get intelligence gathered about a domain.
   *
   * @description
   * Returns learned patterns, success rates, and recommendations.
   * Use this to understand how well the SDK knows a domain
   * and what strategies to use.
   *
   * @param domain - Domain to get intelligence for (without protocol)
   * @returns Domain intelligence
   *
   * @example
   * ```typescript
   * const intel = await client.getDomainIntelligence('github.com');
   *
   * console.log(`Known patterns: ${intel.knownPatterns}`);
   * console.log(`Success rate: ${(intel.successRate * 100).toFixed(0)}%`);
   *
   * if (intel.knownPatterns > 5 && intel.successRate > 0.9) {
   *   console.log('Domain is well-known, expect fast responses');
   * }
   *
   * if (intel.shouldUseSession) {
   *   console.log('Recommendation: Use session for this domain');
   * }
   * ```
   */
  async getDomainIntelligence(domain: string): Promise<DomainIntelligence> {
    return this.request<DomainIntelligence>(
      'GET',
      `/v1/domains/${encodeURIComponent(domain)}/intelligence`
    );
  }

  /**
   * Discover API endpoints via intelligent fuzzing.
   *
   * @description
   * Probes common API paths on a domain to discover endpoints.
   * Discovered APIs are cached and used directly for future requests,
   * bypassing browser rendering for 10x speedup.
   *
   * @param domain - Domain to discover APIs on
   * @param options - Discovery options (paths, methods, timeouts)
   * @returns Discovery results with found endpoints
   *
   * @example Conservative discovery (safe)
   * ```typescript
   * const result = await client.discoverApis('api.github.com', {
   *   methods: ['GET'],
   *   learnPatterns: true
   * });
   *
   * console.log(`Discovered ${result.discovered.length} endpoints`);
   * ```
   *
   * @example Aggressive discovery
   * ```typescript
   * const result = await client.discoverApis('api.example.com', {
   *   methods: ['GET', 'POST', 'PUT', 'DELETE'],
   *   paths: ['/api', '/api/v1', '/graphql'],
   *   probeTimeout: 5000,
   *   maxDuration: 60000
   * });
   * ```
   */
  async discoverApis(
    domain: string,
    options?: FuzzDiscoveryOptions
  ): Promise<FuzzDiscoveryResult> {
    return this.request<FuzzDiscoveryResult>('POST', '/v1/discover/fuzz', {
      domain,
      options,
    });
  }

  // ============================================
  // Workflow Methods
  // ============================================

  /**
   * Start recording a workflow.
   *
   * @description
   * Begins a recording session that captures all subsequent browse operations.
   * Stop recording to save the workflow as a reusable skill.
   *
   * @param request - Workflow metadata (name, description, domain)
   * @returns Recording session information
   *
   * @example
   * ```typescript
   * // Start recording
   * const session = await client.startRecording({
   *   name: 'Extract product pricing',
   *   description: 'Navigate to product page and extract price',
   *   domain: 'shop.example.com'
   * });
   *
   * // Browse operations are now recorded
   * await client.browse('https://shop.example.com/product/123');
   *
   * // Stop and save
   * const workflow = await client.stopRecording(session.recordingId);
   * console.log(`Saved: ${workflow.workflowId}`);
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
   * Stop a recording session and save the workflow.
   *
   * @param recordingId - Recording session ID from startRecording()
   * @param save - Whether to save the workflow (default: true)
   * @returns Saved workflow information or null if not saved
   */
  async stopRecording(
    recordingId: string,
    save: boolean = true
  ): Promise<{
    workflowId: string;
    skillId: string;
    name: string;
    steps: number;
    estimatedDuration: number;
  } | null> {
    return this.request('POST', `/v1/workflows/record/${recordingId}/stop`, { save });
  }

  /**
   * Annotate a step in an active recording.
   *
   * @description
   * Mark steps as critical/important/optional and add descriptions.
   * Annotations help during replay to understand step importance.
   *
   * @param recordingId - Recording session ID
   * @param annotation - Annotation details
   * @returns Annotation confirmation
   */
  async annotateRecording(
    recordingId: string,
    annotation: {
      stepNumber: number;
      annotation: string;
      importance?: 'critical' | 'important' | 'optional';
    }
  ): Promise<{ recordingId: string; stepNumber: number; annotated: boolean }> {
    return this.request('POST', `/v1/workflows/record/${recordingId}/annotate`, annotation);
  }

  /**
   * Replay a saved workflow.
   *
   * @description
   * Executes a previously recorded workflow.
   * Variables in the workflow can be substituted with provided values.
   *
   * @param workflowId - Workflow ID from stopRecording()
   * @param variables - Variable values to substitute
   * @returns Replay results for each step
   *
   * @example
   * ```typescript
   * // Replay with different product ID
   * const results = await client.replayWorkflow('wf_xyz789', {
   *   productId: '456'
   * });
   *
   * if (results.overallSuccess) {
   *   console.log(`Completed in ${results.totalDuration}ms`);
   * } else {
   *   // Check which steps failed
   *   for (const step of results.results) {
   *     if (!step.success) {
   *       console.log(`Step ${step.stepNumber} failed: ${step.error}`);
   *     }
   *   }
   * }
   * ```
   */
  async replayWorkflow(
    workflowId: string,
    variables?: Record<string, string | number | boolean>
  ): Promise<{
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
   * List saved workflows.
   *
   * @param options - Filter by domain or tags
   * @returns List of workflows with metadata
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
   * Get workflow details including all steps.
   *
   * @param workflowId - Workflow ID
   * @returns Full workflow details
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
   * Delete a saved workflow.
   *
   * @param workflowId - Workflow ID to delete
   * @returns Deletion confirmation
   */
  async deleteWorkflow(workflowId: string): Promise<{ workflowId: string; deleted: boolean }> {
    return this.request('DELETE', `/v1/workflows/${workflowId}`);
  }

  // ============================================
  // Skill Pack Methods
  // ============================================

  /**
   * Export skills as a portable skill pack.
   *
   * @description
   * Creates a JSON skill pack that can be shared or imported.
   * Filter by domain, vertical, or quality metrics.
   *
   * @param options - Export filter options
   * @returns Exported skill pack with metadata
   *
   * @example
   * ```typescript
   * const { pack } = await client.exportSkillPack({
   *   domainPatterns: ['github.com'],
   *   minSuccessRate: 0.8,
   *   packName: 'GitHub Skills'
   * });
   *
   * // Save to file
   * fs.writeFileSync('github-skills.json', JSON.stringify(pack, null, 2));
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
   * Import a skill pack.
   *
   * @description
   * Installs skills from a skill pack.
   * Configure conflict resolution and filtering.
   *
   * @param pack - The skill pack to import
   * @param options - Import options including conflict resolution
   * @returns Import results with counts
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
   * Browse the official skill pack library.
   *
   * @param options - Filter by vertical or search
   * @returns List of available skill packs
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
   * Install a skill pack from the official library.
   *
   * @param packId - Skill pack ID or npm package name
   * @param options - Import options
   * @returns Import results
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
   * Get statistics about loaded skills.
   *
   * @returns Skill counts by vertical and tier, plus loading statistics
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

  // ============================================
  // Account Methods
  // ============================================

  /**
   * Get usage statistics for the current billing period.
   *
   * @returns Usage statistics with period, counts, and limits
   *
   * @example
   * ```typescript
   * const usage = await client.getUsage();
   *
   * console.log(`Period: ${usage.period.start} to ${usage.period.end}`);
   * console.log(`Total requests: ${usage.requests.total}`);
   * console.log(`Remaining: ${usage.limits.remaining} of ${usage.limits.daily}`);
   *
   * // Warn on low quota
   * if (usage.limits.remaining < 100) {
   *   console.warn('Low quota warning');
   * }
   * ```
   */
  async getUsage(): Promise<UsageStats> {
    return this.request('GET', '/v1/usage');
  }

  /**
   * Check API health status.
   *
   * @description
   * Returns API status, version, and uptime.
   * Does not require authentication.
   *
   * @returns Health status
   *
   * @example
   * ```typescript
   * const status = await client.health();
   * console.log(`Status: ${status.status}`);
   * console.log(`Version: ${status.version}`);
   * ```
   */
  async health(): Promise<HealthStatus> {
    const url = `${this.baseUrl}/health`;

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new UnbrowserError('HEALTH_CHECK_FAILED', `Health check failed: HTTP ${response.status}`);
    }

    return response.json() as Promise<HealthStatus>;
  }

  // ============================================
  // Private Methods
  // ============================================

  /**
   * Make an authenticated request to the API with retry logic.
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

        const result = (await response.json()) as {
          success: boolean;
          data?: T;
          error?: { code: string; message: string };
        };

        if (!result.success) {
          const error = result.error || { code: 'UNKNOWN_ERROR', message: 'Unknown error' };
          throw new UnbrowserError(error.code as ErrorCode, error.message, {
            statusCode: response.status,
          });
        }

        return result.data as T;
      } catch (error) {
        lastError = error as Error;

        // Don't retry on auth errors or bad requests
        if (error instanceof UnbrowserError) {
          const nonRetryable: ErrorCode[] = [
            'UNAUTHORIZED',
            'FORBIDDEN',
            'INVALID_REQUEST',
            'INVALID_URL',
            'MISSING_API_KEY',
            'INVALID_API_KEY',
          ];
          if (nonRetryable.includes(error.code)) {
            throw error;
          }
        }

        // Don't retry on user abort
        if (error instanceof Error && error.name === 'AbortError') {
          throw new UnbrowserError('REQUEST_ABORTED', 'Request was aborted');
        }

        // Wait before retrying (exponential backoff)
        if (attempt < attempts) {
          const delay = Math.min(Math.pow(2, attempt) * 1000, 30000);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new UnbrowserError('UNKNOWN_ERROR', 'Request failed');
  }
}

/**
 * Create an Unbrowser client for cloud API access.
 *
 * @description
 * Factory function for creating an UnbrowserClient instance.
 * This is the recommended way to create a client.
 *
 * @param config - Configuration including API key
 * @returns Configured UnbrowserClient instance
 *
 * @example
 * ```typescript
 * import { createUnbrowser } from '@unbrowser/core';
 *
 * // Create client
 * const client = createUnbrowser({
 *   apiKey: process.env.UNBROWSER_API_KEY
 * });
 *
 * // Use client
 * const result = await client.browse('https://example.com');
 * console.log(result.content.markdown);
 *
 * // Discover capabilities
 * const caps = client.describe();
 * console.log(caps.categories.map(c => c.name));
 * ```
 */
export function createUnbrowser(config: UnbrowserConfig): UnbrowserClient {
  return new UnbrowserClient(config);
}
