import { describe, expect, it } from 'vitest';

/**
 * نگاشت‌های دیوار مهربانی v2 (home-data):
 *   قرارداد جدید بک‌اند + گاردِ پنجرهٔ گذار — سطرهای کهنهٔ v1 هرگز نباید
 *   به کارت تبدیل شوند چون نصف فیلدهایشان دیگر صادقانه نیست.
 */

import {
  isV2KindnessListing,
  mapKindnessCategories,
  mapKindnessListings,
  mapKindnessStats,
} from './home-data';

const V2_ITEM = {
  slug: 'یخچال-دوقلو',
  title: 'یخچال دوقلو سالم',
  excerpt: 'برای خانواده‌ای در شوش…',
  category: { slug: 'ashpazkhane', title: 'لوازم آشپزخانه', icon: '🍳' },
  urgency: 'urgent',
  urgency_display: 'فوری',
  is_featured: true,
  quantity: 2,
  unit: 'دستگاه',
  province: 'تهران',
  city: 'شوش',
  view_count: 143,
  open_offers_count: 3,
  cover_url: '/media/kindness_wall/cover.jpg',
  days_left: 9,
  published_at: '2026-10-20T10:00:00Z',
};

describe('mapKindnessListings — قرارداد v2', () => {
  it('آیتم v2 را با همهٔ فیلدهای کارت نگاشت می‌کند', () => {
    const [card] = mapKindnessListings([V2_ITEM]);

    expect(card.slug).toBe('یخچال-دوقلو');
    expect(card.urgency).toBe('urgent');
    expect(card.isFeatured).toBe(true);
    expect(card.quantity).toBe(2);
    expect(card.unit).toBe('دستگاه');
    expect(card.categoryIcon).toBe('🍳');
    expect(card.daysLeft).toBe(9);
    expect(card.openOffersCount).toBe(3);
    expect(card.coverImage).toContain('cover.jpg');
  });

  it('سقف‌دارِ دفاعی: مقدار صفر/منفی به ۱ برمی‌گردد و واحد پیش‌فرض «عدد» است', () => {
    const [card] = mapKindnessListings([{ ...V2_ITEM, quantity: 0, unit: '  ' }]);
    expect(card.quantity).toBe(1);
    expect(card.unit).toBe('عدد');
  });

  it('urgency ناشناخته به normal رزرو می‌شود', () => {
    const [card] = mapKindnessListings([{ ...V2_ITEM, urgency: 'hurricane' }]);
    expect(card.urgency).toBe('normal');
  });
});

describe('گاردِ پنجرهٔ گذار v1 → v2', () => {
  it('سطرِ v1 (listing_type/owner_*) هرگز کارت نمی‌شود', () => {
    const v1 = {
      slug: 'دستگاه-پیکور',
      title: 'دستگاه پیکور',
      listing_type: 'need_help',
      owner_full_name_snapshot: 'پیامبر مهربانی',
      cover_image: '/media/old.jpg',
    };
    expect(isV2KindnessListing(v1 as never)).toBe(false);
    expect(mapKindnessListings([v1 as never])).toEqual([]);
  });

  it('آیتم ناقص (بدون slug/title) حذف می‌شود', () => {
    expect(
      mapKindnessListings([{ slug: '', title: '', excerpt: 'x' } as never, V2_ITEM]),
    ).toHaveLength(1);
  });
});

describe('mapKindnessCategories — فقط دسته‌های v2 با شمارندهٔ زنده', () => {
  it('دستهٔ v1 (بدون open_listings_count) کنار گذاشته می‌شود', () => {
    const cats = mapKindnessCategories([
      { slug: 'old', title: 'کهنه' } as never,
      { slug: 'poushak', title: 'پوشاک', icon: ' 🧥 ', open_listings_count: 4 } as never,
    ]);
    expect(cats).toEqual([{ slug: 'poushak', title: 'پوشاک', icon: '🧥', count: 4 }]);
  });
});

describe('mapKindnessStats — همه‌شش‌کلید یا هیچ‌کدام', () => {
  it('آمار کامل به مدل صفحه نگاشت می‌شود', () => {
    const stats = mapKindnessStats({
      open_listings: 12,
      urgent_listings: 3,
      fulfilled_total: 40,
      fulfilled_30d: 5,
      volunteers_total: 23,
      active_categories: 4,
    });
    expect(stats).toEqual({
      openListings: 12,
      urgentListings: 3,
      fulfilledTotal: 40,
      fulfilled30d: 5,
      volunteersTotal: 23,
      activeCategories: 4,
    });
  });

  it('پاسخ ناقص/کهنه (v1 یا 404) → null تا روبان آمار پنهان بماند', () => {
    expect(mapKindnessStats(null)).toBeNull();
    expect(mapKindnessStats({})).toBeNull();
    expect(mapKindnessStats({ open_listings: 1 })).toBeNull();
  });
});

describe('نگاشتِ موقعیتِ جغرافیایی (دیتاستِ رسمی)', () => {
  it('locality و is_nationwide به مدلِ کارت منتقل می‌شوند', async () => {
    const { mapKindnessListings } = await import('./home-data');
    const [row] = mapKindnessListings([
      {
        slug: 'a',
        title: 'نیاز',
        excerpt: 'توضیح',
        province: 'تهران',
        city: 'ورامین',
        locality: 'قلعه‌نو',
        is_nationwide: false,
      },
    ]);
    expect(row.locality).toBe('قلعه‌نو');
    expect(row.isNationwide).toBe(false);
  });

  it('آگهیِ سراسری: is_nationwide=true و بدونِ استان/شهر', async () => {
    const { mapKindnessListings } = await import('./home-data');
    const [row] = mapKindnessListings([
      { slug: 'b', title: 'ویلچر', excerpt: 'توضیح', is_nationwide: true },
    ]);
    expect(row.isNationwide).toBe(true);
    expect(row.province).toBeUndefined();
    expect(row.city).toBeUndefined();
  });
});
