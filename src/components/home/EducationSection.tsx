'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Award,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  GraduationCap,
  ListChecks,
  Star,
  Users,
} from 'lucide-react';
import { SmartImage } from '@/components/ui/SmartImage';
import { Icon } from '@/components/icons/Icon';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * قرارگاه آموزشی · EducationSection (v4 — «سکوی فرمان»)
 *
 * Backend contract (apps/lms — بررسی‌شده روی کامیتِ چندّنوعیِ جلسات):
 *   GET /api/v1/lms/categories/  → LMSCategorySerializer
 *   GET /api/v1/lms/courses/     → CourseSummarySerializer (paginated)
 *     {title, slug, subtitle, short_description, instructor_name, level,
 *      is_featured, cover_image, lessons_count, estimated_duration_seconds,
 *      enrollments_count, graduates_count, published_at, category{…}}
 *
 * ایدهٔ طراحی — این بخش باید «نقطهٔ قوتِ» صفحهٔ اصلی باشد، حتی وقتی
 * کاتالوگ هنوز خالی است (وضعیتِ فعلیِ سایت زنده):
 *
 *   • «سکوی فرمانِ» تیره: گرادیانِ عمق + بافتِ راه‌راه + دو شفقِ شناورِ
 *     منت/برند که آرام شناورند (با احترام به prefers-reduced-motion) —
 *     سکویی سینمایی که میان دو بخشِ روشن، مثل جزیره‌ای متمایز می‌درخشد.
 *
 *   • «شمارندهٔ مأموریت»: چهار عددِ صادقانه (دوره، دسته‌بندی، یادگیرنده،
 *     ساعت آموزش) با واحدِ دقیق و تایپوگرافیِ عددِ بزرگ + واحدِ کوچک —
 *     همان پیکسل‌بلندی که کاربر عاشقش شد؛ صفرها هم «روایتِ روزِ اولِ
 *     قرارگاه» قلمداد می‌شوند، نه ضعف.
 *
 *   • حالت «راه‌اندازی» (کاتالوگ خالی): چهار کف‌اینکِ شیشه‌ای که
 *     توانمندی‌های «واقعیِ» پلتفرم را نشان می‌دهند — کلاسِ رایگان، جلسات
 *     چندنوعی (ویدئو/صوت/PDF/متن — فیچر تازه‌رسیدهٔ بک‌اند)، آزمون و
     سنجش، گواهی با راستی‌آزماییِ عمومی + «راهپیمای راه‌اندازیِ» سه‌مرحله‌ای
 *     (آماده‌سازی محتوا ← انتشار ← ثبت‌نام و گواهی). هیچ CTAِ ساختگی و
 *     لینکِ بن‌بست در کار نیست.
 *
 *   • حالت «کاتالوگ» (دوره‌ها رسیدند): چیپ‌تب‌های شیشه‌ای با شمارنده،
 *     کارت‌های سینماییِ تیره (کاور + اسکریم + نشانِ جدید/ویژه + چیپ‌های
 *     سطح/مدت/جلسه + ردیفِ مدرس/شمار + لینکِ مشاهده)، پیجرِ شیشه‌ای با
 *     نقطهٔ پیشرفت. پیوندِ کارت‌ها به /lms/courses/[slug] می‌رود (طراحیِ
 *     صفحه‌های وابسته در راندِ بعد).
 * ═══════════════════════════════════════════════════════════════════════════
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

