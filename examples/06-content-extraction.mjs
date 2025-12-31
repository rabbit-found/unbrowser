/**
 * Example 06: Content Extraction
 *
 * Extract structured content from HTML including tables, links, and metadata.
 * Uses ContentExtractor directly for processing raw HTML.
 *
 * Run: node examples/06-content-extraction.mjs
 */

import { ContentExtractor, createLLMBrowser } from '../dist/index.js';

async function main() {
  // Method 1: Extract from raw HTML (no browser needed)
  console.log('=== Extract from Raw HTML ===\n');

  const extractor = new ContentExtractor();
  const html = `
    <html>
      <head><title>Product Catalog</title></head>
      <body>
        <h1>Our Products</h1>
        <p>Welcome to our store!</p>
        <table>
          <tr><th>Product</th><th>Price</th><th>Stock</th></tr>
          <tr><td>Widget A</td><td>$10.99</td><td>In Stock</td></tr>
          <tr><td>Widget B</td><td>$24.99</td><td>Low Stock</td></tr>
          <tr><td>Widget C</td><td>$5.49</td><td>Out of Stock</td></tr>
        </table>
        <a href="/category/electronics">Electronics</a>
        <a href="/category/home">Home & Garden</a>
      </body>
    </html>
  `;

  const extracted = extractor.extract(html, 'https://example.com/products');

  console.log('Title:', extracted.title);
  console.log('Text length:', extracted.text.length);
  console.log('Links found:', extracted.links?.length || 0);

  // Tables as structured data
  if (extracted.tables && extracted.tables.length > 0) {
    console.log('\n--- Extracted Table ---');
    const table = extracted.tables[0];
    console.log('Headers:', table.headers);
    console.log('Rows:');
    for (const row of table.rows) {
      console.log(' ', row);
    }

    // Convert table to JSON
    const tableJson = table.asJson;
    console.log('\nAs JSON:', JSON.stringify(tableJson, null, 2));
  }

  // Method 2: Use browser with content extraction options
  console.log('\n=== Browser with Extraction Options ===\n');

  const browser = await createLLMBrowser();
  try {
    const result = await browser.browse('https://news.ycombinator.com/', {
      forceTier: 'intelligence',
      includeDecisionTrace: true,
    });

    console.log('Title:', result.title);
    console.log('Tables found:', result.content.tables?.length || 0);
    console.log('Links found:', result.content.links?.length || 0);

    // Show first few links
    if (result.content.links && result.content.links.length > 0) {
      console.log('\nFirst 5 links:');
      for (const link of result.content.links.slice(0, 5)) {
        console.log(` - ${link.text}: ${link.href}`);
      }
    }
  } finally {
    await browser.cleanup();
  }
}

main().catch(console.error);
