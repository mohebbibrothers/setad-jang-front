/**
 * تست‌های `typed-api`.
 *
 * دو لایه پوشش داده می‌شود:
 *   1. زمان اجرا  — ساخت مسیر و کوئری (این‌ها منبع رایج باگ‌های خاموش‌اند)
 *   2. زمان کامپایل — «تست‌های نوع» که اگر قرارداد API عوض شود
 *      `npm run typecheck` شکست می‌خورد، حتی اگر هیچ assertion زمان اجرایی
 *      اجرا نشود.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildPath, buildQuery, type ApiResult, type ListRow } from './typed-api';

/* ───────────────────────────────────────────────────────────────────────── */
/*  buildPath                                                                 */
/* ───────────────────────────────────────────────────────────────────────── */

describe('buildPath', () => {
  it('پیشوند /api/v1 را حذف می‌کند تا با قرارداد apiFetch جور دربیاید', () => {
    expect(buildPath('/api/v1/madadkar/campaigns/')).toBe('/madadkar/campaigns/');
  });

  it('پارامترهای مسیر را جای‌گذاری می‌کند', () => {
    expect(buildPath('/api/v1/r4j/criminals/{lookup}/', { lookup: 'ali-x' })).toBe(
      '/r4j/criminals/ali-x/',
    );
  });

  it('چند پارامتر را هم‌زمان پشتیبانی می‌کند', () => {
    expect(
      buildPath('/api/v1/lms/courses/{slug}/lessons/{lesson_slug}/', {
        slug: 'defense',
        lesson_slug: 'intro',
      }),
    ).toBe('/lms/courses/defense/lessons/intro/');
  });

  it('مقادیر را encode می‌کند تا اسلاگ فارسی یا اسلش‌دار مسیر را نشکند', () => {
    expect(buildPath('/api/v1/tabyin/contents/{external_id}/', { external_id: 'a/b c' })).toBe(
      '/tabyin/contents/a%2Fb%20c/',
    );
    expect(buildPath('/api/v1/tabyin/contents/{external_id}/', { external_id: 'روایت' })).toBe(
      `/tabyin/contents/${encodeURIComponent('روایت')}/`,
    );
  });

  it('اسلش پایانی را حفظ می‌کند (قرارداد APPEND_SLASH جنگو)', () => {
    expect(buildPath('/api/v1/auth/me/')).toMatch(/\/$/);
  });

  it('نبودِ پارامتر لازم را با خطای صریح گزارش می‌کند، نه undefined در URL', () => {
    expect(() => buildPath('/api/v1/r4j/criminals/{lookup}/', {})).toThrowError(/lookup/);
    expect(() => buildPath('/api/v1/r4j/criminals/{lookup}/', { lookup: '' })).toThrowError(
      /lookup/,
    );
  });
});

/* ───────────────────────────────────────────────────────────────────────── */
/*  buildQuery                                                                */
/* ───────────────────────────────────────────────────────────────────────── */

describe('buildQuery', () => {
  it('برای ورودی خالی رشته‌ی تهی می‌دهد', () => {
    expect(buildQuery()).toBe('');
    expect(buildQuery({})).toBe('');
  });

  it('کلیدها را مرتب می‌کند تا URL برای کش Next پایدار بماند', () => {
    expect(buildQuery({ page_size: 8, ordering: '-published_at' })).toBe(
      '?ordering=-published_at&page_size=8',
    );
  });

  it('null و undefined و رشته‌ی خالی را حذف می‌کند', () => {
    expect(buildQuery({ a: undefined, b: null, c: '', d: 1 })).toBe('?d=1');
  });

  it('صفر و false را حذف نمی‌کند (falsy ولی معنادار)', () => {
    expect(buildQuery({ page: 0, is_active: false })).toBe('?is_active=false&page=0');
  });

  it('آرایه را به کلید تکراری باز می‌کند (قرارداد DRF)', () => {
    expect(buildQuery({ tag: ['a', 'b'] })).toBe('?tag=a&tag=b');
  });

  it('مقادیر را encode می‌کند', () => {
    expect(buildQuery({ search: 'جهاد تبیین' })).toBe(
      `?search=${encodeURIComponent('جهاد تبیین').replace(/%20/g, '+')}`,
    );
  });
});

/* ───────────────────────────────────────────────────────────────────────── */
/*  یکپارچگی با apiFetch                                                      */
/* ───────────────────────────────────────────────────────────────────────── */

describe('apiGet ← apiFetch', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              success: true,
              status_code: 200,
              message: 'ok',
              data: { count: 1, next: null, previous: null, results: [{ slug: 'x' }] },
            }),
            { status: 200, headers: { 'content-type': 'application/json' } },
          ),
      ),
    );
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('مسیر و کوئری را درست می‌سازد و پاکت را باز می‌کند', async () => {
    const { apiGet } = await import('./typed-api');
    const data = await apiGet('/api/v1/madadkar/campaigns/', {
      query: { page_size: 8 },
      skipAuth: true,
    });

    const fetchMock = globalThis.fetch as unknown as {
      mock: { calls: Array<[RequestInfo | URL, RequestInit?]> };
    };
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('/madadkar/campaigns/?page_size=8');
    // پاکت باز شده — یعنی مستقیم به results می‌رسیم، نه به envelope
    expect((data as { results: unknown[] }).results).toHaveLength(1);
  });
});

/* ───────────────────────────────────────────────────────────────────────── */
/*  تست‌های سطح تایپ                                                          */
/*                                                                            */
/*  این‌ها هیچ کد زمان‌اجرایی ندارند؛ ارزششان این است که اگر بک‌اند قرارداد    */
/*  را عوض کند و `npm run api:types` تایپ‌ها را به‌روز کند، `npm run typecheck` */
/*  دقیقاً همین‌جا شکست می‌خورد و ما بی‌خبر نمی‌مانیم.                          */
/* ───────────────────────────────────────────────────────────────────────── */

describe('قراردادهای سطح تایپ', () => {
  it('مسیرهای کلیدی همچنان در اسکیما وجود دارند و شکل مورد انتظار را دارند', () => {
    type Campaigns = ApiResult<'/api/v1/madadkar/campaigns/', 'get'>;
    type CampaignRow = ListRow<'/api/v1/madadkar/campaigns/'>;
    type Login = ApiResult<'/api/v1/auth/login/password/', 'post'>;

    // پاسخ لیست باید صفحه‌بندی‌شده باشد (count/results)
    const _list: Pick<Campaigns, 'count' | 'results'> extends never ? never : true = true;
    // ردیف لیست باید یک شیء باشد، نه never — یعنی استنتاج ردیف کار می‌کند
    const _row: [CampaignRow] extends [never] ? false : true = true;
    // ورود باید توکن برگرداند
    const _login: Login extends { tokens: unknown } ? true : false = true;

    expect([_list, _row, _login]).toEqual([true, true, true]);
  });
});
