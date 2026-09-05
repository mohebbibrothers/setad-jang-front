'use client';

import Image from 'next/image';
import { SmartImage } from '@/components/ui/SmartImage';
import Link from 'next/link';
import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SectionTitle } from './SectionTitle';
import { formatPersianNumber, absoluteMediaUrl } from '@/lib/utils';
import { apiFetch } from '@/lib/api';
import { CampaignAlbum, type AlbumImage } from './CampaignAlbum';
import { CampaignParticipateModal } from './CampaignParticipateModal';
import { EmptyState } from './EmptyState';

/**
 * ───────────────────────────────────────────────────────────────────────────
 * War-fund (Madadkar) campaign card — designer-faithful (v3).
 *
 * Backend contract (apps/madadkar):
 *   GET /api/v1/madadkar/campaigns/  → CampaignPublicListSerializer
 *
 * Fields used (mirror of serializers.CampaignPublicListSerializer.Meta.fields):
 *   id, sponsor{id,name,slug,logo}, title, slug, cover_image,
 *   total_amount, total_shares, share_price, purchased_shares,
 *   purchased_amount, participant_count, remaining_shares,
 *   progress_percent, is_fully_funded, status, status_display,
 *   has_deadline, deadline, published_at, completed_at, closed_at
 *
 * Layout (matches the designer's mockup exactly):
 *
 *   ┌──────────────────────────────────────────────────┐
 *   │  ┌──────────┐   ┌──────────────────────────┐    │
 *   │  │  cover   │   │       campaign title     │    │
 *   │  │ 130×130  │   ├──────────────────────────┤    │
 *   │  │          │   │   مبلغ کل ··· ۱۰،۰۰۰،۰۰۰،۰۰۰ ریال │
 *   │  └──────────┘   ├──────────┬───────────────┤    │
 *   │   ٪۵۰           │ باقی     │   تعداد       │    │
 *   │  ▓▓▓▓░░░░       ├──────────┴───────────────┤    │
 *   │                 │   مددکار ··· جهادی       │    │
 *   │                 └──────────────────────────┘    │
 *   │                                                  │
 *   │  ┌─────────── مدد به حرکت  ✋ ─────────────┐   │
 *   │  └──────────────────────────────────────────┘   │
 *   └──────────────────────────────────────────────────┘
 *
 *   - Cover sits on the RTL-right (DOM first inside .wf-body).
 *   - Percentage label and progress bar live UNDER the cover.
 *   - All meta-pill values are HORIZONTALLY CENTERED.
 *   - CTA icon (helping hand) is on the LTR-left = end-of-line in RTL.
 *
 * Display notes:
 *   - Backend stores monetary fields in TOMAN; the mockup shows RIAL.
 *     We multiply totalAmount × 10 at render time to match the design.
 * ───────────────────────────────────────────────────────────────────────────
 */
export type CampaignCard = {
  slug: string;
  title: string;
  sponsor: string;
  sponsorLogo?: string;
  /** Toman (storage unit); UI multiplies by 10 to render Rial. */
  totalAmount: number;
  sharePrice: number;
  sharesTotal: number;
  sharesRemaining: number;
  progressPercent: number;
  coverUrl?: string;
  toneFrom?: string;
  toneTo?: string;
  /** Optional pre-loaded gallery (already sorted by display_order asc).
   *  When absent and the user opens the album, the section fetches
   *  /madadkar/campaigns/<slug>/ on-demand. */
  gallery?: AlbumImage[];
  /** Extra signals the backend exposes (CampaignPublicListSerializer). */
  participantCount?: number;
  isFullyFunded?: boolean;
  hasDeadline?: boolean;
  /** ISO8601 — only meaningful when hasDeadline is true. */
  deadline?: string;
  statusDisplay?: string;
};

/* ───────────────────────────────────────────────────────────────────────── */
/*  Atoms                                                                    */
/* ───────────────────────────────────────────────────────────────────────── */

