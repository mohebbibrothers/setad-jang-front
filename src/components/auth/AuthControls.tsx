'use client';

/**
 * AuthControls — ناحیه‌ی حساب کاربری در هدر.
 *
 *   مهمان  → دکمه‌ی «ورود | ثبت‌نام» (گرادیانیِ برند، در دسکتاپ؛
 *            نسخه‌ی block برای شیتِ موبایل)
 *   واردشده → چیپ کاربر (آواتارِ حرفِ اول + نام) با منوی آبشاری:
 *            نمایش نام/شناسه + خروج از حساب.
 *
 * داده از useAuth می‌آید که خودش به رویدادهای token-store گوش می‌دهد؛
 * پس لحظه‌ی موفقیتِ مودال، هدر بدون هیچ سیم‌کشیِ اضافه‌ای عوض می‌شود.
 */

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogIn, LogOut, UserRound } from 'lucide-react';
import { useAuth } from '@/lib/use-auth';
import { formatIdentifierForDisplay } from '@/lib/auth-identifier';
import { usePresence } from '@/lib/use-presence';
import { cn } from '@/lib/utils';

function displayName(user: ReturnType<typeof useAuth>['user']): string {
  if (!user) return '';
  return (
    user.full_name?.trim() ||
    [user.first_name, user.last_name].filter(Boolean).join(' ').trim() ||
    user.email ||
    ''
  );
}

function displayIdentifier(user: ReturnType<typeof useAuth>['user']): string {
  if (!user) return '';
  const raw = user.email || user.profile?.phone_number || user.primary_identifier || '';
  return raw ? formatIdentifierForDisplay(raw) : '';
}

export function AuthControls({
  onOpen,
  variant = 'inline',
}: {
  onOpen: () => void;
  /** block → نسخه‌ی تمام‌عرض برای منوی موبایل */
  variant?: 'inline' | 'block';
}) {
  const { isAuthenticated, user, loading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // چرخه‌حیات قطعیِ منو — همان قرارداد مودال: تخلیه‌ی تایمریِ تضمینی،
  // بدون اتکا به AnimatePresence. در فازِ خروج منو تعاملی نیست.
  const { rendered: menuRendered, closing: menuClosing } = usePresence(menuOpen, 140);

  // بستن منو با کلیک بیرون یا Esc
  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  /* ── مهمان ─────────────────────────────────────────────────────────── */
  if (!isAuthenticated) {
    if (variant === 'block') {
      return (
        <button
          type="button"
          onClick={onOpen}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-brand-500 to-brand-600 text-[14.5px] font-extrabold text-white shadow-[0_10px_24px_-10px_rgba(13,128,116,.55)] transition-all hover:brightness-105 active:scale-[.99]"
        >
          <LogIn className="h-[18px] w-[18px]" />
          ورود | ثبت‌نام
        </button>
      );
    }
    // دسکتاپ: پیل در هدر؛ موبایل: نسخه‌ی block داخل شیت نصب است.
    return (
      <button
        type="button"
        onClick={onOpen}
        className="hidden h-10 items-center gap-2 rounded-xl bg-gradient-to-l from-brand-500 to-brand-600 px-4 text-[13.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(13,128,116,.55)] transition-all duration-300 hover:shadow-[0_12px_24px_-8px_rgba(13,128,116,.6)] hover:brightness-105 active:scale-[.98] lg:inline-flex"
      >
        <UserRound className="h-[17px] w-[17px]" strokeWidth={2.2} />
        ورود | ثبت‌نام
      </button>
    );
  }

  /* ── واردشده ────────────────────────────────────────────────────────── */
  const name = displayName(user);
  const identifierText = displayIdentifier(user);
  const initial = (name || 'ب').trim().charAt(0);

  return (
    <div ref={wrapRef} className={cn('relative', variant === 'block' && 'w-full')}>
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        aria-label={name ? `حساب کاربری ${name}` : 'حساب کاربری'}
        className={cn(
          'flex items-center gap-2 rounded-xl border border-ink-200 bg-white py-1.5 pl-2.5 pr-1.5 transition-all duration-200 hover:border-brand-500/40 hover:shadow-[0_6px_16px_-8px_rgba(13,128,116,.35)]',
          loading && 'animate-pulse',
        )}
      >
        <span
          aria-hidden="true"
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-[14px] font-extrabold text-white"
        >
          {initial}
        </span>
        <span className="hidden max-w-[120px] truncate text-[13px] font-bold text-ink-900 sm:block">
          {loading ? '…' : name || 'حساب من'}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-ink-500 transition-transform duration-200',
            menuOpen && 'rotate-180',
          )}
        />
      </button>

      {menuRendered ? (
        <div
          role="menu"
          aria-label="منوی حساب کاربری"
          aria-hidden={menuClosing || undefined}
          inert={menuClosing || undefined}
          className={cn(
            'absolute left-0 top-[calc(100%+8px)] z-[70] w-60 overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-[0_24px_48px_-16px_rgba(15,20,32,.25)]',
            menuClosing ? 'ui-menu-exit pointer-events-none' : 'ui-menu-enter',
          )}
        >
          <div className="border-b border-ink-100 bg-ink-50/50 px-4 py-3">
            <p className="truncate text-[13.5px] font-extrabold text-ink-900">
              {name || 'حساب من'}
            </p>
            {identifierText ? (
              <p
                className="mt-0.5 truncate text-[11.5px] font-medium text-ink-500"
                dir="ltr"
                style={{ textAlign: 'right' }}
              >
                {identifierText}
              </p>
            ) : null}
          </div>
          <div className="p-1.5">
            <button
              type="button"
              role="menuitem"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await logout();
                } finally {
                  setBusy(false);
                  setMenuOpen(false);
                }
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-bold text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-60"
            >
              <LogOut className="h-4 w-4" />
              {busy ? 'در حال خروج…' : 'خروج از حساب'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
