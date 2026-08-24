'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════
 * AuthModal — پنجره‌ی ورود / ثبت‌نام بعثت مردم
 *
 * v3 — چرخه‌حیاتِ قطعی (Definitive Presence)
 * ────────────────────────────────────────────
 * باگِ «پس از بستن مودال، کل صفحه لاک می‌شود» ریشه‌اش این بود که حذفِ
 * لایه از DOM پس از انیمیشنِ خروج، به AnimatePresenceِ framer-motion
 * v11 سپرده شده بود — کتابخانه‌ای که برای React 19 نوشته نشده و
 * bookkeepingِ تکمیلِ خروجش می‌تواند زیر رندرهای هم‌زمان (به‌ویژه با
 * زیردرختِ تغذیه‌شونده از استورِ خارجی useSyncExternalStore، یعنی سشنِ
 * فلو) سیگنال پایان را گم کند. نتیجه: عنصرِ fixedِ تمام‌صفحه‌ی شفاف
 * برای همیشه روی صفحه می‌ماند و همه‌ی کلیک‌ها را می‌بلعد؛ صفحه سالم به
 * نظر می‌رسد اما مرده است.
 *
 * معماریِ v3 — چهار لایه‌ی دفاعی که آن کلاسِ باگ را ساختاری غیرممکن
 * می‌کند:
 *
 *   ۱) usePresence به‌جای AnimatePresence: تخلیه‌ی لایه فقط به
 *      setTimeout بومیِ مرورگر بستگی دارد (تضمین‌شده) — نه
 *      animationend، نه callbackِ هیچ کتابخانه‌ای. انیمیشن‌ها CSS
 *      keyframes خالص‌اند (تجربه‌ی بصری)، نه مالکِ حیات.
 *
 *   ۲) قطعِ تعامل از همان فریمِ آغازِ بستن: wrapper بلافاصله
 *      pointer-events-none می‌گیرد و پنل inert + aria-hidden؛ پس حتی در
 *      بدترین سناریوی تصورشدنی هم، قابلیتِ بلعیدنِ کلیک وجود ندارد.
 *
 *   ۳) قفلِ اسکرول با مالکیتِ متمرکز (scroll-lock، شمارش‌مرجعی) که با
 *      rendered جفت شده: تا لایه هست قفل هست، لایه رفت قفل رفت —
 *      برگرداندنِ استایلِ قبلیِ بدنه، idempotent، تودرتو-امن.
 *
 *   ۴) Esc و تله‌ی فوکوس فقط در فازِ open فعال‌اند (در فازِ closing
 *      هیچ شنونده‌ای کار نمی‌کند) و فوکوس با تخلیه‌ی کامل به عنصرِ
 *      قبلی برمی‌گردد.
 *
 * میراثِ v2 که دست‌نخورده می‌ماند:
 *   • viewها unmount نمی‌شوند — تب‌ها با hidden/inert سوییچ می‌شوند؛
 *   • state فلو در auth-flow-session (خارج از React) با ددلاینِ مطلق:
 *     سوییچ تب، بستن مودال، حتی رفتن به تبِ دیگر — فلو ادامه دارد و
 *     cooldown از لحظه‌ی واقعیِ ارسال می‌گذرد (استاندارد صنعت)؛
 *   • a11y کامل: role=dialog، Esc، تله‌ی فوکوس، بازگشتِ فوکوس؛
 *   • پس از ورودِ موفق، سشنِ فلوها کاملاً ریست می‌شود (ورود بعدی تمیز).
 *
 * v4 — کیبوردِ موبایل + موشنِ ابریشمی:
 *   ۵) کیبورد پنل را نمی‌پوشاند: متاتگِ interactive-widget=resizes-content
 *      (کرومِ بومی) + چسبیدنِ لایه به Visual Viewport (سافاری/iOS) +
 *      اسکرولِ خودکارِ فیلدِ فوکوس‌شده به‌نمای — کاربر همیشه می‌بیند
 *      چه می‌نویسد.
 *   ۶) سوییچِ نما/روش/مرحله دیگر «انفجاری» نیست: ارتفاعِ بدنه با
 *      ResizeObserver اندازه و مورف می‌شود (useAnimatedHeight) و محتوای
 *      جدید با منحنیِ expo-out وارد می‌شود — الگوی Stripe/Clerk.
 *
 * v5 — جداسازیِ فوتر از ناحیه‌ی مورف (رفع لگِ «فوترِ دیررس»):
 *   ناحیه‌ی مورف فقط محتوای متغیر (خبر + فرمِ فعال) را می‌پوشاند و
 *   همیشه overflow-hidden است؛ نوار اعتماد بیرونِ آن قرار گرفت — پس
 *   هنگام ورود به بخشِ بلندتر، ارتفاعِ موقتِ کوچک‌تر هرگز آن را پشتِ
 *   کلیپ پنهان نمی‌کند. سکون = auto: اسکرول‌بار هم فقط با اورفلوِ واقعی.
 * ═══════════════════════════════════════════════════════════════════════
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import type { AuthUser } from '@/lib/auth';
import { resetAllAuthFlows, useAuthFlowDraft } from '@/lib/auth-flow-session';
import { usePresence } from '@/lib/use-presence';
import { lockBodyScroll } from '@/lib/scroll-lock';
import { overlayStyleForViewport, useVisualViewportMetrics } from '@/lib/use-visual-viewport';
import { useAnimatedHeight } from '@/lib/use-animated-height';
import { cn } from '@/lib/utils';
import { LoginView } from './views/LoginView';
import { SignupView } from './views/SignupView';
import { ForgotView } from './views/ForgotView';
import { AuthPanel } from './AuthPanel';
import { Alert } from './ui';

