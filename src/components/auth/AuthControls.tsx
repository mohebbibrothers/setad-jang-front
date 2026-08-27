'use client';

/**
 * AuthControls — ناحیه‌ی حساب کاربری در هدر.
 *
 *   مهمان  → دکمه‌ی «ورود | ثبت‌نام» (گرادیانیِ برند، در دسکتاپ؛
 *            نسخه‌ی block برای شیتِ موبایل)
 *   واردشده → چیپ کاربر (آواتارِ حرفِ اول + نام) با منوی آبشاریِ
 *            هوشمند: flip خودکارِ بالا/پایین + گیرِ افقیِ viewport-safe
 *            + نوکِ فلِّشِ هم‌تراز با مرکزِ تریگر (popover-placement).
 *
 * درسِ تاریخیِ این فایل (دو گزارشِ متوالیِ کارفرما روی گوشی):
 *   • لنگرِ «وسط‌چین» از صفحه بیرون می‌زد و با overflow-x: hidden
 *     بریده می‌شد؛ لنگرِ «left-0ِ ثابت» هم در کفِ شیتِ موبایل زیرِ
 *     صفحه می‌افتاد. جای‌گذاریِ ثابت برای پاپ‌اور اشتباه است — باید
 *     از rectِ واقعیِ تریگر تصمیم گرفت (auto-flip + clamp).
 *   • نسخه‌ی block (کفِ شیت) یک چیپِ فشرده و نامانوس بود؛ حالا یک
 *     کارتِ کاملِ حساب است (آواتارِ بزرگ‌تر + نام + شناسه).
 *
 * داده از useAuth می‌آید که خودش به رویدادهای token-store گوش می‌دهد؛
 * پس لحظه‌ی موفقیتِ مودال، هدر بدون هیچ سیم‌کشیِ اضافه‌ای عوض می‌شود.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, IdCard, LogIn, LogOut, UserRound } from 'lucide-react';
import { useAuth } from '@/lib/use-auth';
import { formatIdentifierForDisplay } from '@/lib/auth-identifier';
import { usePresence } from '@/lib/use-presence';
import { computePopoverPlacement, type PopoverPlacement } from '@/lib/popover-placement';
import { absoluteMediaUrl, cn } from '@/lib/utils';

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

/** پهنای منو در حالت inline (w-60) — با max-wِ viewport-safe محدود می‌شود */
const INLINE_MENU_WIDTH = 240;

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

  const [placement, setPlacement] = useState<PopoverPlacement>({
    side: 'down',
    offsetX: 0,
    caretX: 0,
  });

  // محاسبه‌ی جای‌گذاری از rectِ واقعی — سمتِ بازشو + اصلاحِ افقی + نوکِ فلِّش
  const recomputePlacement = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const menuWidth =
      variant === 'block'
        ? rect.width // منوی تمام‌عرض داخل شیت
        : Math.min(INLINE_MENU_WIDTH, vw - 24);
    setPlacement(
      computePopoverPlacement({
        anchor: { top: rect.top, bottom: rect.bottom, left: rect.left, width: rect.width },
        viewport: { width: vw, height: window.innerHeight },
        menuWidth,
      }),
    );
  }, [variant]);

  // چرخه‌حیات قطعیِ منو — همان قرارداد مودال: تخلیه‌ی تایمریِ تضمینی،
  // بدون اتکا به AnimatePresence. در فازِ خروج منو تعاملی نیست.
  const { rendered: menuRendered, closing: menuClosing } = usePresence(menuOpen, 140);

  // بستن منو با کلیک بیرون یا Esc + بازمحاسبه‌ی جای‌گذاری هنگام resize
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
    window.addEventListener('resize', recomputePlacement);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', recomputePlacement);
    };
  }, [menuOpen, recomputePlacement]);

  const toggleMenu = () => {
    if (!menuOpen) recomputePlacement(); // قبل از بازشدن، جای‌گذاری تازه
    setMenuOpen((v) => !v);
  };

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
  const avatarUrl = absoluteMediaUrl(user?.profile?.avatar);
  const isBlock = variant === 'block';

  const avatar = avatarUrl ? (
    // آواتارِ واقعیِ کاربر (بارگذاری‌شده از پروفایل) — نسبت به originِ بک‌اند
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={avatarUrl}
      alt=""
      width={isBlock ? 44 : 32}
      height={isBlock ? 44 : 32}
      loading="lazy"
      decoding="async"
      className={cn(
        'shrink-0 object-cover ring-1 ring-ink-200/70',
        isBlock ? 'h-11 w-11 rounded-xl' : 'h-8 w-8 rounded-lg',
      )}
    />
  ) : (
    <span
      aria-hidden="true"
      className={cn(
        'flex shrink-0 items-center justify-center bg-gradient-to-br from-brand-500 to-brand-700 font-extrabold text-white',
        isBlock ? 'h-11 w-11 rounded-xl text-[16px]' : 'h-8 w-8 rounded-lg text-[14px]',
      )}
    >
      {initial}
    </span>
  );

  return (
    // نسخه‌ی inline فقط دسکتاپ/تبلت است: پس از لاگین، چیپِ آواتار روی
    // گوشی (<lg) پنهان می‌شود — دسترسیِ حساب در موبایل از کارتِ کاملِ
    // کفِ شیت انجام می‌شود (درخواستِ صریحِ کارفرما). میهمانِ inline هم
    // از قبل hidden lg:inline-flex بود — یعنی هدرِ موبایل همیشه تمیز.
    <div ref={wrapRef} className={cn('relative', isBlock ? 'w-full' : 'hidden lg:block')}>
      <button
        type="button"
        onClick={toggleMenu}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        aria-label={name ? `حساب کاربری ${name}` : 'حساب کاربری'}
        className={cn(
          'flex items-center border border-ink-200 bg-white transition-all duration-200 hover:border-brand-500/45',
          isBlock
            ? // کارتِ کاملِ حساب برای کفِ شیتِ موبایل — آواتارِ بزرگ،
              // نامِ بولد و شناسه‌ی کوچک؛ به‌جای چیپِ فشرده‌ی قبلی.
              'w-full gap-3 rounded-2xl p-3 text-right shadow-[0_8px_22px_-14px_rgba(15,20,32,.25)] hover:shadow-[0_12px_28px_-14px_rgba(13,128,116,.4)] active:scale-[.99]'
            : 'gap-2 rounded-xl py-1.5 pl-2.5 pr-1.5 hover:shadow-[0_6px_16px_-8px_rgba(13,128,116,.35)] active:scale-[.98]',
          loading && 'animate-pulse',
        )}
      >
        {avatar}
        {isBlock ? (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] font-extrabold text-ink-900">
              {loading ? '…' : name || 'حساب من'}
            </span>
            <span
              dir={identifierText ? 'ltr' : undefined}
              className="mt-0.5 block truncate text-right text-[11px] font-medium text-ink-500"
            >
              {identifierText || 'مشاهده حساب کاربری'}
            </span>
          </span>
        ) : (
          <span className="hidden max-w-[120px] truncate text-[13px] font-bold text-ink-900 sm:block">
            {loading ? '…' : name || 'حساب من'}
          </span>
        )}
        <ChevronDown
          className={cn(
            'shrink-0 text-ink-500 transition-transform duration-200',
            isBlock ? 'h-5 w-5' : 'h-4 w-4',
            menuOpen && 'rotate-180',
          )}
        />
      </button>

      {menuRendered ? (
        // لایه‌ی بیرونی: فقط جای‌گذاری — سمتِ بازشو (auto-flip) و اصلاحِ
        // افقی (clamp داخل ویوپورت) از popover-placement می‌آیند. هیچ
        // لنگرِ ثابتی این دو بستر (لبه‌ی هدر / کفِ شیت) را با هم پوشش
        // نمی‌داد؛ گزارش‌های متوالیِ بیرون‌زدگی ریشه‌اش همین بود.
        <div
          className={cn('absolute z-[70]', isBlock ? 'w-full' : 'w-60 max-w-[calc(100vw-1.5rem)]')}
          style={{
            left: placement.offsetX,
            ...(placement.side === 'down'
              ? { top: 'calc(100% + 10px)' }
              : { bottom: 'calc(100% + 10px)' }),
          }}
        >
          {/* نوکِ فلِّش — دقیقاً زیرِ مرکزِ تریگر، جهت‌دار بر اساس سمتِ بازشو */}
          <span
            aria-hidden="true"
            data-testid="account-menu-caret"
            className={cn(
              'absolute z-[71] h-3 w-3 rotate-45 border-ink-200/90 bg-white',
              placement.side === 'down'
                ? '-top-[6px] border-l border-t'
                : '-bottom-[6px] border-b border-r',
            )}
            style={{ left: placement.caretX }}
          />
          <div
            role="menu"
            aria-label="منوی حساب کاربری"
            aria-hidden={menuClosing || undefined}
            inert={menuClosing || undefined}
            className={cn(
              'relative overflow-hidden rounded-2xl border border-ink-200/90 bg-white shadow-[0_24px_56px_-16px_rgba(15,20,32,.28)] ring-1 ring-black/[0.03]',
              menuClosing ? 'ui-menu-exit pointer-events-none' : 'ui-menu-enter',
            )}
          >
            {/* سربرگِ منو: کارتِ هویت با گرادیانتِ لطیفِ برند */}
            <div className="flex items-center gap-3 border-b border-ink-100 bg-gradient-to-l from-brand-50/80 via-white to-white px-4 py-3.5">
              <span
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-[14px] font-extrabold text-white ring-1 ring-brand-600/20"
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt=""
                    width={40}
                    height={40}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initial
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-extrabold text-ink-900">
                  {name || 'حساب من'}
                </span>
                {identifierText ? (
                  <span
                    dir="ltr"
                    className="mt-0.5 block truncate text-right text-[11px] font-medium text-ink-500"
                  >
                    {identifierText}
                  </span>
                ) : null}
              </span>
            </div>
            <div className="p-1.5">
              <Link
                href="/profile"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-bold text-ink-700 transition-colors hover:bg-brand-50/70 hover:text-brand-700"
              >
                <IdCard className="h-4 w-4 shrink-0 text-brand-600" />
                حساب کاربری و پروفایل
              </Link>
              <div aria-hidden="true" className="mx-3 my-1 h-px bg-ink-100" />
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
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-bold text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-60"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                {busy ? 'در حال خروج…' : 'خروج از حساب'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
