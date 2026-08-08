'use client';

import Image from 'next/image';
import { SmartImage } from '@/components/ui/SmartImage';
import Link from 'next/link';
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SectionTitle } from './SectionTitle';
import { apiFetch } from '@/lib/api';
import { absoluteMediaUrl } from '@/lib/utils';
import { CampaignAlbum, type AlbumImage } from './CampaignAlbum';
import { EmptyState } from './EmptyState';

/**
 * ───────────────────────────────────────────────────────────────────────────
 * Justice / R4J section — designer-faithful (v4).
 *
 * Backend contract (apps/r4j):
 *   GET /api/v1/r4j/criminals/  → R4JPublicCriminalListSerializer
 *
 * Layout:
 *   - One row of FOUR criminal cards (no trophy CTA — moved to /r4j page)
 *   - Bottom pager arrows cycle additional pages of criminals
 *
 * Action button (UX-driven, applied colour-psychology + modern UI):
 *   - The orange pill is now a SPLIT-ACTION control. Hover / click /
 *     focus opens a tasteful glassy popover ABOVE the pill carrying two
 *     primary actions that come straight from the R4J product brief:
 *
 *        ┌──────────────────────────────┐
 *        │  🏆  ثبت جایزه          ←   │   accent-orange highlight
 *        ├──────────────────────────────┤   (action-leaning option)
 *        │  📋  گزارش اطلاعات      ←   │   brand-teal highlight
 *        └─────────────▼────────────────┘   (information-leaning option)
 *
 *        ┌──────────────────────────────┐
 *        │  ⚖  مشارکت در مجازات   ⌄   │   ← glossy pill, chev rotates
 *        └──────────────────────────────┘
 *
 *   Colour psychology:
 *     - Orange/red gradient on the trigger → urgency, justice, action.
 *     - 'ثبت جایزه' (commit) → accent-orange tint, matches the trigger.
 *     - 'گزارش اطلاعات' (inform) → brand-teal tint, signals reporting /
 *       trustworthy information path.
 *     - White card with hairline ring + heavy ambient shadow → premium
 *       'lifted glass' feel without competing with the photo.
 * ───────────────────────────────────────────────────────────────────────────
 */
export type CriminalCard = {
  slug: string;
  fullName: string;
  /** location tag (city / province / country) when the backend exposes it */
  pillLabel?: string;
  imageUrl?: string;
  /** Total active bounty pledged (Toman). */
  totalBounty?: number;
  bountiesCount?: number;
  /** Optional pre-loaded gallery (cover-substitute + sorted photos[]).
   *  When absent and the user taps the portrait, the section fetches
   *  /r4j/criminals/<slug>/ on-demand. */
  gallery?: AlbumImage[];
};

/* ───────────────────────────────────────────────────────────────────────── */
/*  Icons                                                                    */
/* ───────────────────────────────────────────────────────────────────────── */

// NOTE — the standalone GavelIcon and ChevronDownIcon that used to
// power the retired orange split-action pill were removed with that
// pill. If you need a lucide-style gavel/chevron elsewhere on this
// page in the future, import from `lucide-react` — the tree-shakeable
// version keeps bundle size in check.
function ChevronLeftIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}
         strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
function TrophyIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
         strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}
function InfoIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
         strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="13" y2="17" />
    </svg>
  );
}

/**
 * HammerIcon — a bespoke gavel-hammer drawn as TWO SVG groups so we can
 * animate the head independently from the handle.
 *
 *   • `<g data-hammer-head>`  → the mallet (rotates from the base of
 *                                the handle to fake a "swing").
 *   • `<g data-hammer-anvil>` → the strike-anvil (pulses when the head
 *                                lands, for the satisfying "hit" beat).
 *
 * Actual keyframes live in `<style>` inline below the icon so the
 * animation only fires when the hover-parent flips a data-attribute
 * (no JS state needed → zero re-renders → butter smooth).
 */
function HammerIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      {/* Anvil — the strike surface at the bottom */}
      <g data-hammer-anvil>
        <rect x="7"  y="26" width="18" height="3"   rx="1.4" fill="currentColor" opacity=".55" />
        <rect x="10" y="23" width="12" height="3"   rx="1"   fill="currentColor" opacity=".85" />
      </g>
      {/* Hammer — head (rectangle) + handle (rounded stick).
          Pivot for the swing is at the TAIL of the handle (top-right in
          RTL viewport), so the head arcs down toward the anvil. */}
      <g data-hammer-head style={{ transformOrigin: '22px 6px' }}>
        {/* Handle */}
        <rect
          x="9" y="5" width="14" height="3.2" rx="1.6"
          fill="currentColor"
          transform="rotate(-32 16 6.6)"
        />
        {/* Head (mallet) */}
        <g transform="rotate(-32 16 6.6)">
          <rect x="2.5" y="1.8" width="8" height="9.5" rx="1.8" fill="currentColor" />
          {/* Highlight strip on the mallet — reads as a metallic gleam */}
          <rect x="3.5" y="2.6" width="6" height="1.3" rx="0.6" fill="#ffffff" opacity=".28" />
        </g>
      </g>
    </svg>
  );
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  Hammer menu — nameplate-mounted "gavel" that fans out on hover / tap.    */
/*                                                                           */
/*  Design intent                                                            */
/*  ─────────────                                                            */
/*  The old orange split-action pill lived INSIDE the portrait and                                                   *
 *  visually competed with the criminal's face. The client asked for a       *
 *  cleaner solution: relocate the entire action affordance to the green     *
 *  nameplate at the bottom of the card, using a delightful hammer          *
 *  icon that "swings down" whenever the user hovers, focuses, or taps      *
 *  it. The popover — same content as before (ثبت جایزه + گزارش               *
 *  اطلاعات) — fans upward, over the photo, so the plate + name stay        *
 *  untouched.                                                              *
 *                                                                          *
 *  Animation                                                               *
 *  ─────────                                                               *
 *    • The hammer head rotates from a pivot at the tail of the handle,    *
 *      so it arcs down like a real strike (rest = -32° → strike = +8°).    *
 *    • On rest → strike we also apply a subtle brightness/scale bump.     *
 *    • The anvil beneath receives a matching "hit-pulse" (scale-y            *
 *      compresses for 90 ms) synced to the head landing.                  *
 *    • All keyframes are declarative CSS keyed to a `data-active`         *
 *      attribute on the wrapper, so there's zero React re-render churn.   *
 *    • prefers-reduced-motion honoured via the standard media query.       *
 *  ────────────────────────────────────────────────────────────────────── */

