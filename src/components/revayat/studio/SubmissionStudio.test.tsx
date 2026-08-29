import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

/**
 * SubmissionStudio — قراردادِ استودیوی روایت:
 *   • مهمان → پانلِ قفل + مودالِ ورود (بدون خروج از صفحه)؛
 *   • کاربر → فرم + پیش‌نمایش + «روایت‌های من» در یک بلندیِ رندر؛
 *   • بوش‌گرِ خودکارِ نوع؛ سقفِ ۵ پیوست (قانونِ سرور)؛
 *   • پِلودِ POST دقیقاً به شکلِ UserTabyinSubmissionCreateSerializer؛
 *   • خطاهای بک‌اند به فیلدها مپ می‌شوند؛ موفقیت → کد پیگیری + پاک‌شدنِ پیش‌نویس.
 */

const mocks = vi.hoisted(() => ({
  apiFetch: vi.fn(),
  authState: {
    isAuthenticated: true,
    loading: false,
    user: {
      id: 7,
      full_name: 'کاربر آزمایشی',
      primary_identifier: '09121234567',
    } as Record<string, unknown> | null,
  },
}));

vi.mock('@/lib/api', () => ({
  apiFetch: (...args: unknown[]) => mocks.apiFetch(...args),
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

import { SubmissionStudio } from './SubmissionStudio';

const DRAFT_KEY = 'besat.tabyin.studio.v1';

function submissionsPage(items: unknown[] = []) {
  return { count: items.length, next: null, previous: null, results: items };
}

/** پاسخ‌دهنده‌ی استاندارد: GET روایت‌های من → لیست؛ POST → موفقیت */
function answerApi(submissions: unknown[] = [], created?: unknown) {
  mocks.apiFetch.mockImplementation((url: string, init?: { method?: string }) => {
    if (String(url).includes('/me/submissions/') && init?.method !== 'POST') {
      return Promise.resolve(submissionsPage(submissions));
    }
    if (init?.method === 'POST') return Promise.resolve(created);
    return Promise.reject(new Error(`unexpected ${url}`));
  });
}

const CREATED = {
  id: 41,
  external_id: 'local-aaaa1111',
  title: 'روایتِ من',
  submission_status: 'pending_review',
  created_at: '2026-08-29T08:00:00Z',
};

beforeEach(() => {
  mocks.apiFetch.mockReset();
  mocks.authState.isAuthenticated = true;
  mocks.authState.loading = false;
  mocks.authState.user = {
    id: 7,
    full_name: 'کاربر آزمایشی',
    primary_identifier: '09121234567',
  };
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('SubmissionStudio', () => {
  it('مهمان → پانلِ قفل و بازشدنِ مودالِ ورود در همان صفحه', async () => {
    mocks.authState.isAuthenticated = false;
    render(<SubmissionStudio />);
    expect(screen.getByText('برای روایت‌گویی، وارد شو')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /ورود یا ساخت حساب/ }));
    await waitFor(() => expect(screen.getByTestId('auth-modal')).toBeTruthy());
  });

  it('کاربر → فرم کامل + نامِ حساب (قراردادِ بک‌اند: نویسنده ویرایش‌پذیر نیست) + روایت‌های من', async () => {
    answerApi([]);
    render(<SubmissionStudio />);
    await waitFor(() => expect(screen.getByText('روایت‌های من')).toBeTruthy());
    // نویسنده از حساب می‌آید (نام‌کامل ← ایمیل ← موبایل) — نمایش است نه ورودی؛
    // هم در نشانِ فرم و هم در پیش‌نمایشِ زنده دیده می‌شود
    expect(screen.getAllByText('کاربر آزمایشی').length).toBeGreaterThan(0);
    expect(screen.getByPlaceholderText(/یک عنوانِ کوتاه و گیرا/)).toBeTruthy();
    expect(screen.getByPlaceholderText(/همه‌چیز را بنویس/)).toBeTruthy();
    expect(screen.getByText('هنوز روایتی نفرستاده‌ای')).toBeTruthy();
  });

  it('بوش‌گرِ خودکار: نشانی mp4 → نوعِ «ویدئو» + نشانِ تشخیص خودکار؛ لمسِ دستی، خودکار را می‌برد', async () => {
    answerApi([]);
    render(<SubmissionStudio />);
    await screen.findByText('روایت‌های من');
    fireEvent.click(screen.getByRole('button', { name: /افزودن پیوست/ }));
    const urlInput = screen.getByLabelText(/نشانی پیوست ۱/);
    fireEvent.change(urlInput, { target: { value: 'https://cdn.example/story/clip.mp4' } });
    expect(await screen.findByText('تشخیص خودکار')).toBeTruthy();
    const videoChip = screen.getByRole('button', { name: 'صوت' });
    fireEvent.click(videoChip);
    await waitFor(() => expect(screen.queryByText('تشخیص خودکار')).toBeNull());
  });

  it('قانونِ سرور: سقفِ ۵ پیوست — ششمین افزودن غیرفعال می‌شود', async () => {
    answerApi([]);
    render(<SubmissionStudio />);
    await screen.findByText('روایت‌های من');
    const add = screen.getByRole('button', { name: /افزودن پیوست/ });
    for (let i = 0; i < 5; i++) fireEvent.click(add);
    expect(screen.getAllByLabelText(/نشانی پیوست/).length).toBe(5);
    const addMore = screen.getByRole('button', { name: /به سقفِ ۵ پیوست/ });
    expect((addMore as HTMLButtonElement).disabled).toBe(true);
  });

  it('ارسال: payload دقیقاً به شکلِ serializer بک‌اند + پنلِ موفقیت با کد پیگیری + پاک‌شدن پیش‌نویس', async () => {
    answerApi([], CREATED);
    render(<SubmissionStudio />);
    await screen.findByText('روایت‌های من');

    fireEvent.change(screen.getByPlaceholderText(/یک عنوانِ کوتاه و گیرا/), {
      target: { value: '  روایتِ صبحِ بارانی  ' },
    });
    fireEvent.change(screen.getByPlaceholderText(/همه‌چیز را بنویس/), {
      target: { value: 'متن کامل روایت اینجاست.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /افزودن پیوست/ }));
    fireEvent.change(screen.getByLabelText(/نشانی پیوست ۱/), {
      target: { value: 'https://cdn.example/a/pic.jpg' },
    });

    fireEvent.click(screen.getAllByRole('button', { name: /ارسال برای بررسی/ })[0]!);
    await waitFor(() => expect(screen.getByText('روایتت ثبت شد 🎉')).toBeTruthy(), {
      timeout: 2000,
    });

    const post = mocks.apiFetch.mock.calls.find(
      (c) => (c[1] as { method?: string })?.method === 'POST',
    )!;
    expect(post[0]).toBe('/tabyin/me/submissions/');
    expect(JSON.parse((post[1] as { body: string }).body)).toEqual({
      title: 'روایتِ صبحِ بارانی',
      description: 'متن کامل روایت اینجاست.',
      attachments: [{ url: 'https://cdn.example/a/pic.jpg', media_type: 'image', order: 0 }],
    });
    // کد پیگیری دیده می‌شود و پیش‌نویس پاک شده
    expect(screen.getByText('local-aaaa1111')).toBeTruthy();
    expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
  });

  it('خطای ۴۰۰ بک‌اند → همان پیامِ سرور روی فیلدِ عنوان نقشه می‌بندد', async () => {
    mocks.apiFetch.mockImplementation((url: string, init?: { method?: string }) => {
      if (init?.method === 'POST') {
        const e = new Error('عنوان نمی‌تواند خالی باشد') as Error & {
          name: string;
          status: number;
          errors: Record<string, string[]>;
        };
        e.name = 'ApiError';
        e.status = 400;
        e.errors = { title: ['عنوان معتبر نیست.'] };
        return Promise.reject(e);
      }
      return Promise.resolve(submissionsPage([]));
    });
    render(<SubmissionStudio />);
    await screen.findByText('روایت‌های من');
    fireEvent.change(screen.getByPlaceholderText(/یک عنوانِ کوتاه و گیرا/), {
      target: { value: 'روایت' },
    });
    fireEvent.change(screen.getByPlaceholderText(/همه‌چیز را بنویس/), {
      target: { value: 'شرح کافی برای تست' },
    });
    fireEvent.click(screen.getAllByRole('button', { name: /ارسال برای بررسی/ })[0]!);
    await waitFor(() => expect(screen.getByText('عنوان معتبر نیست.')).toBeTruthy(), {
      timeout: 2000,
    });
    expect(screen.getByText('عنوان نمی‌تواند خالی باشد')).toBeTruthy(); // بنر=firstErrorMessage
  });

  it('روایت‌های من: سه وضعیت با چیپ‌های قرارداد + یادداشتِ مدیر برای ردشده', async () => {
    answerApi([
      {
        id: 1,
        external_id: 'local-p1',
        title: 'روایتِ اول من',
        submission_status: 'pending_review',
        attachments_count: 2,
        created_at: '2026-08-28T10:00:00Z',
      },
      {
        id: 2,
        external_id: 'local-p2',
        title: 'روایتِ دوم',
        submission_status: 'approved',
        attachments_count: 0,
        created_at: '2026-08-27T10:00:00Z',
      },
      {
        id: 3,
        external_id: 'local-p3',
        title: 'روایتِ سوم',
        submission_status: 'rejected',
        admin_note: 'نشانیِ فیلم باز نمی‌شود؛ دوباره بفرست.',
        attachments_count: 1,
        created_at: '2026-08-26T10:00:00Z',
      },
    ]);
    render(<SubmissionStudio />);
    await screen.findByText('در انتظار بررسی');
    expect(screen.getByText('تأیید و منتشر شده')).toBeTruthy();
    expect(screen.getByText('بررسی شد — منتشر نشد')).toBeTruthy();
    expect(screen.getByText(/نشانیِ فیلم باز نمی‌شود/)).toBeTruthy();
    expect(screen.getByText('۲ پیوست')).toBeTruthy(); // attachments_count به‌دستورِ بک‌اند
  });
});
