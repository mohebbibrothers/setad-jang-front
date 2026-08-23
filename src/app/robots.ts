import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/site';

/**
 * robots.txt
 *
 * Goals:
 *   • Let Google, Bing, and Yandex crawl every public URL under `/`.
 *   • Explicitly BLOCK admin/auth/dashboard/proxy paths (defence-in-depth
 *     — they aren't in the sitemap either, but a well-behaved bot might
 *     still discover them through a stray link).
 *   • Explicitly DISALLOW `/search?q=…` from being indexed — infinite
 *     query-space, no ranking value, wastes crawl budget.
 *   • Give AI crawlers (GPTBot, ClaudeBot, PerplexityBot, CCBot) the
 *     same access as Googlebot — they surface the site inside LLM
 *     answers, which is fast becoming a discovery channel.
 *   • Explicitly BLOCK archive.org's Wayback if you'd rather keep the
 *     staging history private — commented off by default because a
 *     public Wayback record can HELP brand trust.
 *   • Advertise the sitemap so every crawler finds it in one hop.
 */
export default function robots(): MetadataRoute.Robots {
  const base = siteConfig.url.replace(/\/+$/, '');
  return {
    rules: [
      {
        // Universal rule.
        userAgent: '*',
        allow: ['/'],
        disallow: [
          '/admin',
          '/dashboard',
          '/auth',
          '/account',
          '/api/proxy',
          '/api/',
          '/search', // infinite query-string space
          '/*?utm_*', // tracking-param dupes
          '/*?fbclid=*',
          '/*?gclid=*',
        ],
      },
      {
        // Explicit sweetheart deal for Google — same rules, keeps the
        // per-agent block visible so Search Console reads it cleanly.
        userAgent: 'Googlebot',
        allow: ['/'],
        disallow: ['/admin', '/dashboard', '/auth', '/account', '/api/proxy', '/api/', '/search'],
      },
      {
        userAgent: 'Googlebot-Image',
        allow: ['/brand/', '/og/', '/favicon-512.png', '/favicon-192.png'],
      },
      {
        userAgent: 'Bingbot',
        allow: ['/'],
        disallow: ['/admin', '/dashboard', '/auth', '/account', '/api/proxy', '/api/', '/search'],
      },
      {
        userAgent: 'YandexBot',
        allow: ['/'],
        disallow: ['/admin', '/dashboard', '/auth', '/account', '/api/proxy', '/api/', '/search'],
      },
      // Modern AI crawlers — allowed so the site appears in LLM answers.
      {
        userAgent: 'GPTBot',
        allow: ['/'],
        disallow: ['/admin', '/dashboard', '/auth', '/account', '/api/'],
      },
      {
        userAgent: 'ClaudeBot',
        allow: ['/'],
        disallow: ['/admin', '/dashboard', '/auth', '/account', '/api/'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: ['/'],
        disallow: ['/admin', '/dashboard', '/auth', '/account', '/api/'],
      },
      {
        userAgent: 'CCBot',
        allow: ['/'],
        disallow: ['/admin', '/dashboard', '/auth', '/account', '/api/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
