'use client';

/**
 * ورودی رمز عبور — سه لایه:
 *   • حالت ساده (ورود): فقط چشم نمایش/پنهان.
 *   • حالت ساخت (رمز جدید): **متر قدرت چرخه‌ی رنگ** + چک‌لیست زنده‌ی
 *     قواعد که آینه‌ی دقیقِ AUTH_PASSWORD_VALIDATORS بک‌اند است
 *     (سیاست بومی + جنگو → lib/password-policy).
 *
 * معنای هر تحول در این ورودی:
 *   متر یک «نمره‌ی اعتماد» است که زیر دست کاربر بالا می‌رود (۰..۴)،
 *   چک‌لیست می‌گوید از کدام قاعده‌ی بک‌اند نقض می‌خورید، و پیامِ نهایی
 *   سرور هم اگر برگردد، درست روی همین فیلد می‌نشیند (error prop).
 */

import { useMemo, useState } from 'react';
import { Check, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  analyzePassword,
  isPasswordAcceptable,
  PASSWORD_RULE_LABELS,
  SCORE_LABELS,
  type PasswordRule,
} from '@/lib/password-policy';
import { Field, inputClass } from './ui';

export { isPasswordAcceptable };

/** ترتیبِ نمایش قاعده‌ها در چِک‌لیست — از هارد‌کور به اختیاری‌تر. */
const CHECKLIST_ORDER: PasswordRule[] = [
  'length',
  'classes',
  'notNumeric',
  'noSequential',
  'noKeyboardRow',
  'noBirthYear',
  'noPlatformToken',
  'notCommon',
];

/** رنگ متر بر اساس نمره — از رز سرخ تا برند سبز. */
const METER_STYLES: Record<number, { bar: string; text: string }> = {
  0: { bar: 'bg-rose-400', text: 'text-rose-600' },
  1: { bar: 'bg-rose-400', text: 'text-rose-600' },
  2: { bar: 'bg-amber-400', text: 'text-amber-600' },
  3: { bar: 'bg-mint-500', text: 'text-brand-600' },
  4: { bar: 'bg-brand-500', text: 'text-brand-600' },
};

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
  /** چک‌لیست زنده‌ی قواعد + متر قدرت (برای رمز جدید) */
  withChecklist?: boolean;
  autoFocus?: boolean;
  disabled?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const analysis = useMemo(() => analyzePassword(value), [value]);
  const showChecklist = withChecklist && value.length > 0;
  const meter = METER_STYLES[analysis.score];

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
          placeholder={withChecklist ? 'حداقل ۱۰ نویسه' : '••••••••'}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : showChecklist ? `${id}-checklist` : undefined}
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
        <div id={`${id}-checklist`} className="space-y-2 pt-1" aria-live="polite">
          {/* متر قدرت — ۴ سگمنت با پرشدن تدریجی بر اساس نمره */}
          <div className="flex items-center gap-2.5">
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={4}
              aria-valuenow={analysis.score}
              aria-label={`قدرت رمز: ${SCORE_LABELS[analysis.score]}`}
              className="flex flex-1 gap-1"
            >
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  aria-hidden="true"
                  className={cn(
                    'h-1.5 flex-1 rounded-full transition-all duration-300',
                    i < analysis.score ? meter.bar : 'bg-ink-100',
                  )}
                />
              ))}
            </div>
            <span
              className={cn(
                'shrink-0 text-[11px] font-extrabold transition-colors duration-300',
                meter.text,
              )}
            >
              {SCORE_LABELS[analysis.score]}
            </span>
          </div>

          {/* چک‌لیست قواعد — دو ستونه روی sm+، تکی در موبایل */}
          <ul className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
            {CHECKLIST_ORDER.map((key) => (
              <Rule key={key} ok={analysis.rules[key]} label={PASSWORD_RULE_LABELS[key]} />
            ))}
          </ul>

          {/* اولین نقض — جمله‌ی دقیق بک‌اند، تا «حالا دقیقاً چه کار کنم؟» */}
          {!analysis.acceptable && analysis.firstViolation ? (
            <p className="flex items-start gap-1.5 text-[11.5px] font-medium leading-5 text-rose-600">
              <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {analysis.firstViolation}
            </p>
          ) : null}
        </div>
      ) : null}
    </Field>
  );
}

function Rule({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li
      className={cn(
        'flex items-center gap-1.5 text-[11.5px] font-medium transition-colors duration-200',
        ok ? 'text-brand-600' : 'text-ink-500/80',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full border transition-all duration-200',
          ok
            ? 'border-brand-500 bg-brand-500 text-white'
            : 'border-ink-200 bg-white text-transparent',
        )}
      >
        <Check className="h-[10px] w-[10px]" strokeWidth={3.5} />
      </span>
      <span aria-label={`${label} — ${ok ? 'برقرار است' : 'نقض شده'}`}>{label}</span>
    </li>
  );
}
