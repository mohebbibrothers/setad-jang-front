import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

/**
 * RevayatFeed — قراردادِ فیدِ اینستاگرام‌وار:
 *   • چهار نوع با تگ‌های قراردادی (ویدئو/تصویر/صوت/متن) رندر می‌شوند و
 *     «صوت همیشه می‌برد» — حتی با کاورِ ویدئویی؛
 *   • نویسنده با الگوی «شهر/کد (نام)» تفکیک می‌شود؛ شهر چیپِ فیلتر است؛
 *   • جست‌وجوی زنده debounce دارد و به API می‌رود؛
 *   • «روایت‌های بیشتر» صفحه‌ی بعد را می‌چسباند؛ نگهبانِ IO fallback دارد؛
 *   • خطای شبکه با «تلاش دوباره» بازیابی می‌شود.
 */

const replaceMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock }),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const apiFetchMock = vi.fn();
vi.mock('@/lib/api', () => ({
  apiFetch: (...args: unknown[]) => apiFetchMock(...args),
}));

import { RevayatFeed } from './RevayatFeed';
import type { FeedFilters, RevayatItem } from '@/lib/revayat';

/* ── داده‌ی نمونه: از هر نوع یک روایت ── */
const FILM: RevayatItem = {
  external_id: 'film-1',
  title: 'عملیات وعده‌ی صادق',
  description: 'گزارش تصویریِ عملیات',
  author_username: 'هرمزگان/ع۱ (بوستان پیرا)',
  origin: 'external',
  source_created_at: '2026-08-20T10:00:00Z',
  primary_media_type: 'video',
  attachments: [
    {
      id: 1,
      url: 'https://m.example.org/org/uploads/v/film.mp4',
      media_type: 'video',
      duration: 122,
    },
  ],
};
const PHOTO: RevayatItem = {
  external_id: 'img-1',
  title: 'تصویر روز',
  description: 'کپشنِ تصویر',
  author_username: 'تهران/کانال (صدای شهر)',
  source_created_at: '2026-08-21T10:00:00Z',
  attachments: [{ id: 2, url: 'https://m.example.org/org/uploads/i/pic.png', media_type: 'image' }],
};
const PODCAST: RevayatItem = {
  external_id: 'pod-1',
  title: 'قسمت چهارم',
  description: 'پادکست تحلیلی',
  author_username: 'شیراز/رادیو (روایت جنوب)',
  source_created_at: '2026-08-22T10:00:00Z',
  primary_media_type: 'video', // طبقه‌بندیِ غلطِ بالادست — باز هم باید صوت شود
  attachments: [
    { id: 3, url: 'https://m.example.org/org/uploads/v/cover.mp4', media_type: 'video' },
    {
      id: 4,
      url: 'https://m.example.org/org/uploads/a/ep4.mp3',
      media_type: 'audio',
      duration: 1850,
    },
  ],
};
const NOTE: RevayatItem = {
  external_id: 'note-1',
  title: 'یادداشت روز',
  description: 'متنِ کوتاهِ یک یادداشت تحلیلی برای تست.',
  author_username: 'تحلیلگر تبیین',
  source_created_at: '2026-08-23T10:00:00Z',
  attachments: [],
};

const FILM2: RevayatItem = { ...FILM, external_id: 'film-2', title: 'روایتِ صفحه‌ی دوم' };

const EMPTY_FILTERS: FeedFilters = { q: '', type: '', author: '' };

function page<T>(results: T[], next: string | null = null) {
  return { count: results.length, next, previous: null, results };
}

