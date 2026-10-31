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
  channelIsLinkable,
  fetchKindnessListingDetail,
  fetchMyOffer,
  fetchRelatedKindnessListings,
  isAuthRequired,
  kindnessListingCanonical,
  kindnessListingPath,
  listingAlbumImages,
  listingDeadline,
  listingLocationLine,
  listingMetaDescription,
  listingQuantityLabel,
  listingSharePayload,
  offerErrorMessage,
  offerStatusMeta,
  orderedListingImages,
  orderChannels,
  submitKindnessOffer,
  withdrawKindnessOffer,
  type KindnessListingDetail,
} from './kindness-listing';

const apiFetchMock = vi.mocked(apiFetch);
const safeApiFetchMock = vi.mocked(safeApiFetch);

const BASE: KindnessListingDetail = {
  slug: 'یخچال-دوقلو',
  title: 'یخچال دوقلو سالم',
  description: 'برای خانواده‌ای در شوش؛ سالم است و فقط کمی کهنه.',
  excerpt: 'برای خانواده‌ای در شوش.',
  category: { title: 'لوازم آشپزخانه', slug: 'ashpazkhane', icon: '🍳' },
  quantity: 2,
  unit: 'دستگاه',
  province: 'تهران',
  city: 'ورامین',
  locality: 'قلعه‌نو',
  urgency: 'urgent',
  days_left: 9,
  published_at: '2026-10-01T10:00:00+03:30',
  expires_at: '2026-11-09T10:00:00+03:30',
  contact_note: 'تماس ۱۰ تا ۲۰',
  beneficiary_name: 'خانواده‌ای در شوش',
  contact_channels: [
    { kind: 'telegram', label: 'آیدی تلگرام', value: 'besat', link: 'https://t.me/besat' },
    { kind: 'phone', label: 'شماره تماس', value: '09120000000', link: 'tel:+989120000000' },
    { kind: 'bale', label: 'آیدی بله', value: 'besat_bale', link: '' },
  ],
  images: [
    { id: 1, image: '/media/a.jpg', is_cover: true, order: 0, alt_text: 'کاور' },
    { id: 2, image: '/media/b.jpg', order: 1 },
    { id: 3, image: '/media/a.jpg', order: 2 }, // تکراری
  ],
  cover_url: '/media/a.jpg',
};

describe('مسیر و متادیتای آگهی', () => {
  it('مسیر، اسلاگِ فارسی را انکد می‌کند', () => {
    expect(kindnessListingPath('یخچال-دوقلو')).toBe(
      `/kindness-wall/${encodeURIComponent('یخچال-دوقلو')}`,
    );
  });

  it('لینکِ کانونیکال اسلشِ اضافهٔ دامنه را پاک می‌کند', () => {
    expect(kindnessListingCanonical('x', 'https://besat.me/')).toBe(
      'https://besat.me/kindness-wall/x',
    );
  });

  it('توضیحِ متا از شرحِ واقعی ساخته و با «…» بریده می‌شود', () => {
    expect(listingMetaDescription(BASE)).toContain('خانواده‌ای در شوش');
    const long = { ...BASE, description: 'ا'.repeat(400) };
    const out = listingMetaDescription(long, 50);
    expect(out.length).toBeLessThanOrEqual(51);
    expect(out.endsWith('…')).toBe(true);
  });

  it('بدونِ شرح، متنِ جایگزین با عنوان می‌آید', () => {
    const out = listingMetaDescription({ ...BASE, description: '', excerpt: '' });
    expect(out).toContain('یخچال دوقلو سالم');
  });

  it('پیامِ اشتراک‌گذاری شاملِ عنوان، موقعیت و لینکِ مطلق است', () => {
    const share = listingSharePayload(BASE, 'https://besat.me');
    expect(share.title).toContain('یخچال دوقلو سالم');
    expect(share.text).toContain('قلعه‌نو');
    expect(share.url).toContain('/kindness-wall/');
  });
});

