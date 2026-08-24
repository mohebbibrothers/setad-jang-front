import { useState } from 'react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

/**
 * تست‌های رگرسیونِ مودال احراز هویت — باگانه (behavioral)، سطح یکپارچه.
 * فقط لایه‌ی شبکه در '@/lib/auth' ماک می‌شود؛ قطعات داخلی واقعی‌اند تا
 * تست‌ها دقیقاً همان چیزی را ببینند که مرورگر کاربر می‌بیند.
 *
 * نکته‌ی معماری v2/v3:
 *  - هر سه view همیشه مونت‌اند و با hidden/inert پنهان می‌شوند؛ پس
 *    کوئری‌ها به «پنلِ فعال» اسکوپ می‌شوند — testing-library عناصر
 *    hidden را از درخت دسترس‌پذیری کنار می‌گذارد و getAllByRole('tabpanel')
 *    فقط پنلِ فعال را برمی‌گرداند.
 *  - چرخه‌حیات با usePresence تایمری است؛ تست‌های باگِ ۱ با
 *    fake-timers ددلاین تخلیه را جلو می‌برند (۲۴۰ms مودال + بافر).
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

/** زمانِ تخلیه‌ی قطعی مودال (۲۴۰ms) + بافر */
const DISPOSE_MS = 300;

/**
 * هارنس واقعی: مثل Header، stateِ باز/بسته را خودش نگه می‌دارد تا
 * کلِ چرخه — از کلیک روی تریگر تا تخلیه‌ی کامل لایه — تست شود.
 */
function Harness({ startOpen = true }: { startOpen?: boolean }) {
  const [open, setOpen] = useState(startOpen);
  return (
    <>
      <button type="button" data-testid="auth-open-trigger" onClick={() => setOpen(true)}>
        ورود | ثبت‌نام
      </button>
      <button type="button" data-testid="outside-action">
        اقدام بیرونی
      </button>
      <AuthModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

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
  document.body.style.paddingRight = '';
});

afterEach(cleanup);