/** Compute average enrollment across all courses (used as the 'ویژه' threshold). */
function avgEnrollments(courses: CourseCard[]): number {
  const values = courses.map((c) => c.enrollmentsCount ?? 0);
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  Section — سکوی فرمان                                                     */
/* ───────────────────────────────────────────────────────────────────────── */

export function EducationSection({
  categories,
  courses,
}: {
  categories: EduCategory[];
  courses: CourseCard[];
}) {
  const reduceMotion = useReducedMotion();

  /* شمارندهٔ مأموریت — همه از دیتای واقعی مشتق می‌شوند (بدون هیچ عددِ
     ساختگی): تعداد دوره/دسته از طول آرایه‌ها، یادگیرنده از جمعِ
     enrollments_count و ساعتِ آموزش از جمعِ estimated_duration_seconds. */
  const stats = useMemo(() => {
    const learners = courses.reduce((s, c) => s + (c.enrollmentsCount ?? 0), 0);
    const hours = Math.round(courses.reduce((s, c) => s + (c.durationSeconds ?? 0), 0) / 3600);
    return [
      { value: courses.length, unit: 'دوره', label: 'در فهرستِ قرارگاه' },
      { value: categories.length, unit: 'دسته‌بندی', label: 'مسیرِ یادگیری' },
      { value: learners, unit: 'یادگیرنده', label: 'در کلاس‌ها' },
      { value: hours, unit: 'ساعت آموزش', label: 'محتوای آماده' },
    ];
  }, [courses, categories]);

  return (
    <section
      id="education"
      className="section-y relative overflow-hidden bg-ink-950 text-white shadow-[inset_0_1px_0_rgba(255,255,255,.05),inset_0_-1px_0_rgba(255,255,255,.05)]"
    >
      {/* ── پس‌زمینهٔ صحنه: بافت + شفق‌های شناور ──────────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(-45deg, rgba(255,255,255,.03) 0 2px, transparent 2px 14px)',
        }}
      />
      <motion.div
        aria-hidden="true"
        initial={false}
        animate={reduceMotion ? undefined : { y: [0, -22, 0], x: [0, 14, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-mint-500/[0.14] blur-3xl"
      />
      <motion.div
        aria-hidden="true"
        initial={false}
        animate={reduceMotion ? undefined : { y: [0, 18, 0], x: [0, -12, 0] }}
        transition={{ duration: 19, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute -right-24 bottom-0 h-[22rem] w-[22rem] rounded-full bg-brand-500/[0.12] blur-3xl"
      />
      {/* ذراتِ نقطه‌ایِ ظریف — ستاره‌های میدان */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: 'radial-gradient(rgba(95,216,206,.24) 1px, transparent 1.4px)',
          backgroundSize: '26px 26px',
        }}
      />

      <div className="container-edge relative">
        {/* ── تیترِ صحنه ─────────────────────────────────────────────── */}
        <div className="mx-auto max-w-3xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[12px] font-bold text-white/80 backdrop-blur-sm"
          >
            <GraduationCap className="h-4 w-4 text-mint-400" aria-hidden="true" />
            آکادمی توانمندسازیِ میدان
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mt-5 text-[26px] font-black leading-[1.4] text-white sm:text-4xl md:text-[42px] md:leading-[1.4]"
          >
            قرارگاه آموزشیِ{' '}
            <span className="bg-gradient-to-l from-mint-200 via-mint-300 to-mint-500 bg-clip-text text-transparent">
              بعثت مردم
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="mx-auto mt-4 max-w-2xl text-[13.5px] leading-8 text-white/70 md:mt-5 md:text-[15px]"
          >
            هر مهارتی که می‌آموزی، آمادگیِ تازه‌ای برای میدان است؛ کلاس‌های رایگانِ تخصصی، جلسات
            چندنوعی، آزمونِ سنجش و گواهیِ پایان دوره — همه در سکوی آموزشِ مردمی.
          </motion.p>
        </div>

        {/* ── شمارندهٔ مأموریت — تایپوگرافیِ عددِ بزرگ + واحدِ کوچک ────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.18 }}
          className="mx-auto mt-8 grid max-w-4xl grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3 md:mt-10"
        >
          {stats.map((s) => (
            <div
              key={s.unit}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[.045] px-4 py-4 text-center backdrop-blur-sm transition-colors duration-300 hover:border-mint-400/30 hover:bg-white/[.07]"
            >
              <div className="text-[24px] font-black tabular-nums leading-none text-mint-300 md:text-[28px]">
                {s.value.toLocaleString('fa-IR')}
                <span className="ms-1.5 text-[11.5px] font-extrabold text-mint-200/70 md:text-[12.5px]">
                  {s.unit}
                </span>
              </div>
              <div className="mt-2 text-[10.5px] font-bold text-white/50 md:text-[11px]">
                {s.label}
              </div>
              {/* خط نورِ پایین — ظریف، متحرک روی هاور */}
              <span
                aria-hidden="true"
                className="absolute inset-x-6 bottom-0 h-[2px] scale-x-0 rounded-full bg-gradient-to-l from-mint-400 to-brand-500 transition-transform duration-300 group-hover:scale-x-100"
              />
            </div>
          ))}
        </motion.div>

        {/* ── بدنه: سکوی راه‌اندازی یا کاتالوگ ───────────────────────── */}
        {courses.length === 0 ? (
          <LaunchStage />
        ) : (
          <CatalogStage categories={categories} courses={courses} />
        )}

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mx-auto mt-10 max-w-xl text-center text-[11.5px] font-medium leading-6 text-white/45 md:mt-12"
        >
          هر مسیرِ بزرگ از یک قدم شروع می‌شود — شمارنده‌های بالا، روایتِ روزِ اولِ قرارگاه‌اند و با
          هر کلاسِ تازه، همین‌جا به‌روز می‌شوند.
        </motion.p>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  LaunchStage — وقتی کاتالوگ هنوز خالی است (وضعیتِ فعلیِ سایت زنده)        */
