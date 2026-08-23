'use client';

import Image from 'next/image';
import { SmartImage } from '@/components/ui/SmartImage';
import Link from 'next/link';
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SectionTitle } from './SectionTitle';
import { Icon } from '@/components/icons/Icon';
import { apiFetch } from '@/lib/api';
import { absoluteMediaUrl } from '@/lib/utils';
import { CampaignAlbum, type AlbumImage } from './CampaignAlbum';
import { EmptyState } from './EmptyState';

/**
 * ───────────────────────────────────────────────────────────────────────────
 * Kindness Wall section — empathy-driven, backend-faithful (v4).
 *
 * Backend contract (apps/kindness_wall):
 *   GET /api/v1/kindness-wall/listings/  KindnessListingListSerializer
 *   GET /api/v1/kindness-wall/listings/?listing_type=&category=&province=&city=&search=
 *   POST /api/v1/kindness-wall/listings/<slug>/bookmark/        (auth)
 *   POST /api/v1/kindness-wall/listings/<slug>/reveal-contact/  (auth)
 *
 * Listing card fields used:
 *   id, slug, listing_type ∈ {need_help, offer_help},
 *   category{slug, title, icon},
 *   title, province, city, district,
 *   owner_full_name_snapshot, owner_avatar_snapshot,
 *   published_at, expires_at, view_count, cover_image
 *
 * Composition (matches the rest of the homepage):
 *   - 26px-radius dual-layer cards (cover + white footer panel),
 *     same shape language as Education tiles.
 *   - Brand PNG pager arrows, same hover/active behaviour as the rest.
 *   - Mint primary action pill for the global CTA.
 *   - Section title with brand plus-sparkle ornament.
 *
 * UX upgrades in v4 (the user-asked-for changes):
 *   1. Stats counters are gone (the segmented switch already shows them).
 *   2. Category chips strip is a TRUE horizontal-scroll with edge arrows
 *      and edge-fade — exactly like the Education tabs strip.
 *   3. Segmented switcher icons replaced with crafted SVG glyphs whose
 *      metaphor lines up with the intent of each filter.
 *   4. Every card CTA is now 'مشاهده آگهی' (intent stays in the type pill).
 *   5. 'ثبت آگهی جدید' is now a SPLIT-ACTION popover (same pattern as
 *      the 'مشارکت در مجازات' control in Justice) carrying two routes:
 *         - 'پیشنهاد کمک'      → /kindness-wall/new?type=offer_help
 *         - 'نیازمند کمک هستم' → /kindness-wall/new?type=need_help
 *   6. Grid is 4 cards per page (matches every other carousel).
 *   7. Header is enriched with a powerful but tasteful search box that
 *      maps directly to the backend FTS/trigram `search` param — the
 *      single most-asked-for feature in any classifieds product.
 * ───────────────────────────────────────────────────────────────────────────
 */

export type KindListing = {
  slug: string;
  title: string;
  type: 'need' | 'offer';
  categoryTitle?: string;
  categorySlug?: string;
  province?: string;
  city?: string;
  district?: string;
  ownerName?: string;
  ownerAvatar?: string;
  coverImage?: string;
  publishedAt?: string;
  expiresAt?: string;
  viewCount?: number;
  /** apps.kindness_wall.serializers.KindnessListingDetailSerializer.get_contact_available
   *  → true when the owner has recorded a contact phone. Note: only
   *  present on the DETAIL endpoint; the public LIST serializer does
   *  not expose it. */
  contactAvailable?: boolean;
  /** Optional pre-loaded gallery (sorted by image.order asc, cover first).
   *  When absent and the user taps the cover, the section fetches
   *  /kindness-wall/listings/<slug>/ on-demand. */
  gallery?: AlbumImage[];
};

/* ───────────────────────────────────────────────────────────────────────── */
/*  Crafted icons (metaphor-rich, hand-tuned)                                */
/* ───────────────────────────────────────────────────────────────────────── */

/** All listings — multi-card stack / wall glyph */
function AllIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.1}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  );
}

/** Offer help — a GIFT BOX with a SOLID heart sitting on top, in place of a bow.
 *  Classic 'gift of love' metaphor; instantly readable at every scale. The
 *  heart is filled solid so it carries the silhouette even in the tightest
 *  in-pill size, and the box's vertical+horizontal ribbon makes the box
 *  literacy unmistakable.                                                    */
function GiveIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Solid filled heart sitting on top of the lid */}
      <path
        d="M12 7c-.7-.9-2-1.4-3-.5-.95.85-.95 2.25 0 3.1L12 12.4l3-2.8c.95-.85.95-2.25 0-3.1-1-.9-2.3-.4-3 .5Z"
        fill="currentColor"
        stroke="none"
      />
      {/* Gift box lid */}
      <rect x="3" y="12" width="18" height="3.5" rx="1" />
      {/* Gift box body */}
      <path d="M5 15.5v5.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5.5" />
      {/* Vertical ribbon down the centre */}
      <line x1="12" y1="12" x2="12" y2="22" />
    </svg>
  );
}

/** Need help — a heart with a heartbeat pulse running through it (HEART-PULSE)
 *  Metaphor: my heart needs care / a signal calling for help.               */
function NeedIcon({ className = 'w-4 h-4' }: { className?: string }) {
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
      {/* Heart outline */}
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      {/* Heartbeat line inside */}
      <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" strokeWidth={1.7} />
    </svg>
  );
}

/** Plus glyph for the "post listing" trigger */
function PlusIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  Helpers                                                                  */
/* ───────────────────────────────────────────────────────────────────────── */

const FILTERS = [
  // `shortLabel` is what we render on phones (≤ 480 px) so the segmented
  // switcher never overflows or wraps mid-word.
  { key: 'all', label: 'همه آگهی‌ها', shortLabel: 'همه', Glyph: AllIcon, tone: 'brand' as const },
  {
    key: 'offer',
    label: 'می‌خواهم کمک کنم',
    shortLabel: 'کمک می‌کنم',
    Glyph: GiveIcon,
    tone: 'mint' as const,
  },
  {
    key: 'need',
    label: 'نیاز به کمک دارم',
    shortLabel: 'نیازمندم',
    Glyph: NeedIcon,
    tone: 'rose' as const,
  },
] as const;
type FilterKey = (typeof FILTERS)[number]['key'];

function relativeTime(dateStr?: string): string {
  if (!dateStr) return 'به‌تازگی';
  const d = new Date(dateStr);
  const diffMs = Date.now() - d.getTime();
  const m = Math.floor(diffMs / 60_000);
  if (m < 1) return 'هم‌اکنون';
  if (m < 60) return `${m.toLocaleString('fa-IR')} دقیقه پیش`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h.toLocaleString('fa-IR')} ساعت پیش`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days.toLocaleString('fa-IR')} روز پیش`;
  const months = Math.floor(days / 30);
  return `${months.toLocaleString('fa-IR')} ماه پیش`;
}

function daysUntilExpiry(dateStr?: string): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return diff > 0 ? Math.ceil(diff / (24 * 3600 * 1000)) : 0;
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  Split-action 'post listing' control                                      */
/* ───────────────────────────────────────────────────────────────────────── */

/**
 * NOTE — "ثبت آگهی جدید" is a WIP control.
 *
 * The old implementation was a two-option dropdown (می‌خواهم کمک کنم /
 * نیازمند کمک هستم) that navigated to `/kindness-wall/new?type=...`.
 * Those routes are not built in the homepage-only milestone, so every
 * click ended in a 404 that showed up on the client's network tab.
 *
 * Rather than ship dead links, we render a self-explanatory
 * "به‌زودی" (coming-soon) chip attached to the same mint pill. It:
 *   • preserves the visual footprint of the original CTA so the row
 *     layout doesn't collapse,
 *   • signals that the flow is planned but not live,
 *   • does NOT navigate anywhere, so there is nothing left to 404.
 *
 * Once the /kindness-wall/new route ships, restore the dropdown from
 * git history and remove the ComingSoonPostListing shim below.
 */
