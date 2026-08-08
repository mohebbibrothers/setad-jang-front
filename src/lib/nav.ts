/**
 * Site-wide navigation catalogue.
 *
 * ⚠️ Source-of-truth policy
 * ---------------------------
 * As of the "homepage-only" milestone, the only rendered routes are:
 *     /                (single-page hub — every section lives here)
 *     /search          (SSR search results)
 *     /tabyin/*        (Tabyin index + detail + submission)
 *
 * Everything else is intentionally NOT built yet. To keep the header,
 * footer and any megamenu component pointing at links that actually
 * resolve, we route all "domain area" nav items to in-page anchors on
 * the homepage (`/#warfund`, `/#justice`, …) rather than dead
 * top-level paths. When the standalone pages are eventually shipped,
 * flip the `href` fields here to the real routes and every consumer
 * updates for free.
 */

export type NavItem = {
  label: string;
  href: string;
  /** True when the destination is an in-page anchor. Consumers use
   *  this to short-circuit into `scrollIntoView({ behavior: 'smooth' })`
   *  instead of a full page-load navigation. */
  anchor?: boolean;
  description?: string;
  badge?: string;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const primaryNav: NavItem[] = [
  { label: 'صفحه اصلی',      href: '/' },
  { label: 'پشتیبانی مالی جنگ', href: '/#warfund',   anchor: true },
  { label: 'جایزه‌ای برای عدالت', href: '/#justice',   anchor: true },
  { label: 'قرارگاه آموزشی',    href: '/#education', anchor: true },
  { label: 'دیوار مهربانی',     href: '/#kindness',  anchor: true },
  { label: 'جهاد تبیین',        href: '/#tabyin',    anchor: true },
  { label: 'گزارش مردمی',       href: '/#reports',   anchor: true },
];

export const footerNav: NavGroup[] = [
  {
    label: 'فعالیت‌ها',
    items: [
      { label: 'پشتیبانی مالی جنگ', href: '/#warfund',   anchor: true },
      { label: 'جایزه‌ای برای عدالت', href: '/#justice',   anchor: true },
      { label: 'قرارگاه آموزشی',   href: '/#education', anchor: true },
      { label: 'دیوار مهربانی',    href: '/#kindness',  anchor: true },
      { label: 'جهاد تبیین',       href: '/#tabyin',    anchor: true },
    ],
  },
  {
    label: 'مشارکت',
    items: [
      { label: 'گزارش مردمی', href: '/#reports', anchor: true },
      { label: 'جست‌وجو',     href: '/search' },
    ],
  },
];
