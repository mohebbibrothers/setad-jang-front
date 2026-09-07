import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * نگهبانِ رگرسیونِ باگِ پروداکشن «صفحه‌ی جزئیاتِ حرکت ۴۰۴»:
 *   در صفحه‌های ISRِ Next 15.5، پارامِ slugِ فارسی گاهی percent-encoded
 *   می‌رسد؛ اگر لایه‌ی دامنه ساده‌لوحانه encodeURIComponent بزند، مسیر
 *   double-encoded می‌شود و بک‌اند ۴۰۴ می‌دهد. این تست‌ها تضمین می‌کنند
 *   هر چهار fetcherِ اسلاگ‌دارِ مددکار دقیقاً یک لایه encode می‌سازند.
 */

const hoisted = vi.hoisted(() => ({
  apiFetch: vi.fn(),
  safeApiFetch: vi.fn(),
}));

vi.mock('./api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api')>();
  return {
    ...actual,
    apiFetch: hoisted.apiFetch,
    safeApiFetch: hoisted.safeApiFetch,
  };
});

import {
  fetchCampaignDetail,
  fetchCampaignDetailClient,
  fetchTransparency,
  initiateParticipation,
} from './madadkar';

const SINGLE = `/madadkar/campaigns/${encodeURIComponent('تست')}/`;

beforeEach(() => {
  hoisted.safeApiFetch.mockReset().mockResolvedValue(null);
  hoisted.apiFetch.mockReset().mockResolvedValue({ ok: true });
});

describe('نگهبانِ double-encoding در مسیرهای اسلاگ‌دار', () => {
  it.each([
    ['تست (خام)', 'تست'],
    ['%D8%AA%D8%B3%D8%AA (از قبل انکدشده — پارامِ ISR)', '%D8%AA%D8%B3%D8%AA'],
  ])('fetchCampaignDetail با ورودی %s دقیقاً یک‌بار encode می‌کند', async (_label, slug) => {
    await fetchCampaignDetail(slug);
    expect(hoisted.safeApiFetch).toHaveBeenCalledWith(
      SINGLE,
      expect.objectContaining({ revalidate: 300 }),
    );
    expect(String(hoisted.safeApiFetch.mock.calls[0]?.[0])).not.toContain('%25');
  });

  it('fetchTransparency روی اسلاگِ انکدشده هم مسیرِ تکی می‌سازد', async () => {
    await fetchTransparency('%D8%AA%D8%B3%D8%AA');
    expect(hoisted.safeApiFetch).toHaveBeenCalledWith(
      `${SINGLE}transparency/`,
      expect.objectContaining({ revalidate: 120 }),
    );
  });

  it('fetchCampaignDetailClient (سمت مرورگر) هم idempotent است', async () => {
    hoisted.apiFetch.mockResolvedValueOnce(null);
    await fetchCampaignDetailClient('%D8%AA%D8%B3%D8%AA');
    expect(hoisted.apiFetch).toHaveBeenCalledWith(SINGLE);
  });

  it('initiateParticipation اسلاگِ فارسی را double-encode نمی‌کند', async () => {
    await initiateParticipation('تست', { share_count: 1 });
    expect(hoisted.apiFetch).toHaveBeenCalledWith(
      `${SINGLE}participate/`,
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('قانونِ idempotency: encode(encode(x)) === encode(x)', async () => {
    const { canonicalApiLookup } = await import('./utils');
    const once = canonicalApiLookup('تست');
    expect(canonicalApiLookup(once)).toBe(once);
    expect(canonicalApiLookup('%ZZ')).toBe('%25ZZ'); // دنبالهٔ % ناقص — بدون پرتابِ خطا امن‌سازی می‌شود
  });
});
