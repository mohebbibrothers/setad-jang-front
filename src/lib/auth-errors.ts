/**
 * نگاشت یکپارچه‌ی خطاهای احراز هویت بک‌اند → مدل نمایشی فرانت.
 *
 * منابع قرارداد (همگی خوانده و قفل‌شده‌اند):
 *   - apps/core/exceptions.py       → envelope خطا: {message, errors}, و
 *     Throttled → «تعداد درخواست‌ها بیش از حد مجاز است. لطفاً N ثانیه صبر کنید.»
 *   - authentication/services.py    → «لطفاً N ثانیه دیگر تلاش کنید.» (429)
 *     «کد وارد شده اشتباه است.» / «کد نامعتبر یا منقضی شده است. …» (400)
 *   - authentication/views.py       → 401 «شناسه یا رمز عبور اشتباه است.»
 *     403 «حساب کاربری غیرفعال است.» / «شناسه اصلی شما هنوز تأیید نشده است.»
 *   - 503 OTPDelivery → «در ارسال کد خطایی رخ داد. …»
 *
 * هر دو قالبِ پیامِ cooldown رقم ثانیه را در خود دارند؛ پس UI با
 * parseWaitSeconds شمارش‌معکوسش را «دقیق» از خودِ سرور می‌گیرد نه حدس.
 */

import { ApiError } from './api';

export type AuthErrorKind =
  | 'credential' // 401/403 — شناسه/رمز، غیرفعال، تأییدنشده
  | 'validation' // 400 — خطای فیلد/کد
  | 'cooldown' // 429 — ثراتل یا cooldown فعال (همراه ثانیه)
  | 'delivery' // 503 — سرویس پیام/ایمیل
  | 'network' // قطعی شبکه (status=0)
  | 'unknown';

export type AuthErrorModel = {
  /** پیام آماده‌ی نمایش (همیشه فارسی و انسانی) */
  message: string;
  kind: AuthErrorKind;
  /** ثانیه‌های باقی‌مانده در خطای 429 (اگر از پیام استخراج شده باشد) */
  waitSeconds?: number;
  /** خطای سطح فیلد برای چسبیدن به ورودیِ مربوط (اگر موجود باشد) */
  fieldErrors: {
    identifier?: string;
    code?: string;
    password?: string;
  };
};

/** «N ثانیه» را از هر دو قالبِ پیامِ بک‌اند بیرون می‌کشد. */
export function parseWaitSeconds(message: string): number | null {
  const m = message.match(/(\d+)\s*ثانیه/);
  if (!m) return null;
  const n = Number.parseInt(m[1], 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** اولین پیامِ غیرخالیِ یک مقدارِ errorsِ DRF (رشته/آرایه/شیء تودرتو). */
function firstDeepString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const s = firstDeepString(item);
      if (s) return s;
    }
  }
  if (value && typeof value === 'object') {
    for (const item of Object.values(value as Record<string, unknown>)) {
      const s = firstDeepString(item);
      if (s) return s;
    }
  }
  return null;
}

const FIELD_MAP: Array<[readonly string[], 'identifier' | 'code' | 'password']> = [
  [['identifier'], 'identifier'],
  [['code'], 'code'],
  [['password', 'new_password'], 'password'],
];

export function coerceAuthError(err: unknown): AuthErrorModel {
  const fallback: AuthErrorModel = {
    message: 'خطایی رخ داد. لطفاً دوباره تلاش کنید.',
    kind: 'unknown',
    fieldErrors: {},
  };

  if (!(err instanceof ApiError)) return fallback;

  if (err.status === 0) {
    return {
      ...fallback,
      kind: 'network',
      message: 'اتصال به سرور برقرار نشد. اینترنت خود را بررسی کنید و دوباره تلاش کنید.',
    };
  }

  const errors = (err.errors ?? {}) as Record<string, unknown>;
  const fieldErrors: AuthErrorModel['fieldErrors'] = {};
  for (const [keys, target] of FIELD_MAP) {
    for (const key of keys) {
      const s = firstDeepString(errors[key]);
      if (s) {
        fieldErrors[target] = s;
        break;
      }
    }
  }
  // خطاهای non-field (raise در validate() سریالایزر — مثل «این شناسه
  // قبلاً ثبت شده است.») روی کلید non_field_errors می‌آیند.
  const nonField = firstDeepString(errors['non_field_errors']);

  if (err.status === 429) {
    return {
      message: err.message,
      kind: 'cooldown',
      waitSeconds: parseWaitSeconds(err.message) ?? undefined,
      fieldErrors,
    };
  }
  if (err.status === 503) {
    return {
      message: err.message || 'سرویس ارسال کد موقتاً در دسترس نیست.',
      kind: 'delivery',
      fieldErrors,
    };
  }
  if (err.status === 401 || err.status === 403) {
    return { message: err.message, kind: 'credential', fieldErrors };
  }
  if (err.status === 400) {
    return {
      message:
        nonField ??
        fieldErrors.identifier ??
        fieldErrors.code ??
        fieldErrors.password ??
        err.message,
      kind: 'validation',
      fieldErrors,
    };
  }
  return { ...fallback, message: err.message || fallback.message, fieldErrors };
}
