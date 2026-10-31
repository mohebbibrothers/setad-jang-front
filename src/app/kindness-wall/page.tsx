import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import {
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flame,
  HeartHandshake,
  Layers,
  LayoutGrid,
  MapPin,
  Package,
  PhoneCall,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Timer,
  X,
} from 'lucide-react';
import {
  KINDNESS_BOARD_PATH as BOARD,
  KINDNESS_SORT_OPTIONS,
  fetchKindnessCategories,
  fetchKindnessListingsPage,
  fetchKindnessStats,
  fetchKindnessStories,
  fetchGeoProvinces,
  hasActiveKindnessFilters,
  kindnessHubHref,
  readKindnessFilters,
} from '@/lib/kindness-wall';
import { KindnessHubRail, type HubRailTab } from '@/components/kindness/KindnessHubRail';
import { KindnessToolbar } from '@/components/kindness/KindnessToolbar';
import { KindnessBoard } from '@/components/kindness/KindnessBoard';
import { EmptyState } from '@/components/home/EmptyState';
import { SmartImage } from '@/components/ui/SmartImage';
import { siteConfig } from '@/lib/site';
import { cn, formatPersianNumber as fa, toPersianDigits } from '@/lib/utils';

/**
 * ═══════════════════════════════════════════════════════════════════
 * kindness-wall/ — هابِ «دیوار مهربانی» (تختهٔ نیاز ادمین‌محور، v2)
 *
 *   • SSR + ISR (revalidate=240، تگ «kindness» مشترک با صفحهٔ اصلی) —
 *     فیلتر/مرتب‌سازی/جست‌وجو/صفحه‌بندی همه‌کارهٔ بک‌اند از URL خوانده
 *     می‌شود: لینک‌ها shareable‌اند و Back/Forward درست کار می‌کند.
 *   • ریلِ دسته‌ها (لینک‌محور) + نوارِ ابزارِ زنده (debounce) + چیپ‌های
 *     حذفِ تکیِ فیلتر — قرارداد کاملِ KindnessListingPublicFilter پوشش
 *     داده شده: category / province / city / urgent / ordering / search.
 *   • تعاملِ کارت‌ها (شیتِ راه‌های ارتباط + آلبوم) در KindnessBoard از
 *     هوکِ مشترکِ useKindnessOverlays می‌آید — همان رفتارِ صفحهٔ اصلی.
 *   • «دیوار نتیجه‌ها» = استریمِ stories بک‌اند (پنجرهٔ ۹۰ روز) — نیازهای
 *     برطرف‌شده با روایتِ شفاف؛ بدون تماس، فقط اثر.
 *   • SEO: canonical روی نمایِ بدون‌فیلتر؛ نسخه‌های فیلتردار/صفحه‌بندی
 *     noindex,follow می‌گیرند تا فضای بی‌نهایتِ کوئری ایندکس نشود؛
 *     JSON-LD (CollectionPage + ItemList + BreadcrumbList) فقط روی نمایِ
 *     مرجع — آیتم‌ها به لنگرِ پایدارِ هر کارت (#kw-{slug}) اشاره می‌کنند.
 * ═══════════════════════════════════════════════════════════════════
 */

export const revalidate = 240;

type SP = Record<string, string | string[] | undefined>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SP>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const f = readKindnessFilters(sp ?? {});
  const canonical = !hasActiveKindnessFilters(f) && f.page === 1;
  const sortLabel = KINDNESS_SORT_OPTIONS.find((o) => o.value === f.ordering)?.label;
  const suffix = f.search
    ? `جست‌وجو: ${f.search}`
    : f.urgent
      ? 'نیازهای فوری'
      : sortLabel && f.ordering
        ? `مرتب‌سازی: ${sortLabel}`
        : 'نتایج فیلترشده';
  return {
    title: canonical ? 'دیوار مهربانی' : `دیوار مهربانی — ${suffix}`,
    description:
      'تختهٔ نیازهای واقعی و بررسی‌شده؛ با جست‌وجو و فیلترِ دسته و شهر، نیاز را پیدا کن و مستقیم و بی‌واسطه از راه‌های ارتباطیِ همان آگهی با صاحبِ نیاز هماهنگ شو.',
    alternates: { canonical: BOARD },
    /* نمایِ مرجع ایندکس می‌شود؛ فضای بی‌نهایتِ فیلتر/صفحه → فالو بدون ایندکس */
    robots: canonical ? undefined : { index: false, follow: true },
  };
}

