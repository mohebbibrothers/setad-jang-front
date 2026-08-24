'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════
 * AuthModal — پنجره‌ی ورود / ثبت‌نام بعثت مردم
 *
 * معماری:
 *   • سه نما (view): ورود | ثبت‌نام | بازیابی رمز — با ماشین‌حالت ساده
 *     و حافظه‌ی مشترکِ «شناسه» تا جابه‌جایی بین نماها ورودی کاربر را
 *     نپوشاند؛
 *   • دسکتاپ: دیالوگ دقیقاً وسط صفحه؛ موبایل: شیتِ پایین تمام‌عرض
 *     (ارگونومی انگشت) — هر دو با همان محتوا؛
 *   • a11y: role="dialog" + aria-modal + focus-trap + Esc + scroll-lock
 *     + بازگشت فوکوس به دکمه‌ی بازکننده + اولین فیلد autofocus؛
 *   • موفقیت: پنل خوش‌آمد با نام کاربر (از پاسخ خودِ بک‌اند) و بستنِ
 *     خودکار — هدر از طریق useAuth لحظه‌ای به‌روز می‌شود.
 *
 * تمام منطق فلوها در views/* و تمام قراردادها در lib/* تست‌پوششی دارد.
 * ═══════════════════════════════════════════════════════════════════════
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import type { AuthUser } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { LoginView } from './views/LoginView';
import { SignupView } from './views/SignupView';
import { ForgotView } from './views/ForgotView';
import { Alert } from './ui';

type View = 'login' | 'signup' | 'forgot';

const VIEW_META: Record<View, { title: string; subtitle: string }> = {
  login: { title: 'ورود به حساب', subtitle: 'به بعثت مردم خوش آمدید' },
  signup: { title: 'ساخت حساب جدید', subtitle: 'در چند ثانیه عضو شوید' },
  forgot: { title: 'بازیابی رمز عبور', subtitle: 'با کد ارسالی، رمز تازه بسازید' },
};

export function AuthModal({
  open,
  onClose,
  initialView = 'login',
}: {
  open: boolean;
  onClose: () => void;
  initialView?: View;
}) {
  const [view, setView] = useState<View>(initialView);
  const [identifier, setIdentifier] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [welcomeName, setWelcomeName] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // ریست حالت هنگام بازشدن دوباره
  useEffect(() => {
    if (open) {
      setView(initialView);
      setNotice(null);
      setWelcomeName(null);
    }
  }, [open, initialView]);

  // قفل اسکرول + ذخیره/بازگردانی فوکوس
  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
      previouslyFocused.current?.focus?.();
    };
  }, [open]);

  // Esc + focus-trap
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const handleSuccess = useCallback((user: AuthUser) => {
    const name =
      user.full_name?.trim() ||
      [user.first_name, user.last_name].filter(Boolean).join(' ').trim() ||
      user.email ||
      'دوست عزیز';
    setWelcomeName(name);
    // بستن نرم پس از پیام خوش‌آمد
    window.setTimeout(() => onCloseRef.current(), 1500);
  }, []);

  const goLogin = useCallback((text?: string) => {
    setView('login');
    setNotice(text ?? null);
  }, []);

  return (
    <AnimatePresence>
      {open ? (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6"
          role="presentation"
        >
          {/* بک‌دراپ */}
          <motion.button
            type="button"
            aria-label="بستن پنجره"
            className="absolute inset-0 cursor-default bg-ink-900/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />

          {/* پنل */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
            aria-describedby="auth-modal-subtitle"
            className={cn(
              'relative flex max-h-[94dvh] w-full max-w-[440px] flex-col overflow-hidden',
              'rounded-t-[24px] bg-white shadow-[0_40px_90px_-30px_rgba(5,56,50,.5)] sm:rounded-[24px]',
            )}
            initial={{ opacity: 0, y: 48, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 32, scale: 0.98 }}
            transition={{ type: 'spring', bounce: 0.22, duration: 0.55 }}
          >
            {/* نوار گرادیانی ظریف بالای کارت */}
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-brand-500 via-mint-500 to-brand-500"
            />

            {/* سربرگ */}
            <header className="relative flex items-start justify-between gap-4 px-6 pb-2 pt-6 sm:px-7">
              <div className="space-y-1">
                {view === 'forgot' ? (
                  <button
                    type="button"
                    onClick={() => goLogin()}
                    className="mb-1 inline-flex items-center gap-1 text-[12px] font-bold text-ink-500 transition-colors hover:text-brand-600"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                    بازگشت به ورود
                  </button>
                ) : null}
                <h2 id="auth-modal-title" className="text-[19px] font-extrabold text-ink-900">
                  {VIEW_META[view].title}
                </h2>
                <p id="auth-modal-subtitle" className="text-[12.5px] text-ink-500">
                  {VIEW_META[view].subtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="بستن"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-800"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            {/* تب ورود | ثبت‌نام */}
            {view !== 'forgot' ? (
              <div className="px-6 pb-1 pt-2 sm:px-7">
                <div
                  role="tablist"
                  aria-label="ورود یا ثبت‌نام"
                  className="grid grid-cols-2 gap-1 rounded-xl bg-ink-50 p-1"
                >
                  {(
                    [
                      { key: 'login', label: 'ورود' },
                      { key: 'signup', label: 'ثبت‌نام' },
                    ] as const
                  ).map(({ key, label }) => (
                    <button
                      key={key}
                      role="tab"
                      aria-selected={view === key}
                      onClick={() => {
                        setView(key);
                        setNotice(null);
                      }}
                      className={cn(
                        'relative h-10 rounded-lg text-[13.5px] font-extrabold transition-colors',
                        view === key ? 'text-brand-700' : 'text-ink-500 hover:text-ink-700',
                      )}
                    >
                      {view === key && (
                        <motion.span
                          layoutId="auth-view-tab"
                          className="absolute inset-0 rounded-lg bg-white shadow-[0_2px_8px_-3px_rgba(15,20,32,.15)]"
                          transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
                        />
                      )}
                      <span className="relative">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {/* بدنه */}
            <div className="overflow-y-auto px-6 pb-6 pt-4 sm:px-7">
              <AnimatePresence mode="wait" initial={false}>
                {welcomeName ? (
                  <motion.div
                    key="welcome"
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: 'spring', bounce: 0.35, duration: 0.6 }}
                    className="flex flex-col items-center gap-3 py-10 text-center"
                    role="status"
                  >
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', bounce: 0.55, delay: 0.08 }}
                    >
                      <CheckCircle2 className="h-16 w-16 text-brand-500" strokeWidth={1.5} />
                    </motion.span>
                    <h3 className="text-[18px] font-extrabold text-ink-900">
                      {welcomeName}، خوش آمدید 🌱
                    </h3>
                    <p className="text-[12.5px] text-ink-500">ورود شما با موفقیت انجام شد.</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key={view}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22 }}
                    className="space-y-5"
                  >
                    {notice ? <Alert kind="success">{notice}</Alert> : null}
                    {view === 'login' ? (
                      <LoginView
                        identifier={identifier}
                        setIdentifier={setIdentifier}
                        onSuccess={handleSuccess}
                        goForgot={(id) => {
                          if (id?.trim()) setIdentifier(id);
                          setView('forgot');
                          setNotice(null);
                        }}
                      />
                    ) : view === 'signup' ? (
                      <SignupView
                        identifier={identifier}
                        setIdentifier={setIdentifier}
                        onSuccess={handleSuccess}
                        goLogin={() => goLogin()}
                      />
                    ) : (
                      <ForgotView
                        identifier={identifier}
                        setIdentifier={setIdentifier}
                        goLogin={goLogin}
                      />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* نوار اعتماد */}
              {!welcomeName ? (
                <p className="mt-6 flex items-center justify-center gap-1.5 border-t border-ink-100 pt-4 text-[11px] font-medium text-ink-500">
                  <ShieldCheck className="h-3.5 w-3.5 text-brand-500" />
                  اتصال امن است؛ اطلاعات شما فقط برای ورود استفاده می‌شود.
                </p>
              ) : null}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
