/**
 * Example 09: Content Change Tracking
 *
 * Track changes to web pages over time. Useful for monitoring
 * competitor sites, price changes, or content updates.
 *
 * Run: node examples/09-content-change-tracking.mjs
 */

import { createLLMBrowser, ContentChangeTracker } from '../dist/index.js';

async function main() {
  const browser = await createLLMBrowser();
  const tracker = new ContentChangeTracker('./change-tracking-data');

  try {
    const url = 'https://news.ycombinator.com/';

    // Start tracking a URL
    console.log('=== Start Tracking ===\n');

    await tracker.trackUrl(url, {
      label: 'Hacker News Front Page',
      tags: ['news', 'tech'],
    });
    console.log('Now tracking:', url);

    // Browse and record initial state
    console.log('\n=== Initial Browse ===\n');
    const result1 = await browser.browse(url, {
      checkForChanges: true,
    });

    // Record the content
    const initial = await tracker.recordContent(url, result1.content.text);
    console.log('Initial content recorded');
    console.log('Content length:', result1.content.text.length);
    console.log('Word count:', initial.fingerprint.wordCount);

    // Simulate time passing (in reality, you'd wait)
    console.log('\n=== Check for Changes ===\n');
    await new Promise((r) => setTimeout(r, 2000));

    // Browse again
    const result2 = await browser.browse(url, {
      checkForChanges: true,
    });

    // Check for changes
    const changes = await tracker.recordContent(url, result2.content.text);
    console.log('Has changed:', changes.hasChanged);
    console.log('Change significance:', changes.significance);

    if (changes.hasChanged) {
      console.log('Change detected!');
      console.log('Previous length:', changes.previousFingerprint?.textLength);
      console.log('Current length:', changes.fingerprint.textLength);
    }

    // Get tracking stats
    console.log('\n=== Tracking Stats ===\n');
    const stats = await tracker.getStats();
    console.log('URLs tracked:', stats.totalUrls);
    console.log('Total checks:', stats.totalChecks);
    console.log('Changes detected:', stats.totalChanges);

    // Get change history
    console.log('\n=== Change History ===\n');
    const history = await tracker.getChangeHistory(url, { limit: 5 });
    console.log('History entries:', history.length);
    for (const entry of history) {
      console.log(`- ${new Date(entry.timestamp).toISOString()}: ${entry.significance}`);
    }

    // List all tracked URLs
    console.log('\n=== Tracked URLs ===\n');
    const tracked = await tracker.listTrackedUrls();
    for (const item of tracked) {
      console.log(`- ${item.url}`);
      console.log(`  Label: ${item.label || 'none'}`);
      console.log(`  Tags: ${item.tags?.join(', ') || 'none'}`);
      console.log(`  Checks: ${item.checkCount}`);
    }
  } finally {
    await browser.cleanup();
  }
}

main().catch(console.error);
