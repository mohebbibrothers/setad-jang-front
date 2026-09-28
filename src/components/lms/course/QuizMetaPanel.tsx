'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ClipboardList, Loader2, Lock, Timer, RotateCcw, Target, ListChecks } from 'lucide-react';
import { apiFetch, isApiError } from '@/lib/api';
import { hasSession, onAuthChange } from '@/lib/auth-tokens';

/**
 * پنلِ «آزمون پایان دوره» — جزئیاتِ واقعی از GET /lms/courses/<slug>/quiz/
 * (احرازشده)؛ قراردادِ QuizPublicSerializer:
 *   questions_count، passing_score، time_limit_minutes،
 *   max_attempts، retake_delay_days
 *
 * سه حالتِ صادقانه:
 *   مهمان      → دعوت به ورود (آزمون مخصوص اعضاست)؛
 *   واردشده    → چهار آمارِ واقعی + مسیرِ شروع (ثبت‌نام → جلسات → آزمون)؛
 *   بدون‌آزمون → روایتِ «هنوز منتشر نشده» با تکیه بر پیشرفتِ جلسات.
 */

type State =
  /** فریمِ اول — قبل از دسترسی به localStorage؛ SSR و hydration را
   *  قطعی یکسان نگه می‌دارد (رفعِ hydration mismatch #418). */
  | { kind: 'boot' }
  | { kind: 'guest' }
  | { kind: 'loading' }
  | {
      kind: 'ok';
      questions: number;
      passingScore: number;
      timeLimit: number | null;
      maxAttempts: number | null;
      retakeDays: number | null;
    }
  | { kind: 'none' }
  | { kind: 'unavailable' };

type ApiQuiz = {
  questions_count?: number;
  passing_score?: number;
  time_limit_minutes?: number | null;
  max_attempts?: number | null;
  retake_delay_days?: number | null;
};

export function QuizMetaPanel({ slug }: { slug: string }) {
  const [state, setState] = useState<State>({ kind: 'boot' });
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    if (!hasSession()) {
      if (alive.current) setState({ kind: 'guest' });
      return;
    }
    setState({ kind: 'loading' });
    try {
      const q = await apiFetch<ApiQuiz>(`/lms/courses/${encodeURIComponent(slug)}/quiz/`, {
        cache: 'no-store',
      });
      if (!alive.current) return;
      setState({
        kind: 'ok',
        questions: q?.questions_count ?? 0,
        passingScore: q?.passing_score ?? 0,
        timeLimit: q?.time_limit_minutes ?? null,
        maxAttempts: q?.max_attempts ?? null,
        retakeDays: q?.retake_delay_days ?? null,
      });
    } catch (err) {
      if (!alive.current) return;
      setState(
        isApiError(err) && err.status === 404
          ? { kind: 'none' }
          : isApiError(err) && err.status === 401
            ? { kind: 'guest' }
            : { kind: 'unavailable' },
      );
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => onAuthChange(() => load()), [load]);

  const fa = (n: number) => n.toLocaleString('fa-IR');

  if (state.kind === 'boot' || state.kind === 'loading') {
    return (
      <p
        className="inline-flex items-center gap-2 text-[12px] font-bold text-ink-400"
        role="status"
      >
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        {state.kind === 'boot' ? 'در حال آماده‌سازی…' : 'در حال خواندن مشخصات آزمون…'}
      </p>
    );
  }

  if (state.kind === 'guest') {
    return (
      <div className="rounded-xl border border-dashed border-ink-200 bg-ink-50/60 p-4">
        <p className="inline-flex items-start gap-2 text-[12px] font-bold leading-6 text-ink-500">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
          جزئیاتِ آزمون برای اعضای قرارگاه است — وارد حسابت شو تا آستانه‌ی قبولی، زمان و تلاش‌ها را
          ببینی.
        </p>
      </div>
    );
  }

  if (state.kind === 'none') {
    return (
      <p className="inline-flex items-start gap-2 text-[12px] font-bold leading-6 text-ink-500">
        <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
        برای این کلاس هنوز آزمونی منتشر نشده است؛ پیشرفتِ تو در جلسات ثبت می‌شود و با آماده‌شدن
        آزمون، همین‌جا خبر می‌گیری.
      </p>
    );
  }

  if (state.kind === 'unavailable') {
    return (
      <button
        type="button"
        onClick={load}
        className="text-[12px] font-extrabold text-brand-700 underline decoration-dotted underline-offset-4"
      >
        مشخصات آزمون بارگذاری نشد — تلاش دوباره
      </button>
    );
  }

  const stats = [
    { icon: ListChecks, label: 'تعداد سؤال', value: `${fa(state.questions)}` },
    { icon: Target, label: 'آستانه‌ی قبولی', value: `${fa(state.passingScore)}٪` },
    state.timeLimit
      ? { icon: Timer, label: 'زمانِ پاسخ‌گویی', value: `${fa(state.timeLimit)} دقیقه` }
      : { icon: Timer, label: 'زمانِ پاسخ‌گویی', value: 'بدون محدودیت' },
    state.maxAttempts
      ? { icon: RotateCcw, label: 'فرصتِ تلاش', value: `${fa(state.maxAttempts)} بار` }
      : { icon: RotateCcw, label: 'فرصتِ تلاش', value: 'نامحدود' },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-ink-50/80 px-3 py-2.5 ring-1 ring-ink-100">
            <s.icon className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />
            <p className="mt-1 text-[13px] font-black text-ink-800">{s.value}</p>
            <p className="text-[10px] font-bold text-ink-400">{s.label}</p>
          </div>
        ))}
      </div>
      {state.retakeDays ? (
        <p className="mt-2.5 text-[11px] font-bold text-ink-400">
          فاصله‌ی بین دو تلاشِ ناموفق: {fa(state.retakeDays)} روز
        </p>
      ) : null}
      <p className="mt-2.5 text-[11.5px] font-bold leading-6 text-ink-500">
        مسیر: ثبت‌نام ← گذراندنِ جلسات ← شروع آزمون. قبول شدی، گواهی‌ات خودکار صادر می‌شود.
      </p>
    </div>
  );
}
