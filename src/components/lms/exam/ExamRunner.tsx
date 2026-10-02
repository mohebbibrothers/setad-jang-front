'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Award,
  BadgeCheck,
  BadgeX,
  ChevronLeft,
  ChevronRight,
  Loader2,
  PartyPopper,
  RotateCcw,
  Send,
  Timer,
} from 'lucide-react';

import { submitQuizAttempt, type QuizAttempt } from '@/lib/lms-lesson';

const fa = (n: number) => n.toLocaleString('fa-IR');
const faScore = (s: string | null) =>
  s == null ? '—' : parseFloat(s).toLocaleString('fa-IR', { maximumFractionDigits: 2 });
/** mm:ss با ارقام فارسی و پدِ دو رقمی (padStart روی ارقام لاتین، سپس ترجمه). */
const faTimer = (total: number) => {
  const latin = `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
  return latin.replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
};

type RunnerPhase =
  { kind: 'running' } | { kind: 'submitting' } | { kind: 'result'; attempt: QuizAttempt };

type Props = {
  attempt: QuizAttempt;
  courseSlug: string;
  courseTitle: string;
  /**
   * بعد از سابمیتِ موفق. احتیاط: صدا زدن router.refresh() اینجا صفحه‌ی
   * force-dynamic را دوباره ساسپند می‌کند، سگمنت آن‌ماونت می‌شود و صحنه‌ی
   * نتیجه/جشن + لینک‌های گواهی نابود می‌شوند (در E2E رخ داد). شمارنده‌های
   * SSR با ناوبریِ طبیعیِ کاربر (لینک کلاس/پروفایل) تازه می‌شوند.
   */
  onFinished?: (passed: boolean) => void;
  /** دکمه‌ی «تلاش دوباره» — ساختنِ تلاشِ تازه به آرنا سپرده می‌شود. */
  onRetry?: () => void;
};

/**
 * رانرِ آزمونِ پایانی — موتورِ اجرای سؤال‌به‌سؤال روی snapshotِ سرور:
 * تایمر از expires_at (اتمام = سابمیتِ خودکار با همان انتخاب‌ها)، نقشه‌ی
 * سؤال‌ها (دات‌ناو)، نوارِ پیشرفتِ پاسخ‌داده، و مرورِ نتیجه با کارت‌های
 * تشریحی. در قبولی، گواهی سمتِ سرور صادر شده و اینجا جشن گرفته می‌شود.
 */
export function ExamRunner({
  attempt: initialAttempt,
  courseSlug,
  courseTitle,
  onFinished,
  onRetry,
}: Props) {
  const [phase, setPhase] = useState<RunnerPhase>({ kind: 'running' });
  const [selections, setSelections] = useState<Map<number, number>>(() => {
    const seeded = new Map<number, number>();
    for (const a of initialAttempt.answers ?? []) seeded.set(a.question_id, a.selected_option_id);
    return seeded;
  });
  const selectionsRef = useRef(selections);
  selectionsRef.current = selections;
  const [qIdx, setQIdx] = useState(() => {
    const firstUnanswered = initialAttempt.questions.findIndex(
      (q) => !(initialAttempt.answers ?? []).some((a) => a.question_id === q.id),
    );
    return firstUnanswered >= 0 ? firstUnanswered : 0;
  });
  const [leftSec, setLeftSec] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const attempt = phase.kind === 'result' ? phase.attempt : initialAttempt;
  const questions = attempt.questions ?? [];
  const q = questions[qIdx];
  const answeredCnt = selections.size;
  const allAnswered = answeredCnt === questions.length && questions.length > 0;

  const doSubmit = useCallback(
    async (sel: Map<number, number>) => {
      setPhase({ kind: 'submitting' });
      const answers = [...sel.entries()].map(([question_id, selected_option_id]) => ({
        question_id,
        selected_option_id,
      }));
      const res = await submitQuizAttempt(initialAttempt.id, answers);
      if (!alive.current) return;
      if (res.kind === 'ok') {
        setPhase({ kind: 'result', attempt: res.attempt });
        onFinished?.(res.attempt.is_passed === true);
      } else {
        setSubmitError(res.message);
        setPhase({ kind: 'running' });
      }
    },
    [initialAttempt.id, onFinished],
  );

  /* شمارش معکوس از expires_at */
  useEffect(() => {
    if (!initialAttempt.expires_at || phase.kind !== 'running') return;
    const expiry = initialAttempt.expires_at;
    const tick = () => {
      const left = Math.max(0, Math.floor((Date.parse(expiry) - Date.now()) / 1000));
      setLeftSec(left);
      if (left === 0 && alive.current) void doSubmit(selectionsRef.current);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAttempt.id, initialAttempt.expires_at, phase.kind]);

  /* ── فازِ اجرا ── */
  if ((phase.kind === 'running' || phase.kind === 'submitting') && q) {
    const busy = phase.kind === 'submitting';
    return (
      <div className="overflow-hidden rounded-[22px] border border-ink-100 bg-white shadow-[0_18px_45px_-30px_rgba(11,53,48,.35)]">
        {/* نوارِ بالای رانر */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 bg-ink-50/60 px-4 py-3 sm:px-5">
          <span className="text-[12px] font-black text-ink-600">
            سؤال {fa(qIdx + 1)} از {fa(questions.length)}
            <span className="ms-2 text-[10px] font-bold text-ink-400">
              (وزن {faScore(q.weight)})
            </span>
          </span>
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-bold text-mint-700">{fa(answeredCnt)} پاسخ‌داده</span>
            {leftSec != null && (
              <span
                aria-label="زمان باقی‌مانده"
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black tabular-nums ${
                  leftSec < 120
                    ? 'bg-red-50 text-red-600'
                    : 'bg-white text-ink-600 ring-1 ring-ink-100'
                }`}
              >
                <Timer className="h-3 w-3" aria-hidden="true" />
                {faTimer(leftSec)}
              </span>
            )}
          </div>
        </div>

        {/* نوارِ پیشرفت + نقشه‌ی سؤال‌ها */}
        <div className="h-1 w-full bg-ink-100">
          <div
            className="h-full bg-gradient-to-l from-brand-500 to-mint-400 transition-all duration-500"
            style={{ width: `${(answeredCnt / Math.max(1, questions.length)) * 100}%` }}
          />
        </div>
        {questions.length > 1 && (
          <div
            className="flex flex-wrap items-center gap-1.5 border-b border-ink-100 bg-white px-4 py-2.5 sm:px-5"
            role="navigation"
            aria-label="نقشه‌ی سؤال‌ها"
          >
            {questions.map((qq, i) => {
              const answered = selections.has(qq.id);
              const current = i === qIdx;
              return (
                <button
                  key={qq.id}
                  type="button"
                  onClick={() => setQIdx(i)}
                  disabled={busy}
                  aria-label={`سؤال ${fa(i + 1)}${answered ? ' — پاسخ داده شده' : ''}`}
                  aria-current={current ? 'true' : undefined}
                  className={`grid h-7 w-7 place-items-center rounded-lg text-[10.5px] font-black tabular-nums transition ${
                    current
                      ? 'bg-brand-600 text-white shadow-[0_6px_14px_-6px_rgba(13,128,116,.7)]'
                      : answered
                        ? 'bg-mint-100 text-mint-800 ring-1 ring-mint-200'
                        : 'bg-ink-50 text-ink-400 ring-1 ring-ink-100 hover:bg-ink-100'
                  }`}
                >
                  {fa(i + 1)}
                </button>
              );
            })}
          </div>
        )}

        <div className="p-5 sm:p-7">
          <h3 className="text-[16px] font-black leading-8 text-ink-900">{q.text}</h3>
          <div className="mt-5 space-y-2.5" role="radiogroup" aria-label="گزینه‌ها">
            {q.options.map((op, oi) => {
              const active = selections.get(q.id) === op.id;
              return (
                <button
                  key={op.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={busy}
                  onClick={() => {
                    setSubmitError(null);
                    setSelections((prev) => new Map(prev).set(q.id, op.id));
                  }}
                  className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-right transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-300 ${
                    active
                      ? 'border-mint-500 bg-mint-50 shadow-[0_10px_24px_-14px_rgba(20,184,166,.5)]'
                      : 'border-ink-100 bg-white hover:border-brand-200 hover:bg-brand-50/40'
                  }`}
                >
                  <span
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 text-[11px] font-black transition ${
                      active
                        ? 'border-mint-600 bg-mint-500 text-ink-950'
                        : 'border-ink-200 text-ink-400'
                    }`}
                  >
                    {fa(oi + 1)}
                  </span>
                  <span
                    className={`text-[13.5px] font-bold leading-7 ${active ? 'text-ink-900' : 'text-ink-600'}`}
                  >
                    {op.text}
                  </span>
                </button>
              );
            })}
          </div>

          {submitError && (
            <p
              role="alert"
              className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-[12px] font-bold text-red-700 ring-1 ring-red-100"
            >
              {submitError}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQIdx((i) => Math.max(0, i - 1))}
                disabled={qIdx === 0 || busy}
                className="inline-flex h-10 items-center gap-1 rounded-full border border-ink-200 px-4 text-[12px] font-extrabold text-ink-600 transition hover:border-brand-300 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
                قبلی
              </button>
              {qIdx < questions.length - 1 && (
                <button
                  type="button"
                  onClick={() => setQIdx((i) => Math.min(questions.length - 1, i + 1))}
                  disabled={busy}
                  className="inline-flex h-10 items-center gap-1 rounded-full border border-ink-200 px-4 text-[12px] font-extrabold text-ink-600 transition hover:border-brand-300 disabled:opacity-40"
                >
                  بعدی
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
            {(qIdx === questions.length - 1 || allAnswered) && (
              <button
                type="button"
                onClick={() => void doSubmit(selections)}
                disabled={busy || answeredCnt === 0}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-mint-500 px-6 text-[13px] font-black text-ink-950 shadow-[0_12px_26px_-12px_rgba(20,184,166,.65)] transition hover:bg-mint-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-300 disabled:opacity-50"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="h-4 w-4" aria-hidden="true" />
                )}
                ثبت نهایی پاسخ‌ها{' '}
                {!allAnswered && `(${fa(questions.length - answeredCnt)} سؤال بی‌پاسخ)`}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── فازِ نتیجه ── */
  if (phase.kind === 'result') {
    const a = phase.attempt;
    const passed = a.is_passed === true;
    return (
      <div className="overflow-hidden rounded-[22px] border border-ink-100 bg-white shadow-[0_18px_45px_-30px_rgba(11,53,48,.35)]">
        <div
          className={`relative overflow-hidden px-6 py-8 text-center sm:py-10 ${
            passed
              ? 'bg-gradient-to-b from-mint-50 to-white'
              : 'bg-gradient-to-b from-gold-50 to-white'
          }`}
        >
          {passed && (
            <>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-[12%] top-6 h-2.5 w-2.5 rotate-12 rounded-[3px] bg-gold-400"
                style={{ animation: 'examConfetti 2.8s ease-in-out infinite' }}
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute right-[16%] top-10 h-2 w-2 -rotate-12 rounded-full bg-brand-500/70"
                style={{ animation: 'examConfetti 3.2s ease-in-out infinite .4s' }}
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-[28%] top-2 h-1.5 w-1.5 rounded-full bg-mint-500/80"
                style={{ animation: 'examConfetti 2.4s ease-in-out infinite .8s' }}
              />
            </>
          )}
          <span
            className={`relative mx-auto grid h-16 w-16 place-items-center rounded-2xl ${
              passed
                ? 'bg-mint-500 text-ink-950 shadow-[0_14px_30px_-12px_rgba(20,184,166,.7)]'
                : 'bg-gold-400 text-white'
            }`}
          >
            {passed ? (
              <>
                <span
                  className="absolute inset-0 animate-ping rounded-2xl bg-mint-400/60"
                  aria-hidden="true"
                />
                <PartyPopper className="relative h-7 w-7" aria-hidden="true" />
              </>
            ) : (
              <RotateCcw className="h-7 w-7" aria-hidden="true" />
            )}
          </span>
          <p className="mt-4 text-[20px] font-black text-ink-900 sm:text-[22px]">
            {passed ? 'قبول شدی — تبریک! 🎓' : 'این‌بار نشد؛ جای رشد داری'}
          </p>
          <div className="mt-2 flex items-center justify-center gap-2 text-[13px] font-black">
            <span className="tabular-nums text-brand-700">
              نمره: {faScore(a.score_out_of_20)} از ۲۰
            </span>
            {a.score_percent != null && (
              <span className="text-ink-400">(٪{faScore(a.score_percent)})</span>
            )}
          </div>
          {passed ? (
            <>
              <p className="mx-auto mt-3 max-w-md rounded-xl bg-white/80 px-4 py-2.5 text-[12px] font-bold leading-6 text-mint-800 ring-1 ring-mint-100">
                <Award className="ms-1 inline h-4 w-4" aria-hidden="true" />
                گواهی پایان‌دوره‌ی «{courseTitle}» برایت صادر شد؛ در پروفایلت قابل مشاهده و دانلود
                است.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <Link
                  href={`/lms/courses/${encodeURIComponent(courseSlug)}`}
                  className="inline-flex h-10 items-center gap-1.5 rounded-full bg-brand-600 px-5 text-[12.5px] font-extrabold text-white transition hover:bg-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
                >
                  <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                  صفحه‌ی کلاس
                </Link>
                <Link
                  href="/profile"
                  className="inline-flex h-10 items-center gap-1.5 rounded-full border border-mint-200 bg-mint-50 px-5 text-[12.5px] font-extrabold text-mint-800 transition hover:bg-mint-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-300"
                >
                  <Award className="h-4 w-4" aria-hidden="true" />
                  گواهی‌های من در پروفایل
                </Link>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-brand-600 px-6 text-[12.5px] font-extrabold text-white transition hover:bg-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              تلاش دوباره
            </button>
          )}
        </div>

        {/* مرورِ پاسخ‌ها */}
        <div className="max-h-[440px] space-y-3 overflow-y-auto p-5 sm:p-6">
          {(a.answers ?? []).map((ans, i) => {
            const ques = a.questions.find((x) => x.id === ans.question_id);
            if (!ques) return null;
            const chosen = ques.options.find((o) => o.id === ans.selected_option_id);
            const correct =
              ans.correct_option_id != null
                ? ques.options.find((o) => o.id === ans.correct_option_id)
                : null;
            return (
              <div
                key={ans.question_id}
                className={`rounded-2xl border p-4 ${
                  ans.is_correct ? 'border-mint-100 bg-mint-50/50' : 'border-red-100 bg-red-50/40'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full ${
                      ans.is_correct ? 'bg-mint-500 text-ink-950' : 'bg-red-400 text-white'
                    }`}
                  >
                    {ans.is_correct ? (
                      <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <BadgeX className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-black leading-6 text-ink-800">
                      {fa(i + 1)}. {ques.text}
                    </p>
                    <p className="mt-1 text-[12px] font-bold text-ink-500">
                      پاسخ تو: {chosen?.text ?? '—'}
                    </p>
                    {correct && (
                      <p className="mt-0.5 text-[12px] font-bold text-mint-700">
                        پاسخ درست: {correct.text}
                      </p>
                    )}
                    {ans.explanation && (
                      <p className="mt-1.5 rounded-lg bg-white/70 px-3 py-2 text-[11.5px] font-bold leading-6 text-ink-500">
                        {ans.explanation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <style>{`
          @keyframes examConfetti {
            0%, 100% { transform: translateY(0) rotate(0deg); opacity: .9 }
            50% { transform: translateY(10px) rotate(28deg); opacity: .5 }
          }
        `}</style>
      </div>
    );
  }

  /* فازِ submitting روی همان نمایِ اجرا می‌ماند؛ اگر به هر دلیلی q نبود: */
  return (
    <div className="grid min-h-[240px] place-items-center rounded-[22px] border border-ink-100 bg-white">
      <Loader2 className="h-7 w-7 animate-spin text-mint-500" aria-hidden="true" />
    </div>
  );
}
