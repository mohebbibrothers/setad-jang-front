'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { BadgeCheck, GraduationCap, History, Layers, Loader2, Lock, Trophy, X } from 'lucide-react';

import { lockBodyScroll } from '@/lib/scroll-lock';
import type { LessonProgressEntry, LessonSequenceState } from '@/lib/lms-lesson';
import {
  formatLmsDuration,
  LESSON_TYPE_LABEL,
  type LmsCourseDetail,
  type LmsLesson,
} from '@/lib/lms-shared';
import { TYPE_ICON, TYPE_TONE } from '@/lib/lms-shared';
import { LessonProgressRing } from './LessonProgressRing';
import { LessonSegBar } from './LessonSegBar';

const fa = (n: number) => n.toLocaleString('fa-IR');

type AccessKind = 'guest' | 'restricted' | 'enrolled';

type Props = {
  course: LmsCourseDetail;
  orderedLessons: LmsLesson[];
  currentLessonId: number;
  progressMap: Map<number, LessonProgressEntry> | null;
  progressPercent: number;
  lastAccessedLessonId?: number | null;
  access: AccessKind;
  /** زنجیره‌ی تماشا — فقط برای اعضا؛ جلسه‌ی غیرمجاز قفل و غیرقابل‌کلیک می‌شود. */
  seqMap?: Map<number, LessonSequenceState> | null;
  /** جلسه‌ای که همین لحظه با تکمیلِ قبلی باز شد (برقِ مینتی روی ردیفش). */
  flashNextId?: number | null;
  enrollBusy: boolean;
  onEnroll: () => void;
  onLogin: () => void;
};

/**
 * ریلِ کلاس — «خانه‌ی سیلابوس»: کارتِ کلاس + حلقه‌ی پیشرفت + فهرستِ زنده‌ی جلسات.
 * در گریدِ کنسول، ستونِ اول است (در RTL سمتِ راستِ صفحه — نخستین جایی که چشم می‌رود).
 * دسکتاپ: چسبان و اسکرول‌پذیر؛ موبایل: FAB + کشو (scroll-lock + Esc + بستن با بیرون‌کلیک).
 */