describe('موقعیت و مقدار', () => {
  it('روستا، شهر، استان به ترتیب', () => {
    expect(listingLocationLine(BASE)).toEqual({
      text: 'قلعه‌نو، ورامین، تهران',
      nationwide: false,
    });
  });

  it('بدونِ استان → سراسر کشور', () => {
    expect(listingLocationLine({ ...BASE, province: '', city: '', locality: '' })).toEqual({
      text: '',
      nationwide: true,
    });
  });

  it('is_nationwide صریح هم احترام دارد', () => {
    expect(listingLocationLine({ ...BASE, province: '', is_nationwide: true }).nationwide).toBe(
      true,
    );
  });

  it('مقدار با ارقام فارسی و واحد', () => {
    expect(listingQuantityLabel(BASE)).toBe('۲ دستگاه');
    expect(listingQuantityLabel({ ...BASE, quantity: 0 })).toBe('۱ دستگاه');
    expect(listingQuantityLabel({ ...BASE, unit: '' })).toBe('۲ عدد');
  });
});

describe('مترِ مهلت', () => {
  const now = new Date('2026-10-20T10:00:00+03:30').getTime();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  it('روزهای باقی‌مانده و درصدِ گذشتِ زمان', () => {
    const d = listingDeadline(BASE); // ۹ روز مانده
    expect(d.daysLeft).toBe(9);
    expect(d.tone).toBe('soon');
    /* ۱۹ روز از ۳۹ روزِ عمرِ آگهی گذشته ≈ ۴۹٪ */
    expect(d.elapsedPct).toBeGreaterThan(40);
    expect(d.elapsedPct).toBeLessThan(60);
    expect(d.label).toContain('۹');
  });

  it('فوری‌سازیِ روزهای آخر', () => {
    expect(listingDeadline({ ...BASE, days_left: 3 }).tone).toBe('critical');
    /* ۰ روز = امروز آخرین روز است، نه «مهلت تمام شده» */
    expect(listingDeadline({ ...BASE, days_left: 0 }).tone).toBe('critical');
    expect(listingDeadline({ ...BASE, days_left: 0 }).label).toBe('آخرین روز');
    expect(listingDeadline({ ...BASE, days_left: 1 }).label).toContain('۱');
    expect(listingDeadline({ ...BASE, days_left: 30 }).tone).toBe('calm');
  });

  it('بدونِ انقضا → tone=none و درصدِ صفر', () => {
    const d = listingDeadline({ ...BASE, days_left: null, expires_at: null });
    expect(d.tone).toBe('none');
    expect(d.daysLeft).toBeNull();
    expect(d.elapsedPct).toBe(0);
  });

  it('بدونِ تاریخِ انتشار، عمرِ فرضیِ ۴۵روزه مبنا می‌شود (نه NaN)', () => {
    const d = listingDeadline({ ...BASE, published_at: null, days_left: 15 });
    expect(Number.isFinite(d.elapsedPct)).toBe(true);
    expect(d.elapsedPct).toBeCloseTo(66.6, 0);
  });
});

describe('کانال‌های تماس', () => {
  it('تلفن اول، بعد پیام‌رسان‌ها، ناشناخته‌ها ته صف', () => {
    const ordered = orderChannels([
      { kind: 'instagram', label: 'اینستاگرام', value: 'a' },
      { kind: 'unknown-future', label: 'جدید', value: 'b' },
      { kind: 'phone', label: 'تلفن', value: 'c' },
      { kind: 'telegram', label: 'تلگرام', value: 'd' },
    ]);
    expect(ordered.map((c) => c.kind)).toEqual([
      'phone',
      'telegram',
      'instagram',
      'unknown-future',
    ]);
  });

  it('ورودی نامعتبر → آرایهٔ خالی (بدونِ کرش)', () => {
    expect(orderChannels(undefined)).toEqual([]);
  });

  it('لینک‌داری: tel: و https: بله، بلهِ بی‌لینک نه', () => {
    expect(channelIsLinkable({ kind: 'phone', label: '', value: '', link: 'tel:+98912' })).toBe(
      true,
    );
    expect(
      channelIsLinkable({ kind: 'telegram', label: '', value: '', link: 'https://t.me/x' }),
    ).toBe(true);
    expect(channelIsLinkable({ kind: 'bale', label: '', value: 'x', link: '' })).toBe(false);
    expect(
      channelIsLinkable({ kind: 'x', label: '', value: 'x', link: 'javascript:alert(1)' }),
    ).toBe(false);
  });
});

describe('وضعیت اعلام آمادگی', () => {
  it('سه وضعیت با برچسب/ویرایش‌پذیری درست', () => {
    expect(offerStatusMeta('new')?.editable).toBe(true);
    expect(offerStatusMeta('contacted')?.editable).toBe(false);
    expect(offerStatusMeta('declined')?.tone).toBe('rose');
    expect(offerStatusMeta(null)).toBeNull();
    expect(offerStatusMeta('whatever')).toBeNull();
  });
});

