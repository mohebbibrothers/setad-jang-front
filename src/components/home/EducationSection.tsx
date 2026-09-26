'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMemo, useState, type ComponentType, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SmartImage } from '@/components/ui/SmartImage';
import { Icon, type IconName } from '@/components/icons/Icon';
import { SectionTitle } from './SectionTitle';
import { EmptyState } from './EmptyState';
import { formatPersianNumber } from '@/lib/utils';

/**
 * ───────────────────────────────────────────────────────────────────────────
 *  قرارگاه آموزشی — بازطراحی (نسلِ بومیِ صفحه‌ی اصلی)
 *
 *  هدفِ طراحی: این سکشن باید «نقطه‌ی قوتِ» صفحه باشد و در عین حال دقیقاً
 *  همان زبانِ بصریِ سکشن‌های خواهر (مددکار/جایزه/تبیین/مهربانی) را حفظ کند:
 *
 *    • بدنه‌ی section-y روی bg-white (آهنگِ یک‌درمیانِ روشنِ صفحه)
 *    • SectionTitle استاندارد (تیتر برند + الگوی +)
 *    • کارت‌های rounded-[18px] با border-ink-100 و سایه‌ی ملایمِ hover-lift
 *    • چیپ‌های think-50 و پیلِ فیلترِ مرکزی (الگوی تبیین)
 *    • پیجرِ دایره‌ای با PNGهای برند (الگوی مددکار)
 *    • EmptyState مشترک برای حالتِ «فیلترِ خالی»
 *
 *  قرارداد بک‌اند (apps/lms — خوانده‌شده روی آخرین کامیت‌ها):
 *    GET /api/v1/lms/categories/  → LMSCategorySerializer
 *        {id,title,slug,description,icon,cover_image,order,is_active}
 *    GET /api/v1/lms/courses/     → CourseSummarySerializer (لیست)
 *        {id,category,title,slug,subtitle,short_description,instructor_name,
 *         level,status,is_featured,cover_image,lessons_count,
 *         estimated_duration_seconds,enrollments_count,graduates_count,
 *         published_at}
 *    سطوح: beginner | intermediate | advanced | professional
 *    فیچر تازه: Lesson.content_type = video|audio|document|article
 *        (رسانه با ۹۰٪ تماشا، سند/متن با علامتِ «خواندم» تکمیل می‌شود)
 *    Quiz: آستانه‌ی قبولی شفاف + ثبت تلاش‌ها؛ is_required_for_certificate
 *    Certificate: کد راستی‌آزماییِ یکتا + استعلامِ عمومی
 *        /certificates/verify/<verification_slug>/
 *
 *  دو حالت نمایشی:
 *    ۱) کاتالوگ (courses.length > 0): شمارنده‌ها + پیلِ دسته‌بندی + کارت‌ها
 *       + پیجر؛ همه‌ی متادیتاهای واقعیِ سریالایزر روی کارت دیده می‌شود.
 *    ۲) راه‌اندازی (کاتالوگ خالی = وضعیت فعلیِ پروداکشن): «کنسولِ
 *       راه‌اندازی» — راهپیمای صادقانه‌ی در-جریان/به‌زودی، چهار شیوه‌ی
 *       رسانه‌ی جلسات (فیچر تازه‌ی بک‌اند) و панلِ گواهی راستی‌آزما؛
 *       بدون هیچ CTA بن‌بست.
 *    پنلِ «مسیر یادگیری در قرارگاه» در هر دو حالت ثابت است تا با رسیدنِ
 *    اولین دوره، سکشن دچار جهشِ چیدمان نشود.
 * ───────────────────────────────────────────────────────────────────────────
 */

export type EduCategory = {
  slug: string;
  title: string;
  count?: number;
};

export type CourseCard = {
  slug: string;
  title: string;
  subtitle?: string;
  /** apps.lms.serializers.CourseSummarySerializer.short_description */
  shortDescription?: string;
  instructor?: string;
  /** ONLY present when the source was CourseDetailSerializer. Homepage
   *  cards read from CourseSummarySerializer and will always leave this
   *  undefined — the card gracefully falls back to an initial glyph. */
  instructorAvatarUrl?: string;
  level?: 'beginner' | 'intermediate' | 'advanced' | 'professional' | string;
  coverUrl?: string;
  lessonsCount?: number;
  durationSeconds?: number;
  enrollmentsCount?: number;
  /** apps.lms.serializers.CourseSummarySerializer.graduates_count */
  graduatesCount?: number;
  isNew?: boolean;
  isFeatured?: boolean;
  categorySlug?: string;
  /** Denormalised for anchor labels / breadcrumbs; comes from `category.title`. */
  categoryTitle?: string;
  toneFrom?: string;
  toneTo?: string;
};

