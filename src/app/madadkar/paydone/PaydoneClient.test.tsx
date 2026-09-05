import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import type { ReactNode } from 'react';

/**
 * PaydoneClient — قراردادِ «صورت‌جلسهٔ پرداخت»:
 *   • POST idempotent روی authority (نه اعتماد به پارامترِ result)؛
 *   • success → کارتِ رسید با ref_id/authority + لینکِ صفحهٔ حرکت؛
 *   • failed + hint=canceled → حالتِ «شما لغو کردید» (نه خطای فنی)؛
 *   • failed ساده → راهنمای برگشتِ وجه و تلاش مجدد؛
 *   • 404 → «تراکنش پیدا نشد»؛
 *   • pending → نامشخص و دکمهٔ بررسی مجدد.
 */

const mocks = vi.hoisted(() => ({
  apiFetch: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  apiFetch: (...args: unknown[]) => mocks.apiFetch(...args),
  safeApiFetch: () => Promise.resolve(null),
  ApiError: class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
    }
  },
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

import { PaydoneClient } from './PaydoneClient';

const SUCCESS_PAYLOAD = {
  is_verified: true,
  payment_status: 'success',
  payment_status_display: 'موفق',
  message: 'پرداخت با موفقیت تأیید شد.',
  participation: {
    id: 11,
    campaign: {
      id: 7,
      title: 'کمک به خانواده‌های مدافعان',
      slug: 'komak-khanevade-modafean',
      cover_image: null,
      sponsor: { id: 2, name: 'گروه جهادی', slug: 'j', logo: null },
      status: 'published',
      status_display: 'منتشرشده',
    },
    share_count: 4,
    share_price_snapshot: 1_000_000,
    total_amount: 4_000_000,
    status: 'paid',
    status_display: 'پرداخت‌شده',
    created_at: '2026-09-05T09:50:00Z',
    paid_at: '2026-09-05T10:00:00Z',
    payment: {
      id: 21,
      gateway_name: 'zarinpal',
      authority: 'A0001',
      ref_id: 'REF-777',
      amount: 4_000_000,
      status: 'success',
      status_display: 'موفق',
      paid_at: '2026-09-05T10:00:00Z',
      verified_at: '2026-09-05T10:00:05Z',
    },
  },
};

const FAILED_PAYLOAD = {
  ...SUCCESS_PAYLOAD,
  is_verified: false,
  payment_status: 'failed',
  payment_status_display: 'ناموفق',
  participation: {
    ...SUCCESS_PAYLOAD.participation,
    status: 'failed',
    status_display: 'ناموفق',
    paid_at: null,
    payment: {
      ...SUCCESS_PAYLOAD.participation.payment,
      ref_id: null,
      status: 'failed',
      paid_at: null,
    },
  },
};

beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
  mocks.apiFetch.mockResolvedValue(SUCCESS_PAYLOAD);
});

describe('success — صورت‌جلسهٔ کامل', () => {
  it('کارت رسید با ref_id، authority و لینکِ صفحهٔ حرکت رندر می‌شود', async () => {
    render(<PaydoneClient authority="A0001" resultParam="success" />);

    expect(await screen.findByText('پرداخت تأیید شد 🎉')).toBeTruthy();
    // هم شناسهٔ درگاه هم کد پیگیری
    expect(screen.getByText('REF-777')).toBeTruthy();
    expect(screen.getByText('A0001')).toBeTruthy();
    // لینکِ بازگشت به صفحهٔ حرکتِ درست
    const back = screen.getByRole('link', { name: 'بازگشت به صفحهٔ حرکت' });
    expect(back.getAttribute('href')).toBe('/madadkar/komak-khanevade-modafean');
    // verify با POST و authority رفت — نه GET
    const calls = mocks.apiFetch.mock.calls as [string, { method?: string }?][];
    expect(calls.some(([p, o]) => p === '/madadkar/payment/verify/' && o?.method === 'POST')).toBe(
      true,
    );
  });
});

describe('canceled — لغوی صادقانهٔ کاربر', () => {
  it('failed + hint=canceled → پیامِ «شما لغو کردید» نه خطای فنی', async () => {
    mocks.apiFetch.mockResolvedValue(FAILED_PAYLOAD);
    render(<PaydoneClient authority="A0001" resultParam="canceled" />);
    expect(await screen.findByText('پرداخت را لغو کردی')).toBeTruthy();
    expect(screen.getByText(/هیچ مبلغی کسر نشد/)).toBeTruthy();
  });
});

describe('failed — ناموفق فنی', () => {
  it('بدونِ hint، شکستِ بانکی با راهنمای برگشتِ وجه نمایش داده می‌شود', async () => {
    mocks.apiFetch.mockResolvedValue(FAILED_PAYLOAD);
    render(<PaydoneClient authority="A0001" resultParam="failed" />);
    expect(await screen.findByText('پرداخت تأیید نشد')).toBeTruthy();
    expect(screen.getByText(/خودکار برمی‌گردد/)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'تلاش مجدد برای پرداخت' })).toBeTruthy();
  });
});

describe('not_found — authority ناشناخته/غایب', () => {
  it('۴۰۴ → کارتِ «پیدا نشد»', async () => {
    const { ApiError } = await import('@/lib/api');
    mocks.apiFetch.mockRejectedValue(new ApiError('یافت نشد', 404));
    render(<PaydoneClient authority="A9" resultParam="error" />);
    expect(await screen.findByText('تراکنشی با این مشخصات پیدا نشد')).toBeTruthy();
  });

  it('بدونِ authority اصلاً verify صدا زده نمی‌شود', async () => {
    render(<PaydoneClient authority="" resultParam={null} />);
    expect(await screen.findByText('تراکنشی با این مشخصات پیدا نشد')).toBeTruthy();
    expect(mocks.apiFetch).not.toHaveBeenCalled();
  });
});

describe('pending — نامشخص با برنامهٔ بازیابی', () => {
  it('payment_status=pending → پیامِ نامشخص + دکمهٔ بررسی مجدد', async () => {
    mocks.apiFetch.mockResolvedValue({ ...FAILED_PAYLOAD, payment_status: 'pending' });
    render(<PaydoneClient authority="A0001" resultParam="pending" />);
    expect(await screen.findByText('وضعیتِ تراکنش هنوز نامشخص است')).toBeTruthy();
    const btn = screen.getByRole('button', { name: /بررسی مجددِ وضعیت/ });
    expect(btn).toBeTruthy();

    // ری‌ستِ تلاش‌ها + بررسیِ دستی دوباره کار می‌کند
    mocks.apiFetch.mockResolvedValue(SUCCESS_PAYLOAD);
    fireEvent.click(btn);
    expect(await screen.findByText('پرداخت تأیید شد 🎉')).toBeTruthy();
  });
});
