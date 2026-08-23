import { describe, expect, it } from 'vitest';
import { selectApiBase } from './api-url';

describe('selectApiBase', () => {
  it('uses the direct API origin during SSR', () => {
    expect(selectApiBase('https://besat.me/', null, true)).toBe('https://besat.me/api/v1');
  });

  it('uses direct same-origin routing in the browser', () => {
    expect(selectApiBase('https://besat.me', 'https://besat.me', false)).toBe('/api/v1');
  });

  it('uses the Next proxy for a cross-origin API', () => {
    expect(selectApiBase('https://api.example.com', 'https://example.com', false)).toBe('/api/proxy');
  });

  it('supports an explicit absolute browser request', () => {
    expect(selectApiBase('https://api.example.com', 'https://example.com', false, true))
      .toBe('https://api.example.com/api/v1');
  });

  it('falls back safely for malformed browser configuration', () => {
    expect(selectApiBase('://bad-url', 'https://besat.me', false)).toBe('/api/proxy');
  });
});
