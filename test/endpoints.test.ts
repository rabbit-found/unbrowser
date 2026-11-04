/**
 * Every API method sends the right HTTP method, path and body, and returns
 * the right part of the response.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { UnbrowserClient } from '../src/client.js';
import { client, json, mockFetch, ok } from './helpers.js';

afterEach(() => vi.unstubAllGlobals());

type Case = {
  name: string;
  call: (c: UnbrowserClient) => Promise<unknown>;
  method: string;
  path: string;
  body?: unknown;
  /** requestDirect endpoints return the whole body rather than `data`. */
  direct?: boolean;
};

const pack = { metadata: { id: 'p' }, skills: [], antiPatterns: [], workflows: [] } as any;

const cases: Case[] = [
  // Content
  { name: 'browse', call: (c) => c.browse('https://x.com'), method: 'POST', path: '/v1/browse', body: { url: 'https://x.com' } },
  { name: 'browse with session', call: (c) => c.browse('https://x.com', {}, { cookies: [{ name: 'a', value: 'b' }] }), method: 'POST', path: '/v1/browse', body: { url: 'https://x.com', options: {}, session: { cookies: [{ name: 'a', value: 'b' }] } } },
  { name: 'previewBrowse', call: (c) => c.previewBrowse('https://x.com', { maxChars: 5 }), method: 'POST', path: '/v1/browse/preview', body: { url: 'https://x.com', options: { maxChars: 5 } } },
  { name: 'fetch', call: (c) => c.fetch('https://x.com'), method: 'POST', path: '/v1/fetch', body: { url: 'https://x.com' } },
  { name: 'batch', call: (c) => c.batch(['https://a.com']), method: 'POST', path: '/v1/batch', body: { urls: ['https://a.com'] } },

  // Intelligence
  { name: 'getDomainIntelligence', call: (c) => c.getDomainIntelligence('a.com/b'), method: 'GET', path: '/v1/domains/a.com%2Fb/intelligence' },
  { name: 'discoverApis', call: (c) => c.discoverApis('a.com', { methods: ['GET'] }), method: 'POST', path: '/v1/discover/fuzz', body: { domain: 'a.com', options: { methods: ['GET'] } } },

  // Workflows
  { name: 'startRecording', call: (c) => c.startRecording({ name: 'n', description: 'd', domain: 'a.com' }), method: 'POST', path: '/v1/workflows/record/start', body: { name: 'n', description: 'd', domain: 'a.com' } },
  { name: 'stopRecording', call: (c) => c.stopRecording('rec/1'), method: 'POST', path: '/v1/workflows/record/rec%2F1/stop', body: { save: true } },
  { name: 'stopRecording without saving', call: (c) => c.stopRecording('r1', false), method: 'POST', path: '/v1/workflows/record/r1/stop', body: { save: false } },
  { name: 'annotateRecording', call: (c) => c.annotateRecording('r1', { stepNumber: 2, annotation: 'x' }), method: 'POST', path: '/v1/workflows/record/r1/annotate', body: { stepNumber: 2, annotation: 'x' } },
  { name: 'replayWorkflow', call: (c) => c.replayWorkflow('w/1', { id: 3 }), method: 'POST', path: '/v1/workflows/w%2F1/replay', body: { variables: { id: 3 } } },
  { name: 'listWorkflows', call: (c) => c.listWorkflows(), method: 'GET', path: '/v1/workflows' },
  { name: 'listWorkflows filtered', call: (c) => c.listWorkflows({ domain: 'a.com', tags: ['x', 'y'] }), method: 'GET', path: '/v1/workflows?domain=a.com&tags=x%2Cy' },
  { name: 'getWorkflow', call: (c) => c.getWorkflow('w?1'), method: 'GET', path: '/v1/workflows/w%3F1' },
  { name: 'deleteWorkflow', call: (c) => c.deleteWorkflow('w1'), method: 'DELETE', path: '/v1/workflows/w1' },

  // Skill packs
  { name: 'exportSkillPack', call: (c) => c.exportSkillPack(), method: 'POST', path: '/v1/skill-packs/export', body: {} },
  { name: 'exportSkillPack with options', call: (c) => c.exportSkillPack({ packName: 'p' }), method: 'POST', path: '/v1/skill-packs/export', body: { packName: 'p' } },
  { name: 'importSkillPack', call: (c) => c.importSkillPack(pack, { conflictResolution: 'skip' }), method: 'POST', path: '/v1/skill-packs/import', body: { pack, options: { conflictResolution: 'skip' } } },
  { name: 'listSkillPackLibrary', call: (c) => c.listSkillPackLibrary(), method: 'GET', path: '/v1/skill-packs/library' },
  { name: 'listSkillPackLibrary filtered', call: (c) => c.listSkillPackLibrary({ vertical: 'ecommerce' as any, search: 'shop now' }), method: 'GET', path: '/v1/skill-packs/library?vertical=ecommerce&search=shop+now' },
  { name: 'installSkillPack', call: (c) => c.installSkillPack('pk'), method: 'POST', path: '/v1/skill-packs/install', body: { packId: 'pk' } },
  { name: 'getSkillPackStats', call: (c) => c.getSkillPackStats(), method: 'GET', path: '/v1/skill-packs/stats' },

  // Research (unwrapped responses)
  { name: 'research', call: (c) => c.research({ scope: 's', maxSources: 3, snippetsOnly: true } as any), method: 'POST', path: '/v1/research', body: { scope: 's', maxSources: 3, snippetsOnly: true }, direct: true },
  { name: 'quickResearch', call: (c) => c.quickResearch('s', ['a.com']), method: 'POST', path: '/v1/research/quick', body: { scope: 's', preferredDomains: ['a.com'] }, direct: true },
  { name: 'getResearchStatus', call: (c) => c.getResearchStatus(), method: 'GET', path: '/v1/research/status', direct: true },

  // Account
  { name: 'getUsage', call: (c) => c.getUsage(), method: 'GET', path: '/v1/usage' },

  // Predictions
  { name: 'getPredictions', call: (c) => c.getPredictions(), method: 'GET', path: '/v1/predictions' },
  { name: 'getPredictions filtered', call: (c) => c.getPredictions({ minUrgency: 0, domain: 'a.com' }), method: 'GET', path: '/v1/predictions?minUrgency=0&domain=a.com' },
  { name: 'getPredictionsByDomain', call: (c) => c.getPredictionsByDomain('a.com'), method: 'GET', path: '/v1/predictions/a.com' },
  { name: 'getPredictionAccuracy', call: (c) => c.getPredictionAccuracy('a.com'), method: 'GET', path: '/v1/predictions/a.com/accuracy' },
  { name: 'getPredictionAccuracy with pattern', call: (c) => c.getPredictionAccuracy('a.com', '/p/*'), method: 'GET', path: '/v1/predictions/a.com/accuracy?urlPattern=%2Fp%2F*' },
  { name: 'getUrgentPredictions', call: (c) => c.getUrgentPredictions(2), method: 'GET', path: '/v1/predictions/urgency/2' },
  { name: 'recordObservation', call: (c) => c.recordObservation('a.com', '/p', 'h', true), method: 'POST', path: '/v1/predictions/a.com/observe', body: { urlPattern: '/p', contentHash: 'h', changed: true } },
];

