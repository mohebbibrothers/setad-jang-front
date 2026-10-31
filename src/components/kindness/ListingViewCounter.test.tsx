import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';

/**
 * ListingViewCounter — شمارندهٔ بازدیدِ زنده با beacon کلاینتی:
 *   • عددِ SSR بلافاصله دیده می‌شود (بدونِ پرش/خالی)؛
 *   • یک beacon در هر mount (و نه بیشتر) فرستاده می‌شود؛
 *   • عددِ تازه از سرور جایگزین می‌شود؛
 *   • خطای شبکه عدد را دست‌نخورده می‌گذارد.
 */

vi.mock('@/lib/api', () => {
  class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  }
  return { apiFetch: vi.fn(), isApiError: (e: unknown) => e instanceof ApiError, ApiError };
});

import { apiFetch } from '@/lib/api';
import { ListingViewCounter } from './ListingViewCounter';

const apiFetchMock = vi.mocked(apiFetch);

describe('ListingViewCounter', () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
    /* beaconed یک مجموعهٔ ماژول‌سطح است؛ با اسلاگِ یکتا هر تست ایزوله می‌ماند. */
    vi.resetModules();
  });
  afterEach(() => cleanup());

  it('عددِ اولیه (SSR) بلافاصله رندر می‌شود', () => {
    apiFetchMock.mockResolvedValue({ counted: true, view_count: 8 });
    render(<ListingViewCounter slug="a" initialCount={7} />);
    expect(screen.getByTestId('kw-view-count').textContent).toContain('۷');
  });

  it('یک beacon POST به مسیرِ view می‌فرستد و عددِ تازه را نشان می‌دهد', async () => {
    apiFetchMock.mockResolvedValue({ counted: true, view_count: 8 });
    render(<ListingViewCounter slug="b" initialCount={7} />);

    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1));
    const [path, init] = apiFetchMock.mock.calls[0];
    expect(String(path)).toContain('/kindness-wall/listings/');
    expect(String(path)).toContain('/view/');
    expect(init).toMatchObject({ method: 'POST' });

    await waitFor(() => expect(screen.getByTestId('kw-view-count').textContent).toContain('۸'));
  });

  it('با شمارش، نشانِ «+۱» ظاهر می‌شود', async () => {
    apiFetchMock.mockResolvedValue({ counted: true, view_count: 8 });
    render(<ListingViewCounter slug="c" initialCount={7} />);
    await waitFor(() => expect(screen.getByText('+۱')).toBeTruthy());
  });

  it('وقتی سرور شمارش نکرد (dedupe)، عدد و نشان تغییر نمی‌کند', async () => {
    apiFetchMock.mockResolvedValue({ counted: false, view_count: 7 });
    render(<ListingViewCounter slug="d" initialCount={7} />);
    await waitFor(() => expect(apiFetchMock).toHaveBeenCalled());
    expect(screen.queryByText('+۱')).toBeNull();
    expect(screen.getByTestId('kw-view-count').textContent).toContain('۷');
  });

  it('خطای شبکه عددِ اولیه را دست‌نخورده می‌گذارد (بی‌صدا)', async () => {
    apiFetchMock.mockRejectedValue(new TypeError('network'));
    render(<ListingViewCounter slug="e" initialCount={12} />);
    await waitFor(() => expect(apiFetchMock).toHaveBeenCalled());
    expect(screen.getByTestId('kw-view-count').textContent).toContain('۱۲');
  });

  it('withLabel برچسبِ «بازدید» را نشان می‌دهد', () => {
    apiFetchMock.mockResolvedValue(null);
    render(<ListingViewCounter slug="f" initialCount={3} withLabel />);
    expect(screen.getByTestId('kw-view-count').textContent).toContain('بازدید');
  });
});

describe('ListingViewCounter — مقاومت در برابر mount دوباره (StrictMode)', () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
    vi.resetModules();
  });
  afterEach(() => cleanup());

  it('با remount، beacon تکرار نمی‌شود ولی عددِ تازه اعمال می‌شود', async () => {
    const pending: { resolve: ((v: unknown) => void) | null } = { resolve: null };
    apiFetchMock.mockImplementation(
      () =>
        new Promise((res) => {
          pending.resolve = res;
        }),
    );
    const { ListingViewCounter: Fresh } = await import('./ListingViewCounter');
    const { unmount } = render(<Fresh slug="strict" initialCount={5} />);
    unmount(); // شبیه‌سازیِ unmount در StrictMode
    render(<Fresh slug="strict" initialCount={5} />);
    pending.resolve?.({ counted: true, view_count: 6 });

    await waitFor(() => expect(screen.getByText('۶')).toBeTruthy());
    /* فقط یک درخواست — promise بین mount‌ها مشترک است. */
    expect(apiFetchMock).toHaveBeenCalledTimes(1);
  });
});
