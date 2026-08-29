import { afterEach, describe, expect, it, vi } from 'vitest';
import { countVisibleFeedTotal, fetchTabyinFilteredComplete } from './home-data';

/**
 * home-data — اسکنِ کاملِ کرپوس + شمارِ «واقعیِ قابل‌نمایش».
 *
 * تمرکزِ این تست‌ها روی قراردادی است که مستقیماً از گزارشِ کاربر آمده:
 * شمارنده‌ی فید زیرِ فیلترِ «متن» نباید ۳۹ (شمارِ خامِ پاکتِ سرور) را
 * نشان بدهد؛ باید ۳۲ را نشان بدهد — دقیقاً همان تعدادِ کارت‌هایی که
 * کاربر می‌بیند، یعنی بعد از حذفِ پوسته‌های تهی (شروطِ نمایشِ دیوار)
 * و نسخه‌های همسانِ سندیکا (keep-first).
 */

const envelope = (data: unknown) => ({
  success: true,
  status_code: 200,
  message: 'ok',
  data,
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

type Row = {
  external_id: string;
  title?: string;
  description?: string;
  author_username?: string;
  attachments?: unknown;
};

/**
 * fetchِ ساختگی که بر اساس پارامترِ pageِ URL، همان صفحه‌ی پاکتی را
 * برمی‌گرداند. توجه: در محیطِ تست (happy-dom) apiFetch شاخه‌ی مرورگر
 * را می‌رود و URL نسبی (/api/proxy/…) می‌سازد — پس base می‌دهیم تا
 * parse شکست نخورد.
 */
const TEST_BASE = 'http://test.local';

function pageParamOf(input: RequestInfo | URL): URL {
  const raw = typeof input === 'string' || input instanceof URL ? String(input) : input.url;
  return new URL(raw, TEST_BASE);
}

function paginatedFetch(pages: Map<number, Row[]>, totalCount: number) {
  return vi.fn(async (input: RequestInfo | URL) => {
    const page = Number(pageParamOf(input).searchParams.get('page') ?? '1');
    return jsonResponse(
      envelope({ count: totalCount, next: null, previous: null, results: pages.get(page) ?? [] }),
    );
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchTabyinFilteredComplete — کرپوسِ فیلترشده‌ی سرور، کامل', () => {
  it('صفحه‌ها را با page_size=100 و دقیقاً همان پارامترهای فید تا پایانِ کرپوس می‌خواند', async () => {
    const textRow = (id: string, i: number): Row => ({
      external_id: id,
      title: `روایتِ ${i}`,
      attachments: [],
    });
    const pages = new Map<number, Row[]>([
      [1, Array.from({ length: 100 }, (_, i) => textRow(`r${i}`, i))],
      [2, Array.from({ length: 100 }, (_, i) => textRow(`r${100 + i}`, 100 + i))],
      [3, Array.from({ length: 30 }, (_, i) => textRow(`r${200 + i}`, 200 + i))],
    ]);
    const fetchMock = paginatedFetch(pages, 230);
    vi.stubGlobal('fetch', fetchMock);

    const rows = await fetchTabyinFilteredComplete({
      q: 'ایران',
      type: 'other',
      author: 'هرمزگان',
    });

    expect(rows).toHaveLength(230);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const urls = fetchMock.mock.calls.map((c) =>
      decodeURIComponent(pageParamOf(c[0] as RequestInfo).toString()),
    );
    expect(urls.every((u) => u.includes('page_size=100'))).toBe(true);
    expect(urls.every((u) => u.includes('media_type=other'))).toBe(true);
    expect(urls.every((u) => u.includes('author=هرمزگان'))).toBe(true);
    expect(urls.every((u) => u.includes('search=ایران'))).toBe(true);
    expect(urls.every((u) => u.includes('ordering=-source_created_at'))).toBe(true);
    const pageParams = urls
      .map((u) => new URL(u, TEST_BASE).searchParams.get('page'))
      .sort((a, b) => Number(a) - Number(b));
    expect(pageParams).toEqual(['1', '2', '3']);
  });

  it('بک‌اند در دسترس نبود → کرپوسِ خالی (رفتارِ امانت‌دارِ قبلی حفظ می‌شود)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('ECONNREFUSED');
      }),
    );
    await expect(
      fetchTabyinFilteredComplete({ q: '', type: 'other', author: '' }),
    ).resolves.toEqual([]);
  });
});

describe('countVisibleFeedTotal — شمارِ «واقعیِ قابل‌نمایش»', () => {
  it('سناریوی کاربر — فیلترِ «متن»: از ۳۹ سطرِ خام دقیقاً ۳۲ روایت شمرده می‌شود', async () => {
    const corpus: Row[] = [];
    // ۳۲ روایتِ واقعی و متمایز (متنی، بدون پیوست)
    for (let i = 0; i < 32; i++) {
      corpus.push({
        external_id: `note-${i}`,
        title: `روایتِ واقعیِ شماره‌ی ${i}`,
        attachments: [],
      });
    }
    // ۲ نسخه‌ی همسانِ سندیکا از دو روایتِ نخست (external_id جدا، متنِ عیناً یکسان)
    corpus.push({ external_id: 'dup-0', title: 'روایتِ واقعیِ شماره‌ی 0', attachments: [] });
    corpus.push({ external_id: 'dup-1', title: 'روایتِ واقعیِ شماره‌ی 1', attachments: [] });
    // ۵ پوسته‌ی تهی — نه متنِ خواندنی، نه کاور، نه ویدئو
    for (let i = 0; i < 5; i++) {
      corpus.push({ external_id: `hollow-${i}`, attachments: [] });
    }
    expect(corpus).toHaveLength(39); // دقیقاً سناریوی گزارش‌شده

    vi.stubGlobal('fetch', paginatedFetch(new Map([[1, corpus]]), 39));
    await expect(countVisibleFeedTotal({ q: '', type: 'other', author: '' })).resolves.toBe(32);
  });

  it('دیدگاهِ پیش‌فرض هم از کلِ کرپوس می‌شمارد (بدونِ media_type) — نه از پاکتِ یک صفحه', async () => {
    const corpus: Row[] = [];
    for (let i = 0; i < 40; i++) {
      corpus.push({ external_id: `n-${i}`, title: `روایت‌گوی مردم ${i}` });
    }
    corpus.push({ external_id: 'dup-a', title: 'روایت‌گوی مردم 0' });
    corpus.push({ external_id: 'dup-b', title: 'روایت‌گوی مردم 1' });
    corpus.push({ external_id: 'void-x' });
    corpus.push({ external_id: 'void-y' });

    const fetchMock = paginatedFetch(new Map([[1, corpus]]), 44);
    vi.stubGlobal('fetch', fetchMock);

    await expect(countVisibleFeedTotal({ q: '', type: '', author: '' })).resolves.toBe(40);
    expect(String(fetchMock.mock.calls[0]?.[0])).not.toContain('media_type');
  });

  it('بک‌اند در دسترس نبود → undefined تا UI به شمارِ خامِ پاکت فرو افتد (نه صفرِ گمراه‌کننده)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('ECONNREFUSED');
      }),
    );
    await expect(countVisibleFeedTotal({ q: '', type: '', author: '' })).resolves.toBeUndefined();
  });
});