/** Meta pill — flex layout that GUARANTEES the label, value and unit
 *  never collide at any width.
 *
 *   ┌─────────────────────────────────────────────────────────┐
 *   │  label   │            number (centre, truncate)         │  unit │
 *   │ (shrink) │              flex-1 min-w-0                  │(shrink)│
 *   └─────────────────────────────────────────────────────────┘
 *
 *  Label and unit are flex-shrink:0, the number gets flex-1 + min-w-0 +
 *  truncate so when the pill is narrow the NUMBER shortens with an
 *  ellipsis — the label and the unit stay readable.
 *  At idle widths the number still reads visually centred because the
 *  label+unit have similar visual weight on each side.
 */
function MetaPill({
  label,
  value,
  unit,
  emphasis = 'num',
  avatarUrl,
}: {
  label: string;
  value: string | number;
  unit?: string;
  emphasis?: 'num' | 'text';
  /** Optional avatar for text pills (e.g. sponsor logo from
   *  SponsorPublicSerializer.logo). Rendered on the RTL-start edge, so
   *  the label + value flow to its right and shrink cleanly. */
  avatarUrl?: string;
}) {
  return (
    <div className="flex h-[40px] min-w-0 items-center gap-1 overflow-hidden rounded-[10px] border border-ink-200 bg-white px-2 sm:gap-1.5 sm:px-3">
      {/* Sponsor avatar (optional) — square 22px, ring for definition */}
      {avatarUrl && (
        <span className="relative h-[22px] w-[22px] shrink-0 overflow-hidden rounded-md bg-ink-50 ring-1 ring-ink-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatarUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        </span>
      )}

      <span className="max-w-[42%] shrink truncate whitespace-nowrap text-[11px] font-medium leading-none text-ink-500 sm:text-[12px]">
        {label}
      </span>

      <span
        className={`min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-center text-[12.5px] font-extrabold text-ink-900 sm:text-[13.5px] ${emphasis === 'num' ? 'tabular-nums' : ''}`}
        title={typeof value === 'string' ? value : undefined}
      >
        {typeof value === 'number' ? formatPersianNumber(value) : value}
      </span>

      {unit && (
        <span className="shrink-0 whitespace-nowrap text-[10.5px] font-medium leading-none text-ink-400 sm:text-[11px]">
          {unit}
        </span>
      )}
    </div>
  );
}

/** Helping-hand icon — matches the palm glyph on the mockup's CTA */
function HandIcon({ className = 'w-[18px] h-[18px]' }: { className?: string }) {
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
      <path d="M18 11V6a2 2 0 0 0-4 0v5" />
      <path d="M14 10V4a2 2 0 0 0-4 0v6" />
      <path d="M10 10.5V6a2 2 0 0 0-4 0v8" />
      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-5.7-2.5L1.5 14a2 2 0 0 1 3-2.6L7 13" />
    </svg>
  );
}

/* NOTE — the previous `CoverFallback` gradient+glyph placeholder was
   retired in favour of the unified `<SmartImage variant="campaign" />`
   which ships its own designer-grade fallback (soft brand gradient +
   dot texture + brand glyph + subtle watermark). One placeholder
   language for the whole site instead of six bespoke ones. */

/* ───────────────────────────────────────────────────────────────────────── */
/*  Card                                                                     */
/* ───────────────────────────────────────────────────────────────────────── */

