'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';
import type { LmsVideoSource } from '@/lib/lms-shared';
import { LmsVideoSheet } from './LmsVideoSheet';

/** پخشِ پیش‌نمایشِ رایگانِ یک جلسه — بدون نیاز به ورود (فیلدهای عمومی). */
export function LessonPreviewButton({
  source,
  lessonTitle,
  description,
}: {
  source: LmsVideoSource;
  lessonTitle: string;
  description?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-mint-500 px-3.5 text-[11.5px] font-extrabold text-ink-950 shadow-[0_8px_20px_-8px_rgba(37,197,186,.8)] transition-all hover:bg-mint-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-600 focus-visible:ring-offset-2 active:scale-[.97]"
        aria-label={`پخش پیش‌نمایش جلسه‌ی ${lessonTitle}`}
      >
        <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
        تماشای پیش‌نمایش
      </button>
      <LmsVideoSheet
        open={open}
        onClose={() => setOpen(false)}
        title={`پیش‌نمایش — ${lessonTitle}`}
        description={description}
        source={source}
      />
    </>
  );
}
