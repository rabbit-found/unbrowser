/**
 * @unbrowser/core
 *
 * Official SDK for the Unbrowser cloud API - intelligent web browsing for AI agents.
 *
 * ## Overview
 *
 * Unbrowser is an intelligent web browsing API that learns from patterns,
 * discovers APIs automatically, and progressively optimizes to bypass
 * browser rendering entirely.
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
 * ```
 *
 * ## Self-Discovery (LLM-Friendly)
 *
 * This SDK is designed for AI agents. Use these methods to discover capabilities:
 *
 * ```typescript
 * // Get SDK overview
 * const caps = client.describe();
 *
 * // Get info about a specific method
 * const info = client.getMethodInfo('browse');
 *
 * // Search for methods
 * const results = client.searchMethods('extract content');
 *
 * // Generate llms.txt
 * const llmsTxt = client.generateLlmsTxt();
 * ```
 *
 * ## Key Features
 *
 * - **Tiered Rendering**: Intelligence (~50ms) -> Lightweight (~200ms) -> Playwright (~2-5s)
 * - **API Discovery**: Automatically discovers and caches API patterns
 * - **Workflow Recording**: Record and replay browsing workflows
 * - **Skill Packs**: Export and import portable skill collections
 * - **Self-Describing**: Built for LLM discovery with introspection methods
 *
 * @see https://docs.unbrowser.ai for full documentation
 * @see https://unbrowser.ai for product information
 *
 * @packageDocumentation
 * @module @unbrowser/core
 */

/**
 * SDK version
 */
export const VERSION = '0.1.0-alpha.1';

// ============================================
// Client
// ============================================

export { UnbrowserClient, createUnbrowser } from './client.js';

// ============================================
// Errors
// ============================================

export {
  UnbrowserError,
  isUnbrowserError,
  isRetryableError,
  rateLimitError,
  timeoutError,
  ERROR_RECOVERY,
  type ErrorCode,
  type ErrorRecovery,
} from './errors.js';

// ============================================
// Types
// ============================================

export type {
  // Configuration
  UnbrowserConfig,

  // Browse options and results
  BrowseOptions,
  BrowseResult,
  ContentResult,
  ExtractedTable,
  DiscoveredApi,
  BrowseMetadata,
  VerificationOptions,
  VerificationResult,
  DebugOptions,

  // Session
  SessionData,
  Cookie,

  // Batch
  BatchResult,

  // Domain intelligence
  DomainIntelligence,

  // Preview
  BrowsePreview,
  ExecutionPlan,
  ExecutionStep,
  TimeEstimate,
  ConfidenceLevel,
  ConfidenceFactors,

  // Progress
  ProgressEvent,
  ProgressCallback,

  // API Discovery
  FuzzDiscoveryOptions,
  FuzzDiscoveryResult,

  // Skill Packs
  SkillVertical,
  SkillTier,
  BrowsingSkill,
  AntiPattern,
  SkillWorkflow,
  SkillPackMetadata,
  SkillPack,
  SkillExportOptions,
  SkillConflictResolution,
  SkillImportOptions,
  SkillImportResult,

  // Usage
  UsageStats,
  HealthStatus,
} from './types.js';

// ============================================
// Introspection (LLM-Friendly)
// ============================================

export {
  getCapabilities,
  getMethodInfo,
  listMethods,
  searchMethods,
  getExampleFor,
  generateLlmsTxt,
  METHOD_CATALOG,
  type SDKCapabilities,
  type MethodInfo,
  type ParameterInfo,
} from './introspection.js';
