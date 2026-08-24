import { describe, expect, it } from 'vitest';
import {
  detectIdentifierKind,
  validateIdentifier,
  prepareIdentifierForSubmit,
  formatIdentifierForDisplay,
  toLatinDigits,
} from './auth-identifier';

/**
 * آینه‌ی رفتاری apps/authentication/normalizers.py — اگر بک‌اند ورودی‌ای
 * را می‌پذیرد، validateIdentifier نباید آن را رد کند (تداخل صفر با سرور).
 */
describe('toLatinDigits', () => {
  it('ارقام فارسی و عربی را به لاتین تبدیل می‌کند', () => {
    expect(toLatinDigits('۰۹۱۲۳۴۵۶۷۸۹')).toBe('09123456789');
    expect(toLatinDigits('٠٩١٢٣')).toBe('09123');
  });
});

describe('detectIdentifierKind', () => {
  it.each([
    ['user@example.com', 'email'],
    ['USER@Example.COM ', 'email'],
    ['09120000000', 'phone'],
    ['9120000000', 'phone'],
    ['+989120000000', 'phone'],
    ['00989120000000', 'phone'],
    ['۰۹۱۲ ۰۰۰ ۰۰۰۰', 'phone'],
    ['+1 (202) 555-0123', 'phone'],
  ] as const)('%s → %s', (input, expected) => {
    expect(detectIdentifierKind(input)).toBe(expected);
  });

  it.each(['', '   ', 'abc', '09ab'])('%s → null', (input) => {
    expect(detectIdentifierKind(input)).toBeNull();
  });

  it('«@@» هم مثل بک‌اند ایمیل دانسته و بعداً در مرحله‌ی اعتبارسنجی رد می‌شود', () => {
    expect(detectIdentifierKind('@@')).toBe('email');
  });
});

describe('validateIdentifier', () => {
  it.each([
    '09120000000',
    '9120000000',
    '989120000000',
    '+989120000000',
    '00989120000000',
    '+98 912 000 0000',
    '+98-912-000-0000',
    '+1234567890',
    '442071234567', // حالت ۳ بک‌اند: کد کشور بدون +
    'user@example.com',
    'a.b-c+d@sub.domain.co',
    '۰۹۱۲۳۴۵۶۷۸۹', // ارقام فارسی هم پذیرفته می‌شود
  ])('معتبر: %s', (input) => {
    expect(validateIdentifier(input)).toBeNull();
  });

  it('خالی → پیام خالی‌بودن', () => {
    expect(validateIdentifier('   ')).toBe('شناسه نمی‌تواند خالی باشد.');
  });

  it.each([
    ['user@', 'فرمت ایمیل نامعتبر است.'],
    ['user@x.c', 'فرمت ایمیل نامعتبر است.'],
    ['a@@b.com', 'فرمت ایمیل نامعتبر است.'],
    ['0912', 'شماره موبایل بسیار کوتاه است.'],
    // بک‌اند هر صفرِ غیر ۰۹... را با همین پیام رد می‌کند (حالت ۱)
    ['08120000000', 'شماره موبایل ایرانی نامعتبر است.'],
    // ۱۰ رقمِ غیرایرانی بدون + (حالت ۲/۳/۴ هیچ‌کدام)
    ['8120000000', 'فرمت شماره موبایل نامعتبر است.'],
    ['0912000000a', 'نوع شناسه قابل تشخیص نیست. لطفاً ایمیل یا شماره موبایل معتبر وارد کنید.'],
  ])('نامعتبر: %s', (input, expected) => {
    expect(validateIdentifier(input)).toBe(expected);
  });
});

describe('prepareIdentifierForSubmit', () => {
  it('فقط trim و لاتین‌سازی — نرمال‌سازی کامل به بک‌اند سپرده می‌شود', () => {
    expect(prepareIdentifierForSubmit('  ۰۹۱۲ ۰۰۰ ۰۰۰۰ ')).toBe('0912 000 0000');
    expect(prepareIdentifierForSubmit(' User@X.com ')).toBe('User@X.com');
  });
});

describe('formatIdentifierForDisplay', () => {
  it.each([
    ['09120000000', '0912 000 0000'],
    ['9120000000', '0912 000 0000'],
    ['+989120000000', '0912 000 0000'],
    ['00989120000000', '0912 000 0000'],
    ['989120000000', '0912 000 0000'],
  ])('%s → %s', (input, expected) => {
    expect(formatIdentifierForDisplay(input)).toBe(expected);
  });

  it('ایمیل و شماره‌ی غیرایرانی دست‌نخورده می‌ماند', () => {
    expect(formatIdentifierForDisplay('user@example.com')).toBe('user@example.com');
    expect(formatIdentifierForDisplay('+1234567890')).toBe('+1234567890');
  });
});