/* ── آجرهای کوچکِ سروری ────────────────────────────────────────────── */

/** برچسبِ نسبیِ فارسیِ تاریخِ برطرف‌شدن (پنجرهٔ بایگانی ≤ ۹۰ روز است). */
function relFa(iso?: string): string | undefined {
  if (!iso) return undefined;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return undefined;
  const days = Math.max(0, Math.floor((Date.now() - t) / 86_400_000));
  if (days <= 0) return 'امروز';
  if (days === 1) return 'دیروز';
  if (days < 30) return `${fa(days)} روز پیش`;
  const months = Math.floor(days / 30);
  return months <= 1 ? 'ماه گذشته' : `${fa(months)} ماه پیش`;
}

/** چیپِ فیلترِ فعال با ضربدرِ حذفِ تکی (لینکِ سروری با حفظِ بقیهٔ فیلترها). */
function FilterChip({
  label,
  href,
  rose = false,
}: {
  label: string;
  href: string;
  rose?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'group inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[11.5px] font-extrabold transition-colors',
        rose
          ? 'border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300'
          : 'border-brand-200 bg-brand-50 text-brand-700 hover:border-brand-300',
      )}
    >
      <span className="max-w-52 truncate">{label}</span>
      <X
        className="h-3 w-3 opacity-60 transition-opacity group-hover:opacity-100"
        aria-hidden="true"
      />
      <span className="sr-only">حذف این فیلتر</span>
    </Link>
  );
}

/* ══════════════════════════════════════════════════════════════════
 *  صفحه
 * ══════════════════════════════════════════════════════════════════ */

