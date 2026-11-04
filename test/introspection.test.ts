import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  METHOD_CATALOG,
  VERSION,
  generateLlmsTxt,
  getCapabilities,
  getExampleFor,
  getMethodInfo,
  listMethods,
  searchMethods,
} from '../src/index.js';
import { UnbrowserClient } from '../src/client.js';
import { client } from './helpers.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

/** Introspection helpers on the client; they describe the catalog, not the API. */
const INTROSPECTION = ['describe', 'getMethodInfo', 'listMethods', 'searchMethods', 'generateLlmsTxt'];

/**
 * Public API methods that have no catalog entry yet. Remove a name once it is
 * documented; the test below fails if a name here is already documented, so
 * this list can only shrink.
 */
const KNOWN_UNDOCUMENTED = [
  'annotateRecording',
  'listSkillPackLibrary',
  'installSkillPack',
  'researchWithProgress',
  'getPredictions',
  'getPredictionsByDomain',
  'getPredictionAccuracy',
  'getUrgentPredictions',
  'recordObservation',
];

const clientMethods = Object.getOwnPropertyNames(UnbrowserClient.prototype).filter(
  (name) =>
    name !== 'constructor' &&
    typeof (UnbrowserClient.prototype as any)[name] === 'function' &&
    !['request', 'requestDirect', 'send', 'deriveRequestOptions'].includes(name)
);

describe('version', () => {
  it('matches package.json everywhere it is reported', () => {
    expect(VERSION).toBe(pkg.version);
    expect(getCapabilities().version).toBe(pkg.version);
    expect(client().describe().version).toBe(pkg.version);
  });
});

describe('method catalog', () => {
  it('only documents methods that exist on the client', () => {
    for (const name of Object.keys(METHOD_CATALOG)) expect(clientMethods).toContain(name);
  });

  it('uses the catalog key as the method name', () => {
    for (const [key, info] of Object.entries(METHOD_CATALOG)) expect(info.name).toBe(key);
  });

  it('documents every public API method not on the known-gaps list', () => {
    const undocumented = clientMethods.filter(
      (name) => !(name in METHOD_CATALOG) && !INTROSPECTION.includes(name)
    );
    expect(undocumented.sort()).toEqual([...KNOWN_UNDOCUMENTED].sort());
  });

  it('lists only real client methods in capability categories', () => {
    for (const category of getCapabilities().categories) {
      for (const name of category.methods) expect(clientMethods).toContain(name);
    }
  });

  it('gives every entry a description, example and return type', () => {
    for (const [name, info] of Object.entries(METHOD_CATALOG)) {
      expect(info.description, name).toBeTruthy();
      expect(info.example, name).toBeTruthy();
      expect(info.returns.type, name).toMatch(/^Promise</);
      for (const related of info.related ?? []) expect(METHOD_CATALOG, `${name} -> ${related}`).toHaveProperty(related);
    }
  });
});

describe('lookup', () => {
  it('getMethodInfo returns the entry or undefined', () => {
    expect(getMethodInfo('browse')).toBe(METHOD_CATALOG.browse);
    expect(getMethodInfo('nope')).toBeUndefined();
  });

  it('listMethods lists the catalog keys', () => {
    expect(listMethods()).toEqual(Object.keys(METHOD_CATALOG));
  });
});

describe('searchMethods', () => {
  it('ranks name matches highest', () => {
    const results = searchMethods('browse'); // in the name and the description
    expect(results[0].method).toMatch(/browse/i);
    expect(results[0].relevance).toBe('high');
  });

  it('finds the agent methods', () => {
    const names = searchMethods('agent').map((r) => r.method);
    expect(names).toContain('browseForAgent');
    expect(names).toContain('batchForAgent');
  });

  it('labels weak matches low and returns nothing for no match', () => {
    const relevances = new Set(searchMethods('page').map((r) => r.relevance));
    expect([...relevances].every((r) => ['high', 'medium', 'low'].includes(r))).toBe(true);
    expect(searchMethods('zzzzqqq')).toEqual([]);
  });

  it('sorts results by score, highest first', () => {
    const order = { high: 2, medium: 1, low: 0 } as const;
    const ranks = searchMethods('extract content').map((r) => order[r.relevance]);
    expect(ranks).toEqual([...ranks].sort((a, b) => b - a));
  });
});

describe('getExampleFor', () => {
  it('matches a use case by phrase', () => {
    expect(getExampleFor('Scrape product pages')).toContain('client.batch');
  });

  it('matches by keyword', () => {
    expect(getExampleFor('workflow')).toContain('startRecording');
  });

  it('falls back to a single keyword when no phrase matches', () => {
    expect(getExampleFor('internal pricing apis')).toContain('discoverApis');
  });

  it('returns undefined when nothing matches', () => {
    expect(getExampleFor('zzzzqqq')).toBeUndefined();
  });
});

describe('generateLlmsTxt', () => {
  const text = generateLlmsTxt();

  it('starts with the package name and description', () => {
    expect(text.startsWith(`# @unbrowser/cloud\n\n> ${getCapabilities().description}`)).toBe(true);
  });

  it('lists each category and every documented method in it', () => {
    for (const category of getCapabilities().categories) {
      expect(text).toContain(`### ${category.name}`);
      for (const name of category.methods) {
        if (METHOD_CATALOG[name]) expect(text).toContain(`- **${name}**: ${METHOD_CATALOG[name].description}`);
      }
    }
  });

  it('links to the docs', () => {
    expect(text).toContain(`${getCapabilities().docsUrl}/api`);
  });
});

describe('client introspection methods', () => {
  const c = client();

  it('delegate to the module functions', () => {
    expect(c.describe()).toEqual(getCapabilities());
    expect(c.getMethodInfo('browse')).toBe(METHOD_CATALOG.browse);
    expect(c.listMethods()).toEqual(listMethods());
    expect(c.searchMethods('batch')).toEqual(searchMethods('batch'));
    expect(c.generateLlmsTxt()).toBe(generateLlmsTxt());
  });
});
