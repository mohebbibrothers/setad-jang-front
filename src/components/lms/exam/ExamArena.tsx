'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  ClipboardList,
  DoorClosed,
  Flame,
  GraduationCap,
  Hourglass,
  ListChecks,
  Loader2,
  Lock,
  LogIn,
  Rocket,
  ShieldQuestion,
  Sparkles,
  Trophy,
} from 'lucide-react';

import { AuthModal } from '@/components/auth/AuthModal';
import { EnrollConfirmModal } from '@/components/lms/enroll/EnrollConfirmModal';
import { LessonProgressRing } from '@/components/lms/lesson/LessonProgressRing';
import { apiFetch, isApiError } from '@/lib/api';
import { hasSession } from '@/lib/auth-tokens';
import {
  fetchMyEnrollment,
  fetchQuizMeta,
  startQuizAttempt,
  type QuizAttempt,
  type QuizMeta,
} from '@/lib/lms-lesson';
import { TYPE_ICON, TYPE_TONE, type LmsCourseDetail, type LmsLesson } from '@/lib/lms-shared';
import { ExamRunner } from './ExamRunner';

const fa = (n: number) => n.toLocaleString('fa-IR');
const faScore = (s: string | null) =>
  s == null ? '—' : parseFloat(s).toLocaleString('fa-IR', { maximumFractionDigits: 2 });

type Stage =
  | { kind: 'boot' }
  | { kind: 'guest' }
  | { kind: 'not-enrolled' }
  | { kind: 'locked'; remaining: LmsLesson[]; percent: number; doneCount: number }
  | { kind: 'no-quiz' }
  | { kind: 'intro'; meta: QuizMeta; attemptError: string | null }
  | { kind: 'running'; attempt: QuizAttempt }
  | { kind: 'error'; message: string };

type Props = {
  course: LmsCourseDetail;
  orderedLessons: LmsLesson[];
  lastLesson: LmsLesson | null;
};

/**
 * صحنه‌ی آزمونِ پایانی — «جلسه‌ی پایانی» به‌مثابه یک مقصدِ مستقل.
 *
 * دروازه‌ها (هر سه با تجربه‌ی خودشان، نه بن‌بست):
 *   مهمان → ورود؛ ثبت‌نام‌نشده → مودالِ رزروی صندلی؛ جلسه‌ی‌مانده → نقشه‌ی
 *   بازگشتِ دقیق (کدام جلسه‌ها مانده‌اند + حلقه‌ی پیشرفت). سپس صحنه‌ی
 *   اینترو → رانر → نتیجه. گیتِ سمتِ سرور هم ساختِ تلاشِ تازه را به تکمیلِ
 *   همه‌ی جلسات گره زده است؛ اینجا قرآتِ انسانیِ همان قرارداد است.
 */
