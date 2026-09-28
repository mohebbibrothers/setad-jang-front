'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { FilterX, Flag, Sparkles, SlidersHorizontal } from 'lucide-react';
import { LMS_LEVELS, LMS_LEVEL_LABEL, lmsHref, type LmsHubQuery } from '@/lib/lms-shared';
import { LmsRail, type LmsRailTab } from './LmsRail';
import { LmsSearchBox } from './LmsSearchBox';

/**
 * دکِ فرمانِ هاب — بازطراحی‌شده به‌جای دو باکسِ جست‌وجوی پراکنده.
 *
 *  • یک جست‌وجوی واحدِ بلند (تک‌نمونه در کلِ صفحه)؛
 *  • یک ریلِ دسته‌ها (لینکی، با فلشِ لبه و شمارِ صادقانه)؛
 *  • یک ردیفِ فیلتر: سگمنتِ سطح + چیپِ طلاییِ «ویژه» (فیلترِ
 *    اختصاصیِ featured که به is_featured در backend ترجمه می‌شود)
 *    + پاک‌سازی؛
 *  • خطِ وضعیتِ زنده برای خواناییِ ترکیبِ فعال.
 *
 * هر کنترل = یک URLِ سالمِ سروری؛ گرید زیرش کاملاً سرور-رندر می‌ماند
 * و Back/Forward مرورگر رایگان کار می‌کند.
 */
export function LmsToolsBar({
  query,
  categories,
  countByCategory,
  totalCount,
}: {
  query: LmsHubQuery;
  categories: Array<{ slug: string; title: string }>;
  countByCategory: Record<string, number>;
  totalCount: number;
}) {
  const preserveQuery = useMemo(() => {
    const p = new URLSearchParams();
    if (query.category) p.set('category', query.category);
    if (query.level) p.set('level', query.level);
    if (query.featured) p.set('featured', '1');
    return p.toString();
  }, [query.category, query.level, query.featured]);

  const railTabs: LmsRailTab[] = useMemo(
    () => [
      {
        slug: '__all__',
        title: 'همه',
        count: totalCount,
        href: lmsHref({ category: undefined, page: 1 }, query),
        active: !query.category,
      },
      ...categories.map((c) => ({
        slug: c.slug,
        title: c.title,
        count: countByCategory[c.slug] ?? 0,
        href: lmsHref({ category: c.slug, page: 1 }, query),
        active: query.category === c.slug,
      })),
    ],
    [categories, countByCategory, totalCount, query],
  );

  const activeFilters = Boolean(query.category || query.level || query.q || query.featured);

  /* خطِ وضعیت — خواندنی و صادقانه؛ برای اسکرین‌ریدر status است. */
  const statusParts: string[] = [];
  if (query.q) statusParts.push(`جست‌وجو برای «${query.q}»`);
  if (query.featured) statusParts.push('فقط دوره‌های ویژه');

  return (
    <div className="mb-8 space-y-4">
      {/* ریلِ دسته‌ها (لینکی) */}
      {categories.length > 0 && <LmsRail tabs={railTabs} />}

      {/* دکِ فرمان: جست‌وجو + فیلترها در یک قاب واحد */}
      <div
        role="group"
        aria-label="جست‌وجو و فیلتر آموزش‌ها"
        className="mx-auto w-full max-w-3xl rounded-2xl border border-ink-100 bg-white p-3 shadow-[0_14px_36px_-24px_rgba(11,53,48,.35)] ring-1 ring-ink-50 sm:p-4"
      >
        <LmsSearchBox
          initial={query.q ?? ''}
          preserveQuery={preserveQuery}
          placeholder="نام کلاس، مدرس یا موضوع…"
        />

        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-2 border-t border-dashed border-ink-100 pt-3">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-ink-400">
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
            فیلترها:
          </span>

          {/* سگمنتِ سطح */}
          <div
            className="inline-flex items-center gap-0.5 rounded-full bg-ink-50 p-1 ring-1 ring-ink-100"
            role="group"
            aria-label="فیلتر سطح"
          >
            <Flag className="mx-1.5 h-3.5 w-3.5 text-ink-400" aria-hidden="true" />
            <LevelChip
              href={lmsHref({ level: null, page: 1 }, query)}
              active={!query.level}
              label="همه سطح‌ها"
            />
            {LMS_LEVELS.map((lv) => (
              <LevelChip
                key={lv}
                href={lmsHref({ level: lv, page: 1 }, query)}
                active={query.level === lv}
                label={LMS_LEVEL_LABEL[lv]}
              />
            ))}
          </div>

          {/* چیپِ طلاییِ «ویژه» — فیلترِ اختصاصی، تاَگل */}
          <Link
            href={lmsHref({ featured: query.featured ? undefined : true, page: 1 }, query)}
            prefetch={false}
            scroll={false}
            aria-pressed={Boolean(query.featured)}
            className={`inline-flex h-9 select-none items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[11.5px] font-extrabold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 active:scale-[.97] ${
              query.featured
                ? 'bg-gradient-to-l from-gold-400 to-gold-500 text-white shadow-[0_10px_22px_-10px_rgba(240,148,26,.8)] ring-1 ring-gold-300'
                : 'bg-gold-50 text-gold-700 ring-1 ring-gold-200 hover:bg-gold-100 hover:text-gold-800'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            فقط ویژه‌ها
          </Link>

          {activeFilters && (
            <Link
              href="/lms"
              prefetch={false}
              scroll={false}
              className="inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[12px] font-extrabold text-ink-500 transition-colors hover:bg-ink-50 hover:text-ink-800"
            >
              <FilterX className="h-3.5 w-3.5" aria-hidden="true" />
              پاک‌سازی فیلترها
            </Link>
          )}
        </div>
      </div>

      {/* خلاصه‌ی فیلترِ فعال — دسترس‌پذیری + شفافیت */}
      {statusParts.length > 0 && (
        <p className="text-center text-[12px] font-bold text-ink-500" role="status">
          نتایجِ {statusParts.join(' — ')}
        </p>
      )}
    </div>
  );
}

function LevelChip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      prefetch={false}
      scroll={false}
      aria-current={active ? 'page' : undefined}
      className={`inline-flex h-8 shrink-0 select-none items-center whitespace-nowrap rounded-full px-3 text-[11.5px] font-extrabold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-50 active:scale-[.97] ${
        active
          ? 'bg-white text-brand-700 shadow-[0_2px_10px_-3px_rgba(13,128,116,.35)] ring-1 ring-brand-200'
          : 'text-ink-600 hover:text-ink-900'
      }`}
    >
      {label}
    </Link>
  );
}
