import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

/**
 * ReportPanel — قراردادِ «گزارش اطلاعات»:
 *   • مهمان → پانلِ قفل + مودالِ ورود؛
 *   • قانونِ «حداقل یک مسیر» آینه‌ی validate() بک‌اند است؛
 *   • POST به /r4j/criminals/<id>/reports/ با FormData (لیست‌ها JSON string)؛
 *   • «گزارش‌های پیشینِ من» فیلترشده روی همین پرونده + لغوی pending.
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

import { ReportPanel } from './ReportPanel';

function myReport(over: Record<string, unknown> = {}) {
  return {
    id: 9,
    criminal_id: 5,
    criminal_name: 'Ahmad Vahidi',
    status: 'pending',
    notes: '',
    created_at: '2026-08-20T10:00:00Z',
    updated_at: '2026-08-20T10:00:00Z',
    ...over,
  };
}

function answerApi(opts: { reports?: unknown[]; postError?: unknown } = {}) {
  mocks.apiFetch.mockImplementation((url: string, init?: { method?: string; body?: unknown }) => {
    const u = String(url);
    if (u.includes('/r4j/me/reports/')) {
      if (init?.method === 'POST') {
        // مسیرِ لغو: /r4j/me/reports/<id>/cancel/
        return Promise.resolve(myReport({ status: 'cancel_requested' }));
      }
      return Promise.resolve({
        count: (opts.reports ?? []).length,
        next: null,
        previous: null,
        results: opts.reports ?? [],
      });
    }
    if (u.includes('/r4j/criminals/') && init?.method === 'POST') {
      if (opts.postError) return Promise.reject(opts.postError);
      return Promise.resolve(myReport({ id: 99 }));
    }
    return Promise.reject(new Error(`unexpected ${u}`));
  });
}

const PANEL = <ReportPanel criminalId={5} slug="ahmad-vahidi" name="Ahmad Vahidi" />;

async function renderAuthed() {
  render(PANEL);
  // فچِ گزارش‌های پیشین تمام شود
  await waitFor(() => expect(mocks.apiFetch).toHaveBeenCalled());
}

beforeEach(() => {
  cleanup();
  mocks.authState.isAuthenticated = true;
  mocks.authState.loading = false;
});

describe('ReportPanel — مهمان', () => {
  it('پانلِ قفل + مودالِ ورود بدون رندرِ فرم', () => {
    mocks.authState.isAuthenticated = false;
    render(PANEL);
    expect(screen.getByText('برای ارسال گزارش وارد شوید')).toBeDefined();
    expect(screen.queryByRole('textbox')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /ورود \/ ثبت‌نام/ }));
    expect(screen.getByTestId('auth-modal')).toBeDefined();
  });
});

describe('ReportPanel — قانونِ «حداقل یک مسیر»', () => {
  it('با فرمِ خالی دکمه غیرفعال است و راهنما دیده می‌شود', async () => {
    answerApi();
    await renderAuthed();
    const submit = screen.getByRole('button', { name: 'ثبت گزارش' }) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    expect(screen.getByText(/حداقل یکی از موارد/)).toBeDefined();
  });

  it('با یک یادداشت، ارسال فعال می‌شود', async () => {
    answerApi();
    await renderAuthed();
    fireEvent.change(screen.getByPlaceholderText('گزارش خود را این‌جا بنویسید…'), {
      target: { value: 'آخرین بار در وانِ ترکیه دیده شد' },
    });
    const submit = screen.getByRole('button', { name: 'ثبت گزارش' }) as HTMLButtonElement;
    expect(submit.disabled).toBe(false);
  });

  it('با یک «پیشنهادِ اصلاحِ فیلدِ پرشده» هم ارسال فعال می‌شود', async () => {
    answerApi();
    await renderAuthed();
    fireEvent.click(screen.getByRole('button', { name: /افزودن پیشنهادِ اصلاحِ فیلد/ }));
    fireEvent.change(screen.getByLabelText(/مقدار پیشنهادی/), {
      target: { value: 'تهران' },
    });
    const submit = screen.getByRole('button', { name: 'ثبت گزارش' }) as HTMLButtonElement;
    expect(submit.disabled).toBe(false);
  });
});

describe('ReportPanel — ارسال موفق', () => {
  it('POST با FormData: لیست‌ها JSON string + بنرِ موفقیت + پاک‌شدنِ فرم', async () => {
    answerApi();
    await renderAuthed();
    fireEvent.change(screen.getByPlaceholderText('گزارش خود را این‌جا بنویسید…'), {
      target: { value: 'سرنخ موثق' },
    });
    fireEvent.click(screen.getByRole('button', { name: /افزودن نام مستعار/ }));
    fireEvent.change(screen.getByLabelText('نام مستعار'), { target: { value: 'ابوعلی' } });
    fireEvent.click(screen.getByRole('button', { name: 'ثبت گزارش' }));

    await waitFor(() => expect(screen.getByText('گزارش شما ثبت شد')).toBeDefined());

    const postCall = mocks.apiFetch.mock.calls.find(
      (c) =>
        String(c[0]).includes('/r4j/criminals/5/reports/') &&
        (c[1] as { method?: string })?.method === 'POST',
    );
    expect(postCall).toBeDefined();
    const body = (postCall![1] as { body: FormData }).body;
    expect(body instanceof FormData).toBe(true);
    expect(body.get('notes')).toBe('سرنخ موثق');
    expect(JSON.parse(String(body.get('alias_suggestions')))).toEqual([{ alias: 'ابوعلی' }]);
    expect(JSON.parse(String(body.get('field_changes')))).toEqual([]);
  });

  it('خطای سرور (مثل ۴۲۹) به‌صورت پیامِ نمایشی در می‌آید', async () => {
    answerApi({
      postError: {
        name: 'ApiError',
        status: 429,
        message: 'تعداد درخواست‌ها بیش از حد مجاز است؛ کمی بعد تلاش کنید.',
      },
    });
    await renderAuthed();
    fireEvent.change(screen.getByPlaceholderText('گزارش خود را این‌جا بنویسید…'), {
      target: { value: 'سرنخ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'ثبت گزارش' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('بیش از حد مجاز'));
  });
});

describe('ReportPanel — گزارش‌های پیشینِ من', () => {
  it('فقط گزارش‌های همین پرونده می‌آیند و pending لغو دارد', async () => {
    answerApi({
      reports: [
        myReport({ id: 9, criminal_id: 5 }),
        myReport({ id: 11, criminal_id: 99, criminal_name: 'پرونده‌ی دیگر' }),
      ],
    });
    await renderAuthed();

    const mine = await screen.findByText('گزارش‌های پیشینِ شما برای این پرونده');
    expect(mine).toBeDefined();
    expect(screen.getByText('گزارشِ شمارهٔ ۹')).toBeDefined();
    expect(screen.queryByText('گزارشِ شمارهٔ ۱۱')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'درخواست لغو' }));
    await waitFor(() => expect(screen.getByText('درخواست لغو در انتظار تأیید')).toBeDefined());
    const cancelCall = mocks.apiFetch.mock.calls.find(
      (c) =>
        String(c[0]).includes('/r4j/me/reports/9/cancel/') &&
        (c[1] as { method?: string })?.method === 'POST',
    );
    expect(cancelCall).toBeDefined();
  });
});
