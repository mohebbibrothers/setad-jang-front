'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Loader2,
  LogIn,
  MessageCircleQuestion,
  NotebookText,
  Paperclip,
  PartyPopper,
  Play,
  UserRound,
} from 'lucide-react';

import { AuthModal } from '@/components/auth/AuthModal';
import { apiFetch, isApiError } from '@/lib/api';
import { hasSession, onAuthChange } from '@/lib/auth-tokens';
import {
  fetchMyEnrollment,
  type LessonProgressEntry,
  type MyEnrollmentSummary,
} from '@/lib/lms-lesson';
import type { LmsCourseDetail, LmsLesson } from '@/lib/lms-shared';
import { formatLmsDuration } from '@/lib/lms-shared';
import { useAuth } from '@/lib/use-auth';
import { LessonAttachmentCard } from './LessonAttachmentCard';
import { LessonQaPanel } from './LessonQaPanel';
import { LessonQuizStage } from './LessonQuizStage';
import { LessonRail } from './LessonRail';
import { LessonTextStage } from './LessonTextStage';
import { LessonVideoStage } from './LessonVideoStage';

const fa = (n: number) => n.toLocaleString('fa-IR');

type Access =
  | { kind: 'boot' }
  | { kind: 'guest' }
  | { kind: 'restricted' }
  | {
      kind: 'enrolled';
      summary: MyEnrollmentSummary;
      progressMap: Map<number, LessonProgressEntry>;
    };

type Props = {
  course: LmsCourseDetail;
  lesson: LmsLesson;
  lessonIndex: number;
  totalLessons: number;
  orderedLessons: LmsLesson[];
  prevLesson: LmsLesson | null;
  nextLesson: LmsLesson | null;
  typeLabel: string;
};

type TabId = 'about' | 'qa' | 'attach';

/**
 * کنسول جلسه — ارکسترِ دسترسی + صحنه + ریل سیلابوس.
 *
 * قواعد دسترسی (قراردادِ بک‌اند):
 *   guest      → همیشه قفل (media حتی برای جلسه‌ی رایگان login می‌خواهد)
 *   restricted → جلسه‌ی رایگان: صحنه + بنرِ ثبت‌نام؛ بقیه: قفل با CTAِ ثبت‌نام
 *   enrolled   → همه‌چیز + heartbeat پیشرفت + پرسش‌وپاسخ + آزمون
 */
