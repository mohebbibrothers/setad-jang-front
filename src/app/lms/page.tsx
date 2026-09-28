import type { Metadata } from 'next';
import Link from 'next/link';
import { Library, Sparkles } from 'lucide-react';
import { siteConfig } from '@/lib/site';
import {
  LMS_HUB_PAGE_SIZE,
  fetchLmsCategories,
  fetchLmsCoursesPage,
  fetchLmsStats,
  lmsHref,
  parseLmsHubQuery,
} from '@/lib/lms-data';
import type { LmsHubQuery } from '@/lib/lms-shared';
import { LmsHero } from '@/components/lms/LmsHero';
import { LmsAssuranceStrip } from '@/components/lms/LmsAssuranceStrip';
import { LmsToolsBar } from '@/components/lms/LmsToolsBar';
import { LmsCourseCard } from '@/components/lms/LmsCourseCard';
import { LmsPager } from '@/components/lms/LmsPager';
import { LmsLaunchConsole } from '@/components/lms/LmsLaunchConsole';
import { LmsCertificateVerify } from '@/components/lms/LmsCertificateVerify';
import { EmptyState } from '@/components/home/EmptyState';

/**
 * ═══════════════════════════════════════════════════════════════════
 * /lms — هابِ «قرارگاه آموزشی»
 *
 *   معماری: تماماً سرور-رندر؛ هر کنترل (ریل دسته‌ها، سگمنت سطح، چیپِ
 *   ویژه، سرچِ واحد) یک URLِ سالمِ قابل‌اشتراک می‌سازد و backend با
 *   (category, level, is_featured, search, page, page_size) فیلتر
 *   می‌کند. تبِ «همه»، ریستِ کوئری است، نه استیت.
 *
 *   قاعده‌ی «یک صفحه، یک جست‌وجو»: ورودیِ جست‌وجو فقط در دکِ فرمانِ
 *   بالای گرید زندگی می‌کند؛ هیرو مسیرهای تضمین‌شده (دسته + ویژه)
 *   می‌دهد — دیگر هیچ چیپِ «شروعِ سریع» به بن‌بستِ صفرنتیجه نمی‌رسد.
 *
 *   حالت‌ها:
 *     • کاتالوگِ کاملاً خالی → کنسولِ راه‌اندازی (روایتِ صادقانه).
 *     • فیلترِ بدون نتیجه → EmptyState + پاک‌سازی فیلترها.
 *     • صفحه‌ی فراتر از محدوده (DRF 404) → EmptyState + برگشت به صفحه‌ی ۱.
 *     • قطعِ ارتباط → EmptyState‌ی آفلاین (بدون کلاه‌سرهم‌کردنِ بالغ‌تر).
 *
 *   انتهای صفحه، ادعای «گواهی راستی‌آزما» با ویجتِ استعلامِ عمومیِ
 *   واقعی (پروکسیِ /api/lms/certificate-verify) عملیاتی می‌شود.
 * ═══════════════════════════════════════════════════════════════════
 */

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'آموزش‌ها — قرارگاه آموزشی',
  description:
    'همه‌ی کلاس‌های رایگانِ قرارگاه آموزشیِ بعثت مردم با دسته‌بندی و سطح‌بندی؛ جلساتِ ویدئو، صوت، سند و متن؛ آزمونِ پایانِ دوره و گواهی با راستی‌آزماییِ عمومی.',
  alternates: { canonical: '/lms' },
  openGraph: {
    title: 'آموزش‌ها — قرارگاه آموزشی | بعثت مردم',
    description: 'کلاس‌های رایگانِ سطح‌بندی‌شده با آزمون و گواهیِ راستی‌آزما — در دسترسِ همه.',
  },
};

type SP = Record<string, string | string[] | undefined>;

