'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';
import type { LmsVideoSource } from '@/lib/lms-shared';
import { LmsVideoSheet } from './LmsVideoSheet';

/** دکمه‌ی پخش روی کاور، وقتی intro_video_url به منبعِ امن تبدیل شده باشد. */
export function CourseHeroMedia({
  source,
  courseTitle,
  description,
}: {
  source: LmsVideoSource | null;
  courseTitle: string;
  description?: string;
}) {
  const [open, setOpen] = useState(false);
  if (!source) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`تماشای ویدئوی معرفی ${courseTitle}`}
        className="group/play absolute inset-0 z-10 grid place-items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mint-300"
      >
        <span className="grid h-16 w-16 scale-95 place-items-center rounded-full bg-white/95 text-brand-700 shadow-[0_18px_44px_-12px_rgba(0,0,0,.65)] ring-4 ring-white/25 backdrop-blur-sm transition-all duration-300 group-hover/play:scale-105 group-hover/play:text-brand-800">
          <Play className="h-6 w-6 -translate-x-[2px] fill-current" aria-hidden="true" />
        </span>
        <span className="absolute bottom-3.5 rounded-full bg-black/55 px-3 py-1.5 text-[11px] font-extrabold text-white ring-1 ring-white/20 backdrop-blur-sm">
          تماشای ویدئوی معرفی
        </span>
      </button>
      <LmsVideoSheet
        open={open}
        onClose={() => setOpen(false)}
        title={`ویدئوی معرفی — ${courseTitle}`}
        description={description}
        source={source}
      />
    </>
  );
}