beforeAll(() => {
  if (typeof globalThis.IntersectionObserver === 'undefined') {
    class IO {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    globalThis.IntersectionObserver = IO as unknown as typeof IntersectionObserver;
  }
});

beforeEach(() => {
  apiFetchMock.mockReset();
  replaceMock.mockReset();
});

afterEach(cleanup);

describe('RevayatFeed', () => {
  it('چهار نوع با تگ‌های قراردادی — و «صوت همیشه می‌برد» حتی با کاورِ ویدئویی', () => {
    render(
      <RevayatFeed
        initialItems={[FILM, PHOTO, PODCAST, NOTE]}
        initialCount={4}
        initialHasNext={false}
        initialFilters={EMPTY_FILTERS}
      />,
    );
    // نام نویسنده هم در سربرگ‌ می‌آید هم در پیشوندِ کپشن (استایل اینستاگرام)
    expect(screen.getAllByText('بوستان پیرا').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('صدای شهر').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('روایت جنوب').length).toBeGreaterThanOrEqual(1);
    // پادکست: تگ «صوت» و پنلِ پادکست — نه ویدئو/سینما
    expect(screen.getAllByText('پادکست').length).toBeGreaterThanOrEqual(1);
    expect(document.querySelectorAll('video').length).toBe(1); // فقط FILM سینما دارد
    expect(document.querySelectorAll('audio').length).toBe(1);
    // تگ‌های ویدئو/تصویر/صوت/متن هر کدام دیده می‌شوند (در چیپ کارت یا تب فیلتر)
    expect(screen.getAllByText('ویدئو').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('تصویر').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('صوت').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('متن').length).toBeGreaterThanOrEqual(2);
  });

  it('جست‌وجوی زنده با debounce به API می‌رود و replace سینک می‌شود', async () => {
    apiFetchMock.mockResolvedValue(page([FILM2]));
    render(
      <RevayatFeed
        initialItems={[FILM]}
        initialCount={1}
        initialHasNext={false}
        initialFilters={EMPTY_FILTERS}
      />,
    );
    fireEvent.change(screen.getByLabelText('جست‌وجو در روایت‌ها'), {
      target: { value: 'ایران' },
    });
    await waitFor(() => expect(apiFetchMock).toHaveBeenCalled(), { timeout: 2000 });
    const url = decodeURIComponent(String(apiFetchMock.mock.calls[0]?.[0]));
    expect(url).toContain('search=ایران');
    await waitFor(() => expect(replaceMock).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText('روایتِ صفحه‌ی دوم')).toBeTruthy(), {
      timeout: 2000,
    });
  });

  it('چیپِ نوع، فیلترِ سرور می‌زند', async () => {
    apiFetchMock.mockResolvedValue(page([PODCAST]));
    render(
      <RevayatFeed
        initialItems={[FILM]}
        initialCount={1}
        initialHasNext={false}
        initialFilters={EMPTY_FILTERS}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'صوت' }));
    await waitFor(() => expect(apiFetchMock).toHaveBeenCalled(), { timeout: 2000 });
    expect(String(apiFetchMock.mock.calls[0]?.[0])).toContain('media_type=audio');
  });

  it('کلیک روی «شهر»، چیپِ فیلترِ فعال می‌سازد و قابلِ پاک‌کردن است', async () => {
    apiFetchMock.mockResolvedValue(page([FILM]));
    render(
      <RevayatFeed
        initialItems={[FILM]}
        initialCount={1}
        initialHasNext={false}
        initialFilters={EMPTY_FILTERS}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /هرمزگان/ }));
    await waitFor(() => expect(apiFetchMock).toHaveBeenCalled(), { timeout: 2000 });
    const url = decodeURIComponent(String(apiFetchMock.mock.calls[0]?.[0]));
    expect(url).toContain('author=هرمزگان');
    // چیپِ فعال با ضربدر → پاک می‌شود و دوباره واکشی
    fireEvent.click(screen.getByRole('button', { name: /حذف فیلتر/ }));
    await waitFor(() => expect(apiFetchMock.mock.calls.length).toBeGreaterThanOrEqual(2), {
      timeout: 2000,
    });
  });

  it('«روایت‌های بیشتر» صفحه‌ی دوم را می‌چسباند', async () => {
    apiFetchMock.mockResolvedValue(page([FILM2]));
    render(
      <RevayatFeed
        initialItems={[FILM]}
        initialCount={2}
        initialHasNext={true}
        initialFilters={EMPTY_FILTERS}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'روایت‌های بیشتر' }));
    await waitFor(() => expect(screen.getByText('روایتِ صفحه‌ی دوم')).toBeTruthy(), {
      timeout: 2000,
    });
    // قبلی‌ها هم سر جایشان
    expect(screen.getByText('عملیات وعده‌ی صادق')).toBeTruthy();
    expect(String(apiFetchMock.mock.calls[0]?.[0])).toContain('page=2');
  });

  it('نتیجه‌ی خالی → حالتِ خالی با «پاک‌کردن فیلترها»', () => {
    render(
      <RevayatFeed
        initialItems={[]}
        initialCount={0}
        initialHasNext={false}
        initialFilters={EMPTY_FILTERS}
      />,
    );
    expect(screen.getByText('روایتی پیدا نشد')).toBeTruthy();
    expect(screen.getByRole('button', { name: /پاک‌کردن فیلترها/ })).toBeTruthy();
  });

  it('خطای شبکه با «تلاش دوباره» بازیابی می‌شود', async () => {
    apiFetchMock.mockRejectedValueOnce(new Error('network down'));
    apiFetchMock.mockResolvedValue(page([FILM2]));
    render(
      <RevayatFeed
        initialItems={[]}
        initialCount={0}
        initialHasNext={false}
        initialFilters={EMPTY_FILTERS}
      />,
    );
    // یک تغییرِ فیلتر → واکشی شکست‌خورده
    fireEvent.click(screen.getByRole('button', { name: 'ویدئو' }));
    await waitFor(() => expect(screen.getByText('ارتباط برقرار نشد')).toBeTruthy(), {
      timeout: 2000,
    });
    fireEvent.click(screen.getByRole('button', { name: 'تلاش دوباره' }));
    await waitFor(() => expect(screen.getByText('روایتِ صفحه‌ی دوم')).toBeTruthy(), {
      timeout: 2000,
    });
  });
});
