'use client';

import Link from 'next/link';
import { BadgeCheck, Lock, MonitorPlay } from 'lucide-react';

import { computeLessonSequence, type LessonProgressEntry } from '@/lib/lms-lesson';
import type { LmsLesson } from '@/lib/lms-shared';

const fa = (n: number) => n.toLocaleString('fa-IR');

type Props = {
  lessons: LmsLesson[];
  currentLessonId: number;
  progressMap: Map<number, LessonProgressEntry> | null;
  enrolled: boolean;
  courseSlug: string;
};

/**
 * نوارِ افقیِ جلسات (موبایل) — «همه‌ی مسیر، یک‌سوایپ آن‌طرف‌تر».
 * جایگزینِ مهمِ کشف‌پذیریِ سیلابوس در موبایل: بدون بازکردنِ کشو هم همیشه
 * می‌فهمی کجایی و کجا باید بروی. snap محور مرکز + ردیفِ جاری در تمرکز.
 */
export function LessonStrip({
  lessons,
  currentLessonId,
  progressMap,
  enrolled,
  courseSlug,
}: Props) {
  return (
    <nav aria-label="جلسات کلاس" className="lg:hidden">
      <div className="mb-1.5 flex items-center justify-between px-0.5">
        <p className="inline-flex items-center gap-1 text-[11px] font-black text-ink-500">
          <MonitorPlay className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />
          جلسات کلاس
        </p>
        <span className="text-[10px] font-bold text-ink-400">ورق بزن به‌طرف چپ ←</span>
      </div>
      <ol className="-mx-[14px] flex snap-x snap-mandatory gap-2 overflow-x-auto px-[14px] pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {(() => {
          const seqMap = enrolled ? computeLessonSequence(lessons, progressMap) : null;
          return lessons.map((l, i) => {
            const entry = progressMap?.get(l.id);
            const isCurrent = l.id === currentLessonId;
            const seqBlocking =
              seqMap?.get(l.id)?.unlocked === false && !l.isPreview
                ? (seqMap.get(l.id)?.blocking ?? null)
                : null;
            const locked = (!enrolled && !l.isPreview) || seqBlocking !== null;
            const done = entry?.isCompleted ?? false;
            const href = `/lms/courses/${encodeURIComponent(courseSlug)}/lessons/${encodeURIComponent(l.slug)}`;
            const inner = (
              <>
                <span
                  className={`relative grid h-9 w-9 shrink-0 place-items-center rounded-full text-[12px] font-black tabular-nums ${
                    done
                      ? 'bg-mint-500 text-ink-950'
                      : locked
                        ? 'bg-ink-100 text-ink-300'
                        : isCurrent
                          ? 'bg-brand-600 text-white'
                          : 'bg-brand-50 text-brand-700'
                  }`}
                >
                  {done ? (
                    <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                  ) : locked ? (
                    <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    fa(i + 1)
                  )}
                </span>
                <span className="min-w-0">
                  <span
                    className={`block max-w-[110px] truncate text-[11px] font-extrabold ${locked ? 'text-ink-400' : isCurrent ? 'text-brand-800' : 'text-ink-700'}`}
                  >
                    {l.title}
                  </span>
                  <span className="block text-[9px] font-bold text-ink-400">
                    {done
                      ? 'تکمیل‌شده'
                      : locked
                        ? 'قفل'
                        : isCurrent
                          ? 'در حال تماشا'
                          : `جلسه‌ی ${fa(i + 1)}`}
                  </span>
                </span>
              </>
            );
            const cls = `flex shrink-0 snap-center items-center gap-2 rounded-2xl border px-2.5 py-2 transition ${
              isCurrent
                ? 'border-brand-200 bg-gradient-to-l from-brand-50 to-mint-50 shadow-[0_10px_24px_-16px_rgba(11,53,48,.4)]'
                : 'border-ink-100 bg-white'
            }`;
            return (
              <li key={l.id} className="shrink-0">
                {isCurrent ? (
                  <div
                    className={cls}
                    aria-current="true"
                    aria-disabled={locked || undefined}
                    title={
                      seqBlocking !== null
                        ? `قفل — اول جلسه‌ی «${seqBlocking.title}» را کامل کن`
                        : undefined
                    }
                    aria-label={seqBlocking !== null ? `${l.title} — قفل` : undefined}
                  >
                    {inner}
                  </div>
                ) : seqBlocking !== null ? (
                  <div
                    className={`${cls} cursor-not-allowed select-none`}
                    title={`قفل — اول جلسه‌ی «${seqBlocking.title}» را کامل کن`}
                    aria-disabled="true"
                    aria-label={`${l.title} — قفل`}
                  >
                    {inner}
                  </div>
                ) : (
                  <Link href={href} aria-label={l.title} className={`${cls} active:scale-95`}>
                    {inner}
                  </Link>
                )}
              </li>
            );
          });
        })()}
      </ol>
    </nav>
  );
}
