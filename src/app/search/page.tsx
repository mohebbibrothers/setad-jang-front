import type { Metadata } from 'next';
import { Suspense } from 'react';
import type { SmartImageVariant } from '@/components/ui/SmartImage';
import {
  searchAll,
  SEARCH_PAGE_GROUP_LIMIT,
  SEARCH_SOURCES,
  SEARCH_SOURCE_ORDER,
  type SearchSource,
} from '@/lib/global-search';
import { GlobalSearch } from '@/components/home/GlobalSearch';
import { SearchGroupSection } from '@/components/search/SearchGroupSection';

/**
 * Full-page search results — server-rendered against the same omni-search
 * pipeline used by the homepage hero bar. Lets users land here from
 * `Enter` in the search pill (or from `/search?q=&source=`) and browse
 * every matching hit grouped by source. هر گروه یک برشِ اولیه‌ی سرور-رندر
 * دارد و دکمه‌ی «نمایش بیشتر» بقیه‌ی نتایج را همان‌جا در کلاینت می‌آورد.
 */
export const dynamic = 'force-dynamic';

/** Map every omni-search source key to the matching SmartImage variant
 *  so a missing thumbnail always falls back to a branded placeholder
 *  in the correct palette (r4j → criminal, lms → course, etc.). */
const SOURCE_TO_VARIANT: Record<SearchSource, SmartImageVariant> = {
  madadkar: 'campaign',
  r4j: 'criminal',
  lms: 'course',
  kindness: 'kindness',
  tabyin: 'tabyin',
};

type SP = { q?: string; source?: string };

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SP>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const q = (sp?.q ?? '').trim();
  return {
    title: q ? `جست‌وجو: ${q}` : 'جست‌وجو در سامانه',
    description: q
      ? `نتایج جست‌وجو برای «${q}» در بعثت مردم — حرکت‌های مالی جنگ، پرونده‌های عدالت، دوره‌ها، آگهی‌های مهربانی، تبیین و دانش.`
      : 'جست‌وجوی سراسری در همه‌ی بخش‌های سامانه بعثت مردم.',
    robots: q ? { index: false, follow: true } : undefined,
  };
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const q = (sp?.q ?? '').trim();
  const sourceParam = (sp?.source ?? '') as SearchSource | '';
  const sources =
    sourceParam && (SEARCH_SOURCE_ORDER as string[]).includes(sourceParam)
      ? [sourceParam as SearchSource]
      : undefined;

  const data =
    q.length >= 2
      ? await searchAll(q, { sources, perSourceLimit: SEARCH_PAGE_GROUP_LIMIT })
      : { q, groups: [], total: 0, errored: [] as SearchSource[] };

  return (
    <section className="bg-white">
      {/* Inline (non-overlapping) variant of the search bar at the top */}
      <div className="container-edge pb-4 pt-8">
        <Suspense>
          <GlobalSearch variant="inline" initialQuery={q} />
        </Suspense>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-[18px] font-extrabold text-ink-900 md:text-[22px]">
            {q ? (
              <>
                نتایج جست‌وجو برای «<span className="text-brand-700">{q}</span>»
              </>
            ) : (
              'برای شروع، عبارتی را در نوار جست‌وجو وارد کنید'
            )}
          </h1>
          {q && (
            <span className="text-[12.5px] font-bold tabular-nums text-ink-500">
              {data.total.toLocaleString('fa-IR')} نتیجه
            </span>
          )}
        </div>
      </div>

      <div className="container-edge pb-16">
        {q.length < 2 ? (
          <EmptyHint />
        ) : data.total === 0 ? (
          <NoResults q={q} />
        ) : (
          <div className="space-y-10">
            {data.groups.map((g) => {
              const meta = SEARCH_SOURCES[g.source];
              return (
                <SearchGroupSection
                  key={g.source}
                  source={g.source}
                  q={data.q}
                  initialHits={g.hits}
                  count={g.count}
                  pageSize={SEARCH_PAGE_GROUP_LIMIT}
                  label={meta.label}
                  shortLabel={meta.shortLabel}
                  seeAllHref={meta.seeAllHref(q)}
                  variant={SOURCE_TO_VARIANT[g.source] ?? 'image'}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function EmptyHint() {
  return (
    <div className="py-16 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600">
        <svg
          viewBox="0 0 24 24"
          width="28"
          height="28"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </div>
      <p className="text-[15px] font-extrabold text-ink-900">
        نوار جست‌وجو در بالای صفحه آماده است
      </p>
      <p className="mx-auto mt-2 max-w-md text-[12.5px] leading-7 text-ink-500">
        می‌توانید عبارت موردنظر خود را تایپ کنید تا نتایج زنده از همه‌ی بخش‌های سامانه نمایش داده
        شود.
      </p>
    </div>
  );
}

function NoResults({ q }: { q: string }) {
  return (
    <div className="py-16 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-50 to-rose-100 text-rose-600">
        <svg
          viewBox="0 0 24 24"
          width="28"
          height="28"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      </div>
      <p className="text-[15px] font-extrabold text-ink-900">نتیجه‌ای برای «{q}» پیدا نشد</p>
      <p className="mx-auto mt-2 max-w-md text-[12.5px] leading-7 text-ink-500">
        لطفاً عبارت را کوتاه‌تر، متفاوت‌تر یا با املای دیگری بنویسید، یا فیلتر منبع را تغییر دهید.
      </p>
    </div>
  );
}
