/**
 * AuthFlowSession — حافظه‌ی سشنِ فلوهای احراز هویت (خارج از درخت React).
 *
 * چرا؟ مودال ورود/ثبت‌نام/بازیابی باید مثل اپ‌های کلاس‌جهانی رفتار کند:
 * کاربر تا نیمه‌ی ثبت‌نام می‌رود، تب را عوض می‌کند، حتی مودال را می‌بندد
 * و برمی‌گردد — و فلوش «دقیقاً همان‌جا» منتظرش است؛ کد همچنان ۵ دقیقه
 * TTL دارد و cooldown ارسال مجدد هم از همان لحظه‌ی واقعی ارسال می‌گذرد.
 *
 * دو تصمیم کلیدی معماری:
 *   ۱) state بیرون از کامپوننت‌ها → سوییچ تب دیگر چیزی را unmount-نابود
 *      نمی‌کند (ریشه‌ی باگ «برگشت از اول»)؛
 *   ۲) ددلاین‌ها مطلق‌اند (timestamp) نه شمارنده‌ی نسبی — یعنی تایمرها
 *      روی حقیقتِ زمان سوارند: رفتن به تب دیگر، بستن مودال، یا idle‌شدن
 *      تب مرورگر هیچ‌کدام شمارش را جلو/عقب نمی‌اندازند.
 *
 * چرخه‌ی عمر: به‌ازای هر بار لود صفحه (module scope — مانند هر SPA
 * حرفه‌ای). ریست کامل فقط پس از ورود موفق رخ می‌دهد.
 */

import { useSyncExternalStore } from 'react';
import type { AuthErrorModel } from './auth-errors';

export type AuthFlowKey = 'login' | 'signup' | 'forgot';
export type AuthFlowStep = 'identifier' | 'code' | 'done';
export type LoginMethod = 'password' | 'otp';

export interface AuthFlowDraft {
  /** مرحله‌ی فعلی فلو */
  step: AuthFlowStep;
  /** کد OTPِ در حال تایپ */
  code: string;
  /**
   * رمز: در signup = رمز دلخواه؛ در forgot = رمز جدید.
   * در login-با-رمز عمداً نگهداری نمی‌شود (امنیت: رمز موجود کاربر
   * هرگز در حافظه‌ی سشن کشته نمی‌شود).
   */
  password: string;
  /** نام/نام‌خانوادگی اختیاری (signup) */
  firstName: string;
  lastName: string;
  /** روش منتخب (فقط فلوی login مصرف دارد) */
  method: LoginMethod;
  /** timestamp (ms) پایان cooldown ارسال مجدد — null یعنی فعال است */
  resendAt: number | null;
  /** timestamp (ms) انقضای کد (۵ دقیقه‌ی بک‌اند) — null یعنی کدی صادر نشده */
  expiresAt: number | null;
  /** تلاش‌های ناموفق روی کد فعلی (سقف ۵ در بک‌اند) */
  wrongAttempts: number;
  /** آخرین خطای مرحله‌ی «درخواست کد» (شامل ۴۲۹ با waitSeconds) */
  sendError: AuthErrorModel | null;
}

function createInitialDraft(): AuthFlowDraft {
  return {
    step: 'identifier',
    code: '',
    password: '',
    firstName: '',
    lastName: '',
    method: 'password',
    resendAt: null,
    expiresAt: null,
    wrongAttempts: 0,
    sendError: null,
  };
}

type State = Record<AuthFlowKey, AuthFlowDraft>;

let state: State = {
  login: createInitialDraft(),
  signup: createInitialDraft(),
  forgot: createInitialDraft(),
};

type Listener = () => void;
const listeners = new Set<Listener>();

function emit(): void {
  for (const fn of listeners) fn();
}

export function subscribeAuthFlow(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** اسنپ‌شات پایدار بین رندرها (immutable patch → مرجع فقط با تغییر عوض می‌شود). */
export function getAuthFlowDraft(key: AuthFlowKey): AuthFlowDraft {
  return state[key];
}

export function patchAuthFlow(key: AuthFlowKey, patch: Partial<AuthFlowDraft>): void {
  state = { ...state, [key]: { ...state[key], ...patch } };
  emit();
}

/** فقط فیلدهای OTP ریست می‌شوند؛ پیش‌نویسِ متن‌های کاربر حفظ می‌ماند. */
export function resetAuthFlowOtp(key: AuthFlowKey): void {
  patchAuthFlow(key, { resendAt: null, expiresAt: null, wrongAttempts: 0, sendError: null });
}

export function resetAuthFlow(key: AuthFlowKey): void {
  state = { ...state, [key]: createInitialDraft() };
  emit();
}

/** پس از ورود موفق — سشن احراز هویت کاملاً نو شروع می‌شود. */
export function resetAllAuthFlows(): void {
  state = {
    login: createInitialDraft(),
    signup: createInitialDraft(),
    forgot: createInitialDraft(),
  };
  emit();
}

/** ثانیه‌های باقی تا یک ددلاین مطلق؛ ۰ اگر گذشته/نامشخص. */
export function secondsUntil(ts: number | null, now: number): number {
  if (ts === null) return 0;
  return Math.max(0, Math.ceil((ts - now) / 1000));
}

/** هوک خواندن draft یک فلو — با useSyncExternalStore به استور متصل است. */
export function useAuthFlowDraft(key: AuthFlowKey): AuthFlowDraft {
  return useSyncExternalStore(
    subscribeAuthFlow,
    () => getAuthFlowDraft(key),
    () => getAuthFlowDraft(key),
  );
}
