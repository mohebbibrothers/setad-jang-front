import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

/**
 * KindnessBoard — گرید تعاملی هاب: لنگرِ پایدار (#kw-{slug})، شیتِ
 * «راه‌های ارتباط» با fetchِ lazy از DETAIL (skipAuth) و آلبومِ پورتالی.
 * نکتهٔ خانهٔ تست: فقط مچرهای داخلیِ vitest (ستک پروژه jest-dom ندارد).
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
import { KindnessBoard } from './KindnessBoard';
import type { KindListing } from '@/components/home/KindnessSection';

const apiFetchMock = vi.mocked(apiFetch);

const ITEM_A: KindListing = {
  slug: 'یخچال-دوقلو',
  title: 'یخچال دوقلو سالم',
  excerpt: 'برای خانواده‌ای در شوش.',
  categoryTitle: 'لوازم آشپزخانه',
  categorySlug: 'ashpazkhane',
  categoryIcon: '🍳',
  urgency: 'urgent',
  isFeatured: false,
  quantity: 2,
  unit: 'دستگاه',
  province: 'تهران',
  city: 'شوش',
  viewCount: 40,
  openOffersCount: 1,
  daysLeft: 9,
};

const ITEM_B: KindListing = {
  slug: 'poshak',
  title: 'لباس زمستانی بچگانه',
  excerpt: 'سایز ۶ تا ۱۰ سال.',
  categoryTitle: 'پوشاک',
  categorySlug: 'poushak',
  urgency: 'normal',
  isFeatured: true,
  quantity: 20,
  unit: 'عدد',
  daysLeft: null,
};

describe('KindnessBoard', () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });
  afterEach(() => {
    cleanup();
  });

  it('هر کارت لنگرِ پایدار kw-{slug} دارد و گرید کامل رندر می‌شود', () => {
    render(<KindnessBoard listings={[ITEM_A, ITEM_B]} />);
    expect(screen.getByText('یخچال دوقلو سالم')).toBeTruthy();
    expect(screen.getByText('لباس زمستانی بچگانه')).toBeTruthy();
    expect(document.getElementById(`kw-${ITEM_A.slug}`)).not.toBeNull();
    expect(document.getElementById(`kw-${ITEM_B.slug}`)).not.toBeNull();
    expect(document.querySelector('[data-testid="kw-board-grid"]')).not.toBeNull();
  });

  it('«راه‌های ارتباط» شیت را باز می‌کند و DETAIL را lazy با slugِ encode و skipAuth می‌گیرد', async () => {
    apiFetchMock.mockResolvedValue({
      beneficiary_name: 'خانواده‌ای در شوش',
      contact_note: 'تماس ۱۰ تا ۲۰',
      /* کاربرِ مجاز: دروازه بسته تا کانال‌ها با لینکِ واقعی رندر شوند. */
      contact_gated: false,
      contact_channels: [
        { kind: 'phone', label: 'شماره تماس', value: '09120000000', link: 'tel:+989120000000' },
        { kind: 'telegram', label: 'آیدی تلگرام', value: 'besat', link: 'https://t.me/besat' },
        { kind: 'bale', label: 'آیدی بله', value: 'besat_bale', link: '' },
      ],
      images: [],
    });
    render(<KindnessBoard listings={[ITEM_A]} />);
    fireEvent.click(screen.getByRole('button', { name: /راه‌های ارتباط/ }));

    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1));
    expect(apiFetchMock).toHaveBeenCalledWith(
      `/kindness-wall/listings/${encodeURIComponent(ITEM_A.slug)}/`,
      expect.objectContaining({ skipAuth: true }),
    );

    /* کانال‌ها در شیت: لینکِ tel:/t.me قابل باز شدن + بله بدون لینک.
       توجه: لینک‌ها aria-label «باز کردن …» دارند پس با همان یافت می‌شوند. */
    expect(await screen.findByText('به‌نیاب: خانواده‌ای در شوش')).toBeTruthy();
    expect(screen.getByText('تماس ۱۰ تا ۲۰')).toBeTruthy();
    const tel = (await screen.findByRole('link', {
      name: /باز کردن شماره تماس/,
    })) as HTMLAnchorElement;
    expect(tel.getAttribute('href')).toBe('tel:+989120000000');
    const tg = screen.getByRole('link', { name: /باز کردن آیدی تلگرام/ }) as HTMLAnchorElement;
    expect(tg.getAttribute('href')).toBe('https://t.me/besat');
    expect(screen.getByText('besat_bale')).toBeTruthy();
  });

  it('خطای شبکه → پیام خطا + «تلاش دوباره» دوباره fetch می‌زند', async () => {
    apiFetchMock.mockRejectedValueOnce(new Error('network'));
    render(<KindnessBoard listings={[ITEM_A]} />);
    fireEvent.click(screen.getByRole('button', { name: /راه‌های ارتباط/ }));
    expect(await screen.findByText('راه‌های ارتباط دریافت نشد')).toBeTruthy();

    apiFetchMock.mockResolvedValueOnce({ contact_channels: [], images: [] });
    fireEvent.click(screen.getByRole('button', { name: 'تلاش دوباره' }));
    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(2));
  });

  it('ESC شیت را می‌بندد', async () => {
    apiFetchMock.mockResolvedValue({ contact_channels: [], images: [] });
    render(<KindnessBoard listings={[ITEM_A]} />);
    fireEvent.click(screen.getByRole('button', { name: /راه‌های ارتباط/ }));
    await screen.findByRole('dialog', { name: /راه‌های ارتباط یخچال دوقلو سالم/ });
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: /راه‌های ارتباط/ })).toBeNull(),
    );
  });

  it('کلیک روی کاور → آلبومِ پورتالی با عنوان آگهی باز می‌شود', async () => {
    apiFetchMock.mockResolvedValue({
      images: [
        { id: 1, image: '/media/kindness/a.jpg', alt_text: 'عکس یکم', is_cover: true, order: 0 },
      ],
      contact_channels: [],
    });
    render(<KindnessBoard listings={[ITEM_A]} />);
    fireEvent.click(screen.getByRole('button', { name: /نمایش آلبوم تصاویر/ }));
    expect(
      await screen.findByRole('dialog', { name: /گالری تصاویر — یخچال دوقلو سالم/ }),
    ).toBeTruthy();
  });
});

describe('KindnessBoard — نمایشِ آگهیِ سراسر کشور', () => {
  it('آگهیِ بدونِ استان، چیپِ «سراسر کشور» می‌گیرد (نه موقعیتِ خالی)', () => {
    render(
      <KindnessBoard
        listings={[
          {
            slug: 'nationwide',
            title: 'ویلچر سراسری',
            excerpt: 'در هر نقطه',
            urgency: 'normal',
            isFeatured: false,
            quantity: 1,
            unit: 'دستگاه',
            daysLeft: null,
            isNationwide: true,
          },
        ]}
      />,
    );
    expect(screen.getByText('سراسر کشور')).toBeTruthy();
  });

  it('آگهیِ نقطه‌ای، روستا/شهر/استان را نشان می‌دهد', () => {
    render(
      <KindnessBoard
        listings={[
          {
            slug: 'point',
            title: 'یخچال',
            excerpt: 'توضیح',
            urgency: 'normal',
            isFeatured: false,
            quantity: 1,
            unit: 'عدد',
            daysLeft: null,
            province: 'تهران',
            city: 'ورامین',
            locality: 'قلعه‌نو',
          },
        ]}
      />,
    );
    expect(screen.getByText('قلعه‌نو، ورامین، تهران')).toBeTruthy();
  });
});