const ALL_SLUG = 'all';

/** Mirrors apps.lms.choices.CourseLevel — ۴ سطحِ مسیرِ یادگیری. */
const LEVEL_LABEL: Record<string, string> = {
  beginner: 'مقدماتی',
  intermediate: 'متوسط',
  advanced: 'پیشرفته',
  professional: 'حرفه‌ای',
};

function formatDurationShort(seconds?: number): string {
  if (!seconds || seconds <= 0) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h.toLocaleString('fa-IR')}س ${m.toLocaleString('fa-IR')}د`;
  if (h > 0) return `${h.toLocaleString('fa-IR')} ساعت`;
  return `${m.toLocaleString('fa-IR')} دقیقه`;
}

/** میانگینِ ثبت‌نام — آستانه‌ی برچسب «ویژه» وقتی بک‌اند is_featured نداده. */
function avgEnrollments(courses: CourseCard[]): number {
  const values = courses.map((c) => c.enrollmentsCount ?? 0);
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  گلیف‌های محلی — همان الگوی سکشن‌های خواهر (SVG سبک، بدون وابستگی)        */
/* ───────────────────────────────────────────────────────────────────────── */

type GlyphProps = { className?: string };

function Glyph({ className, children }: GlyphProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/** موجِ صوت — جلساتِ audio */
function AudioGlyph({ className = 'h-3.5 w-3.5' }: GlyphProps) {
  return (
    <Glyph className={className}>
      <path d="M4 10v4" />
      <path d="M8 7v10" />
      <path d="M12 4v16" />
      <path d="M16 8v8" />
      <path d="M20 11v2" />
    </Glyph>
  );
}

/** سند — جلساتِ document (PDF) */
function DocGlyph({ className = 'h-3.5 w-3.5' }: GlyphProps) {
  return (
    <Glyph className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M9 13h6" />
      <path d="M9 17h4" />
    </Glyph>
  );
}

/** متنِ غنی — جلساتِ article */
function ArticleGlyph({ className = 'h-3.5 w-3.5' }: GlyphProps) {
  return (
    <Glyph className={className}>
      <path d="M4 6h16" />
      <path d="M4 10h16" />
      <path d="M4 14h10" />
      <path d="M4 18h7" />
    </Glyph>
  );
}

/** کلیپ‌بورد+تیک — آزمون و سنجش */
function QuizGlyph({ className = 'h-3.5 w-3.5' }: GlyphProps) {
  return (
    <Glyph className={className}>
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="m9 14 2 2 4-4" />
    </Glyph>
  );
}

/** مُهرِ افتخار — گواهی راستی‌آزما */
function SealGlyph({ className = 'h-5 w-5' }: GlyphProps) {
  return (
    <Glyph className={className}>
      <circle cx="12" cy="9" r="6" />
      <path d="m8.5 13.5-1.5 8 5-3 5 3-1.5-8" />
      <path d="m9.5 9 1.8 1.8 3.2-3.3" />
    </Glyph>
  );
}

/** چراغِ تپنده‌ی «در جریان» — نقطه‌ی پالس‌دارِ راهپیما */
function LiveDot() {
  return (
    <span className="relative inline-flex h-2.5 w-2.5 shrink-0">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint-400 opacity-60" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-mint-500" />
    </span>
  );
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  اتم‌های کوچکِ مشترک                                                       */
/* ───────────────────────────────────────────────────────────────────────── */

/** چیپِ متادیتای کارت دوره — الگوی پیل‌های think-50ِ سایت. */
function MetaChip({ icon, label }: { icon: IconName; label: string }) {
  if (!label) return null;
  return (
    <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-ink-50 px-2.5 text-[11px] font-bold text-ink-600 ring-1 ring-ink-100">
      <Icon name={icon} className="h-3 w-3 text-brand-600" />
      <span className="whitespace-nowrap">{label}</span>
    </span>
  );
}

/** نشان «جدید» — انتشار در ۳۰ روزِ گذشته (home-data). */
function BadgeNew() {
  return (
    <span className="inline-flex h-5 items-center rounded-full bg-mint-500 px-2.5 text-[10px] font-extrabold text-white shadow-[0_6px_16px_-6px_rgba(37,197,186,.7)]">
      جدید
    </span>
  );
}

/** نشان «ویژه» — is_featured یا بالاتر از میانگینِ ثبت‌نام. */
function BadgeFeatured() {
  return (
    <span className="inline-flex h-5 items-center gap-1 rounded-full bg-gradient-to-l from-gold-400 to-gold-500 px-2.5 text-[10px] font-extrabold text-white shadow-[0_6px_16px_-6px_rgba(240,148,26,.7)]">
      <Icon name="sparkles" className="h-2.5 w-2.5" />
      ویژه
    </span>
  );
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  پیجر — دقیقاً الگوی سکشنِ مددکار (پیکان‌های PNG برند)                     */
/* ───────────────────────────────────────────────────────────────────────── */

function PagerArrows({
  onPrev,
  onNext,
  disabled,
}: {
  onPrev: () => void;
  onNext: () => void;
  disabled: boolean;
}) {
  return (
    <div className="mt-8 flex items-center justify-center gap-4">
      <button
        type="button"
        aria-label="قبلی"
        onClick={onPrev}
        disabled={disabled}
        className="relative h-12 w-12 rounded-full transition-transform duration-200 hover:scale-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
      >
        <Image
          src="/brand/pager-arrow-prev.png"
          alt=""
          fill
          sizes="48px"
          className="object-contain"
        />
      </button>
      <button
        type="button"
        aria-label="بعدی"
        onClick={onNext}
        disabled={disabled}
        className="relative h-12 w-12 rounded-full transition-transform duration-200 hover:scale-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
      >
        <Image
          src="/brand/pager-arrow-next.png"
          alt=""
          fill
          sizes="48px"
          className="object-contain"
        />
      </button>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  شمارنده‌های واقعیِ کاتالوگ — فقط از داده‌ی API، بدون عدد ساختگی          */
/* ───────────────────────────────────────────────────────────────────────── */

function StatsRow({ courses, categories }: { courses: CourseCard[]; categories: EduCategory[] }) {
  // مجموع یادگیرندگان و ساعت محتوا مستقیماً از فیلدهای سریالایزر جمع می‌شود.
  const learners = courses.reduce((a, c) => a + (c.enrollmentsCount ?? 0), 0);
  const totalSeconds = courses.reduce((a, c) => a + (c.durationSeconds ?? 0), 0);
  const hours = Math.round(totalSeconds / 3600);

  const items: Array<{ value: number; label: string }> = [
    { value: courses.length, label: 'کلاس تخصصی' },
    { value: categories.length, label: 'دسته‌بندی' },
    { value: learners, label: 'یادگیرنده' },
    { value: hours, label: 'ساعت آموزش' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay: 0.1 }}
      className="mb-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 md:mb-10 md:gap-x-8"
      aria-label="آمار قرارگاه آموزشی"
    >
      {items.map((s, i) => (
        <span key={s.label} className="flex items-center gap-x-6 md:gap-x-8">
          {i > 0 && <span className="h-4 w-px bg-ink-200" aria-hidden="true" />}
          <span className="flex items-baseline gap-1.5">
            <span className="text-[20px] font-extrabold tabular-nums text-brand-600 md:text-[22px]">
              {formatPersianNumber(s.value)}
            </span>
            <span className="text-[11.5px] font-medium text-ink-500 md:text-[12.5px]">
              {s.label}
            </span>
          </span>
        </span>
      ))}
    </motion.div>
  );
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  کارت دوره — خواهرِ کارت مددکار: همان اسکلت، همان سایه، متادیتای LMS      */
/* ───────────────────────────────────────────────────────────────────────── */

function CourseTile({
  c,
  featured,
  delay = 0,
}: {
  c: CourseCard;
  featured: boolean;
  delay?: number;
}) {
  const levelLabel = c.level ? (LEVEL_LABEL[c.level] ?? '') : '';
  const durationLabel = formatDurationShort(c.durationSeconds);
  const lessonsLabel =
    c.lessonsCount != null && c.lessonsCount > 0
      ? `${formatPersianNumber(c.lessonsCount)} جلسه`
      : '';

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay }}
      /* همان ریاضیاتِ چینشِ کارتِ مددکار: تمام‌عرض در موبایل، دو‌ستونه در lg
         با وسط‌چینِ خودکارِ یتیمِ آخرین سطر. */
      className="group relative w-full min-w-0 overflow-hidden rounded-[18px] border border-ink-100 bg-white shadow-[0_2px_10px_-4px_rgba(15,20,32,.06)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_44px_-22px_rgba(11,53,48,.22)] lg:w-[calc((100%-1.25rem)/2)]"
    >
      {/* ── کاور ۱۶/۱۰ با چیپِ دسته، نشان‌ها و افورده‌ی پخش ──────────── */}
      <div className="relative aspect-[16/10] overflow-hidden bg-ink-50">
        <SmartImage
          src={c.coverUrl}
          alt={c.title}
          variant="course"
          fill
          sizes="(min-width: 1024px) 560px, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* چیپِ دسته‌بندی — همان زبانِ چیپِ شیشه‌ای روی تصویر (مددکار/تبیین) */}
        {c.categoryTitle && (
          <span className="absolute right-2.5 top-2.5 inline-flex h-5 items-center rounded-md bg-black/55 px-1.5 text-[10px] font-bold text-white ring-1 ring-white/20 backdrop-blur-sm">
            {c.categoryTitle}
          </span>
        )}

        {/* نشان‌های وضعیت */}
        <span className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
          {featured && <BadgeFeatured />}
          {c.isNew && <BadgeNew />}
        </span>

        {/* افورده‌ی پخش — حسِ سینمایی، فقط روی hover (دسکتاپ) */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        >
          <span className="grid h-11 w-11 scale-90 place-items-center rounded-full bg-white/95 text-brand-700 shadow-float transition-transform duration-300 group-hover:scale-100">
            <Icon name="play" className="h-4 w-4 translate-x-[-1px]" />
          </span>
        </span>
      </div>

      {/* ── بدنه ───────────────────────────────────────────────── */}
      <div className="p-4 md:p-5">
        <h3 className="line-clamp-2 min-h-[3.5em] text-[15px] font-extrabold leading-7 text-ink-900 md:text-[15.5px]">
          <Link
            href={`/lms/courses/${encodeURIComponent(c.slug)}`}
            className="transition-colors after:absolute after:inset-0 hover:text-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          >
            {c.title}
          </Link>
        </h3>
        {c.shortDescription && (
          <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-6 text-ink-500">
            {c.shortDescription}
          </p>
        )}

        {/* سطح / مدت / جلسات — هر سه از فیلدهای واقعیِ لیست */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          <MetaChip icon="flag" label={levelLabel} />
          <MetaChip icon="clock" label={durationLabel} />
          <MetaChip icon="list" label={lessonsLabel} />
        </div>

        {/* پاصفحه: مدرس + آمارِ ثبت‌نام/فارغ‌التحصیل */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-ink-100 pt-3">
          <span className="inline-flex min-w-0 items-center gap-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600 ring-1 ring-brand-100">
              {c.instructorAvatarUrl ? (
                /* در مسیرِ لیست هرگز ست نمی‌شود — گاردِ احتیاطی */
                <Image
                  src={c.instructorAvatarUrl}
                  alt=""
                  width={32}
                  height={32}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <Icon name="user" className="h-3.5 w-3.5" />
              )}
            </span>
            <span className="truncate text-[12px] font-bold text-ink-700">
              {c.instructor || 'مدرس قرارگاه'}
            </span>
          </span>

          <span className="flex items-center gap-3 text-[11.5px] font-bold text-ink-500">
            {c.enrollmentsCount != null && c.enrollmentsCount > 0 && (
              <span className="inline-flex items-center gap-1">
                <Icon name="users" className="h-3 w-3 text-brand-600" />
                <span className="tabular-nums">{formatPersianNumber(c.enrollmentsCount)}</span>
                <span className="hidden font-medium text-ink-400 sm:inline">یادگیرنده</span>
              </span>
            )}
            {c.graduatesCount != null && c.graduatesCount > 0 && (
              <span className="inline-flex items-center gap-1">
                <Icon name="graduation" className="h-3 w-3 text-brand-600" />
                <span className="tabular-nums">{formatPersianNumber(c.graduatesCount)}</span>
                <span className="hidden font-medium text-ink-400 sm:inline">فارغ‌التحصیل</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-brand-600">
              مشاهده
              <Icon
                name="arrow-left"
                className="h-3 w-3 transition-transform duration-300 group-hover:-translate-x-0.5"
              />
            </span>
          </span>
        </div>
      </div>
    </motion.article>
  );
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  قطعاتِ «کنسولِ راه‌اندازی» (حالتِ کاتالوگِ خالی)                          */
/* ───────────────────────────────────────────────────────────────────────── */

/** چهار شیوه‌ی رسانه‌ی جلسات — آینه‌ی Lesson.content_type (فیچر تازه). */
const LESSON_MEDIA: Array<{ key: string; label: string; Glyph: ComponentType<GlyphProps> }> = [
  { key: 'video', label: 'ویدئو', Glyph: (p) => <Icon name="play" className={p.className} /> },
  { key: 'audio', label: 'صوت', Glyph: AudioGlyph },
  { key: 'document', label: 'سند PDF', Glyph: DocGlyph },
  { key: 'article', label: 'متن غنی', Glyph: ArticleGlyph },
];

/** راهپیمای صادقانه‌ی راه‌اندازی — وضعیت واقعی، بدون وعده‌ی تاریخ. */
const ROADMAP: Array<{ title: string; state: 'now' | 'soon'; stateLabel: string }> = [
  { title: 'آماده‌سازی و کنترل کیفیتِ محتوای آموزشی', state: 'now', stateLabel: 'در جریان' },
  { title: 'انتشارِ نخستین کلاس‌های قرارگاه', state: 'soon', stateLabel: 'به‌زودی' },
  { title: 'ثبت‌نام، آزمون و صدور گواهی', state: 'soon', stateLabel: 'پس از انتشار' },
];

/** پنلِ گواهی راستی‌آزما — پیش‌نمایشِ صادقانه‌ی قابلیتِ Certificate */
function CertificatePanel({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay }}
      className="relative w-full max-w-[340px] rounded-2xl border border-brand-100 bg-white p-5 shadow-card"
    >
      <span className="absolute -top-2.5 left-4 inline-flex h-5 items-center rounded-full bg-ink-50 px-2 text-[9.5px] font-bold text-ink-400 ring-1 ring-ink-100">
        پیش‌نمایش
      </span>

      {/* سرپوش: مُهر + عناوین */}
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow">
          <SealGlyph className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[12.5px] font-extrabold text-ink-800">گواهی‌نامهٔ پایان دوره</p>
          <p className="mt-0.5 text-[10.5px] font-medium text-ink-400">
            بعثت مردم • قرارگاه آموزشی
          </p>
        </div>
      </div>

      {/* خطوطِ جایِ نامِ دوره/مدرس — الگوی اسکلتِ پیش‌نمایش */}
      <div className="mt-4 space-y-2" aria-hidden="true">
        <span className="block h-2.5 w-3/4 rounded-full bg-ink-100" />
        <span className="block h-2 w-1/2 rounded-full bg-ink-50" />
        <span className="block h-2 w-2/3 rounded-full bg-ink-50" />
      </div>

      {/* نوارِ کد راستی‌آزمایی */}
      <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-ink-50 px-3 py-2.5 ring-1 ring-ink-100">
        <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold text-ink-500">
          <Icon name="shield" className="h-3.5 w-3.5 text-brand-600" />
          کد یکتای راستی‌آزمایی
        </span>
        <span dir="ltr" className="font-mono text-[12px] tracking-[0.22em] text-ink-400">
          BSM••••••
        </span>
      </div>

      <p className="mt-3 text-center text-[10.5px] font-medium leading-5 text-ink-400">
        اعتبارِ هر گواهی برای همه — حتی بدون ورود — قابل استعلام است.
      </p>
    </motion.div>
  );
}

/** کنسولِ راه‌اندازی — قهرمانِ حالتِ خالی؛ تماماً با اتم‌های سفیدِ سایت. */
function LaunchConsole() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5 }}
      className="overflow-hidden rounded-[24px] border border-ink-100 bg-white shadow-card"
    >
      <div className="grid lg:grid-cols-2">
        {/* ستونِ پیام + راهپیما + شیوه‌های رسانه (شروعِ RTL) */}
        <div className="p-6 md:p-8">
          <h3 className="text-[17px] font-extrabold leading-8 text-ink-900 md:text-[19px]">
            نخستین کلاس‌های قرارگاه در راه‌اند
          </h3>
          <p className="mt-3 max-w-md text-[13px] leading-7 text-ink-600 md:text-[13.5px]">
            محتوای آموزشی همین حالا در مرحلهٔ آماده‌سازی و کنترل کیفیت است؛ به‌محض انتشار، کلاس‌های
            رایگان با دسته‌بندی، سطح‌بندی و ثبت‌نامِ آسان، همین‌جا می‌نشینند.
          </p>

          {/* راهپیمای راه‌اندازی */}
          <ol className="mt-6 space-y-3" aria-label="راهپیمای راه‌اندازی">
            {ROADMAP.map((r) => (
              <li key={r.title} className="flex items-center gap-3">
                {r.state === 'now' ? (
                  <LiveDot />
                ) : (
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full bg-white ring-2 ring-ink-200"
                    aria-hidden="true"
                  />
                )}
                <span className="min-w-0 flex-1 truncate text-[12.5px] font-bold text-ink-700">
                  {r.title}
                </span>
                <span
                  className={`inline-flex h-5 shrink-0 items-center rounded-full px-2 text-[10px] font-extrabold ${
                    r.state === 'now'
                      ? 'bg-mint-100 text-mint-800 ring-1 ring-mint-200'
                      : 'bg-ink-50 text-ink-500 ring-1 ring-ink-100'
                  }`}
                >
                  {r.stateLabel}
                </span>
              </li>
            ))}
          </ol>

          {/* چهار شیوه‌ی رسانه‌ی جلسات — جایی که فیچر تازه‌ی بک‌اند دیده می‌شود */}
          <div className="mt-7 border-t border-ink-100 pt-5">
            <p className="mb-2.5 text-[11px] font-bold text-ink-400">
              هر جلسه، به رسانه‌ای که به آن می‌آید:
            </p>
            <div className="flex flex-wrap gap-2">
              {LESSON_MEDIA.map((m) => (
                <span
                  key={m.key}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full bg-ink-50 px-3 text-[11.5px] font-bold text-ink-600 ring-1 ring-ink-100"
                >
                  <m.Glyph className="h-3.5 w-3.5 text-brand-600" />
                  {m.label}
                </span>
              ))}
            </div>
            <p className="mt-2.5 text-[10.5px] leading-5 text-ink-400">
              پیشرفتِ ویدئو و صوت با ۹۰٪ تماشا، و سند و متن با علامتِ «خواندم» ثبت می‌شود.
            </p>
          </div>
        </div>

        {/* ستونِ بصری: پنلِ گواهی روی کُرْتِ برندِ ملایم با بافتِ نقطه */}
        <div className="relative grid place-items-center border-t border-ink-100 bg-ink-50/60 p-6 md:p-8 lg:border-s lg:border-t-0">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-60"
          />
          <CertificatePanel delay={0.15} />
        </div>
      </div>
    </motion.div>
  );
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  پنلِ «مسیر یادگیری در قرارگاه» — ثابت در هر دو حالت؛ روایتِ قابلیت‌ها     */
/* ───────────────────────────────────────────────────────────────────────── */

const JOURNEY: Array<{
  n: number;
  title: string;
  desc: string;
  icon: IconName | 'quiz' | 'seal';
}> = [
  {
    n: 1,
    title: 'انتخاب مسیر',
    desc: 'دسته‌بندی‌های تخصصی با چهار سطح — از مقدماتی تا حرفه‌ای، هر مهارت یک مسیرِ روشن دارد.',
    icon: 'category-pick',
  },
  {
    n: 2,
    title: 'جلسات چندنوعی',
    desc: 'هر جلسه ویدئو، صوت، سند PDF یا متنِ غنی است؛ پیشرفتِ هر جلسه خودکار ثبت می‌شود.',
    icon: 'play',
  },
  {
    n: 3,
    title: 'آزمون و سنجش',
    desc: 'آزمونِ پایانِ دوره با آستانهٔ قبولیِ شفاف؛ تمام تلاش‌ها ثبت و بهترین نتیجه دیده می‌شود.',
    icon: 'quiz',
  },
  {
    n: 4,
    title: 'گواهی راستی‌آزما',
    desc: 'گواهی پایانِ دوره با کدِ یکتا صادر می‌شود و اعتبارش از یک نشانیِ عمومی بررسی می‌شود.',
    icon: 'seal',
  },
];

function JourneyPanel({ className = '' }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: 0.05 }}
      className={`rounded-[24px] border border-ink-100 bg-white p-5 shadow-card md:p-7 ${className}`}
    >
      {/* سرصفحه‌ی داخلِ پنل — همان زبانِ دیسکِ آیکونِ EmptyState */}
      <div className="mb-6 flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600 shadow-[inset_0_0_0_1px_rgba(13,128,116,.08)]">
          <Icon name="graduation" className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="text-[14.5px] font-extrabold text-ink-900 md:text-[15px]">
            مسیر یادگیری در قرارگاه
          </h3>
          <p className="mt-1 text-[11.5px] font-medium leading-5 text-ink-500 md:text-[12px]">
            از انتخاب مسیر تا گواهیِ قابل‌استعلام — چهار گامِ روشن و ثبت‌شده.
          </p>
        </div>
      </div>

      {/* ۴ گام — مرکزچین (هم‌خانواده با EmptyState) + خطِ رابطِ دسکتاپ */}
      <div className="relative">
        <span
          aria-hidden="true"
          className="absolute left-[12.5%] right-[12.5%] top-5 hidden h-px bg-gradient-to-l from-transparent via-brand-200 to-transparent lg:block"
        />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          {JOURNEY.map((s) => (
            <div key={s.n} className="relative flex flex-col items-center px-2 text-center">
              <span className="relative z-10 grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 text-[14px] font-extrabold text-brand-700 shadow-[inset_0_0_0_1px_rgba(13,128,116,.08)] ring-4 ring-white">
                {s.n.toLocaleString('fa-IR')}
              </span>
              <span className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-extrabold text-ink-800">
                {s.icon === 'quiz' ? (
                  <QuizGlyph className="h-3.5 w-3.5 text-brand-600" />
                ) : s.icon === 'seal' ? (
                  <SealGlyph className="h-3.5 w-3.5 text-brand-600" />
                ) : (
                  <Icon name={s.icon} className="h-3.5 w-3.5 text-brand-600" />
                )}
                {s.title}
              </span>
              <p className="mt-1.5 max-w-[240px] text-[11.5px] leading-5 text-ink-500 md:leading-6">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  سکشن                                                                     */
/* ───────────────────────────────────────────────────────────────────────── */

export function EducationSection({
  categories,
  courses,
}: {
  categories: EduCategory[];
  courses: CourseCard[];
}) {
  const [filter, setFilter] = useState<string>(ALL_SLUG);
  const [page, setPage] = useState(0);

  const avg = avgEnrollments(courses);
  const isFeaturedCourse = (c: CourseCard) =>
    c.isFeatured ?? (avg > 0 && (c.enrollmentsCount ?? 0) >= avg && (c.enrollmentsCount ?? 0) > 0);

  /* دوره‌های «ویژه» اول می‌نشینند (per-stable sort)، بقیه به ترتیبِ لودر
     (newest-first) می‌آیند. */
  const ordered = useMemo(() => {
    const flagged = courses.map((c) => ({ c, f: isFeaturedCourse(c) }));
    return flagged.sort((a, b) => Number(b.f) - Number(a.f)).map((x) => x.c);
  }, [courses]); // eslint-disable-line react-hooks/exhaustive-deps

  /* شمارِ هر دسته از خودِ فهرستِ دوره‌ها مشتق می‌شود — سریالایزرِ دسته
     فیلد courses_count ندارد؛ این یعنی نشانِ عددیِ هر چیپ دقیقاً برابرِ
     تعدادِ کارتی است که با انتخابِ آن دیده می‌شود. */
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of courses) {
      if (!c.categorySlug) continue;
      m.set(c.categorySlug, (m.get(c.categorySlug) ?? 0) + 1);
    }
    return m;
  }, [courses]);

  const filtered = useMemo(
    () => (filter === ALL_SLUG ? ordered : ordered.filter((c) => c.categorySlug === filter)),
    [ordered, filter],
  );

  // ۴ کارت در هر صفحه (۲×۲ روی دسکتاپ) — همان آهنگِ پیجرِ مددکار.
  const PAGE_SIZE = 4;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const visible = useMemo(
    () => filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE),
    [filtered, safePage],
  );

  const choose = (slug: string) => {
    setFilter(slug);
    setPage(0);
  };
  const prev = () => {
    if (totalPages <= 1) return;
    setPage((p) => (p - 1 + totalPages) % totalPages);
  };
  const next = () => {
    if (totalPages <= 1) return;
    setPage((p) => (p + 1) % totalPages);
  };

  const isCatalog = courses.length > 0;

  /* تب‌های پیلِ فیلتر — «همه» + دسته‌ها با شمارِ مشتق‌شده از فهرست. */
  const tabs: Array<{ slug: string; title: string; count: number }> = useMemo(
    () => [
      { slug: ALL_SLUG, title: 'همه', count: courses.length },
      ...categories.map((c) => ({
        slug: c.slug,
        title: c.title,
        count: counts.get(c.slug) ?? 0,
      })),
    ],
    [categories, counts, courses.length],
  );

  return (
    <section className="section-y bg-white" id="education">
      <div className="container-edge">
        <SectionTitle
          title="قرارگاه آموزشی"
          description="هر مهارتی که می‌آموزی، آمادگیِ تازه‌ای برای میدان است؛ کلاس‌های رایگانِ سطح‌بندی‌شده، جلساتِ چندنوعی، آزمون‌های سنجش و گواهیِ پایانِ دوره با راستی‌آزمایی — همه در سکوی آموزشِ مردمی."
        />

        {isCatalog ? (
          <>
            <StatsRow courses={courses} categories={categories} />

            {/* ── پیلِ فیلترِ دسته‌بندی — الگوی تبیین، تب‌های پویا ── */}
            {categories.length > 0 && (
              <div className="mb-8 flex w-full justify-center px-2 sm:px-0">
                <div
                  role="tablist"
                  aria-label="دسته‌بندی دوره‌ها"
                  className="max-w-full overflow-x-auto rounded-full bg-ink-50 p-1 shadow-inner ring-1 ring-ink-100 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  <div className="flex items-center gap-1">
                    {tabs.map((t) => {
                      const isActive = filter === t.slug;
                      return (
                        <button
                          key={t.slug}
                          type="button"
                          role="tab"
                          aria-selected={isActive}
                          onClick={() => choose(t.slug)}
                          className={`inline-flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[12px] font-extrabold transition-all duration-200 sm:px-4 sm:text-[12.5px] ${
                            isActive
                              ? 'bg-gradient-to-l from-brand-500 to-brand-700 text-white shadow-[0_8px_20px_-6px_rgba(13,128,116,.55)]'
                              : 'text-ink-600 hover:bg-white/60 hover:text-ink-900'
                          }`}
                        >
                          {t.slug === ALL_SLUG && (
                            <Icon name="grid" className="h-3.5 w-3.5 shrink-0" />
                          )}
                          <span className="truncate">{t.title}</span>
                          <span
                            className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10.5px] font-extrabold tabular-nums ${
                              isActive ? 'bg-white/25 text-white' : 'bg-ink-100 text-ink-500'
                            }`}
                          >
                            {t.count.toLocaleString('fa-IR')}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── شبکه‌ی دوره‌ها │ حالتِ خالیِ فیلتر ── */}
            <AnimatePresence mode="wait">
              {visible.length === 0 ? (
                <motion.div
                  key={`empty-${filter}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                >
                  <EmptyState
                    title="در این دسته هنوز کلاسی منتشر نشده"
                    description="دستهٔ دیگری را انتخاب کن یا «همه» را ببین."
                    iconPath="M22 10 12 5 2 10l10 5 10-5z M6 12v5c3 3 9 3 12 0v-5"
                  />
                </motion.div>
              ) : (
                <motion.div
                  key={`${filter}-${safePage}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-wrap justify-center gap-4 md:gap-5"
                >
                  {visible.map((c, i) => (
                    <CourseTile
                      key={c.slug}
                      c={c}
                      featured={isFeaturedCourse(c)}
                      delay={i * 0.06}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <PagerArrows onPrev={prev} onNext={next} disabled={totalPages <= 1} />

            <JourneyPanel className="mt-10 md:mt-12" />
          </>
        ) : (
          <>
            <LaunchConsole />
            <JourneyPanel className="mt-6 md:mt-8" />
          </>
        )}
      </div>
    </section>
  );
}
