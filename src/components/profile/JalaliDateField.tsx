'use client';

/**
 * ═══════════════════════════════════════════════════════════════════
 * JalaliDateField — ورودی تاریخ تولد شمسی (سه‌سلکتی روز/ماه/سال)
 *
 * کاربر فارسی‌زبان به شمسی فکر می‌کند ولی بک‌اند ISO گرگوریان می‌خواهد؛
 * این فیلد مرزِ تبدیل است. قواعد:
 *   • طول روزهای ماه به‌صورت زنده و دقیق (کبسه‌ی ۱۴۰۳ → اسفند ۳۰ روز)
 *     از lib/jalali می‌آید؛ عوض‌شدن ماه/سال، روزِ انتخاب‌شده clamp
 *     می‌شود — تاریخِ ناموجود (۳۱ اردیبهشت!) ساخته نمی‌شود.
 *   • onChange فقط وقتی emit می‌کند که هر سه بخش انتخاب و تاریخ معتبر
 *     باشد؛ در غیر این صورت null (یعنی «بدون تغییر/پر نشده»).
 *   • بازه‌ی سال: ۱۳۰۰ تا سالِ جاریِ جلالی (تاریخ تولد).
 * ═══════════════════════════════════════════════════════════════════
 */

import { useMemo } from 'react';
import {
  JALALI_MONTH_NAMES,
  jalaliMonthLength,
  todayJalali,
  isValidJalaliDate,
  type JalaliDate,
} from '@/lib/jalali';
import { formatPersianNumber } from '@/lib/utils';
import { cn } from '@/lib/utils';

const MIN_BIRTH_YEAR = 1300;

const selectClass = cn(
  'h-12 w-full appearance-none rounded-xl border border-ink-200 bg-ink-50/60 px-3 text-[13.5px] font-bold text-ink-900',
  'outline-none transition-all duration-200 hover:border-ink-200/80',
  'focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/15',
);

export function JalaliDateField({
  id,
  label,
  value,
  onChange,
  error,
  disabled,
}: {
  id: string;
  label?: string;
  value: JalaliDate | null;
  onChange: (value: JalaliDate | null) => void;
  error?: string | null;
  disabled?: boolean;
}) {
  const currentYear = useMemo(() => todayJalali().jy, []);

  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = currentYear; y >= MIN_BIRTH_YEAR; y -= 1) list.push(y);
    return list;
  }, [currentYear]);

  const daysInMonth = value ? jalaliMonthLength(value.jy, Math.max(1, Math.min(12, value.jm))) : 31;

  const emit = (next: Partial<JalaliDate>) => {
    const merged: JalaliDate = {
      jy: next.jy ?? value?.jy ?? 0,
      jm: next.jm ?? value?.jm ?? 0,
      jd: next.jd ?? value?.jd ?? 0,
    };
    // clamp روز به طول ماه (مثلاً قبل ۳۱ خرداد، حالا ماهِ ۳۰روزه)
    if (merged.jm >= 1 && merged.jy >= 1) {
      merged.jd = Math.min(merged.jd, jalaliMonthLength(merged.jy, merged.jm));
    }
    onChange(isValidJalaliDate(merged.jy, merged.jm, merged.jd) ? merged : null);
  };

  return (
    <div className="space-y-1.5">
      {label ? (
        <span id={`${id}-label`} className="block text-[13px] font-bold text-ink-900">
          {label}
        </span>
      ) : null}
      <div
        role="group"
        aria-labelledby={label ? `${id}-label` : undefined}
        className="grid grid-cols-3 gap-2"
      >
        <select
          aria-label="روز"
          aria-invalid={Boolean(error) || undefined}
          disabled={disabled}
          value={value?.jd ?? ''}
          onChange={(e) => emit({ jd: Number(e.target.value) })}
          className={cn(
            selectClass,
            error && 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/15',
          )}
        >
          <option value="" disabled>
            روز
          </option>
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>
              {formatPersianNumber(d)}
            </option>
          ))}
        </select>

        <select
          aria-label="ماه"
          disabled={disabled}
          value={value?.jm ?? ''}
          onChange={(e) => emit({ jm: Number(e.target.value) })}
          className={cn(
            selectClass,
            error && 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/15',
          )}
        >
          <option value="" disabled>
            ماه
          </option>
          {JALALI_MONTH_NAMES.map((name, i) => (
            <option key={name} value={i + 1}>
              {name}
            </option>
          ))}
        </select>

        <select
          aria-label="سال"
          disabled={disabled}
          value={value?.jy ?? ''}
          onChange={(e) => emit({ jy: Number(e.target.value) })}
          className={cn(
            selectClass,
            error && 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/15',
          )}
        >
          <option value="" disabled>
            سال
          </option>
          {years.map((y) => (
            <option key={y} value={y}>
              {formatPersianNumber(y)}
            </option>
          ))}
        </select>
      </div>
      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-[12px] font-medium leading-5 text-rose-600"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