describe('تصاویر', () => {
  it('ترتیبِ کاور-اول + حذفِ تکرار', () => {
    const imgs = orderedListingImages(BASE);
    expect(imgs.map((i) => i.image)).toEqual(['/media/a.jpg', '/media/b.jpg']);
  });

  it('آلبوم: کاورِ کارت اول، بدون تکرار', () => {
    const album = listingAlbumImages(BASE);
    expect(album.length).toBe(2);
    expect(album[0].url).toContain('/media/a.jpg');
  });

  it('بدونِ تصویر → آلبوم خالی (placeholder خودِ گالری)', () => {
    expect(listingAlbumImages({ ...BASE, images: [], cover_url: null })).toEqual([]);
  });
});

describe('fetcherها', () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
    safeApiFetchMock.mockReset();
  });

  it('جزئیات با اسلاگِ canonical و کشِ ۱۸۰ ثانیه', async () => {
    safeApiFetchMock.mockResolvedValue(BASE);
    const out = await fetchKindnessListingDetail('یخچال-دوقلو');
    expect(out?.title).toBe('یخچال دوقلو سالم');
    const [path, opts] = safeApiFetchMock.mock.calls[0];
    expect(String(path)).toContain('/kindness-wall/listings/');
    expect(String(path)).toMatch(/\/$/);
    expect(opts).toMatchObject({ revalidate: 180, skipAuth: true });
  });

  it('۴۰۴ → null (صفحه با not-found پاسخ می‌دهد، نه ۵۰۰)', async () => {
    safeApiFetchMock.mockResolvedValue(null);
    expect(await fetchKindnessListingDetail('nope')).toBeNull();
  });

  it('نیازهای مشابه: از endpoint اختصاصیِ related با limit', async () => {
    safeApiFetchMock.mockResolvedValue([
      { slug: 'other-1', title: 'دیگری', excerpt: 'y', urgency: 'normal', quantity: 1 },
      {
        slug: BASE.slug,
        title: 'خودم (نباید بیاید)',
        excerpt: 'x',
        urgency: 'normal',
        quantity: 1,
      },
    ]);
    const out = await fetchRelatedKindnessListings(BASE);
    /* حتی اگر سرور خودِ آگهی را بدهد، فرانت هم فیلتر می‌کند (دفاعِ دولایه) */
    expect(out.map((i) => i.slug)).toEqual(['other-1']);
    const url = String(safeApiFetchMock.mock.calls[0][0]);
    expect(url).toContain('/related/');
    expect(url).toContain('limit=4');
  });

  it('نیازهای مشابه: پاسخ غیرآرایه → لیست خالی (بدونِ کرش)', async () => {
    safeApiFetchMock.mockResolvedValue(null);
    expect(await fetchRelatedKindnessListings(BASE)).toEqual([]);
  });

  it('beacon بازدید: POST به /view/ و نگاشتِ پاسخ', async () => {
    const { registerListingView } = await import('./kindness-listing');
    apiFetchMock.mockResolvedValue({ counted: true, view_count: 9 });
    const out = await registerListingView(BASE.slug);
    expect(out).toEqual({ counted: true, viewCount: 9 });
    const [path, init] = apiFetchMock.mock.calls[0];
    expect(String(path)).toContain('/view/');
    expect(init).toMatchObject({ method: 'POST' });
  });

  it('beacon بازدید: خطا → null (هرگز throw نمی‌کند)', async () => {
    const { registerListingView } = await import('./kindness-listing');
    apiFetchMock.mockRejectedValue(new ApiError('boom', 500));
    expect(await registerListingView(BASE.slug)).toBeNull();
  });

  it('my-offers: رکوردِ همین آگهی با شناسه پیدا می‌شود', async () => {
    apiFetchMock.mockResolvedValue({
      count: 1,
      results: [{ id: 7, listing_slug: BASE.slug, message: 'پتو دارم', status: 'new' }],
    });
    const mine = await fetchMyOffer(BASE.slug);
    expect(mine).toMatchObject({ id: 7, message: 'پتو دارم', status: 'new' });
  });

  it('my-offers: آگهیِ دیگر → null', async () => {
    apiFetchMock.mockResolvedValue({ count: 1, results: [{ id: 7, listing_slug: 'other' }] });
    expect(await fetchMyOffer(BASE.slug)).toBeNull();
  });

  it('ثبتِ اعلام از POST همان مسیر استفاده می‌کند و پیام را می‌برد', async () => {
    apiFetchMock.mockResolvedValue({ id: 9, listing_slug: BASE.slug, status: 'new' });
    const out = await submitKindnessOffer(BASE.slug, 'سلام');
    expect(out.id).toBe(9);
    const [path, init] = apiFetchMock.mock.calls[0];
    expect(String(path)).toContain('/offer/');
    expect(init).toMatchObject({ method: 'POST' });
    expect(JSON.parse(String(init?.body))).toEqual({ message: 'سلام' });
  });

  it('پس‌گرفتن با DELETE', async () => {
    apiFetchMock.mockResolvedValue(null);
    await withdrawKindnessOffer(5);
    const [path, init] = apiFetchMock.mock.calls[0];
    expect(String(path)).toBe('/kindness-wall/offers/5/withdraw/');
    expect(init).toMatchObject({ method: 'DELETE' });
  });

  it('تشخیصِ نیاز به ورود و پیامِ خطای انسانی', () => {
    expect(isAuthRequired(new ApiError('unauth', 401))).toBe(true);
    expect(isAuthRequired(new ApiError('forbidden', 403))).toBe(true);
    expect(isAuthRequired(new ApiError('bad', 400))).toBe(false);
    expect(isAuthRequired(new Error('x'))).toBe(false);
    expect(offerErrorMessage(new ApiError('HTTP 500', 500))).toContain('اتصال');
    expect(offerErrorMessage(new ApiError('محدودیت', 429))).toContain('محدودیت');
    expect(offerErrorMessage(new ApiError('این آگهی روی دیوار نیست', 400))).toBe(
      'این آگهی روی دیوار نیست',
    );
  });
});

