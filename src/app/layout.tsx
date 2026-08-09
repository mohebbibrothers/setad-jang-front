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
      // `?v=4` cache-busts users who already visited the old placeholder
      // favicon — browsers aggressively pin favicons for weeks otherwise.
      { url: '/favicon.ico?v=4', sizes: 'any', type: 'image/x-icon' },
      { url: '/favicon-16.png?v=4',  sizes: '16x16',   type: 'image/png' },
      { url: '/favicon-32.png?v=4',  sizes: '32x32',   type: 'image/png' },
      { url: '/favicon-192.png?v=4', sizes: '192x192', type: 'image/png' },
      { url: '/favicon-512.png?v=4', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: [{ url: '/favicon.ico?v=4' }],
    apple: [{ url: '/apple-touch-icon.png?v=4', sizes: '180x180', type: 'image/png' }],
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    // Force iOS home-screen tap to launch fullscreen (no Safari
    // chrome), matching the Android PWA experience.
    capable: true,
    // A tight brand title under the icon on the iOS home screen.
    // Longer titles get iOS-clipped mid-word; this fits every
    // launcher size cleanly.
    title: 'بعثت',
    // Match the maskable icon's white ground so the Safari status
    // bar sits on the same surface as the launch splash and our
    // Vazirmatn overlay.
    statusBarStyle: 'default',
  },
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
        {/*
          ── PWA / installed-app splash overlay ───────────────────
          Full-screen brand splash that covers the entire viewport
          from the FIRST byte of HTML the browser parses, and
          fades away the instant the page has painted. Because it
          is inline in server-rendered HTML — with inline styles,
          inline CSS and inline JS — it's visible BEFORE any
          React hydration, before any font load, before any
          Tailwind class parse. That's the only way to hide
          Chrome's native PWA splash (which the client called
          "the old screen that flashes first").

          Design:
            - White ground matching the maskable icon so there's
              no colour flash between Chrome's icon-only splash
              and this overlay.
            - Logo mark 128 px, gentle scale-in.
            - "بعثت مردم" in Vazirmatn ExtraBold + a whisper-quiet
              slogan "همراه با مردم ایران" underneath.
            - `#app-splash-boot` inline stylesheet sets the base
              layout so styles apply from paint #1 — no FOUC
              between the raw HTML and the eventual Tailwind pass.
        */}
        <style
          id="app-splash-boot"
          dangerouslySetInnerHTML={{ __html: `
            #app-splash{position:fixed;inset:0;z-index:2147483647;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;font-family:'Vazirmatn',Tahoma,sans-serif;direction:rtl;pointer-events:none;transition:opacity .35s ease-out}
            #app-splash img{width:128px;height:128px;animation:appSplashPop .55s cubic-bezier(.2,.7,.2,1) both}
            #app-splash .lbl{display:flex;flex-direction:column;align-items:center;gap:6px;animation:appSplashFadeUp .55s .15s cubic-bezier(.2,.7,.2,1) both}
            #app-splash .n{font-size:22px;font-weight:800;letter-spacing:.5px;color:#0B3530}
            #app-splash .s{font-size:12.5px;font-weight:500;color:#6B7280;letter-spacing:.3px}
            #app-splash.hide{opacity:0}
            html.app-splash-lock,html.app-splash-lock body{overflow:hidden}
            @keyframes appSplashPop{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}
            @keyframes appSplashFadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
            @media (prefers-reduced-motion:reduce){#app-splash img,#app-splash .lbl{animation:none!important}}
          ` }}
        />
        <div id="app-splash" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/favicon-maskable-512.png?v=4" alt="" width={128} height={128} />
          <div className="lbl">
            <div className="n">بعثت مردم</div>
            <div className="s">همراه با مردم ایران</div>
          </div>
        </div>
        {/*
          Splash-remover — inline script so it runs BEFORE the
          React bundle even starts to download. Locks scroll while
          the overlay is up, fades on `load`, hard-removes after
          400 ms, plus a 1600 ms safety net in case `load` never
          fires (offline, blocked resource, etc).
        */}
        <script
          dangerouslySetInnerHTML={{ __html: `
            (function(){var h=document.documentElement;h.classList.add('app-splash-lock');
            function done(){var el=document.getElementById('app-splash');if(!el)return;el.classList.add('hide');h.classList.remove('app-splash-lock');setTimeout(function(){if(el&&el.parentNode)el.parentNode.removeChild(el)},400)}
            if(document.readyState==='complete')requestAnimationFrame(function(){setTimeout(done,150)});
            else window.addEventListener('load',function(){requestAnimationFrame(function(){setTimeout(done,150)})},{once:true});
            setTimeout(done,1600);})();
          ` }}
        />
        {/*
          Service worker — registered to bulldoze Chrome's PWA
          install-time cache after a deploy. The SW itself has
          no fetch handler (see /sw.js) so it can't ever serve
          stale content; on every activate it wipes every cache
          namespace, claims all open clients, AND broadcasts a
          'SW_ACTIVATED' message so we can reload the page ONCE
          — that's the only way to force Chrome to re-read the
          manifest (icons, background_color, short_name) it
          snapshotted at install time. Without the reload,
          Chrome keeps showing the old splash & icon until the
          user uninstalls and reinstalls the PWA (which we
          absolutely cannot ask real users to do).

          The reload is gated by a sessionStorage flag so it
          can never fire twice in the same window, and a
          `controllerchange` listener catches the case where
          the SW updates while the page is already open.
        */}
        <script
          dangerouslySetInnerHTML={{ __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(function(reg){
                  try { reg.update(); } catch (e) {}
                }).catch(function(){});
                // When the new SW takes control (or explicitly
                // tells us it just activated) reload the page
                // exactly once so Chrome picks up the fresh
                // manifest / shell / icons.
                var reloadOnce = function() {
                  try {
                    if (sessionStorage.getItem('__sw_reloaded__')) return;
                    sessionStorage.setItem('__sw_reloaded__', '1');
                    window.location.reload();
                  } catch (e) { /* private mode etc — skip */ }
                };
                navigator.serviceWorker.addEventListener('message', function(ev){
                  if (ev && ev.data && ev.data.type === 'SW_ACTIVATED') reloadOnce();
                });
                var reloaded = false;
                navigator.serviceWorker.addEventListener('controllerchange', function(){
                  if (reloaded) return;
                  reloaded = true;
                  reloadOnce();
                });
              });
            }
          ` }}
        />

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
