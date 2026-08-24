'use client';

/**
 * useOtpChallenge — مغز مشترک هر سه فلوی «درخواست کد → تأیید کد».
 *
 * نسخه‌ی store-backed: همه‌ی فیلدهای زنده (cooldown، TTL، تلاش‌های
 * ناموفق، آخرین خطای ارسال) در auth-flow-session می‌نشینند و با
 * ددلاینِ مطلق (timestamp) سنجیده می‌شوند؛ پس سوییچ تب ورود/ثبت‌نام،
 * بستن و بازکردن مجدد مودال، یا رفتن به تب دیگرِ مرورگر — هیچ‌کدام
 * تایمر یا پیشرفت را نمی‌شکنند.
 *
 * خواندن این فایل با ثابت‌های otp.py بک‌اند یکی است:
 *   کد ۵ رقمی · TTL ۳۰۰ ثانیه · ۵ تلاش · cooldown ۶۰ ثانیه.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { AuthChallengeResult } from '@/lib/auth';
import { coerceAuthError, type AuthErrorModel } from '@/lib/auth-errors';
import {
  patchAuthFlow,
  resetAuthFlowOtp,
  secondsUntil,
  useAuthFlowDraft,
  type AuthFlowKey,
} from '@/lib/auth-flow-session';
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
  /** ارسال (یا ارسال مجدد) کد؛ true یعنی کد صادر و ددلاین‌ها ریست شدند */
  send: () => Promise<boolean>;
  /** ثبت یک تلاش ناموفق در verify (از مدل خطای هماهنگ بک‌اند) */
  markWrongAttempt: (model: AuthErrorModel) => void;
  reset: () => void;
};

export function useOtpChallenge(options: {
  flow: AuthFlowKey;
  identifier: string;
  request: (identifier: string) => Promise<AuthChallengeResult>;
}): OtpChallenge {
  const { flow, identifier, request } = options;
  const draft = useAuthFlowDraft(flow);
  const [sending, setSending] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const requestRef = useRef(request);
  requestRef.current = request;

  const resendIn = secondsUntil(draft.resendAt, now);
  const ttlIn = secondsUntil(draft.expiresAt, now);

  // تپش یک‌ثانیه‌ای فقط تا وقتی ددلاینی در آینده هست — بدون تیکِ الکی.
  useEffect(() => {
    const pending =
      secondsUntil(draft.resendAt, Date.now()) > 0 || secondsUntil(draft.expiresAt, Date.now()) > 0;
    if (!pending) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [draft.resendAt, draft.expiresAt]);

  const reset = useCallback(() => {
    resetAuthFlowOtp(flow);
  }, [flow]);

  const send = useCallback(async (): Promise<boolean> => {
    if (sending) return false;
    setSending(true);
    try {
      await requestRef.current(identifier);
      patchAuthFlow(flow, {
        resendAt: Date.now() + OTP_RESEND_COOLDOWN_SECONDS * 1000,
        expiresAt: Date.now() + OTP_TTL_SECONDS * 1000,
        wrongAttempts: 0,
        sendError: null,
      });
      return true;
    } catch (err) {
      const model = coerceAuthError(err);
      patchAuthFlow(flow, {
        sendError: model,
        // اگر سرور گفت «کمی صبر کن»، همان ثانیه را مبنای ددلاین می‌گذاریم —
        // اعتبار این عدد متعلق به سرور است نه حدسِ کلاینت.
        ...(model.kind === 'cooldown' && model.waitSeconds
          ? { resendAt: Date.now() + model.waitSeconds * 1000 }
          : {}),
      });
      return false;
    } finally {
      setSending(false);
    }
  }, [flow, identifier, sending]);

  const markWrongAttempt = useCallback(
    (model: AuthErrorModel) => {
      const next: Partial<Parameters<typeof patchAuthFlow>[1]> = {
        wrongAttempts: Math.min(draft.wrongAttempts + 1, OTP_MAX_ATTEMPTS),
      };
      // «کد نامعتبر یا منقضی» / «تلاش‌های اشتباه زیاد» → TTL عملاً تمام است
      if (/منقضی|تلاش‌های اشتباه/.test(model.message)) next.expiresAt = null;
      patchAuthFlow(flow, next);
    },
    [draft.wrongAttempts, flow],
  );

  return {
    sending,
    resendIn,
    ttlIn,
    wrongAttempts: draft.wrongAttempts,
    maxAttempts: OTP_MAX_ATTEMPTS,
    exhausted: draft.wrongAttempts >= OTP_MAX_ATTEMPTS || (draft.expiresAt !== null && ttlIn === 0),
    sendError: draft.sendError,
    send,
    markWrongAttempt,
    reset,
  };
}
