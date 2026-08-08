'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { GlobalSearch } from './GlobalSearch';

/**
 * Hero — matches designer 1:1.
 * Centered defenders cutout, dotted-wave decorations mirrored,
 * with the production-grade GlobalSearch pill overlapping the bottom
 * edge. The search bar is wired to every public DRF endpoint via
 * `lib/global-search.ts` and renders a rich suggestions panel with
 * keyboard navigation, recents, trending, and a ⌘K/Ctrl+K hotkey.
 *
 * ────────────────────────────────────────────────────────────────────────
 *  IMPORTANT — overflow architecture
 *  The outer <section> is INTENTIONALLY NOT `overflow-hidden`. Earlier
 *  revisions clipped the section to hide the wave PNGs poking out past
 *  the viewport edges, but that also clipped the GlobalSearch dropdown
 *  panel (which overflows downward into the ActivitiesPanel area).
 *  Instead, decorations live inside a dedicated `.hero-deco-clip` div
 *  that has its OWN overflow-hidden — keeping the dropdown free to grow
 *  below the photo without being cut off.
 * ──────────────────────────────────────────────────────────────────────── */
export function Hero() {
  return (
    <section className="relative bg-white pt-6 md:pt-8 pb-0">
      {/* Decorative dotted streamers — implemented as inline SVGs so they
          can stretch to whatever viewport width without distorting the
          endpoints. Each streamer is anchored to one viewport edge (the
          "tail" of the dash) and extends inward past the hero silhouette
          by a fixed amount (the "tip" tucked BEHIND the defender).
          `preserveAspectRatio="none"` lets us decouple width from height
          so a single path adapts fluidly from 360 px phones to 2560 px
          ultrawides.
          Rendered inside `.hero-deco-clip` at z-0 so the hero photo
          (z-10) covers the tip while the tail streams freely toward
          the viewport corner. `text-[#d1d5e3]` sets `currentColor` for
          both strokes so the palette is tweakable in one place. */}
      <div
        aria-hidden="true"
        className="hero-deco-clip absolute inset-0 overflow-hidden pointer-events-none z-0 text-[#d1d5e3]"
      >
        {/* Top-right dotted streamer.
         *
         *  GEOMETRY
         *  ────────
         *   OUTER edge → viewport right edge (right: 0) at every size.
         *   INNER edge → tucks 130 px BEHIND the right defender on
         *                desktop (left: calc(50% + 210px), given the
         *                hero is `max-w-[680px]` so its right edge is
         *                at 50vw + 340px → 340 − 210 = 130 px underlap).
         *                On phones/tablets we underlap by ~45 % of
         *                viewport, which similarly hides the tip
         *                behind the right defender (mobile hero is
         *                effectively full-width).
         *
         *  VERTICAL
         *  ────────
         *   Placed HIGH (top-2 on desktop) — sits above its bottom-left
         *   partner to produce the requested right-high / left-low
         *   diagonal balance.
         *
         *  SVG PATH
         *  ────────
         *   A shallow S-curve from bottom-left (the tip) up to top-right
         *   (the tail). preserveAspectRatio="none" lets it flatten
         *   gracefully on wide viewports without pinching the ends.
         */}
        <svg
          viewBox="0 0 500 160"
          preserveAspectRatio="none"
          className="absolute top-14 md:top-2
                     right-0 left-[45%] md:left-[calc(50%+210px)]
                     h-[80px] md:h-[150px] opacity-95"
        >
          <path
            d="M 6 148
               C 90 138 150 122 210 98
               C 280 68 340 46 400 28
               C 440 18 468 13 494 10"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeDasharray="5 8"
            strokeLinecap="round"
            fill="none"
          />
        </svg>

        {/* Bottom-left dotted streamer.
         *
         *  Mirror of the top-right streamer in every axis:
         *    OUTER edge → viewport LEFT edge (left: 0).
         *    INNER edge → 130 px BEHIND the left defender on desktop
         *                 (right: calc(50% + 210px)); ~45 % of vw on
         *                 phones.
         *    VERTICAL   → low (bottom-4/bottom-6) to sit BELOW its
         *                 top-right partner, closing the diagonal.
         *
         *  The SVG path itself is designed as an already-mirrored
         *  companion (starts at TOP-LEFT tail, ends at BOTTOM-RIGHT
         *  tip) — no scale-x needed, which keeps stroke crispness
         *  identical to the right streamer.
         */}
        <svg
          viewBox="0 0 500 110"
          preserveAspectRatio="none"
          className="absolute bottom-3 md:bottom-6
                     left-0 right-[45%] md:right-[calc(50%+210px)]
                     h-[55px] md:h-[105px] opacity-90"
        >
          <path
            d="M 6 14
               C 70 20 130 30 190 44
               C 250 60 310 74 370 84
               C 420 92 460 96 494 100"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeDasharray="5 8"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>

      <div className="container-edge relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="relative mx-auto w-full max-w-[680px]"
        >
          <Image
            src="/brand/hero-defenders.png"
            alt="مدافعان وطن — بعثت مردم"
            width={1348}
            height={1008}
            priority
            sizes="(max-width: 768px) 90vw, 680px"
            className="relative z-10 w-full h-auto select-none"
          />
          {/*
            NOTE — the previous white fade-overlay was intentionally removed.
            The hero photo is already a transparent PNG (RGBA cut-out of the
            three defenders on a fully-transparent background). The overlay
            painted a semi-opaque white rectangle across the bottom 42 % of
            the picture, which — because the underlying pixels were already
            transparent — did NOT blend into the subjects; it just drew a
            hard rectangular border of paler white against the page's
            perfect white surface. On any display without a colour-management
            profile the boundary was visible as a faint square outline
            around the composition.

            The section's own bg-white surface (see `<section>` above)
            already provides the seamless canvas the designer wanted. The
            subjects now appear to stand ON the page rather than IN a
            floating rectangle.
          */}
        </motion.div>

        {/* Production-grade omni-search. Mounted in its own motion wrapper
            so we can animate it in, while keeping the GlobalSearch root
            free of transforms (which would create a new stacking context
            and let parent overflow clip the dropdown). */}
        {/* z-30 keeps the pill above the hero photo/decorations but
            strictly BELOW the sticky site header (z-50) — so when the
            page is scrolled, the header covers the pill instead of the
            pill floating on top of the primary navigation. */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="relative z-30"
        >
          <GlobalSearch variant="hero" />
        </motion.div>
      </div>
    </section>
  );
}
