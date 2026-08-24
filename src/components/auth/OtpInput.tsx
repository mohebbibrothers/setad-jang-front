'use client';

/**
 * ورودی کد یکبارمصرف ۵خانه — پرمیر در تعامل:
 *   • تایپ → پرش خودکار به خانه‌ی بعد؛ Backspace روی خانه‌ی خالی →
 *     برگشت و پاک‌کردن خانه‌ی قبلی؛
 *   • پیست در هر خانه → توزیع ارقام از همان خانه (متن «کد شما: ۱۲۳۴۵»
 *     هم به‌خاطر sanitizeOtpInput تمیز می‌شود)؛
 *   • ارقام فارسی/عربی لاتین می‌شوند؛ ناوبری با ←→؛
 *   • ردیف خانه‌ها LTR (ارقام ذاتاً چپ‌به‌راست‌اند) ولی متن‌های اطراف RTL؛
 *   • autoComplete="one-time-code" روی اولین خانه برای autofill موبایل.
 *
 * منطق خالص (sanitize/split) در lib/otp است و تست‌پوششی دارد.
 */

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { OTP_CODE_LENGTH, isOtpComplete, sanitizeOtpInput, splitOtp } from '@/lib/otp';

export function OtpInput({
  id,
  value,
  onChange,
  onComplete,
  invalid,
  disabled,
  autoFocus,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  /** وقتی هر ۵ رقم کامل شد (برای سابمیت خودکار) */
  onComplete?: (code: string) => void;
  invalid?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  const cells = splitOtp(value);
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  const focusCell = (index: number, select = true) => {
    const el = refs.current[index];
    if (!el) return;
    el.focus();
    if (select) el.select();
  };

  const commit = (next: string, focusIndex?: number) => {
    onChange(next);
    if (focusIndex !== undefined) focusCell(Math.min(focusIndex, OTP_CODE_LENGTH - 1));
    if (isOtpComplete(next)) onComplete?.(next);
  };

  const handleChange = (index: number, raw: string) => {
    const digits = sanitizeOtpInput(raw);
    if (!digits) return;
    // چند رقم یک‌جا (autofill/پیست در خود فیلد) → از همین خانه توزیع
    const head = value.slice(0, index);
    const merged = sanitizeOtpInput(head + digits + value.slice(index + digits.length));
    commit(merged, index + digits.length);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (cells[index]) {
        commit(value.slice(0, index) + value.slice(index + 1), index);
      } else if (index > 0) {
        commit(value.slice(0, index - 1) + value.slice(index), index - 1);
      }
      return;
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (index < OTP_CODE_LENGTH - 1) focusCell(index + 1);
      return;
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (index > 0) focusCell(index - 1);
      return;
    }
    if (e.key === 'Delete') {
      e.preventDefault();
      commit('', 0);
    }
  };

  const handlePaste = (index: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const digits = sanitizeOtpInput(e.clipboardData.getData('text'));
    if (!digits) return;
    const head = value.slice(0, index);
    commit(sanitizeOtpInput(head + digits), Math.min(index + digits.length, OTP_CODE_LENGTH - 1));
  };

  useEffect(() => {
    if (autoFocus) focusCell(0);
  }, [autoFocus]);

  return (
    <div
      dir="ltr"
      role="group"
      aria-label="کد یکبارمصرف پنج‌رقمی"
      className="flex justify-center gap-2.5 sm:gap-3"
    >
      {cells.map((cell, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          id={i === 0 ? id : undefined}
          type="text"
          inputMode="numeric"
          dir="ltr"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          aria-label={`رقم ${i + 1} از ${OTP_CODE_LENGTH}`}
          maxLength={OTP_CODE_LENGTH}
          disabled={disabled}
          value={cell}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => handlePaste(i, e)}
          onFocus={(e) => e.target.select()}
          className={cn(
            'h-14 w-12 rounded-xl border bg-ink-50/60 text-center text-[22px] font-extrabold tabular-nums text-ink-900 sm:h-[60px] sm:w-[52px]',
            'caret-brand-500 outline-none transition-all duration-150 focus:bg-white focus:ring-4',
            invalid
              ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/15'
              : cell
                ? 'border-brand-500/60 focus:border-brand-500 focus:ring-brand-500/15'
                : 'border-ink-200 focus:border-brand-500 focus:ring-brand-500/15',
            disabled && 'opacity-60',
          )}
        />
      ))}
    </div>
  );
}
