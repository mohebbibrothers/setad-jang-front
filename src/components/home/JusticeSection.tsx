'use client';

import Image from 'next/image';
import { SmartImage } from '@/components/ui/SmartImage';
import Link from 'next/link';
import { useState, useMemo, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
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
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
function TrophyIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
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
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="13" y2="17" />
    </svg>
  );
}

// NOTE — MiniGavelIcon (the tiny gavel bullet that used to sit next
// to "مشارکت در مجازات" in the popover header) was retired at the
// client's request; the title is now cleaner without it. The Lucide
// path is preserved in git history if a future revision wants it back.

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
        <rect x="7" y="26" width="18" height="3" rx="1.4" fill="currentColor" opacity=".55" />
        <rect x="10" y="23" width="12" height="3" rx="1" fill="currentColor" opacity=".85" />
      </g>
      {/* Hammer — head (rectangle) + handle (rounded stick).
          Pivot for the swing is at the TAIL of the handle (top-right in
          RTL viewport), so the head arcs down toward the anvil. */}
      <g data-hammer-head style={{ transformOrigin: '22px 6px' }}>
        {/* Handle */}
        <rect
          x="9"
          y="5"
          width="14"
          height="3.2"
          rx="1.6"
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

/**
 * The popover is rendered via `createPortal` into `document.body` so that:
 *   • It escapes the card's `overflow-hidden` (which was clipping it on
 *     mobile when the card sits near the viewport edge).
 *   • It escapes every ancestor `transform` / `filter` that would
 *     otherwise create a new stacking context and force z-index arithmetic.
 *   • Its position is computed from the trigger's `getBoundingClientRect`
 *     each frame the menu is open, so it stays glued to the hammer
 *     button through scrolling, resizing, or layout shifts.
 * The popover is sized responsively for phones and pinned to the
 * viewport gutters so it never overflows offscreen at either edge.
 */
type PopoverPos = { top: number; left: number; caretLeft: number; placement: 'top' | 'bottom' };

