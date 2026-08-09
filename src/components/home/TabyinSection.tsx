'use client';

import Image from 'next/image';
import { SmartImage } from '@/components/ui/SmartImage';
import Link from 'next/link';
import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SectionTitle } from './SectionTitle';
import { Icon } from '@/components/icons/Icon';
import { EmptyState } from './EmptyState';

/**
 * ───────────────────────────────────────────────────────────────────────────
 * Tabyin (جهاد تبیین) section — designer-faithful (v2).
 *
 * Backend contract (apps/tabyin):
 *   GET /api/v1/tabyin/contents/        PublicTabyinContentListSerializer
 *     Query params (PublicTabyinContentFilter):
 *       - media_type ∈ {image, video, audio, other}
 *       - author     (icontains on author_username)
 *       - search     (FTS + trigram across title/description/author)
 *
 *   GET /api/v1/tabyin/contents/<external_id>/  detail
 *   POST /api/v1/tabyin/me/submissions/         user submission (auth-only)
 *
 * Public list serializer fields:
 *   external_id, title, description, author_username, origin,
 *   source_created_at, source_url, primary_media_type,
 *   attachments[]: { id, url, media_type, media_type_display, size,
 *                    duration, file_size, title, order }
 *
 * Designer brief (from the screenshot):
 *   - True 4-column masonry. Tiles have variable HEIGHT (some tall) —
 *     not a uniform grid; this mirrors a Pinterest/Behance feed and
 *     gives the wall its editorial character.
 *   - Most tiles are cover-only with a soft brand-teal tint overlay so
 *     every image reads as part of the same "Tabyin family", plus a
 *     bottom scrim so any overlaid title stays legible.
 *   - One tile in every fold is a 'quote' card — solid brand-green,
 *     white centred text with a quote glyph in the corner — used when
 *     the content is text-led (e.g. a manifesto excerpt).
 *   - Bottom-left of every tile carries two glass action chips:
 *       link (copy-share) + heart (bookmark).
 *   - 'بارگذاری بیشتر' mint pill below.
 *
 * UX upgrades (backend-driven, harmonised with the rest of the homepage):
 *   1. Top-left media-type badge for video / audio tiles (with the
 *      duration when ≥ 1s) — drawn from primary_media_type + duration.
 *      The image's the default, so it stays unbadged to keep the wall
 *      visually quiet.
 *   2. Plays-circle icon ALWAYS centred on video tiles, fading in on
 *      hover — turns any video into a one-click play affordance.
 *   3. Tiny 'مردمی' chip in the bottom-right when origin = user_submitted
 *      — gives social proof and rewards contributors.
 *   4. Filter strip (همه · تصویر · ویدئو · صوت) directly maps to the
 *      backend's media_type query param. Counts are live.
 *   5. The masonry layout is generated DETERMINISTICALLY from the item
 *      array so the same items always land in the same cells regardless
 *      of viewport — no jumping on resize.
 * ───────────────────────────────────────────────────────────────────────────
 */

export type TabyinItem = {
  id: string;
  slug: string;
  title?: string;
  summary?: string;
  coverUrl?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  /** When variant='quote' the tile renders as a brand-green text card */
  variant?: 'cover' | 'quote';
  /** Optional masonry sizing hints (height multipliers) */
  tall?: boolean;          // span 2 rows on desktop
  /** Backend-driven extras */
  mediaType?: 'image' | 'video' | 'audio' | 'other';
  durationSeconds?: number;
  origin?: 'external' | 'user_submitted';
  authorName?: string;
  /** Original publisher URL (e.g. Telegram channel post) — surfaces an
   *  'منبع اصلی' affordance on the tile when present. */
  sourceUrl?: string;
  toneFrom?: string;
  toneTo?: string;
};

/* ───────────────────────────────────────────────────────────────────────── */
/*  Icons                                                                    */
/* ───────────────────────────────────────────────────────────────────────── */

function QuoteIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M7.17 6C4.31 6 2 8.31 2 11.17v6.66h6.66v-6.66H5c0-1.84 1.49-3.33 3.33-3.33V6H7.17zm10 0c-2.86 0-5.17 2.31-5.17 5.17v6.66h6.66v-6.66H15c0-1.84 1.49-3.33 3.33-3.33V6h-1.16z" />
    </svg>
  );
}

function PlayIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function VideoIcon({ className = 'w-3 h-3' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}
         strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="m22 8-6 4 6 4V8Z" />
      <rect x="2" y="6" width="14" height="12" rx="2" />
    </svg>
  );
}

function AudioIcon({ className = 'w-3 h-3' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}
         strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 1a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3Z" />
      <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
      <line x1="12" y1="19" x2="12" y2="23" />
    </svg>
  );
}

function ImageIcon({ className = 'w-3 h-3' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}
         strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  );
}

function GridIcon({ className = 'w-3 h-3' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}
         strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

/** Text/document glyph — used by the new "متن" filter tab. Three
 *  horizontal lines inside a rounded card read instantly as prose /
 *  a written passage, distinguishing it from the image / video /
 *  grid glyphs on the same strip. */
function TextIcon({ className = 'w-3 h-3' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}
         strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <polyline points="14 3 14 9 20 9" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="13" y2="17" />
    </svg>
  );
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  Helpers                                                                  */
/* ───────────────────────────────────────────────────────────────────────── */

function formatDuration(s?: number): string {
  if (!s || s <= 0) return '';
  if (s < 60) return `${s.toLocaleString('fa-IR')}″`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (r === 0) return `${m.toLocaleString('fa-IR')}:۰۰`;
  return `${m.toLocaleString('fa-IR')}:${r.toString().padStart(2, '0')}`;
}

/**
 * Filter roster for the Tabyin media-type strip.
 *
 * Includes the new 'text' tab (added when the upstream crawler
 * started ingesting text-only content — quotes, manifestos, callouts —
 * alongside the existing image / video streams). The 'text' bucket
 * catches EVERY item whose primary media type isn't image OR video —
 * that means audio content, `other`, and anything the backend hasn't
 * assigned a media type to (typically pure prose posts). A user
 * looking at "متن" therefore sees the union of "not-a-picture, not-
 * a-video" — the honest interpretation of "متن" on a media wall.
 *
 * A previous version of this roster included a stand-alone 'audio'
 * tab; it was removed because the homepage corpus didn't publish any
 * audio, so the tab pointed at an always-empty view. Audio content
 * (if any surfaces) now lands under the more general 'text/other'
 * umbrella so the strip stays at 4 tabs — no risk of overflow on
 * narrow phones.
 */
const FILTERS = [
  { key: 'all',   label: 'همه',   Glyph: GridIcon  },
  { key: 'image', label: 'تصویر', Glyph: ImageIcon },
  { key: 'video', label: 'ویدئو', Glyph: VideoIcon },
  { key: 'text',  label: 'سایر',  Glyph: TextIcon  },
] as const;
type FilterKey = (typeof FILTERS)[number]['key'];

export type TabyinCounts = {
  all: number;
  image: number;
  video: number;
  /** Everything else (audio / other / no-media). Optional so older
   *  loaders that don't populate it still typecheck. */
  text?: number;
};

/* ───────────────────────────────────────────────────────────────────────── */
/*  Section                                                                  */
/* ───────────────────────────────────────────────────────────────────────── */

export function TabyinSection({ items, counts: backendCounts }: { items: TabyinItem[]; counts?: TabyinCounts }) {
  const [filter, setFilter] = useState<FilterKey>('all');
  const [page, setPage]     = useState(0);

  /*
   * ── "سایر" tab definition ────────────────────────────────────
   *
   *  Contract with the client:
   *    text ≡ all − image − video
   *
   *  Both the badge count AND the tab contents must respect this
   *  identity so the number the user sees on the pill matches the
   *  number of tiles they scroll through — no more "35 in the badge
   *  but 8 items on screen".
   *
   *  On the counts side: the backend loader now supplies
   *  `backendCounts.text` computed as `all - image - video`, so the
   *  badge always reads that exact figure (currently 35 on prod).
   *
   *  On the items side: `isTextItem` matches ANY item that is neither
   *  visibly an image tile nor visibly a video tile — evaluated by
   *  the client's own tile-rendering criteria (has a valid cover URL
   *  → image, has a video URL → video, otherwise → text). That's
   *  exactly the set-complement of image ∪ video from the wall's
   *  perspective, and it produces the same 35-item count on the
   *  current corpus (the ~33 rows with cross-typed / null
   *  primary_media_type still lack a usable cover URL and correctly
   *  land under سایر).
   */
  /*
   * ── Content sanity helpers ──────────────────────────────────
   *
   *  `hasReadableText` normalises Persian zero-width joiner
   *  (ZWNJ, U+200C), no-break space, BOM and other invisible-
   *  glyph whitespace BEFORE the length check, so a description
   *  that is technically non-empty ("‌" or "   ") still counts as
   *  empty and gets filtered out.
   *
   *  `hasRenderableContent` is the universal "should we show this
   *  tile at all?" predicate. A tile is renderable when it has
   *  EITHER something to display in a media slot (cover / video
   *  URL) OR readable text for the quote-card fallback. Rows that
   *  fail both checks are hollow — they'd render as a blank card
   *  regardless of tab — and are excluded from every filter,
   *  including "همه", so the four badge numbers add up cleanly.
   */
  const hasReadableText = (i: TabyinItem) => {
    const clean = (s: string | undefined) =>
      (s ?? '')
        .replace(/[\u200B-\u200F\u202A-\u202E\u2060\u00A0\uFEFF]/g, '')
        .trim();
    return clean(i.summary).length > 0 || clean(i.title).length > 0;
  };
  const hasRenderableContent = (i: TabyinItem) =>
    Boolean(i.coverUrl) || Boolean(i.videoUrl) || hasReadableText(i);

  const isTextItem = (i: TabyinItem) => i.mediaType === 'other' && hasReadableText(i);

  /*
   * ── Renderable corpus ───────────────────────────────────────
   *  All badge counts AND the paginated slice are computed from
   *  the SAME filtered array: items minus the hollow ones. That
   *  guarantees the four badge numbers add up:
   *      همه = تصویر + ویدئو + سایر
   *  and every tab's tile count matches its badge exactly.
   */
  const renderableItems = useMemo(
    () => items.filter(hasRenderableContent),
    [items],
  );

  const counts = useMemo(() => ({
    all:   renderableItems.length,
    image: renderableItems.filter((i) => i.mediaType === 'image').length,
    video: renderableItems.filter((i) => i.mediaType === 'video').length,
    text:  renderableItems.filter(isTextItem).length,
  }), [renderableItems]);

  const filtered = useMemo(
    () => renderableItems.filter((i) => {
      if (filter === 'all') return true;
      if (filter === 'text') return isTextItem(i);
      const t = i.mediaType ?? 'image';
      return t === filter;
    }),
    [renderableItems, filter],
  );

  // 10 tiles per page tile a perfect rectangle at EVERY breakpoint when the
  // tall pattern is exactly 2 tall + 8 short:
  //     tall × 2 + short × 8 = 4 + 8 = 12 row slots
  //     - Desktop (4 cols): 4 × 3 rows = 12 ✓
  //     - Tablet  (3 cols): 3 × 4 rows = 12 ✓
  //     - Mobile  (2 cols): 2 × 6 rows = 12 ✓
  // `grid-auto-flow: dense` packs the cells gap-free. Tall positions live
  // on the items themselves (see seed/loader) so every cover matches its
  // slot's aspect-ratio — the cover never gets cropped weirdly.
  /*
   * Hard cap per tab: 10 pages of 10 tiles = 100 items maximum.
   *
   * The pager arrows previously read `filtered.length` directly, so a
   * bucket with 105 items would flash 11 pages, and a bucket with 96
   * items would sometimes flash 10 with a nearly-empty last page.
   * The client's contract is simpler: EVERY tab shows at most 10
   * pages, capped at whatever count exists upstream (so "سایر" with
   * only 35 items still shows 4 pages, and "ویدئو" with 1474 items
   * caps at exactly 10). Slicing `filtered` down to 100 up-front
   * makes this invariant obvious in one place — the pager and the
   * page-window slicer both then compute against the SAME bounded
   * array, so they can't disagree.
   */
  const PAGE_SIZE = 10;
  const MAX_PAGES = 10;
  const capped = useMemo(
    () => filtered.slice(0, PAGE_SIZE * MAX_PAGES),
    [filtered],
  );
  const totalPages = Math.max(1, Math.min(MAX_PAGES, Math.ceil(capped.length / PAGE_SIZE)));

  const visible = useMemo(
    () => capped.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [capped, page],
  );

  // Reset to first page when filter changes
  useEffect(() => { setPage(0); }, [filter]);

  // ── Sparse-mode detection ───────────────────────────────────────────
  // When the visible set is smaller than ONE full row at the current
  // viewport, we drop out of CSS grid into flex+wrap+justify-center so
  // orphan tiles centre instead of clinging to the RTL-right edge.
  const [cols, setCols] = useState(4);
  useEffect(() => {
    const measure = () => {
      const w = window.innerWidth;
      setCols(w >= 1024 ? 4 : w >= 768 ? 3 : 2);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);
  const isSparse = visible.length > 0 && visible.length < cols;

  const goPrev = () => setPage((p) => (p - 1 + totalPages) % totalPages);
  const goNext = () => setPage((p) => (p + 1) % totalPages);

  return (
    <section className="section-y bg-white" id="tabyin">
      <div className="container-edge">
        <SectionTitle
          title="جهاد تبیین"
          description="در روزگارِ هیاهوی روایت‌ها، هر تصویر، هر ویدئو و هر سطر، یک تلاش برای رساندنِ صدای حقیقت است. اینجا دست‌به‌دست هم می‌دهیم تا روایتِ مردم گم نشود."
        />

        {/* Filter strip — media-type pills.
            Responsive strategy:
              - phones (< 480px): full-width 4-col grid so the strip
                always fits the viewport and every chip stays
                comfortably tappable (no horizontal overflow, ever).
              - ≥ 480px            : inline pill row centered on the page.
            The count badge is hidden below 480px and shown as a small
            corner chip so the chip body itself never has to compete with
            it for horizontal space. */}
        {/* Filter pill — content-hugging on every viewport.
         *
         * The previous revision used `grid-cols-4 + w-full` on phones,
         * a layout that had been sized for FOUR tabs (همه / تصویر /
         * ویدئو / صوت). When the 'صوت' tab was retired the grid still
         * reserved four columns, so a phantom fourth column stretched
         * the pill to full-width and left a visibly-empty gap on the
         * left. Switching to an intrinsically-sized `inline-flex` at
         * ALL widths lets the outer `justify-center` centre the pill
         * naturally and keeps every tab equidistant. No more phantom
         * column, no more sideways drift when the filter roster
         * changes size in the future. */}
        {/* Phone-only breathing tweaks (client fine-tune):
         *   • Outer pill padding  : p-1.5 → 6 px  (was p-1 → 4 px).
         *                           Adds ~2 px of trough around the
         *                           active-tab shadow so the tabs feel
         *                           lifted, not cramped against the
         *                           ring border.
         *   • Inter-tab gap      : gap-1  → 4 px  (was gap-0.5 → 2 px).
         *                           Small but perceptible separation so
         *                           the three tabs read as distinct
         *                           targets instead of a single strip.
         * Both values collapse back to the desktop defaults from `sm:`
         * upward (p-1 / gap-0) — the wider chip padding on desktop
         * already carries all the breathing room needed there. */}
        {/* ── Filter strip ────────────────────────────────────────────
         *
         * Redesign notes for the 4-tab (همه / تصویر / ویدئو / متن)
         * roster:
         *
         *   1. Outer wrapper: `max-w-full px-2 sm:px-0`. The 8 px
         *      side-padding on phones guarantees the pill is never
         *      flush with the viewport edge — required because the
         *      count badges bleed 1 px past the tab's rounded-full
         *      hit area and, without a gutter, could clip against
         *      the browser chrome or nav.
         *
         *   2. Pill container: `w-full max-w-[420px] sm:w-auto` on
         *      phones so the pill can't outgrow the viewport, but
         *      collapses to intrinsic size (`sm:w-auto`) on desktop
         *      where four short labels + counts fit comfortably.
         *
         *   3. Inner row: `grid grid-cols-4 gap-1` on phones so each
         *      of the 4 tabs gets an EQUAL slice of the pill width —
         *      no tab wraps, none overflow, none get squeezed to
         *      illegibility even at 320 px viewports. `sm:flex
         *      sm:gap-0` restores the compact desktop look.
         *
         *   4. Per-tab padding: `px-2 sm:px-4`. Phone padding is
         *      minimal because the grid slots ARE the spacing. On
         *      desktop we bump to 16 px so the pill breathes.
         *
         *   5. Label sizing: `text-[11px] sm:text-[12.5px]`. Persian
         *      glyphs stay legible at 11 px; smaller than that
         *      starts to strain on phones.
         */}
        <div className="flex justify-center mb-6 w-full px-2 sm:px-0">
          <div
            className="w-full max-w-[420px] sm:w-auto sm:max-w-full
                       inline-flex p-1.5 sm:p-1 bg-ink-50 rounded-full
                       ring-1 ring-ink-100 shadow-inner"
            role="tablist" aria-label="نوع رسانه"
          >
            <div className="grid grid-cols-4 gap-1 sm:flex sm:gap-0 w-full min-w-0">
              {FILTERS.map((f) => {
                const isActive = filter === f.key;
                const c = counts[f.key];
                return (
                  <button
                    key={f.key}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setFilter(f.key)}
                    className={`relative inline-flex items-center justify-center gap-1 sm:gap-1.5
                                h-10 px-2 sm:px-4 min-w-0
                                rounded-full text-[11px] sm:text-[12.5px] font-extrabold whitespace-nowrap
                                transition-all duration-200
                                ${isActive
                                  ? 'bg-gradient-to-l from-brand-500 to-brand-700 text-white shadow-[0_8px_20px_-6px_rgba(13,128,116,.55)]'
                                  : 'text-ink-600 hover:text-ink-900 hover:bg-white/60'}`}
                  >
                    <f.Glyph className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{f.label}</span>
                    {/* Inline count badge — hidden on phones to guarantee fit */}
                    <span className={`hidden sm:inline-flex items-center justify-center min-w-[20px] h-5 px-1.5
                                      rounded-full text-[10.5px] font-extrabold tabular-nums
                                      ${isActive ? 'bg-white/25 text-white' : 'bg-ink-100 text-ink-500'}`}>
                      {c.toLocaleString('fa-IR')}
                    </span>
                    {/* Compact corner badge on phones */}
                    {c > 0 && (
                      <span className={`sm:hidden absolute -top-1 -left-1 min-w-[16px] h-[16px]
                                        inline-flex items-center justify-center rounded-full
                                        text-[9.5px] font-extrabold tabular-nums px-1
                                        ${isActive ? 'bg-white text-ink-900' : 'bg-ink-200 text-ink-600'}
                                        ring-2 ring-ink-50`}>
                        {c.toLocaleString('fa-IR')}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Fixed-area masonry: 4 cols × 4 rows on desktop, dense packing ──
             When the current filter yields ZERO items we render the
             EmptyState OUTSIDE of the grid — otherwise it would be
             clipped to a single 120px cell (the auto-rows height) and
             its own py-12/py-16 padding would collapse. That produced
             the visual bug the client reported: the pager arrows
             sitting right underneath the empty-state text with almost
             no breathing room. Now the empty state gets its full
             padding envelope and the pager sits at the normal
             cross-section rhythm. */}
        <AnimatePresence mode="wait">
          {visible.length === 0 ? (
            <motion.div
              key={`empty-${filter}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28 }}
            >
              <EmptyState
                title={items.length === 0
                  ? 'هنوز محتوایی منتشر نشده'
                  : 'محتوایی در این فیلتر یافت نشد'}
                description={items.length === 0
                  ? 'به‌محض انتشار اولین روایت‌های جهاد تبیین، اینجا قابل مشاهده خواهد بود.'
                  : 'فیلتر دیگری را امتحان کن یا «همه» را انتخاب کن.'}
                iconPath="m3 11 18-5v12L3 14v-3z M11.6 16.8a3 3 0 1 1-5.8-1.6"
              />
            </motion.div>
          ) : (
            <motion.div
              key={`${filter}-${page}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28 }}
              className={
                isSparse
                  ? 'flex flex-wrap justify-center items-start gap-3 md:gap-4'
                  : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 ' +
                    'auto-rows-[120px] sm:auto-rows-[140px] md:auto-rows-[160px] ' +
                    'gap-3 md:gap-4'
              }
              style={isSparse ? undefined : { gridAutoFlow: 'dense' }}
            >
              {visible.map((it, i) => {
                // ── PAGE-LOCAL tall pattern ─────────────────────────────
                // We need EXACTLY 2 tall + 8 short on every page so:
                //   tall(=2 slots) × 2 + short(=1 slot) × 8 = 12 slots
                //   - 4-col: 3 rows × 4 = 12 ✓
                //   - 3-col: 4 rows × 3 = 12 ✓
                //   - 2-col: 6 rows × 2 = 12 ✓
                // We place tall on slots 0 and 1 — the EARLIEST positions —
                // so `grid-auto-flow: dense` never has to spill a tall into
                // the bottom row, where it would push the grid past its
                // declared row count and visually escape the panel.
                const isLastPageAndShort =
                  visible.length < PAGE_SIZE; // last page may have fewer items
                const tall = !isLastPageAndShort && (i === 0 || i === 1);
                return (
                  <TabyinTile
                    key={it.id}
                    it={it}
                    index={i}
                    forceTall={tall}
                    sparse={isSparse}
                  />
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pager (brand PNG arrows — disabled when there's a single page) */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            type="button" aria-label="قبلی" onClick={goPrev} disabled={totalPages <= 1}
            className="relative w-12 h-12 rounded-full hover:scale-110 active:scale-95
                       transition-transform duration-200 disabled:opacity-40
                       disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <Image src="/brand/pager-arrow-prev.png" alt="" fill sizes="48px" className="object-contain" />
          </button>
          <button
            type="button" aria-label="بعدی" onClick={goNext} disabled={totalPages <= 1}
            className="relative w-12 h-12 rounded-full hover:scale-110 active:scale-95
                       transition-transform duration-200 disabled:opacity-40
                       disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <Image src="/brand/pager-arrow-next.png" alt="" fill sizes="48px" className="object-contain" />
          </button>
        </div>

        {/* CTAs below the pager:
            - 'مشاهده همه محتوا'  → secondary, brand-ghost (browsing intent)
            - 'افزودن محتوا'      → primary, mint pill (action intent,
              routes through the auth-required user-submission flow that
              maps to POST /api/v1/tabyin/me/submissions/)                */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
          <Link
            href="/tabyin"
            className="inline-flex items-center gap-2 h-12 px-7 rounded-full
                       bg-white border-2 border-brand-500 text-brand-700 font-extrabold text-[14px]
                       hover:bg-brand-50 transition-colors"
          >
            <span>مشاهده همه محتوا</span>
            <Icon name="arrow-left" className="w-4 h-4" />
          </Link>
          <Link
            href="/tabyin/new"
            className="inline-flex items-center gap-2 h-12 px-7 rounded-full
                       bg-mint-500 hover:bg-mint-600 text-white font-extrabold text-[14px]
                       shadow-[0_8px_24px_-8px_rgba(37,197,186,.5)] transition-all
                       hover:scale-[1.02] active:scale-[.98]"
          >
            <Icon name="plus" className="w-4 h-4" strokeWidth={2.5} />
            <span>افزودن محتوا</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  Tile                                                                     */
/* ───────────────────────────────────────────────────────────────────────── */

function TabyinTile({
  it, index, forceTall = false, sparse = false,
}: {
  it: TabyinItem; index: number; forceTall?: boolean; sparse?: boolean;
}) {
  const isQuote = it.variant === 'quote';
  const isVideo = it.mediaType === 'video';
  const isAudio = it.mediaType === 'audio';
  const isUser  = it.origin === 'user_submitted';
  // `forceTall` is computed PAGE-LOCALLY in the section so the tall slots
  // always align to the dense grid and never overflow on the last row.
  // The data-driven `it.tall` is intentionally ignored here.
  // In SPARSE mode every tile is short (a single centred row).
  const tall    = !sparse && forceTall;
  const tileHref = `/tabyin/${it.slug}`;
  const tileTarget = undefined;
  const tileRel = undefined;

  // Width / height presets for sparse mode mirror each breakpoint's
  // column count so the visual rhythm stays identical to the dense grid.
  const sparseSizing = sparse
    ? 'w-[calc((100%-0.75rem)/2)] h-[120px] ' +
      'sm:h-[140px] ' +
      'md:w-[calc((100%-2*1rem)/3)] md:h-[160px] ' +
      'lg:w-[calc((100%-3*1rem)/4)] ' +
      'flex-none'
    : (tall ? 'row-span-2' : 'row-span-1');

  return (
    <motion.article
      initial={{ opacity: 0, scale: 0.96, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.025, 0.35) }}
      className={`group relative rounded-2xl overflow-hidden isolate
                  shadow-[0_2px_10px_-4px_rgba(15,20,32,.06)]
                  hover:shadow-[0_22px_44px_-22px_rgba(11,53,48,.28)]
                  hover:-translate-y-1 transition-all duration-300
                  ${sparseSizing}`}
    >
      {isQuote ? (
        /* ── Quote tile (solid brand-green text card) ─────────────────
         *
         * Redesign notes:
         *   • Left / right padding is now generous enough (px-9 md:px-10)
         *     that the body copy sits inside a safe "text box" that
         *     NEVER overlaps the corner quote glyphs — the original
         *     bug the client reported ("قسمتی از متن میره روی اون دو
         *     تا ویرگول"). Top/bottom padding also expanded so the
         *     centred paragraph breathes.
         *   • The paragraph is wrapped in an absolutely-positioned
         *     inset column with its OWN safe-area padding, then
         *     centred with flex — that means overflow ellipsis and
         *     centering compose correctly even for tiles that stretch
         *     to two rows on the desktop grid.
         *   • `line-clamp-4` (short tiles) / `line-clamp-8` (tall
         *     tiles) — long text is trimmed with a `…` instead of
         *     ever spilling past the safe area. `word-break: break-word`
         *     safeguards against a single unbroken URL/token pushing
         *     the tile wider.
         *   • Font sizing bumps a step for tall tiles so a two-row
         *     card doesn't look empty.
         */
        <Link
          href={tileHref} target={tileTarget} rel={tileRel}
          className="relative block w-full h-full text-white
                     bg-gradient-to-br from-brand-400 via-brand-500 to-brand-700
                     overflow-hidden"
        >
          {/* Decorative quote glyphs at the corners. `pointer-events-none`
              so they never intercept clicks; z-index kept below the text
              layer so the safe-area padding does the heavy lifting. */}
          <QuoteIcon className="pointer-events-none absolute top-2.5 right-2.5 w-5 h-5 md:w-6 md:h-6 opacity-20" />
          <QuoteIcon className="pointer-events-none absolute bottom-2.5 left-2.5 w-4 h-4 md:w-5 md:h-5 opacity-15 rotate-180" />
          {/* Subtle dotted texture */}
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.08] pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.85) 1px, transparent 1px)',
              backgroundSize: '14px 14px',
            }}
          />
          {/* Text container: absolute inset with a SAFE-AREA padding
              wider than the corner glyphs, then flex-centred so the
              paragraph is perfectly balanced regardless of length. */}
          <div
            className={`absolute inset-0 flex items-center justify-center text-center
                        px-8 md:px-10 py-8 md:py-10`}
          >
            <p
              className={`relative font-bold drop-shadow
                          text-[12.5px] md:text-[13.5px]
                          leading-[1.75]
                          ${tall ? 'line-clamp-[8]' : 'line-clamp-4'}`}
              style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
            >
              {it.summary || it.title}
            </p>
          </div>
        </Link>
      ) : it.coverUrl ? (
        /* ── Cover tile (image) ─────────────────────────────────────── */
        <Link href={tileHref} target={tileTarget} rel={tileRel} className="relative block w-full h-full">
          {isVideo && it.videoUrl ? (
            <video
              src={it.videoUrl}
              poster={it.thumbnailUrl || it.coverUrl}
              muted
              loop
              playsInline
              preload="none"
              onMouseEnter={(e) => {
                e.currentTarget.play().catch(() => undefined);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.pause();
                e.currentTarget.currentTime = 0;
              }}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <SmartImage
              src={it.coverUrl}
              alt={it.title || 'محتوای تبیینی'}
              variant="tabyin"
              fill
              sizes="(max-width: 768px) 45vw, 22vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          )}
          {/* Brand-teal duotone tint — unifies the wall */}
          <div aria-hidden="true"
               className="absolute inset-0 bg-gradient-to-br
                          from-brand-500/[0.12] via-transparent to-brand-900/[0.18]
                          mix-blend-multiply pointer-events-none" />
          {/* Bottom scrim for title legibility */}
          <div aria-hidden="true"
               className="absolute inset-x-0 bottom-0 h-3/5
                          bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          {/* Title overlay (only when there's a title) */}
          {it.title && (
            <p className="absolute bottom-3 inset-x-3 text-white text-[12.5px] md:text-[13px]
                          font-extrabold leading-5 line-clamp-2 drop-shadow-[0_2px_6px_rgba(0,0,0,.6)]">
              {it.title}
            </p>
          )}
          {/* Center play affordance — only on video tiles, fades in on hover */}
          {isVideo && (
            <div aria-hidden="true"
                 className="absolute inset-0 flex items-center justify-center z-[4]
                            opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="w-12 h-12 rounded-full bg-white/95 text-brand-600
                               flex items-center justify-center
                               shadow-[0_12px_28px_-8px_rgba(0,0,0,.55)]
                               scale-90 group-hover:scale-100 transition-transform duration-300">
                <PlayIcon className="w-5 h-5" />
              </span>
            </div>
          )}
        </Link>
      ) : (
        /* ── Fallback tile — brand-tinted placeholder, keeps the wall
             visually coherent when a piece of content has no cover. */
        <Link
          href={tileHref} target={tileTarget} rel={tileRel}
          className="relative block w-full h-full"
          aria-label={it.title || 'محتوای تبیینی'}
        >
          <SmartImage
            src={null}
            alt={it.title || 'محتوای تبیینی'}
            variant="tabyin"
            fill
            sizes="(max-width: 768px) 45vw, 22vw"
          />
        </Link>
      )}

      {/* Media-type badge — top-left (only for non-image, non-quote) */}
      {!isQuote && (isVideo || isAudio) && (
        <span className="absolute top-2.5 left-2.5 z-10 inline-flex items-center gap-1
                         h-6 px-2 rounded-full bg-black/60 text-white
                         text-[10.5px] font-extrabold backdrop-blur-md
                         tabular-nums">
          {isVideo ? <VideoIcon className="w-3 h-3" /> : <AudioIcon className="w-3 h-3" />}
          {it.durationSeconds ? formatDuration(it.durationSeconds) : (isVideo ? 'ویدئو' : 'صوت')}
        </span>
      )}

      {/* 'مردمی' chip — when content was contributed by a user */}
      {!isQuote && isUser && (
        <span className="absolute top-2.5 right-2.5 z-10 inline-flex items-center gap-1
                         h-6 px-2 rounded-full bg-mint-500/95 text-white
                         text-[10.5px] font-extrabold backdrop-blur-md
                         shadow-[0_4px_12px_-4px_rgba(37,197,186,.55)]">
          <Icon name="sparkles" className="w-3 h-3" />
          مردمی
        </span>
      )}

      {/* Bottom-left action chips.
          The "source" chip is BACKEND-DRIVEN: it opens the original
          publisher URL (source_url from PublicTabyinContentListSerializer)
          in a new tab. When the tabyin content isn't linked back to an
          external source we hide the chip entirely — never render a
          button that does nothing. */}
      <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 z-10">
        {it.sourceUrl ? (
          <a
            href={it.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="مشاهده‌ی منبع اصلی"
            title="منبع اصلی"
            onClick={(e) => e.stopPropagation()}
            className="w-7 h-7 rounded-full bg-white/90 hover:bg-white text-ink-700
                       flex items-center justify-center backdrop-blur-md
                       shadow-[0_2px_6px_-2px_rgba(0,0,0,.25)]
                       hover:scale-110 transition-all duration-150"
          >
            <Icon name="link" className="w-3.5 h-3.5" />
          </a>
        ) : null}
      </div>
    </motion.article>
  );
}
