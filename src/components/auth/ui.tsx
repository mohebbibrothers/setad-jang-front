'use client';

/**
 * اتم‌های مشترک مودال احراز هویت — Alert / Field / SubmitButton.
 * زبان بصری: همان سیستم سایت (brand/mint، گوشه‌های نرم، سایه‌های کم‌عمق).
 */

import { forwardRef, type ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ── Alert ─────────────────────────────────────────────────────────────── */

const ALERT_STYLES = {
  error: {
    box: 'border-rose-200 bg-rose-50 text-rose-800',
    icon: 'text-rose-500',
    Icon: AlertCircle,
  },
  success: {
    box: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    icon: 'text-emerald-500',
    Icon: CheckCircle2,
  },
  info: {
    box: 'border-brand-100 bg-brand-50 text-brand-900',
    icon: 'text-brand-500',
    Icon: Info,
  },
} as const;

export function Alert({
  kind,
  children,
  role = kind === 'error' ? 'alert' : 'status',
}: {
  kind: keyof typeof ALERT_STYLES;
  children: ReactNode;
  role?: 'alert' | 'status';
}) {
  const { box, icon, Icon } = ALERT_STYLES[kind];
  return (
    <div
      role={role}
      className={cn(
        'flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-[13px] font-medium leading-6',
        box,
      )}
    >
      <Icon className={cn('mt-0.5 h-[18px] w-[18px] shrink-0', icon)} strokeWidth={2.2} />
      <p className="min-w-0">{children}</p>
    </div>
  );
}

/* ── Field shell ────────────────────────────────────────────────────────── */

export function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string | null;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[13px] font-bold text-ink-900">
        {label}
      </label>
      {children}
      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-[12px] font-medium leading-5 text-rose-600"
        >
          {error}
        </p>
      ) : hint ? (
        <p className="text-[12px] leading-5 text-ink-500">{hint}</p>
      ) : null}
    </div>
  );
}

/** شِل استایل ورودی‌های متنی مودال — منبع واحد تا همه یکدست باشند. */
export const inputClass = (invalid?: boolean) =>
  cn(
    'h-12 w-full rounded-xl border bg-ink-50/60 px-3.5 text-[14px] font-medium text-ink-900',
    'transition-all duration-200 placeholder:font-normal placeholder:text-ink-500/70',
    'outline-none focus:bg-white focus:ring-4',
    invalid
      ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/15'
      : 'border-ink-200 hover:border-ink-200/80 focus:border-brand-500 focus:ring-brand-500/15',
  );

/* ── Submit button ──────────────────────────────────────────────────────── */

export const SubmitButton = forwardRef<
  HTMLButtonElement,
  {
    loading?: boolean;
    disabled?: boolean;
    children: ReactNode;
    onClick?: () => void;
    className?: string;
  }
>(function SubmitButton({ loading, disabled, children, onClick, className }, ref) {
  return (
    <button
      ref={ref}
      type={onClick ? 'button' : 'submit'}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl',
        'bg-gradient-to-l from-brand-500 to-brand-600 text-[14.5px] font-extrabold text-white',
        'shadow-[0_10px_24px_-10px_rgba(13,128,116,.55)] transition-all duration-300',
        'hover:shadow-[0_16px_32px_-10px_rgba(13,128,116,.6)] hover:brightness-[1.05] active:scale-[.99]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none disabled:hover:brightness-100',
        className,
      )}
    >
      {/* برق لطیف هاور */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-l from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full"
      />
      {loading ? <Loader2 className="h-5 w-5 animate-spin" strokeWidth={2.4} /> : null}
      <span className="relative">{children}</span>
    </button>
  );
});
