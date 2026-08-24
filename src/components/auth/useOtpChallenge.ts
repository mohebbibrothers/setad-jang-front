'use client';

/**
 * useOtpChallenge — مغز مشترک هر سه فلوی «درخواست کد → تأیید کد».
 *
 * مسئولیت‌ها (همگی از قرارداد خوانده‌شده‌ی بک‌اند):
 *   • ارسال درخواست OTP با همان identifier؛
 *   • شمارش‌معکوس ارسال مجدد — پیش‌فرض ۶۰ ثانیه (otp.py) ولی اگر سرور
 *     429 داد، دقیقاً با همان ثانیه‌ای که خودش گفته سینک می‌شود؛
 *   • TTL نمایشی ۵ دقیقه (اعتبار کد) که با هر ارسال موفق ریست می‌شود؛
 *   • شمارش تلاش‌های اشتباه سمت کلاینت (سقف ۵ در بک‌اند — پس از آن
 *     باید کد جدید گرفت) و پیامِ راهنمای متناسب؛
 *   • خروجی خطا همیشه به مدلِ یکپارچه‌ی coerceAuthError تبدیل می‌شود.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { AuthChallengeResult } from '@/lib/auth';
import { coerceAuthError, type AuthErrorModel } from '@/lib/auth-errors';
import { OTP_MAX_ATTEMPTS, OTP_RESEND_COOLDOWN_SECONDS, OTP_TTL_SECONDS } from '@/lib/otp';

export type OtpChallenge = {
  /** در حال ارسال درخواست کد */
  sending: boolean;
  /** ثانیه‌های باقی تا فعال‌شدن «ارسال مجدد» */
  resendIn: number;
  /** ثانیه‌های باقی‌مانده‌ی اعتبار کد (۵ دقیقه) */
  ttlIn: number;
  /** تعداد تلاش‌های ناموفق روی همین کد */
  wrongAttempts: number;
  maxAttempts: number;
  /** آیا کد عملاً از کار افتاده و باید کد جدید گرفت؟ */
  exhausted: boolean;
  /** آخرین خطای مرحله‌ی درخواست */
  sendError: AuthErrorModel | null;
  /** ارسال (یا ارسال مجدد) کد؛ true یعنی کد صادر و تایمرها ریست شدند */
  send: () => Promise<boolean>;
  /** قبل از تأیید: خواندن پیام مناسب باتوجه‌به وضعیت */
  markWrongAttempt: (model: AuthErrorModel) => void;
  reset: () => void;
};

export function useOtpChallenge(options: {
  identifier: string;
  request: (identifier: string) => Promise<AuthChallengeResult>;
}): OtpChallenge {
  const { identifier, request } = options;
  const [sending, setSending] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [ttlIn, setTtlIn] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [sendError, setSendError] = useState<AuthErrorModel | null>(null);
  const requestRef = useRef(request);
  requestRef.current = request;

  // تایمر واحد برای هر دو شمارش‌معکوس
  useEffect(() => {
    if (resendIn <= 0 && ttlIn <= 0) return;
    const t = window.setInterval(() => {
      setResendIn((s) => (s > 0 ? s - 1 : 0));
      setTtlIn((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => window.clearInterval(t);
  }, [resendIn, ttlIn]);

  const reset = useCallback(() => {
    setResendIn(0);
    setTtlIn(0);
    setWrongAttempts(0);
    setSendError(null);
  }, []);

  const send = useCallback(async (): Promise<boolean> => {
    if (sending) return false;
    setSending(true);
    setSendError(null);
    try {
      await requestRef.current(identifier);
      setResendIn(OTP_RESEND_COOLDOWN_SECONDS);
      setTtlIn(OTP_TTL_SECONDS);
      setWrongAttempts(0);
      return true;
    } catch (err) {
      const model = coerceAuthError(err);
      // اگر سرور گفت «کمی صبر کن»، همان را مبنای شمارش‌معکوس می‌گذاریم —
      // اعتبار این عدد متعلق به سرور است نه حدسِ کلاینت.
      if (model.kind === 'cooldown' && model.waitSeconds) {
        setResendIn(model.waitSeconds);
      }
      setSendError(model);
      return false;
    } finally {
      setSending(false);
    }
  }, [identifier, sending]);

  const markWrongAttempt = useCallback((model: AuthErrorModel) => {
    setWrongAttempts((n) => Math.min(n + 1, OTP_MAX_ATTEMPTS));
    // «کد نامعتبر یا منقضی» یا «تلاش‌ها زیاد» → TTL عملاً تمام است
    if (/منقضی|تلاش‌های اشتباه/.test(model.message)) setTtlIn(0);
  }, []);

  return {
    sending,
    resendIn,
    ttlIn,
    wrongAttempts,
    maxAttempts: OTP_MAX_ATTEMPTS,
    exhausted: ttlIn === 0 || wrongAttempts >= OTP_MAX_ATTEMPTS,
    sendError,
    send,
    markWrongAttempt,
    reset,
  };
}
