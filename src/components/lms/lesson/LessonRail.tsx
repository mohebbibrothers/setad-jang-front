'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BadgeCheck, Layers, Lock, X } from 'lucide-react';

import { lockBodyScroll } from '@/lib/scroll-lock';
import type { LessonProgressEntry } from '@/lib/lms-lesson';
import {
  formatLmsDuration,
  LESSON_TYPE_LABEL,
  type LmsCourseDetail,
  type LmsLesson,
} from '@/lib/lms-shared';
import { TYPE_ICON, TYPE_TONE } from '@/components/lms/course/CourseSyllabus';

const fa = (n: number) => n.toLocaleString('fa-IR');

type Props = {
  course: LmsCourseDetail;
  orderedLessons: LmsLesson[];
  currentLessonId: number;
  progressMap: Map<number, LessonProgressEntry> | null;
  lastAccessedLessonId?: number | null;
  enrolled: boolean;
};

/**
 * ریلِ سیلابوس — «رادیوی کلاس»:
 * دسکتاپ: ستونِ چسبانِ کنار صحنه. موبایل: FAB شناور + کشو از کنار (scroll-lock).
 * هر ردیف وضعیتِ خودش را دارد: تکمیل‌شده ✓ / جاری (نبض) / قفل / شماره.
 */
export function LessonRail({
  course,
  orderedLessons,
  currentLessonId,
  progressMap,
  lastAccessedLessonId,
  enrolled,
}: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  useEffect(() => {
    if (!drawerOpen) return;
    // lockBodyScroll خودش تابع unlock را برمی‌گرداند — مستقیم به‌عنوان cleanup
    return lockBodyScroll();
  }, [drawerOpen]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    if (drawerOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  const completedCount = progressMap
    ? [...progressMap.values()].filter((p) => p.isCompleted).length
    : 0;

  const rail = (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[20px] border border-ink-100 bg-white shadow-[0_16px_40px_-30px_rgba(11,53,48,.3)]">
      <div className="border-b border-ink-100 px-4 py-3.5">
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-[13px] font-black text-ink-800">
            <Layers className="h-4 w-4 text-brand-600" aria-hidden="true" />
            سرفصل‌های کلاس
          </p>
          <span className="rounded-full bg-ink-50 px-2 py-0.5 text-[10px] font-extrabold tabular-nums text-ink-500">
            {fa(orderedLessons.length)} جلسه
          </span>
        </div>
        {enrolled && progressMap && (
          <p className="mt-1.5 text-[10.5px] font-bold text-mint-700">
            {fa(completedCount)} از {fa(orderedLessons.length)} تکمیل شده
          </p>
        )}
        {enrolled &&
          lastAccessedLessonId &&
          lastAccessedLessonId !== currentLessonId &&
          (() => {
            const last = orderedLessons.find((l) => l.id === lastAccessedLessonId);
            return last ? (
              <Link
                href={`/lms/courses/${encodeURIComponent(course.slug)}/lessons/${encodeURIComponent(last.slug)}`}
                onClick={() => setDrawerOpen(false)}
                className="mt-2 inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-extrabold text-brand-700 transition hover:bg-brand-100"
              >
                ادامه از «{last.title.length > 26 ? last.title.slice(0, 26) + '…' : last.title}»
              </Link>
            ) : null;
          })()}
      </div>

      <ol className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2.5">
        {orderedLessons.map((l, i) => {
          const entry = progressMap?.get(l.id);
          const isCurrent = l.id === currentLessonId;
          const locked = !enrolled && !l.isPreview;
          const Icon = TYPE_ICON[l.contentType];
          const tone = TYPE_TONE[l.contentType];
          const body = (
            <>
              <span
                className={`relative grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-black tabular-nums transition ${
                  entry?.isCompleted
                    ? 'bg-mint-500 text-ink-950'
                    : isCurrent
                      ? 'bg-brand-600 text-white ring-4 ring-brand-100'
                      : locked
                        ? 'bg-ink-100 text-ink-300'
                        : 'bg-ink-50 text-ink-500'
                }`}
              >
                {entry?.isCompleted ? (
                  <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                ) : isCurrent ? (
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                  </span>
                ) : locked ? (
                  <Lock className="h-3 w-3" aria-hidden="true" />
                ) : (
                  fa(i + 1)
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={`block truncate text-[12.5px] font-extrabold ${
                    isCurrent ? 'text-brand-800' : locked ? 'text-ink-400' : 'text-ink-700'
                  }`}
                >
                  {l.title}
                </span>
                <span className="mt-0.5 flex items-center gap-1.5 text-[10px] font-bold text-ink-400">
                  {Icon && <Icon className={`h-3 w-3 ${tone}`} aria-hidden="true" />}
                  {LESSON_TYPE_LABEL[l.contentType]}
                  {l.durationSeconds > 0 && ` • ${formatLmsDuration(l.durationSeconds)}`}
                  {l.isPreview && (
                    <span className="rounded bg-mint-50 px-1 py-px text-[9px] font-extrabold text-mint-700">
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
            </>
          );
          const cls = `flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 transition ${
            isCurrent
              ? 'bg-gradient-to-l from-brand-50 to-mint-50/70 ring-1 ring-brand-100'
              : locked
                ? 'opacity-70'
                : 'hover:bg-ink-50'
          }`;
          return (
            <li key={l.id}>
              {isCurrent ? (
                <div className={cls} aria-current="true">
                  {body}
                </div>
              ) : (
                <Link
                  href={`/lms/courses/${encodeURIComponent(course.slug)}/lessons/${encodeURIComponent(l.slug)}`}
                  onClick={() => setDrawerOpen(false)}
                  className={`${cls} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300`}
                >
                  {body}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );

  return (
    <>
      {/* دسکتاپ */}
      <aside className="sticky top-24 hidden max-h-[calc(100vh-7rem)] lg:block">{rail}</aside>

      {/* FAB موبایل */}
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        aria-label="نمایش سرفصل‌های کلاس"
        className="fixed bottom-5 left-5 z-40 inline-flex h-12 items-center gap-2 rounded-full bg-ink-900 px-5 text-[12.5px] font-extrabold text-white shadow-[0_16px_36px_-12px_rgba(0,0,0,.55)] transition hover:bg-ink-800 active:scale-95 lg:hidden"
      >
        <Layers className="h-4 w-4 text-mint-300" aria-hidden="true" />
        سرفصل‌ها
        {enrolled && progressMap && (
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