function Card({
  c,
  delay = 0,
  onOpenAlbum,
  onOpenParticipate,
}: {
  c: CampaignCard;
  delay?: number;
  onOpenAlbum: (c: CampaignCard) => void;
  onOpenParticipate: (c: CampaignCard) => void;
}) {
  // UI displays Rial; backend stores Toman → ×10 at render time.
  const totalRial = c.totalAmount * 10;
  const pct = Math.round(c.progressPercent);
  // Card thumbnail prefers — in order:
  //   1. an explicit cover_image from the backend
  //   2. the first gallery image (so the card always shows real artwork,
  //      not the helping-hand glyph fallback)
  //   3. the gradient + glyph fallback as a last resort
  const thumbUrl = c.coverUrl ?? c.gallery?.[0]?.url;
  const galleryHint = c.gallery?.length ?? (c.coverUrl ? 1 : 0);

  // ─── Backend-driven lifecycle signals ───────────────────────────────
  // Mirrors CampaignPublicListSerializer + CampaignStatus enum:
  //   is_fully_funded → all shares reserved/paid, CTA must disable
  //   status='completed'/'closed' → immutable end states
  //   status='published' + remaining > 0 → active
  const isFullyFunded = !!c.isFullyFunded || c.sharesRemaining === 0;
  const statusDisplay = c.statusDisplay ?? '';
  const isCompleted = statusDisplay === 'تکمیل‌شده' || isFullyFunded;
  const isClosed = statusDisplay === 'بسته‌شده';
  const ctaDisabled = isFullyFunded || isClosed || isCompleted;
  const ctaLabel = isFullyFunded
    ? 'تأمین شد'
    : isClosed
      ? 'بسته شد'
      : isCompleted
        ? 'تکمیل شد'
        : 'مدد به حرکت';

  // has_deadline + deadline countdown (only when the backend says the
  // campaign actually HAS a deadline — otherwise we don't guess).
  const deadlineMs = c.hasDeadline && c.deadline ? Date.parse(c.deadline) : NaN;
  const daysLeft = Number.isFinite(deadlineMs)
    ? Math.max(0, Math.ceil((deadlineMs - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay }}
      /* Width math matches the parent flex gap (1rem mobile, 1.25rem md+).
         - mobile / tablet (< 1024px): 1 column → 100%
         - desktop (≥ 1024px)        : 2 columns → calc((100% - 1.25rem)/2)
         Combined with parent flex+wrap+justify-center, an orphan in the
         last row auto-centres. min-w-0 lets long titles shrink cleanly. */
      className="group w-full min-w-0 overflow-hidden rounded-[18px] border border-ink-100 bg-white shadow-[0_2px_10px_-4px_rgba(15,20,32,.06)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_44px_-22px_rgba(11,53,48,.22)] lg:w-[calc((100%-1.25rem)/2)]"
    >
      <div className="p-3 sm:p-4 md:p-5">
        {/* ── Body: 2-column layout (cover on RTL-right, content on left) ── */}
        <div className="flex items-stretch gap-3 sm:gap-4">
          {/* Right column: cover + percent + progress (DOM-first = RTL-right).
              On very narrow phones (< 380px) the cover is pinned to 84px
              so the value column keeps enough breathing room for the
              "باقی‌مانده" / "تعداد سهم" pair below. */}
          <div className="flex w-[84px] shrink-0 flex-col items-center sm:w-[110px] md:w-[130px]">
            <button
              type="button"
              onClick={() => onOpenAlbum(c)}
              aria-label={`نمایش آلبوم تصاویر ${c.title}`}
              className="relative aspect-square w-full cursor-zoom-in overflow-hidden rounded-[14px] bg-ink-50 ring-1 ring-ink-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <SmartImage
                src={thumbUrl}
                alt={c.title}
                variant="campaign"
                fill
                sizes="(min-width: 768px) 130px, (min-width: 640px) 110px, 96px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Album hint chip — bottom-left of the cover */}
              {galleryHint > 1 && (
                <span
                  className="absolute bottom-1.5 left-1.5 inline-flex h-5 items-center gap-1 rounded-md bg-black/55 px-1.5 text-[10px] font-extrabold tabular-nums text-white ring-1 ring-white/20 backdrop-blur-sm"
                  aria-hidden="true"
                >
                  <svg
                    width="10"
                    height="10"
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
                  {formatPersianNumber(galleryHint)}
                </span>
              )}

              {/* Hover veil + "view album" affordance */}
              <span
                className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                aria-hidden="true"
              />
              <span
                className="absolute inset-x-0 bottom-1.5 text-center text-[10.5px] font-extrabold text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                aria-hidden="true"
              >
                نمایش آلبوم
              </span>
            </button>

            {/* Percent — directly under the cover */}
            <div className="mt-2.5 text-[12px] font-extrabold tabular-nums leading-none text-ink-700">
              ٪{formatPersianNumber(pct)}
            </div>

            {/* Progress bar — full cover-column width */}
            <div className="mt-1.5 h-[6px] w-full overflow-hidden rounded-full bg-ink-100">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${pct}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1.1, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-l from-brand-400 to-brand-600"
              />
            </div>
          </div>

          {/* Left column: title + 3 meta pills */}
          <div className="flex min-w-0 flex-1 flex-col">
            <Link
              href={`/madadkar/${c.slug}`}
              className="mb-3 line-clamp-2 text-[14.5px] font-extrabold leading-7 text-ink-900 transition-colors hover:text-brand-600 md:text-[15px]"
            >
              {c.title}
            </Link>

            <div className="space-y-2">
              <MetaPill label="مبلغ کل" value={totalRial} unit="ریال" />

              {/* Tighter gap on phones so both pills fit even when the
                  cover column steals ~84px of horizontal space. */}
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                <MetaPill label="باقی‌مانده" value={c.sharesRemaining} unit="سهم" />
                <MetaPill label="تعداد سهم" value={c.sharesTotal} unit="سهم" />
              </div>

              <MetaPill
                label="مددکار"
                value={c.sponsor}
                emphasis="text"
                avatarUrl={c.sponsorLogo}
              />
            </div>
          </div>
        </div>

        {/* ── Backend-driven signal row ─────────────────────────────
              Surfaces lifecycle + engagement fields that were dropped
              in earlier revisions:
                • status  → status_display / is_fully_funded badge
                • participant_count  → مشارکت‌کنندگان chip
                • has_deadline + deadline → countdown chip (warm-tone
                  when ≤ 3 days remain) */}
        {(isFullyFunded ||
          isCompleted ||
          isClosed ||
          (c.participantCount ?? 0) > 0 ||
          daysLeft !== null) && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {isFullyFunded ? (
              <span className="inline-flex h-6 items-center gap-1 rounded-full bg-mint-500 px-2 text-[10.5px] font-extrabold text-white ring-1 ring-mint-600/40">
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                تأمین‌شده
              </span>
            ) : isCompleted ? (
              <span className="inline-flex h-6 items-center rounded-full bg-mint-500/15 px-2 text-[10.5px] font-extrabold text-mint-700 ring-1 ring-mint-500/30">
                {statusDisplay || 'تکمیل‌شده'}
              </span>
            ) : isClosed ? (
              <span className="inline-flex h-6 items-center rounded-full bg-ink-100 px-2 text-[10.5px] font-extrabold text-ink-600 ring-1 ring-ink-200">
                {statusDisplay || 'بسته‌شده'}
              </span>
            ) : (
              <span className="inline-flex h-6 items-center gap-1 rounded-full bg-brand-50 px-2 text-[10.5px] font-extrabold text-brand-700 ring-1 ring-brand-100">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500" />
                در حال جمع‌آوری
              </span>
            )}

            {(c.participantCount ?? 0) > 0 && (
              <span className="inline-flex h-6 items-center gap-1 rounded-full bg-ink-50 px-2 text-[10.5px] font-extrabold tabular-nums text-ink-700 ring-1 ring-ink-100">
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                {formatPersianNumber(c.participantCount!)} مشارکت‌کننده
              </span>
            )}

            {daysLeft !== null && !ctaDisabled && (
              <span
                className={`inline-flex h-6 items-center gap-1 rounded-full px-2 text-[10.5px] font-extrabold tabular-nums ring-1 ${
                  daysLeft <= 3
                    ? 'bg-amber-50 text-amber-700 ring-amber-100'
                    : 'bg-ink-50 text-ink-700 ring-ink-100'
                }`}
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {daysLeft === 0 ? 'آخرین روز' : `${formatPersianNumber(daysLeft)} روز مانده`}
              </span>
            )}
          </div>
        )}

        {/* ── CTA: opens the Participate modal in-page (preserves session
              cookies + lets the user pick share count with the slider
              before redirecting to the gateway). Disabled when the
              backend says the campaign is fully funded / closed /
              completed — no more orphan buttons that call a rejected
              /participate/ endpoint. */}
        <button
          type="button"
          onClick={() => !ctaDisabled && onOpenParticipate(c)}
          disabled={ctaDisabled}
          aria-disabled={ctaDisabled}
          className={`relative mt-3 inline-flex h-[46px] w-full items-center justify-center gap-2 overflow-hidden rounded-[12px] text-[14.5px] font-extrabold text-white transition-colors ${
            ctaDisabled
              ? 'cursor-not-allowed bg-ink-300 shadow-none'
              : 'cursor-pointer bg-brand-500 shadow-[0_6px_14px_-6px_rgba(13,128,116,.55)] hover:bg-brand-600 active:bg-brand-700'
          }`}
        >
          <span>{ctaLabel}</span>
          {!ctaDisabled && <HandIcon />}
        </button>
      </div>
    </motion.article>
  );
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  Section                                                                  */
/* ───────────────────────────────────────────────────────────────────────── */