/*  توانمندی‌های واقعیِ پلتفرم + راهپیمای راه‌اندازی — بدون CTAِ ساختگی       */
/* ───────────────────────────────────────────────────────────────────────── */

const CAPABILITIES: Array<{
  icon: typeof GraduationCap;
  title: string;
  text: string;
}> = [
  {
    icon: GraduationCap,
    title: 'کلاس‌های رایگان',
    text: 'دوره‌های تخصصی و کاربردی برای همهٔ مردم؛ بدون هزینه، بدون مرزِ جغرافیایی.',
  },
  {
    icon: Clapperboard,
    title: 'جلسات چندنوعی',
    text: 'ویدئو، صوت، سند PDF و متنِ غنی — هر درس با رسانه‌ای که به آن می‌آید.',
  },
  {
    icon: ListChecks,
    title: 'آزمون و سنجش',
    text: 'آزمون‌های پایانِ دوره با آستانهٔ قبولیِ شفاف و ثبتِ دقیقِ تلاش‌ها.',
  },
  {
    icon: Award,
    title: 'گواهی با راستی‌آزمایی',
    text: 'گواهی پایانِ دوره با کدِ یکتا؛ اعتبارِ آن را هرکسی می‌تواند بررسی کند.',
  },
];

const ROADMAP: Array<{ title: string; state: 'now' | 'soon' }> = [
  { title: 'آماده‌سازی محتوای آموزشی', state: 'now' },
  { title: 'انتشار اولین کلاس‌های قرارگاه', state: 'soon' },
  { title: 'ثبت‌نام، آزمون و دریافت گواهی', state: 'soon' },
];

