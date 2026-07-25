'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

/** Smooth-scroll handler for the in-page anchors.
 *  Next's <Link> only updates the URL hash; on a page that has been
 *  scroll-restored or where the hash doesn't change because the user is
 *  already on the route, the browser sometimes skips the scroll.
 *  This handler scrolls reliably to the target section using the native
 *  scrollIntoView() API + `behavior: 'smooth'`, accounts for the sticky
 *  header by reading the section's computed `scroll-margin-top`, and
 *  still updates the URL hash so links remain shareable. */
function scrollToAnchor(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
  if (!href.startsWith('#')) return;
  const id = href.slice(1);
  const el = typeof document !== 'undefined' ? document.getElementById(id) : null;
  if (!el) return;
  e.preventDefault();
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  // Keep the URL shareable without an extra history entry.
  if (typeof window !== 'undefined') {
    window.history.replaceState(null, '', href);
  }
}

type Activity = { href: string; label: string; icon: string; iconAlt: string };

// Order matches the on-page section order so the right-most card (RTL
// "first") is the first section the user scrolls to. Each href is an
// in-page anchor so clicking smooth-scrolls to that section instead of
// navigating away.
const ACTIVITIES: Activity[] = [
  { href: '#warfund',  label: 'پشتیبانی مالی جنگ',  icon: '/brand/icon-warfund.png',  iconAlt: 'پشتیبانی مالی جنگ' },
  { href: '#justice',  label: 'جایزه برای عدالت',   icon: '/brand/icon-r4j.png',      iconAlt: 'جایزه برای عدالت' },
  { href: '#education', label: 'قرارگاه آموزشی',    icon: '/brand/icon-lms.png',      iconAlt: 'قرارگاه آموزشی' },
  { href: '#kindness', label: 'دیوار مهربانی',      icon: '/brand/icon-kindness.png', iconAlt: 'دیوار مهربانی' },
  { href: '#tabyin',   label: 'جهاد تبیین',         icon: '/brand/icon-tabyin.png',   iconAlt: 'جهاد تبیین' },
];

/**
 * Activities panel — designer-faithful (v16).
 *
 * Highlights of this revision:
 *  - PANEL is shorter and uses fluid clamp() padding so it never feels
 *    too tall or too cramped at any viewport.
 *  - TITLE "اهم فعالیت‌ها" is pushed lower so it doesn't kiss the top
 *    wave edge of the asset.
 *  - SOFT TOP FADE inside the panel lets the hero photo above bleed
 *    gently through (masked off near the chevron notch).
 *  - CARDS overflow the panel's bottom edge ~50%. Each card has a
 *    BRAND-500 border (matches the panel teal exactly), perfect-square
 *    aspect ratio, icon constrained to 55% of card width with a hard
 *    max-width so it can NEVER spill out, and overflow-hidden so any
 *    edge case is clipped cleanly.
 *  - GRID uses minmax(0, 1fr) so columns truly share width equally and
 *    children with intrinsic sizes can't blow out the row.
 *  - LAYOUT scales smoothly with clamp() — fewer hard breakpoints means
 *    no more "jumpy" behaviour at intermediate widths.
 */