export function LessonRail({
  course,
  orderedLessons,
  currentLessonId,
  progressMap,
  progressPercent,
  lastAccessedLessonId,
  access,
  seqMap = null,
  flashNextId = null,
  enrollBusy,
  onEnroll,
  onLogin,
}: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const currentRowRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!drawerOpen) return;
    return lockBodyScroll();
  }, [drawerOpen]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    if (drawerOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen]);
  useEffect(() => {
    currentRowRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [currentLessonId, drawerOpen]);

  const completedCount = progressMap
    ? [...progressMap.values()].filter((p) => p.isCompleted).length
    : 0;
  const lastAccessed =
    lastAccessedLessonId && lastAccessedLessonId !== currentLessonId
      ? orderedLessons.find((l) => l.id === lastAccessedLessonId)
      : null;

  const rail = (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[20px] border border-ink-100 bg-white shadow-[0_18px_45px_-30px_rgba(11,53,48,.35)]">
      {/* ── کارتِ کلاس ── */}
      <div className="border-b border-ink-100 bg-gradient-to-b from-ink-50/70 to-white px-4 pb-3.5 pt-4">
        <p className="flex items-center gap-1.5 text-[10px] font-extrabold tracking-wide text-brand-600">
          <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
          قرارگاه آموزشی
        </p>
        <Link
          href={`/lms/courses/${encodeURIComponent(course.slug)}`}
          className="mt-1.5 line-clamp-2 block text-[13.5px] font-black leading-6 text-ink-800 transition hover:text-brand-700"
          onClick={() => setDrawerOpen(false)}
        >
          {course.title}
        </Link>
        <p className="mt-1 text-[10.5px] font-bold text-ink-400">استاد {course.instructor}</p>

        {access === 'enrolled' ? (
          <div className="mt-3.5 flex items-center gap-3">
            <LessonProgressRing percent={progressPercent} size={76} stroke={7} label="مسیر" />
            <div className="min-w-0 flex-1">
              <p className="text-[11.5px] font-black text-ink-800">پیشرفت تو در کلاس</p>
              <p className="mt-1 text-[10.5px] font-bold leading-5 text-ink-500">
                {fa(completedCount)} از {fa(orderedLessons.length)} جلسه تکمیل شده
              </p>
              <LessonSegBar
                lessons={orderedLessons}
                currentLessonId={currentLessonId}
                progressMap={progressMap}
                className="mt-2"
              />
            </div>
          </div>
        ) : (
          <div className="mt-3.5 rounded-2xl bg-gradient-to-l from-mint-500 to-mint-400 p-[1px]">
            <div className="rounded-[15px] bg-white px-3.5 py-3">
              <p className="text-[11.5px] font-black text-ink-800">
                {access === 'guest' ? 'برای شروع مسیر وارد شو' : 'ثبت‌نام رایگان؛ مسیر باز می‌شود'}
              </p>
              <p className="mt-0.5 text-[10px] font-bold leading-5 text-ink-400">
                پیشرفت، گواهی و پرسش‌وپاسخ برای اعضا فعال است.
              </p>
              <button
                type="button"
                onClick={access === 'guest' ? onLogin : onEnroll}
                disabled={enrollBusy}
                className="mt-2.5 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full bg-mint-500 text-[11.5px] font-black text-ink-950 shadow-[0_10px_22px_-10px_rgba(20,184,166,.6)] transition hover:bg-mint-400 disabled:opacity-60"
              >
                {enrollBusy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {access === 'guest'
                  ? 'ورود | ثبت‌نام'
                  : enrollBusy
                    ? 'در حال ثبت‌نام…'
                    : 'شروع مسیر — رایگان'}
              </button>
            </div>
          </div>
        )}

        {lastAccessed && (
          <Link
            href={`/lms/courses/${encodeURIComponent(course.slug)}/lessons/${encodeURIComponent(lastAccessed.slug)}`}
            onClick={() => setDrawerOpen(false)}
            className="mt-3 inline-flex max-w-full items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-[10.5px] font-extrabold text-brand-700 ring-1 ring-brand-100 transition hover:bg-brand-100"
          >
            <History className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span className="truncate">
              ادامه از «
              {lastAccessed.title.length > 24
                ? lastAccessed.title.slice(0, 24) + '…'
                : lastAccessed.title}
              »
            </span>
          </Link>
        )}
      </div>

      {/* ── سرستونِ فهرست ── */}
      <div className="flex items-center justify-between border-b border-ink-100 px-4 py-2.5">
        <p className="flex items-center gap-1.5 text-[12px] font-black text-ink-700">
          <Layers className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />
          سرفصل‌های کلاس
        </p>
        <span className="rounded-full bg-ink-50 px-2 py-0.5 text-[9.5px] font-extrabold tabular-nums text-ink-500">
          {fa(orderedLessons.length)} جلسه
        </span>
      </div>

      {/* ── فهرست ── */}
      <ol className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-2.5">
        {orderedLessons.map((l, i) => {
          const entry = progressMap?.get(l.id);
          const isCurrent = l.id === currentLessonId;
          const seq = seqMap?.get(l.id);
          const seqBlocking = seq?.unlocked === false && !l.isPreview ? seq.blocking : null;
          const locked = (access !== 'enrolled' && !l.isPreview) || seqBlocking !== null;
          const lockTitle =
            seqBlocking !== null
              ? `قفل — اول جلسه‌ی «${seqBlocking.title}» را کامل کن`
              : access !== 'enrolled'
                ? 'ویژه‌ی اعضای کلاس'
                : '';
          const Icon = TYPE_ICON[l.contentType];
          const tone = TYPE_TONE[l.contentType];
          const body = (
            <>
              <span
                className={`relative grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[11.5px] font-black tabular-nums transition ${
                  entry?.isCompleted
                    ? 'bg-mint-500 text-ink-950 shadow-[0_6px_14px_-6px_rgba(20,184,166,.7)]'
                    : locked
                      ? 'bg-ink-50 text-ink-300'
                      : isCurrent
                        ? 'bg-brand-600 text-white shadow-[0_8px_18px_-8px_rgba(11,53,48,.6)]'
                        : 'bg-ink-50 text-ink-500'
                }`}
              >
                {entry?.isCompleted ? (
                  <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                ) : locked ? (
                  <Lock className="h-3 w-3" aria-hidden="true" />
                ) : isCurrent ? (
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                  </span>
                ) : (
                  fa(i + 1)
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={`block truncate text-[12.5px] font-extrabold leading-5 ${
                    locked ? 'text-ink-400' : isCurrent ? 'text-brand-800' : 'text-ink-700'
                  }`}
                >
                  {l.title}
                </span>
                <span className="mt-0.5 flex items-center gap-1.5 text-[9.5px] font-bold text-ink-400">
                  {Icon && <Icon className={`h-3 w-3 ${tone}`} aria-hidden="true" />}
                  {LESSON_TYPE_LABEL[l.contentType]}
                  {l.durationSeconds > 0 && ` • ${formatLmsDuration(l.durationSeconds)}`}
                  {l.isPreview && (
                    <span className="rounded bg-mint-50 px-1 py-px text-[8.5px] font-extrabold text-mint-700">
                      رایگان
                    </span>
                  )}
                  {entry && !entry.isCompleted && entry.progressPercent > 0 && (
                    <span className="tabular-nums text-brand-600">
                      ٪{fa(Math.round(entry.progressPercent))}
                    </span>
                  )}
                </span>
              </span>
              {isCurrent && (
                <span
                  className="h-7 w-1 shrink-0 rounded-full bg-gradient-to-b from-brand-500 to-mint-400"
                  aria-hidden="true"
                />
              )}
            </>
          );
          const cls = `flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 transition ${
            isCurrent
              ? 'bg-gradient-to-l from-brand-50 to-mint-50/70 shadow-[inset_0_0_0_1px_var(--color-brand-100,rgba(11,53,48,.08))]'
              : locked
                ? 'opacity-60'
                : 'hover:bg-ink-50 hover:-translate-x-0.5'
          }`;
          const flash = flashNextId === l.id && !entry?.isCompleted;
          return (
            <li key={l.id}>
              {isCurrent ? (
                <div
                  className={cls}
                  aria-current="true"
                  aria-disabled={locked || undefined}
                  title={lockTitle || undefined}
                  aria-label={locked ? `${l.title} — ${lockTitle}` : undefined}
                  ref={(el) => {
                    currentRowRef.current = el;
                  }}
                >
                  {body}
                </div>
              ) : seqBlocking !== null ? (
                <div
                  className={`${cls} cursor-not-allowed select-none ${flash ? 'qa-flash' : ''}`}
                  title={lockTitle}
                  aria-disabled="true"
                  aria-label={`${l.title} — ${lockTitle}`}
                >
                  {body}
                </div>
              ) : (
                <Link
                  href={`/lms/courses/${encodeURIComponent(course.slug)}/lessons/${encodeURIComponent(l.slug)}`}
                  onClick={() => setDrawerOpen(false)}
                  title={lockTitle || undefined}
                  className={`${cls} ${flash ? 'qa-flash' : ''} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300`}
                >
                  {body}
                </Link>
              )}
            </li>
          );
        })}
        {/* ── جلسه‌ی پایانی — مقصدی مستقل، مثلِ یک جلسه‌ی جدا ── */}
        <li className="pt-1.5">
          <div className="mb-1.5 flex items-center gap-2 px-2" aria-hidden="true">
            <span className="h-px flex-1 bg-ink-100" />
            <span className="text-[9px] font-black text-ink-300">پایانِ مسیر</span>
            <span className="h-px flex-1 bg-ink-100" />
          </div>
          {(() => {
            const gateOpen =
              access === 'enrolled' &&
              orderedLessons.length > 0 &&
              orderedLessons.every((l) => progressMap?.get(l.id)?.isCompleted);
            return (
              <Link
                href={`/lms/courses/${encodeURIComponent(course.slug)}/exam`}
                onClick={() => setDrawerOpen(false)}
                aria-label={
                  gateOpen
                    ? 'رفتن به جلسه‌ی پایانی: آزمون پایان دوره'
                    : 'جلسه‌ی پایانی (آزمون) — پس از تکمیل همه‌ی جلسات باز می‌شود'
                }
                className={`group flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${
                  gateOpen
                    ? 'bg-gradient-to-l from-gold-50 to-white shadow-[inset_0_0_0_1px_rgba(240,148,26,.3)] hover:-translate-x-0.5'
                    : 'opacity-75 hover:bg-ink-50'
                }`}
              >
                <span
                  className={`relative grid h-9 w-9 shrink-0 place-items-center rounded-xl transition ${
                    gateOpen
                      ? 'bg-gradient-to-br from-gold-400 to-gold-600 text-white shadow-[0_8px_18px_-6px_rgba(240,148,26,.7)]'
                      : 'bg-ink-50 text-ink-300'
                  }`}
                >
                  {gateOpen ? (
                    <Trophy className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Lock className="h-3 w-3" aria-hidden="true" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={`block truncate text-[12.5px] font-extrabold leading-5 ${
                      gateOpen ? 'text-gold-800' : 'text-ink-400'
                    }`}
                  >
                    جلسه‌ی پایانی
                  </span>
                  <span className="mt-0.5 block text-[9.5px] font-bold text-ink-400">
                    {gateOpen
                      ? 'دروازه‌ی آزمون باز است — برو گواهی را بگیر'
                      : access === 'guest'
                        ? 'آزمون و گواهی — پس از ورود و تکمیل مسیر'
                        : 'آزمون و گواهی — پس از تکمیل همه‌ی جلسات'}
                  </span>
                </span>
                {gateOpen && (
                  <span
                    className="h-7 w-1 shrink-0 rounded-full bg-gradient-to-b from-gold-400 to-gold-500"
                    aria-hidden="true"
                  />
                )}
              </Link>
            );
          })()}
        </li>
      </ol>
    </div>
  );

  return (
    <>
      {/* دسکتاپ */}
      <aside
        className="sticky top-24 hidden max-h-[calc(100vh-7rem)] lg:block"
        aria-label="ریل کلاس"
      >
        {rail}
      </aside>

      {/* FAB موبایل */}
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        aria-label="نمایش سرفصل‌های کلاس"
        className="fixed bottom-5 left-5 z-40 inline-flex h-12 items-center gap-2 rounded-full bg-ink-900 px-5 text-[12.5px] font-extrabold text-white shadow-[0_16px_36px_-12px_rgba(0,0,0,.55)] transition hover:bg-ink-800 active:scale-95 lg:hidden"
      >
        <Layers className="h-4 w-4 text-mint-300" aria-hidden="true" />
        سرفصل‌ها
        {access === 'enrolled' && progressMap && (
          <span className="rounded-full bg-mint-500 px-2 py-0.5 text-[10px] font-black tabular-nums text-ink-950">
            {fa(completedCount)}/{fa(orderedLessons.length)}
          </span>
        )}
      </button>

      {/* کشو موبایل */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="سرفصل‌های کلاس"
        >
          <button
            type="button"
            aria-label="بستن"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm"
          />
          <div className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-transparent p-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="بستن کشو"
              className="absolute -right-1 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-white text-ink-700 shadow-lg"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
            {rail}
          </div>
        </div>
      )}
    </>
  );
}
