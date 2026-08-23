import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { AboutBesat } from '@/components/about/AboutBesat';
import { siteConfig } from '@/lib/site';

/**
 * /about-besat — the standalone "درباره بعثت مردم" route.
 *
 * WHY A DEDICATED ROUTE
 * ─────────────────────
 *  The homepage is a photograph-first landing that intentionally has
 *  minimal on-page prose. That's great UX but poor for the single
 *  keyword «بعثت» in Google's ranking model.
 *
 *  Rather than stuff SEO copy at the bottom of the homepage (which the
 *  client explicitly rejected), we host the editorial + FAQ block at a
 *  real URL. That URL:
 *    • has its own title / description / canonical → indexes cleanly
 *    • lives in sitemap.ts with a high priority
 *    • gets crawled independently → doubles our surface area for the
 *      brand query
 *    • is the schema-correct location for AboutPage + FAQPage rich
 *      snippets (Google prefers those on a dedicated URL, not the root)
 *
 *  So the SEO signal is actually STRONGER with an extraction, not
 *  weaker. Best of both worlds: pristine homepage + a properly-scoped
 *  brand page.
 */

// `title.absolute` bypasses the RootLayout `title.template` (which
// would otherwise append " | بعثت — بعثت مردم" and double-print the
// brand tokens). We craft the exact SERP entry here.
const TITLE_ABSOLUTE = 'درباره بعثت مردم — بعثت | besat.me';
const DESCRIPTION =
  'بعثت مردم چیست؟ آشنایی کامل با اهداف، حوزه‌های فعالیت و پرسش‌های پرتکرار درباره سامانه مردمی بعثت — جهاد تبیین، مددکاری، دیوار مهربانی و گزارش‌های مردمی، همه در نشانی besat.me.';

export const metadata: Metadata = {
  title: { absolute: TITLE_ABSOLUTE },
  description: DESCRIPTION,
  alternates: {
    canonical: '/about-besat',
    languages: { 'fa-IR': '/about-besat', 'x-default': '/about-besat' },
  },
  keywords: [
    'درباره بعثت',
    'درباره بعثت مردم',
    'بعثت چیست',
    'بعثت مردم چیست',
    'besat.me',
    'besat',
    ...siteConfig.keywords,
  ],
  openGraph: {
    type: 'article',
    url: '/about-besat',
    locale: siteConfig.locale,
    siteName: siteConfig.name,
    title: TITLE_ABSOLUTE,
    description: DESCRIPTION,
    images: [
      {
        url: siteConfig.ogImage,
        secureUrl: `${siteConfig.url}${siteConfig.ogImage}`,
        width: 1200,
        height: 630,
        alt: siteConfig.ogImageAlt,
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE_ABSOLUTE,
    description: DESCRIPTION,
    images: [siteConfig.ogImage],
  },
};

// Static-generate; brand copy changes infrequently, so a long revalidate
// keeps the page cheap while still allowing hot-swap without redeploy.
export const revalidate = 3600;

export default function AboutBesatPage() {
  return (
    <>
      {/* ── Breadcrumb strip ─────────────────────────────────────────
       * Small, unobtrusive, single-row. Also visible for the
       * BreadcrumbList JSON-LD emitted by <AboutBesat/>. */}
      <nav aria-label="مسیر پیمایش" className="border-b border-ink-100 bg-white">
        <div className="container-edge flex items-center gap-1.5 py-3 text-[13px] text-ink-500">
          <Link href="/" className="font-medium transition-colors hover:text-brand-700">
            خانه
          </Link>
          <ChevronLeft className="h-3.5 w-3.5 text-ink-300" aria-hidden="true" />
          <span className="font-bold text-ink-900">درباره بعثت</span>
        </div>
      </nav>

      <AboutBesat />
    </>
  );
}
