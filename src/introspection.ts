/**
 * @unbrowser/core - SDK Introspection
 *
 * Self-describing capabilities for LLM discovery.
 * Call these methods to understand what the SDK can do.
 *
 * @module introspection
 * @packageDocumentation
 */

/**
 * Description of an SDK method for LLM discovery.
 *
 * @description
 * Every public method in the SDK has a MethodInfo that describes:
 * - What the method does
 * - Required and optional parameters
 * - Return type
 * - Example usage
 *
 * LLMs can use this to understand how to call each method correctly.
 */
export interface MethodInfo {
  /**
   * Method name as it appears on the client.
   */
  name: string;

  /**
   * Human-readable description of what the method does.
   */
  description: string;

  /**
   * Detailed explanation with context.
   */
  details: string;

  /**
   * Parameter definitions.
   */
  parameters: ParameterInfo[];

  /**
   * Return type description.
   */
  returns: {
    type: string;
    description: string;
  };

  /**
   * Example code showing how to use the method.
   */
  example: string;

  /**
   * Related methods that might be useful.
   */
  related?: string[];

  /**
   * Common use cases for this method.
   */
  useCases?: string[];
}

/**
 * Description of a method parameter.
 */
export interface ParameterInfo {
  /**
   * Parameter name.
   */
  name: string;

  /**
   * TypeScript type of the parameter.
   */
  type: string;

  /**
   * Whether the parameter is required.
   */
  required: boolean;

  /**
   * Description of what the parameter does.
   */
  description: string;

  /**
   * Default value if optional.
   */
  default?: string;

  /**
   * Example values for this parameter.
   */
  examples?: string[];
}

/**
 * Overall SDK capability summary.
 *
 * @description
 * High-level overview of what the SDK can do, organized by category.
 * Use this to understand the SDK's capabilities at a glance.
 */
export interface SDKCapabilities {
  /**
   * SDK package name.
   */
  name: string;

  /**
   * Current SDK version.
   */
  version: string;

  /**
   * Brief description of the SDK.
   */
  description: string;

  /**
   * Capabilities organized by category.
   */
  categories: Array<{
    name: string;
    description: string;
    methods: string[];
  }>;

  /**
   * Quick start guide.
   */
  quickStart: string;

  /**
   * Link to full documentation.
   */
  docsUrl: string;
}

/**
 * Complete method catalog for the UnbrowserClient.
 *
 * @description
 * This catalog describes every public method on the UnbrowserClient.
 * LLMs can use this to discover and understand available functionality.
 */
