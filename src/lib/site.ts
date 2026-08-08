/**
 * Central site configuration — used by SEO, metadata, sitemap, JSON-LD, etc.
 * Single source of truth for branding strings.
 *
 * SEO KEYWORD STRATEGY
 * ────────────────────
 * The site's PRIMARY brand query is a single Persian word: «بعثت».
 * The exact-match phrase «بعثت مردم» is our secondary anchor.
 * `keywords`, `title`, `description`, and JSON-LD `alternateName` all
 * front-load these two tokens so search engines index them at the top
 * of the term-frequency table. Adjacent long-tails (جهاد تبیین، مددکاری،
 * دیوار مهربانی، ...) are appended after the primary tokens so the
 * SERP snippet reads naturally in Persian without keyword-stuffing.
 */

export const siteConfig = {
  name: 'بعثت مردم',
  shortName: 'بعثت',
  nameEn: 'Besat',
  nameFa: 'بعثت',
  // A short, memorable tagline that surfaces in the SERP subtitle.
  slogan: 'سامانه مردمی جهاد تبیین، مددکاری، آموزش و همبستگی',
  // 150–160 char description window is the Google SERP sweet spot.
  description:
    'بعثت مردم؛ پلتفرم یکپارچه مردمی برای جهاد تبیین، گزارش‌های مردمی، دیوار مهربانی، آموزش جهادی، مددکاری و حمایت از مظلومان جهان — به آدرس besat.me.',
  keywords: [
    // Brand — primary
    'بعثت',
    'بعثت مردم',
    'besat',
    'besat.me',
    'بعثت مردم ایران',
    // Product areas
    'جهاد تبیین',
    'مددکاری',
    'دیوار مهربانی',
    'گزارش مردمی',
    'گزارش‌های مردمی',
    'آموزش جهادی',
    'حمایت از مظلومان',
    'reward for justice',
    // Legacy
    'ستاد جنگ',
    // Long-tail intent
    'کمک به مردم فلسطین',
    'مردم ایران در برابر ظلم',
    'رسانه مردمی',
    'همبستگی مردمی',
  ],
  // Default to besat.me — the production domain — instead of a legacy
  // subdomain. Overridable at build time via NEXT_PUBLIC_SITE_URL for
  // staging / preview environments.
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://besat.me',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'https://besat.me',
  locale: 'fa_IR',
  direction: 'rtl' as const,
  themeColor: '#1F8A7A',
  ogImage: '/og/cover.png',
  ogImageAlt: 'بعثت مردم — سامانه مردمی جهاد تبیین و همبستگی',

  contact: {
    email: 'info@besat.me',
    phone: '',
  },

  social: {
    eitaa: 'https://eitaa.com/besat_me',
    telegram: '',
    instagram: '',
    youtube: '',
    aparat: '',
    twitter: '',
  },

  organization: {
    legalName: 'بعثت مردم',
    legalNameEn: 'Besat-e Mardom',
    foundingDate: '2025',
    addressCountry: 'IR',
  },
} as const;

export type SiteConfig = typeof siteConfig;
