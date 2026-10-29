import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

/**
 * KindnessSection (v2) — چرخهٔ کاملِ «نیاز را ببین → راه ارتباط را بردار»:
 *   روبان آمار، چیپ‌های دستهٔ ایموجی‌دار، تگل فوری‌ها، کارت نیاز، شیت
 *   تماسِ lazy از DETAIL (تنها جایی که کانال‌ها را می‌دهد) + کپی/لینک.
 */

vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: Record<string, unknown> & { fill?: boolean }) => {
    const { fill: _fill, ...rest } = props;
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...rest} alt={(rest.alt as string) ?? ''} />;
  },
}));

vi.mock('@/lib/api', () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from '@/lib/api';
import {
  KindnessSection,
  type KindListing,
  type KindCategory,
  type KindStats,
} from './KindnessSection';

const apiFetchMock = vi.mocked(apiFetch);

const URGENT_ITEM: KindListing = {
  slug: 'یخچال-دوقلو',
  title: 'یخچال دوقلو سالم',
  excerpt: 'برای خانواده‌ای در شوش؛ کار می‌کند، فقط کمی کهنه است.',
  categoryTitle: 'لوازم آشپزخانه',
  categorySlug: 'ashpazkhane',
  categoryIcon: '🍳',
  urgency: 'urgent',
  isFeatured: false,
  quantity: 2,
  unit: 'دستگاه',
  province: 'تهران',
  city: 'شوش',
  viewCount: 143,
  openOffersCount: 3,
  daysLeft: 5,
};

const CALM_ITEM: KindListing = {
  slug: 'لباس-زمستانی',
  title: 'لباس زمستانی بچگانه',
  excerpt: 'سایز ۶ تا ۱۰ سال.',
  categoryTitle: 'پوشاک',
  categorySlug: 'poushak',
  categoryIcon: '🧥',
  urgency: 'normal',
  isFeatured: false,
  quantity: 20,
  unit: 'عدد',
  province: 'اصفهان',
  city: 'نجف‌آباد',
  viewCount: 12,
  openOffersCount: 0,
  daysLeft: null,
};

const FEATURED_ITEM: KindListing = {
  ...CALM_ITEM,
  slug: 'ویلچر',
  title: 'ویلچر استاندارد',
  excerpt: 'برای سالمندی در بستر.',
  categoryTitle: 'تجهیزات پزشکی',
  categorySlug: 'teb',
  urgency: 'normal',
  isFeatured: true,
  viewCount: 0,
};

const CATEGORIES: KindCategory[] = [
  { slug: 'ashpazkhane', title: 'لوازم آشپزخانه', icon: '🍳', count: 1 },
  { slug: 'poushak', title: 'پوشاک', icon: '🧥', count: 1 },
  { slug: 'teb', title: 'تجهیزات پزشکی', icon: '🩺', count: 1 },
];

const STATS: KindStats = {
  openListings: 12,
  urgentListings: 3,
  fulfilledTotal: 40,
  fulfilled30d: 5,
  volunteersTotal: 23,
  activeCategories: 3,
};

const DETAIL = {
  beneficiary_name: 'خانواده‌ای در شوش',
  contact_note: 'تماس ۱۰ تا ۲۰ — پیامکی بهتر است.',
  contact_channels: [
    { kind: 'phone', label: 'شماره تماس', value: '09123456789', link: 'tel:+989123456789' },
    { kind: 'telegram', label: 'آیدی تلگرام', value: '@kind_user', link: 'https://t.me/kind_user' },
    { kind: 'bale', label: 'آیدی بله', value: 'kind_bale', link: '' },
  ],
  images: [],
};

function renderSection(
  overrides: Partial<{
    listings: KindListing[];
    categories: KindCategory[];
    stats: KindStats | null;
  }> = {},
) {
  return render(
    <KindnessSection
      listings={overrides.listings ?? [URGENT_ITEM, CALM_ITEM, FEATURED_ITEM]}
      categories={overrides.categories ?? CATEGORIES}
      stats={overrides.stats === undefined ? STATS : overrides.stats}
    />,
  );
}

describe('KindnessSection — تختهٔ نیاز v2', () => {
  beforeEach(() => {
    apiFetchMock.mockResolvedValue(DETAIL);
  });
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('روبان آمار زنده را با اعداد فارسی نشان می‌دهد', () => {
    renderSection();
    const ribbon = screen.getByTestId('kw-stats-ribbon');
    expect(ribbon.textContent).toContain('۱۲');
    expect(ribbon.textContent).toContain('نیازِ جاری روی دیوار');
    expect(ribbon.textContent).toContain('۳');
    expect(ribbon.textContent).toContain('برطرف‌شده در ۳۰ روز');
    expect(ribbon.textContent).toContain('۲۳');
  });

  it('بدون آمار معتبر (پنجرهٔ گذار)، روبان پنهان می‌ماند — نه صفرهای دروغین', () => {
    renderSection({ stats: null });
    expect(screen.queryByTestId('kw-stats-ribbon')).toBeNull();
  });

  it('کارت‌‌ها بج فوری/ویژه + مقدار + چیپ دستهٔ ایموجی‌دار + اثبات اجتماعی دارند', () => {
    renderSection();
    expect(screen.getByText('فوری')).toBeTruthy();
    expect(screen.getByText('ویژه')).toBeTruthy();
    expect(screen.getByText('۲ دستگاه')).toBeTruthy();
    expect(screen.getByText('۵ روز مانده')).toBeTruthy();
    expect(screen.getByText('۳ نفر آماده‌ی کمک‌اند')).toBeTruthy();
    // چیپ دسته هم روی کارت است هم روی نوار فیلترها — حداقل یکی روی کارت باشد
    expect(screen.getAllByText('لوازم آشپزخانه').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('🍳').length).toBeGreaterThan(0);
  });

  it('تب «فوری‌ها» فقط کارت‌های اورژانسی را نگه می‌دارد', async () => {
    renderSection();
    fireEvent.click(screen.getByRole('tab', { name: /فوری‌ها/ }));
    // AnimatePresence exit: کارت‌های قبلی تا پایان انیمیشن خروج می‌مانند
    await waitFor(() => expect(screen.queryByText('لباس زمستانی بچگانه')).toBeNull());
    await waitFor(() => expect(screen.queryByText('ویلچر استاندارد')).toBeNull());
    expect(screen.queryByText('یخچال دوقلو سالم')).toBeTruthy();
  });

  it('تب دسته فقط همان دسته را نشان می‌دهد و با «همه» برمی‌گردد', async () => {
    renderSection();
    fireEvent.click(screen.getByRole('tab', { name: /پوشاک/ }));
    await waitFor(() => expect(screen.queryByText('یخچال دوقلو سالم')).toBeNull());
    expect(screen.queryByText('لباس زمستانی بچگانه')).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: /همه/ }));
    await screen.findByText('یخچال دوقلو سالم');
  });

  it('پیجر با آرایهٔ ۴تایی دو صفحه می‌سازد و چرخه می‌کند', async () => {
    renderSection({
      listings: [
        URGENT_ITEM,
        CALM_ITEM,
        FEATURED_ITEM,
        { ...URGENT_ITEM, slug: 'تی‌وی', title: 'تلویزیون' },
      ],
    });
    fireEvent.click(screen.getByRole('button', { name: 'بعدی' }));
    await screen.findByText('تلویزیون');
  });

  it('حالت خالی: کپی گذار («دارد شارژ می‌شود») وقتی هنوز آگهی نیست', () => {
    renderSection({ listings: [], stats: null });
    expect(screen.getByText('دیوار مهربانی دارد شارژ می‌شود')).toBeTruthy();
  });

  it('CTA «راه‌های ارتباط» شیت را باز و DETAIL را lazy می‌گیرد و کانال‌ها را نقش می‌دهد', async () => {
    renderSection();
    fireEvent.click(screen.getAllByRole('button', { name: /راه‌های ارتباط/ })[0]);

    await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy());
    await waitFor(() => expect(screen.getByTestId('kw-channel-phone')).toBeTruthy());

    expect(apiFetchMock).toHaveBeenCalledWith(
      `/kindness-wall/listings/${encodeURIComponent('یخچال-دوقلو')}/`,
      expect.objectContaining({ skipAuth: true }),
    );

    // لینک‌های آمادهٔ سرور + برچسب‌ها + زیرعنوان به‌نیاب + یادداشت هماهنگی
    const phoneLink = screen.getByRole('link', { name: /باز کردن شماره تماس/ });
    expect(phoneLink.getAttribute('href')).toBe('tel:+989123456789');
    const telegramLink = screen.getByRole('link', { name: /باز کردن آیدی تلگرام/ });
    expect(telegramLink.getAttribute('href')).toBe('https://t.me/kind_user');
    expect(telegramLink.getAttribute('rel')).toContain('noopener');
    expect(screen.getByText('به‌نیاب: خانواده‌ای در شوش')).toBeTruthy();
    expect(screen.getByText(/تماس ۱۰ تا ۲۰/)).toBeTruthy();
    // بله (بدون لینک عمومی) فقط کپی دارد
    expect(screen.queryByRole('link', { name: /باز کردن آیدی بله/ })).toBeNull();
  });

  it('بله — کپی می‌کند و بازخورد می‌دهد', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    renderSection();
    fireEvent.click(screen.getAllByRole('button', { name: /راه‌های ارتباط/ })[0]);
    await waitFor(() => screen.getByTestId('kw-channel-bale'));

    fireEvent.click(screen.getByRole('button', { name: 'کپی آیدی بله' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('kind_bale'));
  });

  it('خطای شبکه در DETAIL → پیام خطا + «تلاش دوباره» واقعاً دوباره می‌گیرد', async () => {
    apiFetchMock.mockRejectedValueOnce(new Error('network'));
    renderSection();
    fireEvent.click(screen.getAllByRole('button', { name: /راه‌های ارتباط/ })[0]);

    await waitFor(() => screen.getByText('راه‌های ارتباط دریافت نشد'));
    apiFetchMock.mockResolvedValueOnce(DETAIL);
    fireEvent.click(screen.getByRole('button', { name: 'تلاش دوباره' }));
    await waitFor(() => screen.getByTestId('kw-channel-phone'));
  });

  it('ریل دسته‌ها: tablist مرکزچین با تب «همه» (آیکن گرید خانواده) + ایموجی دسته‌ها', () => {
    renderSection();
    const rail = screen.getByTestId('kw-rail');
    expect(rail.getAttribute('role')).toBe('tablist');
    const allTab = screen.getByRole('tab', { name: /همه/ });
    expect(rail.contains(allTab)).toBe(true);
    expect(allTab.querySelector('svg')).toBeTruthy(); // grid glyph
    // والدِ مرکزچین: همان الگوی w-fit mx-auto قرارگاه آموزشی تا صفحه هرگز اسکرول عرضی نگیرد
    expect(rail.parentElement?.parentElement?.className).toContain('mx-auto');
    expect(rail.parentElement?.parentElement?.className).toContain('w-fit');
  });

  it('دکمهٔ اشتراک‌گذاری با Web Share API لینک slug آینده را می‌فرستد', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });
    renderSection();
    fireEvent.click(screen.getAllByRole('button', { name: /اشتراک‌گذاری آگهی/ })[0]);
    await waitFor(() => expect(share).toHaveBeenCalled());
    const arg = share.mock.calls[0][0] as { url: string };
    expect(arg.url).toContain('/kindness-wall/');
    expect(decodeURIComponent(arg.url)).toContain('/kindness-wall/یخچال-دوقلو');
  });

  it('بدون Web Share API، لینک به کلیپ‌بورد می‌رود و بازخورد می‌دهد', async () => {
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    renderSection();
    const btn = screen.getAllByRole('button', { name: /اشتراک‌گذاری آگهی/ })[0];
    fireEvent.click(btn);
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(expect.stringContaining('/kindness-wall/یخچال-دوقلو')),
    );
    await waitFor(() => expect(btn.getAttribute('title')).toBe('لینک کپی شد'));
  });

  it('شیت تماس با portal روی body سوار می‌شود — جریان صفحه را نمی‌شکند', async () => {
    renderSection();
    fireEvent.click(screen.getAllByRole('button', { name: /راه‌های ارتباط/ })[0]);
    await waitFor(() => screen.getByRole('dialog'));
    const backdrop = screen.getByTestId('kw-contact-backdrop');
    expect(backdrop.parentElement).toBe(document.body);
    // داخل سکشنِ دیوار مهربانی نیست
    expect(document.getElementById('kindness')?.contains(backdrop)).toBe(false);
  });

  it('ESC شیت را می‌بندد', async () => {
    renderSection();
    fireEvent.click(screen.getAllByRole('button', { name: /راه‌های ارتباط/ })[0]);
    await waitFor(() => screen.getByRole('dialog'));
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});
