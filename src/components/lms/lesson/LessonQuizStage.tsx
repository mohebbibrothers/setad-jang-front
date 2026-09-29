'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Award,
  BadgeCheck,
  BadgeX,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Loader2,
  PartyPopper,
  RotateCcw,
  Send,
  Timer,
} from 'lucide-react';

import {
  fetchQuizMeta,
  startQuizAttempt,
  submitQuizAttempt,
  type QuizAttempt,
  type QuizMeta,
} from '@/lib/lms-lesson';

const fa = (n: number) => n.toLocaleString('fa-IR');
const faScore = (s: string | null) =>
  s == null ? '—' : parseFloat(s).toLocaleString('fa-IR', { maximumFractionDigits: 2 });

type Phase =
  | { kind: 'boot' }
  | { kind: 'intro'; meta: QuizMeta }
  | { kind: 'none' }
  | { kind: 'starting' }
  | { kind: 'running'; attempt: QuizAttempt }
  | { kind: 'submitting'; attempt: QuizAttempt }
  | { kind: 'result'; attempt: QuizAttempt }
  | { kind: 'error'; message: string };

type Props = {
  courseSlug: string;
  courseTitle: string;
  enrolled: boolean;
  onPassed: () => void;
};

/**
 * کنسول آزمونِ جلسه — جریانِ کاملِ تعبیه‌شده در بک‌اند:
 *   meta (GET quiz/) → آغاز/بازیابی تلاش (POST quiz/start → ۲۰۱/۲۰۰) → اجرای
 *   سؤال‌به‌سؤال با ترتیبِ snapshotِ سرور → سابمیت (POST attempts/<id>/submit)
 *   → نمره از ۲۰ + قبولی/مرور. در قبولی، گواهی سمتِ سرور صادر می‌شود.
 * شمارشِ معکوس از expires_at؛ اتمام زمان = سابمیت خودکار با همان انتخاب‌ها.
 */
