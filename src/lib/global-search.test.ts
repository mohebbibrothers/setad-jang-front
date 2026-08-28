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

import {
  searchAll,
  searchSourcePage,
  SEARCH_PAGE_GROUP_LIMIT,
  SEARCH_SOURCES,
} from './global-search';
import { siteConfig } from './site';

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

describe('searchSourcePage — موتورِ «نمایش بیشتر» در /search', () => {
  it('صفحه و page_size مستقیم به API می‌روند و hasMore از count محاسبه می‌شود', async () => {
    apiFetchMock.mockResolvedValue({
      count: 30,
      results: Array.from({ length: 12 }, (_, i) => ({
        external_id: `p2-${i}`,
        title: `روایت ${i}`,
        attachments: [],
      })),
    });
    const res = await searchSourcePage('tabyin', 'جنگ', { page: 2, pageSize: 12 });
    const url = String(apiFetchMock.mock.calls[apiFetchMock.mock.calls.length - 1][0]);
    expect(url).toContain('/tabyin/contents/');
    expect(url).toContain('page=2');
    expect(url).toContain('page_size=12');
    expect(res.hits).toHaveLength(12);
    expect(res.count).toBe(30);
    expect(res.hasMore).toBe(true); // 24 < 30
  });

  it('رسیدن به صفحه‌ی پایانی → hasMore=false؛ عبارتِ کوتاه هیچ واکشی ندارد', async () => {
    apiFetchMock.mockResolvedValue({
      count: 24,
      results: [{ external_id: 'x', title: 'آخرین', attachments: [] }],
    });
    const last = await searchSourcePage('tabyin', 'جنگ', { page: 2, pageSize: 12 });
    expect(last.hasMore).toBe(false);
    const callsBefore = apiFetchMock.mock.calls.length;
    const empty = await searchSourcePage('tabyin', 'ب');
    expect(empty.hits).toHaveLength(0);
    expect(empty.hasMore).toBe(false);
    expect(apiFetchMock.mock.calls.length).toBe(callsBefore);
  });

  it('صفحه‌ها بیرون از بازه clamp می‌شوند (page≤۱ و pageSize≤۱۰۰)', async () => {
    apiFetchMock.mockResolvedValue({ count: 1, results: [] });
    await searchSourcePage('lms', 'امداد', { page: 0, pageSize: 500 });
    const url = String(apiFetchMock.mock.calls[apiFetchMock.mock.calls.length - 1][0]);
    expect(url).not.toContain('page=');
    expect(url).toContain('page_size=100');
  });
});

describe('تامنیلِ کارت‌های جست‌وجو — قراردادِ بصری', () => {
  it('ویدئو: کاورِ GIFِ فریمِ اول می‌آید؛ آدرسِ MP4 هرگز تامنیل نمی‌شود', async () => {
    apiFetchMock.mockResolvedValue({
      count: 1,
      results: [
        {
          external_id: 'vid-1',
          title: 'فیلمِ عملیات',
          attachments: [
            {
              url: 'https://app-media.armansky.ir/org/uploads/v/op.mp4',
              media_type: 'video',
            },
          ],
        },
      ],
    });
    const agg = await searchAll('عملیات', { sources: ['tabyin'] });
    const hit = agg.groups[0].hits[0];
    expect(hit.thumb).toBe('https://app-media.armansky.ir/thumbnail/uploads/v/op.gif');
    expect(hit.thumb).not.toContain('.mp4');
    expect(hit.kind).toBe('video');
    expect(hit.pill).toBe('ویدئو');
  });

  it('پادکستِ دارای کاورِ ویدئویی: تصویرِ کاور تامنیل است و نوع «صوت» می‌ماند', async () => {
    apiFetchMock.mockResolvedValue({
      count: 1,
      results: [
        {
          external_id: 'pod-1',
          title: 'پادکستِ تحلیل',
          attachments: [
            { url: 'https://app-media.armansky.ir/org/uploads/a/ep.mp3', media_type: 'audio' },
            { url: 'https://app-media.armansky.ir/org/uploads/a/cover.jpg', media_type: 'image' },
            { url: 'https://app-media.armansky.ir/org/uploads/a/teaser.mp4', media_type: 'video' },
          ],
          primary_media_type: 'video',
        },
      ],
    });
    const agg = await searchAll('تحلیل', { sources: ['tabyin'] });
    const hit = agg.groups[0].hits[0];
    expect(hit.thumb).toBe('https://app-media.armansky.ir/org/uploads/a/cover.jpg');
    expect(hit.kind).toBe('audio'); // «صوت همیشه می‌برد»
    expect(hit.pill).toBe('صوت');
  });

  it('ویدئوی روی هاستِ بیگانه (بی‌کاورِ سازگار) → تامنیل نیست، نه آدرسِ شکسته', async () => {
    apiFetchMock.mockResolvedValue({
      count: 1,
      results: [
        {
          external_id: 'vid-x',
          title: 'کلیپِ مهمان',
          attachments: [{ url: 'https://cdn.other.example/v/c.mp4', media_type: 'video' }],
        },
      ],
    });
    const agg = await searchAll('کلیپ', { sources: ['tabyin'] });
    expect(agg.groups[0].hits[0].thumb).toBeUndefined();
  });

  it('عدالت: عکسِ primary به هر قالبی (آبجکت/رشته/گالری) استخراج می‌شود', async () => {
    apiFetchMock.mockResolvedValue({
      count: 3,
      results: [
        {
          slug: 'a',
          first_name: 'نام',
          last_name: 'یک',
          primary_photo: { image: '/media/r4j/a.jpg' },
        },
        { slug: 'b', first_name: 'نام', last_name: 'دو', primary_photo: '/media/r4j/b.jpg' },
        {
          slug: 'c',
          first_name: 'نام',
          last_name: 'سه',
          photos: [{ image: '/media/r4j/c.jpg' }],
        },
      ],
    });
    const agg = await searchAll('نام', { sources: ['r4j'] });
    const base = siteConfig.apiUrl.replace(/\/+$/, '');
    expect(agg.groups[0].hits.map((h) => h.thumb)).toEqual([
      `${base}/media/r4j/a.jpg`,
      `${base}/media/r4j/b.jpg`,
      `${base}/media/r4j/c.jpg`,
    ]);
  });
});