function HammerMenu({ slug, fullName }: { slug: string; fullName: string }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Click / touch outside closes the menu
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent | TouchEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown, { passive: true });
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
    };
  }, [open]);

  // Hover-delay-close so the cursor can slip from trigger → menu
  const enter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const leave = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 160);
  };

  return (
    <div
      ref={wrapRef}
      onMouseEnter={enter}
      onMouseLeave={leave}
      onFocus={enter}
      onBlur={leave}
      data-active={open ? 'true' : undefined}
      className="justice-hammer relative shrink-0"
    >
      {/* ── Popover ─────────────────────────────────────────────────
       * Anchored to the trigger button and fans UPWARD (bottom-full)
       * so it opens into the photo area, never below the plate. */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26, mass: 0.55 }}
            role="menu"
            aria-label={`${fullName} — گزینه‌های مشارکت در مجازات`}
            className="absolute bottom-[calc(100%+12px)] right-1/2 translate-x-1/2
                       w-[190px] sm:w-[210px]
                       bg-white rounded-2xl overflow-hidden
                       shadow-[0_24px_60px_-12px_rgba(0,0,0,.42),0_0_0_1px_rgba(217,222,229,.75)]
                       z-30"
            style={{ direction: 'rtl' }}
          >
            {/* Title strip — establishes context so the two options aren't
                floating unlabeled above the card. */}
            <div className="px-3.5 pt-2.5 pb-1.5 text-[10.5px] font-extrabold text-ink-500
                            tracking-wide uppercase">
              مشارکت در مجازات
            </div>

            {/* Option 1: ثبت جایزه */}
            <Link
              href={`/r4j/${slug}/bounty`}
              role="menuitem"
              className="group/item relative flex items-center gap-2.5 px-3.5 h-11
                         hover:bg-accent-500/[0.07] transition-colors duration-150"
            >
              <span
                className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0
                           bg-accent-500/[0.12] text-accent-600
                           group-hover/item:bg-accent-500 group-hover/item:text-white
                           group-hover/item:shadow-[0_6px_14px_-4px_rgba(229,82,20,.5)]
                           transition-all duration-200"
              >
                <TrophyIcon className="w-3.5 h-3.5" />
              </span>
              <span className="flex-1 text-right text-[12.5px] font-extrabold text-ink-800
                               group-hover/item:text-accent-700 transition-colors">
                ثبت جایزه
              </span>
              <ChevronLeftIcon className="w-3.5 h-3.5 text-ink-400
                                          group-hover/item:text-accent-600
                                          group-hover/item:-translate-x-0.5
                                          transition-all duration-200" />
            </Link>

            <div className="mx-2 h-px bg-gradient-to-l from-transparent via-ink-100 to-transparent" />

            {/* Option 2: گزارش اطلاعات */}
            <Link
              href={`/r4j/${slug}/report`}
              role="menuitem"
              className="group/item relative flex items-center gap-2.5 px-3.5 h-11
                         hover:bg-brand-500/[0.07] transition-colors duration-150"
            >
              <span
                className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0
                           bg-brand-500/[0.12] text-brand-600
                           group-hover/item:bg-brand-500 group-hover/item:text-white
                           group-hover/item:shadow-[0_6px_14px_-4px_rgba(13,128,116,.5)]
                           transition-all duration-200"
              >
                <InfoIcon className="w-3.5 h-3.5" />
              </span>
              <span className="flex-1 text-right text-[12.5px] font-extrabold text-ink-800
                               group-hover/item:text-brand-700 transition-colors">
                گزارش اطلاعات
              </span>
              <ChevronLeftIcon className="w-3.5 h-3.5 text-ink-400
                                          group-hover/item:text-brand-600
                                          group-hover/item:-translate-x-0.5
                                          transition-all duration-200" />
            </Link>

            {/* Tail — small diamond pointing DOWN to the hammer icon */}
            <div
              aria-hidden="true"
              className="absolute right-1/2 translate-x-1/2 -bottom-1.5 w-3 h-3 rotate-45 bg-white"
              style={{ boxShadow: '1px 1px 0 rgba(217,222,229,.7)' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Trigger — the hammer button ────────────────────────────── */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`مشارکت در مجازات ${fullName}`}
        className="justice-hammer-btn relative inline-flex items-center justify-center
                   w-8 h-8 rounded-full text-white
                   bg-white/10 hover:bg-white/25 focus:bg-white/25
                   ring-1 ring-white/25 hover:ring-white/60
                   transition-[background-color,box-shadow,transform] duration-200
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80
                   hover:shadow-[0_6px_16px_-4px_rgba(0,0,0,.35)]"
      >
        <HammerIcon className="w-[18px] h-[18px] relative z-10 drop-shadow-[0_1px_0_rgba(0,0,0,.35)]" />
        {/* Impact halo — tiny ring that pings out when the head strikes */}
        <span
          aria-hidden="true"
          className="justice-hammer-halo pointer-events-none absolute inset-0 rounded-full
                     ring-2 ring-white/70 opacity-0"
        />
      </button>

    </div>
  );
}

