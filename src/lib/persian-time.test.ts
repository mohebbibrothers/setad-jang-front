import { describe, expect, it } from 'vitest';
import {
  formatJalaliDate,
  formatJalaliDateTime,
  formatJalaliYearMonth,
  formatRelativeFa,
} from './persian-time';

/** ساعتِ محلیِ تست ۲۰۲۴-۰۵-۰۳ ساعت ۲۱:۴۵ (۱۴ اردیبهشت ۱۴۰۳) */
const BASE = new Date(2024, 4, 3, 21, 45, 30);

describe('persian-time — تاریخ جلالی', () => {
  it('formatJalaliDate با ارقام و نام ماهِ فارسی', () => {
    expect(formatJalaliDate(BASE)).toBe('۱۴ اردیبهشت ۱۴۰۳');
    expect(formatJalaliDate(new Date(2024, 2, 20))).toBe('۱ فروردین ۱۴۰۳');
  });

  it('formatJalaliYearMonth برای «عضو از …»', () => {
    expect(formatJalaliYearMonth(BASE)).toBe('اردیبهشت ۱۴۰۳');
  });

  it('formatJalaliDateTime شامل ساعتِ دودیجیت است', () => {
    expect(formatJalaliDateTime(BASE)).toBe('۱۴ اردیبهشت ۱۴۰۳، ۲۱:۴۵');
    expect(formatJalaliDateTime(new Date(2024, 4, 3, 7, 5))).toBe('۱۴ اردیبهشت ۱۴۰۳، ۰۷:۰۵');
  });

  it('ورودی خراب/خالی → رشته‌ی خالی', () => {
    expect(formatJalaliDate(null)).toBe('');
    expect(formatJalaliDate('not-a-date')).toBe('');
    expect(formatJalaliYearMonth('')).toBe('');
    expect(formatJalaliDateTime(undefined)).toBe('');
  });
});

describe('persian-time — زمان نسبی (ساعتِ منجمد)', () => {
  const now = BASE.getTime();

  it('محدوده‌های «پیش»', () => {
    expect(formatRelativeFa(new Date(now - 10_000), now)).toBe('هم‌اکنون');
    expect(formatRelativeFa(new Date(now - 60_000), now)).toBe('۱ دقیقه پیش');
    expect(formatRelativeFa(new Date(now - 5 * 60_000), now)).toBe('۵ دقیقه پیش');
    expect(formatRelativeFa(new Date(now - 3 * 3_600_000), now)).toBe('۳ ساعت پیش');
    expect(formatRelativeFa(new Date(now - 2 * 86_400_000), now)).toBe('۲ روز پیش');
    expect(formatRelativeFa(new Date(now - 14 * 86_400_000), now)).toBe('۲ هفته پیش');
  });

  it('زمانِ آینده (انقضا) → «مانده»', () => {
    expect(formatRelativeFa(new Date(now + 10 * 60_000), now)).toBe('۱۰ دقیقه مانده');
    expect(formatRelativeFa(new Date(now + 5 * 3_600_000), now)).toBe('۵ ساعت مانده');
  });

  it('قدیمی‌تر از یک ماه → خودِ تاریخ جلالی', () => {
    expect(formatRelativeFa(new Date(now - 40 * 86_400_000), now)).toBe('۵ فروردین ۱۴۰۳');
  });

  it('ورودی نامعتبر → رشته‌ی خالی', () => {
    expect(formatRelativeFa(null, now)).toBe('');
    expect(formatRelativeFa('invalid', now)).toBe('');
  });
});
