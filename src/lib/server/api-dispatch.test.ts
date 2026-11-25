import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import manifest from './api-manifest.json';
import { allowedMethods } from './proxy-policy';

describe('native SvelteKit API routes', () => {
  it.each(manifest)('retains the NM methods for $route', ({ route, methods }) => {
    const source = readFileSync(new URL('../../routes' + route + '/+server.ts', import.meta.url), 'utf8');
    const exported = Array.from(source.matchAll(/export\s+(?:const|(?:async\s+)?function)\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/g), m => m[1]);
    expect(exported.sort()).toEqual([...methods].sort());
    expect(allowedMethods(route.replace(/\[[^\]]+\]/g, 'fixture-id')).sort()).toEqual([...methods].sort());
  });
});
