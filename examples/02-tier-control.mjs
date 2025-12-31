/**
 * Example 02: Tier Control
 *
 * Control which rendering tier is used for fetching content.
 * Tiers: 'intelligence' (fastest) -> 'lightweight' -> 'playwright' (slowest)
 *
 * Run: node examples/02-tier-control.mjs
 */

import { createLLMBrowser } from '../dist/index.js';

async function main() {
  const browser = await createLLMBrowser();

  try {
    const url = 'https://news.ycombinator.com/';

    // Force the fastest tier (Content Intelligence - no JS execution)
    console.log('=== Intelligence Tier (fastest) ===');
    const intelligenceResult = await browser.browse(url, {
      forceTier: 'intelligence',
      timeout: 10000,
    });
    console.log('Tier used:', intelligenceResult.learning.renderTier);
    console.log('Content length:', intelligenceResult.content.text.length);

    // Force lightweight tier (linkedom - basic JS)
    console.log('\n=== Lightweight Tier (medium) ===');
    const lightweightResult = await browser.browse(url, {
      forceTier: 'lightweight',
      timeout: 15000,
    });
    console.log('Tier used:', lightweightResult.learning.renderTier);
    console.log('Content length:', lightweightResult.content.text.length);

    // Force full browser (Playwright - full JS rendering)
    console.log('\n=== Playwright Tier (full browser) ===');
    const playwrightResult = await browser.browse(url, {
      forceTier: 'playwright',
      timeout: 30000,
    });
    console.log('Tier used:', playwrightResult.learning.renderTier);
    console.log('Content length:', playwrightResult.content.text.length);

    // Budget controls - limit to cheaper tiers
    console.log('\n=== With Budget Controls ===');
    const budgetResult = await browser.browse(url, {
      maxCostTier: 'lightweight', // Don't use playwright
      maxLatencyMs: 5000, // Stop if taking too long
    });
    console.log('Tier used:', budgetResult.learning.renderTier);
    console.log('Budget info:', budgetResult.budgetInfo);
  } finally {
    await browser.cleanup();
  }
}

main().catch(console.error);