export default async function LmsHubPage({ searchParams }: { searchParams: Promise<SP> }) {
  const query = parseLmsHubQuery(await searchParams);

  const [categoriesRaw, stats, page] = await Promise.all([
    fetchLmsCategories(),
    fetchLmsStats(),
    fetchLmsCoursesPage(query),
  ]);

  const categories = categoriesRaw.map((c) => ({
    ...c,
    coursesCount: stats.countByCategory.get(c.slug) ?? 0,
  }));

  const emptyCatalog = stats.courseCount === 0 && !page.offline;
  const topCategories = categories
    .filter((c) => c.coursesCount > 0)
    .sort((a, b) => b.coursesCount - a.coursesCount)
    .slice(0, 4)
    // هیرو → کاتالوگ: انتخابِ مسیر، مستقیم روی گرید فرود می‌آید.
    .map((node) => ({ node, href: lmsHref({ category: node.slug, page: 1 }) + '#courses' }));
  const featured =
    !emptyCatalog && stats.featuredCount > 0
      ? { count: stats.featuredCount, href: lmsHref({ featured: true, page: 1 }) + '#courses' }
      : null;

  const hasFilter = Boolean(query.category || query.level || query.q || query.featured);
  // تعویضِ صفحه: برگشت به بالای کاتالوگ (نه بالای هیرو) تا دک همیشه در دید بماند.
  const buildPageHref = (p: number) => lmsHref({ page: p }, query) + '#courses';

  return (
    <main className="bg-white">
      <LmsHero stats={stats} topCategories={topCategories} featured={featured} />
      <LmsAssuranceStrip />

      {/* ══════════ کاتالوگ ══════════ */}
      <section id="courses" className="section-alt section-y scroll-mt-24">
        <div className="container-edge">
          {/* هدِ سکشن */}
          <div className="mb-8 flex flex-col items-center text-center">
            <p className="inline-flex items-center gap-1.5 text-[12px] font-extrabold text-mint-700">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              {hasFilter ? 'نتایجِ فیلترشده' : 'کاتالوگِ کاملِ کلاس‌ها'}
            </p>
            <h2 className="mt-1 inline-flex items-center gap-2 text-[22px] font-black text-ink-900 md:text-[26px]">
              <Library className="h-5 w-5 text-brand-600 md:h-6 md:w-6" aria-hidden="true" />
              همه‌ی آموزش‌ها
            </h2>
            <p className="mt-2 max-w-prose text-[12.5px] leading-7 text-ink-500 md:text-[13px]">
              {catalogSummary(query, stats.courseCount, page.count, emptyCatalog, page.offline)}
            </p>
          </div>

          {page.offline ? (
            <CatalogOffline />
          ) : emptyCatalog ? (
            <LmsLaunchConsole />
          ) : (
            <>
              <LmsToolsBar
                query={query}
                categories={categories}
                countByCategory={Object.fromEntries(stats.countByCategory)}
                totalCount={stats.courseCount}
              />

              {page.invalidPage ? (
                <InvalidPageState />
              ) : page.items.length === 0 ? (
                <NoResultsState hasFilter={hasFilter} />
              ) : (
                <>
                  <ul className="grid list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2 xl:grid-cols-3">
                    {page.items.map((c) => (
                      <li key={c.slug} className="min-w-0">
                        <LmsCourseCard c={c} />
                      </li>
                    ))}
                  </ul>
                  <LmsPager
                    page={page.page}
                    totalPages={page.totalPages}
                    buildHref={buildPageHref}
                  />
                </>
              )}
            </>
          )}
        </div>
      </section>

      {/* ══════════ راستی‌آزمایی گواهی — گذرِ مذاب از باندِ کاتالوگ ══════════ */}
      <section id="certificate-verify" className="section-melt section-y scroll-mt-24">
        <div className="container-edge">
          <div className="mx-auto max-w-3xl">
            <LmsCertificateVerify />
          </div>
        </div>
      </section>

      {/* Structured data — ItemListِ صفحه‌ی جاری */}
      {page.items.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'ItemList',
              name: 'آموزش‌های قرارگاه آموزشی — بعثت مردم',
              numberOfItems: stats.courseCount,
              itemListElement: page.items.map((c, i) => ({
                '@type': 'ListItem',
                position: (page.page - 1) * LMS_HUB_PAGE_SIZE + i + 1,
                name: c.title,
                url: `${siteConfig.url}/lms/courses/${encodeURIComponent(c.slug)}`,
              })),
            }),
          }}
        />
      )}
    </main>
  );
}