describe('isContactGated — پرچمِ سرور و دروازهٔ دفاعیِ پنجرهٔ گذار', () => {
  it('پرچمِ true سرور → دروازه باز است', async () => {
    const { isContactGated } = await import('./kindness-listing');
    expect(isContactGated({ ...BASE, contact_gated: true })).toBe(true);
  });

  it('پرچمِ false سرور → مقدارِ کامل مجاز است (کاربرِ واردشده)', async () => {
    const { isContactGated } = await import('./kindness-listing');
    expect(isContactGated({ ...BASE, contact_gated: false })).toBe(false);
  });

  it('سرورِ قدیمی بدونِ پرچم → دروازهٔ دفاعی روشن (سیاستِ محصول)', async () => {
    const { isContactGated } = await import('./kindness-listing');
    const legacy = { ...BASE };
    delete (legacy as { contact_gated?: boolean }).contact_gated;
    expect(isContactGated(legacy)).toBe(true);
  });

  it('بدونِ کانال، دروازه‌ای وجود ندارد', async () => {
    const { isContactGated } = await import('./kindness-listing');
    const legacy = { ...BASE, contact_channels: [] };
    delete (legacy as { contact_gated?: boolean }).contact_gated;
    expect(isContactGated(legacy)).toBe(false);
    expect(isContactGated(null)).toBe(false);
  });
});

describe('redactGatedChannels — پاک‌سازیِ payload پیش از props', () => {
  it('کانال‌های کامل را ماسک و لینک را خالی می‌کند', async () => {
    const { redactGatedChannels } = await import('./kindness-listing');
    const legacy = { ...BASE };
    delete (legacy as { contact_gated?: boolean }).contact_gated;
    const safe = redactGatedChannels(legacy);
    expect(safe.contact_gated).toBe(true);
    const blob = JSON.stringify(safe);
    expect(blob).not.toContain('09120000000');
    expect(blob).not.toContain('tel:+989120000000');
    expect(blob).not.toContain('https://t.me/besat');
    expect(safe.contact_channels?.[0].value).toContain('•');
  });

  it('وقتی سرور دروازه را بسته (کاربرِ مجاز)، داده دست‌نخورده می‌ماند', async () => {
    const { redactGatedChannels } = await import('./kindness-listing');
    const safe = redactGatedChannels({ ...BASE, contact_gated: false });
    expect(safe.contact_channels?.[0].value).toBe('besat');
  });
});
