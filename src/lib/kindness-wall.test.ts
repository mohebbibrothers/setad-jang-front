import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api', () => {
  class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
    }
  }
  return {
    apiFetch: vi.fn(),
    safeApiFetch: vi.fn(),
    isApiError: (e: unknown): boolean => e instanceof ApiError,
    ApiError,
  };
});

import { apiFetch, safeApiFetch, ApiError } from '@/lib/api';
import {
  DEFAULT_KINDNESS_FILTERS,
  fetchKindnessListingsPage,
  hasActiveKindnessFilters,
  kindnessHubHref,
  mapKindnessStories,
  readKindnessFilters,
} from './kindness-wall';

const apiFetchMock = vi.mocked(apiFetch);
const safeApiFetchMock = vi.mocked(safeApiFetch);

/**
 * قراردادِ URL هابِ دیوار مهربانی — نام‌ها دقیقاً همان پارامترهای
 * KindnessListingPublicFilter بک‌اند‌اند (search/category/province/city/
 * urgent/ordering/page) تا لینک‌ها shareable و مستند بمانند.
 */

describe('readKindnessFilters', () => {
  it('ورودی خالی → پیش‌فرضِ تخته (ویژه‌ها اول، صفحهٔ ۱)', () => {
    expect(readKindnessFilters({})).toEqual(DEFAULT_KINDNESS_FILTERS);
  });

  it('پارامترهای معتبر خوانده و trim می‌شوند', () => {
    const f = readKindnessFilters({
      search: ' یخچال ',
      category: 'ashpazkhane',
      province: 'تهران',
      city: 'ری',
      urgent: 'true',
      ordering: 'expiring',
      page: '3',
    });
    expect(f).toEqual({
      search: 'یخچال',
      category: 'ashpazkhane',
      province: 'تهران',
      city: 'ری',
      urgent: true,
      ordering: 'expiring',
      page: 3,
    });
  });

  it('orderingِ نامعتبر بی‌صدا به ترتیبِ مرجعِ تخته برمی‌گردد (مثل بک‌اند)', () => {
    expect(readKindnessFilters({ ordering: 'hacked' }).ordering).toBe('');
  });

  it('urgent فقط با «true» روشن می‌شود', () => {
    expect(readKindnessFilters({ urgent: '1' }).urgent).toBe(false);
    expect(readKindnessFilters({ urgent: 'false' }).urgent).toBe(false);
  });

  it('pageِ غیرعددی/صفر/منفی → ۱', () => {
    expect(readKindnessFilters({ page: 'abc' }).page).toBe(1);
    expect(readKindnessFilters({ page: '0' }).page).toBe(1);
    expect(readKindnessFilters({ page: '-2' }).page).toBe(1);
    expect(readKindnessFilters({ page: '2.9' }).page).toBe(2);
  });

  it('مقادیر آرایه‌ای (پارامترِ تکراری) نادیده گرفته می‌شوند', () => {
    expect(readKindnessFilters({ search: ['a', 'b'] }).search).toBe('');
  });
});

describe('kindnessHubHref', () => {
  it('بدون فیلتر → مسیرِ تمیز', () => {
    expect(kindnessHubHref(DEFAULT_KINDNESS_FILTERS, {})).toBe('/kindness-wall');
  });

  it('فیلترها حفظ و مقادیر پیش‌فرض حذف می‌شوند', () => {
    const href = kindnessHubHref(
      { ...DEFAULT_KINDNESS_FILTERS, search: 'یخچال', category: 'ashpazkhane' },
      { urgent: true, page: 2 },
    );
    const [path, qs] = href.split('?');
    expect(path).toBe('/kindness-wall');
    const params = new URLSearchParams(qs);
    expect(params.get('search')).toBe('یخچال');
    expect(params.get('category')).toBe('ashpazkhane');
    expect(params.get('urgent')).toBe('true');
    expect(params.get('page')).toBe('2');
  });

  it('page=1 و ordering پیش‌فرض در URL نوشته نمی‌شوند', () => {
    const href = kindnessHubHref(DEFAULT_KINDNESS_FILTERS, { page: 1, ordering: 'fresh' });
    const params = new URLSearchParams(href.split('?')[1]);
    expect(params.has('page')).toBe(false);
    expect(params.get('ordering')).toBe('fresh');
    expect(kindnessHubHref(DEFAULT_KINDNESS_FILTERS, { ordering: '' }).includes('ordering')).toBe(
      false,
    );
  });

  it('override خالی، فیلتر را حذف می‌کند (چیپ‌های حذف تکی)', () => {
    const href = kindnessHubHref(
      { ...DEFAULT_KINDNESS_FILTERS, category: 'poshak', urgent: true },
      { category: '', page: 1 },
    );
    const params = new URLSearchParams(href.split('?')[1]);
    expect(params.has('category')).toBe(false);
    expect(params.get('urgent')).toBe('true');
  });
});

describe('hasActiveKindnessFilters', () => {
  it('پیش‌فرض → false؛ هر فیلتر → true', () => {
    expect(hasActiveKindnessFilters(DEFAULT_KINDNESS_FILTERS)).toBe(false);
    expect(hasActiveKindnessFilters({ ...DEFAULT_KINDNESS_FILTERS, page: 2 })).toBe(false);
    expect(hasActiveKindnessFilters({ ...DEFAULT_KINDNESS_FILTERS, city: 'شوش' })).toBe(true);
    expect(hasActiveKindnessFilters({ ...DEFAULT_KINDNESS_FILTERS, urgent: true })).toBe(true);
    expect(hasActiveKindnessFilters({ ...DEFAULT_KINDNESS_FILTERS, ordering: 'popular' })).toBe(
      true,
    );
  });
});

