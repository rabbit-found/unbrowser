import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { METHOD_CATALOG, VERSION, getCapabilities, searchMethods } from '../src/index.js';
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
    !['request', 'requestDirect', 'deriveRequestOptions'].includes(name)
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

  it('finds the agent methods by search', () => {
    const names = searchMethods('agent').map((r: any) => r.method?.name ?? r.name ?? r);
    expect(JSON.stringify(names)).toContain('browseForAgent');
  });
});
