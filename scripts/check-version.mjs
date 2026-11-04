// Fails if src/version.ts and package.json disagree on the SDK version.
import { readFileSync } from 'node:fs';

const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const source = readFileSync(new URL('../src/version.ts', import.meta.url), 'utf8');
const match = source.match(/VERSION\s*=\s*'([^']+)'/);

if (!match || match[1] !== version) {
  console.error(`src/version.ts (${match?.[1] ?? 'missing'}) does not match package.json (${version})`);
  process.exit(1);
}