export function LessonQuizStage({ courseSlug, courseTitle, enrolled, onPassed }: Props) {
  const [phase, setPhase] = useState<Phase>({ kind: 'boot' });
  const [selections, setSelections] = useState<Map<number, number>>(new Map());
  const selectionsRef = useRef(selections);
  selectionsRef.current = selections;
  const [qIdx, setQIdx] = useState(0);
  const [leftSec, setLeftSec] = useState<number | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enrolled) {
      setPhase({ kind: 'error', message: 'برای شرکت در آزمون باید در کلاس ثبت‌نام کرده باشی.' });
      return;
    }
    let cancelled = false;
    (async () => {
      const meta = await fetchQuizMeta(courseSlug);
      if (cancelled || !alive.current) return;
      setPhase(meta ? { kind: 'intro', meta } : { kind: 'none' });
    })();
    return () => {
      cancelled = true;
    };
  }, [courseSlug, enrolled]);

  const start = useCallback(async () => {
    setPhase({ kind: 'starting' });
    const res = await startQuizAttempt(courseSlug);
    if (!alive.current) return;
    if (res.kind === 'ok') {
      const seeded = new Map<number, number>();
      for (const a of res.attempt.answers ?? []) seeded.set(a.question_id, a.selected_option_id);
      setSelections(seeded);
      const firstUnanswered = res.attempt.questions.findIndex((q) => !seeded.has(q.id));
      setQIdx(res.resumed && firstUnanswered >= 0 ? firstUnanswered : 0);
      setPhase({ kind: 'running', attempt: res.attempt });
    } else {
      setPhase({ kind: 'error', message: res.message });
    }
  }, [courseSlug]);

  const runningAttempt =
    phase.kind === 'running' || phase.kind === 'submitting' ? phase.attempt : null;

  const doSubmit = useCallback(
    async (attempt: QuizAttempt, sel: Map<number, number>) => {
      setPhase({ kind: 'submitting', attempt });
      const answers = [...sel.entries()].map(([question_id, selected_option_id]) => ({
        question_id,
        selected_option_id,
      }));
      const res = await submitQuizAttempt(attempt.id, answers);
      if (!alive.current) return;
      if (res.kind === 'ok') {
        setPhase({ kind: 'result', attempt: res.attempt });
        if (res.attempt.is_passed) onPassed();
      } else {
        setPhase({ kind: 'running', attempt });
        // خطا را به‌صورت بنر نگه می‌داریم تا کاربر دوباره بفرستد
        setSubmitError(res.message);
      }
    },
    [onPassed],
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  /* شمارش معکوس از expires_at */
  useEffect(() => {
    if (!runningAttempt?.expires_at || phase.kind !== 'running') return;
    const expiry = runningAttempt.expires_at!;
    const tick = () => {
      const left = Math.max(0, Math.floor((Date.parse(expiry) - Date.now()) / 1000));
      setLeftSec(left);
      if (left === 0 && alive.current) void doSubmit(runningAttempt, selectionsRef.current);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runningAttempt?.id, runningAttempt?.expires_at, phase.kind]);

  const questions = runningAttempt?.questions ?? [];
  const q = questions[qIdx];
  const answeredCnt = selections.size;
  const allAnswered = answeredCnt === questions.length && questions.length > 0;

  /* ── نمای فازها ── */

  if (phase.kind === 'boot' || phase.kind === 'starting') {
    return (
      <div className="grid min-h-[300px] place-items-center rounded-[22px] border border-ink-100 bg-white">
        <Loader2 className="h-7 w-7 animate-spin text-mint-500" aria-hidden="true" />
      </div>
    );
  }

  if (phase.kind === 'none') {
    return (
      <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-[22px] border border-ink-100 bg-white p-6 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-ink-50 text-ink-300">
          <ClipboardList className="h-6 w-6" aria-hidden="true" />
        </span>
        <p className="text-[14px] font-black text-ink-700">هنوز آزمونی منتشر نشده است</p>
        <p className="max-w-xs text-[12px] leading-6 text-ink-400">
          آزمون این کلاس به‌زودی فعال می‌شود؛ فعلاً بقیه‌ی جلسات را پیش ببر.
        </p>
      </div>
    );
  }

  if (phase.kind === 'error') {
    return (
      <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-[22px] border border-ink-100 bg-white p-6 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gold-50 text-gold-600">
          <AlertTriangle className="h-6 w-6" aria-hidden="true" />
        </span>
        <p className="max-w-sm text-[13.5px] font-bold leading-7 text-ink-700">{phase.message}</p>
      </div>
    );
  }

  if (phase.kind === 'intro') {
    const m = phase.meta;
    return (
      <div className="relative overflow-hidden rounded-[22px] border border-ink-100 bg-white p-6 shadow-[0_18px_45px_-30px_rgba(11,53,48,.35)] sm:p-9">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-mint-100/60 blur-2xl"
        />
        <div className="relative">
          <p className="inline-flex items-center gap-1.5 text-[12px] font-extrabold text-mint-700">
            <ClipboardList className="h-3.5 w-3.5" aria-hidden="true" />
            آزمونِ {m.title}
          </p>
          <h2 className="mt-2 text-[22px] font-black text-ink-900">آماده‌ای خودت را بسنجی؟</h2>
          {m.description && (
            <p className="mt-2 max-w-xl text-[13px] leading-7 text-ink-500">{m.description}</p>
          )}
          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {[
              { v: fa(m.questions_count), l: 'سؤال' },
              { v: `٪${faScore(m.passing_score)}`, l: 'نمره‌ی قبولی' },
              { v: `${fa(m.time_limit_minutes)} دقیقه`, l: 'زمان' },
              { v: fa(m.max_attempts), l: 'تلاش مجاز' },
            ].map((s) => (
              <div
                key={s.l}
                className="rounded-xl border border-ink-100 bg-ink-50/50 px-3 py-2.5 text-center"
              >
                <p className="text-[15px] font-black tabular-nums text-brand-700">{s.v}</p>
                <p className="mt-0.5 text-[10px] font-bold text-ink-400">{s.l}</p>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void start()}
            className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-mint-500 px-8 text-[14px] font-black text-ink-950 shadow-[0_14px_30px_-12px_rgba(20,184,166,.65)] transition hover:-translate-y-0.5 hover:bg-mint-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-300"
          >
            <ClipboardList className="h-4 w-4" aria-hidden="true" />
            شروع آزمون
          </button>
          <p className="mt-3 text-[11px] font-bold text-ink-400">
            تلاشِ ناتمام ذخیره می‌شود؛ هر بار ادامه می‌دهی از همان‌جا می‌رسی.
          </p>
        </div>
      </div>
    );
  }

  /* ── runner ── */
  if ((phase.kind === 'running' || phase.kind === 'submitting') && q) {
    const busy = phase.kind === 'submitting';
    return (
      <div className="overflow-hidden rounded-[22px] border border-ink-100 bg-white shadow-[0_18px_45px_-30px_rgba(11,53,48,.35)]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 bg-ink-50/60 px-5 py-3">
          <span className="text-[12px] font-black text-ink-600">
            سؤال {fa(qIdx + 1)} از {fa(questions.length)}
            <span className="ms-2 text-[10px] font-bold text-ink-400">
              (وزن {faScore(q.weight)})
            </span>
          </span>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold text-mint-700">
              {fa(answeredCnt)} پاسخ‌داده‌شده
            </span>
            {leftSec != null && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black tabular-nums ${
                  leftSec < 120
                    ? 'bg-red-50 text-red-600'
                    : 'bg-white text-ink-600 ring-1 ring-ink-100'
                }`}
              >
                <Timer className="h-3 w-3" aria-hidden="true" />
                {fa(Math.floor(leftSec / 60))}:{String(leftSec % 60).padStart(2, '0')}
              </span>
            )}
          </div>
        </div>

        <div className="h-1 w-full bg-ink-100">
          <div
            className="h-full bg-gradient-to-l from-brand-500 to-mint-400 transition-all duration-500"
            style={{ width: `${(answeredCnt / Math.max(1, questions.length)) * 100}%` }}
          />
        </div>

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
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-[12px] font-bold text-red-700 ring-1 ring-red-100">
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
                onClick={() => runningAttempt && void doSubmit(runningAttempt, selections)}
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

  /* ── نتیجه ── */
  if (phase.kind === 'result') {
    const a = phase.attempt;
    const passed = a.is_passed === true;
    return (
      <div className="overflow-hidden rounded-[22px] border border-ink-100 bg-white shadow-[0_18px_45px_-30px_rgba(11,53,48,.35)]">
        <div
          className={`relative px-6 py-8 text-center ${
            passed
              ? 'bg-gradient-to-b from-mint-50 to-white'
              : 'bg-gradient-to-b from-gold-50 to-white'
          }`}
        >
          <span
            className={`mx-auto grid h-16 w-16 place-items-center rounded-2xl ${
              passed
                ? 'bg-mint-500 text-ink-950 shadow-[0_14px_30px_-12px_rgba(20,184,166,.7)]'
                : 'bg-gold-400 text-white'
            }`}
          >
            {passed ? (
              <PartyPopper className="h-7 w-7" aria-hidden="true" />
            ) : (
              <RotateCcw className="h-7 w-7" aria-hidden="true" />
            )}
          </span>
          <p className="mt-4 text-[20px] font-black text-ink-900">
            {passed ? 'قبول شدی — تبریک!' : 'این‌بار نشد؛ جای رشد داری'}
          </p>
          <div className="mt-2 flex items-center justify-center gap-2 text-[13px] font-black">
            <span className="tabular-nums text-brand-700">
              نمره: {faScore(a.score_out_of_20)} از ۲۰
            </span>
            {a.score_percent != null && (
              <span className="text-ink-400">(٪{faScore(a.score_percent)})</span>
            )}
          </div>
          {passed && (
            <p className="mx-auto mt-3 max-w-md rounded-xl bg-white/80 px-4 py-2.5 text-[12px] font-bold leading-6 text-mint-800 ring-1 ring-mint-100">
              <Award className="ms-1 inline h-4 w-4" aria-hidden="true" />
              گواهی پایان‌دوره‌ی «{courseTitle}» برایت صادر شد؛ در پروفایلت قابل مشاهده و دانلود
              است.
            </p>
          )}
          {!passed && (
            <button
              type="button"
              onClick={() => void start()}
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-brand-600 px-6 text-[12.5px] font-extrabold text-white transition hover:bg-brand-500"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              تلاش دوباره
            </button>
          )}
        </div>

        {/* مرور پاسخ‌ها */}
        <div className="max-h-[420px] space-y-3 overflow-y-auto p-5 sm:p-6">
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
      </div>
    );
  }

  return null;
}
