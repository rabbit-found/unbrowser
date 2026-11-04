import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
    unstubGlobals: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/types.ts', // type declarations only
        'src/http-client.ts', // legacy standalone client, not exported by the package
      ],
      thresholds: {
        lines: 100,
        functions: 100,
        statements: 100,
        branches: 98,
      },
    },
  },
});