export const METHOD_CATALOG: Record<string, MethodInfo> = {
  browse: {
    name: 'browse',
    description: 'Browse a URL and extract its content as markdown, text, or HTML.',
    details:
      'The primary method for web content extraction. Uses a tiered approach: first tries intelligence tier (cached patterns), then lightweight rendering, finally full browser. Returns structured content with metadata about the extraction.',
    parameters: [
      {
        name: 'url',
        type: 'string',
        required: true,
        description: 'The URL to browse. Must include protocol (https://).',
        examples: ['https://example.com', 'https://news.ycombinator.com'],
      },
      {
        name: 'options',
        type: 'BrowseOptions',
        required: false,
        description: 'Configuration for content extraction.',
        examples: ["{ contentType: 'markdown', includeTables: true }"],
      },
      {
        name: 'session',
        type: 'SessionData',
        required: false,
        description: 'Session data (cookies, localStorage) for authenticated browsing.',
        examples: ["{ cookies: [{ name: 'auth', value: 'token123' }] }"],
      },
    ],
    returns: {
      type: 'Promise<BrowseResult>',
      description:
        'Extracted content with title, markdown/text/html, metadata, and discovered APIs.',
    },
    example: `const result = await client.browse('https://example.com', {
  contentType: 'markdown',
  includeTables: true
});
console.log(result.content.markdown);`,
    related: ['previewBrowse', 'fetch', 'batch', 'browseWithProgress'],
    useCases: [
      'Extract article content from a news site',
      'Scrape product information from e-commerce',
      'Get structured data from any web page',
    ],
  },

  previewBrowse: {
    name: 'previewBrowse',
    description: 'Preview how a URL will be browsed without executing.',
    details:
      'Returns the execution plan, estimated time, and confidence level for a browse request. Use this to understand what will happen before committing to a potentially slow or expensive operation. Completes in ~50ms.',
    parameters: [
      {
        name: 'url',
        type: 'string',
        required: true,
        description: 'The URL to preview.',
      },
      {
        name: 'options',
        type: 'BrowseOptions',
        required: false,
        description: 'Browse options to preview.',
      },
    ],
    returns: {
      type: 'Promise<BrowsePreview>',
      description: 'Execution plan with time estimates and confidence scores.',
    },
    example: `const preview = await client.previewBrowse('https://example.com');
console.log(\`Will take ~\${preview.estimatedTime.expected}ms\`);
console.log(\`Using \${preview.plan.tier} tier\`);
if (preview.estimatedTime.expected > 5000) {
  console.log('Consider alternative approach');
}`,
    related: ['browse'],
    useCases: [
      'Estimate time before browsing',
      'Check if a URL is worth browsing',
      'Plan resource allocation',
    ],
  },

  browseWithProgress: {
    name: 'browseWithProgress',
    description: 'Browse a URL with real-time progress updates via Server-Sent Events.',
    details:
      'Same as browse() but provides progress callbacks as the operation proceeds. Useful for long-running operations where you want to show status updates.',
    parameters: [
      {
        name: 'url',
        type: 'string',
        required: true,
        description: 'The URL to browse.',
      },
      {
        name: 'onProgress',
        type: 'ProgressCallback',
        required: true,
        description: 'Function called with progress events.',
        examples: ['(event) => console.log(event.stage, event.elapsed)'],
      },
      {
        name: 'options',
        type: 'BrowseOptions',
        required: false,
        description: 'Browse options.',
      },
      {
        name: 'session',
        type: 'SessionData',
        required: false,
        description: 'Session data for authenticated browsing.',
      },
    ],
    returns: {
      type: 'Promise<BrowseResult>',
      description: 'Same as browse() result.',
    },
    example: `const result = await client.browseWithProgress(
  'https://example.com',
  (event) => {
    console.log(\`Stage: \${event.stage}, Elapsed: \${event.elapsed}ms\`);
  }
);`,
    related: ['browse'],
    useCases: [
      'Show loading progress to users',
      'Monitor long-running extractions',
      'Debug slow requests',
    ],
  },

  fetch: {
    name: 'fetch',
    description: 'Fast content fetch with tiered rendering.',
    details:
      'Similar to browse() but optimized for speed. May skip some extraction steps to reduce latency.',
    parameters: [
      {
        name: 'url',
        type: 'string',
        required: true,
        description: 'The URL to fetch.',
      },
      {
        name: 'options',
        type: 'BrowseOptions',
        required: false,
        description: 'Fetch options.',
      },
      {
        name: 'session',
        type: 'SessionData',
        required: false,
        description: 'Session data.',
      },
    ],
    returns: {
      type: 'Promise<BrowseResult>',
      description: 'Extracted content.',
    },
    example: `const result = await client.fetch('https://api.example.com/data');
console.log(result.content.text);`,
    related: ['browse'],
    useCases: ['Quick content retrieval', 'API responses', 'Simple pages'],
  },

  batch: {
    name: 'batch',
    description: 'Browse multiple URLs in parallel.',
    details:
      'Efficiently browse many URLs at once. Returns results for each URL with individual success/failure status. More efficient than sequential browse() calls.',
    parameters: [
      {
        name: 'urls',
        type: 'string[]',
        required: true,
        description: 'Array of URLs to browse.',
        examples: ["['https://a.com', 'https://b.com', 'https://c.com']"],
      },
      {
        name: 'options',
        type: 'BrowseOptions',
        required: false,
        description: 'Options applied to all URLs.',
      },
      {
        name: 'session',
        type: 'SessionData',
        required: false,
        description: 'Session data applied to all URLs.',
      },
    ],
    returns: {
      type: 'Promise<BatchResult>',
      description: 'Results array with success/failure for each URL.',
    },
    example: `const result = await client.batch([
  'https://example.com/page1',
  'https://example.com/page2',
  'https://example.com/page3'
]);

for (const item of result.results) {
  if (item.success) {
    console.log(\`\${item.url}: \${item.data?.title}\`);
  } else {
    console.log(\`\${item.url} failed: \${item.error?.message}\`);
  }
}`,
    related: ['browse'],
    useCases: [
      'Scrape multiple product pages',
      'Crawl a list of articles',
      'Compare content across sites',
    ],
  },

  getDomainIntelligence: {
    name: 'getDomainIntelligence',
    description: 'Get intelligence gathered about a domain from previous browsing.',
    details:
      'Returns learned patterns, success rates, and recommendations for a domain. Use this to understand how well the SDK knows a domain and what strategies to use.',
    parameters: [
      {
        name: 'domain',
        type: 'string',
        required: true,
        description: 'Domain to get intelligence for (without protocol).',
        examples: ['github.com', 'news.ycombinator.com'],
      },
    ],
    returns: {
      type: 'Promise<DomainIntelligence>',
      description: 'Pattern counts, success rates, and recommendations.',
    },
    example: `const intel = await client.getDomainIntelligence('github.com');
console.log(\`Known patterns: \${intel.knownPatterns}\`);
console.log(\`Success rate: \${(intel.successRate * 100).toFixed(0)}%\`);
if (intel.shouldUseSession) {
  console.log('Recommended: Use session for this domain');
}`,
    related: ['discoverApis'],
    useCases: [
      'Check if a domain is well-known',
      'Decide browsing strategy',
      'Debug extraction issues',
    ],
  },

  discoverApis: {
    name: 'discoverApis',
    description: 'Discover API endpoints via intelligent fuzzing.',
    details:
      'Probes common API paths on a domain to discover endpoints. Discovered APIs are cached and used directly for future requests, bypassing browser rendering for 10x speedup.',
    parameters: [
      {
        name: 'domain',
        type: 'string',
        required: true,
        description: 'Domain to discover APIs on.',
        examples: ['api.github.com', 'api.example.com'],
      },
      {
        name: 'options',
        type: 'FuzzDiscoveryOptions',
        required: false,
        description: 'Discovery options (paths, methods, timeouts).',
        examples: ["{ methods: ['GET'], learnPatterns: true }"],
      },
    ],
    returns: {
      type: 'Promise<FuzzDiscoveryResult>',
      description: 'Discovered endpoints with statistics.',
    },
    example: `const result = await client.discoverApis('api.example.com', {
  methods: ['GET'],
  learnPatterns: true
});

console.log(\`Found \${result.discovered.length} endpoints\`);
for (const endpoint of result.discovered) {
  console.log(\`  \${endpoint.method} \${endpoint.path}\`);
}`,
    related: ['getDomainIntelligence'],
    useCases: [
      'Find hidden APIs',
      'Optimize future requests',
      'Map API surface area',
    ],
  },

  getUsage: {
    name: 'getUsage',
    description: 'Get usage statistics for the current billing period.',
    details:
      'Returns request counts, tier breakdown, and remaining quota. Use this to monitor usage and avoid quota exhaustion.',
    parameters: [],
    returns: {
      type: 'Promise<UsageStats>',
      description: 'Usage statistics with period, counts, and limits.',
    },
    example: `const usage = await client.getUsage();
console.log(\`Used: \${usage.requests.total}\`);
console.log(\`Remaining: \${usage.limits.remaining}\`);
if (usage.limits.remaining < 100) {
  console.log('Warning: Low quota');
}`,
    related: ['health'],
    useCases: [
      'Monitor API usage',
      'Implement quota warnings',
      'Track costs',
    ],
  },

  health: {
    name: 'health',
    description: 'Check API health status.',
    details:
      'Returns API status, version, and uptime. Use this to verify the API is operational before making requests.',
    parameters: [],
    returns: {
      type: 'Promise<HealthStatus>',
      description: 'Health status with version and uptime.',
    },
    example: `const status = await client.health();
console.log(\`Status: \${status.status}\`);
console.log(\`Version: \${status.version}\`);`,
    related: ['getUsage'],
    useCases: [
      'Verify API is operational',
      'Health checks in monitoring',
      'Get API version',
    ],
  },

  // Workflow methods
  startRecording: {
    name: 'startRecording',
    description: 'Start recording a workflow for later replay.',
    details:
      'Begins a recording session that captures all subsequent browse operations. Stop recording to save the workflow as a reusable skill.',
    parameters: [
      {
        name: 'request',
        type: '{ name: string; description: string; domain: string; tags?: string[] }',
        required: true,
        description: 'Workflow metadata.',
      },
    ],
    returns: {
      type: 'Promise<{ recordingId: string; status: string; startedAt: string }>',
      description: 'Recording session information.',
    },
    example: `const session = await client.startRecording({
  name: 'Extract product price',
  description: 'Navigate to product page and extract price',
  domain: 'example.com'
});

// Browse operations are now recorded
await client.browse('https://example.com/product/123');

// Stop and save
const workflow = await client.stopRecording(session.recordingId);`,
    related: ['stopRecording', 'replayWorkflow', 'listWorkflows'],
    useCases: [
      'Create reusable workflows',
      'Automate repetitive tasks',
      'Build browsing skills',
    ],
  },

  stopRecording: {
    name: 'stopRecording',
    description: 'Stop a recording session and save the workflow.',
    details:
      'Ends the recording session and optionally saves it as a workflow. Returns the workflow ID for later replay.',
    parameters: [
      {
        name: 'recordingId',
        type: 'string',
        required: true,
        description: 'Recording session ID from startRecording().',
      },
      {
        name: 'save',
        type: 'boolean',
        required: false,
        description: 'Whether to save the workflow.',
        default: 'true',
      },
    ],
    returns: {
      type: 'Promise<{ workflowId: string; skillId: string; name: string; steps: number } | null>',
      description: 'Saved workflow information or null if not saved.',
    },
    example: `const workflow = await client.stopRecording(recordingId, true);
console.log(\`Saved workflow: \${workflow.workflowId}\`);
console.log(\`Steps: \${workflow.steps}\`);`,
    related: ['startRecording', 'replayWorkflow'],
    useCases: ['Save recorded workflow', 'Discard recording'],
  },

  replayWorkflow: {
    name: 'replayWorkflow',
    description: 'Replay a saved workflow with variable substitution.',
    details:
      'Executes a previously recorded workflow. Variables in the workflow can be substituted with provided values.',
    parameters: [
      {
        name: 'workflowId',
        type: 'string',
        required: true,
        description: 'Workflow ID from stopRecording().',
      },
      {
        name: 'variables',
        type: 'Record<string, string | number | boolean>',
        required: false,
        description: 'Variable values to substitute.',
        examples: ["{ productId: '456' }"],
      },
    ],
    returns: {
      type: 'Promise<{ workflowId: string; overallSuccess: boolean; totalDuration: number; results: Array<...> }>',
      description: 'Replay results for each step.',
    },
    example: `const results = await client.replayWorkflow('wf_xyz789', {
  productId: '456'
});

if (results.overallSuccess) {
  console.log(\`Completed in \${results.totalDuration}ms\`);
} else {
  console.log('Some steps failed');
}`,
    related: ['startRecording', 'listWorkflows'],
    useCases: [
      'Re-run saved workflows',
      'Batch process with different inputs',
      'Automated testing',
    ],
  },

  listWorkflows: {
    name: 'listWorkflows',
    description: 'List saved workflows.',
    details:
      'Returns a list of all saved workflows with metadata. Filter by domain or tags.',
    parameters: [
      {
        name: 'options',
        type: '{ domain?: string; tags?: string[] }',
        required: false,
        description: 'Filter options.',
      },
    ],
    returns: {
      type: 'Promise<{ workflows: Array<...>; total: number }>',
      description: 'List of workflows with metadata.',
    },
    example: `const { workflows } = await client.listWorkflows({
  domain: 'example.com'
});

for (const wf of workflows) {
  console.log(\`\${wf.name}: \${wf.steps} steps, \${wf.successRate * 100}% success\`);
}`,
    related: ['startRecording', 'getWorkflow', 'deleteWorkflow'],
    useCases: ['Browse available workflows', 'Find workflows by domain'],
  },

  getWorkflow: {
    name: 'getWorkflow',
    description: 'Get detailed information about a workflow.',
    details: 'Returns full workflow details including all steps.',
    parameters: [
      {
        name: 'workflowId',
        type: 'string',
        required: true,
        description: 'Workflow ID.',
      },
    ],
    returns: {
      type: 'Promise<{ id: string; name: string; steps: Array<...>; ... }>',
      description: 'Full workflow details.',
    },
    example: `const workflow = await client.getWorkflow('wf_xyz789');
console.log(\`\${workflow.name}: \${workflow.steps.length} steps\`);
for (const step of workflow.steps) {
  console.log(\`  \${step.stepNumber}. \${step.description}\`);
}`,
    related: ['listWorkflows', 'replayWorkflow'],
    useCases: ['Inspect workflow steps', 'Debug workflow issues'],
  },

  deleteWorkflow: {
    name: 'deleteWorkflow',
    description: 'Delete a saved workflow.',
    details: 'Permanently removes a workflow.',
    parameters: [
      {
        name: 'workflowId',
        type: 'string',
        required: true,
        description: 'Workflow ID to delete.',
      },
    ],
    returns: {
      type: 'Promise<{ workflowId: string; deleted: boolean }>',
      description: 'Deletion confirmation.',
    },
    example: `const result = await client.deleteWorkflow('wf_xyz789');
if (result.deleted) {
  console.log('Workflow deleted');
}`,
    related: ['listWorkflows'],
    useCases: ['Clean up old workflows', 'Remove failed workflows'],
  },

  // Skill pack methods
  exportSkillPack: {
    name: 'exportSkillPack',
    description: 'Export skills as a portable skill pack.',
    details:
      'Creates a JSON skill pack that can be shared or imported into other instances. Filter by domain, vertical, or quality metrics.',
    parameters: [
      {
        name: 'options',
        type: 'SkillExportOptions',
        required: false,
        description: 'Export filter options.',
      },
    ],
    returns: {
      type: 'Promise<{ success: boolean; pack: SkillPack; metadata: { skillCount: number; ... } }>',
      description: 'Exported skill pack with metadata.',
    },
    example: `const { pack } = await client.exportSkillPack({
  domainPatterns: ['github.com'],
  minSuccessRate: 0.8,
  packName: 'GitHub Skills'
});

// Save to file
import fs from 'fs';
fs.writeFileSync('github-skills.json', JSON.stringify(pack, null, 2));`,
    related: ['importSkillPack', 'getSkillPackStats'],
    useCases: ['Share skills', 'Backup skills', 'Transfer to new instance'],
  },

  importSkillPack: {
    name: 'importSkillPack',
    description: 'Import a skill pack.',
    details:
      'Installs skills from a skill pack. Configure conflict resolution and filtering.',
    parameters: [
      {
        name: 'pack',
        type: 'SkillPack',
        required: true,
        description: 'The skill pack to import.',
      },
      {
        name: 'options',
        type: 'SkillImportOptions',
        required: false,
        description: 'Import options including conflict resolution.',
      },
    ],
    returns: {
      type: 'Promise<{ success: boolean; result: SkillImportResult }>',
      description: 'Import results with counts.',
    },
    example: `import fs from 'fs';
const pack = JSON.parse(fs.readFileSync('github-skills.json', 'utf-8'));

const { result } = await client.importSkillPack(pack, {
  conflictResolution: 'skip'
});

console.log(\`Imported: \${result.skillsImported}\`);
console.log(\`Skipped: \${result.skillsSkipped}\`);`,
    related: ['exportSkillPack', 'getSkillPackStats'],
    useCases: ['Install shared skills', 'Restore from backup'],
  },

  getSkillPackStats: {
    name: 'getSkillPackStats',
    description: 'Get statistics about loaded skills.',
    details:
      'Returns skill counts by vertical and tier, plus loading statistics.',
    parameters: [],
    returns: {
      type: 'Promise<{ totalSkills: number; byVertical: Record<...>; byTier: Record<...>; loadingStats: {...} }>',
      description: 'Skill statistics.',
    },
    example: `const stats = await client.getSkillPackStats();
console.log(\`Total skills: \${stats.totalSkills}\`);
console.log(\`Developer: \${stats.byVertical.developer || 0}\`);`,
    related: ['exportSkillPack', 'importSkillPack'],
    useCases: ['Monitor skill inventory', 'Check memory usage'],
  },
};

