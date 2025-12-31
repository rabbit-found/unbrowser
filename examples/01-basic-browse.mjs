/**
 * Example 01: Basic Browse
 *
 * The simplest use case - browse a URL and get content.
 * Run: node examples/01-basic-browse.mjs
 */

import { createLLMBrowser } from '../dist/index.js';

async function main() {
  // Create browser with defaults
  const browser = await createLLMBrowser();

  try {
    console.log('Browsing example.com...\n');

    // Browse a URL
    const result = await browser.browse('https://example.com');

    // Access content
    console.log('Title:', result.title);
    console.log('Content Length:', result.content.text.length, 'chars');
    console.log('Render Tier:', result.learning.renderTier);
    console.log('Confidence:', result.learning.confidenceLevel);

    // Show markdown preview
    console.log('\n--- Markdown Preview (first 500 chars) ---');
    console.log(result.content.markdown.substring(0, 500));
  } finally {
    // Always clean up browser resources
    await browser.cleanup();
  }
}

main().catch(console.error);
