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
      {/* Decorative dotted curves clipped to the section width, OUTSIDE the
          search bar's z-stack — so the dropdown can extend downward into
          the next section unimpeded. */}
      <div
        aria-hidden="true"
        className="hero-deco-clip absolute inset-0 overflow-hidden pointer-events-none z-0"
      >
        {/* Top-right dotted wave.
         *
         * Horizontal + vertical rules:
         *   • phones — parked in the top-right corner well below the
         *     header (`top-24`, `-right-4`, 280 px wide).
         *   • desktop — the client explicitly wants the wave to slide
         *     UNDER the hero photo so only the tip pokes out. The
         *     hero cutout is centred with `max-w-[680px]`, so its
         *     right edge lives at `50vw − 340px`. We push the wave
         *     ~60 px further inward so its trailing dots visibly slip
         *     behind the defender on the right (`z-0` here vs. hero's
         *     `z-10` guarantees the underlap). Vertical stays low
         *     (`md:top-10`) to match the approved composition. */}
        <Image
          src="/brand/wave-dotted-1.png"
          alt=""
          width={470} height={254}
          priority
          className="absolute top-24 md:top-10
                     -right-4 md:right-[calc(50%-280px)]
                     w-[280px] md:w-[420px]
                     opacity-95 select-none"
        />
        {/* Bottom-left dotted wave.
         *
         * Horizontal + vertical rules:
         *   • phones — hugs the search-pill area (`bottom-2`,
         *     `-left-2`, 200 px wide) always UNDER the cutout.
         *   • desktop — same "tip pokes out from under the hero"
         *     treatment as its sibling. Positioned relative to
         *     centre (`left: 50vw − 280px`) so the trailing dots
         *     slide behind the defender on the left. `md:bottom-4`
         *     keeps the wave riding along the boot line rather than
         *     the mid-torso. Mirrored horizontally with `scale-x-[-1]`
         *     so the wave sweeps INTO the composition. */}
        <Image
          src="/brand/wave-dotted-2.png"
          alt=""
          width={487} height={107}
          className="absolute bottom-2 md:bottom-4
                     -left-2 md:left-[calc(50%-280px)]
                     w-[200px] md:w-[420px]
                     opacity-85 select-none scale-x-[-1]"
        />
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