export function ExamArena({ course, orderedLessons, lastLesson }: Props) {
  const [stage, setStage] = useState<Stage>({ kind: 'boot' });
  const [authOpen, setAuthOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [posting, setPosting] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const evaluate = useCallback(async () => {
    if (!hasSession()) {
      if (alive.current) setStage({ kind: 'guest' });
      return;
    }
    if (alive.current) setStage({ kind: 'boot' });
    const mine = await fetchMyEnrollment(course.slug);
    if (!alive.current) return;
    if (!mine) {
      setStage({ kind: 'not-enrolled' });
      return;
    }
    const remaining = orderedLessons.filter((l) => !mine.progressMap.get(l.id)?.isCompleted);
    if (remaining.length > 0) {
      const doneCount = orderedLessons.length - remaining.length;
      const percent =
        orderedLessons.length > 0
          ? (doneCount / orderedLessons.length) * 100
          : mine.summary.progressPercent;
      setStage({ kind: 'locked', remaining, percent, doneCount });
      return;
    }
    const meta = await fetchQuizMeta(course.slug);
    if (!alive.current) return;
    if (!meta) {
      setStage({ kind: 'no-quiz' });
      return;
    }
    setStage({ kind: 'intro', meta, attemptError: null });
  }, [course.slug, orderedLessons]);

  useEffect(() => {
    void evaluate();
  }, [evaluate]);

  /* ── ثبت‌نام با تأیید (همان میکرو-سرمونیِ صفحه‌ی کلاس) ── */
  const enroll = useCallback(async () => {
    setConfirmError(null);
    setPosting(true);
    try {
      await apiFetch(`/lms/courses/${encodeURIComponent(course.slug)}/enroll/`, {
        method: 'POST',
        cache: 'no-store',
      });
      if (!alive.current) return;
      setPosting(false);
      setConfirmOpen(false);
      await evaluate();
    } catch (err) {
      if (!alive.current) return;
      setPosting(false);
      setConfirmError(isApiError(err) ? err.message : 'ثبت‌نام انجام نشد؛ دوباره تلاش کنید.');
    }
  }, [course.slug, evaluate]);

  /* ── آغاز تلاش ── */
  const start = useCallback(async () => {
    setStarting(true);
    const res = await startQuizAttempt(course.slug);
    if (!alive.current) return;
    setStarting(false);
    if (res.kind === 'ok') {
      setStage({ kind: 'running', attempt: res.attempt });
    } else {
      setStage((prev) =>
        prev.kind === 'intro'
          ? { kind: 'intro', meta: prev.meta, attemptError: res.message }
          : { kind: 'error', message: res.message },
      );
    }
  }, [course.slug]);

  const lessonHref = (l: LmsLesson) =>
    `/lms/courses/${encodeURIComponent(course.slug)}/lessons/${encodeURIComponent(l.slug)}`;

  /* ════════ نماها ════════ */

  if (stage.kind === 'boot') {
    return (
      <div className="grid min-h-[380px] place-items-center rounded-[24px] border border-ink-100 bg-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-mint-500" aria-hidden="true" />
          <p className="text-[12px] font-bold text-ink-400">در حال آماده‌سازی آزمون دوره…</p>
        </div>
      </div>
    );
  }

  if (stage.kind === 'guest' || stage.kind === 'not-enrolled') {
    const isGuest = stage.kind === 'guest';
    return (
      <>
        <FinaleShell tone="ink">
          <ShellBadge icon={Lock} text="آزمون ویژه‌ی اعضای کلاس" tone="muted" />
          <h2 className="mt-4 text-[22px] font-black leading-9 text-white sm:text-[26px]">
            {isGuest ? 'شرکت در آزمون دوره فقط با حسابِ کاربری' : 'صندلی‌ات هنوز رزرو نشده'}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-[12.5px] font-bold leading-7 text-white/60">
            {isGuest
              ? 'آزمونِ پایانی، مرحله‌ی آخرِ مسیرِ کلاس است؛ ابتدا وارد حسابت شو، بعد اگر عضوِ کلاسی دروازه برایت باز می‌شود.'
              : 'برای ورود به جلسه‌ی پایانی، همین حالا رایگان در کلاس ثبت‌نام کن؛ همه‌ی جلسات هم فوری باز می‌شوند.'}
          </p>
          <button
            type="button"
            onClick={() => (isGuest ? setAuthOpen(true) : setConfirmOpen(true))}
            className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-mint-500 px-7 text-[14px] font-black text-ink-950 shadow-[0_16px_34px_-14px_rgba(20,184,166,.75)] transition hover:bg-mint-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-300"
          >
            {isGuest ? (
              <LogIn className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Rocket className="h-4 w-4" aria-hidden="true" />
            )}
            {isGuest ? 'ورود | ثبت‌نام' : 'رزروی صندلی — رایگان'}
          </button>
          <Link
            href={`/lms/courses/${encodeURIComponent(course.slug)}`}
            className="mt-3 inline-flex items-center gap-1 text-[11.5px] font-extrabold text-white/45 transition hover:text-white"
          >
            بازگشت به صفحه‌ی کلاس
          </Link>
        </FinaleShell>
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} initialView="login" />
        <EnrollConfirmModal
          open={confirmOpen}
          course={course}
          busy={posting}
          error={confirmError}
          onConfirm={() => void enroll()}
          onClose={() => setConfirmOpen(false)}
        />
      </>
    );
  }

  if (stage.kind === 'locked') {
    return (
      <div className="overflow-hidden rounded-[24px] border border-gold-200/70 bg-gradient-to-b from-gold-50/70 to-white shadow-[0_20px_50px_-35px_rgba(240,148,26,.5)]">
        <div className="flex flex-col items-center px-5 py-8 text-center sm:px-8">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 text-white shadow-[0_14px_30px_-12px_rgba(240,148,26,.8)]">
            <DoorClosed className="h-7 w-7" aria-hidden="true" />
          </span>
          <ShellBadge icon={Hourglass} text="دروازه‌ی آزمون هنوز بسته است" tone="gold-light" />
          <h2 className="mt-3 text-[20px] font-black leading-9 text-ink-900 sm:text-[23px]">
            {fa(stage.remaining.length)} جلسه تا آزمون دوره مانده
          </h2>
          <p className="mx-auto mt-1.5 max-w-md text-[12.5px] font-bold leading-7 text-ink-500">
            آزمونِ پایانی مثلِ یک جلسه‌ی مستقل است؛ وقتی همه‌ی جلسات را تماشا کنی، دروازه‌اش همین‌جا
            برایت باز می‌شود.
          </p>
          <div className="mt-4">
            <LessonProgressRing percent={stage.percent} size={92} stroke={9} />
            <p className="mt-1.5 text-[10.5px] font-black text-ink-400">
              {fa(stage.doneCount)} از {fa(orderedLessons.length)} جلسه تماشا شده
            </p>
          </div>
        </div>

        <div className="border-t border-gold-100 bg-white/70 px-4 py-4 sm:px-6">
          <p className="mb-2.5 flex items-center gap-1.5 text-[11px] font-black text-ink-500">
            <ListChecks className="h-4 w-4 text-gold-600" aria-hidden="true" />
            جلسه‌های باقی‌مانده — مستقیم برو سراغشان:
          </p>
          <ol className="space-y-2">
            {stage.remaining.map((l) => {
              const idx = orderedLessons.findIndex((x) => x.id === l.id) + 1;
              const TypeIcon = TYPE_ICON[l.contentType];
              const tone = TYPE_TONE[l.contentType];
              return (
                <li key={l.id}>
                  <Link
                    href={lessonHref(l)}
                    className="group flex items-center gap-3 rounded-xl border border-ink-100 bg-white px-3.5 py-2.5 transition hover:border-mint-300 hover:shadow-[0_10px_24px_-16px_rgba(20,184,166,.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-300"
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink-900 text-[10px] font-black tabular-nums text-white">
                      {fa(idx)}
                    </span>
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ring-1 ${tone}`}
                    >
                      <TypeIcon className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[12px] font-black text-ink-700">
                      {l.title}
                    </span>
                    <ArrowLeft
                      className="h-4 w-4 shrink-0 text-mint-600 transition group-hover:-translate-x-1"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              );
            })}
          </ol>
          <Link
            href={
              lastLesson
                ? lessonHref(lastLesson)
                : `/lms/courses/${encodeURIComponent(course.slug)}`
            }
            className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-full border border-gold-300 bg-gold-50 px-5 text-[12px] font-extrabold text-gold-800 transition hover:bg-gold-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
          >
            <Flame className="h-4 w-4" aria-hidden="true" />
            برگرد به مسیر — از جلسه‌ی آخر
          </Link>
        </div>
      </div>
    );
  }

  if (stage.kind === 'no-quiz') {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-[24px] border border-ink-100 bg-white p-8 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-ink-50 text-ink-300">
          <ShieldQuestion className="h-7 w-7" aria-hidden="true" />
        </span>
        <p className="text-[16px] font-black text-ink-800">تو مسیر را کامل کردی! 🌱</p>
        <p className="max-w-sm text-[12.5px] font-bold leading-7 text-ink-400">
          آزمونِ این کلاس هنوز منتشر نشده است؛ همین که فعال شود، همین صفحه دروازه‌اش را برایت باز
          می‌کند.
        </p>
        <Link
          href={`/lms/courses/${encodeURIComponent(course.slug)}`}
          className="mt-2 inline-flex h-10 items-center gap-1.5 rounded-full bg-mint-500 px-6 text-[12.5px] font-extrabold text-ink-950 transition hover:bg-mint-400"
        >
          صفحه‌ی کلاس
        </Link>
      </div>
    );
  }

  if (stage.kind === 'error') {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-[24px] border border-ink-100 bg-white p-8 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gold-50 text-gold-600">
          <AlertTriangle className="h-7 w-7" aria-hidden="true" />
        </span>
        <p className="max-w-md text-[14px] font-bold leading-7 text-ink-700">{stage.message}</p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => void evaluate()}
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-brand-600 px-5 text-[12.5px] font-extrabold text-white transition hover:bg-brand-500"
          >
            تلاش دوباره
          </button>
          <Link
            href={`/lms/courses/${encodeURIComponent(course.slug)}`}
            className="inline-flex h-10 items-center rounded-full border border-ink-200 px-5 text-[12.5px] font-extrabold text-ink-600 transition hover:border-ink-300"
          >
            صفحه‌ی کلاس
          </Link>
        </div>
      </div>
    );
  }

  if (stage.kind === 'running') {
    return (
      <ExamRunner
        key={stage.attempt.id}
        attempt={stage.attempt}
        courseSlug={course.slug}
        courseTitle={course.title}
        // پس از هر نتیجه، وضعیتِ تازه‌ی سرور خوانده می‌شود تا در صورت کول‌داون،
        // همان صحنه‌ی «تلاش بعدی کی باز می‌شود» با شمارشِ معکوسِ زنده بیاید.
        onRetry={() => void evaluate()}
      />
    );
  }

  /* stage.kind === 'intro' — صحنه‌ی اصلیِ آزمون */
  const m = stage.meta;
  const rules = [
    {
      icon: ClipboardList,
      text: `پاسخ به هر ${fa(m.questions_count)} سؤال — ترتیبِ سؤال‌ها و گزینه‌ها امن و منحصر‌به‌تو است`,
    },
    {
      icon: Hourglass,
      text: `${fa(m.time_limit_minutes)} دقیقه فرصت؛ با تمام‌شدن زمان، پاسخ‌ها خودکار ثبت می‌شوند`,
    },
    {
      icon: Trophy,
      text: `حدِّ قبولی ${faScore(m.passing_score)} از ۲۰ — با قبولی، گواهی بلافاصله صادر می‌شود`,
    },
    {
      icon: CalendarClock,
      text: `${fa(m.max_attempts)} تلاش مجاز؛ تلاشِ ناتمام ذخیره می‌شود و از همان‌جا ادامه می‌دهی`,
    },
  ];
  return (
    <FinaleShell tone="gold">
      <ShellBadge icon={GraduationCap} text="جلسه‌ی پایانی مسیر" tone="gold" />
      <h2 className="mt-4 text-[24px] font-black leading-9 text-white sm:text-[30px] sm:leading-[1.5]">
        {m.title || 'آزمون پایان دوره'}
      </h2>
      {m.description && (
        <p className="mx-auto mt-2 max-w-lg text-[12.5px] font-bold leading-7 text-white/60">
          {m.description}
        </p>
      )}
      <div className="mx-auto mt-6 grid max-w-xl grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5">
        {[
          { v: fa(m.questions_count), l: 'سؤال' },
          { v: `${fa(m.time_limit_minutes)}′`, l: 'زمان (دقیقه)' },
          { v: faScore(m.passing_score), l: 'حدِّ قبولی از ۲۰' },
          { v: fa(m.max_attempts), l: 'تلاش مجاز' },
        ].map((s) => (
          <div
            key={s.l}
            className="rounded-xl border border-white/10 bg-white/[.06] px-3 py-2.5 text-center backdrop-blur-sm"
          >
            <p className="text-[16px] font-black tabular-nums text-mint-300">{s.v}</p>
            <p className="mt-0.5 text-[9.5px] font-bold text-white/50">{s.l}</p>
          </div>
        ))}
      </div>

      <ul className="mx-auto mt-6 max-w-lg space-y-2 text-right">
        {rules.map((r, i) => (
          <li
            key={i}
            className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[.04] px-3.5 py-2.5"
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-mint-500/15 text-mint-300 ring-1 ring-mint-400/25">
              <r.icon className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <span className="text-[11.5px] font-bold leading-6 text-white/80">{r.text}</span>
          </li>
        ))}
      </ul>

      {stage.attemptError && (
        <p
          role="alert"
          className="mx-auto mt-4 max-w-lg rounded-xl bg-rose-500/10 px-4 py-2.5 text-[12px] font-bold leading-6 text-rose-200 ring-1 ring-rose-400/25"
        >
          {stage.attemptError}
        </p>
      )}

      {/* تصویرِ زنده‌ی سیاستِ قفل — آینه‌ی دقیقِ سرور:
          کول‌داون → شمارشِ معکوسِ بازگشایی؛ قبول‌شده → جایزه؛ تمام‌شده → بن‌بست نیست، گفت‌وگو */}
      {(() => {
        const st = m.attempt_state;
        if (st?.locked_reason === 'cooldown' && st.retry_at) {
          return (
            <RetryCountdown
              retryAt={st.retry_at}
              attemptsLeft={st.attempts_left}
              allowedAttempts={st.allowed_attempts}
              onUnlock={() => void evaluate()}
            />
          );
        }
        if (st?.locked_reason === 'passed') {
          return (
            <div className="mt-7 flex flex-col items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-mint-500/15 px-5 py-2.5 text-[13px] font-extrabold text-mint-200 ring-1 ring-mint-400/30">
                <Trophy className="h-4 w-4" aria-hidden="true" />
                تو این آزمون را قبول شده‌ای — گواهیت صادر شده است 🎓
              </span>
              <p className="text-[11px] font-bold text-white/40">
                هر وقت بخواهی می‌توانی برای تثبیت، دوباره رقابت کنی.
              </p>
            </div>
          );
        }
        if (st && !st.can_attempt && st.locked_reason === 'out_of_attempts') {
          return (
            <p className="mt-7 max-w-md rounded-xl bg-gold-500/10 px-5 py-3 text-[12px] font-bold leading-6 text-gold-200 ring-1 ring-gold-400/25">
              سهمیه‌ی تلاش‌های این آزمون تمام شده است؛ برای تلاشِ بیشتر با پشتیبانی در تماس باش.
            </p>
          );
        }
        const attemptsNote =
          st && st.allowed_attempts > 0
            ? `تلاشِ ${fa(Math.min(st.attempts_used + 1, st.allowed_attempts))} از ${fa(st.allowed_attempts)}`
            : null;
        return (
          <>
            <button
              type="button"
              onClick={() => void start()}
              disabled={starting}
              className="mt-7 inline-flex h-12 items-center gap-2.5 rounded-full bg-gradient-to-l from-mint-400 to-mint-500 px-9 text-[15px] font-black text-ink-950 shadow-[0_20px_44px_-16px_rgba(20,184,166,.8)] transition hover:-translate-y-0.5 hover:from-mint-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-300 active:scale-[.98] disabled:opacity-60"
            >
              {starting ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : (
                <Flame className="h-5 w-5" aria-hidden="true" />
              )}
              {starting
                ? 'در حال ورود به آزمون…'
                : st?.has_in_progress
                  ? 'ادامه‌ی تلاشِ ناتمام'
                  : 'ورود به آزمون'}
            </button>
            <p className="mt-3 text-[10.5px] font-bold text-white/35">
              با شروع آزمون، تایمر راه می‌افتد؛ خروج از صفحه تلاش را نمی‌سوزاند.
              {attemptsNote && <span className="ms-1.5 text-gold-300/70">{attemptsNote}</span>}
            </p>
          </>
        );
      })()}
    </FinaleShell>
  );
}

/* ── صحنه‌ی «تلاش بعدی کی باز می‌شود» — شمارشِ معکوسِ زنده‌ی کول‌داون ── */

function RetryCountdown({
  retryAt,
  attemptsLeft,
  allowedAttempts,
  onUnlock,
}: {
  retryAt: string;
  attemptsLeft: number;
  allowedAttempts: number;
  onUnlock: () => void;
}) {
  const target = new Date(retryAt).getTime();
  const [now, setNow] = useState(() => Date.now());
  const firedRef = useRef(false);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const remainMs = Math.max(0, target - now);
  const remainSec = Math.ceil(remainMs / 1000);

  useEffect(() => {
    if (remainMs <= 0 && !firedRef.current) {
      firedRef.current = true;
      onUnlock();
    }
  }, [remainMs, onUnlock]);

  const days = Math.floor(remainSec / 86400);
  const hours = Math.floor((remainSec % 86400) / 3600);
  const minutes = Math.floor((remainSec % 3600) / 60);
  const seconds = remainSec % 60;
  const cells = [
    { v: days, l: 'روز' },
    { v: hours, l: 'ساعت' },
    { v: minutes, l: 'دقیقه' },
    { v: seconds, l: 'ثانیه' },
  ];

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="retry-countdown"
      className="mx-auto mt-7 w-full max-w-lg rounded-2xl border border-gold-300/25 bg-gold-400/[.07] px-5 py-5 backdrop-blur-sm"
    >
      <p className="flex items-center justify-center gap-2 text-[13px] font-black text-gold-200">
        <Lock className="h-4 w-4" aria-hidden="true" />
        دروازه‌ی تلاش بعدی فعلاً بسته است
      </p>
      <p className="mt-1 text-[11px] font-bold leading-6 text-white/50">
        تلاشِ قبلی به حدِّ قبولی نرسید؛ صندلیِ تازه‌ات در حال آماده‌سازی است:
      </p>
      <div dir="rtl" className="mt-4 grid grid-cols-4 gap-2">
        {cells.map((c) => (
          <div
            key={c.l}
            className="rounded-xl border border-gold-300/25 bg-ink-950/50 px-2 py-2.5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,.06)]"
          >
            <p
              className={`text-[22px] font-black tabular-nums leading-7 ${c.v > 0 ? 'text-gold-300' : 'text-white/25'}`}
            >
              {fa(c.v)}
            </p>
            <p className="mt-0.5 text-[9.5px] font-bold text-white/45">{c.l}</p>
          </div>
        ))}
      </div>
      <p className="mt-3.5 text-[11px] font-extrabold text-mint-200/90">
        {fa(attemptsLeft)} تلاش دیگر از مجموع {fa(allowedAttempts)} تلاش برایت محفوظ است
      </p>
      <p className="mt-1 text-[10px] font-bold text-white/35">
        همین که شمارش به صفر برسد، دروازه خودش همین‌جا باز می‌شود — نیازی به رفرش نیست.
      </p>
    </div>
  );
}

/* ── پوسته‌ی تیره‌ی مشترکِ صحنه‌ها ── */

function FinaleShell({ children, tone }: { children: React.ReactNode; tone: 'ink' | 'gold' }) {
  return (
    <div className="relative overflow-hidden rounded-[24px] bg-ink-900 px-5 py-10 text-center shadow-[0_30px_70px_-35px_rgba(0,0,0,.8)] sm:px-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[.5]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(-45deg, rgba(255,255,255,.035) 0 2px, transparent 2px 14px)',
        }}
      />
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full blur-3xl ${tone === 'gold' ? 'bg-gold-500/20' : 'bg-brand-500/20'}`}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-16 bottom-0 h-52 w-52 rounded-full bg-mint-500/15 blur-3xl"
      />
      <div className="relative flex flex-col items-center">{children}</div>
    </div>
  );
}

function ShellBadge({
  icon: Icon,
  text,
  tone,
}: {
  icon: typeof Sparkles;
  text: string;
  /** gold = روی پوسته‌ی تیره؛ gold-light = روی کارتِ روشنِ قفل */
  tone: 'muted' | 'gold' | 'gold-light';
}) {
  return (
    <span
      className={`mt-5 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10.5px] font-extrabold ring-1 ${
        tone === 'gold'
          ? 'bg-gold-400/15 text-gold-200 ring-gold-300/30'
          : tone === 'gold-light'
            ? 'bg-gold-400/15 text-gold-800 ring-gold-300/50'
            : 'bg-white/10 text-mint-200 ring-white/15'
      }`}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {text}
    </span>
  );
}