/**
 * Get SDK capabilities summary.
 *
 * @description
 * Returns a high-level overview of what the SDK can do.
 * Use this to understand the SDK before diving into specific methods.
 *
 * @example
 * ```typescript
 * const caps = getCapabilities();
 * console.log(caps.description);
 * for (const cat of caps.categories) {
 *   console.log(`${cat.name}: ${cat.methods.join(', ')}`);
 * }
 * ```
 */
export function getCapabilities(): SDKCapabilities {
  return {
    name: '@unbrowser/core',
    version: '0.1.0-alpha.1',
    description:
      'Official SDK for the Unbrowser cloud API. Provides intelligent web browsing with learned patterns, API discovery, and progressive optimization.',
    categories: [
      {
        name: 'Content Extraction',
        description: 'Browse URLs and extract content as markdown, text, or HTML.',
        methods: ['browse', 'previewBrowse', 'browseWithProgress', 'fetch', 'batch'],
      },
      {
        name: 'Intelligence',
        description: 'Query and utilize learned patterns and domain knowledge.',
        methods: ['getDomainIntelligence', 'discoverApis'],
      },
      {
        name: 'Workflows',
        description: 'Record, save, and replay browsing workflows.',
        methods: [
          'startRecording',
          'stopRecording',
          'annotateRecording',
          'replayWorkflow',
          'listWorkflows',
          'getWorkflow',
          'deleteWorkflow',
        ],
      },
      {
        name: 'Skill Packs',
        description: 'Export and import portable skill collections.',
        methods: [
          'exportSkillPack',
          'importSkillPack',
          'listSkillPackLibrary',
          'installSkillPack',
          'getSkillPackStats',
        ],
      },
      {
        name: 'Account',
        description: 'Monitor usage and API health.',
        methods: ['getUsage', 'health'],
      },
    ],
    quickStart: `import { createUnbrowser } from '@unbrowser/core';

const client = createUnbrowser({
  apiKey: process.env.UNBROWSER_API_KEY
});

// Browse a URL
const result = await client.browse('https://example.com');
console.log(result.content.markdown);

// Check domain intelligence
const intel = await client.getDomainIntelligence('example.com');
console.log(\`Success rate: \${intel.successRate * 100}%\`);`,
    docsUrl: 'https://docs.unbrowser.ai',
  };
}

