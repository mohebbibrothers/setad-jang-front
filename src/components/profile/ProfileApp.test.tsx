import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

/**
 * تست‌های یکپارچه‌ی صفحه‌ی حساب کاربری (/profile) — باگانه، سطح بالا.
 * فقط لایه‌ی شبکه در '@/lib/auth' ماک می‌شود؛ استورِ توکن، کشِ کاربر،
 * هوکِ useAuth و همه‌ی کامپوننت‌ها واقعی‌اند تا تست دقیقاً همان چیزی را
 * ببیند که مرورگرِ کاربر می‌بیند (همان قراردادِ AuthModal.test).
 */

/* ── ماکِ لایه‌ی شبکه ── */
const getMeMock = vi.fn();
const getProfileMock = vi.fn();
const updateMeMock = vi.fn();
const updateProfileMock = vi.fn();
const identifierAddRequestMock = vi.fn();
const identifierAddVerifyMock = vi.fn();
const identifierMakePrimaryMock = vi.fn();
const changePasswordMock = vi.fn();
const listSessionsPageMock = vi.fn();
const revokeSessionMock = vi.fn();
const logoutMock = vi.fn();

vi.mock('@/lib/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/auth')>();
  return {
    ...actual,
    getMe: () => getMeMock(),
    getProfile: () => getProfileMock(),
    updateMe: (p: unknown) => updateMeMock(p),
    updateProfile: (p: unknown) => updateProfileMock(p),
    identifierAddRequest: (p: unknown) => identifierAddRequestMock(p),
    identifierAddVerify: (p: unknown) => identifierAddVerifyMock(p),
    identifierMakePrimary: (k: unknown) => identifierMakePrimaryMock(k),
    changePassword: (p: unknown) => changePasswordMock(p),
    listSessionsPage: (n: number) => listSessionsPageMock(n),
    revokeSession: (id: string | number) => revokeSessionMock(id),
    logout: () => logoutMock(),
  };
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import { ProfileApp } from './ProfileApp';
import { setTokens, clearTokens } from '@/lib/auth-tokens';
import { setCachedUser } from '@/lib/auth-user-cache';
import { resetAllAuthFlows } from '@/lib/auth-flow-session';
import { ApiError } from '@/lib/api';
import type { AuthUser, AuthSession, SessionsPage } from '@/lib/auth';

/* ── فیکسچرها (منطبق بر قراردادِ واقعیِ serializerها) ── */

const ME: AuthUser = {
  id: 7,
  email: 'user@example.com',
  first_name: 'علی',
  last_name: 'رضایی',
  full_name: 'علی رضایی',
  role: 'user',
  is_email_verified: true,
  date_joined: '2023-05-10T10:00:00Z',
  profile: {
    phone_number: '+989120000000',
    national_code: '',
    birth_date: '2000-01-01',
    gender: 'male',
    avatar: null,
    bio: '',
    province: 'تهران',
    city: 'تهران',
    address: '',
  },
};

const SESSION: AuthSession = {
  id: 11,
  device_label: 'Chrome browser',
  ip_address: '1.2.3.4',
  user_agent: 'Mozilla/5.0 Chrome',
  request_id: 'req-1',
  is_revoked: false,
  revoked_at: null,
  revoked_by_email: null,
  // آزادانه قدیمی — بیرونِ پنجره‌ی «در حال استفاده» تا بدج «فعال» بگیرد
  last_seen_at: '2026-08-20T10:00:00Z',
  expires_at: null,
  created_at: '2023-05-10T10:00:00Z',
};

const SESSIONS_PAGE: SessionsPage = { results: [SESSION], count: 1, next: null };

function login() {
  setTokens({ access: 'a', refresh: 'r', persist: true });
  setCachedUser(ME);
}

function switchTab(name: string) {
  fireEvent.click(
    within(screen.getByRole('tablist', { name: 'بخش‌های حساب کاربری' })).getByRole('tab', {
      name,
    }),
  );
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  resetAllAuthFlows();
  [
    getMeMock,
    getProfileMock,
    updateMeMock,
    updateProfileMock,
    identifierAddRequestMock,
    identifierAddVerifyMock,
    identifierMakePrimaryMock,
    changePasswordMock,
    listSessionsPageMock,
    revokeSessionMock,
    logoutMock,
  ].forEach((m) => m.mockReset());
  getMeMock.mockResolvedValue(ME);
  listSessionsPageMock.mockResolvedValue(SESSIONS_PAGE);
  logoutMock.mockImplementation(async () => {
    clearTokens();
    setCachedUser(null);
  });
});

afterEach(() => {
  cleanup();
  clearTokens();
  setCachedUser(null);
});

