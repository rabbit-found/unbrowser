/**
 * Example 11: Analytics Dashboard
 *
 * Track usage, performance, and learning effectiveness.
 * Useful for monitoring and debugging.
 *
 * Run: node examples/11-analytics-dashboard.mjs
 */

import {
  createLLMBrowser,
  generateDashboard,
  getQuickStatus,
  computeLearningEffectiveness,
} from '../dist/index.js';

async function main() {
  const browser = await createLLMBrowser();

  try {
    // Browse some URLs to generate data
    console.log('=== Generating Usage Data ===\n');

    const urls = [
      'https://example.com',
      'https://news.ycombinator.com/',
      'https://httpbin.org/html',
    ];

    for (const url of urls) {
      console.log(`Browsing ${url}...`);
      await browser.browse(url, { timeout: 15000 });
    }

    // Quick status check
    console.log('\n=== Quick Status ===\n');
    const status = await getQuickStatus();
    console.log('Status:', status.status);
    console.log('Uptime:', status.uptime);
    console.log('Requests today:', status.requestsToday);

    // Full analytics dashboard
    console.log('\n=== Analytics Dashboard ===\n');
    const dashboard = await generateDashboard({
      period: '24h',
      topDomainsLimit: 5,
    });

    // Usage summary
    console.log('--- Usage Summary ---');
    console.log('Total requests:', dashboard.usage.totalRequests);
    console.log('Total cost units:', dashboard.usage.totalCost);
    console.log('Average latency:', dashboard.usage.avgLatency, 'ms');

    // Tier breakdown
    console.log('\n--- Tier Breakdown ---');
    for (const [tier, stats] of Object.entries(dashboard.tiers)) {
      console.log(`${tier}: ${stats.requests} requests, ${stats.avgLatency}ms avg`);
    }

    // Top domains
    console.log('\n--- Top Domains by Cost ---');
    for (const domain of dashboard.topDomains.byCost.slice(0, 3)) {
      console.log(`${domain.domain}: ${domain.cost} units (${domain.requests} requests)`);
    }

    // System health
    console.log('\n--- System Health ---');
    console.log('Overall:', dashboard.health.status);
    if (dashboard.health.issues.length > 0) {
      console.log('Issues:', dashboard.health.issues.join(', '));
    }
    if (dashboard.health.recommendations.length > 0) {
      console.log('Recommendations:');
      for (const rec of dashboard.health.recommendations) {
        console.log(`  - ${rec}`);
      }
    }

    // Learning effectiveness
    console.log('\n=== Learning Effectiveness ===\n');
    const effectiveness = await computeLearningEffectiveness();
    console.log('Health score:', effectiveness.healthScore, '/ 100');
    console.log('Pattern hit rate:', effectiveness.patternEffectiveness.hitRate);
    console.log('Tier optimization savings:', effectiveness.tierOptimization.savingsPercent, '%');

    // Insights
    console.log('\nInsights:');
    for (const insight of effectiveness.insights) {
      console.log(`  [${insight.level}] ${insight.message}`);
    }

    // Tiered fetcher stats
    console.log('\n=== Tiered Fetcher Stats ===\n');
    const fetcherStats = browser.getTieredFetcherStats();
    console.log('Domains tracked:', fetcherStats.domainsTracked);
    console.log('Intelligence hits:', fetcherStats.tierHits.intelligence);
    console.log('Lightweight hits:', fetcherStats.tierHits.lightweight);
    console.log('Playwright hits:', fetcherStats.tierHits.playwright);
  } finally {
    await browser.cleanup();
  }
}

main().catch(console.error);
