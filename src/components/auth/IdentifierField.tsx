'use client';

/**
 * ورودی شناسه (ایمیل | موبایل) با تشخیص زنده‌ی نوع.
 *
 * - منطق تشخیص/اعتبارسنجی در lib/auth-identifier (آینه‌ی بک‌اند) قرار
 *   دارد؛ این فقط پوسته‌ی نمایشی است.
 * - ترکیب‌بندی: متن فارسی (label/placeholder) RTL ؛ مقدارِ تایپ‌شده
 *   LTR و چپ‌چین — چون ایمیل/شماره ذاتاً چپ‌به‌راست‌اند.
 * - چیپ نوع (ایمیل/موبایل) کنار فیلد ظاهر می‌شود تا کاربر همان لحظه
 *   بداند سیستم ورودی‌اش را چگونه فهمیده است.
 */

import { AtSign, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { detectIdentifierKind } from '@/lib/auth-identifier';
import { Field, inputClass } from './ui';

export function IdentifierField({
  id,
  value,
  onChange,
  error,
  autoFocus,
  disabled,
  label = 'ایمیل یا شماره موبایل',
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  autoFocus?: boolean;
  disabled?: boolean;
  label?: string;
}) {
  const kind = detectIdentifierKind(value);
  const describedBy = error ? `${id}-error` : undefined;

  return (
    <Field id={id} label={label} error={error}>
      <div className="relative">
        {/* چیپ نوع شناسه — سمت راست فیلد (ابتدای بصری در RTL) */}
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5',
            'rounded-md px-1.5 py-1 text-[11px] font-bold transition-all duration-200',
            kind === 'email' && 'bg-brand-50 text-brand-600',
            kind === 'phone' && 'bg-mint-500/10 text-brand-600',
            !kind && 'text-ink-500/60',
          )}
        >
          {kind === 'phone' ? (
            <Smartphone className="h-[18px] w-[18px]" strokeWidth={2.1} />
          ) : (
            <AtSign className="h-[18px] w-[18px]" strokeWidth={2.1} />
          )}
          {kind === 'email' ? 'ایمیل' : kind === 'phone' ? 'موبایل' : null}
        </span>
        <input
          id={id}
          name="identifier"
          type="text"
          inputMode={kind === 'phone' ? 'tel' : 'email'}
          autoComplete="username"
          dir="ltr"
          autoFocus={autoFocus}
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0912… یا you@example.com"
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={cn(inputClass(Boolean(error)), 'pr-[70px] text-left')}
        />
      </div>
    </Field>
  );
}
