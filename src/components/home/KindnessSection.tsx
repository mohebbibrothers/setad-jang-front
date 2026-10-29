'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { BadgeCheck, Flame, HeartHandshake, Layers } from 'lucide-react';
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
 * سناریوی بک‌اند (kindness_wall v2، کامیت 32ab4e2):
 *   ادمین دسته‌بندی می‌سازد (لوازم آشپزخانه، پوشاک، …) → آگهیِ «نیاز» را
 *   با حداقل یک راه ارتباطی منتشر می‌کند → کاربر می‌بیند و مستقیم با صاحب
 *   نیاز تماس می‌گیرد. دیگر آگهیِ کاربر/تطبیق/ثبت آگهی وجود ندارد.
 *
 * تصمیم‌های محصولیِ این نسخه:
 *   • روبان آمار زنده از /stats (در پنجرهٔ گذار v1 پنهان می‌ماند).
 *   • نوار دسته‌ها = همان «ریل» استاندارد قرارگاه آموزشی: قاب گذرگاه
 *     (rounded-full + shadow-inner)، فلش‌های درجریان، مرکزچینِ RTL-امن
 *     (w-fit + mx-auto + max-w-full تا هرگز اسکرولِ عرضیِ صفحه رخ ندهد)؛
 *     تب «همه» با grid آیکنِ خانواده + تب رزِ «فوری‌ها» در همان ریل.
 *   • شیت راه‌های ارتباط با portal روی body (مانند CampaignAlbum) تا
 *     هرگز جریان صفحه را نشکند.
 *   • هیچ لینک مرده‌ای نیست؛ کاور → آلبوم، CTA → شیت تماس، فوتر →
 *     «مشاهده همه آگهی‌ها» (هابِ مایلستون بعد).
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

/* ── ثابت‌های تخته ───────────────────────────────────────────────────────── */

const PAGE_SIZE = 3;
const ALL_TAB = '__all__';
const URGENT_TAB = '__urgent__';

type RailTab = {
  slug: string;
  title: string;
  count: number;
  icon?: string;
  tone: 'brand' | 'rose';
  grid?: boolean;
};

type RailEdge = { overflowing: boolean; atStart: boolean; atEnd: boolean };

/* ══════════════════════════════════════════════════════════════════════════
 *  سکشن
 * ══════════════════════════════════════════════════════════════════════ */

