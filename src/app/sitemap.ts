import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/site';

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
 * WHY priorities are set the way they are
 * ────────────────────────────────────────
 * Google effectively ignores absolute priorities but DOES compare them
 * relatively within a site. `/` = 1.0 tells Google "this is the most
 * important URL". `/tabyin` = 0.9 puts the domain area right below the
 * home page. Utility routes get 0.5–0.6. `changeFrequency` is also
 * advisory but helps set expectations for crawl scheduling.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url.replace(/\/+$/, '');
  const now = new Date();

  const staticRoutes = [
    { path: '/',           priority: 1.00, changeFrequency: 'daily'   as const },
    { path: '/tabyin',     priority: 0.90, changeFrequency: 'daily'   as const },
    { path: '/tabyin/new', priority: 0.60, changeFrequency: 'monthly' as const },
    // /search is intentionally omitted — see robots.ts (infinite query
    // space; no ranking value). Listing it here would contradict the
    // Disallow rule and waste crawl budget.
  ];

  return staticRoutes.map((r) => ({
    url: `${base}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
