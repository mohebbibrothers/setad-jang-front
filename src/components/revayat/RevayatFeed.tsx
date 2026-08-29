'use client';

/**
 * ═══════════════════════════════════════════════════════════════════
 * RevayatFeed — فیدِ اینستاگرام‌وارِ «روایت‌ها»
 *
 * تجربه:
 *   • موبایل/تبلت: ستونِ تک‌خطیِ پست‌ها وسطِ صفحه (max-w-xl) — مثل
 *     فیدِ اینستاگرام؛ دسکتاپ: چیدمانِ بناعلیِ ۲ ستونه (lg) و ۳ ستونه
 *     (2xl) با columns چندستونه‌ی CSS تا پهنای صفحه پر شود — ترتیبِ
 *     راست‌به‌چپ حفظ می‌شود و کارت‌ها با break-inside-avoid سالم می‌مانند؛
 *   • اسکرولِ بی‌پایان: نگهبانِ IntersectionObserver صفحه‌ی بعد را
 *     ۸۰۰px قبل از رسیدن واکشی می‌کند؛ دکمه‌ی دستیِ «روایت‌های بیشتر»
 *     هم همیشه هست (fallback + دسترس‌پذیری)؛
 *   • سرچ‌بارِ چسبان (زیرِ هدرِ سایت): جست‌وجوی زنده‌ی debounceشده روی
 *     کپشن/عنوان/نویسنده (شهر هم چون داخلِ نامِ حساب است پوشش داده
 *     می‌شود)، چیپ‌های نوع (ویدئو/تصویر/صوت/متن) و چیپِ مکان/نویسنده‌ی
 *     فعال با ضربدر؛ کلیدِ «/» فوکوس را می‌گیرد؛
 *   • URL سینک می‌شود (router.replace بدون اسکرول) تا هر دیدگاه
 *     قابلِ اشتراک‌گذاری باشد؛
 *   • حالت‌ها: اسکلتِ شبح‌وار هنگام جست‌وجو، اسپینرِ انتهایی هنگام
 *     واکشیِ صفحه‌ی بعد، کارتِ خطا با «تلاش دوباره» (بارِ اول یا ادامه)،
 *     حالتِ خالی با «پاک‌کردن فیلترها»، و نشانِ پایانِ فید.
 *
 * مهندسی:
 *   • رقابت‌گریز: هر واکشی آخرینِ خودش را اِعمال می‌کند (seq token) و
 *     درخواستِ قبلی abort می‌شود — تندتایپ‌کردن هرگز فید را نمی‌شکند؛
 *   • نخستین بارگذاری از SSR نفوذ می‌کند و هیچ واکشیِ دوبلای رخ نمی‌دهد؛
 *   • چسباندنِ صفحات با dedupe روی external_id.
 * ═══════════════════════════════════════════════════════════════════
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AudioLines,
  Image as ImageIcon,
  LayoutGrid,
  Loader2,
  MapPin,
  PenLine,
  RefreshCw,
  Search,
  Video,
  X,
} from 'lucide-react';
import { apiFetch, type Paginated } from '@/lib/api';
import { cn, formatPersianNumber } from '@/lib/utils';
import {
  buildFeedPath,
  buildFeedQuery,
  dedupeFeed,
  dedupeFeedContent,
  FEED_TYPE_TABS,
  type FeedFilters,
  type FeedTypeFilter,
  type RevayatItem,
} from '@/lib/revayat';
import { visibleContents } from '@/lib/tabyin-visibility';
import { RevayatCard } from './RevayatCard';

const TYPE_ICONS: Record<FeedTypeFilter, typeof LayoutGrid> = {
  '': LayoutGrid,
  video: Video,
  image: ImageIcon,
  audio: AudioLines,
  other: PenLine,
};

/** کارتِ اسکلت — ریتمِ واقعیِ پست: سربرگ، رسانه، خطوط */
function SkeletonCard() {
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden rounded-3xl border border-ink-100 bg-white p-0"
    >
      <div className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
        <div className="h-10 w-10 animate-pulse rounded-full bg-ink-100" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-1/3 animate-pulse rounded-full bg-ink-100" />
          <div className="h-2.5 w-1/4 animate-pulse rounded-full bg-ink-100/80" />
        </div>
        <div className="h-6 w-14 animate-pulse rounded-full bg-ink-100" />
      </div>
      <div className="animate-pulse bg-gradient-to-b from-ink-100/90 to-ink-50/80 [aspect-ratio:4/3]" />
      <div className="space-y-2.5 px-4 py-4 sm:px-5">
        <div className="h-3 w-2/3 animate-pulse rounded-full bg-ink-100" />
        <div className="h-3 w-full animate-pulse rounded-full bg-ink-100/80" />
        <div className="h-3 w-5/6 animate-pulse rounded-full bg-ink-100/70" />
      </div>
    </div>
  );
}

