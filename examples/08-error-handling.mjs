/**
 * Example 08: Error Handling
 *
 * Handle errors gracefully with structured error types and classifications.
 *
 * Run: node examples/08-error-handling.mjs
 */

import {
  createLLMBrowser,
  validateUrlOrThrow,
  UrlSafetyError,
  StructuredError,
  classifyFailure,
} from '../dist/index.js';

async function main() {
  const browser = await createLLMBrowser();

  try {
    // Example 1: URL validation (SSRF protection)
    console.log('=== URL Validation ===\n');

    const urlsToTest = [
      'https://example.com', // Valid
      'http://192.168.1.1', // Private IP (blocked)
      'file:///etc/passwd', // File protocol (blocked)
      'http://169.254.169.254', // AWS metadata (blocked)
    ];

    for (const url of urlsToTest) {
      try {
        validateUrlOrThrow(url);
        console.log(`VALID: ${url}`);
      } catch (error) {
        if (error instanceof UrlSafetyError) {
          console.log(`BLOCKED: ${url}`);
          console.log(`  Reason: ${error.message}`);
          console.log(`  Category: ${error.category}`);
        }
      }
    }

    // Example 2: Handle browse errors
    console.log('\n=== Browse Error Handling ===\n');

    try {
      await browser.browse('https://this-domain-definitely-does-not-exist-12345.com', {
        timeout: 5000,
      });
    } catch (error) {
      if (error instanceof StructuredError) {
        console.log('Structured Error:');
        console.log('  Code:', error.code);
        console.log('  Message:', error.message);
        console.log('  Severity:', error.severity);
        console.log('  Retryable:', error.retryable);
        console.log('  Recommended Actions:', error.recommendedActions);
      } else {
        // Classify unknown errors
        const classified = classifyFailure(undefined, error);
        console.log('Classified Error:');
        console.log('  Category:', classified.category);
        console.log('  Message:', classified.message);
        console.log('  Is Permanent:', classified.isPermanent);
        console.log('  Retry Strategy:', classified.retryStrategy);
      }
    }

    // Example 3: Handle rate limiting
    console.log('\n=== Rate Limit Detection ===\n');

    const result = await browser.browse('https://example.com');
    if (result.learning.problemResponse) {
      const problem = result.learning.problemResponse;
      console.log('Problem detected:', problem.problemType);
      console.log('Research suggestion:', problem.researchSuggestion?.searchQuery);
    } else {
      console.log('No problems detected!');
    }

    // Example 4: Retry with backoff
    console.log('\n=== Retry with Backoff ===\n');

    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await browser.browse('https://example.com', {
          timeout: 10000,
          retryOnError: false, // Disable built-in retry to show manual retry
        });
        console.log(`Attempt ${attempt}: Success!`);
        break;
      } catch (error) {
        console.log(`Attempt ${attempt}: Failed - ${error.message}`);
        if (attempt < maxRetries) {
          const backoffMs = Math.pow(2, attempt) * 1000;
          console.log(`  Retrying in ${backoffMs}ms...`);
          await new Promise((r) => setTimeout(r, backoffMs));
        }
      }
    }
  } finally {
    await browser.cleanup();
  }
}

main().catch(console.error);
