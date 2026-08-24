import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

/**
 * تست‌های رگرسیونِ سه باگ گزارش‌شده‌ی مودال احراز هویت.
 * هر تست = سناریوی دقیق کاربر، سطح یکپارچه (بدون mock کردن قطعات داخلی
 * مودال؛ فقط لایه‌ی شبکه در '@/lib/auth' ماک می‌شود).
 *
 * نکته‌ی معماری v2: هر سه view همیشه مونت‌اند و با hidden/inert پنهان
 * می‌شوند؛ پس کوئری‌ها به «پنلِ فعال» اسکوپ می‌شوند — testing-library
 * به‌صورت پیش‌فرض عناصر hidden را از درخت دسترس‌پذیری کنار می‌گذارد و
 * getAllByRole('tabpanel') فقط پنلِ فعال را برمی‌گرداند.
 */

const signupRequestMock = vi.fn();
vi.mock('@/lib/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/auth')>();
  return {
    ...actual,
    signupRequest: (id: string) => signupRequestMock(id),
    loginOtpRequest: () => Promise.resolve(null),
    forgotPasswordRequest: () => Promise.resolve(null),
  };
});

import { AuthModal } from './AuthModal';
import { resetAllAuthFlows } from '@/lib/auth-flow-session';

function dialog() {
  return screen.getByRole('dialog');
}
/** پنلِ فعال (تنها tabpanel غیرhidden در درخت a11y). */
function activePanel() {
  return within(screen.getByRole('tabpanel'));
}
function modalTab(label: string) {
  const tabs = screen
    .getByRole('tablist', { name: 'ورود یا ثبت‌نام' })
    .querySelectorAll('[role="tab"]');
  const tab = Array.from(tabs).find((t) => t.textContent === label);
  if (!tab) throw new Error(`tab not found: ${label}`);
  return tab as HTMLElement;
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  resetAllAuthFlows();
  signupRequestMock.mockReset();
  signupRequestMock.mockResolvedValue(null);
  document.body.style.overflow = '';
});

afterEach(cleanup);