/**
 * Get information about a specific method.
 *
 * @description
 * Returns detailed information about a method including parameters,
 * return type, examples, and related methods.
 *
 * @example
 * ```typescript
 * const info = getMethodInfo('browse');
 * console.log(info?.description);
 * console.log(info?.example);
 * ```
 */
export function getMethodInfo(methodName: string): MethodInfo | undefined {
  return METHOD_CATALOG[methodName];
}

/**
 * List all available methods.
 *
 * @description
 * Returns an array of all method names available on the client.
 *
 * @example
 * ```typescript
 * const methods = listMethods();
 * for (const name of methods) {
 *   const info = getMethodInfo(name);
 *   console.log(`${name}: ${info?.description}`);
 * }
 * ```
 */
export function listMethods(): string[] {
  return Object.keys(METHOD_CATALOG);
}

/**
 * Search for methods matching a query.
 *
 * @description
 * Searches method names, descriptions, and use cases for matching terms.
 * Useful for finding the right method for a task.
 *
 * @example
 * ```typescript
 * const results = searchMethods('extract content');
 * for (const { method, relevance } of results) {
 *   console.log(`${method}: ${relevance}`);
 * }
 * ```
 */
export function searchMethods(
  query: string
): Array<{ method: string; relevance: 'high' | 'medium' | 'low' }> {
  const terms = query.toLowerCase().split(/\s+/);
  const results: Array<{ method: string; score: number }> = [];

  for (const [name, info] of Object.entries(METHOD_CATALOG)) {
    let score = 0;

    // Check method name
    for (const term of terms) {
      if (name.toLowerCase().includes(term)) score += 3;
      if (info.description.toLowerCase().includes(term)) score += 2;
      if (info.details.toLowerCase().includes(term)) score += 1;
      for (const useCase of info.useCases || []) {
        if (useCase.toLowerCase().includes(term)) score += 2;
      }
    }

    if (score > 0) {
      results.push({ method: name, score });
    }
  }

  return results
    .sort((a, b) => b.score - a.score)
    .map(({ method, score }) => ({
      method,
      relevance: score >= 5 ? 'high' : score >= 2 ? 'medium' : 'low',
    }));
}

