'use client';

import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { Flame, HeartHandshake, BadgeCheck, Layers } from 'lucide-react';
import { SectionTitle } from './SectionTitle';
import { EmptyState } from './EmptyState';
import { CampaignAlbum, type AlbumImage } from './CampaignAlbum';
import { KindnessCard } from './KindnessCard';
import { KindnessContactSheet, type KindContactChannel } from './KindnessContactSheet';
import { Icon } from '@/components/icons/Icon';
import { apiFetch } from '@/lib/api';
import { absoluteMediaUrl, cn, formatPersianNumber as fa } from '@/lib/utils';

/**
 * ───────────────────────────────────────────────────────────────────────────
 * KindnessSection (v2) — «تختهٔ نیاز» ادمین‌محور روی صفحهٔ اصلی
 *
 * سناریوی جدید بک‌اند (kindness_wall v2، کامیت 32ab4e2):
 *   ادمین دسته‌بندی می‌سازد (لوازم آشپزخانه، پوشاک، …) → آگهیِ «نیاز» را
 *   با حداقل یک راه ارتباطی (تلفن/بله/ایتا/تلگرام/روبیکا/اینستاگرام) منتشر
 *   می‌کند → کاربر می‌بیند و مستقیم با صاحب نیاز تماس می‌گیرد.
 *   دیگر آگهی کاربر، تطبیق، بوکمارک و «ثبت آگهی جدید» وجود ندارد.
 *
 * تصمیم‌های محصولی این نسخه:
 *   • روبان آمار زنده از /stats (فقط وقتی v2 روی هواست — در غیر این صورت
 *     سکوتِ باوقار به‌جای صفرهای دروغین).
 *   • چیپ‌های دسته از /categories با ایموجیِ ادمین‌محور + شمارندهٔ زنده؛
 *     اگر endpoint دسته‌ها جواب ندهد، چیپ‌ها از خودِ کارت‌ها ساخته می‌شوند.
 *   • فیلتر فقط سمت کلاینت است (استان + فوریت) چون صفحهٔ اصلی یک «پنجرهٔ
 *     ۱۲ تایی» روی تخته است، نه خودِ تختهٔ کامل.
 *   • هیچ لینک مرده‌ای نیست: صفحهٔ slug بعداً می‌آید؛ حلقهٔ کاملِ «ببین →
 *     تماس بگیر» همین‌جا با ContactSheetِ lazy از DETAIL بسته می‌شود.
 *   • گالری تصاویر با همان آلبومِ مشترک صفحه (CampaignAlbum).
 * ───────────────────────────────────────────────────────────────────────────
 */

/* ── تایپ‌های قرارداد v2 (home-data هم از همین‌جا import می‌کند) ─────────── */

export type KindListing = {
  slug: string;
  title: string;
  excerpt: string;
  categoryTitle?: string;
  categorySlug?: string;
  /** ایموجیِ دسته — ادمین در پنل انتخابش می‌کند. */
  categoryIcon?: string;
  urgency: 'normal' | 'urgent';
  isFeatured: boolean;
  quantity: number;
  unit: string;
  province?: string;
  city?: string;
  viewCount?: number;
  openOffersCount?: number;
  coverImage?: string;
  /** null = بدون انقضا */
  daysLeft: number | null;
  publishedAt?: string;
};

export type KindCategory = {
  slug: string;
  title: string;
  icon?: string;
  count: number;
};

export type KindStats = {
  openListings: number;
  urgentListings: number;
  fulfilledTotal: number;
  fulfilled30d: number;
  volunteersTotal: number;
  activeCategories: number;
};

/** شمایل DETAIL عمومی — تنها جایی که راه‌های تماس را می‌دهد. */
export type KindListingDetail = {
  description?: string;
  beneficiary_name?: string;
  contact_note?: string;
  contact_channels?: KindContactChannel[];
  images?: Array<{
    id: number;
    image: string;
    alt_text?: string;
    is_cover?: boolean;
    order?: number;
  }>;
};

/* ── بخش ─────────────────────────────────────────────────────────────────── */

const PAGE_SIZE = 3;

const URGENT_CHIP = { slug: '__urgent__', title: 'فوری‌ها' } as const;

