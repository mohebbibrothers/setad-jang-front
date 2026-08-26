import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

/**
 * AuthControls — چیپِ حساب در هدر:
 *   • مهمان → دکمه‌ی ورود/ثبت‌نام
 *   • واردشده بدون عکس → آواتارِ حرفِ اول
 *   • واردشده با عکس → تصویرِ واقعیِ آواتار (URL مطلق‌شده نسبت به بک‌اند)
 *   • منو: جای‌گذاریِ هوشمند (auto-flip + گیرِ افقیِ viewport-safe +
 *     نوکِ فلِّش) — جای‌گزینِ لنگرهای ثابتی که در لبه‌ی هدر بیرون
 *     می‌زدند و در کفِ شیت زیرِ صفحه می‌افتادند.
 *   • variant=block → کارتِ کاملِ حساب (نام + شناسه) برای کفِ شیت.
 */

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { AuthControls } from './AuthControls';
import { setTokens, clearTokens } from '@/lib/auth-tokens';
import { setCachedUser } from '@/lib/auth-user-cache';
import type { AuthUser } from '@/lib/auth';

const USER: AuthUser = {
  id: 7,
  email: 'user@example.com',
  first_name: 'علی',
  last_name: 'رضایی',
  full_name: 'علی رضایی',
  role: 'user',
  is_email_verified: true,
  date_joined: '2023-05-10T10:00:00Z',
  profile: {
    phone_number: null,
    national_code: '',
    birth_date: null,
    gender: '',
    avatar: null,
    bio: '',
    province: '',
    city: '',
    address: '',
  },
};

function login(u: AuthUser = USER) {
  setTokens({ access: 'a', refresh: 'r', persist: true });
  setCachedUser(u);
}

afterEach(() => {
  cleanup();
  clearTokens();
  setCachedUser(null);
});

describe('AuthControls', () => {
  it('مهمان: دکمه‌ی ورود | ثبت‌نام', () => {
    render(<AuthControls onOpen={() => {}} />);
    expect(screen.getByRole('button', { name: /ورود \| ثبت‌نام/ })).toBeTruthy();
  });

  it('واردشده بدون عکس: آواتارِ حرفِ اول نام', () => {
    login();
    render(<AuthControls onOpen={() => {}} />);
    const chip = screen.getByRole('button', { name: 'حساب کاربری علی رضایی' });
    expect(chip.querySelector('img')).toBeNull();
    expect(chip.textContent).toContain('ع');
  });

  it('واردشده با عکس: تصویرِ آواتار با URL مطلقِ بک‌اند', () => {
    login({
      ...USER,
      profile: { ...USER.profile, avatar: '/media/avatars/me.png' },
    });
    render(<AuthControls onOpen={() => {}} />);
    const chip = screen.getByRole('button', { name: 'حساب کاربری علی رضایی' });
    const img = chip.querySelector('img');
    expect(img).not.toBeNull();
    expect(img!.src).toContain('/media/avatars/me.png');
    expect(img!.className).toContain('object-cover');
  });

  it('منو: جای‌گذاریِ هوشمند (پایینِ تریگر به‌صورت پیش‌فرض) + نوکِ فلِّش + لینک پروفایل', () => {
    login();
    render(<AuthControls onOpen={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'حساب کاربری علی رضایی' }));

    const menu = screen.getByRole('menu', { name: 'منوی حساب کاربری' });
    // قراردادِ جای‌گذاری: لایه‌ی بیرونی با anchor مطلق و سمتِ بازشو از
    // rectِ واقعی تصمیم می‌گیرد — در happy-dom فضای پایین صفر-rect
    // همیشه جادار است → down (نه top ثابت، نه translate وسط‌چین).
    const wrapper = menu.parentElement as HTMLElement;
    expect(wrapper.style.top).toContain('calc(100%');
    expect(wrapper.style.bottom).toBe('');
    expect(wrapper.className).not.toContain('-translate-x-1/2');
    // نوکِ فلِّشِ منو همراه است
    expect(screen.getByTestId('account-menu-caret')).toBeTruthy();

    const profileItem = screen.getByRole('menuitem', { name: /حساب کاربری و پروفایل/ });
    expect(profileItem.getAttribute('href')).toBe('/profile');
    expect(screen.getByRole('menuitem', { name: 'خروج از حساب' })).toBeTruthy();
  });

  it('منو: نزدیکِ کفِ ویوپورت، به‌طور خودکار رو به بالا باز می‌شود (auto-flip)', () => {
    login();
    render(<AuthControls onOpen={() => {}} />);
    const chip = screen.getByRole('button', { name: 'حساب کاربری علی رضایی' });
    const wrap = chip.parentElement as HTMLElement;
    // تریگر را به کفِ ویوپورت می‌چسبانیم: فضای پایین ≈ ۱۶px
    wrap.getBoundingClientRect = () =>
      ({
        top: window.innerHeight - 60,
        bottom: window.innerHeight - 16,
        left: 59,
        right: 304,
        width: 245,
        height: 44,
        x: 59,
        y: window.innerHeight - 60,
        toJSON: () => ({}),
      }) as DOMRect;

    fireEvent.click(chip);

    const menu = screen.getByRole('menu', { name: 'منوی حساب کاربری' });
    const wrapper = menu.parentElement as HTMLElement;
    expect(wrapper.style.bottom).toContain('calc(100%');
    expect(wrapper.style.top).toBe('');
  });

  it('variant=block: کارتِ کاملِ حساب با نام + شناسه + منوی تمام‌عرض', () => {
    login();
    render(<AuthControls onOpen={() => {}} variant="block" />);

    const chip = screen.getByRole('button', { name: 'حساب کاربری علی رضایی' });
    expect(chip.textContent).toContain('user@example.com');

    fireEvent.click(chip);
    const menu = screen.getByRole('menu', { name: 'منوی حساب کاربری' });
    const wrapper = menu.parentElement as HTMLElement;
    expect(wrapper.className).toContain('w-full');
    // در حالت block نوکِ فلِّش وسطِ کارت (نه گیر به لبه) قرار می‌گیرد
    const caret = screen.getByTestId('account-menu-caret') as HTMLElement;
    expect(caret.style.left).not.toBe('');
  });
});