export function RevayatFeed({
  initialItems,
  initialCount,
  uniqueCount,
  initialHasNext,
  initialFilters,
}: {
  initialItems: RevayatItem[];
  initialCount: number;
  /** شمارِ یکتایِ کلِ کرپوس (پس از dedupe) — فقط برای دیدگاهِ پیش‌فرض
      بدونِ فیلتر؛ در دیدگاهِ فیلتردار شمارِ سرورِ همان نتایج نمایش
      داده می‌شود. */
  uniqueCount?: number;
  initialHasNext: boolean;
  initialFilters: FeedFilters;
}) {
  const router = useRouter();

  /* جهانِ قابل‌نمایش + نسخه‌های «عیناً یکسان» (مخصوصاً نوشته‌های
     سندیکا‌شده) از همان ابتدا و بعد از هر واکشی پالایش می‌شوند —
     همان شروطِ نمایشِ دیوارِ صفحه‌ی اصلی (کاور/ویدئو/متنِ خواندنی)
     و فقط یک نسخه از هر محتوا. */
  const [items, setItems] = useState<RevayatItem[]>(() =>
    dedupeFeedContent(visibleContents(initialItems)),
  );
  const [count, setCount] = useState(initialCount);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(initialHasNext);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<'load' | 'more' | null>(null);

  const [qInput, setQInput] = useState(initialFilters.q);
  const [filters, setFilters] = useState<FeedFilters>(initialFilters);

  const inputRef = useRef<HTMLInputElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const seqRef = useRef(0);
  /* فیلترِ «اعمال‌شده‌ی قبلی» — برای تشخیصِ تغییرِ واقعی (نه mount). */
  const prevFiltersRef = useRef<FeedFilters>(initialFilters);

  /* ── واکشیِ یک صفحه — رقابت‌گریز + abort ── */
  const fetchPage = useCallback(async (f: FeedFilters, pageNo: number, append: boolean) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const seq = ++seqRef.current;

    setError(null);
    if (append) setLoadingMore(true);
    else setLoading(true);

    try {
      const data = await apiFetch<Paginated<RevayatItem>>(
        `/tabyin/contents/?${buildFeedQuery(f, pageNo)}`,
        { signal: ctrl.signal, skipAuth: true } as never,
      );
      if (seq !== seqRef.current) return; // پاسخِ «ازرده»
      setItems((prev) =>
        dedupeFeedContent(visibleContents(append ? dedupeFeed(prev, data.results) : data.results)),
      );
      setCount(data.count);
      setPage(pageNo);
      setHasNext(Boolean(data.next));
    } catch (e) {
      if ((e as { name?: string } | null | undefined)?.name === 'AbortError') return;
      if (seq !== seqRef.current) return;
      setError(append ? 'more' : 'load');
    } finally {
      if (seq === seqRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, []);

  const loadMore = useCallback(() => {
    if (loading || loadingMore || !hasNext || error === 'load') return;
    void fetchPage(filters, page + 1, true);
  }, [error, fetchPage, filters, hasNext, loading, loadingMore, page]);

  const loadMoreRef = useRef(loadMore);
  loadMoreRef.current = loadMore;

  /* ── جست‌وجوی زنده با debounce ── */
  useEffect(() => {
    const t = setTimeout(() => {
      const q = qInput.trim();
      setFilters((f) => (f.q === q ? f : { ...f, q }));
    }, 450);
    return () => clearTimeout(t);
  }, [qInput]);

  /* ── فیلتر عوض شد → صفحه‌ی یک + سینکِ URL ──
     فقط وقتی مجموعه‌ی اعمال‌شده واقعاً عوض شود (mount=SSR هرگز واکشیِ
     دوباره نمی‌کند؛ برگشتن به وضعیتِ اولیه هم «تغییر» حساب می‌شود). */
  useEffect(() => {
    const prev = prevFiltersRef.current;
    if (prev.q === filters.q && prev.type === filters.type && prev.author === filters.author) {
      return;
    }
    prevFiltersRef.current = filters;
    void fetchPage(filters, 1, false);
    router.replace(buildFeedPath(filters), { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  /* ── نگهبانِ اسکرولِ بی‌پایان ── */
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMoreRef.current();
      },
      { rootMargin: '800px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasNext, loading, loadingMore]);

  /* ── میان‌برِ صفحه‌کلید: «/» فوکوسِ جست‌وجو ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const isFiltered = useMemo(
    () => Boolean(filters.q.trim() || filters.type || filters.author.trim()),
    [filters],
  );

  /* عددِ سربرگ: در دیدگاهِ پیش‌فرض، شمارِ «یکتا»ی کلِ کرپوس (هم‌خانواده
     با دیوار)؛ در دیدگاهِ فیلتردار، شمارِ سرورِ همان نتایجِ فیلترشده. */
  const displayCount = !isFiltered && uniqueCount !== undefined ? uniqueCount : count;

  const clearAll = () => {
    setQInput('');
    setFilters({ q: '', type: '', author: '' });
  };

  const pickType = (type: FeedTypeFilter) =>
    setFilters((f) => (f.type === type ? f : { ...f, type }));

  const pickLocation = useCallback((location: string) => {
    setFilters((f) => ({ ...f, author: location }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="pb-16">
      {/* ── سرچ‌بارِ چسبان (زیرِ هدرِ سایت: h-16 موبایل / h-20 دسکتاپ) ── */}
      <div className="sticky top-16 z-40 border-b border-ink-100/80 bg-white/85 backdrop-blur-xl lg:top-20">
        {/* نوارِ پیشرفتِ نازک — فقط هنگام واکشیِ مجدد با محتوای موجود (جست‌وجوی زنده) */}
        {loading && items.length > 0 ? (
          <div aria-hidden="true" className="absolute inset-x-0 -bottom-px h-0.5 overflow-hidden">
            <div className="feed-loader-bar h-full w-1/3 bg-gradient-to-l from-brand-400 via-mint-400 to-brand-500" />
          </div>
        ) : null}
        <div className="mx-auto flex max-w-xl flex-col gap-2.5 px-4 py-3 lg:max-w-6xl 2xl:max-w-7xl">
          <div className="relative">
            <Search className="pointer-events-none absolute right-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-400" />
            <input
              ref={inputRef}
              type="search"
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              placeholder="جست‌وجو در روایت‌ها… (کپشن، نویسنده، شهر)"
              aria-label="جست‌وجو در روایت‌ها"
              className="h-12 w-full rounded-2xl border border-ink-200 bg-ink-50/70 pe-11 ps-11 text-[13.5px] font-semibold text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
            />
            {qInput ? (
              <button
                type="button"
                onClick={() => setQInput('')}
                aria-label="پاک‌کردن جست‌وجو"
                className="absolute left-3 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
              >
                <X className="h-4 w-4" />
              </button>
            ) : (
              <kbd className="pointer-events-none absolute left-3.5 top-1/2 hidden -translate-y-1/2 rounded-md border border-ink-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-ink-400 sm:inline-flex">
                /
              </kbd>
            )}
          </div>

          <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto">
            {FEED_TYPE_TABS.map(({ value, label }) => {
              const TabGlyph = TYPE_ICONS[value];
              const active = filters.type === value;
              return (
                <button
                  key={value || 'all'}
                  type="button"
                  onClick={() => pickType(value)}
                  aria-pressed={active}
                  className={cn(
                    'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12px] font-extrabold transition-all',
                    active
                      ? 'bg-gradient-to-l from-brand-500 to-brand-700 text-white shadow-[0_6px_16px_-6px_rgba(13,128,116,.55)]'
                      : 'bg-ink-50 text-ink-600 ring-1 ring-inset ring-ink-100 hover:bg-ink-100 hover:text-ink-900',
                  )}
                >
                  <TabGlyph className="h-3.5 w-3.5" />
                  {label}
                </button>
              );
            })}
            {filters.author.trim() ? (
              <button
                type="button"
                onClick={() => setFilters((f) => ({ ...f, author: '' }))}
                className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-brand-50 px-3 text-[12px] font-extrabold text-brand-700 ring-1 ring-inset ring-brand-600/15 transition-colors hover:bg-brand-100"
                aria-label={`حذف فیلتر ${filters.author}`}
              >
                <MapPin className="h-3.5 w-3.5" />
                <span className="max-w-32 truncate">{filters.author}</span>
                <X className="h-3 w-3" />
              </button>
            ) : null}
            <span className="me-auto" />
            <span className="shrink-0 text-[11px] font-bold tabular-nums text-ink-400">
              {loading && items.length === 0 ? '…' : `${formatPersianNumber(displayCount)} روایت`}
            </span>
          </div>
        </div>
      </div>

      {/* ── ستونِ فید — موبایل: تک‌ستونه‌ی اینستاگرامی؛ دسکتاپ: بناعلیِ ۲/۳ ستونه ── */}
      <div className="mx-auto max-w-xl px-3 pt-5 sm:px-4 lg:max-w-6xl 2xl:max-w-7xl">
        {loading && items.length === 0 ? (
          <div className="flex flex-col gap-5 lg:block lg:columns-2 lg:gap-6 2xl:columns-3">
            <div className="break-inside-avoid lg:mb-6">
              <SkeletonCard />
            </div>
            <div className="break-inside-avoid lg:mb-6">
              <SkeletonCard />
            </div>
            <div className="hidden break-inside-avoid lg:mb-6 lg:block">
              <SkeletonCard />
            </div>
            <div className="hidden break-inside-avoid lg:mb-6 lg:block">
              <SkeletonCard />
            </div>
          </div>
        ) : items.length === 0 && error === null ? (
          /* ── حالتِ خالی ── */
          <div className="mx-auto max-w-xl rounded-3xl border border-dashed border-ink-200 bg-ink-50/40 px-6 py-14 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-sm ring-1 ring-ink-100">
              <Search className="h-6 w-6" />
            </span>
            <p className="mt-4 text-[15px] font-black text-ink-900">روایتی پیدا نشد</p>
            <p className="mt-1.5 text-[12.5px] font-semibold leading-6 text-ink-500">
              با این فیلترها چیزی نداریم؛ شاید با عبارتِ کوتاه‌تر یا فیلترِ دیگری پیدا شود.
            </p>
            <button
              type="button"
              onClick={clearAll}
              className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-brand-600 px-5 text-[12.5px] font-extrabold text-white transition-colors hover:bg-brand-700"
            >
              <RefreshCw className="h-4 w-4" />
              پاک‌کردن فیلترها
            </button>
          </div>
        ) : error === 'load' && items.length === 0 ? (
          /* ── خطای بارِ اول ── */
          <div className="mx-auto max-w-xl rounded-3xl border border-rose-100 bg-rose-50/50 px-6 py-14 text-center">
            <p className="text-[15px] font-black text-ink-900">ارتباط برقرار نشد</p>
            <p className="mt-1.5 text-[12.5px] font-semibold leading-6 text-ink-500">
              خطایی در دریافتِ روایت‌ها رخ داد؛ معمولاً با یک تلاشِ دوباره درست می‌شود.
            </p>
            <button
              type="button"
              onClick={() => void fetchPage(filters, 1, false)}
              className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-brand-600 px-5 text-[12.5px] font-extrabold text-white transition-colors hover:bg-brand-700"
            >
              <RefreshCw className="h-4 w-4" />
              تلاش دوباره
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-5 lg:block lg:columns-2 lg:gap-6 2xl:columns-3">
            {items.map((item) => (
              <RevayatCard key={item.external_id} item={item} onLocationClick={pickLocation} />
            ))}
          </div>
        )}

        {/* ── نگهبان + ادامه‌ی فید ── */}
        {items.length > 0 && error !== 'load' ? (
          <div ref={sentinelRef} className="mt-5 flex flex-col items-center gap-3 py-2">
            {loadingMore ? (
              <span className="inline-flex items-center gap-2 text-[12px] font-bold text-ink-400">
                <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
                در حال جست‌وجوی روایت‌های بیشتر…
              </span>
            ) : error === 'more' ? (
              <button
                type="button"
                onClick={() => void fetchPage(filters, page + 1, true)}
                className="inline-flex h-10 items-center gap-2 rounded-full border-2 border-brand-500 bg-white px-5 text-[12.5px] font-extrabold text-brand-700 transition-colors hover:bg-brand-50"
              >
                <RefreshCw className="h-4 w-4" />
                تلاش دوباره
              </button>
            ) : hasNext ? (
              <button
                type="button"
                onClick={loadMore}
                className="inline-flex h-10 items-center gap-2 rounded-full border-2 border-brand-500 bg-white px-5 text-[12.5px] font-extrabold text-brand-700 transition-colors hover:bg-brand-50"
              >
                روایت‌های بیشتر
              </button>
            ) : (
              <p className="flex items-center gap-2 text-[11.5px] font-bold text-ink-300">
                <span aria-hidden="true" className="h-px w-10 bg-ink-100" />
                به آخرین روایت رسیدی
                <span aria-hidden="true" className="h-px w-10 bg-ink-100" />
              </p>
            )}
          </div>
        ) : null}
        {isFiltered && items.length > 0 && !loading ? (
          <button
            type="button"
            onClick={clearAll}
            className="mx-auto mt-5 flex text-[11.5px] font-bold text-ink-400 underline decoration-ink-200 underline-offset-4 transition-colors hover:text-brand-700"
          >
            حذفِ همه‌ی فیلترها و دیدنِ کلِ روایت‌ها
          </button>
        ) : null}
      </div>
    </div>
  );
}
