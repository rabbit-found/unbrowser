/**
 * Example 07: Stealth Mode (Anti-Bot Evasion)
 *
 * Use fingerprint rotation and behavioral delays to avoid detection.
 * Works across all tiers (HTTP headers) + enhanced for Playwright.
 *
 * Run: node examples/07-stealth-mode.mjs
 */

import {
  createLLMBrowser,
  generateFingerprint,
  getStealthFetchHeaders,
  BehavioralDelays,
  isStealthAvailable,
} from '../dist/index.js';

async function main() {
  // Generate a browser fingerprint
  console.log('=== Fingerprint Generation ===\n');

  // Random fingerprint
  const fingerprint = generateFingerprint();
  console.log('User Agent:', fingerprint.userAgent);
  console.log('Viewport:', fingerprint.viewport);
  console.log('Locale:', fingerprint.locale);
  console.log('Timezone:', fingerprint.timezoneId);

  // Seeded fingerprint (consistent per-domain)
  const seededFingerprint = generateFingerprint('example.com');
  console.log('\nSeeded for example.com:', seededFingerprint.userAgent);

  // Get stealth headers for HTTP requests
  console.log('\n=== Stealth HTTP Headers ===\n');
  const headers = getStealthFetchHeaders({
    fingerprintSeed: 'example.com',
  });
  console.log('Accept-Language:', headers['Accept-Language']);
  console.log('sec-ch-ua:', headers['sec-ch-ua']);

  // Behavioral delays
  console.log('\n=== Behavioral Delays ===\n');

  console.log('Random delay (100-500ms)...');
  await BehavioralDelays.sleep(100, 500);
  console.log('Done!');

  const jitteredDelay = BehavioralDelays.jitteredDelay(1000, 0.3);
  console.log('Jittered delay (1s +/- 30%):', jitteredDelay, 'ms');

  const backoff = BehavioralDelays.exponentialBackoff(3);
  console.log('Exponential backoff (attempt 3):', backoff, 'ms');

  // Check if Playwright stealth is available
  console.log('\n=== Playwright Stealth ===\n');
  console.log('Stealth available:', isStealthAvailable());

  // Browse with stealth
  console.log('\n=== Browse with Stealth ===\n');
  const browser = await createLLMBrowser();

  try {
    // The SDK automatically applies stealth when configured
    const result = await browser.browse('https://httpbin.org/headers', {
      forceTier: 'playwright', // Full browser with stealth
      timeout: 30000,
    });

    console.log('Title:', result.title);
    console.log('Content preview:', result.content.text.substring(0, 300));
  } finally {
    await browser.cleanup();
  }
}

main().catch(console.error);