describe('mapKindnessStories — بایگانی «داستان‌های مهربانی»', () => {
  it('نگاشت کاملِ یک استوری', () => {
    const out = mapKindnessStories([
      {
        slug: 'yakhchal',
        title: '  یخچال دوقلو  ',
        category: { title: 'لوازم آشپزخانه', icon: '🍳' },
        quantity: 2,
        unit: 'دستگاه',
        city: 'شوش',
        fulfilled_at: '2026-10-20T10:00:00Z',
        fulfillment_note: ' تحویل شد. ',
        cover_url: '/media/kindness/a.jpg',
      },
    ]);
    expect(out).toEqual([
      {
        slug: 'yakhchal',
        title: 'یخچال دوقلو',
        categoryTitle: 'لوازم آشپزخانه',
        categoryIcon: '🍳',
        quantity: 2,
        unit: 'دستگاه',
        city: 'شوش',
        fulfilledAt: '2026-10-20T10:00:00Z',
        note: 'تحویل شد.',
        coverImage: expect.stringContaining('/media/kindness/a.jpg'),
      },
    ]);
  });

  it('پیش‌فرض‌ها: تعداد ۱، واحد «عدد»، بدون شهر → undefined', () => {
    const [s] = mapKindnessStories([{ slug: 'x', title: 'نیازی' }]);
    expect(s.quantity).toBe(1);
    expect(s.unit).toBe('عدد');
    expect(s.city).toBeUndefined();
    expect(s.coverImage).toBeUndefined();
  });

  it('ردیف‌های بی‌اسلاگ یا بی‌عنوان حذف می‌شوند', () => {
    const out = mapKindnessStories([
      { slug: '', title: 'A' },
      { slug: 'ok', title: '  ' },
      { slug: 'ok-2', title: 'ویلچر' },
    ]);
    expect(out.map((s) => s.slug)).toEqual(['ok-2']);
  });
});

describe('fetchKindnessListingsPage', () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
    safeApiFetchMock.mockReset();
  });

  it('پاسخ موفق → نگاشت آیتم‌ها + pageCount از count', async () => {
    apiFetchMock.mockResolvedValue({
      count: 13,
      next: null,
      previous: null,
      results: [{ slug: 'a', title: 'نیاز الف', excerpt: 'توضیح', urgency: 'urgent', quantity: 2 }],
    });
    const out = await fetchKindnessListingsPage(DEFAULT_KINDNESS_FILTERS);
    expect(out?.pageCount).toBe(2);
    expect(out?.count).toBe(13);
    expect(out?.items).toHaveLength(1);
    expect(out?.items[0]?.urgency).toBe('urgent');
    /* کوئری باید نام‌های دقیقِ API را بگذراند */
    expect(apiFetchMock).toHaveBeenCalledWith(
      '/kindness-wall/listings/?page_size=12&page=1',
      expect.objectContaining({ revalidate: 240 }),
    );
  });

  it('فیلترها همان‌نامِ API در کوئری می‌نشینند', async () => {
    apiFetchMock.mockResolvedValue({ count: 0, next: null, previous: null, results: [] });
    await fetchKindnessListingsPage({
      search: 'یخچال',
      category: 'ashpazkhane',
      province: 'تهران',
      city: 'ری',
      urgent: true,
      ordering: 'expiring',
      page: 2,
    });
    const url = apiFetchMock.mock.calls[0]?.[0] as string;
    const params = new URLSearchParams(url.split('?')[1]);
    expect(params.get('search')).toBe('یخچال');
    expect(params.get('category')).toBe('ashpazkhane');
    expect(params.get('province')).toBe('تهران');
    expect(params.get('city')).toBe('ری');
    expect(params.get('urgent')).toBe('true');
    expect(params.get('ordering')).toBe('expiring');
    expect(params.get('page')).toBe('2');
  });

  it('۴۰۴ برای page>۱ → outOfRange با count از probeٔ سبک (نه «API خاموش»)', async () => {
    apiFetchMock.mockRejectedValue(new ApiError('صفحه نامعتبر است.', 404));
    safeApiFetchMock.mockResolvedValue({ count: 25, next: null, previous: null, results: [{}] });
    const out = await fetchKindnessListingsPage({ ...DEFAULT_KINDNESS_FILTERS, page: 3 });
    expect(out?.outOfRange).toBe(true);
    expect(out?.items).toEqual([]);
    expect(out?.count).toBe(25);
    expect(out?.pageCount).toBe(3);
    expect(safeApiFetchMock).toHaveBeenCalledWith(
      '/kindness-wall/listings/?page_size=1',
      expect.objectContaining({ revalidate: 240 }),
    );
  });

  it('۴۰۴ روی page=۱ قطعیِ واقعی است → null', async () => {
    apiFetchMock.mockRejectedValue(new ApiError('not found', 404));
    const out = await fetchKindnessListingsPage(DEFAULT_KINDNESS_FILTERS);
    expect(out).toBeNull();
    expect(safeApiFetchMock).not.toHaveBeenCalled();
  });

  it('خطای شبکه (غیر ApiError) → null', async () => {
    apiFetchMock.mockRejectedValue(new TypeError('fetch failed'));
    const out = await fetchKindnessListingsPage({ ...DEFAULT_KINDNESS_FILTERS, page: 4 });
    expect(out).toBeNull();
  });
});
