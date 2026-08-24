'use client';

/**
 * OtpStep — پنل مشترک «کد را وارد کن» برای هر سه فلو (ورود OTP،
 * ثبت‌نام، بازیابی). متن مقصد + ورودی ۵خانه + تایمر ارسال مجدد +
 * اعتبار کد + راهنمای تلاش‌های ناموفق، همه از روی state هوک
 * useOtpChallenge که خودش با ثابت‌های بک‌اند سینک است.
 */

import { Pencil, RotateCw, TimerReset } from 'lucide-react';
import { formatIdentifierForDisplay } from '@/lib/auth-identifier';
import { formatCountdown } from '@/lib/otp';
import { cn } from '@/lib/utils';
import { Alert } from './ui';
import { OtpInput } from './OtpInput';
import type { OtpChallenge } from './useOtpChallenge';

export function OtpStep({
  id,
  identifier,
  code,
  onCodeChange,
  onComplete,
  challenge,
  onEditIdentifier,
  invalid,
  disabled,
  intro,
}: {
  id: string;
  identifier: string;
  code: string;
  onCodeChange: (code: string) => void;
  onComplete?: (code: string) => void;
  challenge: OtpChallenge;
  onEditIdentifier: () => void;
  invalid?: boolean;
  disabled?: boolean;
  /** جمله‌ی کانال ارسال؛ پیش‌فرض بر اساس شکل شناسه ساخته می‌شود */
  intro?: string;
}) {
  const display = formatIdentifierForDisplay(identifier);
  const { resendIn, ttlIn, sending, send, wrongAttempts, maxAttempts, exhausted } = challenge;

  return (
    <div className="space-y-4">
      <Alert kind="info">
        {intro ?? (
          <>
            کد تأیید به{' '}
            <bdi dir="ltr" className="font-bold">
              {display}
            </bdi>{' '}
            ارسال شد.{' '}
            <button
              type="button"
              onClick={onEditIdentifier}
              className="inline-flex items-center gap-1 font-bold text-brand-700 underline-offset-2 transition-colors hover:text-brand-600 hover:underline"
            >
              <Pencil className="h-3.5 w-3.5" />
              ویرایش شناسه
            </button>
          </>
        )}
      </Alert>

      <OtpInput
        id={id}
        value={code}
        onChange={onCodeChange}
        onComplete={onComplete}
        invalid={invalid}
        disabled={disabled}
        autoFocus
      />

      {/* TTL + هشدار تلاش‌ها */}
      <div className="flex items-center justify-between text-[11.5px] font-medium leading-5">
        <span
          className={cn('flex items-center gap-1', exhausted ? 'text-rose-600' : 'text-ink-500')}
        >
          <TimerReset className="h-3.5 w-3.5" />
          {ttlIn > 0 ? `اعتبار کد: ${formatCountdown(ttlIn)}` : 'کد منقضی شده است — کد جدید بگیرید'}
        </span>
        {wrongAttempts > 0 && !exhausted && (
          <span className="text-amber-600">
            {wrongAttempts} از {maxAttempts} تلاش ناموفق
          </span>
        )}
      </div>

      {/* ارسال مجدد */}
      <div className="flex items-center justify-center gap-1.5 text-[12.5px] text-ink-500">
        <span>کد را دریافت نکردید؟</span>
        <button
          type="button"
          onClick={() => void send()}
          disabled={resendIn > 0 || sending || disabled}
          className={cn(
            'inline-flex items-center gap-1 rounded-md px-1 font-bold transition-colors',
            resendIn > 0 || sending
              ? 'cursor-not-allowed text-ink-500/60'
              : 'text-brand-700 underline-offset-2 hover:text-brand-600 hover:underline',
          )}
        >
          <RotateCw className={cn('h-3.5 w-3.5', sending && 'animate-spin')} />
          {resendIn > 0 ? `ارسال مجدد (${formatCountdown(resendIn)})` : 'ارسال مجدد کد'}
        </button>
      </div>
    </div>
  );
}