function HammerMenu({ slug, fullName }: { slug: string; fullName: string }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<PopoverPos | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Render portals only client-side (SSR-safe).
  useEffect(() => {
    setMounted(true);
  }, []);

  /*
   * ── DESKTOP hover polling — the final, bulletproof fix ─────────
   *
   * The whole class of "hammer keeps swinging after click" bugs
   * comes from ONE core fragility: React's synthetic `onMouseLeave`
   * / `onPointerLeave` do NOT always fire when the cursor's real
   * position changes without a mousemove — e.g. after a click that
   * shifts layout, after the button's `blur()` steals focus back,
   * after `preventDefault()` on mousedown swallows the natural
   * event sequence.  Any missed leave-event = animation stuck ON
   * with no way to turn it OFF short of the user clicking away.
   *
   * The definitive fix is to STOP RELYING on the browser to tell
   * us when the cursor leaves the button.  Instead, once the menu
   * is open, we start a global `pointermove` listener and check on
   * every frame whether the cursor is still geometrically inside
   * either the trigger OR the popover.  The moment it leaves both
   * bounding rects, we close.  Same for `pointerdown` outside the
   * two — instant close.
   *
   * This bypasses every synthetic-event edge case (focus stealing,
   * layout thrash, hidden overlays, iframe boundaries, browser
   * bugs) because we're reading the true cursor coordinate from
   * the native event on every move.  Hover-capable pointer only —
   * touch devices continue to use the tap-toggle model below.
   */
  useEffect(() => {
    if (!open) return;
    // Skip on touch — the tap-toggle model already handles those.
    if (
      typeof window !== 'undefined' &&
      !window.matchMedia('(hover: hover) and (pointer: fine)').matches
    ) {
      return;
    }
    /**
     * `isInside` accepts an optional `pad` that inflates the target
     * rectangle by that many pixels on every side. We use it to build
     * a "hover corridor" that stitches the trigger button and the
     * floating popover into ONE continuous hit-region.
     *
     * WHY THE CORRIDOR EXISTS
     * ───────────────────────
     * The popover is anchored 10 px above the button (see `gap = 10`
     * in `measure()`), so there's a 10 px vertical gutter of empty
     * space between them. When the user slides the cursor from the
     * button UP toward the popover, that gutter is momentarily NOT
     * covered by either element — pointer polling then says "you're
     * outside both", closes the menu, and the user never reaches the
     * options. That's the bug.
     *
     * The fix: pad EACH rectangle by 16 px (a hair more than the
     * 10 px gap) so their inflated bounds overlap along the gutter.
     * As long as the cursor stays in that fatter combined region
     * the menu stays open. The instant the cursor leaves BOTH fat
     * regions (i.e. clearly walks away from the widget), we close.
     * 16 px is a comfortable Fitts-law tolerance without letting the
     * menu linger absurdly long after the user has clearly left.
     */
    /**
     * `check(x, y)` decides whether the cursor is still inside the
     * "hover safe zone" made of THREE overlapping rectangles:
     *
     *    ┌────────────────────────────────────┐
     *    │  1. popover rect (padded)          │
     *    │  ┌────────────────────────────┐    │
     *    │  │ [ ثبت جایزه ]              │    │
     *    │  │ [ گزارش اطلاعات ]          │    │
     *    │  └────────────────────────────┘    │
     *    └────────────────────────────────────┘
     *      ▲                                     ← 2. BRIDGE rect  (invisible corridor
     *      │                                        stretching from popover's bottom
     *      │                                        edge to button's top edge, spanning
     *      │                                        the FULL horizontal extent of
     *      │                                        both — no matter which side the
     *      │                                        cursor slides through it always
     *      │                                        stays inside this bridge).
     *      ▼
     *                             ┌──┐
     *                             │🔨│  ← 3. trigger rect (padded)
     *                             └──┘
     *
     * The bridge fixes the "cursor closes menu mid-slide" bug fully:
     * even if the cursor takes a diagonal that skirts the padded
     * button/popover, it still lands in the bridge and the menu
     * stays open.  The instant the cursor leaves ALL THREE regions
     * (i.e. clearly walks away from the widget) we close and blur.
     */
    const PAD = 8;
    function inRect(x: number, y: number, l: number, t: number, r: number, b: number) {
      return x >= l && x <= r && y >= t && y <= b;
    }
    function check(x: number, y: number) {
      const btn = btnRef.current?.getBoundingClientRect();
      const pop = popRef.current?.getBoundingClientRect();
      if (!btn) return;

      // 1. padded button
      if (inRect(x, y, btn.left - PAD, btn.top - PAD, btn.right + PAD, btn.bottom + PAD)) return;

      // If the popover hasn't been laid out yet (React portal /
      // AnimatePresence mount is asynchronous — the first
      // pointermove after `open` flips to true typically arrives
      // BEFORE `popRef.current` has a real bounding rect), we
      // MUST NOT close: the cursor is on its way to a menu that
      // doesn't yet know its geometry. Bail out and let the next
      // frame — with a real `pop` rect — do the check.
      if (!pop || pop.width === 0 || pop.height === 0) return;

      // 2. padded popover
      if (inRect(x, y, pop.left - PAD, pop.top - PAD, pop.right + PAD, pop.bottom + PAD)) return;

      // 3. bridge rectangle between the two — spans the union of
      //    their horizontal extents PLUS an extra `PAD` on top and
      //    bottom so a diagonal cursor path is caught cleanly even
      //    if it briefly exits both element rects.
      const bridgeLeft = Math.min(btn.left, pop.left) - PAD;
      const bridgeRight = Math.max(btn.right, pop.right) + PAD;
      const bridgeTop = Math.min(btn.top, pop.top) - PAD;
      const bridgeBottom = Math.max(btn.bottom, pop.bottom) + PAD;
      if (inRect(x, y, bridgeLeft, bridgeTop, bridgeRight, bridgeBottom)) return;

      // Cursor is decisively outside the whole widget → close.
      setOpen(false);
      btnRef.current?.blur();
    }
    function onMove(e: PointerEvent) {
      if (e.pointerType !== 'mouse') return;
      check(e.clientX, e.clientY);
    }
    function onDown(e: PointerEvent) {
      if (e.pointerType !== 'mouse') return;
      check(e.clientX, e.clientY);
    }
    document.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerdown', onDown, { passive: true, capture: true });
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerdown', onDown, {
        capture: true,
      } as EventListenerOptions);
    };
  }, [open]);

  // ── TOUCH outside-tap closer ───────────────────────────────────
  //
  // Desktop cursor tracking above already handles outside-click on
  // hover-capable pointers. This effect covers the touch branch:
  // any tap that lands outside both the trigger and the popover
  // closes the menu and blurs the button so no phantom :hover
  // latches to it after the touch.
  useEffect(() => {
    if (!open) return;
    function onTouch(e: TouchEvent) {
      const target = e.target as Node;
      if (btnRef.current?.contains(target)) return;
      if (popRef.current?.contains(target)) return;
      setOpen(false);
      btnRef.current?.blur();
    }
    document.addEventListener('touchstart', onTouch, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onTouch);
    };
  }, [open]);

  // ── ESC closes the menu ────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        btnRef.current?.blur();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  /**
   * Compute the popover position relative to the viewport.
   *
   *   • Vertically: anchored to sit ABOVE the trigger with a 10 px gap
   *     (`triggerTop - popHeight - 10`). We defer the measurement to a
   *     `useLayoutEffect` after the popover mounts so we know its real
   *     rendered height (not a guessed constant).
   *   • Horizontally: centred on the trigger. Clamped to a 12 px
   *     viewport gutter on both sides so it never bleeds off screen on
   *     narrow phones. If the popover has to shift to stay in-viewport,
   *     we compute where the trigger centre lands INSIDE the popover
   *     and place the little caret (diamond tail) exactly there — so
   *     the tail always points at the hammer, even after a shift.
   */
  /**
   * Compute popover placement with automatic flip.
   *
   *   HORIZONTAL: centred on the trigger, then clamped to a 10 px
   *   viewport gutter on both sides so the popover NEVER touches the
   *   screen edge on narrow phones. The caret is repositioned to
   *   whatever offset the trigger falls at INSIDE the shifted popover.
   *
   *   VERTICAL: PREFER top-placement (popover above the plate, opens
   *   upward into the card). If the popover would collide with the
   *   viewport top (< 8 px), FLIP to bottom-placement (opens
   *   downward, below the plate). This is the fix for "popover
   *   truncated on mobile" — on a phone with a fully-scrolled card,
   *   there just isn't room above the plate, so we open below instead.
   */
  const measure = useCallback(() => {
    const btn = btnRef.current;
    const pop = popRef.current;
    if (!btn || !pop) return;

    const btnRect = btn.getBoundingClientRect();
    const popWidth = pop.offsetWidth;
    const popHeight = pop.offsetHeight;
    const gutter = 10;
    const gap = 10;
    const edgeSafe = 8;
    const vpWidth = document.documentElement.clientWidth;
    const vpHeight = window.innerHeight;

    // ── Horizontal (with clamp) ────────────────────────────────────
    const triggerCentre = btnRect.left + btnRect.width / 2;
    let left = triggerCentre - popWidth / 2;
    left = Math.max(gutter, Math.min(left, vpWidth - popWidth - gutter));

    // ── Vertical with automatic flip ───────────────────────────────
    const topAbove = btnRect.top - popHeight - gap;
    const topBelow = btnRect.bottom + gap;
    let placement: 'top' | 'bottom' = 'top';
    let top = topAbove;
    if (topAbove < edgeSafe) {
      // Not enough headroom → flip to below the button.
      placement = 'bottom';
      top = topBelow;
      // If BOTH orientations overflow (extreme case: taller popover
      // than viewport), pin to whichever side has more room.
      if (topBelow + popHeight > vpHeight - edgeSafe && topAbove >= edgeSafe - popHeight) {
        placement = 'top';
        top = Math.max(edgeSafe, topAbove);
      }
    }

    // Caret offset from popover left — always sits under the trigger.
    let caretLeft = triggerCentre - left;
    caretLeft = Math.max(14, Math.min(caretLeft, popWidth - 14));

    setPos({ top, left, caretLeft, placement });
  }, []);

  // Measure once mounted, then on scroll / resize while open.
  useLayoutEffect(() => {
    if (!open) return;
    measure();
    const onScroll = () => measure();
    const onResize = () => measure();
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll, { capture: true } as EventListenerOptions);
      window.removeEventListener('resize', onResize);
    };
  }, [open, measure]);

  // Open-on-hover. Closing is delegated to the pointer-polling effect
  // above, which detects the moment the cursor leaves BOTH the trigger
  // and the popover — that path is immune to the missed-`mouseleave`
  // browser edge cases that used to leave the animation stuck on.
  const enter = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setOpen(true);
  };

  /**
   * ── PORTALED POPOVER ────────────────────────────────────────────
   * Lives outside the section tree, so `overflow-hidden` on the card
   * cannot clip it. Same hover-grace behaviour: entering the popover
   * cancels the close timer, leaving it schedules another close.
   */
  const popover =
    mounted && open
      ? createPortal(
          <AnimatePresence>
            <motion.div
              key="hammer-popover"
              ref={popRef}
              // No onMouseLeave here — the pointer-polling effect above
              // already handles the "cursor left both trigger and popover"
              // condition with more reliable geometry, not the fragile
              // synthetic React event.
              onMouseEnter={enter}
              initial={{ opacity: 0, y: 8, scale: 0.94 }}
              animate={{ opacity: pos ? 1 : 0, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 380, damping: 26, mass: 0.55 }}
              role="menu"
              aria-label={`${fullName} — گزینه‌های مشارکت در مجازات`}
              // `w-[min(260px,calc(100vw-20px))]` guarantees the popover
              // never exceeds the viewport minus a 10 px gutter on either
              // side, even on the narrowest phones. 260 px is the sweet
              // spot for two touch-sized rows without feeling cramped.
              // The bottom breathing gap («فاصله زیر گزارش اطلاعات») is now
              // baked into the last Link's own `pb-2.5` instead of the
              // popover container. Reason: the container-level padding
              // created a white strip below the option that the hover
              // tint couldn't reach — moving the padding INSIDE the Link
              // means the whole area (row + gap) is part of the same
              // hoverable surface, so `hover:bg-brand-500/[0.07]` flushes
              // continuously from the divider all the way to the popover's
              // rounded bottom edge, no pseudo-elements required.
              className="fixed z-[80] w-[min(260px,calc(100vw-20px))] overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_-12px_rgba(0,0,0,.42),0_0_0_1px_rgba(217,222,229,.75)]"
              style={{
                direction: 'rtl',
                top: pos?.top ?? -9999,
                left: pos?.left ?? -9999,
                // transformOrigin follows placement so the spring animation
                // grows FROM the caret (which sits on the hammer side of the
                // popover), not from the far edge.
                transformOrigin: pos?.placement === 'bottom' ? 'top center' : 'bottom center',
              }}
            >
              {/* ── Title strip ─────────────────────────────────────────
            Redesigned per client feedback: bigger, centred, brand-
            tinted surface so it reads as an intentional header, not
            a forgotten line of muted text. The lead-in gavel glyph
            was retired at the client's request — the title now
            stands on its own, cleaner and more legible. */}
              <div className="relative flex items-center justify-center border-b border-brand-100/70 bg-gradient-to-b from-brand-50/70 to-white px-4 pb-3 pt-3">
                <span className="text-[14px] font-extrabold leading-none text-ink-900">
                  مشارکت در مجازات
                </span>
              </div>

              {/* Option 1: ثبت جایزه */}
              <Link
                href={`/r4j/${slug}/bounty`}
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  btnRef.current?.blur();
                }}
                className="group/item relative flex h-11 items-center gap-2.5 px-3.5 transition-colors duration-150 hover:bg-accent-500/[0.07]"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-500/[0.12] text-accent-600 transition-all duration-200 group-hover/item:bg-accent-500 group-hover/item:text-white group-hover/item:shadow-[0_6px_14px_-4px_rgba(229,82,20,.5)]">
                  <TrophyIcon className="h-3.5 w-3.5" />
                </span>
                <span className="flex-1 text-right text-[12.5px] font-extrabold text-ink-800 transition-colors group-hover/item:text-accent-700">
                  ثبت جایزه
                </span>
                <ChevronLeftIcon className="h-3.5 w-3.5 text-ink-400 transition-all duration-200 group-hover/item:-translate-x-0.5 group-hover/item:text-accent-600" />
              </Link>

              <div className="mx-2 h-px bg-gradient-to-l from-transparent via-ink-100 to-transparent" />

              {/* Option 2: گزارش اطلاعات
               *
               * The 10 px breathing gap that used to live on the popover
               * container (`pb-2.5`) is now baked INTO this Link as
               * `pb-[18px]` (8 px inner vertical-centre-pad + 10 px
               * requested breathing). That way the whole area — row +
               * gap — is part of ONE hover surface, so
               * `hover:bg-brand-500/[0.07]` flushes continuously from the
               * divider all the way down to the popover's rounded bottom
               * edge. No white strip, no pseudo-element workaround. Row
               * still reads as h-11 because the icon (28 px) + the 8 px
               * top-pad = 36 px inner content aligned to the top-centre;
               * text is `items-center` so it sits on the same baseline
               * as the icon regardless of the added bottom-pad.
               */}
              <Link
                href={`/r4j/${slug}/report`}
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  btnRef.current?.blur();
                }}
                // ─────────────────────────────────────────────────────────
                //  ONE hover surface covers the whole option
                // ─────────────────────────────────────────────────────────
                //  block + pb-2.5 → the 10 px breathing gap is INSIDE the
                //  Link, so hover paints it as part of the same fill. The
                //  inner <div> reproduces the original h-11 row so nothing
                //  visually shifts. Hover tint bumped from /[0.07] to
                //  /[0.1] (matching the same-weight brand row on Option 1
                //  when the palette accumulates ring+icon+text) so the
                //  fill is unambiguously visible even in the thin gutter.
                className="group/item relative block pb-2.5 transition-colors duration-150 hover:bg-brand-500/[0.1]"
              >
                <div className="flex h-11 items-center gap-2.5 bg-transparent px-3.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-500/[0.12] text-brand-600 transition-all duration-200 group-hover/item:bg-brand-500 group-hover/item:text-white group-hover/item:shadow-[0_6px_14px_-4px_rgba(13,128,116,.5)]">
                    <InfoIcon className="h-3.5 w-3.5" />
                  </span>
                  <span className="flex-1 text-right text-[12.5px] font-extrabold text-ink-800 transition-colors group-hover/item:text-brand-700">
                    گزارش اطلاعات
                  </span>
                  <ChevronLeftIcon className="h-3.5 w-3.5 text-ink-400 transition-all duration-200 group-hover/item:-translate-x-0.5 group-hover/item:text-brand-600" />
                </div>
              </Link>

              {/* Tail — dynamic-position diamond that always points at the
            hammer, even after the popover shifts to stay in-viewport.
            Renders BELOW the popover for the default `top` placement
            (menu above the button) and ABOVE the popover for `bottom`
            placement (menu below the button). The tiny box-shadow
            uses opposite diagonals in each case so the outer hairline
            ring around the popover stays visually continuous with
            the caret's outer edge. */}
              {pos?.placement === 'bottom' ? (
                <div
                  aria-hidden="true"
                  className="absolute -top-1.5 h-3 w-3 -translate-x-1/2 rotate-45 bg-gradient-to-b from-brand-50/70 to-brand-50/70"
                  style={{
                    left: pos?.caretLeft ?? '50%',
                    boxShadow: '-1px -1px 0 rgba(178,205,201,.55)',
                  }}
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="absolute -bottom-1.5 h-3 w-3 -translate-x-1/2 rotate-45 bg-white"
                  style={{
                    left: pos?.caretLeft ?? '50%',
                    boxShadow: '1px 1px 0 rgba(217,222,229,.7)',
                  }}
                />
              )}
            </motion.div>
          </AnimatePresence>,
          document.body,
        )
      : null;

  return (
    <div
      data-active={open ? 'true' : undefined}
      className="justice-hammer relative shrink-0"
      // Hover lifecycle for desktop.
      //
      // Deliberately NOT handling onFocus / onBlur here anymore.
      //
      // Reasoning: a mouse click on the trigger transfers keyboard
      // focus to the button, which used to bubble to this wrapper's
      // onFocus and re-open the menu we were trying to close. We
      // already suppress the focus transfer inside `<button>` with
      // `onMouseDown` → `preventDefault()`, but leaving the onFocus
      // handler here would still fire for keyboard Tab, and Tab-
      // opening a menu should be an explicit Enter/Space action, not
      // a side-effect of navigating past the icon. Keyboard users
      // now get an explicit `onKeyDown` handler on the button itself
      // that toggles open/close — the exact same UX contract as
      // Space/Enter on any other menubutton.
      onMouseEnter={enter}
      // onMouseLeave omitted — see the pointer-polling effect above,
      // which is the authoritative close mechanism on desktop.
    >
      {/* ── Trigger — the hammer button ──────────────────────────────
       *
       *  DESKTOP (hover-capable pointers)
       *  ───────────────────────────────
       *  The animation + popover are driven ENTIRELY by the wrapper's
       *  `onMouseEnter` / `onMouseLeave` handlers above. The click
       *  handler is therefore a no-op on desktop — hover opens, un-
       *  hover closes, and there's no way to leave the icon in a
       *  half-open state where the choreography keeps running after
       *  the menu is gone.
       *
       *  TOUCH (no hover)
       *  ────────────────
       *  A tap fires `pointerdown` first — we sniff its `pointerType`
       *  and only then toggle open/close. Immediately after we release
       *  focus with .blur() so the browser can't latch a phantom
       *  :hover state to the button after the tap. Any subsequent
       *  outside-tap / ESC / menu-item pick also closes and blurs
       *  (handled in the effects above).
       *
       *  KEYBOARD
       *  ────────
       *  Enter / Space activation lands here as a `click` event with
       *  pointerType === '' (empty). We treat that the same as touch
       *  — toggle open/close so a keyboard user can dismiss the menu
       *  with the same key that opened it.
       */}
      <button
        ref={btnRef}
        type="button"
        onMouseDown={(e) => {
          // ─────────────────────────────────────────────────────────
          //  THE FIX for "hammer keeps swinging after mouse click"
          // ─────────────────────────────────────────────────────────
          //  On desktop we want the icon to be PURELY hover-driven:
          //  hover in → open, hover out → close. A mouse click should
          //  have no effect at all.
          //
          //  The subtle bug: even though we ignore the click in the
          //  handler, the browser STILL moves keyboard-focus to the
          //  button on `mousedown`. That focus event bubbles up to
          //  the wrapper's `onFocus`, which calls `enter()` and keeps
          //  the menu open. When the user then slides the cursor away,
          //  `onMouseLeave` schedules a close — but the button stays
          //  focused, so `onBlur` on the wrapper never fires, and on
          //  some browsers a phantom hover state stays latched to the
          //  button too. The end result: menu closes correctly, but
          //  the choreography visually keeps running until the user
          //  clicks somewhere else (which finally releases the focus
          //  and clears the hover latch).
          //
          //  `preventDefault()` on `mousedown` cancels the default
          //  focus-transfer, keeping focus WHEREVER it was before the
          //  click (usually `<body>` or the previously-focused input).
          //  Everything the user perceives — click, hover, keyboard —
          //  keeps working, but the phantom-focus vector is closed.
          //  Only fires for mouse; touch/pen still take the pointerdown
          //  branch below.
          if (e.button === 0) e.preventDefault();
        }}
        onPointerDown={(e) => {
          // Only touch / pen should toggle. Mouse is ignored — hover
          // (via the wrapper) already handles the whole lifecycle.
          if (e.pointerType === 'mouse') return;
          setOpen((o) => !o);
          // Release focus so touch browsers don't keep any pseudo-
          // hover latched to us after the tap.
          requestAnimationFrame(() => btnRef.current?.blur());
        }}
        onKeyDown={(e) => {
          // Enter / Space toggle for pure keyboard users. Handled here
          // rather than relying on the native click synth so it never
          // races with the pointerdown path above.
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen((o) => !o);
          }
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`مشارکت در مجازات ${fullName}`}
        className="justice-hammer-btn relative inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/25 transition-[background-color,box-shadow,transform] duration-200 hover:bg-white/25 hover:shadow-[0_6px_16px_-4px_rgba(0,0,0,.35)] hover:ring-white/60 focus:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
      >
        <HammerIcon className="relative z-10 h-[18px] w-[18px] drop-shadow-[0_1px_0_rgba(0,0,0,.35)]" />
        {/* Impact halo — tiny ring that pings out when the head strikes */}
        <span
          aria-hidden="true"
          className="justice-hammer-halo pointer-events-none absolute inset-0 rounded-full opacity-0 ring-2 ring-white/70"
        />
      </button>

      {popover}
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

/*
 * ── SINGLE DRIVER: [data-active] ─────────────────────────────────
 *
 * There is exactly ONE source of truth for whether the hammer is
 * swinging: the \`data-active\` attribute on the .justice-hammer
 * wrapper. React sets it from the \`open\` state — which is itself
 * driven by:
 *   • Desktop hover  → onMouseEnter / onMouseLeave on the wrapper
 *   • Touch tap      → onPointerDown on the button
 *   • Keyboard       → onKeyDown Enter/Space
 *   • ESC / outside  → the effects registered inside <HammerMenu>
 *
 * We DELIBERATELY do NOT use CSS :hover to drive the animation.
 * Previous versions did — with a \`@media (hover: hover)\` guard —
 * but that created a subtle race: on a desktop tap the popover
 * would close (React state open=false, data-active removed) yet
 * the browser still reported :hover=true because the cursor hadn't
 * moved. The CSS branch then kept animating until the user moved
 * the mouse or clicked somewhere else. Removing the CSS :hover
 * rule entirely and delegating hover to the React state (via the
 * wrapper's onMouseEnter/Leave) means the animation lifetime is
 * ALWAYS exactly the popover's lifetime — no drift possible.
 */
.justice-hammer[data-active='true'] [data-hammer-head]  { animation: hammerSwing 900ms cubic-bezier(.65,.05,.2,1) infinite; }
.justice-hammer[data-active='true'] [data-hammer-anvil] { animation: anvilPulse  900ms cubic-bezier(.65,.05,.2,1) infinite; }
.justice-hammer[data-active='true'] .justice-hammer-halo { animation: hammerHalo 900ms ease-out infinite; }

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
  .justice-hammer [data-hammer-head],
  .justice-hammer [data-hammer-anvil],
  .justice-hammer .justice-hammer-halo {
    animation: none !important;
  }
}
`;

/* ───────────────────────────────────────────────────────────────────────── */
/*  Card                                                                     */
/* ───────────────────────────────────────────────────────────────────────── */

function CriminalCardView({
  p,
  delay = 0,
  onOpenAlbum,
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
      className="group isolate flex w-[calc((100%-0.75rem)/2)] min-w-0 flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_2px_10px_-4px_rgba(15,20,32,.06)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_44px_-22px_rgba(11,53,48,.22)] md:w-[calc((100%-3*1.25rem)/4)]"
    >
      {/* Photo — relative + overflow-hidden so the popover can pop INTO
          the upper part of the portrait without ever leaving the card. */}
      <div className="relative aspect-[3/4] overflow-hidden bg-ink-200">
        <button
          type="button"
          onClick={() => onOpenAlbum(p)}
          aria-label={`نمایش آلبوم تصاویر ${p.fullName}`}
          className="absolute inset-0 block cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
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
              className="absolute bottom-2 left-2 z-[2] inline-flex h-5 items-center gap-1 rounded-md bg-black/55 px-1.5 text-[10.5px] font-extrabold tabular-nums text-white ring-1 ring-white/20 backdrop-blur-sm"
              aria-hidden="true"
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
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
      <div className="group/plate relative flex items-center gap-2 rounded-b-[28px] bg-brand-500 px-3 pb-3 pt-3 transition-colors hover:bg-brand-600">
        {/* Hammer trigger — peer of the name link so its own hover
            state stays isolated from the plate's hover state (both
            can highlight independently). */}
        <HammerMenu slug={p.slug} fullName={p.fullName} />

        {/* The name itself remains the primary click target for
            "open detail page" — full-width so tap area stays generous. */}
        <Link
          href={`/r4j/${p.slug}`}
          className="min-w-0 flex-1 truncate text-center text-[14px] font-extrabold leading-6 text-white md:text-[14.5px]"
          title={p.fullName}
        >
          {p.fullName}
        </Link>

        {/* Symmetry spacer — mirrors the hammer button's footprint so
            the name reads truly centred instead of drifting toward one
            edge. Non-interactive. */}
        <span aria-hidden="true" className="h-8 w-8 shrink-0" />
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
  const prev = () => {
    if (totalPages <= 1) return;
    setPage((p) => (p - 1 + totalPages) % totalPages);
  };
  const next = () => {
    if (totalPages <= 1) return;
    setPage((p) => (p + 1) % totalPages);
  };

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

  const buildImages = useCallback((p: CriminalCard, extra?: AlbumImage[]): AlbumImage[] => {
    const out: AlbumImage[] = [];
    if (p.imageUrl) out.push({ url: p.imageUrl, alt: p.fullName });
    if (extra && extra.length) {
      for (const im of extra) {
        if (!out.some((o) => o.url === im.url)) out.push(im);
      }
    }
    return out;
  }, []);

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

  const openAlbum = useCallback(
    async (p: CriminalCard) => {
      const seedSubtitle = buildR4JSubtitle(p.pillLabel);

      if (p.gallery && p.gallery.length) {
        setAlbum({
          open: true,
          title: p.fullName,
          subtitle: seedSubtitle,
          images: buildImages(p, p.gallery),
          loading: false,
        });
        return;
      }
      const cached = photoCache[p.slug];
      if (cached) {
        setAlbum({
          open: true,
          title: p.fullName,
          subtitle: seedSubtitle,
          images: buildImages(p, cached),
          loading: false,
        });
        return;
      }
      setAlbum({
        open: true,
        title: p.fullName,
        subtitle: seedSubtitle,
        images: buildImages(p),
        loading: true,
      });
      try {
        // Detail endpoint mirrors R4JPublicCriminalDetailSerializer:
        //   photos[]  (id, image, caption, is_primary, order)
        //   country / province / city  (visibility-controlled → may be null)
        // We refresh the subtitle from the detail payload so the album
        // reflects the freshest public-visible location, then fall back
        // to the seed pillLabel if visibility hides everything.
        const detail = await apiFetch<{
          photos?: Array<{
            id: number;
            image: string;
            caption?: string;
            is_primary?: boolean;
            order?: number;
          }>;
          country?: string | null;
          province?: string | null;
          city?: string | null;
        }>(`/r4j/criminals/${encodeURIComponent(p.slug)}/`, {
          revalidate: 600,
          tags: [`criminal:${p.slug}`],
        });
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
        setAlbum((a) =>
          a.open
            ? { ...a, subtitle: freshSubtitle, images: buildImages(p, fetched), loading: false }
            : a,
        );
      } catch {
        setAlbum((a) => (a.open ? { ...a, loading: false } : a));
      }
    },
    [photoCache, buildImages, buildR4JSubtitle],
  );

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
        <div className="pb-2 pt-2 md:pb-4 md:pt-4">
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
                  <CriminalCardView
                    key={`${page}-${p.slug}`}
                    p={p}
                    delay={i * 0.06}
                    onOpenAlbum={openAlbum}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Pager — lives INSIDE the off-white panel, centred below the cards */}
          <div className="mt-6 flex items-center justify-center gap-4 md:mt-8">
            <button
              type="button"
              aria-label="قبلی"
              onClick={prev}
              disabled={totalPages <= 1}
              className="relative h-12 w-12 rounded-full transition-transform duration-200 hover:scale-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
            >
              <Image
                src="/brand/pager-arrow-prev.png"
                alt=""
                fill
                sizes="48px"
                className="object-contain"
              />
            </button>
            <button
              type="button"
              aria-label="بعدی"
              onClick={next}
              disabled={totalPages <= 1}
              className="relative h-12 w-12 rounded-full transition-transform duration-200 hover:scale-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
            >
              <Image
                src="/brand/pager-arrow-next.png"
                alt=""
                fill
                sizes="48px"
                className="object-contain"
              />
            </button>
          </div>
        </div>

        {/* See-all CTA — matches the WarFund pattern for cross-section
            consistency. Pulls the user out of the home preview and into
            the full R4J case browser. */}
        <div className="mt-6 flex justify-center">
          <Link
            href="/#justice"
            className="inline-flex h-12 items-center gap-2 rounded-full border-2 border-brand-500 bg-white px-7 text-[14px] font-extrabold text-brand-700 transition-colors hover:bg-brand-50"
          >
            <span>مشاهده همه پرونده‌ها</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
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