/**
 * Get example code for a use case.
 *
 * @description
 * Returns example code for common use cases.
 *
 * @example
 * ```typescript
 * const example = getExampleFor('scrape product pages');
 * console.log(example);
 * ```
 */
export function getExampleFor(useCase: string): string | undefined {
  const examples: Record<string, string> = {
    'scrape product pages': `// Scrape multiple product pages
const urls = [
  'https://shop.example.com/product/1',
  'https://shop.example.com/product/2',
  'https://shop.example.com/product/3'
];

const result = await client.batch(urls, {
  contentType: 'markdown',
  includeTables: true
});

for (const item of result.results) {
  if (item.success) {
    console.log(item.data?.title);
    console.log(item.data?.content.markdown);
  }
}`,

    'extract article content': `// Extract article content
const result = await client.browse('https://news.example.com/article/123', {
  contentType: 'markdown',
  waitForSelector: 'article'
});

console.log('Title:', result.title);
console.log('Content:', result.content.markdown);`,

    'authenticated browsing': `// Browse with session/authentication
const session = {
  cookies: [
    { name: 'session_id', value: 'your-session-token' }
  ],
  localStorage: {
    'auth_token': 'your-auth-token'
  }
};

const result = await client.browse('https://example.com/dashboard', {}, session);
console.log(result.content.markdown);`,

    'discover apis': `// Discover API endpoints
const discovery = await client.discoverApis('api.example.com', {
  methods: ['GET'],
  learnPatterns: true
});

console.log(\`Found \${discovery.discovered.length} endpoints\`);
for (const endpoint of discovery.discovered) {
  console.log(\`  \${endpoint.method} \${endpoint.path}\`);
}`,

    'workflow automation': `// Record and replay a workflow
const session = await client.startRecording({
  name: 'Extract pricing',
  description: 'Navigate to pricing page and extract prices',
  domain: 'example.com'
});

// Perform the workflow
await client.browse('https://example.com/pricing');

// Save workflow
const workflow = await client.stopRecording(session.recordingId);

// Later, replay with different parameters
const results = await client.replayWorkflow(workflow.workflowId);`,
  };

  // Find closest match
  const lowerUseCase = useCase.toLowerCase();
  for (const [key, example] of Object.entries(examples)) {
    if (key.includes(lowerUseCase) || lowerUseCase.includes(key)) {
      return example;
    }
  }

  // Search by keywords
  const keywords = lowerUseCase.split(/\s+/);
  for (const [key, example] of Object.entries(examples)) {
    for (const keyword of keywords) {
      if (key.includes(keyword)) {
        return example;
      }
    }
  }

  return undefined;
}

/**
 * Generate llms.txt content for the SDK.
 *
 * @description
 * Creates an llms.txt file following the specification at llmstxt.org.
 * This provides LLMs with a curated view of the SDK documentation.
 *
 * @see https://llmstxt.org/
 */
export function generateLlmsTxt(): string {
  const caps = getCapabilities();

  const lines = [
    `# ${caps.name}`,
    '',
    `> ${caps.description}`,
    '',
    '## Quick Start',
    '',
    '```typescript',
    caps.quickStart,
    '```',
    '',
    '## Methods',
    '',
  ];

  for (const category of caps.categories) {
    lines.push(`### ${category.name}`);
    lines.push('');
    lines.push(category.description);
    lines.push('');

    for (const methodName of category.methods) {
      const info = METHOD_CATALOG[methodName];
      if (info) {
        lines.push(`- **${methodName}**: ${info.description}`);
      }
    }
    lines.push('');
  }

  lines.push('## Optional');
  lines.push('');
  lines.push(`- [Full API Reference](${caps.docsUrl}/api): Complete API documentation`);
  lines.push(`- [Examples](${caps.docsUrl}/examples): Code examples and tutorials`);
  lines.push('');

  return lines.join('\n');
}
