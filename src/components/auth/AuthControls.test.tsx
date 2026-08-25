import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

/**
 * AuthControls — چیپِ حساب در هدر:
 *   • مهمان → دکمه‌ی ورود/ثبت‌نام
 *   • واردشده بدون عکس → آواتارِ حرفِ اول
 *   • واردشده با عکس → تصویرِ واقعیِ آواتار (URL مطلق‌شده نسبت به بک‌اند)
 *   • منو: دقیقاً وسط‌چینِ تریگر (قراردادِ -translate-x-1/2) + آیتم‌های
 *     وسط‌چین + لینک پروفایل.
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

  it('منو: وسط‌چینِ دقیقِ زیر تریگر + آیتم‌های وسط‌چین + لینک پروفایل', () => {
    login();
    render(<AuthControls onOpen={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'حساب کاربری علی رضایی' }));

    const menu = screen.getByRole('menu', { name: 'منوی حساب کاربری' });
    // قراردادِ جای‌گذاری: wrapper اطرافِ منو وسط‌چینِ تریگر است
    const wrapper = menu.parentElement as HTMLElement;
    expect(wrapper.className).toContain('left-1/2');
    expect(wrapper.className).toContain('-translate-x-1/2');

    const profileItem = screen.getByRole('menuitem', { name: /حساب کاربری و پروفایل/ });
    expect(profileItem.getAttribute('href')).toBe('/profile');
    expect(profileItem.className).toContain('justify-center');
    expect(screen.getByRole('menuitem', { name: 'خروج از حساب' }).className).toContain(
      'justify-center',
    );
  });
});