/* ── جزئیاتِ حالت‌ها ─────────────────────────────────────────────────── */

function catalogSummary(
  query: LmsHubQuery,
  total: number,
  filtered: number,
  emptyCatalog: boolean,
  offline: boolean,
): string {
  if (offline) return 'اتصال به سرور برقرار نشد؛ در تلاش برای بازگشاییِ دوباره…';
  if (emptyCatalog) return 'قرارگاه در حال بارگذاری نخستین کلاس‌هایش است — با راه‌پیما همراه شو.';
  const fa = (n: number) => n.toLocaleString('fa-IR');
  if (query.q) {
    return query.category
      ? `${fa(filtered)} نتیجه برای «${query.q}» در دسته‌ی انتخاب‌شده؛ با فیلترها باریک‌ترش کن یا همه را ببین.`
      : `${fa(filtered)} نتیجه برای «${query.q}»؛ با دسته و سطح، هدف را بگیر.`;
  }
  if (query.featured && !query.category && !query.level)
    return `${fa(filtered)} کلاسِ دست‌چینِ سردبیر؛ جست‌وجو را هم به همین مجموعه‌ی ویژه اضافه کن.`;
  if (query.category || query.level || query.featured)
    return `${fa(filtered)} کلاس با این ترکیبِ فیلتر؛ جست‌وجو را هم به این مجموعه اضافه کن.`;
  return `${fa(total)} کلاسِ رایگان و سطح‌بندی‌شده — جست‌وجو کن، دسته را بگیر و مستقیم وارد مسیر شو.`;
}

function CatalogOffline() {
  return (
    <div className="mx-auto max-w-xl">
      <EmptyState
        title="ارتباط با سرور برقرار نشد"
        description="چند لحظه‌ی دیگر صفحه را تازه کن؛ اگر مداوم بود، به ما اطلاع بده."
        iconPath="M12 9v4m0 4h.01 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0"
      />
      <p className="-mt-6 text-center">
        <Link
          href="/lms"
          prefetch={false}
          scroll={false}
          className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-brand-500 bg-white px-6 text-[13px] font-extrabold text-brand-700 transition-colors hover:bg-brand-50"
        >
          تلاشِ دوباره
        </Link>
      </p>
    </div>
  );
}

function InvalidPageState() {
  return (
    <div className="mx-auto max-w-xl">
      <EmptyState
        title="این صفحه از محدوده‌ی نتایج فراتر است"
        description="نتایج کوتاه‌تر از این صفحه است؛ به صفحه‌ی اول برگرد."
        iconPath="M15 6l-6 6 6 6"
      />
      <p className="-mt-6 text-center">
        <Link
          href="/lms"
          prefetch={false}
          scroll={false}
          className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-brand-500 bg-white px-6 text-[13px] font-extrabold text-brand-700 transition-colors hover:bg-brand-50"
        >
          برگشت به صفحه‌ی اول
        </Link>
      </p>
    </div>
  );
}

function NoResultsState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <div className="mx-auto max-w-xl">
      <EmptyState
        title="چیزی با این ترکیب پیدا نشد"
        description={
          hasFilter
            ? 'عبارتِ جست‌وجو یا فیلتر را تغییر بده — شاید نزدیکِ هدف باشی.'
            : 'به‌زودی کلاس‌های تازه منتشر می‌شود.'
        }
        iconPath="M22 10 12 5 2 10l10 5 10-5z M6 12v5c3 3 9 3 12 0v-5"
      />
      {hasFilter && (
        <p className="-mt-6 text-center">
          <Link
            href="/lms"
            prefetch={false}
            scroll={false}
            className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-brand-500 bg-white px-6 text-[13px] font-extrabold text-brand-700 transition-colors hover:bg-brand-50"
          >
            پاک‌سازی همه‌ی فیلترها
          </Link>
        </p>
      )}
    </div>
  );
}
