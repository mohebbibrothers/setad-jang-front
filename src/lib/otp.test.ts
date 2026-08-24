import { describe, expect, it } from 'vitest';
import {
  OTP_CODE_LENGTH,
  OTP_RESEND_COOLDOWN_SECONDS,
  OTP_TTL_SECONDS,
  sanitizeOtpInput,
  splitOtp,
  isOtpComplete,
  formatCountdown,
} from './otp';

describe('ثابت‌های قرارداد OTP بک‌اند', () => {
  it('طول ۵، TTL ۳۰۰ ثانیه، cooldown ۶۰ ثانیه', () => {
    expect(OTP_CODE_LENGTH).toBe(5);
    expect(OTP_TTL_SECONDS).toBe(300);
    expect(OTP_RESEND_COOLDOWN_SECONDS).toBe(60);
  });
});

describe('sanitizeOtpInput', () => {
  it('ارقام فارسی را لاتین و غیررقم‌ها را حذف می‌کند', () => {
    expect(sanitizeOtpInput('۱۲۳۴۵')).toBe('12345');
    expect(sanitizeOtpInput('کد شما: 12-345')).toBe('12345');
    expect(sanitizeOtpInput(' 1 2 3 ')).toBe('123');
  });

  it('به طول مجاز کد سقف می‌زند', () => {
    expect(sanitizeOtpInput('123456789')).toBe('12345');
  });
});

describe('splitOtp / isOtpComplete', () => {
  it('رشته‌ی ناقص را با سلول خالی کامل می‌کند', () => {
    expect(splitOtp('12')).toEqual(['1', '2', '', '', '']);
    expect(splitOtp('')).toEqual(['', '', '', '', '']);
  });

  it('کامل‌بودن فقط با طولِ دقیق', () => {
    expect(isOtpComplete('12345')).toBe(true);
    expect(isOtpComplete('1234')).toBe(false);
  });
});

describe('formatCountdown', () => {
  it('ثانیه → m:ss', () => {
    expect(formatCountdown(83)).toBe('1:23');
    expect(formatCountdown(60)).toBe('1:00');
    expect(formatCountdown(5)).toBe('0:05');
    expect(formatCountdown(0)).toBe('0:00');
    expect(formatCountdown(-3)).toBe('0:00');
  });
});