function LaunchStage() {
  return (
    <>
      {/* توانمندی‌های سکو */}
      <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:mt-12 lg:grid-cols-4">
        {CAPABILITIES.map((cap, i) => (
          <motion.div
            key={cap.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.45, delay: i * 0.06 }}
            className="group relative flex items-start gap-3.5 overflow-hidden rounded-2xl border border-white/10 bg-white/[.045] p-4 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-mint-400/30 hover:bg-white/[.07] hover:shadow-[0_20px_40px_-20px_rgba(13,128,116,.5)] sm:flex-col sm:gap-0 sm:p-5"
          >
            {/* درخششِ گرادیانیِ کنج روی هاور */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -left-8 -top-8 h-24 w-24 rounded-full bg-mint-400/15 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
            />
            <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-mint-500/25 to-brand-500/15 text-mint-300 ring-1 ring-mint-400/25 transition-transform duration-300 group-hover:scale-110 sm:h-12 sm:w-12">
              <cap.icon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
            </span>
            <div className="min-w-0 sm:mt-3.5">
              <h3 className="text-[14px] font-extrabold text-white md:text-[14.5px]">
                {cap.title}
              </h3>
              <p className="mt-1.5 text-[11.5px] font-medium leading-6 text-white/60 sm:mt-2">
                {cap.text}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* راهپیمای راه‌اندازی */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mx-auto mt-8 max-w-4xl md:mt-10"
        aria-label="راهپیمای راه‌اندازی قرارگاه آموزشی"
        role="list"
      >
        <ol className="relative flex flex-col gap-5 md:flex-row md:items-start md:gap-0">
          {/* ریلِ اتصال — چینش عمودی در موبایل، افقی در دسکتاپ */}
          <span
            aria-hidden="true"
            className="absolute bottom-2 right-[17px] top-2 w-px bg-gradient-to-b from-mint-400/60 via-white/15 to-white/10 md:hidden"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-8 top-[17px] hidden h-px bg-gradient-to-l from-mint-400/60 via-white/15 to-white/10 md:top-4 md:block"
          />
          {ROADMAP.map((step, i) => {
            const now = step.state === 'now';
            return (
              <li
                key={step.title}
                role="listitem"
                className="relative flex items-center gap-3.5 md:flex-1 md:flex-col md:gap-0 md:text-center"
              >
                <span
                  className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-black tabular-nums transition-shadow ${
                    now
                      ? 'bg-mint-500 text-ink-950 shadow-[0_0_0_5px_rgba(37,197,186,.18),0_8px_20px_-6px_rgba(37,197,186,.5)]'
                      : 'border border-white/20 bg-white/[.06] text-white/60'
                  }`}
                >
                  {now && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 animate-ping rounded-full bg-mint-400/40 [animation-duration:2.4s]"
                    />
                  )}
                  {(i + 1).toLocaleString('fa-IR')}
                </span>
                <div className="min-w-0 md:mt-3">
                  <div
                    className={`text-[13px] font-extrabold md:text-[13.5px] ${
                      now ? 'text-white' : 'text-white/65'
                    }`}
                  >
                    {step.title}
                  </div>
                  <div
                    className={`mt-1 inline-flex items-center gap-1.5 text-[10.5px] font-extrabold ${
                      now ? 'text-mint-300' : 'text-white/45'
                    }`}
                  >
                    {now ? (
                      <>
                        <span
                          aria-hidden="true"
                          className="h-1.5 w-1.5 animate-pulse rounded-full bg-mint-400"
                        />
                        در جریان
                      </>
                    ) : (
                      'به‌زودی'
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </motion.div>
    </>
  );
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  CatalogStage — کاتالوگِ سینمایی وقتی دوره‌ها منتشر شوند                  */
/* ───────────────────────────────────────────────────────────────────────── */

function CatalogStage({
  categories,
  courses,
}: {
  categories: EduCategory[];
  courses: CourseCard[];
}) {
  const [active, setActive] = useState<string>(ALL_SLUG);
  const [page, setPage] = useState(0);

  // ── Derive isNew / isFeatured if they aren't already set on the card ──
  const enrichedCourses = useMemo<CourseCard[]>(() => {
    const avg = avgEnrollments(courses);
    return courses.map((c) => ({
      ...c,
      // 'ویژه' = above-average enrollment (only if not already set)
      isFeatured:
        c.isFeatured ??
        (typeof c.enrollmentsCount === 'number' && c.enrollmentsCount > avg && avg > 0),
      // 'جدید' = either explicitly set OR within 30 days of publish
      isNew: c.isNew ?? false,
    }));
  }, [courses]);

  // ── Tabs: 'همه' first, then categories sorted by course-count DESC ──
  const tabs = useMemo<EduCategory[]>(() => {
    const counted = categories.map((c) => ({
      ...c,
      count: enrichedCourses.filter((x) => x.categorySlug === c.slug).length,
    }));
    counted.sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
    return [{ slug: ALL_SLUG, title: 'همه آموزش‌ها', count: enrichedCourses.length }, ...counted];
  }, [categories, enrichedCourses]);

  // 4 cards per page (one full row on desktop)
  const PAGE_SIZE = 4;
  const filtered = useMemo(
    () => enrichedCourses.filter((c) => active === ALL_SLUG || c.categorySlug === active),
    [enrichedCourses, active],
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visibleCourses = useMemo(
    () => filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [filtered, page],
  );

  // Reset paging whenever the active category changes
  useEffect(() => {
    setPage(0);
  }, [active]);

  const prev = () => setPage((p) => (totalPages <= 1 ? p : (p - 1 + totalPages) % totalPages));
  const next = () => setPage((p) => (totalPages <= 1 ? p : (p + 1) % totalPages));

  /* ریفِ تب‌ها — اسکرول افقی با محوِ لبه */
  const scrollRef = useRef<HTMLDivElement | null>(null);

  return (
    <>
      {/* ── چیپ‌تب‌ها ─────────────────────────────────────────────────── */}
      <div
        className="relative mt-10 md:mt-12"
        style={{
          maskImage:
            'linear-gradient(to left, black 0%, black calc(100% - 2.5rem), transparent 100%)',
        }}
      >
        <div
          ref={scrollRef}
          role="tablist"
          aria-label="دسته‌بندی دوره‌ها"
          className="no-scrollbar flex flex-nowrap gap-2 overflow-x-auto overflow-y-hidden scroll-smooth pb-1 pe-10"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {tabs.map((c) => {
            const isActive = active === c.slug;
            return (
              <button
                key={c.slug}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActive(c.slug)}
                className={`relative inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-[12.5px] font-extrabold transition-all duration-300 md:px-5 md:text-[13.5px] ${
                  isActive
                    ? 'bg-gradient-to-l from-brand-500 to-mint-500 text-white shadow-[0_10px_24px_-10px_rgba(13,128,116,.7)]'
                    : 'bg-white/[.06] text-white/65 ring-1 ring-white/10 hover:bg-white/[.1] hover:text-white'
                }`}
              >
                <span>{c.title}</span>
                {typeof c.count === 'number' && (
                  <span
                    className={`inline-flex h-[20px] min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10.5px] font-extrabold tabular-nums ${
                      isActive ? 'bg-white/25 text-white' : 'bg-white/10 text-white/50'
                    }`}
                  >
                    {c.count.toLocaleString('fa-IR')}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── گریدِ سینماییِ دوره‌ها ─────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${active}-${page}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          /* flex+wrap+justify-center: باقیماندهٔ ردیفِ آخر وسط می‌نشیند؛
             عرضِ کارت‌ها روی خودِ کارت با همان گپ‌ها دقیق می‌شود. */
          className="mt-6 flex flex-wrap justify-center gap-4 md:mt-8 md:gap-5"
        >
          {visibleCourses.map((c, i) => (
            <CourseTile key={c.slug} c={c} delay={i * 0.04} />
          ))}
          {visibleCourses.length === 0 && (
            <div className="w-full rounded-2xl border border-dashed border-white/15 bg-white/[.03] px-6 py-10 text-center">
              <p className="text-[13.5px] font-extrabold text-white/80">
                در این دسته هنوز دوره‌ای نیست
              </p>
              <p className="mt-2 text-[12px] font-medium text-white/50">
                دسته‌ی دیگری را امتحان کن یا «همه آموزش‌ها» را انتخاب کن.
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── پیجرِ شیشه‌ای (فقط وقتی بیشتر از یک صفحه هست) ───────────────── */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3 md:mt-10">
          <PagerButton dir="next" onClick={next} label="صفحهٔ بعدی" />
          <div className="flex items-center gap-1.5 rounded-full bg-white/[.05] px-3 py-2.5 ring-1 ring-white/10">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`صفحه ${(i + 1).toLocaleString('fa-IR')}`}
                aria-current={i === page}
                onClick={() => setPage(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === page
                    ? 'w-6 bg-gradient-to-l from-mint-400 to-brand-500'
                    : 'w-2 bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>
          <PagerButton dir="prev" onClick={prev} label="صفحهٔ قبلی" />
        </div>
      )}
    </>
  );
}

function PagerButton({
  dir,
  onClick,
  label,
}: {
  dir: 'next' | 'prev';
  onClick: () => void;
  label: string;
}) {
  const IconComp = dir === 'next' ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[.06] text-white/70 ring-1 ring-white/10 transition-all duration-200 hover:bg-white/[.12] hover:text-white active:scale-95"
    >
      <IconComp className="h-[18px] w-[18px]" aria-hidden="true" />
    </button>
  );
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  Course tile — کارتِ سینماییِ تیره                                          */
/* ───────────────────────────────────────────────────────────────────────── */

function CourseTile({ c, delay = 0 }: { c: CourseCard; delay?: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay }}
      /* عرض‌ها با گپِ والد دقیق می‌شوند (همان هندسهٔ نسخهٔ قبل):
         ۱ ستونه در موبایل، ۲ ستونه در sm، ۴ ستونه در lg؛ یتیمِ ردیفِ
         آخر با justify-center والد وسط می‌نشیند. */
      className="group w-full min-w-0 sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-3*1.25rem)/4)]"
    >
      <Link
        href={`/lms/courses/${c.slug}`}
        aria-label={c.title}
        className="relative isolate flex h-full flex-col overflow-hidden rounded-[22px] bg-white/[.04] ring-1 ring-white/10 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 hover:bg-white/[.06] hover:shadow-[0_28px_52px_-24px_rgba(13,128,116,.55)] hover:ring-mint-400/40"
      >
        {/* ── کاور ۱۶:۱۰ ── */}
        <div className="relative aspect-[16/10] overflow-hidden">
          <SmartImage
            src={c.coverUrl}
            alt={c.title}
            variant="course"
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/30 to-ink-950/5"
          />
          {/* نشان‌ها */}
          <div className="absolute left-3 right-3 top-3 z-10 flex items-start justify-between gap-2">
            {c.isNew ? <NewBadge /> : <span />}
            {c.isFeatured && <FeaturedBadge />}
          </div>
          {/* تیتر روی اسکریم */}
          <div className="absolute inset-x-0 bottom-0 z-10 p-3.5 md:p-4">
            {c.categoryTitle && (
              <div className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-black/35 px-2 py-0.5 text-[9.5px] font-extrabold text-mint-200 ring-1 ring-white/15 backdrop-blur-sm">
                {c.categoryTitle}
              </div>
            )}
            <h3 className="line-clamp-2 text-[14.5px] font-extrabold leading-6 text-white drop-shadow-[0_2px_6px_rgba(0,0,0,.6)] md:text-[15px]">
              {c.title}
            </h3>
          </div>
          {/* دکمهٔ پخشِ شیشه‌ایِ وسط روی هاور */}
          <div
            aria-hidden="true"
            className="absolute inset-0 z-[5] flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          >
            <span className="flex h-14 w-14 scale-90 items-center justify-center rounded-full bg-white/95 text-brand-600 shadow-[0_12px_28px_-8px_rgba(0,0,0,.55)] transition-transform duration-300 group-hover:scale-100">
              <Icon name="play" className="h-5 w-5" />
            </span>
          </div>
        </div>

        {/* ── بدنه ── */}
        <div className="flex flex-1 flex-col gap-3 p-3.5 md:p-4">
          {(c.shortDescription || c.subtitle) && (
            <p className="line-clamp-2 min-h-[2.5rem] text-[11.5px] font-medium leading-6 text-white/55">
              {c.shortDescription ?? c.subtitle}
            </p>
          )}

          {/* چیپ‌های متا */}
          <div className="flex flex-wrap items-center gap-1.5">
            {c.level && LEVEL_LABEL[c.level] && (
              <span className="inline-flex h-[25px] items-center gap-1 rounded-full bg-brand-500/15 px-2 text-[10.5px] font-extrabold text-mint-200 ring-1 ring-brand-400/25">
                <Icon name="graduation" className="h-3 w-3" />
                {LEVEL_LABEL[c.level]}
              </span>
            )}
            {c.durationSeconds ? (
              <span className="inline-flex h-[25px] items-center gap-1 rounded-full bg-white/[.06] px-2 text-[10.5px] font-bold text-white/70 ring-1 ring-white/10">
                <Icon name="clock" className="h-3 w-3" />
                {formatDurationShort(c.durationSeconds)}
              </span>
            ) : null}
            {c.lessonsCount ? (
              <span className="inline-flex h-[25px] items-center gap-1 rounded-full bg-white/[.06] px-2 text-[10.5px] font-bold text-white/70 ring-1 ring-white/10">
                <Icon name="play" className="h-3 w-3" />
                {c.lessonsCount.toLocaleString('fa-IR')} جلسه
              </span>
            ) : null}
          </div>

          {/* پانوشت: مدرس + شمارنده‌ها + مشاهده */}
          <div className="mt-auto flex items-center justify-between gap-2 border-t border-white/10 pt-3">
            <div className="flex min-w-0 items-center gap-2">
              {c.instructor && (
                <>
                  <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full ring-2 ring-white/10">
                    <SmartImage
                      src={c.instructorAvatarUrl}
                      alt={c.instructor}
                      variant="avatar"
                      quietSkeleton
                      fill
                      sizes="28px"
                      className="object-cover"
                    />
                  </span>
                  <span className="min-w-0 truncate text-[11px] font-bold text-white/65">
                    {c.instructor}
                  </span>
                </>
              )}
              <span className="ms-auto flex items-center gap-2.5">
                {typeof c.enrollmentsCount === 'number' && c.enrollmentsCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10.5px] font-bold tabular-nums text-white/50">
                    <Users className="h-3 w-3" aria-hidden="true" />
                    {c.enrollmentsCount.toLocaleString('fa-IR')}
                  </span>
                )}
                {typeof c.graduatesCount === 'number' && c.graduatesCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10.5px] font-extrabold tabular-nums text-mint-300">
                    <Star className="h-3 w-3" aria-hidden="true" />
                    {c.graduatesCount.toLocaleString('fa-IR')}
                  </span>
                )}
              </span>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 text-[11.5px] font-extrabold text-mint-300 transition-all duration-200 group-hover:gap-2 group-hover:text-mint-200">
              <span>مشاهده</span>
              <Icon name="arrow-left" className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  Badges                                                                   */
/* ───────────────────────────────────────────────────────────────────────── */

function NewBadge() {
  return (
    <span className="inline-flex h-7 items-center gap-1 rounded-full bg-mint-500 px-2.5 text-[10.5px] font-extrabold text-ink-950 shadow-[0_4px_12px_-4px_rgba(37,197,186,.6)] backdrop-blur-sm">
      <Icon name="sparkles" className="h-3 w-3" />
      جدید
    </span>
  );
}

function FeaturedBadge() {
  return (
    <span className="inline-flex h-7 items-center gap-1 rounded-full bg-amber-400 px-2.5 text-[10.5px] font-extrabold text-ink-950 shadow-[0_4px_12px_-4px_rgba(240,148,26,.6)] backdrop-blur-sm">
      <Icon name="sparkles" className="h-3 w-3" />
      ویژه
    </span>
  );
}