/* ── مهمان ── */

describe('صفحه‌ی پروفایل — مهمان', () => {
  it('حالتِ خالیِ طراحی‌شده + AuthModalِ توکار روی همان صفحه باز می‌شود', async () => {
    render(<ProfileApp />);

    expect(screen.getByText('حساب کاربری شما')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /ورود \| ثبت‌نام/ }));
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(
      within(screen.getByRole('dialog')).getByRole('heading', { name: 'ورود به حساب' }),
    ).toBeTruthy();
  });

  it('getMe برای مهمان صدا زده نمی‌شود', () => {
    render(<ProfileApp />);
    expect(getMeMock).not.toHaveBeenCalled();
  });
});

/* ── واردشده ── */

describe('صفحه‌ی پروفایل — واردشده', () => {
  it('هیرو: نام، شناسه‌ی نمایشی، حلقه‌ی تکمیل و «عضو از…» جلالی رندر می‌شود', async () => {
    login();
    render(<ProfileApp />);

    await waitFor(() => expect(screen.getByText('علی رضایی')).toBeTruthy());
    expect(screen.getByText('user@example.com')).toBeTruthy();
    // date_joined فیکسچر = ۲۰ اردیبهشت ۱۴۰۲ (جلالی)
    expect(screen.getByText(/عضو از اردیبهشت ۱۴۰۲/)).toBeTruthy();
    // نام/فامیل+تولد+جنسیت+استان+شهر+موبایل؟ → completion محاسبه شد
    expect(screen.getByText(/٪/)).toBeTruthy();
    // سینک پس‌زمینه با سرور
    await waitFor(() => expect(getMeMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(listSessionsPageMock).toHaveBeenCalledWith(1));
  });

  it('تب‌ها با همان Segmentedِ مودال سوییچ می‌شوند و محتوا با MorphSwap جابه‌جا می‌شود', async () => {
    login();
    render(<ProfileApp />);
    await waitFor(() => expect(screen.getByText('علی رضایی')).toBeTruthy());

    // حالت پیش‌فرض: هویتی
    expect(screen.getByDisplayValue('علی')).toBeTruthy();

    switchTab('شناسه‌ها');
    expect((await screen.findAllByText('شناسه‌های ورود'))[0]).toBeTruthy();

    switchTab('امنیت و نشست‌ها');
    expect((await screen.findAllByText('تغییر رمز عبور'))[0]).toBeTruthy();
    expect((await screen.findAllByText('نشست‌ها و دستگاه‌ها'))[0]).toBeTruthy();
  });
});

describe('ویرایش هویتی — PATCHِ تدریجی دقیق', () => {
  it('فقط فیلدهای تغییرکرده ارسال می‌شوند؛ نام به /me و شهر به /profile', async () => {
    login();
    updateMeMock.mockResolvedValue({ ...ME, first_name: 'محمد' });
    updateProfileMock.mockResolvedValue({ ...ME.profile, city: 'شیراز' });
    render(<ProfileApp />);
    await waitFor(() => expect(screen.getByDisplayValue('علی')).toBeTruthy());

    fireEvent.change(screen.getByDisplayValue('علی'), { target: { value: 'محمد' } });
    fireEvent.change(screen.getByLabelText('شهر'), { target: { value: 'شیراز' } });
    fireEvent.click(screen.getByRole('button', { name: 'ذخیره تغییرات' }));

    await waitFor(() => expect(updateMeMock).toHaveBeenCalledTimes(1));
    expect(updateMeMock).toHaveBeenCalledWith({ first_name: 'محمد' });
    expect(updateProfileMock).toHaveBeenCalledWith({ city: 'شیراز' });
    await waitFor(() =>
      expect(screen.getByText('اطلاعات شما با موفقیت به‌روزرسانی شد.')).toBeTruthy(),
    );
  });

  it('بدون تغییر، دکمه‌ی ذخیره غیرفعال است', async () => {
    login();
    render(<ProfileApp />);
    await waitFor(() => expect(screen.getByDisplayValue('علی')).toBeTruthy());
    expect(
      (screen.getByRole('button', { name: 'ذخیره تغییرات' }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it('کد ملیِ غیر ده‌رقمی سمت کلاینت گرفته می‌شود (بدون شبکه)', async () => {
    login();
    render(<ProfileApp />);
    await waitFor(() => expect(screen.getByDisplayValue('علی')).toBeTruthy());

    const nc = document.getElementById('acc-national-code') as HTMLInputElement;
    fireEvent.change(nc, { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: 'ذخیره تغییرات' }));

    expect(screen.getByText('کد ملی باید دقیقاً ۱۰ رقم باشد.')).toBeTruthy();
    expect(updateProfileMock).not.toHaveBeenCalled();
  });
});

describe('شناسه‌های ورود', () => {
  it('تنظیم شناسه‌ی اصلی: بدنه‌ی قراردادی identifier_kind می‌فرستد و کش را سینک می‌کند', async () => {
    login();
    identifierMakePrimaryMock.mockResolvedValue(ME);
    render(<ProfileApp />);
    await waitFor(() => expect(screen.getByText('علی رضایی')).toBeTruthy());

    switchTab('شناسه‌ها');
    const btn = (await screen.findAllByRole('button', { name: /تنظیم به‌عنوان شناسه‌ی اصلی/ }))[0];
    fireEvent.click(btn);

    await waitFor(() => expect(identifierMakePrimaryMock).toHaveBeenCalledWith('email'));
    await waitFor(() =>
      expect(screen.getByText('شناسه‌ی اصلی حساب با موفقیت تغییر کرد.')).toBeTruthy(),
    );
  });

  it('افزودن ایمیلِ غایب: درخواست کد → تأیید → سینکِ UserMe', async () => {
    const noEmail: AuthUser = { ...ME, email: null, is_email_verified: false };
    setTokens({ access: 'a', refresh: 'r', persist: true });
    setCachedUser(noEmail);
    getMeMock.mockResolvedValue(noEmail);
    identifierAddRequestMock.mockResolvedValue(null);
    identifierAddVerifyMock.mockResolvedValue(ME);
    render(<ProfileApp />);
    await waitFor(() => expect(screen.getByText('علی رضایی')).toBeTruthy());

    switchTab('شناسه‌ها');
    fireEvent.click((await screen.findAllByRole('button', { name: 'افزودن ایمیل' }))[0]);

    const field = document.getElementById('identifier-add-email') as HTMLInputElement;
    fireEvent.change(field, { target: { value: 'new@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'ارسال کد تأیید' }));

    await waitFor(() => expect(identifierAddRequestMock).toHaveBeenCalledWith('new@example.com'));

    const cells = screen.getAllByRole('textbox', { name: /رقم \d از 5/ });
    fireEvent.change(cells[0], { target: { value: '12345' } });

    await waitFor(() =>
      expect(identifierAddVerifyMock).toHaveBeenCalledWith({
        identifier: 'new@example.com',
        code: '12345',
      }),
    );
    await waitFor(() =>
      expect(screen.getByText('شناسه با موفقیت به حساب شما متصل و تأیید شد.')).toBeTruthy(),
    );
  });
});

describe('نشست‌ها — تشخیص و رفتارِ نشستِ فعلی', () => {
  it('نشستِ جاری: آنلاین + همین دستگاه + هم‌اکنون، بدون دکمه‌ی لغو و با راهنمای خروج', async () => {
    login();
    const current: AuthSession = {
      ...SESSION,
      id: 99,
      device_label: 'Chrome browser',
      user_agent: navigator.userAgent, // دقیقاً UAِ همین مرورگر — قراردادِ تشخیص
    };
    listSessionsPageMock.mockResolvedValue({ results: [current], count: 1, next: null });
    render(<ProfileApp />);
    await waitFor(() => expect(screen.getByText('علی رضایی')).toBeTruthy());
    switchTab('امنیت و نشست‌ها');

    await waitFor(() => expect(screen.getByText('آنلاین')).toBeTruthy());
    expect(screen.getByText('همین دستگاه')).toBeTruthy();
    expect(screen.getByText('آخرین فعالیت: هم‌اکنون')).toBeTruthy();
    // دکمه‌ی لغو برای نشستِ فعلی وجود ندارد…
    expect(screen.queryByRole('button', { name: 'لغو نشست' })).toBeNull();
    // …و راهنمایِ «خروج از حساب» دیده می‌شود
    expect(screen.getByText(/برای پایان دادن به این نشست، از «خروج از حساب»/)).toBeTruthy();
  });

  it('نشستِ جاری همیشه بالای لیست می‌نشیند حتی اگر سرور آن را دیرتر فرستاده باشد', async () => {
    login();
    const other: AuthSession = { ...SESSION, id: 2 };
    const current: AuthSession = { ...SESSION, id: 99, user_agent: navigator.userAgent };
    // ترتیبِ سرور: اول «دیگری» — چون UAِ جاری با ۹۹ یکی است باید بالا بیاید
    listSessionsPageMock.mockResolvedValue({
      results: [other, current],
      count: 2,
      next: null,
    });
    render(<ProfileApp />);
    await waitFor(() => expect(screen.getByText('علی رضایی')).toBeTruthy());
    switchTab('امنیت و نشست‌ها');

    await waitFor(() => expect(screen.getByText('آنلاین')).toBeTruthy());
    const rows = document.querySelectorAll('ul li');
    expect(rows.length).toBeGreaterThanOrEqual(2);
    expect(rows[0].textContent).toContain('آنلاین');
    // نشستِ دیگر قابلِ لغو است
    expect(screen.getByRole('button', { name: 'لغو نشست' })).toBeTruthy();
  });

  it('فلگِ سروری is_current مرجعِ قطعی است — حتی با UAِ نامتطابق', async () => {
    login();
    const flagged: AuthSession = {
      ...SESSION,
      id: 77,
      user_agent: 'Some Other Agent/9.9', // عمداً نامتطابق — فلگِ سرور باید حرفِ آخر باشد
      is_current: true,
    };
    listSessionsPageMock.mockResolvedValue({ results: [flagged], count: 1, next: null });
    render(<ProfileApp />);
    await waitFor(() => expect(screen.getByText('علی رضایی')).toBeTruthy());
    switchTab('امنیت و نشست‌ها');

    await waitFor(() => expect(screen.getByText('آنلاین')).toBeTruthy());
    expect(screen.getByText('همین دستگاه')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'لغو نشست' })).toBeNull();
  });

  it('نشستِ دیگری با last_seen تازه: بدج «در حال استفاده» + لغوپذیر', async () => {
    login();
    const alive: AuthSession = {
      ...SESSION,
      id: 78,
      user_agent: 'Android Chrome Other-Device',
      last_seen_at: new Date(Date.now() - 2 * 60_000).toISOString(), // ۲ دقیقه پیش
    };
    listSessionsPageMock.mockResolvedValue({ results: [alive], count: 1, next: null });
    render(<ProfileApp />);
    await waitFor(() => expect(screen.getByText('علی رضایی')).toBeTruthy());
    switchTab('امنیت و نشست‌ها');

    await waitFor(() => expect(screen.getByText('در حال استفاده')).toBeTruthy());
    expect(screen.getByRole('button', { name: 'لغو نشست' })).toBeTruthy();
  });

  it('نشستِ منقضی: بدج «منقضی شده» و بدون دکمه‌ی لغو', async () => {
    login();
    const expired: AuthSession = {
      ...SESSION,
      id: 3,
      user_agent: 'Totally/Different',
      expires_at: '2020-01-01T00:00:00Z',
    };
    listSessionsPageMock.mockResolvedValue({ results: [expired], count: 1, next: null });
    render(<ProfileApp />);
    await waitFor(() => expect(screen.getByText('علی رضایی')).toBeTruthy());
    switchTab('امنیت و نشست‌ها');

    await waitFor(() => expect(screen.getByText('منقضی شده')).toBeTruthy());
    expect(screen.queryByRole('button', { name: 'لغو نشست' })).toBeNull();
  });
});

describe('امنیت', () => {
  it('تغییر رمز: خطای «رمز فعلی اشتباه است» به فیلدِ خودش می‌چسبد', async () => {
    login();
    render(<ProfileApp />);
    await waitFor(() => expect(screen.getByText('علی رضایی')).toBeTruthy());
    switchTab('امنیت و نشست‌ها');

    changePasswordMock.mockImplementation(() =>
      Promise.reject(new ApiError('رمز فعلی اشتباه است.', 400)),
    );
    fireEvent.change(document.getElementById('acc-old-password')!, {
      target: { value: 'wrong-pass-1' },
    });
    fireEvent.change(document.getElementById('acc-new-password')!, {
      target: { value: 'new-strong-2' },
    });
    fireEvent.change(document.getElementById('acc-confirm-password')!, {
      target: { value: 'new-strong-2' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'ذخیره رمز جدید' }));

    await waitFor(() => expect(changePasswordMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByText('رمز فعلی اشتباه است.')).toBeTruthy());
  });

  it('لغوی نشست: تأیید دومرحله‌ای → جایگزینیِ ردیف با AuthSessionِ سرور', async () => {
    login();
    revokeSessionMock.mockResolvedValue({ ...SESSION, is_revoked: true });
    render(<ProfileApp />);
    await waitFor(() => expect(screen.getByText('علی رضایی')).toBeTruthy());
    switchTab('امنیت و نشست‌ها');

    await waitFor(() => expect(screen.getByText('مرورگر کروم')).toBeTruthy());
    expect(screen.getByText('فعال')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'لغو نشست' }));
    fireEvent.click(screen.getByRole('button', { name: 'بله، لغو شود' }));

    await waitFor(() => expect(revokeSessionMock).toHaveBeenCalledWith(11));
    await waitFor(() => expect(screen.getByText('لغو شده')).toBeTruthy());
  });
});
