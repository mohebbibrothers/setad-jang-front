/**
 * ═══════════════════════════════════════════════════════════════════════════
 * بازگشتِ رگرسیونِ «/admin → 404» در rewrites
 *
 * داستانِ واقعی (حادثهٔ استقرار): قاعدهٔ wildcard برای مسیرِ خالیِ `:path*`
 * هم تطبیق می‌کرد، پس `/admin` به `<upstream>/admin//` می‌رفت. جنگو به `next=/admin//` ریدایرکت می‌کرد و بعد از ورودِ موفق، مرورگر
 * به همان مسیرِ دوسلش می‌رسید که هیچ روتی ندارد → صفحهٔ «Not Found»
 * درحالی‌که لاگین درست انجام شده بود.
 *
 * این تست قرارداد را پین می‌کند: برای هر پیشوندِ بدونِ مسیر، قاعدهٔ دقیق باید
 * بالاتر از قاعدهٔ wildcard باشد و مقصدش دقیقاً یک اسلش داشته باشد.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const UPSTREAM = 'https://api.besat.me';

type Rewrite = { source: string; destination: string };

async function loadRewrites(): Promise<Rewrite[]> {
  vi.resetModules();
  process.env.API_UPSTREAM_URL = UPSTREAM;
  const mod = await import('../../next.config.mjs');
  const config = mod.default ?? mod;
  const rewrites = await config.rewrites();
  return rewrites as Rewrite[];
}

describe('next.config rewrites — bare prefixes', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    delete process.env.API_UPSTREAM_URL;
  });

  it('maps the bare /admin to exactly one trailing slash upstream', async () => {
    const rules = await loadRewrites();
    const exact = rules.find((r) => r.source === '/admin');
    expect(exact, 'exact /admin rule is missing').toBeTruthy();
    expect(exact?.destination).toBe(`${UPSTREAM}/admin/`);
    expect(exact?.destination).not.toContain('//admin');
    expect(exact?.destination.slice(-2)).not.toBe('//');
  });

  it('keeps the exact rule above the wildcard (order matters in Next)', async () => {
    const rules = await loadRewrites();
    const exactIndex = rules.findIndex((r) => r.source === '/admin');
    const wildcardIndex = rules.findIndex((r) => r.source === '/admin/:path*');
    expect(exactIndex).toBeGreaterThanOrEqual(0);
    expect(wildcardIndex).toBeGreaterThan(exactIndex);
  });

  it('does the same for the bare /api/v1', async () => {
    const rules = await loadRewrites();
    const exact = rules.find((r) => r.source === '/api/v1');
    expect(exact?.destination).toBe(`${UPSTREAM}/api/v1/`);
  });

  it('never produces a double slash for the wildcard rules either', async () => {
    const rules = await loadRewrites();
    for (const rule of rules.filter((r) => r.source.includes(':path*'))) {
      // e.g. /admin/:path* -> /admin/:path*/ is fine; it is the *empty* match
      // that used to break, and that case is now covered by the exact rules.
      expect(rule.destination.startsWith(`${UPSTREAM}/`)).toBe(true);
      expect(rule.destination).not.toContain(`${UPSTREAM}//`);
    }
  });

  it('adds no rewrite rules when API_UPSTREAM_URL is unset', async () => {
    vi.resetModules();
    delete process.env.API_UPSTREAM_URL;
    const mod = await import('../../next.config.mjs');
    const config = mod.default ?? mod;
    const rewrites = (await config.rewrites()) as Rewrite[];
    expect(rewrites.some((r) => r.source === '/admin')).toBe(false);
  });
});
