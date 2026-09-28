import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/site';
import { fetchCriminalsPage } from '@/lib/r4j';
import { safeApiFetch, type Paginated } from '@/lib/api';

/**
 * Dynamic sitemap — homepage-milestone edition.
 *
 * WHY this file is short
 * ──────────────────────
 * Only routes that actually resolve are listed. The domain-area routes
 * (/madadkar, /r4j, /lms, /kindness-wall, /public-reports) plus the
 * corporate pages (/about, /contact, /faq, /privacy, /terms, /support)
 * and the auth flow (/auth/*) are NOT built yet — listing them would
 * ask crawlers to index 404s and hurt SEO.
 *
 * The moment a page ships, add its `{ path, priority, changeFrequency }`
 * entry back to `staticRoutes` below. Per-resource sitemaps (individual
 * tabyin content, campaigns, etc.) can then be appended with server-
 * side data fetching in this same handler.
 *
 * /r4j criminal casefiles and /lms course pages ship in this handler
 * too — fetched from their public list endpoints with the same ISR
 * cache the pages themselves use (so this costs no extra backend load
 * beyond the page fetches).
 *
 * WHY priorities are set the way they are
 * ────────────────────────────────────────
 * Google effectively ignores absolute priorities but DOES compare them
 * relatively within a site. `/` = 1.0 tells Google "this is the most
 * important URL". `/tabyin` = 0.9 puts the domain area right below the
 * home page. Utility routes get 0.5–0.6. `changeFrequency` is also
 * advisory but helps set expectations for crawl scheduling.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url.replace(/\/+$/, '');
  const now = new Date();

  const staticRoutes = [
    { path: '/', priority: 1.0, changeFrequency: 'daily' as const },
    { path: '/about-besat', priority: 0.95, changeFrequency: 'monthly' as const },
    { path: '/tabyin', priority: 0.9, changeFrequency: 'hourly' as const },
    { path: '/tabyin/new', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: '/r4j', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/madadkar', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/lms', priority: 0.9, changeFrequency: 'daily' as const },
    // /search is intentionally omitted — see robots.ts (infinite query
    // space; no ranking value). Listing it here would contradict the
    // Disallow rule and waste crawl budget.
    // /r4j/[slug]/bounty و /report هم عمداً نیستند — صفحه‌های اقدام‌اند،
    // نه محتوا (robots: noindex روی خودِ صفحه هم دارند).
  ];

  const entries: MetadataRoute.Sitemap = staticRoutes.map((r) => ({
    url: `${base}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  // پرونده‌های عمومیِ «جایزه‌ای برای عدالت» — ۱۰۰ پرونده‌ی تازه/برتر
  const criminals = await fetchCriminalsPage({ pageSize: 100, ordering: '-published_at' });
  for (const c of criminals?.results ?? []) {
    entries.push({
      url: `${base}/r4j/${encodeURIComponent(c.slug)}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  }

  // کلاس‌های عمومیِ «قرارگاه آموزشی» — تا ۱۰۰ کلاسِ تازه؛ همان تگ‌های
  // کشِ صفحه‌ها تا هوکِ revalidate هردو را با هم باطل کند. خطا در این‌جا
  // نباید کلِ sitemap را بکشد، پس لودرِ امن (safeApiFetch → null).
  const courses = await safeApiFetch<Paginated<{ slug: string; published_at?: string }>>(
    '/lms/courses/?page_size=100',
    { revalidate: 300, tags: ['lms', 'courses'] },
  );
  for (const c of courses?.results ?? []) {
    if (!c.slug) continue;
    entries.push({
      url: `${base}/lms/courses/${encodeURIComponent(c.slug)}`,
      lastModified: c.published_at ? new Date(c.published_at) : now,
      changeFrequency: 'weekly',
      priority: 0.85,
    });
  }

  return entries;
}
