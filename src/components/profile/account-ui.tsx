'use client';

/**
 * ═══════════════════════════════════════════════════════════════════
 * account-ui — اتم‌های مشترکِ ناحیه‌ی حساب کاربری
 *
 * SectionCard (قاب استاندارد بخش‌ها)، Badge (نشان وضعیت)، GhostButton /
 * DangerButton، CompletionRing (حلقه‌ی تکمیل) و دو کمکیِ خطا/دستگاه.
 * زبان بصری = همان سیستم سایت و مودال احراز (brand/mint/ink، گوشه‌های
 * نرم ۲۴px، سایه‌های کم‌عمق) تا صفحه‌ی حساب «از جنسِ» بقیه‌ی تجربه باشد.
 * ═══════════════════════════════════════════════════════════════════
 */

import type { ReactNode } from 'react';
import { Loader2, Monitor, Smartphone, Globe } from 'lucide-react';
import { ApiError } from '@/lib/api';
import { cn, toPersianDigits } from '@/lib/utils';

/* ── قابِ بخش ──────────────────────────────────────────────────────────── */

export function SectionCard({
  icon,
  title,
  description,
  children,
  className,
  actions,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  /** اکشن گوشه‌ی کارت (اختیاری) */
  actions?: ReactNode;
}) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-ink-100 bg-white p-5 shadow-[0_8px_30px_-18px_rgba(15,20,32,.18)] sm:p-6',
        className,
      )}
    >
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {icon ? (
            <span
              aria-hidden="true"
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600"
            >
              {icon}
            </span>
          ) : null}
          <div>
            <h2 className="text-[15.5px] font-extrabold text-ink-900">{title}</h2>
            {description ? (
              <p className="mt-1 text-[12.5px] leading-6 text-ink-500">{description}</p>
            ) : null}
          </div>
        </div>
        {actions}
      </header>
      {children}
    </section>
  );
}

/* ── نشان وضعیت ─────────────────────────────────────────────────────────── */

const BADGE_TONES = {
  ok: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  warn: 'bg-amber-50 text-amber-700 ring-amber-200',
  neutral: 'bg-ink-50 text-ink-600 ring-ink-200',
  danger: 'bg-rose-50 text-rose-700 ring-rose-200',
} as const;

export function Badge({
  tone = 'neutral',
  icon,
  children,
}: {
  tone?: keyof typeof BADGE_TONES;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset',
        BADGE_TONES[tone],
      )}
    >
      {icon}
      {children}
    </span>
  );
}

/* ── دکمه‌ها ─────────────────────────────────────────────────────────────── */

export function GhostButton({
  onClick,
  disabled,
  busy,
  danger,
  children,
  type = 'button',
}: {
  onClick?: () => void;
  disabled?: boolean;
  busy?: boolean;
  danger?: boolean;
  children: ReactNode;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || busy}
      className={cn(
        'inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border px-4 text-[13px] font-bold',
        'transition-all duration-200 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-60',
        danger
          ? 'border-rose-200 bg-white text-rose-600 hover:border-rose-300 hover:bg-rose-50'
          : 'border-ink-200 bg-white text-ink-700 hover:border-brand-500/40 hover:bg-brand-50/40 hover:text-brand-700',
      )}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.4} /> : null}
      {children}
    </button>
  );
}

/* ── حلقه‌ی تکمیل پروفایل ─────────────────────────────────────────────────── */

export function CompletionRing({ percent, size = 72 }: { percent: number; size?: number }) {
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const filled = Math.min(100, Math.max(0, percent)) / 100;
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,.28)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#fff"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - filled)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.2,.8,.2,1)' }}
        />
      </svg>
      <span className="absolute text-[13px] font-extrabold tabular-nums text-white" dir="ltr">
        {toPersianDigits(String(percent))}٪
      </span>
    </span>
  );
}

/* ── کمکی‌ها ─────────────────────────────────────────────────────────────── */

/**
 * استخراج خطاهای سطح فیلد از envelope بک‌اند به‌شکل مسطح:
 * errors: {national_code: ['…'], gender: '…'} → {national_code: '…',…}
 */
export function extractFieldErrors(err: unknown): Record<string, string> {
  if (!(err instanceof ApiError) || !err.errors) return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(err.errors as Record<string, unknown>)) {
    if (typeof value === 'string' && value) out[key] = value;
    else if (Array.isArray(value) && value.length && typeof value[0] === 'string') {
      out[key] = value[0];
    }
  }
  return out;
}

/** نگاشت برچسب دستگاهِ بک‌اند (از user-agent ساخته می‌شود) به فارسی + آیکن */
export function deviceLabelFa(label: string | undefined): string {
  if (!label) return 'دستگاه ناشناس';
  if (label.includes('Mobile')) return 'مرورگر موبایل';
  if (label.includes('Chrome')) return 'مرورگر کروم';
  if (label.includes('Firefox')) return 'مرورگر فایرفاکس';
  if (label.includes('Safari')) return 'مرورگر سافاری';
  return label.length > 60 ? `${label.slice(0, 60)}…` : label;
}

export function DeviceIcon({ label, className }: { label?: string; className?: string }) {
  if (label?.includes('Mobile')) return <Smartphone className={className} strokeWidth={1.9} />;
  if (label && !/(Chrome|Firefox|Safari)/.test(label))
    return <Globe className={className} strokeWidth={1.9} />;
  return <Monitor className={className} strokeWidth={1.9} />;
}
