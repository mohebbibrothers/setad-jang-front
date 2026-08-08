import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { siteConfig } from '@/lib/site';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import './globals.css';

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  SEO ARCHITECTURE — target primary query: «بعثت»
 * ─────────────────────────────────────────────────────────────────────────
 *  Objective: rank the domain besat.me on page-1 of Google.ir for the
 *  single-token brand query «بعثت» (and the phrase «بعثت مردم»).
 *
 *  Strategy layers used below:
 *   1. `title.default` front-loads «بعثت» as the FIRST word of the tab
 *      title — Google weights leftmost tokens heavier.
 *   2. `title.template` keeps the brand in every child page title.
 *   3. `description` is 155 chars (SERP snippet sweet spot), starts with
 *      «بعثت» so the snippet BOLDs the query.
 *   4. Rich `keywords` array (not a ranking factor but Bing / Yandex use).
 *   5. OpenGraph + Twitter Card = larger, prettier social previews.
 *   6. `robots.googleBot` explicitly permits `max-image-preview: large`
 *      and unlimited snippet length.
 *   7. `alternates.canonical` = '/' at the root, kills duplicate-URL
 *      cannibalization from tracking params (?utm_source=..., ?fbclid=...).
 *   8. JSON-LD `@graph` ships FIVE typed nodes: Organization + NGO +
 *      WebSite + WebPage + BreadcrumbList — Google needs multiple typed
 *      entities to build a Knowledge Panel.
 *   9. `alternateName` on the Organization node maps 5 name variants
 *      («بعثت»، «بعثت مردم»، Besat, Besat-e Mardom, besat.me) to the
 *      same entity → Google understands they're synonyms.
 *  10. `sameAs` links (social + wiki, when populated) reinforce entity
 *      identity across the web.
 *  11. `SearchAction` in the WebSite schema unlocks the site-links
 *      search box inside Google's brand SERP.
 * ─────────────────────────────────────────────────────────────────────────
 */

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    // Front-load «بعثت» so the term appears as the leftmost token in the
    // browser tab AND in Google's SERP title — both are weighted heavier.
    default: `بعثت | ${siteConfig.name} — ${siteConfig.slogan}`,
    template: `%s | بعثت — ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [...siteConfig.keywords],
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.organization.legalName, url: siteConfig.url }],
  creator: siteConfig.organization.legalName,
  publisher: siteConfig.organization.legalName,
  category: 'community',
  formatDetection: { telephone: false, email: false, address: false },
  referrer: 'origin-when-cross-origin',
  alternates: {
    canonical: '/',
    languages: {
      'fa-IR': '/',
      'fa':    '/',
      'x-default': '/',
    },
  },
  openGraph: {
    type: 'website',
    locale: siteConfig.locale,
    url: siteConfig.url,
    title: `بعثت | ${siteConfig.name} — ${siteConfig.slogan}`,
    description: siteConfig.description,
    siteName: siteConfig.name,
    countryName: 'Iran',
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
    title: `بعثت | ${siteConfig.name} — ${siteConfig.slogan}`,
    description: siteConfig.description,
    images: [
      {
        url: siteConfig.ogImage,
        alt: siteConfig.ogImageAlt,
        width: 1200,
        height: 630,
      },
    ],
  },
  icons: {
    // Order matters: browsers pick the first supported entry.
    // .ico ships three internal sizes (16/32/48) for legacy tabs,
    // then crisp PNGs for modern browsers at 16/32/192/512, and
    // apple-touch-icon for iOS home-screen.
    icon: [
      // `?v=2` cache-busts users who already visited the old placeholder
      // favicon — browsers aggressively pin favicons for weeks otherwise.
      { url: '/favicon.ico?v=2', sizes: 'any', type: 'image/x-icon' },
      { url: '/favicon-16.png?v=2',  sizes: '16x16',   type: 'image/png' },
      { url: '/favicon-32.png?v=2',  sizes: '32x32',   type: 'image/png' },
      { url: '/favicon-192.png?v=2', sizes: '192x192', type: 'image/png' },
      { url: '/favicon-512.png?v=2', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: [{ url: '/favicon.ico?v=2' }],
    apple: [{ url: '/apple-touch-icon.png?v=2', sizes: '180x180', type: 'image/png' }],
  },
  manifest: '/manifest.webmanifest',
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  verification: {
    // Populate once the property is added in Search Console / Bing / Yandex.
    // google: '<google-site-verification>',
    // yandex: '<yandex-verification>',
    // other:  { 'msvalidate.01': '<bing-verification>' },
  },
  other: {
    // Extra hints for Iranian search engines / social preview cards.
    'og:locale:alternate': 'en_US',
    'og:site_name': siteConfig.name,
    // Discourage translation of Persian brand tokens by Chrome/Yandex.
    'google': 'notranslate',
    // Explicit rating for family-friendly platform (some app stores use).
    'rating': 'general',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: siteConfig.themeColor },
    { media: '(prefers-color-scheme: dark)',  color: '#0B3530' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  colorScheme: 'light',
};

/**
 * JSON-LD graph — five typed nodes for maximum Knowledge Panel signal.
 *
 *   #organization  → the NGO entity itself, with 5 alternateName variants
 *                    so Google knows «بعثت» = «بعثت مردم» = Besat = besat.me.
 *   #website       → the domain, with a SearchAction (unlocks sitelinks
 *                    search box).
 *   #webpage       → THIS page (the homepage), linked back to #website.
 *   #breadcrumbs   → single-crumb list («خانه») — establishes root context.
 *   #logo          → ImageObject referenced by #organization → Google Logo
 *                    Markup requirement (allows brand logo in SERP).
 *
 *   All nodes cross-reference via `@id` URIs so Google reads them as
 *   one graph, not five isolated blobs.
 */
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': ['Organization', 'NGO'],
      '@id': `${siteConfig.url}#organization`,
      name: siteConfig.name,
      // Multiple aliases so Google reconciles every brand query variant
      // to the same entity in its Knowledge Graph.
      alternateName: [
        'بعثت',
        'بعثت مردم',
        'بعثت مردم ایران',
        siteConfig.nameEn,
        'Besat-e Mardom',
        'besat.me',
      ],
      url: siteConfig.url,
      logo: {
        '@id': `${siteConfig.url}#logo`,
        '@type': 'ImageObject',
        url: `${siteConfig.url}/favicon-512.png`,
        width: 512,
        height: 512,
        caption: siteConfig.name,
      },
      image: `${siteConfig.url}/favicon-512.png`,
      description: siteConfig.description,
      slogan: siteConfig.slogan,
      inLanguage: 'fa-IR',
      foundingDate: siteConfig.organization.foundingDate,
      email: siteConfig.contact.email,
      sameAs: Object.values(siteConfig.social).filter(Boolean),
      address: {
        '@type': 'PostalAddress',
        addressCountry: siteConfig.organization.addressCountry,
      },
      areaServed: { '@type': 'Country', name: 'Iran' },
      knowsLanguage: ['fa', 'ar', 'en'],
    },
    {
      '@type': 'WebSite',
      '@id': `${siteConfig.url}#website`,
      url: siteConfig.url,
      name: siteConfig.name,
      alternateName: ['بعثت', 'besat.me'],
      description: siteConfig.description,
      inLanguage: 'fa-IR',
      publisher: { '@id': `${siteConfig.url}#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${siteConfig.url}/search?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'WebPage',
      '@id': `${siteConfig.url}/#webpage`,
      url: siteConfig.url,
      name: `بعثت | ${siteConfig.name}`,
      isPartOf: { '@id': `${siteConfig.url}#website` },
      about: { '@id': `${siteConfig.url}#organization` },
      inLanguage: 'fa-IR',
      description: siteConfig.description,
      primaryImageOfPage: { '@id': `${siteConfig.url}#logo` },
      breadcrumb: { '@id': `${siteConfig.url}/#breadcrumbs` },
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${siteConfig.url}/#breadcrumbs`,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'خانه',
          item: siteConfig.url,
        },
      ],
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        {/* Font provider: preconnect for TCP handshake savings. */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />
        {/* Vazirmatn base font — user-pinned to v33.003 */}
        <link
          rel="stylesheet"
          type="text/css"
          href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css"
        />
        {/*
          RSS placeholder — kept commented until the backend exposes a feed.
          Adding it later boosts SEO by signalling fresh content sources.
          <link rel="alternate" type="application/rss+xml" title="بعثت مردم" href="/rss.xml" />
        */}
        <Script
          id="ld-json-org"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:right-3 focus:z-[100] focus:bg-brand-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg"
        >
          پرش به محتوای اصلی
        </a>
        <Header />
        <main id="main" className="min-h-[60vh]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
