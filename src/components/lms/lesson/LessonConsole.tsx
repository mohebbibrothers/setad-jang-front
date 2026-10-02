'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  GraduationCap,
  Loader2,
  MessageCircleQuestion,
  NotebookText,
  Paperclip,
  PartyPopper,
  Sparkles,
} from 'lucide-react';

import { AuthModal } from '@/components/auth/AuthModal';
import { EnrollConfirmModal } from '@/components/lms/enroll/EnrollConfirmModal';
import { apiFetch, isApiError } from '@/lib/api';
import { hasSession, onAuthChange } from '@/lib/auth-tokens';
import {
  computeLessonSequence,
  fetchMyEnrollment,
  type LessonProgressEntry,
  type MyEnrollmentSummary,
} from '@/lib/lms-lesson';
import type { LmsCourseDetail, LmsLesson } from '@/lib/lms-shared';
import { formatLmsDuration } from '@/lib/lms-shared';
import { LessonAttachmentCard } from './LessonAttachmentCard';
import { LessonQaPanel } from './LessonQaPanel';
import { LessonRail } from './LessonRail';
import { LessonSegBar } from './LessonSegBar';
import { LessonSeqLockedPanel } from './LessonSeqLockedPanel';
import { LessonStrip } from './LessonStrip';
import { LessonTextStage } from './LessonTextStage';
import { LessonUnlockPanel } from './LessonUnlockPanel';
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
 * کنسولِ جلسه — چیدمانِ «استودیوی یادگیری»:
 * ریلِ کلاس (راست) + صحنه + نوارِ کنسول (ناوبریِ قبلی/بعدی + سگمنت‌بارِ پیشرفت) +
 * نوارِ افقیِ جلسات در موبایل + تب‌ها + آزمون. قواعدِ دسترسی مطابقِ قراردادِ بک‌اند.
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
  const [access, setAccess] = useState<Access>({ kind: 'boot' });
  const [authOpen, setAuthOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [enrollBusy, setEnrollBusy] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const [flashNextId, setFlashNextId] = useState<number | null>(null);
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

  const refreshSummary = useCallback(async () => {
    const mine = await fetchMyEnrollment(course.slug);
    if (!alive.current || !mine) return;
    setAccess((prev) =>
      prev.kind === 'enrolled'
        ? { kind: 'enrolled', summary: mine.summary, progressMap: mine.progressMap }
        : prev,
    );
  }, [course.slug]);

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
      // زنجیره: تکمیلِ این جلسه، جلسه‌ی بعد را باز می‌کند — برقِ مینتی روی ردیفش
      const idx = orderedLessons.findIndex((l) => l.id === lessonId);
      const nextUnlocked = idx >= 0 ? orderedLessons[idx + 1] : undefined;
      if (nextUnlocked) {
        setFlashNextId(nextUnlocked.id);
        window.setTimeout(() => alive.current && setFlashNextId(null), 2600);
      }
    },
    [orderedLessons, patchProgress, refreshSummary],
  );

  /* ── ثبت‌نام: اولِ هر دکمه، پنجره‌ی تأیید؛ فقط بعد از تأیید POST می‌رود ── */
  const askEnroll = useCallback(() => {
    if (!hasSession()) {
      setAuthOpen(true);
      return;
    }
    setEnrollError(null);
    setConfirmOpen(true);
  }, []);

  const enroll = useCallback(async () => {
    setEnrollBusy(true);
    setEnrollError(null);
    try {
      await apiFetch(`/lms/courses/${encodeURIComponent(course.slug)}/enroll/`, {
        method: 'POST',
        cache: 'no-store',
      });
      if (!alive.current) return;
      setConfirmOpen(false);
      setCelebrating(true);
      await loadAccess();
      window.setTimeout(() => alive.current && setCelebrating(false), 1900);
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
  const stageAllowed =
    access.kind === 'enrolled' || (access.kind === 'restricted' && lesson.isPreview);
  const progressPercent = access.kind === 'enrolled' ? access.summary.progressPercent : 0;
  const accessKind = access.kind === 'boot' ? 'restricted' : access.kind;
  const progressMapForRender = access.kind === 'enrolled' ? access.progressMap : null;
  // زنجیره‌ی تماشا — نسخه‌ی کلاینتیِ گاردِ سروری؛ جلسه‌ی i باز ⟺ همه‌ی قبلی‌ها کامل
  const seqMap = useMemo(
    () =>
      access.kind === 'enrolled' ? computeLessonSequence(orderedLessons, access.progressMap) : null,
    [access, orderedLessons],
  );
  const currentSeq = seqMap?.get(lesson.id);
  const sequenceLocked =
    access.kind === 'enrolled' && !!currentSeq && !currentSeq.unlocked && !lesson.isPreview;

  const tabs = useMemo(
    () => [
      { id: 'about' as TabId, label: 'درباره‌ی جلسه', icon: NotebookText },
      { id: 'qa' as TabId, label: 'پرسش‌وپاسخ', icon: MessageCircleQuestion },
      ...(lesson.attachmentUrl ? [{ id: 'attach' as TabId, label: 'پیوست', icon: Paperclip }] : []),
    ],
    [lesson.attachmentUrl],
  );

  const lessonHref = (l: LmsLesson) =>
    `/lms/courses/${encodeURIComponent(course.slug)}/lessons/${encodeURIComponent(l.slug)}`;

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)]">
      {/* ═══ ریلِ کلاس (ستونِ اول — سمتِ راست در RTL) ═══ */}
      <LessonRail
        course={course}
        orderedLessons={orderedLessons}
        currentLessonId={lesson.id}
        progressMap={progressMapForRender}
        progressPercent={progressPercent}
        lastAccessedLessonId={
          access.kind === 'enrolled' ? access.summary.lastAccessedLessonId : null
        }
        access={accessKind}
        seqMap={seqMap}
        flashNextId={flashNextId}
        enrollBusy={enrollBusy}
        onEnroll={askEnroll}
        onLogin={() => setAuthOpen(true)}
      />

      {/* ═══ ستونِ اصلی ═══ */}
      <div className="min-w-0">
        {/* هدر: چیپ‌ها + تیتر */}
        <header className="mb-3.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[10.5px] font-extrabold text-brand-700 ring-1 ring-brand-100">
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
              <span className="inline-flex items-center gap-1 rounded-full bg-mint-500 px-2.5 py-1 text-[10.5px] font-extrabold text-ink-950">
                <BadgeCheck className="h-3 w-3" aria-hidden="true" />
                تکمیل‌شده
              </span>
            )}
            {justCompleted && !isCompleted && (
              <span className="inline-flex items-center gap-1 rounded-full bg-mint-100 px-2.5 py-1 text-[10.5px] font-extrabold text-mint-800">
                <PartyPopper className="h-3 w-3" aria-hidden="true" />
                آفرین!
              </span>
            )}
          </div>
          <h1 className="mt-2.5 text-[21px] font-black leading-8 text-ink-900 md:text-[26px] md:leading-10">
            {lesson.title}
          </h1>
        </header>

        {/* نوارِ کنسول: قبلی/بعدی + سگمنت‌بار + ٪ */}
        <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-ink-100 bg-white px-3 py-2.5 shadow-sm">
          <div className="flex items-center gap-1">
            {prevLesson ? (
              <Link
                href={lessonHref(prevLesson)}
                aria-label={`جلسه‌ی قبلی: ${prevLesson.title}`}
                title={`جلسه‌ی قبلی: ${prevLesson.title}`}
                className="grid h-8 w-8 place-items-center rounded-full border border-ink-100 text-ink-500 transition hover:border-brand-200 hover:text-brand-700"
              >
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            ) : (
              <span className="grid h-8 w-8 place-items-center rounded-full border border-ink-50 text-ink-200">
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </span>
            )}
            {nextLesson ? (
              <Link
                href={lessonHref(nextLesson)}
                aria-label={`جلسه‌ی بعدی: ${nextLesson.title}`}
                title={`جلسه‌ی بعدی: ${nextLesson.title}`}
                className="grid h-8 w-8 place-items-center rounded-full border border-ink-100 text-ink-500 transition hover:border-mint-300 hover:text-mint-700"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </Link>
            ) : (
              <span className="grid h-8 w-8 place-items-center rounded-full border border-ink-50 text-ink-200">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </span>
            )}
          </div>
          <span className="text-[11px] font-black tabular-nums text-ink-500">
            {fa(lessonIndex + 1)} / {fa(totalLessons)}
          </span>
          <LessonSegBar
            lessons={orderedLessons}
            currentLessonId={lesson.id}
            progressMap={progressMapForRender}
            className="min-w-0 flex-1 basis-40"
          />
          {access.kind === 'enrolled' && (
            <span className="inline-flex items-baseline gap-1 text-[12px] font-black tabular-nums text-brand-700">
              {fa(Math.round(progressPercent))}
              <span className="text-[9px] font-extrabold text-ink-400">٪ مسیر</span>
            </span>
          )}
        </div>

        {/* ═══ صحنه ═══ */}
        {access.kind === 'boot' && (
          <div className="grid aspect-video place-items-center rounded-[22px] bg-ink-900/95">
            <Loader2 className="h-8 w-8 animate-spin text-mint-300" aria-hidden="true" />
          </div>
        )}
        {(access.kind === 'guest' || (access.kind === 'restricted' && !lesson.isPreview)) && (
          <LessonUnlockPanel
            lessonTitle={lesson.title}
            typeLabel={typeLabel}
            isPreview={lesson.isPreview}
            state={access.kind === 'guest' ? 'guest' : 'restricted'}
            busy={enrollBusy}
            error={enrollError}
            courseTitle={course.title}
            totalLessons={totalLessons}
            onLogin={() => setAuthOpen(true)}
            onEnroll={askEnroll}
          />
        )}
        {sequenceLocked && currentSeq?.blocking && (
          <LessonSeqLockedPanel
            blocking={{ slug: currentSeq.blocking.slug, title: currentSeq.blocking.title }}
            courseSlug={course.slug}
            lessonTitle={lesson.title}
            doneCount={
              progressMapForRender
                ? [...progressMapForRender.values()].filter((p) => p.isCompleted).length
                : 0
            }
            totalLessons={totalLessons}
          />
        )}
        {!sequenceLocked &&
          stageAllowed &&
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

        {/* نوارِ افقیِ جلسات — موبایل، بلافاصله زیرِ صحنه */}
        <div className="mt-4">
          <LessonStrip
            lessons={orderedLessons}
            currentLessonId={lesson.id}
            progressMap={progressMapForRender}
            enrolled={access.kind === 'enrolled'}
            courseSlug={course.slug}
          />
        </div>

        {access.kind === 'restricted' && lesson.isPreview && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-mint-100 bg-mint-50 px-4 py-3">
            <p className="text-[12px] font-bold leading-6 text-mint-800">
              این جلسه‌ی رایگان است — با ثبت‌نام، پیشرفتت ذخیره و {fa(totalLessons - 1)} جلسه‌ی دیگر
              هم باز می‌شود.
            </p>
            <button
              type="button"
              onClick={askEnroll}
              disabled={enrollBusy}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-mint-600 px-4 text-[12px] font-extrabold text-white transition hover:bg-mint-500 disabled:opacity-60"
            >
              {enrollBusy && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
              ثبت‌نام رایگان
            </button>
          </div>
        )}

        {/* ═══ تب‌ها (سگمنت‌شده) ═══ */}
        <div className="mt-6">
          <div
            className="inline-flex max-w-full flex-wrap items-center gap-1 rounded-2xl border border-ink-100 bg-white p-1 shadow-sm"
            role="tablist"
          >
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12px] font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-300 ${
                  tab === t.id
                    ? 'bg-brand-600 text-white shadow-[0_8px_16px_-8px_rgba(11,53,48,.5)]'
                    : 'text-ink-500 hover:bg-ink-50 hover:text-ink-800'
                }`}
              >
                <t.icon className="h-4 w-4" aria-hidden="true" />
                {t.label}
              </button>
            ))}
          </div>
          <div className="pt-4">
            {tab === 'about' && (
              <div className="space-y-3 rounded-2xl border border-ink-100 bg-white p-4 shadow-sm sm:p-5">
                {lesson.summary && (
                  <p className="rounded-xl bg-ink-50/70 p-3.5 text-[13px] font-extrabold leading-7 text-ink-700">
                    {lesson.summary}
                  </p>
                )}
                {lesson.description ? (
                  lesson.description.split(/\n{2,}/).map((para, i) => (
                    <p key={i} className="text-[13px] leading-7 text-ink-600">
                      {para.trim()}
                    </p>
                  ))
                ) : (
                  <p className="text-[12.5px] font-bold text-ink-400">
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
                isGuest={access.kind === 'guest'}
                onLogin={() => setAuthOpen(true)}
                onEnroll={askEnroll}
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

        {/* ═══ جلسه‌ی پایانی — آزمون در صفحه‌ی مستقلِ خودش (نه مهمانِ جلسه) ═══ */}
        {nextLesson === null && (
          <section className="mt-7" aria-label="جلسه‌ی پایانی">
            <Link
              href={`/lms/courses/${encodeURIComponent(course.slug)}/exam`}
              className="group relative block overflow-hidden rounded-[22px] bg-ink-900 p-5 ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:shadow-[0_24px_50px_-26px_rgba(0,0,0,.7)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 sm:p-6"
            >
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
                className="pointer-events-none absolute -left-14 -top-16 h-44 w-44 rounded-full bg-gold-500/20 blur-3xl"
              />
              <div className="relative flex flex-wrap items-center gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 text-white shadow-[0_12px_26px_-10px_rgba(240,148,26,.8)]">
                  <GraduationCap className="h-6 w-6" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-400/15 px-2.5 py-0.5 text-[10px] font-extrabold text-gold-200 ring-1 ring-gold-300/30">
                    <Sparkles className="h-3 w-3" aria-hidden="true" />
                    جلسه‌ی پایانی
                  </span>
                  <span className="mt-1.5 block text-[15px] font-black leading-7 text-white sm:text-[17px]">
                    {isCompleted
                      ? 'کلاس را تمام کردی — وقتِ سنجش و گواهی است'
                      : 'تماشای این جلسه، دروازه‌ی آزمون را باز می‌کند'}
                  </span>
                  <span className="mt-0.5 block text-[11.5px] font-bold leading-6 text-white/55">
                    آزمونِ پایان‌دوره در صفحه‌ی مستقلِ خودش، مثل یک جلسه‌ی جدا؛ با قبولی، گواهی
                    خودکار صادر می‌شود.
                  </span>
                </span>
                <span className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-gold-400 px-5 text-[12.5px] font-black text-ink-950 shadow-[0_12px_26px_-10px_rgba(240,148,26,.8)] transition group-hover:bg-gold-300">
                  شرکت در آزمون دوره
                  <ArrowLeft
                    className="h-4 w-4 transition group-hover:-translate-x-1"
                    aria-hidden="true"
                  />
                </span>
              </div>
            </Link>
          </section>
        )}

        {/* ═══ ناوبریِ انتهایی (کم‌حجم) ═══ */}
        <nav aria-label="ناوبری جلسات" className="mt-6">
          {nextLesson ? (
            <Link
              href={lessonHref(nextLesson)}
              className="group flex h-12 items-center justify-between gap-3 rounded-2xl border border-mint-100 bg-gradient-to-l from-mint-50 to-white px-4 transition hover:border-mint-300 hover:shadow-[0_12px_26px_-18px_rgba(16,185,129,.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-300"
            >
              <span className="inline-flex items-center gap-2 text-[12.5px] font-black text-mint-800">
                جلسه‌ی بعدی
                {isCompleted && (
                  <span className="rounded-full bg-mint-100 px-2 py-0.5 text-[9.5px] font-extrabold text-mint-700">
                    بزن بریم!
                  </span>
                )}
              </span>
              <span className="flex min-w-0 items-center gap-2">
                <span className="truncate text-[12px] font-bold text-ink-600">
                  {nextLesson.title}
                </span>
                <ArrowLeft
                  className="h-4 w-4 shrink-0 text-mint-600 transition group-hover:-translate-x-1"
                  aria-hidden="true"
                />
              </span>
            </Link>
          ) : (
            <div className="flex h-12 items-center justify-between gap-3 rounded-2xl bg-gradient-to-l from-brand-600 to-brand-700 px-4 text-white shadow-[0_14px_30px_-18px_rgba(11,53,48,.6)]">
              <span className="inline-flex items-center gap-2 text-[12.5px] font-black">
                به آخرین جلسه‌ی کلاس رسیدی 🎓
              </span>
              <Link
                href={`/lms/courses/${encodeURIComponent(course.slug)}`}
                className="inline-flex h-8 items-center rounded-full bg-white/15 px-3.5 text-[11px] font-extrabold ring-1 ring-white/25 backdrop-blur transition hover:bg-white/25"
              >
                صفحه‌ی کلاس
              </Link>
            </div>
          )}
        </nav>
      </div>

      {/* ═══ جشنِ ثبت‌نام ═══ */}
      {celebrating && (
        <div
          className="fixed inset-0 z-[70] grid place-items-center bg-ink-950/50 p-6 backdrop-blur-sm"
          role="status"
          aria-live="polite"
        >
          <div className="w-full max-w-xs rounded-3xl bg-white p-7 text-center shadow-2xl">
            <span className="relative mx-auto grid h-16 w-16 place-items-center rounded-full bg-mint-500 text-ink-950 shadow-[0_16px_36px_-12px_rgba(20,184,166,.8)]">
              <span
                className="absolute inset-0 animate-ping rounded-full bg-mint-400/60"
                aria-hidden="true"
              />
              <BadgeCheck className="relative h-8 w-8" aria-hidden="true" />
            </span>
            <p className="mt-4 text-[17px] font-black text-ink-900">ثبت‌نام کامل شد!</p>
            <p className="mt-1 text-[12px] font-bold leading-6 text-ink-500">
              خوش آمدی به «{course.title}» — حالا مسیرت شروع می‌شود 🌱
            </p>
          </div>
        </div>
      )}

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} initialView="login" />
      <EnrollConfirmModal
        open={confirmOpen}
        course={course}
        busy={enrollBusy}
        error={enrollError}
        onConfirm={() => void enroll()}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  );
}
