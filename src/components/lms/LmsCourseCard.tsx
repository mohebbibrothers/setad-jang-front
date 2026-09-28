import Link from 'next/link';
import { Clock3, Flag, GraduationCap, ListVideo, Sparkles, Users } from 'lucide-react';
import { SmartImage } from '@/components/ui/SmartImage';
import { LMS_LEVEL_LABEL, formatLmsDuration, type LmsCourse } from '@/lib/lms-shared';

/**
 * کارتِ هاب — خواهرِ بزرگِ کارتِ صفحه‌ی اصلی با چند افزوده‌ی هاب‌محور:
 *  • چیپِ «سطح» رنگ‌آگاه: مقدماتی=mint، متوسط=brand، پیشرفته=gold، حرفه‌ای=ink
 *  • چیپِ مدت روی کاور (حسِ ویدئو-کلاس)، line‌clamp برای سنخورتِ شبکه
 *  • CTAی «شروع یادگیری» — دعوتِ فعال، نه فقط «مشاهده»
 *  • کپسولِ فوکوسِ کاملِ همان الگوی اثبات‌شده‌ی صفحه‌ی اصلی (به‌همراه
 *    select-none) روی لینکِ تیتر
 */

const LEVEL_CHIP: Record<string, string> = {
  beginner: 'bg-mint-50 text-mint-800 ring-mint-200',
  intermediate: 'bg-brand-50 text-brand-800 ring-brand-200',
  advanced: 'bg-gold-50 text-gold-800 ring-gold-200',
  professional: 'bg-ink-100 text-ink-800 ring-ink-200',
};

export function LmsCourseCard({ c }: { c: LmsCourse }) {
  const levelLabel = c.level ? LMS_LEVEL_LABEL[c.level] : '';
  const durationLabel = formatLmsDuration(c.durationSeconds);

  return (
    <article className="group relative flex min-w-0 flex-col overflow-hidden rounded-[18px] border border-ink-100 bg-white shadow-[0_2px_10px_-4px_rgba(15,20,32,.06)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_44px_-22px_rgba(11,53,48,.22)]">
      {/* ── کاور ۱۶/۱۰ + لایه‌های شیشه‌ای ─────────────────────────── */}
      <div className="relative aspect-[16/10] overflow-hidden bg-ink-50">
        <SmartImage
          src={c.coverUrl}
          alt={c.title}
          variant="course"
          fill
          sizes="(min-width: 1280px) 400px, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent"
        />

        {c.categoryTitle && (
          <span className="absolute right-2.5 top-2.5 inline-flex h-5 items-center rounded-md bg-black/55 px-1.5 text-[10px] font-bold text-white ring-1 ring-white/20 backdrop-blur-sm">
            {c.categoryTitle}
          </span>
        )}

        <span className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
          {c.isFeatured && (
            <span className="inline-flex h-5 items-center gap-1 rounded-full bg-gradient-to-l from-gold-400 to-gold-500 px-2.5 text-[10px] font-extrabold text-white shadow-[0_6px_16px_-6px_rgba(240,148,26,.7)]">
              <Sparkles className="h-2.5 w-2.5" aria-hidden="true" />
              ویژه
            </span>
          )}
          {c.isNew && (
            <span className="inline-flex h-5 items-center rounded-full bg-mint-500 px-2.5 text-[10px] font-extrabold text-white shadow-[0_6px_16px_-6px_rgba(37,197,186,.7)]">
              جدید
            </span>
          )}
        </span>

        {/* چیپِ مدت — روی کاور، حسِ پلتفرمِ ویدئو */}
        {durationLabel && (
          <span className="absolute bottom-2.5 left-2.5 inline-flex h-5 items-center gap-1 rounded-md bg-black/55 px-1.5 text-[10px] font-bold text-white ring-1 ring-white/20 backdrop-blur-sm">
            <Clock3 className="h-2.5 w-2.5" aria-hidden="true" />
            <span dir="rtl">{durationLabel}</span>
          </span>
        )}

        {/* افورده‌ی پخش روی hover */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        >
          <span className="grid h-11 w-11 scale-90 place-items-center rounded-full bg-white/95 text-brand-700 shadow-float transition-transform duration-300 group-hover:scale-100">
            <ListVideo className="h-[18px] w-[18px] translate-x-[-1px]" aria-hidden="true" />
          </span>
        </span>
      </div>

      {/* ── بدنه ── */}
      <div className="flex min-w-0 flex-1 flex-col p-4 md:p-[18px]">
        <h3 className="min-h-[3.5em] text-[15px] font-extrabold leading-7 text-ink-900">
          <Link
            href={`/lms/courses/${encodeURIComponent(c.slug)}`}
            className="-mx-1 -my-0.5 inline-block max-w-full select-none rounded-[10px] px-1 py-0.5 align-top transition-colors after:absolute after:inset-0 hover:text-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:text-brand-800"
          >
            <span className="line-clamp-2">{c.title}</span>
          </Link>
        </h3>
        {c.shortDescription && (
          <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-6 text-ink-500">
            {c.shortDescription}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {levelLabel && (
            <span
              className={`inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-bold ring-1 ${LEVEL_CHIP[c.level ?? ''] ?? 'bg-ink-50 text-ink-600 ring-ink-100'}`}
            >
              <Flag className="h-3 w-3" aria-hidden="true" />
              {levelLabel}
            </span>
          )}
          {c.lessonsCount > 0 && (
            <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-ink-50 px-2.5 text-[11px] font-bold text-ink-600 ring-1 ring-ink-100">
              <ListVideo className="h-3 w-3 text-brand-600" aria-hidden="true" />
              <span className="whitespace-nowrap">
                {c.lessonsCount.toLocaleString('fa-IR')} جلسه
              </span>
            </span>
          )}
        </div>

        {/* پاصفحه */}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-ink-100 pt-3">
          <span className="inline-flex min-w-0 items-center gap-2">
            <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-brand-50 ring-2 ring-brand-100">
              <SmartImage
                src={c.instructorAvatarUrl}
                alt={`تصویر ${c.instructor}`}
                variant="avatar"
                fill
                sizes="36px"
                className="object-cover"
              />
            </span>
            <span className="truncate text-[12px] font-bold text-ink-700">{c.instructor}</span>
          </span>

          <span className="flex items-center gap-3 text-[11.5px] font-bold text-ink-500">
            {c.enrollmentsCount > 0 && (
              <span className="inline-flex items-center gap-1">
                <Users className="h-3 w-3 text-brand-600" aria-hidden="true" />
                <span className="tabular-nums">{c.enrollmentsCount.toLocaleString('fa-IR')}</span>
              </span>
            )}
            {c.graduatesCount > 0 && (
              <span className="inline-flex items-center gap-1">
                <GraduationCap className="h-3 w-3 text-brand-600" aria-hidden="true" />
                <span className="tabular-nums">{c.graduatesCount.toLocaleString('fa-IR')}</span>
              </span>
            )}
          </span>
        </div>

        {/* CTAی شروع — گرادیانتِ برند، پایینِ کارت */}
        <span className="mt-3 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-brand-500 to-brand-700 text-[13px] font-extrabold text-white shadow-[0_10px_24px_-12px_rgba(13,128,116,.75)] transition-all duration-200 group-hover:from-brand-600 group-hover:to-brand-800">
          <GraduationCap className="h-4 w-4" aria-hidden="true" />
          شروع یادگیری
        </span>
      </div>
    </article>
  );
}