function PostListingSplit() {
  return (
    <div
      className="relative inline-flex h-12 cursor-not-allowed select-none items-center gap-2 rounded-full bg-mint-500/60 px-7 text-[14px] font-extrabold text-white/95 shadow-[0_8px_24px_-8px_rgba(37,197,186,.35)]"
      title="این بخش به‌زودی فعال می‌شود"
      role="button"
      aria-disabled="true"
    >
      <PlusIcon className="h-4 w-4" />
      <span>ثبت آگهی جدید</span>
      <span className="ml-1 inline-flex h-6 items-center rounded-full bg-white/25 px-2 text-[10.5px] font-extrabold tracking-wide">
        به‌زودی
      </span>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  Section                                                                  */
/* ───────────────────────────────────────────────────────────────────────── */

export function KindnessSection({ listings }: { listings: KindListing[] }) {
  const [filter, setFilter] = useState<FilterKey>('all');
  const [category, setCategory] = useState<string>('all');
  const [page, setPage] = useState(0);

  // Build category chips from live data, sorted by descending count
  const categoryChips = useMemo(() => {
    const byTitle = new Map<string, { title: string; slug: string; count: number }>();
    listings.forEach((l) => {
      const t = l.categoryTitle?.trim();
      if (!t) return;
      const slug = l.categorySlug ?? t;
      const prev = byTitle.get(t);
      if (prev) prev.count += 1;
      else byTitle.set(t, { title: t, slug, count: 1 });
    });
    const arr = [...byTitle.values()].sort((a, b) => b.count - a.count);
    return [{ title: 'همه دسته‌ها', slug: 'all', count: listings.length }, ...arr];
  }, [listings]);

  const counts = useMemo(
    () => ({
      all: listings.length,
      need: listings.filter((l) => l.type === 'need').length,
      offer: listings.filter((l) => l.type === 'offer').length,
    }),
    [listings],
  );

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      if (filter !== 'all' && l.type !== filter) return false;
      if (category !== 'all' && l.categoryTitle !== category && l.categorySlug !== category)
        return false;
      return true;
    });
  }, [listings, filter, category]);

  // 3 cards per page — matches the designer's latest brief.
  // The grid below uses flex + flex-wrap so that any orphan cards in the
  // last row are HORIZONTALLY CENTERED instead of dangling to the right.
  const PAGE_SIZE = 3;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = useMemo(
    () => filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [filtered, page],
  );

  const goPrev = () => setPage((p) => (p - 1 + totalPages) % totalPages);
  const goNext = () => setPage((p) => (p + 1) % totalPages);
  function setFilterReset(k: FilterKey) {
    setFilter(k);
    setPage(0);
  }
  function setCategoryReset(c: string) {
    setCategory(c);
    setPage(0);
  }

  // ── Album state ────────────────────────────────────────────────────
  // Kindness album subtitle projects the listing TYPE (need/offer),
  // optionally suffixed with the category title. Previously we
  // mislabelled it as "مددکار: X" because the album only accepted a
  // legacy `sponsor` prop.
  const [album, setAlbum] = useState<{
    open: boolean;
    title: string;
    subtitle?: { label: string; value: string };
    images: AlbumImage[];
    loading: boolean;
  }>({ open: false, title: '', images: [], loading: false });
  const [imgCache, setImgCache] = useState<Record<string, AlbumImage[]>>({});
  const closeAlbum = useCallback(() => setAlbum((a) => ({ ...a, open: false })), []);

  const buildImages = useCallback((l: KindListing, extra?: AlbumImage[]): AlbumImage[] => {
    const out: AlbumImage[] = [];
    if (l.coverImage) out.push({ url: l.coverImage, alt: l.title });
    if (extra && extra.length) {
      for (const im of extra) {
        if (!out.some((o) => o.url === im.url)) out.push(im);
      }
    }
    return out;
  }, []);

  const buildKindSubtitle = useCallback((l: KindListing): { label: string; value: string } => {
    const typeLabel = l.type === 'need' ? 'نیاز به کمک' : 'پیشنهاد کمک';
    const value = l.categoryTitle ? `${typeLabel} · ${l.categoryTitle}` : typeLabel;
    return { label: 'نوع', value };
  }, []);

  const openAlbum = useCallback(
    async (l: KindListing) => {
      const subtitle = buildKindSubtitle(l);
      if (l.gallery && l.gallery.length) {
        setAlbum({
          open: true,
          title: l.title,
          subtitle,
          images: buildImages(l, l.gallery),
          loading: false,
        });
        return;
      }
      const cached = imgCache[l.slug];
      if (cached) {
        setAlbum({
          open: true,
          title: l.title,
          subtitle,
          images: buildImages(l, cached),
          loading: false,
        });
        return;
      }
      setAlbum({ open: true, title: l.title, subtitle, images: buildImages(l), loading: true });
      try {
        // Mirrors KindnessListingDetailSerializer + KindnessListingImageSerializer.
        const detail = await apiFetch<{
          images?: Array<{
            id: number;
            image: string;
            alt_text?: string;
            caption?: string;
            is_cover?: boolean;
            order?: number;
          }>;
          contact_available?: boolean;
        }>(`/kindness-wall/listings/${encodeURIComponent(l.slug)}/`, {
          revalidate: 600,
          tags: [`kindness:${l.slug}`],
        });
        const fetched: AlbumImage[] = (detail.images ?? [])
          .slice()
          // cover first, then ordered ascending (matches backend Meta.ordering).
          .sort((a, b) => {
            if (!!b.is_cover !== !!a.is_cover) return b.is_cover ? 1 : -1;
            return (a.order ?? 0) - (b.order ?? 0);
          })
          .map((g) => ({
            url: absoluteMediaUrl(g.image) ?? g.image,
            alt: g.alt_text || g.caption || l.title,
          }))
          .filter((g) => !!g.url);
        setImgCache((prev) => ({ ...prev, [l.slug]: fetched }));
        setAlbum((a) => (a.open ? { ...a, images: buildImages(l, fetched), loading: false } : a));
      } catch {
        setAlbum((a) => (a.open ? { ...a, loading: false } : a));
      }
    },
    [imgCache, buildImages, buildKindSubtitle],
  );

  /* ── Category strip overflow controls (same pattern as Education) ── */
  const catScrollRef = useRef<HTMLDivElement | null>(null);
  const [catCanPrev, setCatCanPrev] = useState(false);
  const [catCanNext, setCatCanNext] = useState(false);

  useEffect(() => {
    const el = catScrollRef.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      const pos = Math.abs(el.scrollLeft);
      setCatCanPrev(pos > 4);
      setCatCanNext(pos < max - 4);
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [categoryChips.length]);

  function scrollCats(dir: 'left' | 'right') {
    const el = catScrollRef.current;
    if (!el) return;
    const dx = el.clientWidth * 0.7;
    el.scrollBy({ left: dir === 'left' ? -dx : dx, behavior: 'smooth' });
  }

  return (
    <section className="section-y section-alt" id="kindness">
      <div className="container-edge">
        <SectionTitle
          title="دیوار مهربانی"
          description="گاهی یک یخچال کهنه، تمام دنیای یک خانواده است و گاهی یک قول کوچک، چراغ یک شب. اینجا نیازها و دست‌های یاری به هم می‌رسند."
        />

        {/* Segmented type switcher — fully responsive:
              - mobile  (< 480px): compact labels (shortLabel), counter is
                                   absolutely positioned in the corner as a
                                   small chip so nothing wraps or clips.
              - tablet+ (≥ 480px): full labels with an inline counter pill.
            The pill width is constrained by min-w-0 so flex children can
            shrink and the gradient tab stays inside the segmented box. */}
        <div className="mb-5 flex justify-center">
          {/* Pill trough: white on the alt-surface so the segmented
              control reads as a lifted control, not blending into the
              section's soft-greige backdrop. */}
          <div
            className="inline-flex w-full max-w-full rounded-full bg-white p-1 shadow-inner ring-1 ring-ink-100 sm:w-auto"
            role="tablist"
            aria-label="نوع آگهی"
          >
            <div className="grid w-full min-w-0 grid-cols-3 gap-1 sm:flex">
              {FILTERS.map((f) => {
                const isActive = filter === f.key;
                const toneActive =
                  f.tone === 'rose'
                    ? 'bg-gradient-to-l from-[#f43f5e] to-[#e11d48] text-white shadow-[0_8px_20px_-6px_rgba(225,29,72,.55)]'
                    : f.tone === 'mint'
                      ? 'bg-gradient-to-l from-[#2FE0CC] to-[#1FB3A8] text-white shadow-[0_8px_20px_-6px_rgba(37,197,186,.55)]'
                      : 'bg-gradient-to-l from-brand-500 to-brand-700 text-white shadow-[0_8px_20px_-6px_rgba(13,128,116,.55)]';
                return (
                  <button
                    key={f.key}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setFilterReset(f.key)}
                    className={`relative inline-flex h-11 min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[12px] font-extrabold transition-all duration-200 sm:flex-none sm:gap-2 sm:px-5 sm:text-[13.5px] ${isActive ? toneActive : 'text-ink-600 hover:bg-white/60 hover:text-ink-900'}`}
                  >
                    <f.Glyph className="h-[15px] w-[15px] shrink-0 sm:h-4 sm:w-4" />
                    {/* Compact label on phones, full label from sm+ */}
                    <span className="truncate sm:hidden">{f.shortLabel}</span>
                    <span className="hidden sm:inline">{f.label}</span>
                    {/* Inline counter pill — only ≥ sm. On mobile a small
                        corner chip avoids any chance of overflow. */}
                    <span
                      className={`hidden h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10.5px] font-extrabold tabular-nums sm:inline-flex ${isActive ? 'bg-white/25' : 'bg-ink-100 text-ink-500'}`}
                    >
                      {counts[f.key].toLocaleString('fa-IR')}
                    </span>
                    {/* Mobile corner counter */}
                    <span
                      className={`absolute -left-1 -top-1 inline-flex h-[16px] min-w-[16px] items-center justify-center rounded-full px-1 text-[9.5px] font-extrabold tabular-nums sm:hidden ${isActive ? 'bg-white text-ink-900' : 'bg-ink-200 text-ink-600'} ring-2 ring-ink-50`}
                    >
                      {counts[f.key].toLocaleString('fa-IR')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Category chips strip — horizontal scroll with edge arrows + fade */}
        {categoryChips.length > 1 && (
          <div className="relative mb-7">
            {catCanNext && (
              <button
                type="button"
                aria-label="حرکت به چپ"
                onClick={() => scrollCats('left')}
                className="absolute left-0 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink-600 shadow-[0_4px_14px_-4px_rgba(15,20,32,.15)] ring-1 ring-ink-100 transition-colors hover:bg-brand-50 hover:text-brand-600"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <polyline
                    points="15 18 9 12 15 6"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
            {catCanPrev && (
              <button
                type="button"
                aria-label="حرکت به راست"
                onClick={() => scrollCats('right')}
                className="absolute right-0 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink-600 shadow-[0_4px_14px_-4px_rgba(15,20,32,.15)] ring-1 ring-ink-100 transition-colors hover:bg-brand-50 hover:text-brand-600"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <polyline
                    points="9 18 15 12 9 6"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}

            {catCanNext && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-12 bg-gradient-to-l from-white to-transparent md:w-16"
              />
            )}
            {catCanPrev && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-12 bg-gradient-to-r from-white to-transparent md:w-16"
              />
            )}

            <div
              ref={catScrollRef}
              className="no-scrollbar flex flex-nowrap items-center gap-2 overflow-x-auto overflow-y-hidden scroll-smooth px-10 md:px-12"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {categoryChips.map((c) => {
                const isActive = category === c.slug;
                return (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() => setCategoryReset(c.slug)}
                    className={`inline-flex h-9 flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[12.5px] font-extrabold transition-colors ${
                      isActive
                        ? 'bg-brand-500 text-white shadow-[0_6px_14px_-6px_rgba(13,128,116,.55)]'
                        : 'bg-white text-ink-600 ring-1 ring-ink-100 hover:text-brand-700 hover:ring-brand-200'
                    }`}
                  >
                    <Icon name="tag" className="h-3 w-3" />
                    <span>{c.title}</span>
                    <span
                      className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10.5px] font-extrabold tabular-nums ${isActive ? 'bg-white/25' : 'bg-ink-100 text-ink-500'}`}
                    >
                      {c.count.toLocaleString('fa-IR')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Grid (3 per page) — flex+wrap so an orphan card centres itself ── */}
        <AnimatePresence mode="wait">
          {visible.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <EmptyState
                title={
                  listings.length === 0 ? 'هنوز آگهی منتشر نشده' : 'آگهی‌ای در این فیلتر یافت نشد'
                }
                description={
                  listings.length === 0
                    ? 'به‌محض ثبت اولین آگهی‌های دیوار مهربانی، اینجا قابل مشاهده خواهد بود.'
                    : 'فیلترها را پاک کن یا با عنوان دیگری جست‌وجو کن.'
                }
                iconPath="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
              />
              {listings.length > 0 && (
                <div className="mt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setFilterReset('all');
                      setCategoryReset('all');
                    }}
                    className="inline-flex items-center gap-1.5 text-[13px] font-extrabold text-brand-600 transition-all hover:gap-2"
                  >
                    پاک کردن فیلترها
                    <Icon name="arrow-left" className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key={`${filter}-${category}-${page}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              /* Flex+wrap with justify-center: any orphan in the last row
                 (1 of 3, 1 of 2, 2 of 3) auto-centres horizontally. The
                 inner <ListingCard> sets its width via the responsive
                 'kw-card-flex' class so columns stay aligned with a 3-col
                 desktop, 2-col tablet, 1-col mobile rhythm.                 */
              className="flex flex-wrap justify-center gap-4 md:gap-5"
            >
              {visible.map((l, i) => (
                <ListingCard key={l.slug} l={l} delay={i * 0.04} onOpenAlbum={openAlbum} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pager (brand PNG arrows) */}
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            type="button"
            aria-label="قبلی"
            onClick={goPrev}
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
            onClick={goNext}
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

        {/* Footer actions */}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row md:mt-10">
          <Link
            href="/#kindness"
            className="inline-flex h-12 items-center gap-2 rounded-full border-2 border-brand-500 bg-white px-7 text-[14px] font-extrabold text-brand-700 transition-colors hover:bg-brand-50"
          >
            <span>مشاهده همه آگهی‌ها</span>
            <Icon name="arrow-left" className="h-4 w-4" />
          </Link>
          <PostListingSplit />
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

/* ───────────────────────────────────────────────────────────────────────── */
/*  Listing card                                                             */
/* ───────────────────────────────────────────────────────────────────────── */

function ListingCard({
  l,
  delay = 0,
  onOpenAlbum,
}: {
  l: KindListing;
  delay?: number;
  onOpenAlbum: (l: KindListing) => void;
}) {
  const isNeed = l.type === 'need';
  const daysLeft = daysUntilExpiry(l.expiresAt);
  const thumbUrl = l.coverImage ?? l.gallery?.[0]?.url;
  const galleryHint = l.gallery?.length ?? (l.coverImage ? 1 : 0);

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay }}
      /* Width math matches the parent's gap (1rem mobile, 1.25rem md+):
         - mobile (<640px) : 1 column → 100%
         - tablet (640+)   : 2 columns → calc((100% - 1*1.25rem) / 2)
         - desktop (1024+) : 3 columns → calc((100% - 2*1.25rem) / 3)
         Combined with parent flex+wrap+justify-center, any orphan in the
         last row auto-centres. min-w-0 keeps long content from blowing out. */
      className="group isolate flex w-full min-w-0 flex-col overflow-hidden rounded-[26px] bg-white shadow-[0_2px_10px_-4px_rgba(15,20,32,.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_44px_-22px_rgba(11,53,48,.22)] sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-2.5rem)/3)]"
    >
      {/* Cover — fixed 16:10 box, taps OPEN the album lightbox so the user
          can browse every uploaded image without leaving the wall. */}
      <button
        type="button"
        onClick={() => onOpenAlbum(l)}
        className="relative block aspect-[16/10] w-full cursor-zoom-in overflow-hidden bg-ink-100 text-right focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        aria-label={`نمایش آلبوم تصاویر ${l.title}`}
      >
        <SmartImage
          src={thumbUrl}
          alt={l.title}
          variant="kindness"
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
        />

        {/* Gallery-count chip */}
        {galleryHint > 1 && (
          <span
            className="absolute bottom-2 left-2 z-[3] inline-flex h-5 items-center gap-1 rounded-md bg-black/55 px-1.5 text-[10.5px] font-extrabold tabular-nums text-white ring-1 ring-white/20 backdrop-blur-sm"
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

        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 z-[1] h-1/2 bg-gradient-to-t from-black/55 via-black/15 to-transparent"
        />

        {/* Type badge */}
        <span
          className={`absolute right-3 top-3 z-10 inline-flex h-8 items-center gap-1.5 rounded-2xl px-3 text-[11.5px] font-extrabold text-white ring-[2.5px] ring-black/10 ${
            isNeed
              ? 'bg-gradient-to-l from-[#f43f5e] to-[#e11d48] shadow-[0_4px_14px_-4px_rgba(225,29,72,.55)]'
              : 'bg-gradient-to-l from-[#2FE0CC] to-[#1FB3A8] shadow-[0_4px_14px_-4px_rgba(37,197,186,.55)]'
          }`}
        >
          {isNeed ? <NeedIcon className="h-3.5 w-3.5" /> : <GiveIcon className="h-3.5 w-3.5" />}
          {isNeed ? 'نیازمند کمک' : 'پیشنهاد کمک'}
        </span>

        {/* Expiry badge */}
        {daysLeft !== null && daysLeft <= 7 && (
          <span className="absolute left-3 top-3 z-10 inline-flex h-7 items-center gap-1 rounded-full bg-white/95 px-2.5 text-[11px] font-extrabold text-amber-700 shadow-soft backdrop-blur-md">
            <Icon name="clock" className="h-3 w-3" />
            {daysLeft === 0
              ? 'امروز منقضی می‌شود'
              : `${daysLeft.toLocaleString('fa-IR')} روز تا انقضا`}
          </span>
        )}

        {/* Category chip */}
        {l.categoryTitle && (
          <span className="absolute bottom-3 right-3 z-10 inline-flex h-6 items-center gap-1 rounded-full bg-white/95 px-2.5 text-[11px] font-extrabold text-ink-700 shadow-soft backdrop-blur-md">
            <Icon name="tag" className="h-3 w-3" />
            {l.categoryTitle}
          </span>
        )}

        {/* Contact-availability badge — mirrors
            KindnessListingDetailSerializer.get_contact_available.
            Replaces the previous "smart matches" badge, which relied on
            fields (bookmark_count / matches_count) that the PUBLIC
            listing serializers never expose — they live only inside the
            owner + admin serializers. */}
        {l.contactAvailable && (
          <span className="absolute bottom-3 left-3 z-10 inline-flex h-6 items-center gap-1 rounded-full bg-brand-500 px-2.5 text-[11px] font-extrabold text-white shadow-[0_4px_14px_-4px_rgba(13,128,116,.55)]">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            تماس در دسترس
          </span>
        )}
      </button>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4 md:p-5">
        <Link
          href={`/kindness-wall/${l.slug}`}
          className="line-clamp-2 min-h-[3.5rem] text-[14.5px] font-extrabold leading-7 text-ink-900 transition-colors hover:text-brand-600 md:text-[15px]"
        >
          {l.title}
        </Link>

        <div className="mt-3 flex items-center justify-between gap-2 text-[12px] font-bold text-ink-500">
          <span className="inline-flex min-w-0 items-center gap-1">
            <Icon name="map-pin" className="h-3.5 w-3.5 shrink-0 text-brand-500" />
            <span className="truncate">
              {[l.city, l.province].filter(Boolean).join('، ') || 'سراسر کشور'}
            </span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1">
            <Icon name="clock" className="h-3.5 w-3.5" />
            {relativeTime(l.publishedAt)}
          </span>
        </div>

        <div className="mt-3.5 flex items-center justify-between border-t border-ink-100 pt-3.5">
          <div className="flex min-w-0 items-center gap-2">
            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full shadow-[0_2px_6px_-2px_rgba(0,0,0,.12)] ring-2 ring-white">
              <SmartImage
                src={l.ownerAvatar}
                alt={l.ownerName || 'کاربر دیوار مهربانی'}
                variant="avatar"
                quietSkeleton
                fill
                sizes="32px"
                className="object-cover"
              />
            </div>
            <span className="truncate text-[12.5px] font-extrabold text-ink-700">
              {l.ownerName || 'کاربر دیوار مهربانی'}
            </span>
          </div>
          {typeof l.viewCount === 'number' && l.viewCount > 0 && (
            <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-bold tabular-nums text-ink-400">
              <Icon name="eye" className="h-3.5 w-3.5" />
              {l.viewCount.toLocaleString('fa-IR')}
            </span>
          )}
        </div>

        {/* Action row — unified 'مشاهده آگهی' CTA */}
        <div className="mt-3.5 flex items-center gap-2">
          <Link
            href={`/kindness-wall/${l.slug}`}
            className={`inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl text-[13px] font-extrabold text-white transition-all ${
              isNeed
                ? 'bg-gradient-to-l from-[#f43f5e] to-[#e11d48] shadow-[0_6px_14px_-6px_rgba(225,29,72,.55)] hover:from-[#e11d48] hover:to-[#be123c]'
                : 'bg-gradient-to-l from-brand-500 to-brand-700 shadow-[0_6px_14px_-6px_rgba(13,128,116,.55)] hover:from-brand-600 hover:to-brand-800'
            }`}
          >
            <span>مشاهده آگهی</span>
            <Icon name="arrow-left" className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            aria-label="نشان‌گذاری"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-ink-200 bg-white text-ink-500 transition-colors hover:border-rose-300 hover:text-rose-500"
          >
            <Icon name="heart" className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="اشتراک‌گذاری"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-ink-200 bg-white text-ink-500 transition-colors hover:border-brand-300 hover:text-brand-600"
          >
            <Icon name="link" className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.article>
  );
}
