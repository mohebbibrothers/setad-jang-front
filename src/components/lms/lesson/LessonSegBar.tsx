'use client';

import type { LessonProgressEntry } from '@/lib/lms-lesson';
import type { LmsLesson } from '@/lib/lms-shared';

type Props = {
  lessons: LmsLesson[];
  currentLessonId: number;
  progressMap: Map<number, LessonProgressEntry> | null;
  className?: string;
};

/**
 * نوارِ سگمنتیِ پیشرفت — هر سگمنت یک جلسه؛ سه وضعیت مجزا:
 *   • تکمیل‌شده  → مینتِ پر
 *   • جاری       → برند + نبض (pulse)
 *   • نیمه‌کاره  → پرِ بخشی با همان درصدِ واقعیِ سرور
 *   • بکر        → خاکستری
 * تولتیپِ هر سگمنت عنوانِ جلسه + درصد است؛ کلیک‌پذیر نیست (نقشِ «قرائت» دارد).
 */
export function LessonSegBar({ lessons, currentLessonId, progressMap, className }: Props) {
  return (
    <div
      className={`flex items-center gap-1 ${className ?? ''}`}
      role="img"
      aria-label="پیشرفت جلسه‌به‌جلسه‌ی کلاس"
    >
      {lessons.map((l) => {
        const entry = progressMap?.get(l.id);
        const isCurrent = l.id === currentLessonId;
        const pct = entry ? Math.max(0, Math.min(100, entry.progressPercent)) : 0;
        const done = entry?.isCompleted ?? false;
        const title = `${l.title}${done ? ' — تکمیل‌شده' : pct > 0 ? ` — ٪${Math.round(pct).toLocaleString('fa-IR')}` : ''}`;
        return (
          <span
            key={l.id}
            title={title}
            className={`relative h-1.5 min-w-3 flex-1 overflow-hidden rounded-full transition-colors ${
              done ? 'bg-mint-500' : isCurrent ? 'bg-brand-500/30' : 'bg-ink-100'
            }`}
          >
            {!done && pct > 0 && (
              <span
                className="absolute inset-y-0 right-0 rounded-full bg-gradient-to-l from-brand-500 to-mint-400 transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            )}
            {!done && isCurrent && (
              <span className="absolute inset-0 animate-pulse rounded-full bg-brand-500/50" />
            )}
          </span>
        );
      })}
    </div>
  );
}