export function LessonConsole({
  course,
  lesson,
  lessonIndex,
  totalLessons,
  orderedLessons,
  prevLesson,
  nextLesson,
  typeLabel,
}: Props) {
  const { isAuthenticated } = useAuth();
  const [access, setAccess] = useState<Access>({ kind: 'boot' });
  const [authOpen, setAuthOpen] = useState(false);
  const [enrollBusy, setEnrollBusy] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [justCompleted, setJustCompleted] = useState(false);
  const [tab, setTab] = useState<TabId>('about');
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const loadAccess = useCallback(async () => {
    if (!hasSession()) {
      if (alive.current) setAccess({ kind: 'guest' });
      return;
    }
    if (alive.current) setAccess({ kind: 'boot' });
    const mine = await fetchMyEnrollment(course.slug);
    if (!alive.current) return;
    setAccess(
      mine
        ? { kind: 'enrolled', summary: mine.summary, progressMap: mine.progressMap }
        : { kind: 'restricted' },
    );
  }, [course.slug]);

  useEffect(() => {
    void loadAccess();
    return onAuthChange(() => void loadAccess());
  }, [loadAccess]);

  /* refresh سبکِ خلاصه‌ی ثبت‌نام پس از هر تکمیل (درصدِ تجمیعی را سرور می‌سازد) */
  const refreshSummary = useCallback(async () => {
    const mine = await fetchMyEnrollment(course.slug);
    if (!alive.current || !mine) return;
    setAccess((prev) =>
      prev.kind === 'enrolled'
        ? { kind: 'enrolled', summary: mine.summary, progressMap: mine.progressMap }
        : prev,
    );
  }, [course.slug]);

  /** به‌روزرسانیِ نقشه‌ی پیشرفت از قلبِ صحنه (heartbeat یا دکمه‌ی «خواندم»). */
  const patchProgress = useCallback((lessonId: number, entry: Partial<LessonProgressEntry>) => {
    setAccess((prev) => {
      if (prev.kind !== 'enrolled') return prev;
      const next = new Map(prev.progressMap);
      const prevEntry = next.get(lessonId);
      next.set(lessonId, {
        lessonId,
        watchedSeconds: 0,
        durationSnapshot: 0,
        progressPercent: 0,
        isCompleted: false,
        lastPositionSeconds: 0,
        ...prevEntry,
        ...entry,
      });
      return { ...prev, progressMap: next };
    });
  }, []);

  const handleCompleted = useCallback(
    (lessonId: number) => {
      patchProgress(lessonId, { isCompleted: true, progressPercent: 100 });
      setJustCompleted(true);
      void refreshSummary();
    },
    [patchProgress, refreshSummary],
  );

  /* ── ثبت‌نام ── */
  const enroll = useCallback(async () => {
    setEnrollBusy(true);
    setEnrollError(null);
    try {
      await apiFetch(`/lms/courses/${encodeURIComponent(course.slug)}/enroll/`, {
        method: 'POST',
        cache: 'no-store',
      });
      if (!alive.current) return;
      await loadAccess();
    } catch (err) {
      if (!alive.current) return;
      const msg = isApiError(err) ? err.message : 'ثبت‌نام انجام نشد؛ دوباره تلاش کنید.';
      setEnrollError(msg);
    } finally {
      if (alive.current) setEnrollBusy(false);
    }
  }, [course.slug, loadAccess]);

  const progressEntry = access.kind === 'enrolled' ? access.progressMap.get(lesson.id) : undefined;
  const isCompleted = progressEntry?.isCompleted ?? false;
  const completedCount =
    access.kind === 'enrolled'
      ? [...access.progressMap.values()].filter((p) => p.isCompleted).length
      : 0;
  const stageAllowed =
    access.kind === 'enrolled' || (access.kind === 'restricted' && lesson.isPreview);

  const tabs = useMemo(
    () => [
      { id: 'about' as TabId, label: 'درباره‌ی جلسه', icon: NotebookText },
      { id: 'qa' as TabId, label: 'پرسش‌وپاسخ', icon: MessageCircleQuestion },
      ...(lesson.attachmentUrl ? [{ id: 'attach' as TabId, label: 'پیوست', icon: Paperclip }] : []),
    ],
    [lesson.attachmentUrl],
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_330px]">
      {/* ═══════════ ستونِ اصلی ═══════════ */}
      <div className="min-w-0">
        {/* هدرِ جلسه */}
        <header className="mb-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-mint-50 px-2.5 py-1 text-[10.5px] font-extrabold text-mint-700 ring-1 ring-mint-100">
              جلسه‌ی {fa(lessonIndex + 1)} از {fa(totalLessons)}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[10.5px] font-extrabold text-ink-600 ring-1 ring-ink-100">
              {typeLabel}
            </span>
            {lesson.durationSeconds > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[10.5px] font-extrabold text-ink-600 ring-1 ring-ink-100">
                {formatLmsDuration(lesson.durationSeconds)}
              </span>
            )}
            {isCompleted && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-600 px-2.5 py-1 text-[10.5px] font-extrabold text-white">
                <BadgeCheck className="h-3 w-3" aria-hidden="true" />
                تکمیل‌شده
              </span>
            )}
            {justCompleted && !isCompleted && (
              <span className="inline-flex items-center gap-1 rounded-full bg-mint-500 px-2.5 py-1 text-[10.5px] font-extrabold text-ink-950">
                <PartyPopper className="h-3 w-3" aria-hidden="true" />
                آفرین!
              </span>
            )}
          </div>
          <h1 className="mt-3 text-[24px] font-black leading-9 text-ink-900 md:text-[30px] md:leading-[1.3]">
            {lesson.title}
          </h1>
          {access.kind === 'enrolled' && (
            <div className="mt-4 flex items-center gap-3">
              <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-ink-100">
                <div
                  className="h-full rounded-full bg-gradient-to-l from-brand-500 to-mint-400 transition-all duration-700"
                  style={{ width: `${Math.round(access.summary.progressPercent)}%` }}
                />
              </div>
              <span className="shrink-0 text-[11.5px] font-black tabular-nums text-brand-700">
                {fa(Math.round(access.summary.progressPercent))}٪
              </span>
              <span className="shrink-0 text-[10.5px] font-bold text-ink-400">
                {fa(completedCount)} از {fa(totalLessons)} جلسه
              </span>
            </div>
          )}
        </header>

        {/* صحنه */}
        {access.kind === 'boot' && (
          <div className="grid aspect-video place-items-center rounded-[22px] bg-ink-900/95">
            <Loader2 className="h-8 w-8 animate-spin text-mint-300" aria-hidden="true" />
          </div>
        )}
        {(access.kind === 'guest' || (access.kind === 'restricted' && !lesson.isPreview)) && (
          <div className="relative grid aspect-video place-items-center overflow-hidden rounded-[22px] bg-ink-900 p-6 text-center">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-60 [background:radial-gradient(60%_80%_at_70%_20%,rgba(16,185,129,.15),transparent)]"
            />
            <div className="relative max-w-sm">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/15 backdrop-blur">
                {access.kind === 'guest' ? (
                  <UserRound className="h-6 w-6 text-mint-300" aria-hidden="true" />
                ) : (
                  <Play className="h-6 w-6 text-mint-300" aria-hidden="true" />
                )}
              </span>
              <p className="mt-4 text-[17px] font-black text-white">
                {access.kind === 'guest'
                  ? lesson.isPreview
                    ? 'این جلسه رایگان است؛ فقط وارد شو'
                    : 'برای تماشا وارد حسابت شو'
                  : 'این جلسه ویژه‌ی ثبت‌نام‌شده‌هاست'}
              </p>
              <p className="mt-1.5 text-[12.5px] leading-6 text-white/60">
                {access.kind === 'guest'
                  ? 'ثبت پیشرفت، تماشای رسانه و پرسش‌وپاسخ با حسابِ کاربری فعال می‌شود.'
                  : `با ثبت‌نام رایگان در «${course.title}» همه‌ی جلسات، پیشرفت، پرسش‌وپاسخ و آزمون فعال می‌شود.`}
              </p>
              {access.kind === 'guest' ? (
                <button
                  type="button"
                  onClick={() => setAuthOpen(true)}
                  className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-mint-500 px-7 text-[13px] font-extrabold text-ink-950 shadow-[0_12px_28px_-10px_rgba(20,184,166,.65)] transition hover:bg-mint-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-300"
                >
                  <LogIn className="h-4 w-4" aria-hidden="true" />
                  ورود | ثبت‌نام
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void enroll()}
                  disabled={enrollBusy}
                  className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-mint-500 px-7 text-[13px] font-extrabold text-ink-950 shadow-[0_12px_28px_-10px_rgba(20,184,166,.65)] transition hover:bg-mint-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-300 disabled:opacity-60"
                >
                  {enrollBusy ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                  )}
                  ثبت‌نام رایگان در کلاس
                </button>
              )}
              {enrollError && (
                <p className="mt-3 rounded-xl bg-gold-50 px-4 py-2.5 text-[12px] font-bold leading-6 text-gold-800 ring-1 ring-gold-200">
                  {enrollError}{' '}
                  {enrollError.includes('پروفایل') && (
                    <Link
                      href="/profile"
                      className="hover:text-gold-900 underline underline-offset-4"
                    >
                      تکمیل پروفایل ←
                    </Link>
                  )}
                </p>
              )}
            </div>
          </div>
        )}
        {stageAllowed &&
          (lesson.contentType === 'article' || lesson.contentType === 'document' ? (
            <LessonTextStage
              key={`${lesson.id}-text`}
              lesson={lesson}
              enrolled={access.kind === 'enrolled'}
              progress={progressEntry}
              onCompleted={() => handleCompleted(lesson.id)}
            />
          ) : (
            <LessonVideoStage
              key={`${lesson.id}-video`}
              lesson={lesson}
              enrolled={access.kind === 'enrolled'}
              progress={progressEntry}
              onTick={(entry) => patchProgress(lesson.id, entry)}
              onCompleted={() => handleCompleted(lesson.id)}
            />
          ))}
        {access.kind === 'restricted' && lesson.isPreview && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-mint-100 bg-mint-50 px-4 py-3">
            <p className="text-[12px] font-bold leading-6 text-mint-800">
              این جلسه‌ی رایگان است — با ثبت‌نام، پیشرفتت ذخیره و {fa(totalLessons - 1)} جلسه‌ی دیگر
              هم باز می‌شود.
            </p>
            <button
              type="button"
              onClick={() => void enroll()}
              disabled={enrollBusy}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-mint-600 px-4 text-[12px] font-extrabold text-white transition hover:bg-mint-500 disabled:opacity-60"
            >
              {enrollBusy && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
              ثبت‌نام رایگان
            </button>
          </div>
        )}

        {/* تب‌ها */}
        <div className="mt-8">
          <div className="flex items-center gap-1 border-b border-ink-100" role="tablist">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`relative inline-flex items-center gap-1.5 px-3.5 pb-3 pt-1 text-[12.5px] font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-300 ${
                  tab === t.id ? 'text-brand-700' : 'text-ink-400 hover:text-ink-700'
                }`}
              >
                <t.icon className="h-4 w-4" aria-hidden="true" />
                {t.label}
                {tab === t.id && (
                  <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-600" />
                )}
              </button>
            ))}
          </div>
          <div className="pt-5">
            {tab === 'about' && (
              <div className="space-y-3 text-[13.5px] leading-8 text-ink-600">
                {lesson.summary && (
                  <p className="rounded-2xl border border-ink-100 bg-white p-4 font-bold text-ink-700">
                    {lesson.summary}
                  </p>
                )}
                {lesson.description ? (
                  lesson.description.split(/\n{2,}/).map((para, i) => <p key={i}>{para.trim()}</p>)
                ) : (
                  <p className="text-ink-400">
                    توضیح تکمیلی برای این جلسه هنوز نوشته نشده است؛ اگر پرسشی داری همین‌جا در تبِ
                    پرسش‌وپاسخ بپرس.
                  </p>
                )}
              </div>
            )}
            {tab === 'qa' && (
              <LessonQaPanel
                lessonId={lesson.id}
                enrolled={access.kind === 'enrolled'}
                isGuest={access.kind === 'guest' || !isAuthenticated}
                onLogin={() => setAuthOpen(true)}
                onEnroll={() => void enroll()}
              />
            )}
            {tab === 'attach' && lesson.attachmentUrl && (
              <LessonAttachmentCard
                lessonId={lesson.id}
                title={lesson.attachmentTitle}
                enrolled={access.kind === 'enrolled'}
                isPreview={lesson.isPreview}
              />
            )}
          </div>
        </div>

        {/* ناوبری قبلی/بعدی */}
        <nav aria-label="ناوبری جلسات" className="mt-8 grid gap-3 sm:grid-cols-2">
          {prevLesson ? (
            <Link
              href={`/lms/courses/${encodeURIComponent(course.slug)}/lessons/${encodeURIComponent(prevLesson.slug)}`}
              className="group flex items-center gap-3 rounded-2xl border border-ink-100 bg-white p-4 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-[0_14px_30px_-20px_rgba(11,53,48,.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ink-50 text-ink-500 transition group-hover:bg-brand-50 group-hover:text-brand-600">
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-[10px] font-extrabold text-ink-400">جلسه‌ی قبلی</span>
                <span className="block truncate text-[13px] font-black text-ink-800">
                  {prevLesson.title}
                </span>
              </span>
            </Link>
          ) : (
            <span className="hidden sm:block" />
          )}
          {nextLesson ? (
            <Link
              href={`/lms/courses/${encodeURIComponent(course.slug)}/lessons/${encodeURIComponent(nextLesson.slug)}`}
              className="group flex items-center justify-end gap-3 rounded-2xl border border-brand-100 bg-gradient-to-l from-mint-50 to-white p-4 text-left transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-[0_14px_30px_-20px_rgba(16,185,129,.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-300"
            >
              <span className="min-w-0 text-left">
                <span className="block text-[10px] font-extrabold text-mint-700">
                  جلسه‌ی بعدی {isCompleted ? '— بزن بریم!' : ''}
                </span>
                <span className="block truncate text-[13px] font-black text-ink-800">
                  {nextLesson.title}
                </span>
              </span>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-mint-500 text-ink-950 shadow-[0_8px_18px_-8px_rgba(20,184,166,.7)] transition group-hover:-translate-x-0.5">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </span>
            </Link>
          ) : (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-brand-100 bg-gradient-to-l from-brand-600 to-brand-700 p-4 text-white">
              <span className="min-w-0">
                <span className="block text-[10px] font-extrabold text-mint-200">
                  پایان سیلابوس
                </span>
                <span className="block truncate text-[13px] font-black">
                  به آخرین جلسه‌ی کلاس رسیدی 🎓
                </span>
              </span>
              <Link
                href={`/lms/courses/${encodeURIComponent(course.slug)}`}
                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-4 text-[12px] font-extrabold ring-1 ring-white/25 backdrop-blur transition hover:bg-white/25"
              >
                صفحه‌ی کلاس
              </Link>
            </div>
          )}
        </nav>
        {/* آزمونِ پایان‌دوره — در جلسه‌ی آخر، دقیقاً جایی که مسیر تمام می‌شود */}
        {nextLesson === null && (
          <section className="mt-9" aria-label="آزمون پایان‌دوره">
            <p className="mb-3 text-[12px] font-extrabold text-ink-400">
              قدمِ آخرِ مسیر — نمره‌ی قبولی یعنی صدور گواهی پایان‌دوره
            </p>
            <LessonQuizStage
              courseSlug={course.slug}
              courseTitle={course.title}
              enrolled={access.kind === 'enrolled'}
              onPassed={() => handleCompleted(lesson.id)}
            />
          </section>
        )}
      </div>

      {/* ═══════════ ریل سیلابوس ═══════════ */}
      <LessonRail
        course={course}
        orderedLessons={orderedLessons}
        currentLessonId={lesson.id}
        progressMap={access.kind === 'enrolled' ? access.progressMap : null}
        lastAccessedLessonId={
          access.kind === 'enrolled' ? access.summary.lastAccessedLessonId : null
        }
        enrolled={access.kind === 'enrolled'}
      />

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} initialView="login" />
    </div>
  );
}