describe('باگ ۱ — قفل‌شدن صفحه پس از بستن مودال (ریشه‌کنی v3: چرخه‌حیات قطعی)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('سناریوی دقیق کاربر: بازکردن → تب «ثبت‌نام» → بستن → صفحه کاملاً آزاد', () => {
    render(<Harness />);
    const dlg = dialog();

    // مسیرِ پیش‌فرض (بدون VisualViewport): هیچ استایلِ درونی تحمیلی —
    // دسکتاپ دقیقاً مثل قبل با کلاس‌های CSS کار می‌کند.
    const wrapperBefore = dlg.closest('.fixed.inset-0') as HTMLElement;
    expect(wrapperBefore.style.height).toBe('');
    expect(wrapperBefore.style.top).toBe('');

    fireEvent.click(modalTab('ثبت‌نام'));
    expect(activePanel().getByText('دریافت کد تأیید')).toBeTruthy();
    expect(document.body.style.overflow).toBe('hidden');

    fireEvent.click(within(dlg).getByRole('button', { name: 'بستن' }));

    // فاز خروج: لایه هنوز پایدار است ولی کاملاً غیرتعاملی —
    // حتی یک فریمِ اضافه هم هیچ کلیکی را نمی‌بلعد.
    expect(dlg.isConnected).toBe(true);
    expect(dlg.getAttribute('aria-hidden')).toBe('true');
    const wrapper = dlg.closest('.fixed.inset-0') as HTMLElement;
    expect(wrapper.className).toContain('pointer-events-none');
    expect(document.body.style.overflow).toBe('hidden'); // تا پایان خروج قفل باقی است

    // تخلیه‌ی قطعی — بدون هیچ رویدادِ انیمیشنی، فقط با گذرِ زمان:
    act(() => {
      vi.advanceTimersByTime(DISPOSE_MS);
    });
    expect(dlg.isConnected).toBe(false);
    expect(screen.queryByRole('dialog')).toBeNull();
    // قفل آزاد و استایل‌های بدنه دقیقاً به حالتِ قبل برگشته‌اند
    expect(document.body.style.overflow).toBe('');
    expect(document.body.style.paddingRight).toBe('');
  });

  it('سناریوی دقیق کاربر: روش «کد یکبارمصرف» → بستن با بک‌دراپ → صفحه آزاد', () => {
    render(<Harness />);

    fireEvent.click(activePanel().getByRole('tab', { name: 'کد یکبارمصرف' }));
    expect(activePanel().getByText('ارسال کد ورود')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'بستن پنجره' }));
    act(() => {
      vi.advanceTimersByTime(DISPOSE_MS);
    });

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.body.style.overflow).toBe('');
  });

  it('بستن با Escape: همان مسیر قطعی + شنونده‌ی سالم در فازِ خروج', () => {
    render(<Harness />);
    const dlg = dialog();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(dlg.getAttribute('aria-hidden')).toBe('true');

    // Escِ تکراری در فازِ خروج هیچ اثر/خطایی ندارد (شنونده فقط در open است)
    fireEvent.keyDown(document, { key: 'Escape' });

    act(() => {
      vi.advanceTimersByTime(DISPOSE_MS);
    });
    expect(dlg.isConnected).toBe(false);
    expect(document.body.style.overflow).toBe('');
  });

  it('حلقه‌ی تنش: سه چرخه‌ی «باز → سوییچ → بستن» بدون هیچ باقی‌مانده‌ای', () => {
    render(<Harness startOpen={false} />);
    for (let i = 0; i < 3; i += 1) {
      fireEvent.click(screen.getByTestId('auth-open-trigger'));
      const dlg = dialog();
      expect(document.body.style.overflow).toBe('hidden');

      fireEvent.click(modalTab(i % 2 === 0 ? 'ثبت‌نام' : 'ورود'));
      fireEvent.click(within(dlg).getByRole('button', { name: 'بستن' }));
      act(() => {
        vi.advanceTimersByTime(DISPOSE_MS);
      });

      expect(dlg.isConnected).toBe(false);
      expect(document.body.style.overflow).toBe('');
      expect(document.body.style.paddingRight).toBe('');
    }
  });

  it('بازشدنِ میانِ فاز خروج: تخلیه‌ی دیرهنگام رخ نمی‌دهد و قفل حفظ می‌شود', () => {
    render(<Harness />);
    const dlg = dialog();

    fireEvent.click(within(dlg).getByRole('button', { name: 'بستن' }));
    act(() => {
      vi.advanceTimersByTime(120); // وسطِ انیمیشنِ خروج
    });
    fireEvent.click(screen.getByTestId('auth-open-trigger'));

    expect(dialog()).toBeTruthy();
    expect(document.body.style.overflow).toBe('hidden');

    // اگر تایمرِ تخلیه‌ی قبلی زنده مانده بود، این‌جا مودال را می‌کشت:
    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(dialog()).toBeTruthy();
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('نوار اعتماد بیرون از ناحیه‌ی مورف است — هیچ‌وقت پشتِ کلیپ دیر ظاهر نمی‌شود', () => {
    render(<Harness />);
    const dlg = dialog();

    const region = screen.getByTestId('auth-morph-region');
    // ناحیه‌ی مورف همیشه کلیپ است (اسکرول‌بار حین مورف فلش نمی‌زند)…
    expect(region.className).toContain('overflow-hidden');
    // …ولی فوتر بیرونِ آن و درست بلافاصله پس از آن در بدنه‌ی اسکرول قرار
    // دارد؛ پس ارتفاعِ موقتِ کوچک‌تر هیچ‌وقت آن را پنهان نمی‌کند:
    const footer = within(dlg).getByText(/اتصال امن است/);
    expect(region.contains(footer)).toBe(false);
    expect(footer.previousElementSibling).toBe(region);
    // و فرمِ فعال داخل ناحیه‌ی مورف است (مورف فقط فرم را می‌پوشاند)
    expect(region.contains(screen.getByRole('tabpanel'))).toBe(true);
  });

  it('فوکوس پس از تخلیه‌ی کامل به عنصرِ قبلیِ خارج از مودال برمی‌گردد', () => {
    render(<Harness startOpen={false} />);
    const outside = screen.getByTestId('outside-action');
    outside.focus();

    fireEvent.click(screen.getByTestId('auth-open-trigger'));
    fireEvent.click(within(dialog()).getByRole('button', { name: 'بستن' }));
    act(() => {
      vi.advanceTimersByTime(DISPOSE_MS);
    });

    expect(document.activeElement).toBe(outside);
  });
});

/* ── VisualViewport ساختگی برای شبیه‌سازی کیبوردِ موبایل ─────────────── */
type VvListener = () => void;
function installFakeVisualViewport(initial: { height: number; offsetTop: number }) {
  const state = { ...initial };
  const listeners = new Map<string, Set<VvListener>>();
  const bucket = (type: string) => {
    let set = listeners.get(type);
    if (!set) {
      set = new Set();
      listeners.set(type, set);
    }
    return set;
  };
  const fake = {
    get height() {
      return state.height;
    },
    get offsetTop() {
      return state.offsetTop;
    },
    addEventListener(type: string, fn: VvListener) {
      bucket(type).add(fn);
    },
    removeEventListener(type: string, fn: VvListener) {
      bucket(type).delete(fn);
    },
    emit(type: 'resize' | 'scroll', next?: { height?: number; offsetTop?: number }) {
      Object.assign(state, next ?? {});
      for (const fn of Array.from(bucket(type))) fn();
    },
  };
  Object.defineProperty(window, 'visualViewport', { value: fake, configurable: true });
  return fake;
}

