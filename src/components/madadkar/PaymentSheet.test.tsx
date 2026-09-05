import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

/**
 * PaymentSheet — قراردادِ فلویِ سه‌ایستگاهیِ پرداخت:
 *   • مهمان → CTAِ «ورود برای مشارکت» و AuthModal بالا می‌آید؛
 *   • کاربر: انتخاب سهم → بازبینی (صورتحساب share_count × share_price) →
 *     اتصال (POST initiate با بدنهٔ دقیق) → ایستگاهِ انتقال با کد پیگیری؛
 *   • ۴۰۰ «سهام ناکافی» → برگشت خودکار به ایستگاه انتخاب با اطلاعِ به‌روزرسانی؛
 *   • ۵۰۲ درگاه → پیامِ خطای دوستانه در همان ایستگاهِ بازبینی.
 */

const mocks = vi.hoisted(() => {
  class MockApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
    }
  }
  return {
    apiFetch: vi.fn(),
    MockApiError,
    authState: {
      isAuthenticated: true,
      loading: false,
      user: { id: 3 } as Record<string, unknown> | null,
    },
  };
});

vi.mock('@/lib/api', () => ({
  apiFetch: (...args: unknown[]) => mocks.apiFetch(...args),
  safeApiFetch: () => Promise.resolve(null),
  ApiError: mocks.MockApiError,
  isApiError: (e: unknown) => (e as { name?: string })?.name === 'ApiError',
  firstErrorMessage: (e: unknown) => (e as { message?: string })?.message ?? null,
}));

vi.mock('@/lib/use-auth', () => ({ useAuth: () => mocks.authState }));

vi.mock('@/components/auth/AuthModal', () => ({
  AuthModal: ({ open }: { open: boolean }) =>
    open ? <div data-testid="auth-modal">ورود</div> : null,
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock('@/components/ui/SmartImage', () => ({
  SmartImage: () => <span data-testid="smart-image" />,
}));

import { PaymentSheet, type PaymentSheetCampaign } from './PaymentSheet';

const campaign: PaymentSheetCampaign = {
  slug: 'komak-khanevade-modafean',
  title: 'کمک به خانواده‌های مدافعان',
  sponsor: 'گروه جهادی نمونه',
  totalAmount: 100_000_000,
  sharePrice: 1_000_000,
  sharesTotal: 100,
  sharesRemaining: 40,
  progressPercent: 60,
  coverUrl: 'https://cdn.example.com/c.jpg',
};

const DETAIL = {
  id: 7,
  title: campaign.title,
  slug: campaign.slug,
  remaining_shares: 40,
  share_price: 1_000_000,
  progress_percent: 60,
};

function apiImpl(over?: { participate?: () => Promise<unknown> }) {
  return vi.fn((path: string, opts?: { method?: string }) => {
    if (opts?.method === 'POST' && path.includes('/participate/')) {
      return over?.participate
        ? over.participate()
        : Promise.resolve({
            gateway_url: 'https://gateway.example.com/pg/StartPay/A0001',
            authority: 'A0001',
            participation: { id: 11 },
          });
    }
    if (opts?.method === 'POST' && path === '/madadkar/payment/verify/') {
      return Promise.resolve({
        is_verified: true,
        payment_status: 'success',
        payment_status_display: 'موفق',
        message: '',
        participation: {
          id: 11,
          paid_at: '2026-09-05T10:00:00Z',
          payment: { ref_id: 'R123', authority: 'A0001', gateway_name: 'zarinpal' },
        },
      });
    }
    return Promise.resolve(DETAIL);
  });
}

beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
  mocks.authState.isAuthenticated = true;
  mocks.authState.loading = false;
  mocks.apiFetch.mockImplementation(apiImpl());
  window.sessionStorage?.clear?.();
});

describe('گیتِ مهمان', () => {
  it('مهمان CTAِ ورود می‌بیند و با کلیک AuthModal باز می‌شود', async () => {
    mocks.authState.isAuthenticated = false;
    render(<PaymentSheet open onClose={() => {}} campaign={campaign} />);
    fireEvent.click(await screen.findByRole('button', { name: /ورود برای مشارکت/ }));
    expect(await screen.findByTestId('auth-modal')).toBeTruthy();
  });
});

describe('فلویِ کامل: انتخاب → بازبینی → انتقال', () => {
  it('share_count بدنهٔ POST را تشکیل می‌دهد و ایستگاه انتقال با authority نمایش داده می‌شود', async () => {
    render(<PaymentSheet open onClose={() => {}} campaign={campaign} />);

    const continueBtn = await screen.findByRole('button', { name: /ادامه/ });
    const plus = screen.getByRole('button', { name: 'تغییر تعداد سهم +۱' });
    fireEvent.click(plus);
    fireEvent.click(plus);
    fireEvent.click(plus);
    fireEvent.click(continueBtn);

    expect(await screen.findByText('صورتحساب مشارکت')).toBeTruthy();
    expect(screen.getByText('۴ سهم')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /اتصال امن به درگاه/ }));

    await waitFor(() => {
      const calls = mocks.apiFetch.mock.calls as [string, { body?: string; method?: string }?][];
      const post = calls.find(([p, o]) => p.includes('/participate/') && o?.method === 'POST');
      expect(post).toBeTruthy();
      expect(JSON.parse(post![1]!.body!)).toEqual({ share_count: 4 });
    });

    expect(await screen.findByRole('button', { name: /بررسی وضعیت پرداخت/ })).toBeTruthy();
    const chips = screen.getAllByTitle('کپی');
    expect(chips.some((c) => c.textContent?.includes('A0001'))).toBe(true);
  });

  it('۴۰۰ سهام ناکافی → برگشت به ایستگاه انتخاب با اطلاع‌رسانی به‌روزرسانی', async () => {
    mocks.apiFetch.mockImplementation(
      apiImpl({
        participate: () =>
          Promise.reject(
            new mocks.MockApiError('سهام باقی‌مانده کمتر از تعداد درخواستی است.', 400),
          ),
      }),
    );

    render(<PaymentSheet open onClose={() => {}} campaign={campaign} />);
    fireEvent.click(await screen.findByRole('button', { name: /ادامه/ }));
    fireEvent.click(await screen.findByRole('button', { name: /اتصال امن به درگاه/ }));

    expect(
      await screen.findByText(/موجودی به‌روزرسانی شد؛ برخی سهم‌ها لحظاتی پیش رزرو شدند/),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: /ادامه/ })).toBeTruthy();
  });

  it('۵۰۲ درگاه → پیامِ خطای دوستانه در ایستگاه بازبینی', async () => {
    mocks.apiFetch.mockImplementation(
      apiImpl({
        participate: () =>
          Promise.reject(
            new mocks.MockApiError('خطا در ارتباط با درگاه پرداخت. لطفاً دوباره تلاش کنید.', 502),
          ),
      }),
    );

    render(<PaymentSheet open onClose={() => {}} campaign={campaign} />);
    fireEvent.click(await screen.findByRole('button', { name: /ادامه/ }));
    fireEvent.click(await screen.findByRole('button', { name: /اتصال امن به درگاه/ }));

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('درگاه');
  });
});
