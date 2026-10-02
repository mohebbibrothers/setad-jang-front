'use client';

import Link from 'next/link';
import { Lock, PlayCircle, Sparkles } from 'lucide-react';

const fa = (n: number) => n.toLocaleString('fa-IR');

type Props = {
  blocking: { slug: string; title: string };
  courseSlug: string;
  lessonTitle: string;
  doneCount: number;
  totalLessons: number;
};

/**
 * پنلِ «زنجیره‌ی تماشا» — وقتی کاربرِ ثبت‌نام‌کرده سرِ جلسه‌ای می‌رسد که
 * پیش‌نیازش کامل نشده. به‌جای پخش‌کننده، نقشه‌ی بازگشت نشان می‌دهد: دقیقاً
 * کدام جلسه را باید اول کامل کند + شمارِ مسیر. کپیِ پیام با همان پیامی که
 * گاردِ سروری می‌دهد هم‌خانواده است تا تجربه یکدست بماند.
 */
export function LessonSeqLockedPanel({
  blocking,
  courseSlug,
  lessonTitle,
  doneCount,
  totalLessons,
}: Props) {
  const href = `/lms/courses/${encodeURIComponent(courseSlug)}/lessons/${encodeURIComponent(blocking.slug)}`;
  return (
    <div
      role="status"
      aria-label={`جلسه‌ی ${lessonTitle} قفل است`}
      className="relative overflow-hidden rounded-[22px] bg-ink-900 p-6 ring-1 ring-white/10 sm:p-10"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            'repeating-linear-gradient(-45deg, rgba(255,255,255,.035) 0 2px, transparent 2px 14px)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-brand-500/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-12 h-44 w-44 rounded-full bg-gold-500/15 blur-3xl"
      />

      <div className="relative mx-auto flex max-w-md flex-col items-center text-center">
        <span className="relative grid h-16 w-16 place-items-center">
          <span
            aria-hidden="true"
            className="absolute inset-0 animate-ping rounded-full bg-gold-400/15"
            style={{ animationDuration: '2.4s' }}
          />
          <span className="relative grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 text-white shadow-[0_14px_30px_-10px_rgba(240,148,26,.8)]">
            <Lock className="h-6 w-6" aria-hidden="true" />
          </span>
        </span>

        <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-[10px] font-extrabold text-gold-200 ring-1 ring-white/10">
          <Sparkles className="h-3 w-3" aria-hidden="true" />
          زنجیره‌ی تماشا — مسیر، مرحله‌به‌مرحله
        </span>

        <h2 className="mt-2.5 text-[16px] font-black leading-8 text-white sm:text-[18px]">
          این جلسه هنوز قفل است
        </h2>
        <p className="mt-1.5 text-[12.5px] font-bold leading-7 text-white/60">
          برای بازشدنِ این جلسه، اول جلسه‌ی قبلی را کامل تماشا کن؛ مسیر کلاس پله‌پله پیش می‌رود تا
          هیچ نکته‌ای از قلم نیفتد.
        </p>

        <p className="mt-3 rounded-full bg-white/5 px-3.5 py-1 text-[10.5px] font-extrabold tabular-nums text-white/45 ring-1 ring-white/10">
          {fa(doneCount)} از {fa(totalLessons)} جلسه تماشا شده
        </p>

        <Link
          href={href}
          className="group mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-mint-500 px-6 text-[13px] font-black text-ink-950 shadow-[0_14px_30px_-12px_rgba(20,184,166,.9)] transition hover:bg-mint-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-300"
        >
          <PlayCircle className="h-5 w-5" aria-hidden="true" />
          <span>رفتن به جلسه‌ی «{blocking.title}»</span>
          <span aria-hidden="true" className="text-[10px] transition group-hover:-translate-x-0.5">
            ←
          </span>
        </Link>
      </div>
    </div>
  );
}
