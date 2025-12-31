/**
 * Example 03: API Discovery
 *
 * Discover API endpoints automatically from network traffic.
 * The SDK learns API patterns and can make direct API calls later.
 *
 * Run: node examples/03-api-discovery.mjs
 */

import { createLLMBrowser } from '../dist/index.js';

async function main() {
  const browser = await createLLMBrowser({
    enableLearning: true, // Enable API pattern learning
  });

  try {
    // Browse a site with API endpoints
    console.log('Browsing Reddit to discover APIs...\n');

    const result = await browser.browse('https://www.reddit.com/r/programming.json', {
      captureNetwork: true,
      enableLearning: true,
    });

    console.log('Title:', result.title);
    console.log('Render Tier:', result.learning.renderTier);

    // Check discovered APIs
    if (result.discoveredApis && result.discoveredApis.length > 0) {
      console.log('\n=== Discovered APIs ===');
      for (const api of result.discoveredApis) {
        console.log(`- ${api.method} ${api.endpoint}`);
        console.log(`  Confidence: ${api.confidence}`);
        console.log(`  Response Type: ${api.responseType || 'unknown'}`);
      }
    }

    // Get domain intelligence
    console.log('\n=== Domain Intelligence ===');
    const intelligence = await browser.getDomainIntelligence('reddit.com');
    console.log('Known Patterns:', intelligence.knownPatterns?.length || 0);
    console.log('Can Bypass Browser:', intelligence.canBypassBrowser);
    console.log('Has Learned Skills:', intelligence.hasLearnedSkills);

    // Get learning statistics
    console.log('\n=== Learning Stats ===');
    const stats = browser.getLearningStats();
    console.log('Total Domains:', stats.totalDomains);
    console.log('Bypassable Patterns:', stats.bypassablePatterns);
    console.log('Total Selectors:', stats.totalSelectors);
  } finally {
    await browser.cleanup();
  }
}

main().catch(console.error);
