'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/icons/Icon';

/**
 * ═══════════════════════════════════════════════════════════════════
 * TabyinManageMenu — دکمه‌ی «مدیریت محتوا» در دیوارِ جهاد تبیینِ خانه
 *
 * جایگزینِ لینکِ مستقیمِ «افزودن محتوا»: یک دکمه‌ی منودار که با hover
 * (دسکتاپ) و tap (لمسی) باز می‌شود و دو مسیرِ اصلیِ رسانه‌ی مردم را
 * ارائه می‌دهد:
 *
 *   • روایت‌های من → /tabyin/mine  (داشبوردِ کامل: مشاهده/ویرایش/حذف)
 *   • افزودن محتوا → /tabyin/new   (استودیوی روایت)
 *
 * قراردادهای حفظ‌شده: ظاهر و ابعاد دقیقاً همان پیِلِ قبلی (h-12،
 * sm:w-[232px]، گرادیان/سایه‌ی mint) تا چیدمانِ تأییدشده‌ی والد هیچ
 * تغییری نکند؛ منو هم keyboard-friendly است (focus-within، Escape،
 * کلیکِ بیرون می‌بندد).
 * ═══════════════════════════════════════════════════════════════════
 */

const MENU_ITEMS: Array<{
  href: string;
  label: string;
  hint: string;
  icon: 'list' | 'plus';
}> = [
  {
    href: '/tabyin/mine',
    label: 'روایت‌های من',
    hint: 'وضعیت بررسی، ویرایش و حذف',
    icon: 'list',
  },
  {
    href: '/tabyin/new',
    label: 'افزودن محتوا',
    hint: 'استودیوی روایت — ارسال تازه',
    icon: 'plus',
  },
];

export function TabyinManageMenu() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  /* بستن با کلیکِ بیرون و Escape — رفتارِ استانداردِ منو */
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="relative w-full sm:w-[232px]"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onBlur={(e) => {
          // خروجِ کاملِ فوکوس از منو → جمع‌کردن (navigation کیبورد)
          if (!e.currentTarget.parentElement?.contains(e.relatedTarget as Node)) {
            setOpen(false);
          }
        }}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-mint-500 px-7 text-[14px] font-extrabold text-white shadow-[0_8px_24px_-8px_rgba(37,197,186,.5)] transition-all hover:scale-[1.02] hover:bg-mint-600 active:scale-[.98] sm:w-[232px]"
      >
        <Icon name="grid" className="h-4 w-4 shrink-0" />
        <span>مدیریت محتوا</span>
        <motion.span
          aria-hidden="true"
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="flex h-4 w-4 items-center justify-center"
        >
          <Icon name="chevron-down" className="h-3.5 w-3.5" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            role="menu"
            aria-label="مدیریت محتوا"
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            // پلِ hover: فاصله‌ی ۱۰px با paddingِ نامرئیِ همین div پر می‌شود
            // تا عبورِ موس از دکمه به منو آن را نبندد (باگِ کلاسیکِ منوها).
            className="absolute inset-x-0 top-full z-30 pt-2.5"
          >
            <div className="relative overflow-hidden rounded-2xl border border-ink-100 bg-white p-1.5 shadow-[0_24px_48px_-16px_rgba(16,24,40,.28)]">
              {/* نوکِ کوچکِ منو (به سمت دکمه) */}
              <span
                aria-hidden="true"
                className="absolute left-1/2 top-[5px] h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border-l border-t border-ink-100 bg-white"
              />
              {MENU_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-brand-50"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-600/15 transition-colors group-hover:bg-white">
                    <Icon name={item.icon} className="h-4 w-4" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-[13px] font-extrabold text-ink-900">{item.label}</span>
                    <span className="text-[10.5px] font-semibold text-ink-400">{item.hint}</span>
                  </span>
                  <Icon
                    name="arrow-left"
                    className="h-3.5 w-3.5 text-ink-300 transition-transform group-hover:-translate-x-0.5 group-hover:text-brand-600"
                  />
                </Link>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