describe('باگ ۱ — قفل‌شدن صفحه بعد از بستن مودال', () => {
  it('بازکردن → رفتن به ثبت‌نام → بستن: اسکرول آزاد و مودال حذف شود', () => {
    const onClose = vi.fn();
    const { unmount } = render(<AuthModal open onClose={onClose} />);

    fireEvent.click(modalTab('ثبت‌نام'));
    expect(activePanel().getByText('دریافت کد تأیید')).toBeTruthy();
    expect(document.body.style.overflow).toBe('hidden');

    fireEvent.click(within(dialog()).getByRole('button', { name: 'بستن' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    // شبیه‌سازی unmount توسط والد (همان چیزی که Header پس از onClose می‌کند)
    unmount();
    expect(document.body.style.overflow).toBe('');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('بستن با Escape هم اسکرول را آزاد می‌کند', () => {
    const onClose = vi.fn();
    const { unmount } = render(<AuthModal open onClose={onClose} />);
    expect(document.body.style.overflow).toBe('hidden');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('بستن با بک‌دراپ هم رخداد onClose را یک‌بار صادر می‌کند', () => {
    const onClose = vi.fn();
    render(<AuthModal open onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'بستن پنجره' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('باگ ۲ — ثبت‌نام خالی بعد از انتخاب «کد یکبارمصرف»', () => {
  it('ورود → روش کد یکبارمصرف → تب ثبت‌نام: فرم ثبت‌نام کامل رندر شود', () => {
    render(<AuthModal open onClose={vi.fn()} />);

    // روش ورود: کد یکبارمصرف
    fireEvent.click(activePanel().getByRole('tab', { name: 'کد یکبارمصرف' }));
    expect(activePanel().getByText('ارسال کد ورود')).toBeTruthy();

    // حالا تب ثبت‌نام
    fireEvent.click(modalTab('ثبت‌نام'));

    // فیلدهای مرحله‌ی اول ثبت‌نام باید باشند — نه صفحه‌ی سفید
    const panel = activePanel();
    expect(panel.getByLabelText('ایمیل یا شماره موبایل')).toBeTruthy();
    expect(panel.getByText('دریافت کد تأیید')).toBeTruthy();
    expect(panel.getByText(/شناسه‌تان را وارد کنید/)).toBeTruthy();

    // و برگشت به ورود هم همان روش OTP را به یاد دارد (ماندگاری state)
    fireEvent.click(modalTab('ورود'));
    expect(
      activePanel().getByRole('tab', { name: 'کد یکبارمصرف' }).getAttribute('aria-selected'),
    ).toBe('true');
    expect(activePanel().getByText('ارسال کد ورود')).toBeTruthy();
  });

  it('دو سوییچ پشت‌سرهم (ورود↔ثبت‌نام) پایدار است — هیچ صفحه‌ی سفیدی نمی‌آید', () => {
    render(<AuthModal open onClose={vi.fn()} />);
    for (let i = 0; i < 3; i += 1) {
      fireEvent.click(modalTab('ثبت‌نام'));
      expect(activePanel().getByText('دریافت کد تأیید')).toBeTruthy();
      fireEvent.click(modalTab('ورود'));
      expect(activePanel().getByText('ورود به حساب')).toBeTruthy();
    }
  });
});

describe('باگ ۳ — ازدست‌رفتن پیشرفت ثبت‌نام با جابه‌جایی تب', () => {
  it('ثبت‌نام مرحله‌ی ۲ → رفتن به ورود → بازگشت: ادامه‌ی فلو از همان‌جا + بدون درخواست تکراری', async () => {
    render(<AuthModal open onClose={vi.fn()} />);

    // رفتن به ثبت‌نام و ورود شناسه
    fireEvent.click(modalTab('ثبت‌نام'));
    fireEvent.change(activePanel().getByLabelText('ایمیل یا شماره موبایل'), {
      target: { value: '09120000000' },
    });
    fireEvent.submit(activePanel().getByText('دریافت کد تأیید').closest('form')!);

    // مرحله‌ی کد باید بیاید (با ماک موفقِ request)
    await waitFor(() =>
      expect(activePanel().getByRole('group', { name: /کد یکبارمصرف/ })).toBeTruthy(),
    );
    expect(signupRequestMock).toHaveBeenCalledWith('09120000000');

    // کاربر می‌رود روی «ورود» و برمی‌گردد → پیشرفت باید ماندگار باشد
    fireEvent.click(modalTab('ورود'));
    expect(screen.queryAllByRole('group', { name: /کد یکبارمصرف/ })).toHaveLength(0);

    fireEvent.click(modalTab('ثبت‌نام'));
    const panel = activePanel();

    // ★ قرارداد اصلی: ادامه‌ی فلو، نه شروع از اول
    expect(panel.getByRole('group', { name: /کد یکبارمصرف/ })).toBeTruthy();
    // فیلدهای بعدیِ همان مرحله هم دیده می‌شوند
    expect(panel.getByLabelText('رمز عبور دلخواه')).toBeTruthy();
    // و نباید درخواست دومی زده شده باشد (cooldown ۶۰ث بک‌اند محترم!)
    expect(signupRequestMock).toHaveBeenCalledTimes(1);
    // تایمر ارسال مجدد هم از همان لحظه‌ی ارسال واقعی می‌گذرد
    expect(panel.getByText(/ارسال مجدد \(/)).toBeTruthy();
  });

  it('مقادیر تایپ‌شده‌ی مرحله‌ی ۲ (رمز و نام) هم حفظ می‌شوند', async () => {
    render(<AuthModal open onClose={vi.fn()} />);

    fireEvent.click(modalTab('ثبت‌نام'));
    fireEvent.change(activePanel().getByLabelText('ایمیل یا شماره موبایل'), {
      target: { value: '09120000000' },
    });
    fireEvent.submit(activePanel().getByText('دریافت کد تأیید').closest('form')!);
    await waitFor(() =>
      expect(activePanel().getByRole('group', { name: /کد یکبارمصرف/ })).toBeTruthy(),
    );

    // رمز و نام را پر می‌کنیم
    fireEvent.change(activePanel().getByLabelText('رمز عبور دلخواه'), {
      target: { value: 'secret-123' },
    });
    fireEvent.change(activePanel().getByLabelText('نام (اختیاری)'), {
      target: { value: 'علی' },
    });

    // سوییچ و بازگشت
    fireEvent.click(modalTab('ورود'));
    fireEvent.click(modalTab('ثبت‌نام'));

    expect((activePanel().getByLabelText('رمز عبور دلخواه') as HTMLInputElement).value).toBe(
      'secret-123',
    );
    expect((activePanel().getByLabelText('نام (اختیاری)') as HTMLInputElement).value).toBe('علی');
  });
});
