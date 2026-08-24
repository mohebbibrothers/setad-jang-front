'use client';

/**
 * ورودی رمز عبور — دو حالت:
 *   • حالت ساده (ورود): فقط چشم نمایش/پنهان.
 *   • حالت ساخت (ثبت‌نام/بازیابی): چک‌لیست زنده‌ی قواعد.
 *
 * قواعد آینه‌ی بک‌اند (django validate_password با پیش‌فرض‌های پروژه):
 *   حداقل ۸ کاراکتر · نباید کاملاً عدد باشد.
 * (قاعده‌ی «رمز رایج نباشد» نقطه‌ای قابل اعتبارسنجی سمت کلاینت نیست؛
 *  اگر سرور گفت، همان پیام فارسی‌اش نمایش داده می‌شود.)
 */

import { useState } from 'react';
import { Check, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toLatinDigits } from '@/lib/auth-identifier';
import { Field, inputClass } from './ui';

const MIN_LENGTH = 8;

export function passwordRules(value: string): { minLength: boolean; notNumeric: boolean } {
  return {
    minLength: value.length >= MIN_LENGTH,
    notNumeric: !/^\d+$/.test(toLatinDigits(value)),
  };
}

export function isPasswordAcceptable(value: string): boolean {
  const r = passwordRules(value);
  return r.minLength && r.notNumeric;
}

export function PasswordField({
  id,
  value,
  onChange,
  error,
  label = 'رمز عبور',
  autoComplete = 'current-password',
  withChecklist = false,
  autoFocus,
  disabled,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  label?: string;
  autoComplete?: string;
  /** چک‌لیست زنده‌ی قواعد (برای رمز جدید) */
  withChecklist?: boolean;
  autoFocus?: boolean;
  disabled?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const rules = passwordRules(value);
  const showChecklist = withChecklist && value.length > 0;

  return (
    <Field id={id} label={label} error={error}>
      <div className="relative">
        <input
          id={id}
          name="password"
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          dir="ltr"
          autoFocus={autoFocus}
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={withChecklist ? 'حداقل ۸ کاراکتر' : '••••••••'}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(inputClass(Boolean(error)), 'pl-11 text-left tracking-[0.08em]')}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'پنهان‌کردن رمز' : 'نمایش رمز'}
          aria-pressed={visible}
          className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-700"
        >
          {visible ? (
            <EyeOff className="h-[18px] w-[18px]" />
          ) : (
            <Eye className="h-[18px] w-[18px]" />
          )}
        </button>
      </div>

      {showChecklist ? (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 pt-0.5" aria-live="polite">
          <Rule ok={rules.minLength} label="حداقل ۸ کاراکتر" />
          <Rule ok={rules.notNumeric} label="فقط عدد نباشد" />
        </ul>
      ) : null}
    </Field>
  );
}

function Rule({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li
      className={cn(
        'flex items-center gap-1 text-[11.5px] font-medium transition-colors duration-200',
        ok ? 'text-brand-600' : 'text-ink-500/80',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'flex h-[15px] w-[15px] items-center justify-center rounded-full border transition-all duration-200',
          ok
            ? 'border-brand-500 bg-brand-500 text-white'
            : 'border-ink-200 bg-white text-transparent',
        )}
      >
        <Check className="h-[10px] w-[10px]" strokeWidth={3.5} />
      </span>
      {label}
    </li>
  );
}
