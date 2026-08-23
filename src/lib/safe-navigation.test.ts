import { describe, expect, it } from 'vitest';
import { sanitizeNextPath } from './safe-navigation';

describe('sanitizeNextPath', () => {
  it('keeps internal paths and hashes', () => {
    expect(sanitizeNextPath('/account?tab=security')).toBe('/account?tab=security');
    expect(sanitizeNextPath('/#warfund')).toBe('/#warfund');
  });

  it('rejects external and protocol-relative redirects', () => {
    expect(sanitizeNextPath('https://evil.test')).toBe('/');
    expect(sanitizeNextPath('//evil.test')).toBe('/');
  });

  it('rejects slash and newline tricks', () => {
    expect(sanitizeNextPath('/\\evil.test')).toBe('/');
    expect(sanitizeNextPath('/ok\nLocation: https://evil.test')).toBe('/');
  });
});
