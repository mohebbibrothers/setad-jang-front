import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

/**
 * ListingOfferBox — ماتریسِ کاملِ حالت‌های اعلام آمادگی:
 *   مهمان → مودالِ ورود، واردشده → فرم، ثبت‌شده → کارتِ وضعیت/ویرایش/پس‌گرفتن،
 *   بررسی‌شده → قفل، خطا → پیامِ انسانی.
 */

const authState = { isAuthenticated: false, loading: false };
vi.mock('@/lib/use-auth', () => ({
  useAuth: () => authState,
}));

vi.mock('@/components/auth/AuthModal', () => ({
  AuthModal: ({ open }: { open: boolean }) =>
    open ? <div role="dialog" aria-label="ورود یا ثبت‌نام" /> : null,
}));

const apiFetchMock = vi.fn();
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
    apiFetch: (...args: unknown[]) => apiFetchMock(...args),
    isApiError: (e: unknown): boolean => e instanceof ApiError,
    ApiError,
  };
});

import { ListingOfferBox } from './ListingOfferBox';

describe('ListingOfferBox', () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
    authState.isAuthenticated = false;
    authState.loading = false;
  });
  afterEach(() => {
    cleanup();
  });

  it('مهمان: دکمهٔ ورود می‌بیند و مودال باز می‌شود (بدونِ بن‌بست)', async () => {
    render(<ListingOfferBox slug="x" listingTitle="نیاز" />);
    const btn = await screen.findByRole('button', { name: /ورود و ثبتِ اعلام آمادگی/ });
    fireEvent.click(btn);
    expect(await screen.findByRole('dialog', { name: 'ورود یا ثبت‌نام' })).toBeTruthy();
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('واردشده بدونِ اعلام: فرم با شمارندهٔ نویسه', async () => {
    authState.isAuthenticated = true;
    apiFetchMock.mockResolvedValue({ count: 0, results: [] });
    render(<ListingOfferBox slug="x" listingTitle="نیاز" />);
    const box = await screen.findByLabelText(/پیامِ اختیاری/);
    fireEvent.change(box, { target: { value: 'سلام' } });
    expect(screen.getByText('۴/۵۰۰')).toBeTruthy();
    expect(screen.getByRole('button', { name: /ثبتِ اعلام آمادگی/ })).toBeTruthy();
  });

  it('ثبتِ اعلام: POST می‌رود و کارتِ وضعیت «ثبت شد» جای فرم می‌آید', async () => {
    authState.isAuthenticated = true;
    apiFetchMock
      .mockResolvedValueOnce({ count: 0, results: [] }) // my-offers
      .mockResolvedValueOnce({ id: 3, listing_slug: 'x', status: 'new', message: 'پتو دارم' });
    render(<ListingOfferBox slug="x" listingTitle="نیاز" />);
    const box = await screen.findByLabelText(/پیامِ اختیاری/);
    fireEvent.change(box, { target: { value: 'پتو دارم' } });
    fireEvent.click(screen.getByRole('button', { name: /ثبتِ اعلام آمادگی/ }));

    await waitFor(() => expect(screen.getByText('ثبت شد — در صف بررسی')).toBeTruthy());
    const [path, init] = apiFetchMock.mock.calls[1];
    expect(String(path)).toContain('/offer/');
    expect(init).toMatchObject({ method: 'POST' });
    expect(screen.getByText('اعلامِ آمادگیِ تو ثبت شد — ممنون که هستی.')).toBeTruthy();
    expect(screen.getByRole('button', { name: /ویرایشِ پیام/ })).toBeTruthy();
  });

  it('اعلامِ ثبت‌شده: پس‌گرفتن با DELETE و بازگشت به فرم', async () => {
    authState.isAuthenticated = true;
    apiFetchMock
      .mockResolvedValueOnce({
        count: 1,
        results: [{ id: 11, listing_slug: 'x', message: 'قدیمی', status: 'new' }],
      })
      .mockResolvedValueOnce(null);
    render(<ListingOfferBox slug="x" listingTitle="نیاز" />);
    await screen.findByText('ثبت شد — در صف بررسی');
    fireEvent.click(screen.getByRole('button', { name: /پس‌گرفتن/ }));
    await waitFor(() =>
      expect(apiFetchMock).toHaveBeenLastCalledWith('/kindness-wall/offers/11/withdraw/', {
        method: 'DELETE',
      }),
    );
    expect(await screen.findByLabelText(/پیامِ اختیاری/)).toBeTruthy();
  });

  it('وضعیتِ «تماس گرفته شد»: قفل است و دکمهٔ ویرایش ندارد', async () => {
    authState.isAuthenticated = true;
    apiFetchMock.mockResolvedValue({
      count: 1,
      results: [{ id: 5, listing_slug: 'x', message: '', status: 'contacted' }],
    });
    render(<ListingOfferBox slug="x" listingTitle="نیاز" />);
    expect(await screen.findByText('تماس گرفته شد')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /ویرایشِ پیام/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /پس‌گرفتن/ })).toBeNull();
  });

  it('وضعیتِ «رد شد» با لحنِ رز و دعوت به نیازهای دیگر', async () => {
    authState.isAuthenticated = true;
    apiFetchMock.mockResolvedValue({
      count: 1,
      results: [{ id: 6, listing_slug: 'x', message: '', status: 'declined' }],
    });
    render(<ListingOfferBox slug="x" listingTitle="نیاز" />);
    expect(await screen.findByText('این اعلام بسته شد')).toBeTruthy();
  });

  it('خطای شبکه: پیامِ انسانی نشان داده می‌شود و فرم می‌ماند', async () => {
    authState.isAuthenticated = true;
    apiFetchMock
      .mockResolvedValueOnce({ count: 0, results: [] })
      .mockRejectedValueOnce(new TypeError('network'));
    render(<ListingOfferBox slug="x" listingTitle="نیاز" />);
    await screen.findByLabelText(/پیامِ اختیاری/);
    fireEvent.click(screen.getByRole('button', { name: /ثبتِ اعلام آمادگی/ }));
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toContain('اتصال');
  });

  it('خطای ۴۰۱: مودالِ ورود باز می‌شود (نشستِ منقضی)', async () => {
    authState.isAuthenticated = true;
    const { ApiError } = await import('@/lib/api');
    apiFetchMock
      .mockResolvedValueOnce({ count: 0, results: [] })
      .mockRejectedValueOnce(new ApiError('unauth', 401));
    render(<ListingOfferBox slug="x" listingTitle="نیاز" />);
    await screen.findByLabelText(/پیامِ اختیاری/);
    fireEvent.click(screen.getByRole('button', { name: /ثبتِ اعلام آمادگی/ }));
    expect(await screen.findByRole('dialog', { name: 'ورود یا ثبت‌نام' })).toBeTruthy();
  });
});