/**
 * Hammer choreography styles.
 *
 * These live at module scope (in a plain <style> block emitted once
 * from HAMMER_STYLES below) instead of styled-jsx because styled-jsx
 * doesn't play nicely with the multi-line Tailwind template strings we
 * use elsewhere in this file — the SWC transform gets confused by the
 * embedded newlines and mis-tokenises the classNames. A single global
 * style block is simpler, cheaper (zero per-render cost), and easier
 * to reason about.
 */
const HAMMER_STYLES = `
[data-hammer-head]  { transform-box: fill-box; transform-origin: 22px 6px;  transition: transform 240ms cubic-bezier(.7,.05,.2,1); }
[data-hammer-anvil] { transform-box: fill-box; transform-origin: 16px 28px; transition: transform 180ms ease-out; }

.justice-hammer:hover [data-hammer-head],
.justice-hammer:focus-within [data-hammer-head],
.justice-hammer[data-active='true'] [data-hammer-head] {
  animation: hammerSwing 900ms cubic-bezier(.65,.05,.2,1) infinite;
}
.justice-hammer:hover [data-hammer-anvil],
.justice-hammer:focus-within [data-hammer-anvil],
.justice-hammer[data-active='true'] [data-hammer-anvil] {
  animation: anvilPulse 900ms cubic-bezier(.65,.05,.2,1) infinite;
}
.justice-hammer:hover .justice-hammer-halo,
.justice-hammer:focus-within .justice-hammer-halo,
.justice-hammer[data-active='true'] .justice-hammer-halo {
  animation: hammerHalo 900ms ease-out infinite;
}

@keyframes hammerSwing {
  0%   { transform: rotate(0deg); }
  40%  { transform: rotate(-14deg); }
  58%  { transform: rotate(28deg); }
  72%  { transform: rotate(20deg); }
  100% { transform: rotate(0deg); }
}
@keyframes anvilPulse {
  0%, 50%, 100% { transform: scaleY(1); }
  58%           { transform: scaleY(.55); }
  72%           { transform: scaleY(1.05); }
  85%           { transform: scaleY(1); }
}
@keyframes hammerHalo {
  0%, 50%       { transform: scale(1);    opacity: 0; }
  60%           { transform: scale(1.05); opacity: .85; }
  100%          { transform: scale(1.55); opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .justice-hammer:hover [data-hammer-head],
  .justice-hammer:focus-within [data-hammer-head],
  .justice-hammer[data-active='true'] [data-hammer-head],
  .justice-hammer:hover [data-hammer-anvil],
  .justice-hammer:focus-within [data-hammer-anvil],
  .justice-hammer[data-active='true'] [data-hammer-anvil],
  .justice-hammer:hover .justice-hammer-halo,
  .justice-hammer:focus-within .justice-hammer-halo,
  .justice-hammer[data-active='true'] .justice-hammer-halo {
    animation: none;
  }
}
`;

/* ───────────────────────────────────────────────────────────────────────── */
/*  Card                                                                     */
/* ───────────────────────────────────────────────────────────────────────── */

