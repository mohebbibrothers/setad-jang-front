import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

/**
 * BountyPanel — قراردادِ «ثبت/افزایش جایزه»:
 *   • مهمان → پانلِ قفل + مودالِ ورود (بدون خروج از صفحه)؛
 *   • حداقلِ مبلغ = ۵۰٬۰۰۰ تومان (هم‌راستا با R4J_BOUNTY_MIN_TOMAN)؛
 *   • POST دقیق به /r4j/criminals/<id>/bounty/ با amount_tomanِ عددی؛
 *   • موفقیت → بنر + تازه‌سازیِ شمارنده‌ها از APIِ زنده؛
 *   • 403 (IsFullyVerifiedUser) → کارتِ راهنمای احراز هویت + لینکِ پروفایل.
 */

const mocks = vi.hoisted(() => ({
  apiFetch: vi.fn(),
  authState: {
    isAuthenticated: true,
    loading: false,
    user: { id: 7 } as Record<string, unknown> | null,
  },
}));

vi.mock('@/lib/api', () => ({
  apiFetch: (...args: unknown[]) => mocks.apiFetch(...args),
  safeApiFetch: () => Promise.resolve(null),
  isApiError: (e: unknown) => (e as { name?: string })?.name === 'ApiError',
  firstErrorMessage: (e: unknown) => (e as { message?: string })?.message ?? null,
}));

vi.mock('@/lib/use-auth', () => ({
  useAuth: () => mocks.authState,
}));

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

import { BountyPanel } from './BountyPanel';
import { BOUNTY_MIN_TOMAN } from '@/lib/r4j';

function bounty(over: Record<string, unknown> = {}) {
  return {
    id: 42,
    criminal_id: 5,
    criminal_name: 'Ahmad Vahidi',
    criminal_slug: 'ahmad-vahidi',
    amount_toman: 250_000,
    status: 'active',
    cancel_requested_at: null,
    canceled_at: null,
    created_at: '2026-08-01T10:00:00Z',
    updated_at: '2026-08-01T10:00:00Z',
    ...over,
  };
}

/** پاسخ‌دهنده‌ی استاندارد برای APIهای پنلِ جایزه */
function answerApi(
  opts: {
    existing?: unknown | null;
    postError?: unknown;
    liveTotal?: number;
    liveCount?: number;
  } = {},
) {
  mocks.apiFetch.mockImplementation((url: string, init?: { method?: string; body?: unknown }) => {
    const u = String(url);
    if (u.includes('/r4j/me/bounties/')) {
      if (init?.method === 'POST') {
        // درخواستِ لغو
        return Promise.resolve(bounty({ status: 'cancel_requested' }));
      }
      return Promise.resolve({
        count: opts.existing ? 1 : 0,
        next: null,
        previous: null,
        results: opts.existing ? [opts.existing] : [],
      });
    }
    if (u.includes('/r4j/criminals/')) {
      if (init?.method === 'POST') {
        if (opts.postError) return Promise.reject(opts.postError);
        return Promise.resolve(
          bounty({ amount_toman: JSON.parse(String(init.body)).amount_toman }),
        );
      }
      // جزئیاتِ زنده‌ی عمومی برای تازه‌سازیِ شمارنده‌ها
      return Promise.resolve({
        total_bounty_toman: opts.liveTotal ?? 100_000,
        bounties_count: opts.liveCount ?? 2,
      });
    }
    return Promise.reject(new Error(`unexpected ${u}`));
  });
}

const PANEL = (
  <BountyPanel
    criminalId={5}
    slug="ahmad-vahidi"
    name="Ahmad Vahidi"
    initialTotal={100_000}
    initialCount={2}
  />
);

beforeEach(() => {
  cleanup();
  mocks.authState.isAuthenticated = true;
  mocks.authState.loading = false;
});

describe('BountyPanel — وضعیتِ مهمان', () => {
  it('کاربرِ مهمان پانلِ قفل می‌بیند و مودالِ ورود با کلیک باز می‌شود', () => {
    mocks.authState.isAuthenticated = false;
    render(PANEL);
    expect(screen.getByText('برای ثبت جایزه وارد شوید')).toBeDefined();
    expect(screen.queryByRole('textbox')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /ورود \/ ثبت‌نام/ }));
    expect(screen.getByTestId('auth-modal')).toBeDefined();
  });
});

