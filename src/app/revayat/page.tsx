import type { Metadata } from 'next';
import { Newspaper, Sparkles } from 'lucide-react';
import { safeApiFetch, type Paginated } from '@/lib/api';
import { formatPersianNumber } from '@/lib/utils';
import { buildFeedQuery, feedFiltersFromSearchParams, type RevayatItem } from '@/lib/revayat';
import { RevayatFeed } from '@/components/revayat/RevayatFeed';

/**
 * ═══════════════════════════════════════════════════════════════════
 * /revayat — صفحه‌ی «روایت‌ها» (فیدِ زنده‌ی جهاد تبیین)
 *
 * سرور: فیلترها را از URL می‌خواند، صفحه‌ی یک را با ISR واکشی می‌کند
 * و فیدِ کلاینت را با همان داده hydration می‌کند — بنابراین نه
 * واکشیِ دوبلای کلاینت داریم نه LCP دیرهنگام. هرچه بعد از آن، در
 * RevayatFeed (اسکرولِ بی‌پایان + جست‌وجوی زنده) رخ می‌دهد.
 * ═══════════════════════════════════════════════════════════════════
 */

export const metadata: Metadata = {
  title: 'روایت‌ها | بعثت مردم',
  description:
    'فیدِ زنده‌ی روایت‌های جهاد تبیین — فیلم، عکس، پادکست و نوشته از رسانه‌ی مردم؛ اسکرولِ بی‌پایان و جست‌وجوی حرفه‌ای بر اساس کپشن، نویسنده و شهر.',
  openGraph: {
    title: 'روایت‌ها | بعثت مردم',
    description: 'روایتِ لحظه‌به‌لحظه‌ی مردم — فیلم، عکس، پادکست و نوشته.',
    type: 'website',
  },
};

export const revalidate = 120;

export default async function RevayatPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filters = feedFiltersFromSearchParams(sp);
  const data = await safeApiFetch<Paginated<RevayatItem>>(
    `/tabyin/contents/?${buildFeedQuery(filters, 1)}`,
    { revalidate: 120, tags: ['tabyin'] },
  );
  const items = data?.results ?? [];
  const count = data?.count ?? items.length;

  return (
    <main className="min-h-screen bg-white">
      {/* ── نوارِ قهرمانِ جمع‌وجور ── */}
      <section className="relative overflow-hidden border-b border-ink-100 bg-gradient-to-l from-brand-50/80 via-white to-mint-50/50">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-28 h-64 w-64 rounded-full bg-brand-200/40 blur-3xl"
        />
        <span
          aria-hidden="true"
          className="bg-mint-200/40 pointer-events-none absolute -bottom-32 -left-16 h-56 w-56 rounded-full blur-3xl"
        />
        <div className="container-edge relative mx-auto max-w-xl px-4 py-8 text-center md:py-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3.5 py-1.5 text-[11.5px] font-extrabold text-brand-700 shadow-sm ring-1 ring-inset ring-brand-600/15 backdrop-blur">
            <Newspaper className="h-3.5 w-3.5" />
            جهاد تبیین
          </span>
          <h1 className="mt-3 text-[26px] font-black text-ink-900 md:text-[32px]">روایت‌ها</h1>
          <p className="mx-auto mt-2.5 max-w-md text-[13px] font-semibold leading-7 text-ink-600">
            روایتِ لحظه‌به‌لحظه‌ی مردم — فیلم، عکس، پادکست و نوشته. اسکرول کن؛ هرچه پایین‌تر بیایی،
            روایت‌های بیشتری می‌بینی.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-3 py-1.5 text-[11.5px] font-extrabold tabular-nums text-white">
              <Sparkles className="h-3 w-3 text-mint-400" />
              {formatPersianNumber(count)} روایت
            </span>
            <span className="rounded-full bg-white/70 px-3 py-1.5 text-[11.5px] font-bold text-ink-500 ring-1 ring-inset ring-ink-100">
              به‌روز و زنده
            </span>
          </div>
        </div>
      </section>

      {/* ── فید (کلاینت): سرچ‌بارِ چسبان + اسکرولِ بی‌پایان ── */}
      <RevayatFeed
        initialItems={items}
        initialCount={count}
        initialHasNext={Boolean(data?.next)}
        initialFilters={filters}
      />
    </main>
  );
}
