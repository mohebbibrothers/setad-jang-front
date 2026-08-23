import Image from 'next/image';
import Link from 'next/link';
import { Instagram, Twitter, Linkedin, Send } from 'lucide-react';
import { BackToTop } from './BackToTop';

/**
 * Footer v3 — center-aligned, premium presentation.
 *
 * What changed vs v2:
 *   • Column content is fully CENTRED (was right-aligned). Titles get a
 *     short brand-tinted underline rule that doubles as a visual anchor.
 *   • The card sits on a soft brand-mint glow that fades in from the
 *     ink-50 base — adds depth without being noisy.
 *   • Bottom strip is restructured into three perfectly-balanced lanes
 *     (brand · copy · social) using a 1fr / auto / 1fr grid so the
 *     copyright always reads dead-centre regardless of column widths.
 *   • Social icons get an interactive disc treatment with a brand glow
 *     on hover — feels alive, not static.
 *   • A tiny "back to top" pill anchors the very bottom for ergonomics.
 */

/**
 * Footer navigation.
 *
 * ⚠️  In the homepage-only milestone the standalone routes for the
 * domain areas (/madadkar, /r4j, /lms, /kindness-wall, /public-reports,
 * /about, /contact, /faq, /privacy, /terms, /support) are NOT built.
 * Every hover on those links used to trigger a Next.js RSC prefetch
 * that resolved to 404, filling the browser network tab with red
 * rows (client-reported issue).
 *
 * To keep the footer useful without shipping dead links, we route
 * every domain item to its in-page anchor on the homepage (`/#warfund`,
 * `/#justice`, …). The two "corporate" columns that had nothing to
 * point at (about / contact / faq / privacy / terms / support) were
 * temporarily retired — the columns will come back the moment those
 * pages exist.
 */
const COLS = [
  {
    title: 'نحوه ثبت‌نام در پویش',
    links: [
      { label: 'پشتیبانی مالی جنگ', href: '/#warfund' },
      { label: 'دیوار مهربانی', href: '/#kindness' },
      { label: 'قرارگاه آموزشی', href: '/#education' },
    ],
  },
  {
    title: 'دسترسی سریع',
    links: [
      { label: 'جهاد تبیین', href: '/#tabyin' },
      { label: 'جایزه‌ای برای عدالت', href: '/#justice' },
      { label: 'گزارش‌های مردمی', href: '/#reports' },
      // Dedicated brand/about page — link exists so crawlers discover
      // it from every page of the site (footer is a canonical crawl
      // seed) and users can reach a proper "about us" story in one hop.
      { label: 'درباره بعثت', href: '/about-besat' },
    ],
  },
];

const SOCIALS = [
  { Icon: Instagram, label: 'اینستاگرام', href: '#' },
  { Icon: Twitter, label: 'توییتر', href: '#' },
  { Icon: Linkedin, label: 'لینکدین', href: '#' },
  { Icon: Send, label: 'تلگرام', href: '#' },
];

export function Footer() {
  return (
    // ── Full-bleed presentation ────────────────────────────────────
    // Previous layout centred the footer card at `max-w-[1280px]`
    // with rounded top corners. The redesign requires the footer to
    // stretch the FULL viewport width — no side gutters, no rounded
    // corners on the outer surface. We keep an inner `container-edge`
    // so the type still respects the site's page rhythm and never
    // hits the very edge of the screen on wide displays.
    <footer className="relative bg-ink-50">
      <div className="relative w-full overflow-hidden pb-7 pt-12 md:pb-9 md:pt-16">
        {/* Soft brand glow — adds depth without distracting from the type */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 h-[260px] w-[80%] -translate-x-1/2 rounded-full opacity-[0.16] blur-3xl"
          style={{
            background:
              'radial-gradient(ellipse at center, #25C5BA 0%, #0D8074 45%, transparent 70%)',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(13,128,116,0.55) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        />

        {/* All footer content lives inside the site's standard content
          container so type/columns keep the same page rhythm as the
          rest of the site, while the surrounding surface still bleeds
          edge-to-edge behind them. */}
        <div className="container-edge relative">
          {/* Footer columns — fully centred.
           * Grid intentionally caps at md:grid-cols-2 for now because the
           * corporate columns (about/faq/privacy/terms/support) were
           * retired until their pages exist. A 4-col grid with only 2
           * items would leave two empty columns on desktop; 2-col with
           * a max content width keeps the block visually balanced. */}
          <div className="relative mx-auto grid max-w-2xl grid-cols-1 gap-10 text-center sm:grid-cols-2 md:gap-16">
            {COLS.map((c) => (
              <nav key={c.title} aria-label={c.title} className="flex flex-col items-center">
                <h4 className="mb-1 text-[14.5px] font-extrabold text-ink-900">{c.title}</h4>
                {/* Brand-tinted underline rule — short, decorative anchor */}
                <span
                  aria-hidden="true"
                  className="mb-5 block h-[3px] w-9 rounded-full bg-gradient-to-l from-brand-500 to-mint-500"
                />
                <ul className="space-y-3">
                  {c.links.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="relative inline-block text-[13.5px] font-medium text-ink-500 transition-colors duration-200 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:origin-center after:scale-x-0 after:bg-brand-500 after:transition-transform after:duration-300 after:content-[''] hover:text-brand-700 hover:after:scale-x-100"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>

          {/* Decorative divider — gradient hairline that fades at the edges */}
          <div
            aria-hidden="true"
            className="relative mt-12 h-px md:mt-14"
            style={{
              background:
                'linear-gradient(to left, transparent, rgba(13,128,116,0.22), transparent)',
            }}
          />

          {/* Bottom strip — 3-lane perfectly balanced grid */}
          <div className="relative mt-7 grid grid-cols-1 items-center gap-6 md:mt-8 md:grid-cols-[1fr_auto_1fr]">
            {/* Lane 1 — brand mark, left-aligned in LTR / right-aligned in RTL */}
            <div className="flex justify-center md:justify-start">
              <Link href="/" aria-label="بعثت مردم" className="inline-flex">
                <Image
                  src="/brand/logo-mark.png"
                  alt="بعثت مردم"
                  width={185}
                  height={70}
                  className="h-12 w-auto"
                  priority={false}
                />
              </Link>
            </div>

            {/* Lane 2 — copyright, true centre */}
            <p className="text-center text-[12.5px] font-medium leading-7 text-ink-500">
              © ۱۴۰۵ بعثت مردم — تمامی حقوق محفوظ است.
              <span className="hidden md:inline"> · طراحی و توسعه با مهر برای مردم ایران.</span>
            </p>

            {/* Lane 3 — socials */}
            <div className="flex items-center justify-center gap-2.5 md:justify-end">
              {SOCIALS.map(({ Icon, label, href }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  className="group relative flex h-10 w-10 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-500 shadow-[0_2px_8px_-3px_rgba(15,20,32,.08)] transition-all duration-300 hover:-translate-y-0.5 hover:border-transparent hover:text-white hover:shadow-[0_10px_24px_-6px_rgba(13,128,116,.45)]"
                >
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  />
                  <Icon className="relative h-[18px] w-[18px]" strokeWidth={2.1} />
                </Link>
              ))}
            </div>
          </div>

          {/* Back-to-top pill — interactive client island so window.scrollTo
            with smooth behaviour always fires, even if the URL hash is
            already #main or the browser doesn't honour the hash jump.   */}
          <BackToTop />
        </div>
        {/* /container-edge */}
      </div>
    </footer>
  );
}
