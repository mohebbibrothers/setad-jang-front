'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BadgeCheck,
  GraduationCap,
  Loader2,
  LogIn,
  Rocket,
  TriangleAlert,
  UserRoundPen,
} from 'lucide-react';
import { apiFetch, isApiError, type Paginated } from '@/lib/api';
import { hasSession, onAuthChange } from '@/lib/auth-tokens';
import { formatLmsDuration } from '@/lib/lms-shared';
import { AuthModal } from '@/components/auth/AuthModal';

/**
 * قلبِ تبدیلِ صفحه‌ی دوره — دکمه‌ی ثبت‌نام، آگاه از وضعیتِ کاربر:
 *
 *  • مهمان → «ورود برای ثبت‌نام» + AuthModal (بدون ترکِ صفحه) و پس از
 *    ورود، سناریو از نو سنجیده می‌شود؛
 *  • واردشده → چکاپِ /lms/me/enrollments/ (قراردادِ EnrollmentSerializer:
 *    enrollments_status/progress_percent)؛ اگر ثبت‌نامِ فعال دارد،
 *    پنلِ پیشرفت می‌بیند نه دکمه‌ی تکراری؛
 *  • POST /courses/<slug>/enroll/ → ۲۰۱/۲۰۰ ⇒ تبدیلِ فوری به حالتِ
 *    «ثبت‌نام فعال» (خوش‌بینانه ولی امانت‌دارانه، با پیامِ خودِ backend)؛
 *  • ۴۰۳ِ پروفایل‌ناتمام ⇒ پیامِ دقیق + CTAی تکمیل پروفایل (/profile)؛
 *  • ۴۰۳ِ غیرقابل‌ثبت‌نام / خطاهای شبکه ⇒ متنِ صادقانه + تلاشِ دوباره.
 */

type State =
  /** SSR و رندرِ اولِ کلاینت — هیچ‌کدام به localStorage دسترسی ندارند؛
   *  اگر مستقیم با hasSession() مقداردهی شود HTMLِ سرور با رندرِ اولِ
   *  کلاینت متفاوت می‌شود و React همان hydration mismatch #418 می‌دهد.
   *  پس فریمِ اول همیشه این حالتِ خنثی است و useEffect وضعیت را حل می‌کند. */
  | { kind: 'boot' }
  | { kind: 'guest' }
  | { kind: 'checking' }
  | { kind: 'idle' }
  | { kind: 'posting' }
  | { kind: 'enrolled'; progress: number; justNow: boolean }
  | { kind: 'profile-incomplete'; message: string }
  | { kind: 'error'; message: string };

type ApiEnrollment = {
  id: number;
  course?: { slug?: string; estimated_duration_seconds?: number };
  status: string;
  progress_percent?: number | string;
};

