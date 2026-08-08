import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { siteConfig } from '@/lib/site';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.slogan}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [...siteConfig.keywords],
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.organization.legalName }],
  creator: siteConfig.organization.legalName,
  publisher: siteConfig.organization.legalName,
  category: 'community',
  formatDetection: { telephone: false, email: false, address: false },
  alternates: {
    canonical: '/',
    languages: { 'fa-IR': '/' },
  },
  openGraph: {
    type: 'website',
    locale: siteConfig.locale,
    url: siteConfig.url,
    title: `${siteConfig.name} — ${siteConfig.slogan}`,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.name} — ${siteConfig.slogan}`,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
  },
  icons: {
    // Order matters: browsers pick the first supported entry.
    // .ico ships three internal sizes (16/32/48) for legacy tabs,
    // then crisp PNGs for modern browsers at 16/32/192/512, and
    // apple-touch-icon for iOS home-screen. The SVG placeholder
    // was removed when the graphic designer delivered the final
    // brand mark — the PNGs ARE the source of truth now.
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
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  verification: {
    // google: 'verification-token-here',
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

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${siteConfig.url}#organization`,
      name: siteConfig.name,
      alternateName: siteConfig.nameEn,
      url: siteConfig.url,
      logo: `${siteConfig.url}/logo.png`,
      sameAs: Object.values(siteConfig.social).filter(Boolean),
      foundingDate: siteConfig.organization.foundingDate,
      address: { '@type': 'PostalAddress', addressCountry: siteConfig.organization.addressCountry },
    },
    {
      '@type': 'WebSite',
      '@id': `${siteConfig.url}#website`,
      url: siteConfig.url,
      name: siteConfig.name,
      description: siteConfig.description,
      inLanguage: 'fa-IR',
      publisher: { '@id': `${siteConfig.url}#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: `${siteConfig.url}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        {/* Vazirmatn base font — user-pinned to v33.003 */}
        <link
          rel="stylesheet"
          type="text/css"
          href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css"
        />
        <Script
          id="ld-json-org"
          type="application/ld+json"
          strategy="afterInteractive"
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
