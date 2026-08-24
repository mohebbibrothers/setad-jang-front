/**
 * ابزارهای خالصِ ورودی کد یکبارمصرف — بدون DOM، کاملاً تست‌پذیر.
 *
 * قرارداد بک‌اند (otp.py):
 *   طول کد = ۵ رقم، TTL = ۳۰۰ ثانیه، حداکثر ۵ تلاش اشتباه،
 *   cooldown ارسال مجدد = ۶۰ ثانیه.
 */

import { toLatinDigits } from './auth-identifier';

export const OTP_CODE_LENGTH = 5;
export const OTP_TTL_SECONDS = 5 * 60;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;

/**
 * هر ورودیِ کاربر (تایپ/پیست، ارقام فارسی یا لاتین) → رشته‌ی تمیزِ
 * فقط‌رقمی با سقف طولِ کد. حرف/فاصله/انتهای خط همه حذف می‌شوند تا
 * پیستِ «کد شما: ۱۲۳۴۵» هم بی‌دردسر کار کند.
 */
export function sanitizeOtpInput(raw: string, length: number = OTP_CODE_LENGTH): string {
  return toLatinDigits(raw).replace(/\D/g, '').slice(0, length);
}

/** رشته‌ی کد → آرایه‌ی سلول‌ها با طول ثابت (سلول خالی = ''). */
export function splitOtp(value: string, length: number = OTP_CODE_LENGTH): string[] {
  const cells: string[] = [];
  for (let i = 0; i < length; i += 1) cells.push(value[i] ?? '');
  return cells;
}

/** آیا کد کامل شده؟ (پیش‌شرط فعال‌شدنِ دکمه‌ی تأیید) */
export function isOtpComplete(value: string, length: number = OTP_CODE_LENGTH): boolean {
  return value.length === length;
}

/** فرمت نمایش شمارش‌معکوس: 83 → «۱:۲۳» (ارقام لاتین برای خوانایی در ترکیب متن فارسی). */
export function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const min = Math.floor(s / 60);
  const sec = s % 60;
  return `${min}:${String(sec).padStart(2, '0')}`;
}