function CriminalCardView({
  p, delay = 0, onOpenAlbum,
}: {
  p: CriminalCard;
  delay?: number;
  onOpenAlbum: (p: CriminalCard) => void;
}) {
  // The photo prefers — in order:
  //   1. an explicit primary_photo from the list endpoint (imageUrl)
  //   2. the first gallery photo (so seeded card art shows)
  const thumbUrl = p.imageUrl ?? p.gallery?.[0]?.url;
  const galleryHint = p.gallery?.length ?? (p.imageUrl ? 1 : 0);
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, delay }}
      /* Width math matches parent flex gap (0.75rem mobile, 1.25rem md+):
         - mobile (< 768px): 2 cols → calc((100% - 0.75rem)/2)
         - md+   (≥ 768px): 4 cols → calc((100% - 3*1.25rem)/4)
         Combined with parent flex+wrap+justify-center an orphan in the
         last row auto-centres. min-w-0 keeps card content shrinkable. */
      className="group flex flex-col bg-white rounded-[28px] overflow-hidden isolate
                 shadow-[0_2px_10px_-4px_rgba(15,20,32,.06)]
                 hover:shadow-[0_22px_44px_-22px_rgba(11,53,48,.22)]
                 hover:-translate-y-0.5 transition-all duration-300
                 w-[calc((100%-0.75rem)/2)] md:w-[calc((100%-3*1.25rem)/4)] min-w-0"
    >
      {/* Photo — relative + overflow-hidden so the popover can pop INTO
          the upper part of the portrait without ever leaving the card. */}
      <div className="relative aspect-[3/4] bg-ink-200 overflow-hidden">
        <button
          type="button"
          onClick={() => onOpenAlbum(p)}
          aria-label={`نمایش آلبوم تصاویر ${p.fullName}`}
          className="absolute inset-0 block cursor-zoom-in focus:outline-none
                     focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <SmartImage
            src={thumbUrl}
            alt={p.fullName}
            variant="criminal"
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Gallery-count chip when there's more than one image */}
          {galleryHint > 1 && (
            <span
              className="absolute bottom-2 left-2 inline-flex items-center gap-1
                         px-1.5 h-5 rounded-md bg-black/55 backdrop-blur-sm
                         text-white text-[10.5px] font-extrabold tabular-nums
                         ring-1 ring-white/20 z-[2]"
              aria-hidden="true"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"
                   strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-5-5L5 21" />
              </svg>
              {galleryHint.toLocaleString('fa-IR')}
            </span>
          )}
        </button>

        {/* NOTE — the standalone orange "مشارکت در مجازات" pill that used
            to live here was retired at the client's request. Its action
            surface was moved to the green nameplate below where it lives
            next to the criminal's name via <HammerMenu/>. That keeps
            the portrait clean and gives the CTA a warmer, more integrated
            home. */}
      </div>

      {/* ── Green name plate ────────────────────────────────────────
          A single flex row: the criminal's name is a link to the
          detail page (as before) and the hammer trigger sits to its
          left (RTL) as a peer child of the plate. */}
      <div
        className="relative flex items-center gap-2 px-3 pt-3 pb-3 bg-brand-500
                   rounded-b-[28px] group/plate transition-colors
                   hover:bg-brand-600"
      >
        {/* Hammer trigger — peer of the name link so its own hover
            state stays isolated from the plate's hover state (both
            can highlight independently). */}
        <HammerMenu slug={p.slug} fullName={p.fullName} />

        {/* The name itself remains the primary click target for
            "open detail page" — full-width so tap area stays generous. */}
        <Link
          href={`/r4j/${p.slug}`}
          className="flex-1 min-w-0 text-white text-center
                     text-[14px] md:text-[14.5px] font-extrabold leading-6
                     truncate"
          title={p.fullName}
        >
          {p.fullName}
        </Link>

        {/* Symmetry spacer — mirrors the hammer button's footprint so
            the name reads truly centred instead of drifting toward one
            edge. Non-interactive. */}
        <span aria-hidden="true" className="shrink-0 w-8 h-8" />
      </div>
    </motion.article>
  );
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  Section                                                                  */
/* ───────────────────────────────────────────────────────────────────────── */