describe('کیبورد موبایل — پنل روی کیبورد سوار می‌شود، نه زیر آن', () => {
  beforeEach(() => {
    // موبایل‌سازیِ محیط: درگاه‌کُشی موبایل + اسکرین‌ریدر matchMedia
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent: () => false,
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete (window as unknown as Record<string, unknown>).visualViewport;
  });

  it('با بازشدنِ کیبورد، لایه‌ی مودال به ناحیه‌ی دیدنیِ کوچک‌شده می‌چسبد و با بستن برمی‌گردد', () => {
    const vv = installFakeVisualViewport({ height: 800, offsetTop: 0 });
    render(<Harness />);

    const dlg = dialog();
    const wrapper = dlg.closest('.fixed.inset-0') as HTMLElement;
    // ناحیه‌ی دیدنیِ اولیه
    expect(wrapper.style.height).toBe('800px');
    expect(wrapper.style.top).toBe('0px');
    // سقفِ ارتفاعِ پنل روی موبایل کلِ ناحیه‌ی دیدنی است
    expect(dlg.className).toContain('max-h-full');

    // کیبورد باز می‌شود → ناحیه‌ی دیدنی کوچک می‌شود → شیت/پنل بالا می‌آید
    act(() => vv.emit('resize', { height: 430 }));
    expect(wrapper.style.height).toBe('430px');

    // iOS محتوا را در داخل گاهی می‌لغزاند — جبرانِ offsetTop هم کار می‌کند
    act(() => vv.emit('scroll', { offsetTop: 20 }));
    expect(wrapper.style.top).toBe('20px');

    // کیبورد بسته می‌شود → همه‌چیز به حالتِ اول برمی‌گردد
    act(() => vv.emit('resize', { height: 800, offsetTop: 0 }));
    expect(wrapper.style.height).toBe('800px');
    expect(wrapper.style.top).toBe('0px');
  });

  it('فوکوسِ فیلد در موبایل: فیلد به‌نمای اسکرول می‌شود تا متنِ تایپ‌شده دیده شود', () => {
    vi.useFakeTimers();
    try {
      const scrollSpy = vi.spyOn(HTMLElement.prototype, 'scrollIntoView');
      render(<Harness />);

      const input = activePanel().getByLabelText('ایمیل یا شماره موبایل');
      fireEvent.focusIn(input);
      act(() => {
        vi.advanceTimersByTime(2_000);
      });

      expect(scrollSpy).toHaveBeenCalledWith({ block: 'nearest', behavior: 'smooth' });
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('باگ ۲ — ثبت‌نام خالی بعد از انتخاب «کد یکبارمصرف»', () => {
  it('ورود → روش کد یکبارمصرف → تب ثبت‌نام: فرم ثبت‌نام کامل رندر شود', () => {
    render(<Harness />);

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
    render(<Harness />);
    for (let i = 0; i < 3; i += 1) {
      fireEvent.click(modalTab('ثبت‌نام'));
      expect(activePanel().getByText('دریافت کد تأیید')).toBeTruthy();
      fireEvent.click(modalTab('ورود'));
      expect(activePanel().getByText('ورود به حساب')).toBeTruthy();
    }
  });
});

describe('باگ ۳ — ازدست‌رفتن پیشرفت ثبت‌نام با جابه‌جایی تب', () => {
  it('بستن و بازکردنِ مودال هم پیش‌نویسِ فلو را حفظ می‌کند (طراحیِ آگاهانه)', async () => {
    render(<Harness />);

    fireEvent.click(modalTab('ثبت‌نام'));
    fireEvent.change(activePanel().getByLabelText('ایمیل یا شماره موبایل'), {
      target: { value: '09120000000' },
    });
    fireEvent.submit(activePanel().getByText('دریافت کد تأیید').closest('form')!);
    await waitFor(() =>
      expect(activePanel().getByRole('group', { name: /کد یکبارمصرف/ })).toBeTruthy(),
    );

    // بستن و بازکردن — فلو باید از مرحله‌ی کد ادامه پیدا کند
    fireEvent.click(within(dialog()).getByRole('button', { name: 'بستن' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    fireEvent.click(screen.getByTestId('auth-open-trigger'));
    fireEvent.click(modalTab('ثبت‌نام'));
    expect(activePanel().getByRole('group', { name: /کد یکبارمصرف/ })).toBeTruthy();
    // و درخواستِ تکراری زده نشده — cooldown بک‌اند محترم است
    expect(signupRequestMock).toHaveBeenCalledTimes(1);
  });

  it('ثبت‌نام مرحله‌ی ۲ → رفتن به ورود → بازگشت: ادامه‌ی فلو از همان‌جا + بدون درخواست تکراری', async () => {
    render(<Harness />);

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
    render(<Harness />);

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