export default async function KindnessWallHubPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const f = readKindnessFilters(sp ?? {});
  const hasFilters = hasActiveKindnessFilters(f);
  const isCanonicalView = !hasFilters && f.page === 1;

  const [pageData, categories, stats, stories, provinces] = await Promise.all([
    fetchKindnessListingsPage(f),
    fetchKindnessCategories(),
    fetchKindnessStats(),
    fetchKindnessStories(8),
    fetchGeoProvinces(),
  ]);

  const base = siteConfig.url.replace(/\/+$/, '');

  /* ── تب‌های ریل: «همه» → «فوری‌ها» → دسته‌ها (شمارندهٔ زندهٔ بک‌اند) ── */
  const urgentCount =
    stats?.urgentListings ?? pageData?.items.filter((l) => l.urgency === 'urgent').length ?? 0;
  const totalOnBoard = stats?.openListings ?? pageData?.count ?? 0;

  const railTabs: HubRailTab[] = [
    {
      slug: '__all__',
      title: 'همه',
      count: totalOnBoard,
      tone: 'brand',
      grid: true,
      href: `${kindnessHubHref(f, { category: '', urgent: false, page: 1 })}#board`,
      active: !f.category && !f.urgent,
    },
    ...(urgentCount > 0
      ? [
          {
            slug: '__urgent__',
            title: 'فوری‌ها',
            count: urgentCount,
            tone: 'rose' as const,
            href: `${kindnessHubHref(f, { category: '', urgent: true, page: 1 })}#board`,
            active: f.urgent && !f.category,
          },
        ]
      : []),
    ...categories
      .filter((c) => c.count > 0)
      .map((c) => ({
        slug: c.slug,
        title: c.title,
        icon: c.icon,
        count: c.count,
        tone: 'brand' as const,
        href: `${kindnessHubHref(f, { category: c.slug, urgent: false, page: 1 })}#board`,
        active: f.category === c.slug && !f.urgent,
      })),
  ];
  /* ریل وقتی معنا دارد که بیش از «همه» تب داشته باشد و تخته اصلاً خالی نباشد */
  const showRail = railTabs.length > 1 && totalOnBoard > 0;

  /* ── چیپ‌های فیلترِ فعال (حذف تکی) ──────────────────────────────────── */
  const activeCategoryTitle = categories.find((c) => c.slug === f.category)?.title;
  const chips: Array<{ key: string; label: string; href: string; rose?: boolean }> = [];
  if (f.search)
    chips.push({
      key: 'search',
      label: `جست‌وجو: ${f.search}`,
      href: `${kindnessHubHref(f, { search: '', page: 1 })}#board`,
    });
  if (f.urgent)
    chips.push({
      key: 'urgent',
      label: 'فقط فوری‌ها',
      href: `${kindnessHubHref(f, { urgent: false, page: 1 })}#board`,
      rose: true,
    });
  if (f.category)
    chips.push({
      key: 'category',
      label: `دسته: ${activeCategoryTitle ?? f.category}`,
      href: `${kindnessHubHref(f, { category: '', page: 1 })}#board`,
    });
  if (f.province)
    chips.push({
      key: 'province',
      label: `استان: ${f.province}`,
      href: `${kindnessHubHref(f, { province: '', page: 1 })}#board`,
    });
  if (f.city)
    chips.push({
      key: 'city',
      label: `شهر: ${f.city}`,
      href: `${kindnessHubHref(f, { city: '', page: 1 })}#board`,
    });
  if (f.ordering) {
    const sort = KINDNESS_SORT_OPTIONS.find((o) => o.value === f.ordering);
    if (sort)
      chips.push({
        key: 'ordering',
        label: `مرتب‌سازی: ${sort.label}`,
        href: `${kindnessHubHref(f, { ordering: '', page: 1 })}#board`,
      });
  }

  /* ── صفحه‌بندی (پنجرهٔ لغزانِ ۵تایی — الگوی /r4j) ────────────────────── */
  const currentPage = pageData?.page ?? f.page;
  const totalPages = pageData?.pageCount ?? 1;
  const windowStart = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  const windowPages = Array.from(
    { length: Math.min(5, totalPages) },
    (_, i) => windowStart + i,
  ).filter((p) => p <= totalPages);
  /* DRF برای page خارج از محدوده ۴۰۴ می‌دهد → fetcher آن را به پرچمِ
     outOfRange ترجمه می‌کند (نه حالتِ «API خاموش»). محاسبهٔ جایگزینِ
     page>pageCount برای صلحتِ دوبل هم نگه داشته شده. */
  const pageOutOfRange =
    pageData !== null &&
    (pageData.outOfRange === true || (pageData.count > 0 && currentPage > pageData.pageCount));

  /* ── JSON-LD فقط روی نمایِ مرجع (سئوی تمیز، بدون duplicate) ─────────── */
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'بعثت مردم', item: base },
      { '@type': 'ListItem', position: 2, name: 'دیوار مهربانی', item: `${base}${BOARD}` },
    ],
  };
  const boardLd =
    isCanonicalView && pageData && pageData.items.length > 0
      ? {
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'CollectionPage',
              '@id': `${base}${BOARD}#page`,
              url: `${base}${BOARD}`,
              name: 'دیوار مهربانی — بعثت مردم',
              description:
                'تختهٔ نیازهای واقعی و بررسی‌شده؛ ارتباط مستقیم و بی‌واسطه با صاحبِ نیاز.',
              isPartOf: { '@type': 'WebSite', name: 'بعثت مردم', url: base },
              inLanguage: 'fa-IR',
            },
            {
              '@type': 'ItemList',
              '@id': `${base}${BOARD}#board`,
              name: 'آگهی‌های نیازِ جاریِ دیوار مهربانی',
              numberOfItems: pageData.count,
              itemListElement: pageData.items.map((l, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                name: l.title,
                url: `${base}${BOARD}#kw-${l.slug}`,
              })),
            },
          ],
        }
      : null;

  return (
    <main className="bg-white">
      {/* SEO: گراف‌ها در HTMLِ اولیه (الگوی صفحهٔ اصلی) */}
      <Script
        id="ld-json-kindness-breadcrumb"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      {boardLd && (
        <Script
          id="ld-json-kindness-board"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(boardLd) }}
        />
      )}

      {/* ══════════ هیرو ══════════ */}
      <section className="relative overflow-hidden bg-ink-900 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.55]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(-45deg, rgba(255,255,255,.035) 0 2px, transparent 2px 14px)',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-500/25 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-rose-500/15 blur-3xl"
        />
        <div className="container-edge relative py-14 md:py-20">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[12px] font-bold text-white/80 backdrop-blur-sm">
              <HeartHandshake className="h-4 w-4 text-brand-300" aria-hidden="true" />
              دیوار مهربانی — هر نیاز، یک قرارِ مهربانی
            </p>
            <h1 className="fa-title mt-5 text-[26px] font-black text-white sm:text-[34px] md:text-[44px]">
              سرزمینِ نیازهای کوچک،
              <span className="grad-text-safe mt-1 block bg-gradient-to-l from-brand-200 via-mint-200 to-brand-400 bg-clip-text text-transparent">
                دست‌های بزرگ‌تر از آن‌ها
              </span>
            </h1>
            <p className="mt-4 max-w-2xl text-[13.5px] leading-8 text-white/75 md:text-[15px]">
              هر آگهیِ این تخته را تیمِ بعثت به‌نیابت از صاحبِ نیاز ثبت و بررسی کرده است. تو
              می‌گردی، نیازِ هم‌قَدِ توانت را پیدا می‌کنی و از همان کارت، مستقیم و بی‌واسطه با او
              حرف می‌زنی — بی‌ثبت‌نام، بی‌انتظار، بی‌واسطه.
            </p>

            {/* آمارِ زندهٔ تخته (صداقتِ عدد: صفرِ واقعی هم نشان داده می‌شود) */}
            {stats && (
              <div className="mt-8 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
                {[
                  {
                    value: stats.openListings,
                    label: 'نیازِ جاری',
                    icon: Layers,
                    tone: 'text-brand-300',
                  },
                  {
                    value: stats.urgentListings,
                    label: 'نیازِ فوری',
                    icon: Flame,
                    tone: 'text-rose-300',
                  },
                  {
                    value: stats.fulfilledTotal,
                    label: 'برطرف‌شده تا امروز',
                    icon: BadgeCheck,
                    tone: 'text-mint-300',
                  },
                  {
                    value: stats.volunteersTotal,
                    label: 'دستِ آماده‌ی کمک',
                    icon: HeartHandshake,
                    tone: 'text-amber-300',
                  },
                  {
                    value: stats.activeCategories,
                    label: 'دستهٔ فعال',
                    icon: LayoutGrid,
                    tone: 'text-brand-200',
                  },
                ].map((s, i, arr) => (
                  <div
                    key={s.label}
                    className={cn(
                      'rounded-2xl border border-white/10 bg-white/[.05] px-4 py-3.5 backdrop-blur-sm transition-colors duration-300 hover:border-brand-400/25 hover:bg-white/[.08]',
                      /* ۵ کارت در موبایلِ دوستونی: کارتِ پنجم تمام‌عرض می‌شود
                         تا یتیم نماند؛ در بریک‌پوینت‌های بالاتر عادی. */
                      i === arr.length - 1 && arr.length % 2 === 1
                        ? 'col-span-2 sm:col-span-1'
                        : undefined,
                    )}
                  >
                    <div
                      className={cn(
                        'flex items-center gap-1.5 text-[22px] font-black tabular-nums md:text-[24px]',
                        s.tone,
                      )}
                    >
                      <s.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {fa(s.value)}
                    </div>
                    <div className="mt-1 text-[11.5px] font-bold text-white/70">{s.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ══════════ چطور کار می‌کند (سه گام) ══════════ */}
      {/* باکس روی لبهٔ هیرو می‌نشیند: در موبایل حاشیهٔ کناری حفظ می‌شود تا
          هالهٔ تیرهٔ هیرو از دو طرفِ باکس بیرون نزند و خطِ برشِ سختی نسازد. */}
      <section className="relative z-10 -mt-8 px-4 sm:px-6">
        <div className="mx-auto grid max-w-[1180px] gap-3 rounded-3xl border border-ink-100 bg-white p-4 shadow-[0_12px_32px_-20px_rgba(15,20,32,.25)] sm:grid-cols-3 md:p-5">
          {[
            {
              icon: Search,
              title: 'بگرد و پیدا کن',
              text: 'جست‌وجوی هوشمند به‌همراهِ فیلترِ دسته، استان، شهر و فوریت؛ در چند ثانیه به نیازِ هم‌قدِ توانِ خودت می‌رسی.',
            },
            {
              icon: PhoneCall,
              title: 'راهِ ارتباط را باز کن',
              text: 'روی هر کارت «راه‌های ارتباط» را بزن؛ فقط همان کانال‌هایی که صاحبِ نیاز گذاشته — بدونِ واسطه و بدونِ ثبت‌نام.',
            },
            {
              icon: HeartHandshake,
              title: 'کار را تمام کن',
              text: 'هماهنگ کن، برآورده کن و نیاز را از دیوار به «دیوارِ نتیجه‌ها» بفرست تا همه ببینند مهربانی جواب می‌دهد.',
            },
          ].map((s) => (
            <div key={s.title} className="flex items-start gap-3 rounded-2xl bg-ink-50/60 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-700">
                <s.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-[13.5px] font-extrabold text-ink-900">{s.title}</p>
                <p className="mt-1 text-[11.5px] leading-6 text-ink-500">{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════ تختهٔ نیازها ══════════ */}
      <section id="board" className="section-y scroll-mt-24">
        <div className="container-edge">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="inline-flex items-center gap-1.5 text-[12px] font-extrabold text-brand-700">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                تختهٔ زندهٔ نیازها
              </p>
              <h2 className="fa-title mt-1 text-[21px] font-black text-ink-900 md:text-[26px]">
                آگهی‌های دیوار مهربانی
              </h2>
              <p className="mt-2 max-w-prose text-[12.5px] leading-7 text-ink-500 md:text-[13px]">
                روی تخته، هر کارت یک نیازِ واقعیِ بررسی‌شده است. با جست‌وجو و فیلترِ دسته و شهر به
                نیازِ خودت برس و از «راه‌های ارتباط» همان کارت، مستقیم جواب بگیر.
              </p>
            </div>
          </div>

          {/* ریل دسته‌ها (لینک‌محور، لنگرِ #board) */}
          {showRail && (
            <div className="mb-6">
              <KindnessHubRail tabs={railTabs} />
            </div>
          )}

          {/* نوارِ ابزارِ زنده — گزینه‌های استان/شهر از دادهٔ واقعیِ تخته */}
          {/* نوارِ ابزارِ زنده — استان از دیتاستِ رسمیِ بک‌اند، شهر وابسته */}
          <KindnessToolbar filters={f} hasFilters={hasFilters} provinces={provinces} />

          {/* چیپ‌های فیلترِ فعال */}
          {chips.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {chips.map((c) => (
                <FilterChip key={c.key} label={c.label} href={c.href} rose={c.rose} />
              ))}
            </div>
          )}

          {/* شمارِ نتایج */}
          {pageData && !pageOutOfRange && (
            <div className="mt-6 flex items-center justify-between text-[12px] font-bold text-ink-500">
              <p>
                {hasFilters ? 'نتیجهٔ این جست‌وجو:' : 'همهٔ نیازهای روی دیوار:'}{' '}
                <span className="tabular-nums text-ink-900">{fa(pageData.count)}</span> آگهی
                {totalPages > 1 && (
                  <>
                    {' '}
                    — صفحه <span className="tabular-nums">
                      {toPersianDigits(currentPage)}
                    </span> از <span className="tabular-nums">{toPersianDigits(totalPages)}</span>
                  </>
                )}
              </p>
            </div>
          )}

          {/* بدنهٔ تخته */}
          {pageData === null ? (
            <div className="mt-4 rounded-3xl border border-dashed border-ink-200 bg-white/60">
              <EmptyState
                title="تخته الان بالا نمی‌آید"
                description="ارتباط با سامانه برقرار نشد. یک‌بار دیگر تلاش کن؛ نیازها همان‌جا منتظرند."
                iconPath="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
              />
            </div>
          ) : pageOutOfRange ? (
            <div className="mt-4 rounded-3xl border border-dashed border-ink-200 bg-white/60">
              <EmptyState
                title="این شمارهٔ صفحه، صفحه‌ای ندارد"
                description={`تخته در این نمایش ${fa(pageData.count)} آگهی در ${fa(pageData.pageCount)} صفحه دارد؛ از صفحهٔ اول شروع کن.`}
                iconPath="M21 21l-4.35-4.35M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z"
              />
              <div className="-mt-6 pb-8 text-center">
                <Link
                  href={`${kindnessHubHref(f, { page: 1 })}#board`}
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-ink-200 bg-white px-5 py-2.5 text-[12px] font-extrabold text-ink-700 transition-colors hover:border-ink-300"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  برگشت به صفحهٔ اول
                </Link>
              </div>
            </div>
          ) : pageData.items.length === 0 ? (
            <div className="mt-4 rounded-3xl border border-dashed border-ink-200 bg-white/60">
              <EmptyState
                title={hasFilters ? 'با این فیلترها چیزی نمانده' : 'دیوار دارد نفس تازه می‌کند'}
                description={
                  hasFilters
                    ? 'فیلترها را کمی بازتر کن؛ شاید همان نیازِ تو یک تبِ آن‌طرف‌تر نشسته باشد.'
                    : 'به‌محضِ ثبتِ نیازهای تازه، همین‌جا می‌نشینند و هر مهربانی می‌تواند مستقیم جواب بدهد.'
                }
                iconPath="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
              />
              {hasFilters && (
                <div className="-mt-6 pb-8 text-center">
                  <Link
                    href={`${BOARD}#board`}
                    className="inline-flex items-center gap-1.5 rounded-2xl border border-ink-200 bg-white px-5 py-2.5 text-[12px] font-extrabold text-ink-700 transition-colors hover:border-ink-300"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    حذف فیلترها و مشاهدهٔ همه
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-4">
              <KindnessBoard listings={pageData.items} />
            </div>
          )}

          {/* صفحه‌بندی — لینک‌های سروری با حفظِ فیلترها (+ لنگرِ #board) */}
          {pageData && !pageOutOfRange && totalPages > 1 && (
            <nav
              aria-label="صفحه‌بندی آگهی‌های دیوار مهربانی"
              className="mt-10 flex items-center justify-center gap-1.5"
            >
              {currentPage > 1 && (
                <Link
                  href={`${kindnessHubHref(f, { page: currentPage - 1 })}#board`}
                  aria-label="صفحهٔ قبلی"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-ink-200 bg-white text-ink-600 transition-colors hover:border-ink-300 hover:text-ink-900"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              )}
              {windowPages.map((p) => (
                <Link
                  key={p}
                  href={`${kindnessHubHref(f, { page: p })}#board`}
                  aria-current={p === currentPage ? 'page' : undefined}
                  className={cn(
                    'flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-[13px] font-extrabold tabular-nums transition-colors',
                    p === currentPage
                      ? 'bg-[linear-gradient(135deg,#0D8074,#0A6E64_50%,#085C54)] text-white shadow-[0_6px_14px_-6px_rgba(13,128,116,.55)]'
                      : 'border border-ink-200 bg-white text-ink-600 hover:border-ink-300 hover:text-ink-900',
                  )}
                >
                  {toPersianDigits(p)}
                </Link>
              ))}
              {currentPage < totalPages && (
                <Link
                  href={`${kindnessHubHref(f, { page: currentPage + 1 })}#board`}
                  aria-label="صفحهٔ بعدی"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-ink-200 bg-white text-ink-600 transition-colors hover:border-ink-300 hover:text-ink-900"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </Link>
              )}
            </nav>
          )}
        </div>
      </section>

      {/* ══════════ دیوار نتیجه‌ها (داستان‌های مهربانی) ══════════ */}
      {stories.length > 0 && (
        <section className="section-alt">
          <div className="container-edge section-y">
            <div className="mb-7 max-w-2xl">
              <p className="inline-flex items-center gap-1.5 text-[12px] font-extrabold text-mint-700">
                <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                دیوارِ نتیجه‌ها
              </p>
              <h2 className="fa-title mt-1 text-[21px] font-black text-ink-900 md:text-[26px]">
                مهربانی‌هایی که به خطِ پایان رسیدند
              </h2>
              <p className="mt-2 max-w-prose text-[12.5px] leading-7 text-ink-500 md:text-[13px]">
                شفافیت یعنی همین: این نیازها دیگر روی تخته نیستند چون برآورده شدند. روایتِ ۹۰ روزِ
                گذشته، با حرفِ خودِ تیمِ بعثت.
              </p>
            </div>

            <div className="no-scrollbar -mx-4 snap-x snap-mandatory overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
              <div className="flex w-max gap-4 md:gap-5">
                {stories.map((s) => (
                  <article
                    key={s.slug}
                    className="group w-64 shrink-0 snap-start overflow-hidden rounded-[22px] bg-white ring-1 ring-ink-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_-20px_rgba(11,53,48,.28)] sm:w-72"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-ink-100">
                      <SmartImage
                        src={s.coverImage}
                        alt={s.title}
                        variant="kindness"
                        fill
                        sizes="(max-width: 640px) 256px, 288px"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                      />
                      <div
                        aria-hidden="true"
                        className="absolute inset-x-0 bottom-0 z-[1] h-1/2 bg-gradient-to-t from-black/50 via-black/10 to-transparent"
                      />
                      <span className="absolute right-3 top-3 z-10 inline-flex h-7 items-center gap-1 rounded-full bg-mint-500 px-2.5 text-[10.5px] font-extrabold text-white ring-[2.5px] ring-black/10">
                        <BadgeCheck className="h-3 w-3" aria-hidden="true" />
                        برطرف شد
                      </span>
                      {s.categoryTitle && (
                        <span className="absolute bottom-3 right-3 z-10 inline-flex h-6 items-center gap-1 rounded-full bg-white/95 px-2.5 text-[11px] font-extrabold text-ink-700 shadow-soft backdrop-blur-md">
                          {s.categoryIcon && (
                            <span aria-hidden="true" className="text-[12px] leading-none">
                              {s.categoryIcon}
                            </span>
                          )}
                          {s.categoryTitle}
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3
                        className="line-clamp-2 min-h-[2.75rem] text-[13.5px] font-extrabold leading-6 text-ink-900"
                        title={s.title}
                      >
                        {s.title}
                      </h3>
                      <div className="mt-2.5 flex items-center justify-between gap-2 text-[11.5px] font-bold text-ink-500">
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ink-50 px-2 py-0.5 ring-1 ring-ink-100">
                          <Package className="h-3 w-3 text-mint-600" aria-hidden="true" />
                          <span className="tabular-nums">{`${fa(s.quantity)} ${s.unit}`}</span>
                        </span>
                        <span className="inline-flex min-w-0 items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0 text-mint-600" aria-hidden="true" />
                          <span className="truncate">{s.city || 'سراسر کشور'}</span>
                        </span>
                      </div>
                      {s.note && (
                        <p className="mt-3 line-clamp-2 rounded-xl bg-mint-50/70 px-3 py-2 text-[11px] font-medium leading-5 text-ink-600 ring-1 ring-mint-100">
                          «{s.note}»
                        </p>
                      )}
                      {relFa(s.fulfilledAt) && (
                        <div className="mt-3 flex items-center gap-1 border-t border-ink-100 pt-3 text-[10.5px] font-bold text-ink-400">
                          <Clock className="h-3 w-3" aria-hidden="true" />
                          {`برطرف شد: ${relFa(s.fulfilledAt)}`}
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ══════════ سالنِ اعتماد — سه قانونِ دیوار ══════════ */}
      <section className="relative overflow-hidden bg-ink-950 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(-45deg, rgba(255,255,255,.03) 0 2px, transparent 2px 16px)',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 top-0 h-80 w-80 rounded-full bg-brand-500/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 bottom-10 h-72 w-72 rounded-full bg-rose-500/10 blur-3xl"
        />
        <div className="container-edge relative py-14 md:py-16">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[11.5px] font-bold text-white/80 backdrop-blur-sm">
              <ShieldCheck className="h-4 w-4 text-brand-300" aria-hidden="true" />
              اعتماد، پیش از هر تماس
            </p>
            <h2 className="fa-title mt-4 text-[21px] font-black text-white md:text-[27px]">
              سه قانون، پشتِ هر کارتِ این دیوار
              <span className="grad-text-safe mt-1 block bg-gradient-to-l from-brand-200 via-mint-200 to-mint-400 bg-clip-text text-transparent">
                بررسی‌شده · بی‌واسطه · زنده
              </span>
            </h2>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3 sm:gap-4">
            {[
              {
                icon: ShieldCheck,
                ring: 'ring-brand-400/25 bg-brand-500/12 text-brand-200',
                title: 'بررسی‌شده، نه ناشناس',
                text: 'هر نیاز را تیمِ بعثت به‌نیابت از صاحبش ثبت و راستی‌آزمایی می‌کند؛ روی دیوار فقط نیازِ واقعی می‌نشیند.',
              },
              {
                icon: PhoneCall,
                ring: 'ring-mint-500/25 bg-mint-500/12 text-mint-300',
                title: 'تماسِ مستقیم، بدونِ واسطه',
                text: 'کانالِ ارتباط را خودِ آگهی می‌دهد؛ نه واسطه‌ای در میان است، نه انتظاری در صف — کمک همان‌جا به دستِ صاحبش می‌رسد.',
              },
              {
                icon: Timer,
                ring: 'ring-amber-400/25 bg-amber-400/12 text-amber-300',
                title: 'عمرِ شفافِ آگهی',
                text: 'هر آگهی تاریخِ انقضا دارد و هر نیازِ برآورده‌شده به «دیوارِ نتیجه‌ها» کوچ می‌کند؛ تخته همیشه تازه و واقعی می‌ماند.',
              },
            ].map((t) => (
              <div
                key={t.title}
                className="group flex items-start gap-3.5 rounded-3xl border border-white/10 bg-white/[.05] p-4 backdrop-blur-sm transition-colors duration-300 hover:border-brand-400/25 hover:bg-white/[.08] sm:block sm:p-5"
              >
                <span
                  className={cn(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 transition-transform duration-300 group-hover:scale-105',
                    t.ring,
                  )}
                >
                  <t.icon className="h-[22px] w-[22px]" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-[14.5px] font-extrabold text-white">{t.title}</p>
                  <p className="mt-1.5 text-[11.5px] leading-6 text-white/65 sm:mt-2 sm:text-[12px] sm:leading-7">
                    {t.text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* ═════ دعوتِ پایانی — پنلِ کلاسیک با قابِ نور و کارتِ آمار ═════ */}
          <div className="relative mt-12">
            {/* هالهٔ نرمِ پشتِ پنل */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-x-6 -bottom-6 -top-6 rounded-[40px] bg-[radial-gradient(60%_120%_at_80%_0%,rgba(13,128,116,.28),transparent_70%)] blur-2xl"
            />
            <div className="border-white/12 relative overflow-hidden rounded-[28px] border bg-[linear-gradient(135deg,#0b2f2b_0%,#0d3f39_45%,#0a5a51_100%)] p-6 shadow-[0_34px_70px_-34px_rgba(0,0,0,.65)] sm:p-9">
              {/* بافتِ خطِ مورب + هاله‌ها */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-[0.35]"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(-45deg, rgba(255,255,255,.05) 0 1.5px, transparent 1.5px 13px)',
                }}
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brand-400/25 blur-3xl"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -left-20 bottom-0 h-52 w-52 rounded-full bg-mint-400/15 blur-3xl"
              />
              {/* خطِ نورِ بالای قاب */}
              <div
                aria-hidden="true"
                className="absolute inset-x-8 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(125,211,192,.65),transparent)]"
              />

              <div className="relative flex flex-col gap-7 lg:flex-row lg:items-stretch lg:justify-between lg:gap-10">
                <div className="max-w-xl">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.07] px-3 py-1.5 text-[11px] font-bold text-white/80 backdrop-blur-sm">
                    <HeartHandshake className="h-3.5 w-3.5 text-mint-300" aria-hidden="true" />
                    دعوتِ دیوار
                  </span>
                  <h3 className="fa-title mt-4 text-[19px] font-black text-white sm:text-[23px]">
                    یک جای این دیوار، دستِ تو کم است
                  </h3>
                  <p className="mt-2.5 text-[12.5px] font-medium leading-7 text-white/70 sm:text-[13.5px]">
                    یک‌بار دیگر تخته را بالا و پایین کن؛ شاید همان نیازِ کوچکی آنجاست که فقط تو
                    می‌توانی برآورده‌اش کنی — و بعدش به «دیوارِ نتیجه‌ها» برود.
                  </p>

                  {/* سه ریز-تعهدِ دیوار — همان زبانِ کلاسیکِ صفحه */}
                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    {[
                      { icon: ShieldCheck, text: 'نیازِ بررسی‌شده' },
                      { icon: PhoneCall, text: 'تماسِ بی‌واسطه' },
                      { icon: Timer, text: 'آگهیِ تاریخ‌دار' },
                    ].map((item) => (
                      <span
                        key={item.text}
                        className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[.06] px-2.5 py-1 text-[10.5px] font-bold text-white/65 backdrop-blur-sm"
                      >
                        <item.icon className="h-3 w-3 text-mint-300/90" aria-hidden="true" />
                        {item.text}
                      </span>
                    ))}
                  </div>
                </div>

                {/* ستونِ اکشن: جداکنندهٔ عمودی + دکمه + شمارنده — عمود‌وسط‌چین */}
                <div className="flex shrink-0 flex-col justify-center gap-3 lg:min-w-[240px] lg:border-s lg:border-white/10 lg:ps-8">
                  <a
                    href="#board"
                    className="group inline-flex h-[52px] items-center justify-center gap-2 rounded-2xl bg-white px-7 text-[13.5px] font-extrabold text-ink-900 shadow-[0_18px_36px_-16px_rgba(0,0,0,.6)] transition-all hover:-translate-y-0.5 hover:bg-mint-50 hover:shadow-[0_22px_40px_-16px_rgba(0,0,0,.65)] active:translate-y-0 active:scale-[.98]"
                  >
                    برگشت به بالای تخته
                    <ChevronLeft
                      className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5"
                      aria-hidden="true"
                    />
                  </a>
                  <p className="text-center text-[10.5px] font-bold leading-5 text-white/45">
                    {stats && stats.openListings > 0
                      ? `${fa(stats.openListings)} نیاز همین حالا روی تخته منتظرِ توست`
                      : 'به‌محضِ ثبتِ نیازهای تازه، همین‌جا می‌نشینند'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