/** Shape of the campaign detail endpoint we care about for the album.
 *  Mirrors apps.madadkar.serializers.CampaignPublicDetailSerializer. */
type ApiCampaignDetail = {
  cover_image?: string | null;
  title?: string;
  gallery_images?: Array<{
    id: number;
    image: string;
    alt_text?: string;
    display_order?: number;
  }>;
};

export function WarFundSection({ campaigns }: { campaigns: CampaignCard[] }) {
  // 4 cards per page (2×2 on desktop); extra pages reached via the pager.
  const PAGE_SIZE = 4;
  const totalPages = Math.max(1, Math.ceil(campaigns.length / PAGE_SIZE));
  const [page, setPage] = useState(0);
  const visible = useMemo(
    () => campaigns.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [campaigns, page],
  );

  // No-op when there's only one (or zero) page. The pager buttons are
  // already visually disabled via the `disabled` prop below, but the
  // explicit guard keeps keyboard / spacebar activations honest too.
  const prev = () => {
    if (totalPages <= 1) return;
    setPage((p) => (p - 1 + totalPages) % totalPages);
  };
  const next = () => {
    if (totalPages <= 1) return;
    setPage((p) => (p + 1) % totalPages);
  };

  // ─── Album state ──────────────────────────────────────────────────────
  // Madadkar is the ONLY section where "مددکار: X" is semantically
  // correct — the record literally IS sponsored by a Sponsor object.
  const [album, setAlbum] = useState<{
    open: boolean;
    title: string;
    subtitle?: { label: string; value: string };
    images: AlbumImage[];
    loading: boolean;
  }>({ open: false, title: '', images: [], loading: false });

  // In-memory cache so reopening the same album never re-fetches.
  const [galleryCache, setGalleryCache] = useState<Record<string, AlbumImage[]>>({});

  const closeAlbum = useCallback(() => {
    setAlbum((a) => ({ ...a, open: false }));
  }, []);

  // ─── Participate modal state ─────────────────────────────────────────
  const [participateOpen, setParticipateOpen] = useState(false);
  const [participateCampaign, setParticipateCampaign] = useState<CampaignCard | null>(null);
  const openParticipate = useCallback((c: CampaignCard) => {
    setParticipateCampaign(c);
    setParticipateOpen(true);
  }, []);
  const closeParticipate = useCallback(() => setParticipateOpen(false), []);

  const buildImages = useCallback((c: CampaignCard, extra?: AlbumImage[]): AlbumImage[] => {
    const out: AlbumImage[] = [];
    if (c.coverUrl) out.push({ url: c.coverUrl, alt: c.title });
    if (extra && extra.length) {
      // De-duplicate against the cover (some backends repeat the cover
      // inside gallery_images by mistake).
      for (const im of extra) {
        if (!out.some((o) => o.url === im.url)) out.push(im);
      }
    }
    return out;
  }, []);

  const openAlbum = useCallback(
    async (c: CampaignCard) => {
      // Madadkar album subtitle = sponsoring group name.
      const subtitle = c.sponsor ? { label: 'مددکار', value: c.sponsor } : undefined;

      // 1. seed-supplied gallery → open immediately
      if (c.gallery && c.gallery.length) {
        setAlbum({
          open: true,
          title: c.title,
          subtitle,
          images: buildImages(c, c.gallery),
          loading: false,
        });
        return;
      }
      // 2. cached → open immediately
      const cached = galleryCache[c.slug];
      if (cached) {
        setAlbum({
          open: true,
          title: c.title,
          subtitle,
          images: buildImages(c, cached),
          loading: false,
        });
        return;
      }
      // 3. fetch from detail endpoint
      setAlbum({
        open: true,
        title: c.title,
        subtitle,
        images: buildImages(c),
        loading: true,
      });
      try {
        const detail = await apiFetch<ApiCampaignDetail>(
          `/madadkar/campaigns/${encodeURIComponent(c.slug)}/`,
          { revalidate: 300, tags: [`campaign:${c.slug}`] },
        );
        const fetched: AlbumImage[] = (detail.gallery_images ?? [])
          .slice()
          .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
          .map((g) => ({ url: absoluteMediaUrl(g.image) ?? '', alt: g.alt_text || c.title }))
          .filter((g) => !!g.url);
        setGalleryCache((prev) => ({ ...prev, [c.slug]: fetched }));
        setAlbum((a) => (a.open ? { ...a, images: buildImages(c, fetched), loading: false } : a));
      } catch {
        // Silent fallback — keep the cover-only album visible.
        setAlbum((a) => (a.open ? { ...a, loading: false } : a));
      }
    },
    [galleryCache, buildImages],
  );

  return (
    <section className="section-y bg-white" id="warfund">
      <div className="container-edge">
        <SectionTitle
          title="پشتیبانی مالی جنگ"
          description="کنار هر دست خالی، صدها دست یاری‌رسان ایستاده. هر سهمی که می‌خری، یک قدم نزدیک‌تر به آرامش مدافعان و خانواده‌هاست."
        />

        {campaigns.length === 0 ? (
          <EmptyState
            title="هنوز حرکتی منتشر نشده"
            description="به‌محض انتشار اولین حرکت‌های پشتیبانی مالی جنگ، اینجا قابل مشارکت خواهد بود."
            iconPath="M18 11V6a2 2 0 0 0-4 0v5 M14 10V4a2 2 0 0 0-4 0v6 M10 10.5V6a2 2 0 0 0-4 0v8 M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-5.7-2.5L1.5 14a2 2 0 0 1 3-2.6L7 13"
          />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              /* flex+wrap+justify-center so a SINGLE orphan in the last row
                 centres itself instead of clinging to the RTL-right edge.
                 Cards take the column width via the responsive className
                 applied on <Card> itself. */
              className="flex flex-wrap justify-center gap-4 md:gap-5"
            >
              {visible.map((c, i) => (
                <Card
                  key={c.slug}
                  c={c}
                  delay={i * 0.06}
                  onOpenAlbum={openAlbum}
                  onOpenParticipate={openParticipate}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Pager — brand PNG arrows, real interactive paging */}
        <div className="mt-8 flex items-center justify-center gap-4">
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

        <div className="mt-6 flex justify-center">
          <Link
            href="/madadkar"
            className="inline-flex h-12 items-center gap-2 rounded-full border-2 border-brand-500 bg-white px-7 text-[14px] font-extrabold text-brand-700 transition-colors hover:bg-brand-50"
          >
            <span>مشاهده همه کمپین‌ها</span>
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

      {/* ── Album lightbox ───────────────────────────────────────────── */}
      <CampaignAlbum
        open={album.open}
        onClose={closeAlbum}
        title={album.title}
        subtitle={album.subtitle}
        images={album.images}
        loading={album.loading}
      />

      {/* ── Participate modal — slider + live financial breakdown +
              gateway redirect (POST /madadkar/campaigns/<slug>/participate/) */}
      <CampaignParticipateModal
        open={participateOpen}
        onClose={closeParticipate}
        campaign={participateCampaign}
      />
    </section>
  );
}
