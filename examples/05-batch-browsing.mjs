/**
 * Example 05: Batch Browsing
 *
 * Browse multiple URLs in parallel with controlled concurrency.
 * Useful for scraping multiple pages efficiently.
 *
 * Run: node examples/05-batch-browsing.mjs
 */

import { createLLMBrowser } from '../dist/index.js';

async function main() {
  const browser = await createLLMBrowser();

  try {
    const urls = [
      'https://news.ycombinator.com/',
      'https://reddit.com/r/programming.json',
      'https://dev.to/',
      'https://github.com/trending',
      'https://lobste.rs/',
    ];

    console.log(`Batch browsing ${urls.length} URLs...\n`);

    // Batch browse with concurrency control
    const results = await browser.batchBrowse(urls, {
      concurrency: 3, // Max 3 concurrent requests
      timeout: 30000, // Per-URL timeout
      forceTier: 'intelligence', // Use fastest tier
    });

    // Process results
    console.log('=== Results ===\n');
    for (const result of results) {
      if (result.success) {
        console.log(`SUCCESS: ${result.url}`);
        console.log(`  Title: ${result.result.title}`);
        console.log(`  Tier: ${result.result.learning.renderTier}`);
        console.log(`  Content: ${result.result.content.text.length} chars`);
      } else {
        console.log(`FAILED: ${result.url}`);
        console.log(`  Error: ${result.error}`);
      }
      console.log();
    }

    // Summary
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    console.log('=== Summary ===');
    console.log(`Successful: ${successful}/${results.length}`);
    console.log(`Failed: ${failed}/${results.length}`);
  } finally {
    await browser.cleanup();
  }
}

main().catch(console.error);