export function CourseEnrollCta({
  slug,
  durationSeconds,
}: {
  slug: string;
  durationSeconds?: number;
}) {
  const router = useRouter();
  // نکته‌ی حیاتی: با hasSession() مقداردهی نمی‌شود — SSR نمی‌تواند
  // localStorage را ببیند و رندرِ اولِ کلاینت باید همانِ سرور باشد.
  const [state, setState] = useState<State>({ kind: 'boot' });
  const [authOpen, setAuthOpen] = useState(false);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const checkEnrollments = useCallback(async () => {
    if (!hasSession()) {
      if (alive.current) setState({ kind: 'guest' });
      return;
    }
    setState({ kind: 'checking' });
    try {
      const data = await apiFetch<Paginated<ApiEnrollment>>('/lms/me/enrollments/?page_size=100', {
        cache: 'no-store',
      });
      const mine = (data?.results ?? []).find(
        (e) => e.course?.slug === slug && (e.status === 'active' || e.status === 'completed'),
      );
      if (!alive.current) return;
      if (mine) {
        const p = Number(mine.progress_percent ?? 0);
        setState({ kind: 'enrolled', progress: Number.isFinite(p) ? p : 0, justNow: false });
      } else {
        setState({ kind: 'idle' });
      }
    } catch (err) {
      if (!alive.current) return;
      // ۴۰۱/خطای شبکه: ناامیدکننده نباش — امکانِ ثبت‌نام را باز نگه‌دار
      setState(isApiError(err) && err.status === 401 ? { kind: 'guest' } : { kind: 'idle' });
    }
  }, [slug]);

  useEffect(() => {
    checkEnrollments();
  }, [checkEnrollments]);

  /* پس از ورود داخل AuthModal (یا خروج در تبِ دیگر): سناریو از نو */
  useEffect(() => onAuthChange(() => checkEnrollments()), [checkEnrollments]);

  const enroll = async () => {
    if (!hasSession()) {
      setAuthOpen(true);
      return;
    }
    setState({ kind: 'posting' });
    try {
      await apiFetch(`/lms/courses/${encodeURIComponent(slug)}/enroll/`, {
        method: 'POST',
        cache: 'no-store',
      });
      if (!alive.current) return;
      setState({ kind: 'enrolled', progress: 0, justNow: true });
      router.refresh(); // شمارنده‌های صفحه (SSR) تازه شوند
    } catch (err) {
      if (!alive.current) return;
      const msg = isApiError(err) ? err.message : '';
      if (isApiError(err) && err.status === 403 && msg.includes('پروفایل')) {
        setState({ kind: 'profile-incomplete', message: msg });
      } else {
        setState({
          kind: 'error',
          message: msg || 'ثبت‌نام برقرار نشد؛ چند لحظه‌ی دیگر دوباره تلاش کن.',
        });
      }
    }
  };

  /* ── رندر بر اساس حالت ─────────────────────────────────────────────── */

  if (state.kind === 'enrolled') {
    const pct = Math.max(0, Math.min(100, Math.round(state.progress)));
    return (
      <div className="w-full rounded-2xl border border-mint-400/30 bg-mint-500/10 p-4 text-right backdrop-blur-sm">
        <p className="inline-flex items-center gap-2 text-[13.5px] font-extrabold text-mint-200">
          <BadgeCheck className="h-[18px] w-[18px] text-mint-300" aria-hidden="true" />
          {state.justNow ? 'ثبت‌نامت انجام شد — خوش آمدی!' : 'ثبت‌نامت در این کلاس فعال است'}
        </p>
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px] font-bold text-white/60">
            <span>پیشرفت تو در کلاس</span>
            <span className="tabular-nums text-mint-200">{pct.toLocaleString('fa-IR')}٪</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-l from-mint-300 to-mint-500 transition-all duration-700"
              style={{ width: `${Math.max(pct, 3)}%` }}
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="درصد پیشرفت در کلاس"
            />
          </div>
        </div>
        <a
          href="#syllabus"
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg text-[12px] font-extrabold text-mint-200 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-300"
        >
          <Rocket className="h-3.5 w-3.5" aria-hidden="true" />
          {pct > 0 ? 'ادامه‌ی یادگیری از سیلابوس' : 'شروع از اولین جلسه‌ی سیلابوس'}
        </a>
      </div>
    );
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={enroll}
        disabled={state.kind === 'posting' || state.kind === 'checking' || state.kind === 'boot'}
        className="inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-mint-500 px-6 py-3.5 text-[14.5px] font-extrabold text-ink-950 shadow-lg shadow-mint-900/40 transition-all hover:bg-mint-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-200 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900 active:scale-[.98] disabled:cursor-wait disabled:opacity-70"
      >
        {state.kind === 'posting' || state.kind === 'checking' || state.kind === 'boot' ? (
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        ) : state.kind === 'guest' ? (
          <LogIn className="h-5 w-5" aria-hidden="true" />
        ) : (
          <GraduationCap className="h-5 w-5" aria-hidden="true" />
        )}
        {state.kind === 'boot'
          ? 'در حال آماده‌سازی…'
          : state.kind === 'checking'
            ? 'در حال بررسی وضعیت…'
            : state.kind === 'posting'
              ? 'در حال ثبت‌نام…'
              : state.kind === 'guest'
                ? 'ورود و ثبت‌نام رایگان'
                : 'ثبت‌نام رایگان در کلاس'}
      </button>
      {durationSeconds ? (
        <p className="mt-2 text-center text-[11px] font-bold text-white/50">
          فقط با یک کلیک — {formatLmsDuration(durationSeconds)} مسیر تازه‌ات شروع می‌شود
        </p>
      ) : null}

      {state.kind === 'profile-incomplete' && (
        <div className="mt-3 rounded-xl border border-gold-400/40 bg-gold-500/10 p-3 text-right">
          <p className="inline-flex items-start gap-2 text-[12px] font-bold leading-6 text-gold-200">
            <UserRoundPen className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {state.message}
          </p>
          <button
            type="button"
            onClick={() => router.push('/profile')}
            className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-lg bg-gold-500 px-3.5 text-[12px] font-extrabold text-ink-950 transition-colors hover:bg-gold-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300"
          >
            تکمیل پروفایل
          </button>
        </div>
      )}
      {state.kind === 'error' && (
        <p className="mt-3 inline-flex w-full items-start gap-2 rounded-xl border border-rose-400/40 bg-rose-500/10 p-3 text-[12px] font-bold leading-6 text-rose-200">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {state.message}
        </p>
      )}

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} initialView="login" />
    </div>
  );
}
