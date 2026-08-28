// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';

/**
 * global-search — قراردادِ اگریگیتورِ سراسری:
 *   • سقفِ دراپ‌داون (۵) پارامتری است؛ صفحه‌ی /search سقفِ خودش را
 *     می‌فرستد و دیگر هیچ منبعی به ۵ نتیجه محدود نمی‌ماند؛
 *   • countِ پاکتِ سرور به‌عنوان «شمارِ واقعی» برمی‌گردد تا UI بگوید
 *     «نمایش ۱۲ از ۴۷» نه اینکه خاموشیِ ۵تایی را تمامِ دنیا بداند؛
 *   • seeAllHref تبیین به پارامترهای فید (q/type/author) نگاشت می‌شود؛
 *   • هر منبع در promise مستقل است — خطای یکی، خوابِ همه نیست.
 */

const apiFetchMock = vi.fn();
vi.mock('@/lib/api', () => ({
  apiFetch: (...args: unknown[]) => apiFetchMock(...args),
}));

import { searchAll, SEARCH_PAGE_GROUP_LIMIT, SEARCH_SOURCES } from './global-search';

describe('لینک «مشاهده همه در …» — نگاشتِ پارامترها', () => {
  it('تبیین: search/media_type/author به q/type/author فید نگاشت می‌شود', () => {
    const href = SEARCH_SOURCES.tabyin.seeAllHref('ایران', {
      media_type: 'video',
      author: 'شیراز',
    });
    const [path, qs] = href.split('?');
    expect(path).toBe('/tabyin');
    const p = new URLSearchParams(qs);
    expect(p.get('q')).toBe('ایران');
    expect(p.get('type')).toBe('video');
    expect(p.get('author')).toBe('شیراز');
  });

  it('بدون کوئری و فست، مسیرِ خالص برمی‌گردد', () => {
    expect(SEARCH_SOURCES.tabyin.seeAllHref('')).toBe('/tabyin');
  });
});

describe('searchAll — سقفِ پارامتری و شمارِ واقعی', () => {
  it('سقفِ پیش‌فرض ۵ است و countِ پاکت شمارِ واقعی برمی‌گردد', async () => {
    apiFetchMock.mockResolvedValue({
      count: 47,
      results: Array.from({ length: 5 }, (_, i) => ({
        external_id: `t${i}`,
        title: `روایت ${i}`,
        attachments: [],
      })),
    });
    const agg = await searchAll('جنگ', { sources: ['tabyin'] });
    expect(apiFetchMock).toHaveBeenCalledTimes(1);
    expect(String(apiFetchMock.mock.calls[0][0])).toContain('page_size=5');
    expect(agg.groups).toHaveLength(1);
    expect(agg.groups[0].count).toBe(47);
    expect(agg.groups[0].hits).toHaveLength(5);
    expect(agg.total).toBe(47);
  });

  it('perSourceLimit هم به page_sizeِ API می‌رود هم برشِ نمایشی', async () => {
    apiFetchMock.mockResolvedValue({
      count: 30,
      results: Array.from({ length: SEARCH_PAGE_GROUP_LIMIT }, (_, i) => ({
        external_id: `t${i}`,
        title: `روایت ${i}`,
        attachments: [],
      })),
    });
    const agg = await searchAll('جنگ', {
      sources: ['tabyin'],
      perSourceLimit: SEARCH_PAGE_GROUP_LIMIT,
    });
    expect(String(apiFetchMock.mock.calls[0][0])).toContain(`page_size=${SEARCH_PAGE_GROUP_LIMIT}`);
    expect(agg.groups[0].hits).toHaveLength(SEARCH_PAGE_GROUP_LIMIT);
    expect(agg.groups[0].count).toBe(30);
    expect(agg.total).toBe(30);
  });

  it('خطای یک منبع، بقیه را نمی‌خواباند و گزارش می‌شود', async () => {
    // نکته‌ی هارنس: پرتابِ همگامِ خطا در بدنه‌ی ماک — ردِ دست‌سازِ پرامیس
    // در happy-dom گاه به اشتباه unhandled-rejection گزارش می‌شود.
    const boom = (): never => {
      throw new Error('boom');
    };
    apiFetchMock.mockImplementation((...args: unknown[]) => {
      const url = String(args[0] ?? '');
      if (!url.includes('/tabyin/')) boom();
      return Promise.resolve({
        count: 2,
        results: [
          { external_id: 'a', title: 'روایت', attachments: [] },
          { external_id: 'b', title: 'روایت دوم', attachments: [] },
        ],
      });
    });
    const promise = searchAll('تست');
    // Catchِ زودهنگام — خطاهای منابع در allSettled مصرف می‌شوند؛ این
    // صرفاً مانع ثبتِ اشتباهِ هارنس vitest به‌عنوان unhandled می‌شود.
    promise.catch(() => undefined);
    const agg = await promise;
    expect(agg.groups.map((g) => g.source)).toEqual(['tabyin']);
    expect(agg.errored).toHaveLength(4);
    expect(agg.total).toBe(2);
  });

  it('عبارتِ کوتاه‌تر از ۲ نویسه هیچ واکشی ندارد', async () => {
    const agg = await searchAll('ا');
    expect(apiFetchMock).not.toHaveBeenCalled();
    expect(agg.total).toBe(0);
    expect(agg.groups).toHaveLength(0);
  });
});
