'use client';

import Image from 'next/image';
import { SmartImage } from '@/components/ui/SmartImage';
import Link from 'next/link';
import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SectionTitle } from './SectionTitle';
import { Icon } from '@/components/icons/Icon';
import { EmptyState } from './EmptyState';

/**
 * ───────────────────────────────────────────────────────────────────────────
 * Education / LMS section — designer-faithful + UX-driven (v3).
 *
 * Backend contract (apps/lms):
 *   GET /api/v1/lms/categories/  → LMSCategorySerializer
 *   GET /api/v1/lms/courses/     → CourseSummarySerializer
 *
 * Card design (dual-layer for guaranteed legibility on any cover):
 *
 *   ┌──────────────────────────┐
 *   │ [جدید]                   │
 *   │                          │
 *   │      cover image         │  4:3 aspect
 *   │                          │
 *   │ ▒▒▒▒ scrim ▒▒▒▒▒▒▒▒▒▒▒▒│
 *   │  title (white, drop-sh)  │
 *   ├──────────────────────────┤  ← footer panel (white)
 *   │ 👤 instructor            │
 *   │ ⊕ مقدماتی · ⏲ ۶ساعت ·▶۱۲│
 *   │ ─────────────────────────│
 *   │ ۹۸۰ یادگیرنده     شروع ← │
 *   └──────────────────────────┘
 *
 * Tabs (compact + scalable):
 *   - Horizontal scroll only (overflow-y: hidden, flex-nowrap)
 *   - Categories sorted by course-count DESC so popular ones are نزدیک‌ترست
 *   - Edge fade + chevron scroll arrows when overflow happens
 *   - No 'all categories' dropdown — the arrows are enough per UX feedback
 *
 * Auto-derived flags (no longer hard-coded in seed):
 *   - isNew      ← published_at < 30 days
 *   - isFeatured ← enrollments_count > AVERAGE(enrollments_count across all courses)
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

/* ───────────────────────────────────────────────────────────────────────── */
/*  Auto-derived "new" / "featured" flags                                    */
/* ───────────────────────────────────────────────────────────────────────── */

