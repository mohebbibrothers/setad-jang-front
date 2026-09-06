/**
 * ابزارهای خالصِ ورودی کد یکبارمصرف — بدون DOM، کاملاً تست‌پذیر.
 *
 * قرارداد بک‌اند (apps/authentication/otp.py):
 *   طول کد = ۶ رقم (AUTH_OTP_CODE_LENGTH)، TTL = ۳۰۰ ثانیه
 *   (AUTH_OTP_TTL_SECONDS)، حداکثر ۵ تلاش اشتباه
 *   (AUTH_OTP_MAX_ATTEMPTS)، cooldown ارسال مجدد = ۶۰ ثانیه
 *   (AUTH_OTP_COOLDOWN_SECONDS).
 *
 *   این مقادیر از روی خودِ فایل خوانده شده‌اند؛ اگر بک‌اند تنظیمات را
 *   عوض کند، همین‌جا باید به‌روز شود (تست‌ها آن را قفل می‌کنند).
 */

import { toLatinDigits } from './auth-identifier';

export const OTP_CODE_LENGTH = 6;
export const OTP_TTL_SECONDS = 5 * 60;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;

/** برچسب فارسیِ طول کد — برای جمله‌های «کد شش‌رقمی…» بدون هاردکد پراکنده. */
export const OTP_CODE_LENGTH_FA = 'شش‌رقمی';

/**
 * هر ورودیِ کاربر (تایپ/پیست، ارقام فارسی یا لاتین) → رشته‌ی تمیزِ
 * فقط‌رقمی با سقف طولِ کد. حرف/فاصله/انتهای خط همه حذف می‌شوند تا
 * پیستِ «کد شما: ۱۲۳۴۵۶» هم بی‌دردسر کار کند.
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