export function KindnessSection({
  listings,
  categories,
  stats,
}: {
  listings: KindListing[];
  categories: KindCategory[];
  stats: KindStats | null;
}) {
  const [tab, setTab] = useState<string>(ALL_TAB);
  const [page, setPage] = useState(0);

  /* تب‌های ریل: اول «همه»، بعد «فوری‌ها» (اگر نیازی فوری باشد)، بعد دسته‌ها.
     دسته‌ها اولویت با endpoint اختصاصی (ایموجی + شمارندهٔ زنده) دارند؛ اگر
     در دسترس نباشند، از خودِ کارت‌ها ساخته می‌شوند تا ریل هرگز خالی نماند. */
  const tabs = useMemo<RailTab[]>(() => {
    const cats: RailTab[] = (
      categories.length > 0
        ? categories.filter((c) => c.count > 0).map((c) => ({ ...c }))
        : [
            ...listings
              .reduce((map, l) => {
                if (!l.categoryTitle) return map;
                const slug = l.categorySlug ?? l.categoryTitle;
                const prev = map.get(slug);
                if (prev) prev.count += 1;
                else
                  map.set(slug, {
                    slug,
                    title: l.categoryTitle,
                    icon: l.categoryIcon,
                    count: 1,
                  });
                return map;
              }, new Map<string, KindCategory>())
              .values(),
          ]
    ).map((c) => ({ slug: c.slug, title: c.title, icon: c.icon, count: c.count, tone: 'brand' }));

    const urgentCount = listings.filter((l) => l.urgency === 'urgent').length;
    const urgentTab: RailTab[] =
      urgentCount > 0
        ? [{ slug: URGENT_TAB, title: 'فوری‌ها', count: urgentCount, tone: 'rose' }]
        : [];

    return [
      { slug: ALL_TAB, title: 'همه', count: listings.length, tone: 'brand', grid: true },
      ...urgentTab,
      ...cats,
    ];
  }, [categories, listings]);

  const filtered = useMemo(
    () =>
      listings.filter((l) => {
        if (tab === ALL_TAB) return true;
        if (tab === URGENT_TAB) return l.urgency === 'urgent';
        return l.categorySlug === tab || l.categoryTitle === tab;
      }),
    [listings, tab],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = useMemo(
    () => filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [filtered, page],
  );

  const chooseTab = useCallback((slug: string) => {
    setTab(slug);
    setPage(0);
  }, []);

  const goPrev = () => setPage((p) => (p - 1 + totalPages) % totalPages);
  const goNext = () => setPage((p) => (p + 1) % totalPages);

  /* ── شیت راه‌های ارتباط + کش جزئیات (یک fetch برای شیت و آلبوم) ──────── */
  const [sheet, setSheet] = useState<{ open: boolean; listing: KindListing | null }>({
    open: false,
    listing: null,
  });
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
    /* بعد از پاک‌کردن کشِ خطا، دوباره بگیر */
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
  const albumSlugRef = useRef<string | null>(null);
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
      albumSlugRef.current = l.slug;
      const cached = details[l.slug];
      setAlbum({
        open: true,
        title: l.title,
        subtitle: {
          label: 'دسته',
          value: l.categoryTitle ? `${l.categoryTitle} · ${fa(l.quantity)} ${l.unit}` : l.title,
        },
        images: buildAlbumImages(l, cached === null ? undefined : cached),
        loading: cached === undefined,
      });
      if (cached === undefined) ensureDetail(l);
    },
    [details, buildAlbumImages, ensureDetail],
  );

  /* وقتی جزئیات تازه رسید و آلبوم باز است، تصاویر را زنده به‌روز کن */
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

  const showStats =
    stats !== null && stats.openListings + stats.fulfilled30d + stats.volunteersTotal > 0;

  const sheetListing = sheet.listing;
  const sheetDetail = sheetListing ? details[sheetListing.slug] : undefined;

  return (
    <section className="section-y section-alt" id="kindness">
      <div className="container-edge">
        <SectionTitle
          title="دیوار مهربانی"
          description="نیازی را دیدی که می‌توانی برآورده‌اش کنی؟ از روی همان کارت «راه‌های ارتباط» را باز کن — مستقیم، سریع و بی‌واسطه با صاحبِ نیاز حرف بزن."
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

        {/* ریل دسته‌ها — الگوی استاندارد قرارگاه آموزشی (مرکزچین + گذرگاه) */}
        {listings.length > 0 && tabs.length > 1 && (
          <KindnessRail tabs={tabs} active={tab} onChoose={chooseTab} />
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
                    onClick={() => chooseTab(ALL_TAB)}
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
              key={`${tab}-${page}`}
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
                  onContact={openSheet}
                  onAlbum={openAlbum}
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

        {/* دکمهٔ «مشاهده همه» — همان الگوی بقیهٔ سکشن‌ها */}
        {listings.length > 0 && (
          <div className="mt-8 flex items-center justify-center md:mt-10">
            <Link
              href="/#kindness"
              className="inline-flex h-12 items-center gap-2 rounded-full border-2 border-brand-500 bg-white px-7 text-[14px] font-extrabold text-brand-700 transition-colors hover:bg-brand-50"
            >
              <span>مشاهده همه آگهی‌ها</span>
              <Icon name="arrow-left" className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>

      {/* شیت راه‌های ارتباط (portal به body) */}
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

      {/* آلبوم تصاویر (portal به body — الگوی موجود) */}
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

/* ══════════════════════════════════════════════════════════════════════════
 *  آجرهای کوچک
 * ══════════════════════════════════════════════════════════════════════ */

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

/* ── ریل دسته‌ها — دقیقاً الگوی CategoryRail قرارگاه آموزشی ────────────── */

function KindnessRail({
  tabs,
  active,
  onChoose,
}: {
  tabs: RailTab[];
  active: string;
  onChoose: (slug: string) => void;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState<RailEdge>({ overflowing: false, atStart: true, atEnd: true });

  /* ریاضیاتِ RTLِ مطمئن: scrollLeft از ۰ تا max (قدر مطلق)؛ در مرورگرهای
     مدرنِ RTL از ۰ به‌سمت −max می‌رود پس abs می‌گیریم. */
  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    const measure = () => {
      const max = Math.max(0, el.scrollWidth - el.clientWidth);
      const pos = Math.abs(el.scrollLeft);
      setEdge({
        overflowing: max > 4,
        atStart: pos <= 4,
        atEnd: pos >= max - 4,
      });
    };
    measure();
    el.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    return () => {
      el.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
    };
  }, [tabs.length]);

  /* scrollBy روی مختصاتِ «فیزیکی» کار می‌کند (مستقل از RTL):
     +delta → حرکت به‌سمت راست (بازگشت به ابتدا)، −delta → رفتن به انتها. */
  const scrollRail = useCallback((dir: 1 | -1) => {
    const el = railRef.current;
    if (!el) return;
    const delta = Math.max(120, Math.round(el.clientWidth * 0.7)) * dir;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  }, []);

  return (
    /* قابِ مرکزچینِ RTL-امن: w-fit + mx-auto + max-w-full — نکتهٔ لایه‌بندی
       ثبت‌شده در CategoryRail آموزش؛ ریل هرگز صفحه را عرضی اسکرول نمی‌کند. */
    <div className="mx-auto mb-8 w-fit max-w-full px-2 sm:px-0">
      <div className="flex items-center justify-center gap-1.5">
        {edge.overflowing && (
          <RailArrow direction="right" disabled={edge.atStart} onClick={() => scrollRail(1)} />
        )}

        <div
          ref={railRef}
          role="tablist"
          aria-label="دسته‌بندی و فوریت دیوار مهربانی"
          className="min-w-0 max-w-full overflow-x-auto rounded-full bg-ink-50 p-1 shadow-inner ring-1 ring-ink-100 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          data-testid="kw-rail"
        >
          <div className="flex w-max items-center gap-1">
            {tabs.map((t) => {
              const isActive = active === t.slug;
              const isRose = t.tone === 'rose';
              return (
                <button
                  key={t.slug}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={(e) => {
                    onChoose(t.slug);
                    /* تبِ تازه‌انتخاب‌شده اگر نیمه‌پنهان در لبه بود، نرم
                       داخلِ قاب می‌آید — block:'nearest' تا اسکرولِ
                       عمودیِ صفحه جابه‌جا نشود. */
                    e.currentTarget.scrollIntoView({
                      behavior: 'smooth',
                      block: 'nearest',
                      inline: 'nearest',
                    });
                  }}
                  className={cn(
                    'inline-flex h-10 shrink-0 select-none items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[12px] font-extrabold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-50 active:scale-[.97] sm:px-4 sm:text-[12.5px]',
                    isActive
                      ? isRose
                        ? 'bg-gradient-to-l from-[#f43f5e] to-[#e11d48] text-white shadow-[0_8px_20px_-6px_rgba(225,29,72,.55)]'
                        : 'bg-gradient-to-l from-brand-500 to-brand-700 text-white shadow-[0_8px_20px_-6px_rgba(13,128,116,.55)]'
                      : isRose
                        ? 'text-rose-600 hover:bg-white/60 hover:text-rose-700'
                        : 'text-ink-600 hover:bg-white/60 hover:text-ink-900',
                  )}
                >
                  {t.grid && <Icon name="grid" className="h-3.5 w-3.5 shrink-0" />}
                  {isRose && <Flame className="h-3.5 w-3.5 shrink-0" />}
                  {t.icon && !t.grid && !isRose && (
                    <span aria-hidden="true" className="text-[14px] leading-none">
                      {t.icon}
                    </span>
                  )}
                  <span className="truncate">{t.title}</span>
                  <span
                    className={cn(
                      'inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10.5px] font-extrabold tabular-nums',
                      isActive
                        ? 'bg-white/25 text-white'
                        : isRose
                          ? 'bg-rose-100 text-rose-600'
                          : 'bg-ink-100 text-ink-500',
                    )}
                  >
                    {fa(t.count)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {edge.overflowing && (
          <RailArrow direction="left" disabled={edge.atEnd} onClick={() => scrollRail(-1)} />
        )}
      </div>
    </div>
  );
}

function RailArrow({
  direction,
  disabled,
  onClick,
}: {
  direction: 'left' | 'right';
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={direction === 'right' ? 'برگشت به ابتدای ریل' : 'رفتن به دنباله‌ی ریل'}
      disabled={disabled}
      onClick={onClick}
      className="grid h-9 w-9 shrink-0 select-none place-items-center rounded-full border-2 border-brand-500 bg-white text-brand-700 shadow-[0_4px_12px_-4px_rgba(13,128,116,.35)] transition-all duration-200 hover:bg-brand-50 hover:shadow-[0_8px_18px_-6px_rgba(13,128,116,.45)] active:scale-95 disabled:cursor-not-allowed disabled:border-ink-200 disabled:text-ink-300 disabled:shadow-none disabled:hover:bg-white"
    >
      <Icon name={direction === 'left' ? 'chevron-left' : 'chevron-right'} className="h-4 w-4" />
    </button>
  );
}
