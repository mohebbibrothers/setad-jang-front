'use client';

/**
 * اتم‌های مشترک مودال احراز هویت — Alert / Field / SubmitButton.
 * زبان بصری: همان سیستم سایت (brand/mint، گوشه‌های نرم، سایه‌های کم‌عمق).
 */

import { forwardRef, useEffect, useState, type ReactNode } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  CircleAlert,
  CloudOff,
  Info,
  Loader2,
  ShieldX,
  Timer,
  TriangleAlert,
  WifiOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCountdown } from '@/lib/otp';
import type { AuthErrorKind, AuthErrorModel } from '@/lib/auth-errors';

/* ── AuthErrorBox — نمایشِ های‌لولِ خطاهای احراز هویت ───────────────────

   هر نوع خطای بک‌اند یک چهره‌ی متمایز دارد تا کاربر «دقیقاً» بفهمد
   چه اتفاقی افتاده و گام بعدی چیست:
     credential → دسترسی/وِرد غلط (استظهار قرمز با ShieldX)
     validation → ورودی/کد (قرمزِ هشدار)
     cooldown   → «آرام بگیر» (کهربایی + شمارش‌معکوسِ زنده‌ی waitSeconds)
     delivery   → سرویس پیام/ایمیل (آبیِ آسمان + CloudOff)
     network    → قطعِ اینترنت (خاکستری + WifiOff)
     unknown    → پیش‌فرضِ قرمز
   زیرِ پیام می‌توان CTA اضافه کرد (مثل «ورود با همین شناسه»). */

const ERROR_KIND_UI: Record<
  AuthErrorKind,
  { box: string; icon: string; Icon: typeof AlertCircle; chip: string }
> = {
  credential: {
    box: 'border-rose-200 bg-rose-50 text-rose-800',
    icon: 'text-rose-500',
    Icon: ShieldX,
    chip: 'bg-rose-100/80 text-rose-700',
  },
  validation: {
    box: 'border-rose-200 bg-rose-50 text-rose-800',
    icon: 'text-rose-500',
    Icon: CircleAlert,
    chip: 'bg-rose-100/80 text-rose-700',
  },
  cooldown: {
    box: 'border-amber-200 bg-amber-50 text-amber-900',
    icon: 'text-amber-500',
    Icon: Timer,
    chip: 'bg-amber-100 text-amber-800',
  },
  delivery: {
    box: 'border-sky-200 bg-sky-50 text-sky-800',
    icon: 'text-sky-500',
    Icon: CloudOff,
    chip: 'bg-sky-100/80 text-sky-700',
  },
  network: {
    box: 'border-ink-200 bg-ink-50 text-ink-800',
    icon: 'text-ink-500',
    Icon: WifiOff,
    chip: 'bg-ink-100 text-ink-700',
  },
  unknown: {
    box: 'border-rose-200 bg-rose-50 text-rose-800',
    icon: 'text-rose-500',
    Icon: TriangleAlert,
    chip: 'bg-rose-100/80 text-rose-700',
  },
};

/** شمارش‌معکوسِ زنده برای خطای ۴۲۹ — مبنای عدد، waitSeconds سرور است. */
function CooldownChip({ waitSeconds }: { waitSeconds: number }) {
  const [left, setLeft] = useState(waitSeconds);
  useEffect(() => {
    setLeft(waitSeconds);
    if (waitSeconds <= 0) return;
    const id = window.setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(id);
  }, [waitSeconds]);
  return (
    <span className="mt-1 flex items-center gap-1 text-[11px]">
      <span aria-hidden="true">آرام بگیر —</span>
      <span className={cn('rounded-md px-1.5 py-0.5 font-extrabold tabular-nums', 'bg-white/60')}>
        {left > 0 ? `${formatCountdown(left)} تا تلاش مجدد` : 'اکنون دوباره تلاش کنید'}
      </span>
    </span>
  );
}

export function AuthErrorBox({
  model,
  children,
}: {
  model: AuthErrorModel;
  /** CTA اختیاری (لینک‌های پیشنهادی کنار پیام) */
  children?: ReactNode;
}) {
  const { box, icon, Icon, chip } = ERROR_KIND_UI[model.kind];
  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-[13px] font-medium leading-6',
        box,
      )}
    >
      <Icon className={cn('mt-0.5 h-[19px] w-[19px] shrink-0', icon)} strokeWidth={2.1} />
      <div className="min-w-0 flex-1">
        <p>{model.message}</p>
        {model.kind === 'cooldown' && model.waitSeconds ? (
          <span className={cn('inline-flex items-center rounded-md text-[11px]', chip)}>
            <CooldownChip waitSeconds={model.waitSeconds} />
          </span>
        ) : null}
        {children ? <div className="mt-1 text-[12.5px]">{children}</div> : null}
      </div>
    </div>
  );
}

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