describe.each(cases)('$name', ({ call, method, path, body, direct }) => {
  it(`sends ${method} ${path}`, async () => {
    const payload = { marker: 'payload' };
    const { calls } = mockFetch(() => (direct ? json({ success: true, ...payload }) : ok(payload)));

    const result = await call(client());

    expect(calls).toHaveLength(1);
    expect(calls[0].method).toBe(method);
    expect(calls[0].url.replace('https://api.unbrowser.ai', '')).toBe(path);
    expect(calls[0].headers.Authorization).toBe('Bearer ub_test_key');
    // JSON drops undefined fields, matching what goes over the wire.
    expect(calls[0].body).toEqual(body);
    expect(result).toEqual(direct ? { success: true, ...payload } : payload);
  });
});

describe('health', () => {
  it('calls /health without auth and returns the body', async () => {
    const { calls } = mockFetch(() => json({ status: 'ok', version: '1' }));
    await expect(client().health()).resolves.toEqual({ status: 'ok', version: '1' });
    expect(calls[0].url).toBe('https://api.unbrowser.ai/health');
    expect(calls[0].headers.Authorization).toBeUndefined();
  });

  it('throws HEALTH_CHECK_FAILED on a non-2xx status', async () => {
    mockFetch(() => json({}, 503));
    await expect(client().health()).rejects.toMatchObject({ code: 'HEALTH_CHECK_FAILED' });
  });
});