describe('BountyPanel — اعتبارسنجیِ مبلغ', () => {
  it('مبلغِ کمتر از حداقل، دکمه را غیرفعال و خطا را پس از blur نشان می‌دهد', async () => {
    answerApi();
    render(PANEL);
    const input = await screen.findByRole('textbox');
    fireEvent.change(input, { target: { value: '10,000' } });
    fireEvent.blur(input);
    expect(screen.getByRole('alert').textContent).toContain('حداقل مبلغِ جایزه');
    expect(screen.getByRole('button', { name: 'ثبت تعهدِ جایزه' })).toHaveProperty(
      'disabled',
      true,
    );
    expect(BOUNTY_MIN_TOMAN).toBe(50_000);
  });

  it('مبلغِ معتبر با ارقامِ فارسی هم پذیرفته می‌شود', async () => {
    answerApi();
    render(PANEL);
    const input = await screen.findByRole('textbox');
    fireEvent.change(input, { target: { value: '۵۰٬۰۰۰' } });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'ثبت تعهدِ جایزه' })).toHaveProperty(
        'disabled',
        false,
      );
    });
  });
});

describe('BountyPanel — ثبت موفق', () => {
  it('POST دقیق + بنرِ موفقیت + شمارنده‌های تازه‌شده', async () => {
    answerApi({ liveTotal: 350_000, liveCount: 3 });
    render(PANEL);
    const input = await screen.findByRole('textbox');
    fireEvent.change(input, { target: { value: '250,000' } });
    fireEvent.click(screen.getByRole('button', { name: 'ثبت تعهدِ جایزه' }));

    await waitFor(() => expect(screen.getByText('تعهدِ جایزهٔ شما ثبت شد')).toBeDefined());

    const postCall = mocks.apiFetch.mock.calls.find(
      (c) => String(c[0]).includes('/bounty/') && (c[1] as { method?: string })?.method === 'POST',
    );
    expect(postCall).toBeDefined();
    expect(String(postCall![0])).toContain('/r4j/criminals/5/bounty/');
    expect(JSON.parse(String((postCall![1] as { body: unknown }).body))).toEqual({
      amount_toman: 250_000,
    });
    // شمارنده‌های تازه از APIِ زنده (هم در بنرِ موفقیت، هم در کارتِ وضعیت)
    expect(screen.getAllByText('۳۵۰٬۰۰۰ تومان').length).toBeGreaterThanOrEqual(1);
  });
});

describe('BountyPanel — دروازه‌ی احراز هویت (403)', () => {
  it('پیامِ مرحله‌ایِ بک‌اند + کارتِ راهنما + لینکِ پروفایل', async () => {
    const forbidden = {
      name: 'ApiError',
      status: 403,
      message: 'برای این عملیات باید ابتدا شماره موبایل خود را تأیید کنید.',
    };
    answerApi({ postError: forbidden });
    render(PANEL);
    const input = await screen.findByRole('textbox');
    fireEvent.change(input, { target: { value: '100000' } });
    fireEvent.click(screen.getByRole('button', { name: 'ثبت تعهدِ جایزه' }));

    await waitFor(() => expect(screen.getByText('احراز هویتِ کامل لازم است')).toBeDefined());
    expect(screen.getByRole('alert').textContent ?? '').not.toBe('');
    expect(screen.getByText(/شماره موبایل خود را تأیید کنید/)).toBeDefined();
    const link = screen.getByRole('link', { name: /تکمیل احراز هویت در پروفایل/ });
    expect(link.getAttribute('href')).toBe('/profile');
  });
});

describe('BountyPanel — تعهدِ موجود', () => {
  it('تعهدِ فعلیِ کاربر پرمی‌شود، دکمه «به‌روزرسانی» و مسیرِ لغو دارد', async () => {
    answerApi({ existing: bounty() });
    render(PANEL);
    // تعهدِ موجود نمایش داده می‌شود
    const chip = await screen.findByText('تعهدِ فعلیِ شما روی این پرونده');
    expect(chip).toBeDefined();
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('250,000');
    expect(screen.getByRole('button', { name: 'به‌روزرسانی تعهدِ جایزه' })).toBeDefined();

    // درخواستِ لغو
    fireEvent.click(screen.getByRole('button', { name: 'درخواست لغوی تعهد' }));
    await waitFor(() => expect(screen.getByText('درخواست لغو در انتظار تأیید')).toBeDefined());
    const cancelCall = mocks.apiFetch.mock.calls.find(
      (c) =>
        String(c[0]).includes('/r4j/me/bounties/42/cancel/') &&
        (c[1] as { method?: string })?.method === 'POST',
    );
    expect(cancelCall).toBeDefined();
  });
});