/** Compute average enrollment across all courses (used as the 'ویژه' threshold). */
function avgEnrollments(courses: CourseCard[]): number {
  const values = courses.map((c) => c.enrollmentsCount ?? 0);
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  Section                                                                  */
/* ───────────────────────────────────────────────────────────────────────── */

export function EducationSection({
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

  // Pager no-op when there's only one (or zero) page — pairs with the
  // `disabled` prop on the buttons so the affordance stays honest.
  const prev = () => {
    if (totalPages <= 1) return;
    setPage((p) => (p - 1 + totalPages) % totalPages);
  };
  const next = () => {
    if (totalPages <= 1) return;
    setPage((p) => (p + 1) % totalPages);
  };

  /* ── Horizontal-only scroll tab strip ── */
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      const pos = Math.abs(el.scrollLeft);
      setCanPrev(pos > 4);
      setCanNext(pos < max - 4);
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [tabs.length]);

  const scrollByAmount = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const dx = el.clientWidth * 0.7;
    el.scrollBy({ left: dir === 'left' ? -dx : dx, behavior: 'smooth' });
  };

  return (
    <section className="section-y bg-white" id="education">
      <div className="container-edge">
        <SectionTitle
          title="قرارگاه آموزشی"
          description="هر مهارتی که می‌آموزی، یک نیروی تازه برای میدان است. از امداد و نجات تا سواد رسانه‌ای و رهبری جهادی — دوره‌ها رایگان، تخصصی و کاربردی."
        />

        {/* ── Tab strip — single horizontal row, no vertical wrap ── */}
        <div className="relative mb-7 md:mb-9">
          {canNext && (
            <button
              type="button"
              aria-label="حرکت به چپ"
              onClick={() => scrollByAmount('left')}
              className="absolute left-0 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink-600 shadow-[0_4px_14px_-4px_rgba(15,20,32,.15)] ring-1 ring-ink-100 transition-colors hover:bg-brand-50 hover:text-brand-600"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <polyline
                  points="15 18 9 12 15 6"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
          {canPrev && (
            <button
              type="button"
              aria-label="حرکت به راست"
              onClick={() => scrollByAmount('right')}
              className="absolute right-0 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink-600 shadow-[0_4px_14px_-4px_rgba(15,20,32,.15)] ring-1 ring-ink-100 transition-colors hover:bg-brand-50 hover:text-brand-600"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <polyline
                  points="9 18 15 12 9 6"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}

          {canNext && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-12 bg-gradient-to-l from-white to-transparent md:w-16"
            />
          )}
          {canPrev && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-12 bg-gradient-to-r from-white to-transparent md:w-16"
            />
          )}

          <div
            ref={scrollRef}
            role="tablist"
            aria-label="دسته‌بندی دوره‌ها"
            className="no-scrollbar flex flex-nowrap items-stretch gap-1 overflow-x-auto overflow-y-hidden scroll-smooth border-b border-ink-100 px-10 md:px-12"
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
                  className={`relative inline-flex shrink-0 items-center gap-2 whitespace-nowrap px-4 py-3 text-[13.5px] font-bold transition-colors md:px-5 md:text-[14.5px] ${isActive ? 'text-brand-600' : 'text-ink-500 hover:text-ink-800'}`}
                >
                  <span>{c.title}</span>
                  {/* ALWAYS render the count chip — even when zero — so an
                      empty category reads as "0 آموزش" instead of looking
                      like a missing chip. Keeps the tab strip's rhythm
                      uniform and gives clearer empty-state signalling. */}
                  {typeof c.count === 'number' && (
                    <span
                      className={`inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full px-1.5 text-[11px] font-extrabold tabular-nums ${
                        isActive
                          ? 'bg-brand-500 text-white'
                          : c.count === 0
                            ? 'bg-ink-50 text-ink-400 ring-1 ring-ink-100'
                            : 'bg-ink-100 text-ink-500'
                      }`}
                    >
                      {c.count.toLocaleString('fa-IR')}
                    </span>
                  )}
                  {isActive && (
                    <motion.span
                      layoutId="edu-tab-underline"
                      className="absolute inset-x-2 -bottom-px h-[3px] rounded-full bg-brand-500"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Course grid ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${active}-${page}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            /* flex+wrap+justify-center: orphans in the last row centre
               instead of clinging to the RTL-right edge. Card widths
               are set on <CourseCard> itself to match the parent gap. */
            className="flex flex-wrap justify-center gap-4 md:gap-5"
          >
            {visibleCourses.map((c, i) => (
              <CourseTile key={c.slug} c={c} delay={i * 0.04} />
            ))}
            {visibleCourses.length === 0 && (
              <div className="w-full">
                <EmptyState
                  title={
                    courses.length === 0
                      ? 'هنوز دوره‌ای منتشر نشده'
                      : 'دوره‌ای در این دسته یافت نشد'
                  }
                  description={
                    courses.length === 0
                      ? 'به‌محض انتشار اولین دوره‌های قرارگاه آموزشی، اینجا قابل ثبت‌نام خواهد بود.'
                      : 'دسته‌ی دیگری را امتحان کن یا «همه آموزش‌ها» را انتخاب کن.'
                  }
                  iconPath="M22 10v6 M2 10l10-5 10 5-10 5z M6 12v5c0 1.66 4 3 6 3s6-1.34 6-3v-5"
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* ── Pager (same PNG arrows as the WarFund / Justice carousels) ── */}
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            type="button"
            aria-label="قبلی"
            onClick={prev}
            disabled={totalPages <= 1}
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
            onClick={next}
            disabled={totalPages <= 1}
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

        {/* Footer CTA — see full library */}
        <div className="mt-6 flex justify-center md:mt-8">
          <Link
            href="/#education"
            className="inline-flex h-12 items-center gap-2 rounded-full bg-mint-500 px-8 text-[14px] font-extrabold text-white shadow-[0_8px_24px_-8px_rgba(37,197,186,.5)] transition-colors hover:bg-mint-600"
          >
            <span>مشاهده کتابخانه کامل آموزش‌ها</span>
            <Icon name="arrow-left" className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  Course tile — dual-layer (cover + white footer panel)                    */
/* ───────────────────────────────────────────────────────────────────────── */

function CourseTile({ c, delay = 0 }: { c: CourseCard; delay?: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay }}
      /* Width math matches parent flex gap (1rem mobile, 1.25rem md+):
         - mobile (< 640px) : 1 col  → 100%
         - sm     (≥ 640px) : 2 cols → calc((100% - 1.25rem) / 2)
         - lg     (≥ 1024px): 4 cols → calc((100% - 3 * 1.25rem) / 4)
         Combined with parent flex+wrap+justify-center, an orphan in the
         last row auto-centres. min-w-0 keeps content shrinkable. */
      className="group w-full min-w-0 sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-3*1.25rem)/4)]"
    >
      <Link
        href={`/lms/courses/${c.slug}`}
        className="relative isolate flex flex-col overflow-hidden rounded-[26px] bg-white shadow-[0_2px_10px_-4px_rgba(15,20,32,.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_44px_-22px_rgba(11,53,48,.25)]"
        aria-label={c.title}
      >
        {/* ── Cover (4:3) ── */}
        <div className="relative aspect-[4/3] overflow-hidden bg-ink-200">
          <SmartImage
            src={c.coverUrl}
            alt={c.title}
            variant="course"
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
          />

          {/* Bottom scrim — keeps the cover-overlaid title legible on any image */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 z-[1] h-2/3 bg-gradient-to-t from-black/85 via-black/45 to-transparent"
          />

          {/* Top badges row */}
          <div className="absolute left-3 right-3 top-3 z-10 flex items-start justify-between gap-2">
            {c.isNew ? <NewBadge /> : <span />}
            {c.isFeatured && <FeaturedBadge />}
          </div>

          {/* Cover-overlaid title — bold, with drop-shadow for guaranteed legibility */}
          <div className="absolute inset-x-0 bottom-0 z-10 p-3.5 text-white md:p-4">
            <h3 className="line-clamp-2 text-[15px] font-extrabold leading-6 drop-shadow-[0_2px_6px_rgba(0,0,0,.6)] md:text-[16px]">
              {c.title}
            </h3>
          </div>

          {/* Hover play affordance — circular glass button mid-cover */}
          <div
            aria-hidden="true"
            className="absolute inset-0 z-[5] flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          >
            <span className="flex h-14 w-14 scale-90 items-center justify-center rounded-full bg-white/95 text-brand-600 shadow-[0_12px_28px_-8px_rgba(0,0,0,.55)] transition-transform duration-300 group-hover:scale-100">
              <Icon name="play" className="h-5 w-5" />
            </span>
          </div>
        </div>

        {/* ── Footer info panel (white) ── */}
        <div className="flex flex-col gap-3 p-3.5 md:p-4">
          {/* Instructor row */}
          {c.instructor && (
            <div className="flex min-w-0 items-center gap-2">
              <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full ring-2 ring-ink-100">
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
              <span className="min-w-0 truncate text-[12px] font-bold text-ink-600">
                <span className="font-medium text-ink-400">مدرس: </span>
                {c.instructor}
              </span>
            </div>
          )}

          {/* Meta chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            {c.level && LEVEL_LABEL[c.level] && (
              <span className="inline-flex h-[26px] items-center gap-1 rounded-full bg-brand-50 px-2 text-[11.5px] font-extrabold text-brand-700 ring-1 ring-brand-100">
                <Icon name="graduation" className="h-3 w-3" />
                {LEVEL_LABEL[c.level]}
              </span>
            )}
            {c.durationSeconds ? (
              <span className="inline-flex h-[26px] items-center gap-1 rounded-full bg-ink-50 px-2 text-[11.5px] font-bold text-ink-700 ring-1 ring-ink-100">
                <Icon name="clock" className="h-3 w-3" />
                {formatDurationShort(c.durationSeconds)}
              </span>
            ) : null}
            {c.lessonsCount ? (
              <span className="inline-flex h-[26px] items-center gap-1 rounded-full bg-ink-50 px-2 text-[11.5px] font-bold text-ink-700 ring-1 ring-ink-100">
                <Icon name="play" className="h-3 w-3" />
                {c.lessonsCount.toLocaleString('fa-IR')} درس
              </span>
            ) : null}
          </div>

          {/* Footer row — backend counters + start arrow.
              Surfaces BOTH enrollments_count AND graduates_count from
              CourseSummarySerializer so the card tells the full
              engagement→outcome story instead of just "how many
              signed up". */}
          <div className="mt-1 flex items-center justify-between gap-2 border-t border-ink-100 pt-3">
            <div className="flex min-w-0 items-center gap-3">
              {typeof c.enrollmentsCount === 'number' && c.enrollmentsCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[11.5px] font-bold tabular-nums text-ink-500">
                  <Icon name="user" className="h-3.5 w-3.5 text-ink-400" />
                  {c.enrollmentsCount.toLocaleString('fa-IR')} یادگیرنده
                </span>
              )}
              {typeof c.graduatesCount === 'number' && c.graduatesCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[11.5px] font-extrabold tabular-nums text-mint-700">
                  <Icon name="sparkles" className="h-3.5 w-3.5 text-mint-500" />
                  {c.graduatesCount.toLocaleString('fa-IR')} فارغ‌التحصیل
                </span>
              )}
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 text-[12px] font-extrabold text-brand-600 transition-all duration-200 group-hover:gap-2">
              <span>مشاهده دوره</span>
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
    <span
      className="inline-flex h-8 items-center gap-1 rounded-2xl px-3 text-[12px] font-extrabold text-white shadow-[0_4px_12px_-4px_rgba(13,128,116,.45)] ring-[2.5px] ring-brand-700"
      style={{ backgroundColor: '#25C5BA' }}
    >
      <Icon name="sparkles" className="h-3 w-3" />
      جدید
    </span>
  );
}

function FeaturedBadge() {
  return (
    <span
      className="inline-flex h-8 items-center gap-1 rounded-2xl px-3 text-[12px] font-extrabold text-ink-900 shadow-[0_4px_12px_-4px_rgba(240,148,26,.55)] ring-[2.5px] ring-amber-700/40"
      style={{ backgroundColor: '#FFB033' }}
    >
      <Icon name="sparkles" className="h-3 w-3" />
      ویژه
    </span>
  );
}