export function JusticeSection({ criminals }: { criminals: CriminalCard[] }) {
  const PAGE_SIZE = 4;
  const totalPages = Math.max(1, Math.ceil(criminals.length / PAGE_SIZE));
  const [page, setPage] = useState(0);
  const visible = useMemo(
    () => criminals.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [criminals, page],
  );

  // No-op when there's only one page — pair with `disabled={...}` below.
  const prev = () => { if (totalPages <= 1) return; setPage((p) => (p - 1 + totalPages) % totalPages); };
  const next = () => { if (totalPages <= 1) return; setPage((p) => (p + 1) % totalPages); };

  // ── Album state ────────────────────────────────────────────────────
  // NOTE — we intentionally use the GENERIC `subtitle` shape here.
  // The previous version stuffed the criminal's location into a
  // `sponsor` string and let the album render "مددکار: تهران" — which
  // is semantically wrong for R4J. R4J records have no sponsor; their
  // secondary axis is their public location (country/province/city),
  // controlled per-field by compute_visibility_map on the backend.
  const [album, setAlbum] = useState<{
    open: boolean;
    title: string;
    subtitle?: { label: string; value: string };
    images: AlbumImage[];
    loading: boolean;
  }>({ open: false, title: '', images: [], loading: false });

  const [photoCache, setPhotoCache] = useState<Record<string, AlbumImage[]>>({});

  const closeAlbum = useCallback(() => setAlbum((a) => ({ ...a, open: false })), []);

  const buildImages = useCallback(
    (p: CriminalCard, extra?: AlbumImage[]): AlbumImage[] => {
      const out: AlbumImage[] = [];
      if (p.imageUrl) out.push({ url: p.imageUrl, alt: p.fullName });
      if (extra && extra.length) {
        for (const im of extra) {
          if (!out.some((o) => o.url === im.url)) out.push(im);
        }
      }
      return out;
    },
    [],
  );

  // Compose the R4J album's secondary line from whatever location
  // fields the backend has surfaced (which may all be null when the
  // per-field visibility map hides them from public consumers).
  const buildR4JSubtitle = useCallback(
    (loc: string | undefined | null): { label: string; value: string } | undefined => {
      const v = (loc ?? '').trim();
      return v ? { label: 'موقعیت', value: v } : undefined;
    },
    [],
  );

  const openAlbum = useCallback(async (p: CriminalCard) => {
    const seedSubtitle = buildR4JSubtitle(p.pillLabel);

    if (p.gallery && p.gallery.length) {
      setAlbum({
        open: true, title: p.fullName, subtitle: seedSubtitle,
        images: buildImages(p, p.gallery), loading: false,
      });
      return;
    }
    const cached = photoCache[p.slug];
    if (cached) {
      setAlbum({
        open: true, title: p.fullName, subtitle: seedSubtitle,
        images: buildImages(p, cached), loading: false,
      });
      return;
    }
    setAlbum({
      open: true, title: p.fullName, subtitle: seedSubtitle,
      images: buildImages(p), loading: true,
    });
    try {
      // Detail endpoint mirrors R4JPublicCriminalDetailSerializer:
      //   photos[]  (id, image, caption, is_primary, order)
      //   country / province / city  (visibility-controlled → may be null)
      // We refresh the subtitle from the detail payload so the album
      // reflects the freshest public-visible location, then fall back
      // to the seed pillLabel if visibility hides everything.
      const detail = await apiFetch<{
        photos?: Array<{ id: number; image: string; caption?: string; is_primary?: boolean; order?: number }>;
        country?: string | null;
        province?: string | null;
        city?: string | null;
      }>(
        `/r4j/criminals/${encodeURIComponent(p.slug)}/`,
        { revalidate: 600, tags: [`criminal:${p.slug}`] },
      );
      const fetched: AlbumImage[] = (detail.photos ?? [])
        .slice()
        // primary first, then ordered ascending — matches Meta.ordering
        // on R4JCriminalPhoto so the album mirrors the backend order.
        .sort((a, b) => {
          if (!!b.is_primary !== !!a.is_primary) return b.is_primary ? 1 : -1;
          return (a.order ?? 0) - (b.order ?? 0);
        })
        .map((g) => ({ url: absoluteMediaUrl(g.image) ?? '', alt: g.caption || p.fullName }))
        .filter((g) => !!g.url);
      const detailLoc = [detail.city, detail.province, detail.country]
        .filter((s): s is string => !!s && s.trim().length > 0)
        .join('، ');
      const freshSubtitle = buildR4JSubtitle(detailLoc) ?? seedSubtitle;
      setPhotoCache((prev) => ({ ...prev, [p.slug]: fetched }));
      setAlbum((a) => a.open
        ? { ...a, subtitle: freshSubtitle, images: buildImages(p, fetched), loading: false }
        : a);
    } catch {
      setAlbum((a) => a.open ? { ...a, loading: false } : a);
    }
  }, [photoCache, buildImages, buildR4JSubtitle]);

  return (
    <section className="section-y section-alt" id="justice">
      {/*
        One-shot injection of the hammer-icon keyframes for every card
        under this section. Idempotent (CSS rules with identical names
        just overwrite the same declaration), so even if the section
        appears twice on some future layout, we don't cause style bloat.
      */}
      <style dangerouslySetInnerHTML={{ __html: HAMMER_STYLES }} />

      <div className="container-edge">
        <SectionTitle
          title="جایزه‌ای برای عدالت"
          description="عدالت با صدای مردم بلندتر است. هر اطلاعات شما یک سند، هر جایزه‌ی شما یک گام رو به‌جلو در پرونده‌ی متهمان جنایت‌های جنگی."
        />

        {/* Inner wrapper — transparent (was `bg-white` + rounded panel).
            The client asked to drop the white panel inside the greige
            section so the cards sit DIRECTLY on the `section-alt`
            surface. We keep the wrapper as a `<div>` so the padding
            below still gives the cards breathing room and the pager
            layout stays untouched — only the visible chrome is gone. */}
        <div className="pt-2 pb-2 md:pt-4 md:pb-4">
          {/* flex+wrap+justify-center so orphan cards in the last row
              centre instead of clinging to the RTL-right edge. */}
          {criminals.length === 0 ? (
            <EmptyState
              title="هنوز پرونده‌ای منتشر نشده"
              description="به‌محض انتشار پرونده‌های متهمان جنایت‌های جنگی، اینجا قابل مشاهده خواهد بود."
              iconPath="m14.5 12.5-8 8a2.119 2.119 0 1 1-3-3l8-8 M16 16l6-6 M8 8l6-6 M9 7l8 8 M21 11-8-8"
            />
          ) : (
            <div className="flex flex-wrap justify-center gap-3 md:gap-5">
              <AnimatePresence mode="wait" initial={false}>
                {visible.map((p, i) => (
                  <CriminalCardView key={`${page}-${p.slug}`} p={p} delay={i * 0.06} onOpenAlbum={openAlbum} />
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Pager — lives INSIDE the off-white panel, centred below the cards */}
          <div className="flex items-center justify-center gap-4 mt-6 md:mt-8">
            <button
              type="button"
              aria-label="قبلی"
              onClick={prev}
              disabled={totalPages <= 1}
              className="relative w-12 h-12 rounded-full hover:scale-110 active:scale-95
                         transition-transform duration-200 disabled:opacity-40
                         disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <Image src="/brand/pager-arrow-prev.png" alt="" fill sizes="48px" className="object-contain" />
            </button>
            <button
              type="button"
              aria-label="بعدی"
              onClick={next}
              disabled={totalPages <= 1}
              className="relative w-12 h-12 rounded-full hover:scale-110 active:scale-95
                         transition-transform duration-200 disabled:opacity-40
                         disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <Image src="/brand/pager-arrow-next.png" alt="" fill sizes="48px" className="object-contain" />
            </button>
          </div>
        </div>

        {/* See-all CTA — matches the WarFund pattern for cross-section
            consistency. Pulls the user out of the home preview and into
            the full R4J case browser. */}
        <div className="flex justify-center mt-6">
          <Link
            href="/#justice"
            className="inline-flex items-center gap-2 h-12 px-7 rounded-full
                       bg-white border-2 border-brand-500 text-brand-700 font-extrabold text-[14px]
                       hover:bg-brand-50 transition-colors"
          >
            <span>مشاهده همه پرونده‌ها</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </Link>
        </div>
      </div>

      {/* ── Album lightbox ─────────────────────────────────────────── */}
      <CampaignAlbum
        open={album.open}
        onClose={closeAlbum}
        title={album.title}
        subtitle={album.subtitle}
        images={album.images}
        loading={album.loading}
      />
    </section>
  );
}