export function KindnessSection({
  listings,
  categories,
  stats,
}: {
  listings: KindListing[];
  categories: KindCategory[];
  stats: KindStats | null;
}) {
  const [category, setCategory] = useState<string>('all');
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [page, setPage] = useState(0);

  /* چیپ‌های دسته: اولویت با endpoint اختصاصی (ایموجی + شمارندهٔ زنده)؛
     fallback: ساخت از خود کارت‌ها وقتی دسته‌ها در دسترس نیستند. */
  const categoryChips = useMemo<KindCategory[]>(() => {
    if (categories.length > 0) {
      const withCount = categories.filter((c) => c.count > 0);
      return withCount.length > 0
        ? withCount
        : categories.slice().sort((a, b) => b.count - a.count);
    }
    const bySlug = new Map<string, KindCategory>();
    for (const l of listings) {
      if (!l.categoryTitle) continue;
      const slug = l.categorySlug ?? l.categoryTitle;
      const prev = bySlug.get(slug);
      if (prev) prev.count += 1;
      else bySlug.set(slug, { slug, title: l.categoryTitle, icon: l.categoryIcon, count: 1 });
    }
    return [...bySlug.values()].sort((a, b) => b.count - a.count);
  }, [categories, listings]);

  const urgentCount = useMemo(
    () => listings.filter((l) => l.urgency === 'urgent').length,
    [listings],
  );

  const filtered = useMemo(
    () =>
      listings.filter((l) => {
        if (urgentOnly && l.urgency !== 'urgent') return false;
        if (category !== 'all' && l.categorySlug !== category && l.categoryTitle !== category)
          return false;
        return true;
      }),
    [listings, urgentOnly, category],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = useMemo(
    () => filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [filtered, page],
  );

  const goPrev = () => setPage((p) => (p - 1 + totalPages) % totalPages);
  const goNext = () => setPage((p) => (p + 1) % totalPages);

  const resetAllFilters = useCallback(() => {
    setCategory('all');
    setUrgentOnly(false);
    setPage(0);
  }, []);
  const pickCategory = useCallback((slug: string) => {
    setCategory(slug);
    setUrgentOnly(false);
    setPage(0);
  }, []);
  const toggleUrgent = useCallback(() => {
    setCategory('all');
    setUrgentOnly((v) => !v);
    setPage(0);
  }, []);

  /* ── شیت راه‌های ارتباط ──────────────────────────────────────────────── */
  const [sheet, setSheet] = useState<{ open: boolean; listing: KindListing | null }>({
    open: false,
    listing: null,
  });

  /* ── کش جزئیات (یک fetch برای هر دو مصرف: شیت تماس + آلبوم) ─────────── */
  const [details, setDetails] = useState<Record<string, KindListingDetail | null>>({});
  const ensureDetail = useCallback(
    (l: KindListing) => {
      if (details[l.slug] !== undefined) return;
      apiFetch<KindListingDetail>(`/kindness-wall/listings/${encodeURIComponent(l.slug)}/`, {
        revalidate: 600,
        tags: [`kindness:${l.slug}`, 'kindness'],
        skipAuth: true,
      })
        .then((d) => setDetails((prev) => ({ ...prev, [l.slug]: d })))
        .catch(() => setDetails((prev) => ({ ...prev, [l.slug]: null })));
    },
    [details],
  );
  const retryDetail = useCallback((l: KindListing) => {
    setDetails((prev) => {
      const next = { ...prev };
      delete next[l.slug];
      return next;
    });
  }, []);
  useEffect(() => {
    /* retry بعد از پاک‌کردن کش → دوباره بگیر */
    if (sheet.open && sheet.listing && details[sheet.listing.slug] === undefined) {
      ensureDetail(sheet.listing);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [details]);

  const openSheet = useCallback(
    (l: KindListing) => {
      setSheet({ open: true, listing: l });
      ensureDetail(l);
    },
    [ensureDetail],
  );
  const closeSheet = useCallback(() => setSheet((s) => ({ ...s, open: false })), []);

  /* ── آلبوم تصاویر ───────────────────────────────────────────────────── */
  const [album, setAlbum] = useState<{
    open: boolean;
    title: string;
    subtitle?: { label: string; value: string };
    images: AlbumImage[];
    loading: boolean;
  }>({ open: false, title: '', images: [], loading: false });
  const closeAlbum = useCallback(() => setAlbum((a) => ({ ...a, open: false })), []);

  const buildAlbumImages = useCallback(
    (l: KindListing, detail: KindListingDetail | null | undefined): AlbumImage[] => {
      const out: AlbumImage[] = [];
      if (l.coverImage) out.push({ url: l.coverImage, alt: l.title });
      for (const im of detail?.images?.slice().sort((a, b) => {
        if (Boolean(b.is_cover) !== Boolean(a.is_cover)) return b.is_cover ? 1 : -1;
        return (a.order ?? 0) - (b.order ?? 0);
      }) ?? []) {
        const url = absoluteMediaUrl(im.image) ?? im.image;
        if (url && !out.some((o) => o.url === url)) out.push({ url, alt: im.alt_text || l.title });
      }
      return out;
    },
    [],
  );

  const openAlbum = useCallback(
    (l: KindListing) => {
      const subtitle = {
        label: 'دسته',
        value: l.categoryTitle ? `${l.categoryTitle} · ${fa(l.quantity)} ${l.unit}` : l.title,
      };
      const cached = details[l.slug];
      setAlbum({
        open: true,
        title: l.title,
        subtitle,
        images: buildAlbumImages(l, cached === null ? undefined : cached),
        loading: cached === undefined,
      });
      if (cached === undefined) ensureDetail(l);
    },
    [details, buildAlbumImages, ensureDetail],
  );

  /* وقتی جزئیات تازه رسید و آلبوم باز است، تصاویر را زنده به‌روز کن */
  const albumSlugRef = useRef<string | null>(null);
  useEffect(() => {
    if (!album.open) return;
    const slug = albumSlugRef.current;
    if (!slug) return;
    const listing = listings.find((l) => l.slug === slug);
    const detail = details[slug];
    if (!listing || detail === undefined) return;
    setAlbum((a) =>
      a.open
        ? {
            ...a,
            images: buildAlbumImages(listing, detail === null ? undefined : detail),
            loading: false,
          }
        : a,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [details, album.open]);

  /* ── نوار اسکرول چیپ‌های دسته (الگوی مشترک صفحه) ─────────────────────── */
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
  }, [categoryChips.length, urgentCount]);
  const scrollCats = (dir: 'left' | 'right') => {
    const el = catScrollRef.current;
    if (!el) return;
    const dx = el.clientWidth * 0.7;
    el.scrollBy({ left: dir === 'left' ? -dx : dx, behavior: 'smooth' });
  };

  const showStats =
    stats !== null && stats.openListings + stats.fulfilled30d + stats.volunteersTotal > 0;

  const sheetListing = sheet.listing;
  const sheetDetail = sheetListing ? details[sheetListing.slug] : undefined;

  return (
    <section className="section-y section-alt" id="kindness">
      <div className="container-edge">
        <SectionTitle
          title="دیوار مهربانی"
          description="اینجا دیوارِ نیازهای واقعی است؛ هر کارت یعنی خانواده‌ای که یک چیز را لازم دارد. اگر داری، از روی همان کارت راه ارتباطی‌اش را بردار — مستقیم و بی‌واسطه."
        />

        {/* روبان آمار زنده‌ی تخته */}
        {showStats && stats && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="mx-auto mb-7 grid max-w-3xl grid-cols-2 gap-2 rounded-[22px] bg-white p-2 shadow-[0_2px_10px_-4px_rgba(15,20,32,.06)] ring-1 ring-ink-100 sm:grid-cols-4"
            data-testid="kw-stats-ribbon"
          >
            <StatChip
              Icon={Layers}
              value={stats.openListings}
              label="نیازِ جاری روی دیوار"
              tone="text-brand-600"
            />
            <StatChip
              Icon={Flame}
              value={stats.urgentListings}
              label="نیازِ فوری"
              tone="text-rose-600"
            />
            <StatChip
              Icon={BadgeCheck}
              value={stats.fulfilled30d}
              label="برطرف‌شده در ۳۰ روز"
              tone="text-mint-600"
            />
            <StatChip
              Icon={HeartHandshake}
              value={stats.volunteersTotal}
              label="دستِ آماده‌ی کمک"
              tone="text-amber-600"
            />
          </motion.div>
        )}

        {/* نوار چیپ‌ها: دسته‌ها + تگل فوری‌ها */}
        {(categoryChips.length > 0 || urgentCount > 0) && (
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
              {/* همه */}
              <ChipButton
                active={category === 'all' && !urgentOnly}
                onClick={resetAllFilters}
                label={`همه (${fa(listings.length)})`}
              />
              {/* فوری‌ها */}
              {urgentCount > 0 && (
                <button
                  key={URGENT_CHIP.slug}
                  type="button"
                  onClick={toggleUrgent}
                  aria-pressed={urgentOnly}
                  className={cn(
                    'inline-flex h-9 flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[12.5px] font-extrabold transition-colors',
                    urgentOnly
                      ? 'bg-gradient-to-l from-[#f43f5e] to-[#e11d48] text-white shadow-[0_6px_14px_-6px_rgba(225,29,72,.55)]'
                      : 'bg-white text-rose-600 ring-1 ring-rose-200 hover:bg-rose-50',
                  )}
                >
                  <Flame className="h-3.5 w-3.5" />
                  فوری‌ها
                  <span
                    className={cn(
                      'inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10.5px] font-extrabold tabular-nums',
                      urgentOnly ? 'bg-white/25' : 'bg-rose-100 text-rose-600',
                    )}
                  >
                    {fa(urgentCount)}
                  </span>
                </button>
              )}
              {/* دسته‌ها */}
              {categoryChips.map((c) => (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => pickCategory(c.slug)}
                  aria-pressed={category === c.slug && !urgentOnly}
                  className={cn(
                    'inline-flex h-9 flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[12.5px] font-extrabold transition-colors',
                    category === c.slug && !urgentOnly
                      ? 'bg-brand-500 text-white shadow-[0_6px_14px_-6px_rgba(13,128,116,.55)]'
                      : 'bg-white text-ink-600 ring-1 ring-ink-100 hover:text-brand-700 hover:ring-brand-200',
                  )}
                >
                  {c.icon && (
                    <span aria-hidden="true" className="text-[14px] leading-none">
                      {c.icon}
                    </span>
                  )}
                  <span>{c.title}</span>
                  <span
                    className={cn(
                      'inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10.5px] font-extrabold tabular-nums',
                      category === c.slug && !urgentOnly
                        ? 'bg-white/25'
                        : 'bg-ink-100 text-ink-500',
                    )}
                  >
                    {fa(c.count)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* شبکه‌ی کارت‌ها */}
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
                  listings.length === 0
                    ? 'دیوار مهربانی دارد شارژ می‌شود'
                    : 'در این فیلتر چیزی نیست'
                }
                description={
                  listings.length === 0
                    ? 'به‌محض ثبت نیازهای جدید، اینجا پین می‌شوند و هر مهربانی می‌تواند مستقیم پاسخ بدهد.'
                    : 'فیلترها را کم‌رنگ‌تر کن تا بقیه‌ی نیازها دیده شوند.'
                }
                iconPath="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
              />
              {listings.length > 0 && (
                <div className="mt-2 text-center">
                  <button
                    type="button"
                    onClick={resetAllFilters}
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
              key={`${category}-${urgentOnly}-${page}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="flex flex-wrap justify-center gap-4 md:gap-5"
            >
              {visible.map((l, i) => (
                <KindnessCard
                  key={l.slug}
                  l={l}
                  delay={i * 0.04}
                  onContact={(x) => {
                    openSheet(x);
                  }}
                  onAlbum={(x) => {
                    albumSlugRef.current = x.slug;
                    openAlbum(x);
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* پیجر */}
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

        {/* جمله‌ی اعتمادِ ته سکشن (به‌جای دکمه‌های مردهٔ موقت) */}
        <p className="mx-auto mt-8 max-w-xl text-center text-[12.5px] font-bold leading-6 text-ink-400">
          نیازی را دیدی که می‌توانی برآورده‌اش کنی؟ از روی همان کارت «راه‌های ارتباط» را باز کن —
          مستقیم، سریع و بی‌واسطه با صاحبِ نیاز حرف بزن.
        </p>
      </div>

      {/* شیت راه‌های ارتباط */}
      {sheetListing && (
        <KindnessContactSheet
          open={sheet.open}
          title={sheetListing.title}
          subtitle={
            sheetDetail?.beneficiary_name ? `به‌نیاب: ${sheetDetail.beneficiary_name}` : undefined
          }
          contactNote={sheetDetail?.contact_note || undefined}
          channels={sheetDetail?.contact_channels ?? []}
          loading={sheetDetail === undefined}
          error={sheetDetail === null}
          onRetry={() => retryDetail(sheetListing)}
          onClose={closeSheet}
        />
      )}

      {/* آلبوم تصاویر */}
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
/*  آجرهای کوچک                                                              */
/* ───────────────────────────────────────────────────────────────────────── */

function StatChip({
  Icon: StatIcon,
  value,
  label,
  tone,
}: {
  Icon: typeof Layers;
  value: number;
  label: string;
  tone: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5">
      <span
        aria-hidden="true"
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink-50 ring-1 ring-ink-100',
          tone,
        )}
      >
        <StatIcon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-[15px] font-extrabold tabular-nums leading-5 text-ink-900">
          {fa(value)}
        </span>
        <span className="block truncate text-[10.5px] font-bold text-ink-400">{label}</span>
      </span>
    </div>
  );
}

function ChipButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex h-9 flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[12.5px] font-extrabold transition-colors',
        active
          ? 'bg-brand-500 text-white shadow-[0_6px_14px_-6px_rgba(13,128,116,.55)]'
          : 'bg-white text-ink-600 ring-1 ring-ink-100 hover:text-brand-700 hover:ring-brand-200',
      )}
    >
      {label}
    </button>
  );
}