type View = 'login' | 'signup' | 'forgot';

/** مدتِ انیمیشنِ خروج (باید ≥ بیشترینِ مدت‌های CSS خروج باشد:
 *  بک‌دراپ ۲۰۰ms و پنل ۲۰۰ms — ۲۴۰ms حاشیه‌ی امن می‌دهد). */
const MODAL_EXIT_MS = 240;

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
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // چرخه‌حیات قطعی — مالکِ حقیقیِ «رندر/تخلیه» (به‌جای AnimatePresence)
  const { rendered, closing } = usePresence(open, MODAL_EXIT_MS);

  // کیبوردِ موبایل: چسبیدنِ لایه به ناحیه‌ی دیدنی (کنارِ متاتگِ
  // interactive-widget=resizes-content که کروم را بومی پوشش می‌دهد).
  // در دسکتاپ null است → استایلِ پیش‌فرضِ CSS — هیچ تغییرِ رفتاری.
  const viewportMetrics = useVisualViewportMetrics(rendered);

  // مورفِ نرمِ ارتفاع بین نماها/روش‌ها/مرحله‌ها — ضد «ترنزیشنِ انفجاری»
  const bodyHeight = useAnimatedHeight(rendered, 320);

  // اسکرولِ فیلدِ فوکوس‌شده به‌نمای پس از بازشدنِ کیبورد (iOS در
  // کانتینرهای اسکرول‌دارِ تو‌در‌تو خودش این کار را نمی‌کند)
  const focusScrollTimer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (focusScrollTimer.current !== null) window.clearTimeout(focusScrollTimer.current);
    },
    [],
  );
  const handleFocusWithin = useCallback((e: React.FocusEvent) => {
    const el = e.target as HTMLElement | null;
    if (!el || !/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
    if (!window.matchMedia('(max-width: 639px)').matches) return;
    if (focusScrollTimer.current !== null) window.clearTimeout(focusScrollTimer.current);
    focusScrollTimer.current = window.setTimeout(() => {
      if (typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }, 380); // بعد از اتمامِ انیمیشنِ بازشدنِ کیبورد
  }, []);

  // draftها فقط برای کلید تغییر محتوای پنل‌ها (فوکوسِ مرحله‌ی جدید)
  const loginDraft = useAuthFlowDraft('login');
  const signupDraft = useAuthFlowDraft('signup');
  const forgotDraft = useAuthFlowDraft('forgot');

  // ریستِ سطحِ نما هنگام بازشدن — پیش‌نویسِ فلوها آگاهانه حفظ می‌شود
  useEffect(() => {
    if (open) {
      setView(initialView);
      setNotice(null);
      setWelcomeName(null);
    }
  }, [open, initialView]);

  // قفلِ اسکرول + بازگردانیِ فوکوس — جفت با rendered (تا لایه هست قفل
  // هست؛ تخلیه شد، قفل و فوکوس هر دو آزاد/برگردانده می‌شوند). مالکیتِ
  // body مرکزی است: lockBodyScroll شمارش‌مرجعی و idempotent.
  useEffect(() => {
    if (!rendered) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const releaseScrollLock = lockBodyScroll();
    return () => {
      releaseScrollLock();
      previouslyFocused.current?.focus?.();
    };
  }, [rendered]);

  // Esc + focus-trap — فقط در فازِ open (نه هنگامِ closing):
  // تله آگاه از hidden/inert است، فقط قابل‌فوکوسِ واقعی‌ها را می‌شمارد.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focusables = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.closest('[hidden],[inert]') === null);
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
  }, [open]);

  const handleSuccess = useCallback((user: AuthUser) => {
    const name =
      user.full_name?.trim() ||
      [user.first_name, user.last_name].filter(Boolean).join(' ').trim() ||
      user.email ||
      'دوست عزیز';
    setWelcomeName(name);
    // سشنِ فلوها برای ورود بعدی کاملاً نو می‌شود
    resetAllAuthFlows();
    window.setTimeout(() => onCloseRef.current(), 1500);
  }, []);

  const goLogin = useCallback((text?: string) => {
    setView('login');
    setNotice(text ?? null);
  }, []);

  if (!rendered) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6',
        // حفاظِ مطلق: از فریمِ آغازِ بستن، لایه هیچ کلیکی را نمی‌بلعد —
        // حتی اگر فرضاً یک فریم بیشتر هم بماند.
        closing && 'pointer-events-none',
      )}
      // موبایل: چسبیدن به ناحیه‌ی دیدنی (لبه‌ی پایینِ شیت = لبه‌ی بالای
      // کیبورد) — در دسکتاپ metrics نال است و استایلِ CSS حاکم می‌ماند.
      style={viewportMetrics ? overlayStyleForViewport(viewportMetrics) : undefined}
      role="presentation"
      aria-hidden={closing || undefined}
    >
      {/* بک‌دراپ — انیمیشنِ خالصِ CSS؛ تخلیه به تایمرِ presence است */}
      <button
        type="button"
        aria-label="بستن پنجره"
        disabled={closing}
        className={cn(
          'absolute inset-0 cursor-default bg-ink-900/50 backdrop-blur-sm',
          closing ? 'auth-backdrop-exit' : 'auth-backdrop-enter',
        )}
        onClick={() => onCloseRef.current()}
      />

      {/* پنل */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        aria-describedby="auth-modal-subtitle"
        aria-hidden={closing || undefined}
        inert={closing || undefined}
        onFocus={handleFocusWithin}
        className={cn(
          // موبایل: سقف ارتفاع = کل ناحیه‌ی دیدنی (که با کیبورد کوچک
          // می‌شود) تا پنل هرگز زیر کیبورد نرود؛ دسکتاپ: همان ۹۴dvh.
          'relative flex max-h-full w-full max-w-[440px] flex-col overflow-hidden sm:max-h-[94dvh]',
          'rounded-t-[24px] bg-white shadow-[0_40px_90px_-30px_rgba(5,56,50,.5)] sm:rounded-[24px]',
          closing ? 'auth-dialog-exit' : 'auth-dialog-enter',
        )}
      >
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
            onClick={() => onCloseRef.current()}
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
                  type="button"
                  role="tab"
                  id={`auth-tab-${key}`}
                  aria-controls={`auth-panel-${key}`}
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
                  {view === key ? (
                    <motion.span
                      layoutId="auth-view-tab"
                      className="absolute inset-0 rounded-lg bg-white shadow-[0_2px_8px_-3px_rgba(15,20,32,.15)]"
                      transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
                    />
                  ) : null}
                  <span className="relative">{label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* بدنه — کانتینرِ اسکرول (اسکرول‌بار فقط و فقط با اورفلوِ واقعی) */}
        <div className="overflow-y-auto px-6 pb-6 pt-4 sm:px-7">
          {welcomeName ? (
            <div
              className="auth-view-enter flex flex-col items-center gap-3 py-10 text-center"
              role="status"
            >
              <CheckCircle2 className="h-16 w-16 text-brand-500" strokeWidth={1.5} />
              <h3 className="text-[18px] font-extrabold text-ink-900">
                {welcomeName}، خوش آمدید 🌱
              </h3>
              <p className="text-[12.5px] text-ink-500">ورود شما با موفقیت انجام شد.</p>
            </div>
          ) : (
            <>
              {/*
                ناحیه‌ی مورف — فقط محتوای «متغیر» (خبر + فرمِ فعال).
                همیشه overflow-hidden است: در سکون ارتفاع auto همان
                اندازه‌ی محتواست و چیزی کلیپ نمی‌شود؛ حین مورف، ارتفاعِ
                موقتِ کوچک‌تر فقط فرم را کوتاه نشان می‌دهد — نه فوتر را
                (که بیرونِ این ناحیه است و هرگز دیر ظاهر نمی‌شود).
              */}
              <div
                data-testid="auth-morph-region"
                className={cn(
                  'overflow-hidden',
                  bodyHeight.armed &&
                    'transition-[height] duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
                )}
                style={bodyHeight.style}
              >
                {/* بسته‌ی اندازه‌گیری — flexcol تا مارجین‌های فرزندان توی
                    جعبه بمانند و اندازه دقیق باشد */}
                <div ref={bodyHeight.contentRef} className="flex flex-col">
                  {notice ? (
                    <div className="mb-4">
                      <Alert kind="success">{notice}</Alert>
                    </div>
                  ) : null}

                  <AuthPanel
                    id="auth-panel-login"
                    labelledby="auth-tab-login"
                    active={view === 'login'}
                    activeKey={`${loginDraft.method}:${loginDraft.step}`}
                  >
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
                  </AuthPanel>

                  <AuthPanel
                    id="auth-panel-signup"
                    labelledby="auth-tab-signup"
                    active={view === 'signup'}
                    activeKey={signupDraft.step}
                  >
                    <SignupView
                      identifier={identifier}
                      setIdentifier={setIdentifier}
                      onSuccess={handleSuccess}
                      goLogin={() => goLogin()}
                    />
                  </AuthPanel>

                  {/* نمای بازیابی تب ندارد — با لینک «فراموشی» وارد می‌شود */}
                  <AuthPanel
                    id="auth-panel-forgot"
                    labelledby="auth-modal-title"
                    active={view === 'forgot'}
                    activeKey={forgotDraft.step}
                  >
                    <ForgotView
                      identifier={identifier}
                      setIdentifier={setIdentifier}
                      goLogin={goLogin}
                    />
                  </AuthPanel>
                </div>
              </div>

              {/* نوار اعتماد — بیرون از ناحیه‌ی مورف: از فریمِ اول حاضر
                  است و حین مورف فقط نرم با ناحیه جابه‌جا می‌شود، هیچ‌وقت
                  پشتِ کلیپ پنهان نمی‌ماند */}
              <p className="mt-6 flex items-center justify-center gap-1.5 border-t border-ink-100 pt-4 text-[11px] font-medium text-ink-500">
                <ShieldCheck className="h-3.5 w-3.5 text-brand-500" />
                اتصال امن است؛ اطلاعات شما فقط برای ورود استفاده می‌شود.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
