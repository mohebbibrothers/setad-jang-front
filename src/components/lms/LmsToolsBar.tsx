'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { FilterX, Flag } from 'lucide-react';
import { LMS_LEVELS, LMS_LEVEL_LABEL, lmsHref, type LmsHubQuery } from '@/lib/lms-shared';
import { LmsRail, type LmsRailTab } from './LmsRail';
import { LmsSearchBox } from './LmsSearchBox';

/**
 * نوار ابزارِ هاب — کلاینت، ولی نتیجه‌ی هر کنترل = یک URL سالم روی
 * سرور: فیلترها قابل‌اشتراک‌اند، Back/Forward مرورگر کار می‌کند و گرید
 * زیرش کاملاً سرور-رندر می‌ماند.
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
    return p.toString();
  }, [query.category, query.level]);

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

  const activeFilters = Boolean(query.category || query.level || query.q);

  return (
    <div className="mb-8 space-y-4">
      {/* ریلِ دسته‌ها (لینکی) */}
      {categories.length > 0 && <LmsRail tabs={railTabs} />}

      {/* سرچ + سطح + پاک‌سازی */}
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
        <div className="w-full sm:max-w-md sm:flex-1">
          <LmsSearchBox
            variant="toolbar"
            initial={query.q ?? ''}
            preserveQuery={preserveQuery}
            placeholder="جست‌وجو در عنوان، مدرس یا موضوع…"
          />
        </div>

        <div
          className="inline-flex items-center gap-1 self-center rounded-full bg-ink-50 p-1 ring-1 ring-ink-100"
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

        {activeFilters && (
          <Link
            href="/lms"
            prefetch={false}
            className="inline-flex h-11 items-center justify-center gap-1.5 self-center whitespace-nowrap rounded-full px-4 text-[12px] font-extrabold text-ink-500 transition-colors hover:bg-ink-50 hover:text-ink-800"
          >
            <FilterX className="h-3.5 w-3.5" aria-hidden="true" />
            پاک‌سازی فیلترها
          </Link>
        )}
      </div>

      {/* خلاصه‌ی فیلترِ فعال — دسترس‌پذیری + شفافیت */}
      {query.q && (
        <p className="text-center text-[12px] font-bold text-ink-500" role="status">
          نتایجِ جست‌وجو برای «{query.q}»
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
      aria-current={active ? 'page' : undefined}
      className={`inline-flex h-9 shrink-0 select-none items-center whitespace-nowrap rounded-full px-3 text-[11.5px] font-extrabold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-50 active:scale-[.97] ${
        active
          ? 'bg-white text-brand-700 shadow-[0_2px_10px_-3px_rgba(13,128,116,.35)] ring-1 ring-brand-200'
          : 'text-ink-600 hover:text-ink-900'
      }`}
    >
      {label}
    </Link>
  );
}