export function ActivitiesPanel() {
  return (
    <section
      /* ── Vertical rhythm — overlaps the hero photo on purpose ────────
       * The hero PNG is cropped at the defenders' knees, which reads as
       * a hard cut against the white page below. To smooth that seam
       * the section is PULLED UP with a negative margin so the green
       * wave panel + the ambient fade above it visually finish the
       * composition — the eye reads the group as standing INTO the
       * next chapter rather than being sliced off by it.
       *
       * Tuning note — this pass DIALS BACK the overlap by ~40 px per
       * breakpoint. The previous −72/−96/−128 values covered too much
       * of the hero photo (the wave panel reached almost to the
       * defenders' hips). The client asked for a LIGHTER overlap that
       * just kisses the very bottom of the photo, so we're now on:
       *
       *   phones          : −32 px   (just the boots)
       *   tablets (md)    : −48 px
       *   desktops (lg)   : −72 px   (largest hero → biggest overlap)
       *
       * Combined with the paired search-pill lift (GlobalSearch.tsx)
       * that adds ~30-40 px more clearance above the panel, this
       * restores the visual breathing room the composition needs. */
      className="relative -mt-[32px] md:-mt-[48px] lg:-mt-[72px]
                 pt-16 md:pt-20 lg:pt-24 pb-20 md:pb-24"
      aria-labelledby="activities-title"
    >
      {/* ── Ambient soft-white halo above the green panel ─────────────
       * Replaces the previous brand-teal shadow, which — on top of the
       * hero photo — read as a dark bruise across the defenders' legs
       * rather than a graceful hand-off. The new halo is a two-layer
       * additive white glow:
       *
       *   Layer 1  A wide radial ellipse centred on the panel's top
       *            edge. Pure white at the centre (0.95 α) fading to
       *            transparent at the outer edge, blurred to 24 px so
       *            the transition is buttery-soft on any DPI. This is
       *            what actually "erases" the hero cutout — it lays a
       *            soft veil over the bottom of the photo so the
       *            subjects appear to melt into the next chapter.
       *
       *   Layer 2  A shorter linear gradient (top→bottom, transparent
       *            → white 0.75) that gently biases the halo downward
       *            and re-establishes the pure-white page rhythm right
       *            above the green panel — keeps the "chapter break"
       *            legible without a hard rule line.
       *
       * z-0 keeps this beneath the search-bar pill (z-30) and its
       * portal-mounted dropdown (z-40), so the overlay never darkens
       * or obscures interactive UI. `pointer-events-none` so it never
       * intercepts clicks / hover. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 z-0
                   -top-[80px]  h-[220px]
                   md:-top-[100px] md:h-[260px]
                   lg:-top-[120px] lg:h-[300px]"
        style={{
          background:
            /* Layer 1 — luminous halo that dissolves the cutout edge */
            'radial-gradient(ellipse 90% 70% at 50% 90%,' +
              ' rgba(255,255,255,0.95) 0%,' +
              ' rgba(255,255,255,0.75) 20%,' +
              ' rgba(255,255,255,0.40) 45%,' +
              ' rgba(255,255,255,0.14) 70%,' +
              ' rgba(255,255,255,0)    100%),' +
            /* Layer 2 — subtle downward wash toward the panel */
            'linear-gradient(to bottom,' +
              ' rgba(255,255,255,0)    0%,' +
              ' rgba(255,255,255,0.20) 55%,' +
              ' rgba(255,255,255,0.65) 100%)',
          filter: 'blur(24px)',
        }}
      />

      {/* ── Cool brand-tint under-glow — very faint, sits UNDER the halo
       * and gives the composition a lifted, "atmospheric" feel instead
       * of a flat wipe. Uses --brand-500 at 6 % α over a large blur
       * radius so the eye reads it as depth, not colour. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 z-0
                   -top-[40px]  h-[120px]
                   md:-top-[50px] md:h-[150px]
                   lg:-top-[60px] lg:h-[180px]"
        style={{
          background:
            'radial-gradient(ellipse 65% 100% at 50% 100%,' +
              ' rgba(13,128,116,0.10) 0%,' +
              ' rgba(13,128,116,0.05) 45%,' +
              ' rgba(13,128,116,0)    100%)',
          filter: 'blur(30px)',
        }}
      />

      {/* z-10 lifts the actual panel content (green wave + cards)
       * above the hero photo (z-10 inside its own section, but the
       * section is a sibling — so a positive z-index here wins). The
       * search bar pill uses z-30 so it still floats above THIS panel
       * even where they overlap vertically at the "-mt" seam. */}
      <div className="container-edge relative z-10">
        <div className="relative">
          {/* Green wave panel (fluid sizing) */}
          <div
            className="relative text-white"
            style={{
              backgroundImage: 'url(/brand/activities-panel.png)',
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
              paddingTop: 'clamp(2rem, 5vw, 3rem)',
              paddingBottom: 'clamp(2.5rem, 5.5vw, 3.5rem)',
              paddingInline: 'clamp(1rem, 4vw, 3rem)',
              minHeight: 'clamp(140px, 18vw, 200px)',
            }}
          >
            <motion.h2
              id="activities-title"
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative text-center font-extrabold text-white
                         drop-shadow-[0_2px_8px_rgba(0,0,0,0.20)]"
              style={{
                marginTop: 'clamp(0.75rem, 2vw, 1.5rem)',
                fontSize: 'clamp(1.05rem, 2.4vw, 1.5rem)',
              }}
            >
              اهم فعالیت‌ها
            </motion.h2>
          </div>

          {/* CARDS — pulled up to overlap the panel bottom ~half.
              Switched from CSS Grid to flex+wrap+justify-center so any
              orphan card in the last row auto-centres at narrow widths
              (mobile 2-col: 5th card sits dead-centre; tablet 3-col:
              4th and 5th flank the centre). Card width is computed to
              match the parent gap so columns stay perfectly aligned.    */}
          <div
            className="relative flex flex-wrap justify-center"
            style={{
              gap: 'clamp(0.5rem, 1.4vw, 1.125rem)',
              marginTop: 'clamp(-2.5rem, -5vw, -1.75rem)',
              paddingInline: 'clamp(0.25rem, 1.5vw, 1.5rem)',
            }}
          >
            {ACTIVITIES.map((a, i) => (
              <motion.div
                key={a.href}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="min-w-0
                           w-[calc((100%-clamp(0.5rem,1.4vw,1.125rem))/2)]
                           min-[480px]:w-[calc((100%-2*clamp(0.5rem,1.4vw,1.125rem))/3)]
                           min-[760px]:w-[calc((100%-4*clamp(0.5rem,1.4vw,1.125rem))/5)]"
              >
                <a
                  href={a.href}
                  onClick={(e) => scrollToAnchor(e, a.href)}
                  className="group flex flex-col items-center justify-between
                             aspect-square w-full min-w-0 max-w-full overflow-hidden
                             bg-white text-ink-700
                             border-brand-500 hover:border-brand-600
                             shadow-[0_14px_28px_-16px_rgba(0,0,0,0.30)]
                             hover:-translate-y-1 hover:shadow-[0_22px_42px_-16px_rgba(0,0,0,0.35)]
                             transition-all duration-300"
                  style={{
                    borderWidth: 'clamp(2px, 0.35vw, 3px)',
                    borderStyle: 'solid',
                    borderRadius: 'clamp(0.875rem, 1.6vw, 1.5rem)',
                    padding:
                      'clamp(0.625rem, 1.6vw, 1.125rem) clamp(0.375rem, 1vw, 0.875rem) clamp(0.5rem, 1.2vw, 1rem)',
                  }}
                >
                  <div
                    className="flex-shrink-0 flex items-center justify-center group-hover:scale-110 transition-transform"
                    style={{
                      width: '55%',
                      maxWidth: '64px',
                      aspectRatio: '1 / 1',
                      marginTop: 'auto',
                    }}
                  >
                    <Image
                      src={a.icon}
                      alt={a.iconAlt}
                      width={64}
                      height={64}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p
                    className="font-semibold text-ink-700 text-center w-full
                               truncate min-[760px]:whitespace-normal min-[760px]:overflow-visible"
                    style={{
                      marginTop: 'auto',
                      fontSize: 'clamp(10px, 1.35vw, 14.5px)',
                      lineHeight: '1.25',
                      paddingTop: 'clamp(0.375rem, 1.2vw, 0.75rem)',
                    }}
                  >
                    {a.label}
                  </p>
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
