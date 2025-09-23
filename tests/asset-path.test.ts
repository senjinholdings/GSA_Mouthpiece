// where: tests/asset-path.test.ts
// what: Unit tests for the base-path-aware asset resolver logic used in client bundles.
// why: Guard regressions so JSON/assets keep loading when deploying under nested routes.

import { describe, it, expect } from 'vitest';

// keep this logic in sync with resolveAssetPath in public/app.js
const createResolver = (rawBase: string | undefined) => {
  const base = rawBase ?? '/';
  const prefix = base === '/' || base === '' ? '' : base.replace(/\/+$/, '');
  return (resource: string) => {
    if (typeof resource !== 'string' || resource.length === 0) {
      return resource;
    }
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|data:|mailto:|tel:)/i.test(resource)) {
      return resource;
    }
    if (!prefix) {
      return resource.startsWith('./') ? resource.slice(2) : resource;
    }
    let normalized = resource.startsWith('./') ? resource.slice(2) : resource;
    if (!normalized.startsWith('/')) {
      normalized = `/${normalized}`;
    }
    return `${prefix}${normalized}`;
  };
};

describe('resolveAssetPath', () => {
  it('returns resource unchanged when base is root', () => {
    const resolve = createResolver('/');
    expect(resolve('/common_data/data/site.json')).toBe('/common_data/data/site.json');
    expect(resolve('./images/logo.png')).toBe('images/logo.png');
  });

  it('prefixes paths when deployed under a subdirectory', () => {
    const resolve = createResolver('/nested/app/');
    expect(resolve('/common_data/data/site.json')).toBe('/nested/app/common_data/data/site.json');
    expect(resolve('images/logo.png')).toBe('/nested/app/images/logo.png');
    expect(resolve('./images/logo.png')).toBe('/nested/app/images/logo.png');
  });

  it('leaves absolute and protocol-relative URLs untouched', () => {
    const resolve = createResolver('/nested');
    expect(resolve('https://example.com/app.js')).toBe('https://example.com/app.js');
    expect(resolve('//cdn.example.com/app.js')).toBe('//cdn.example.com/app.js');
    expect(resolve('data:text/plain;base64,AA==')).toBe('data:text/plain;base64,AA==');
  });
});
