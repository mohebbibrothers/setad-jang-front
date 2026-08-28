'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { searchSourcePage, type SearchHit, type SearchSource } from '@/lib/global-search';
import { SearchHitCard } from './SearchHitCard';
import type { SmartImageVariant } from '@/components/ui/SmartImage';

/**
 * ═══════════════════════════════════════════════════════════════════
 *  SearchGroupSection — یک گروهِ نتایج در صفحه‌ی /search با «نمایشِ
 *  بیشتر»یِ درون‌صفحه‌ای (بدون ترکِ صفحه).
 *
 *  جریانِ داده:
 *    • برشِ اول (هرگز کمتر/بیشتر از pageSize) را صفحه‌ی سرورِ /search
 *      محاسبه می‌کند و به‌صورتِ SSR رندر می‌شود — همان HTML اولیه؛
 *    • دکمه‌ی «نمایش بیشتر» صفحه‌های بعدیِ فقط همین منبع را از API
 *      می‌گیرد و به انتهای همان گرید می‌چسباند تا مثلاً هر ۷۲ نتیجه‌ی
 *      جهاد تبیین در همین صفحه قابل مرور باشد؛
 *    • شمارنده‌ی زنده («نمایش X از Y») بعد از هر دسته به‌روز می‌شود و
 *      وقتی به سرِ فهرست برسیم دکمه به پیامِ پایانی تبدیل می‌شود؛
 *    • خطای شبکه خاموش نمی‌شود: چیپِ «تلاش دوباره» همان صفحه را دوباره
 *      طلب می‌کند؛ درخواست‌های در پرواز وقفه‌پذیرند (AbortController).
 *
 *  دفاع‌های لازم:
 *    • چسباندنِ نتایج با حذفِ تکرارِ id انجام می‌شود (هم‌پوشانیِ مرزِ
 *      صفحه‌ها وقتی داده‌ی سرور بین دو واکشی جابه‌جا شود، تکثیر نمی‌سازد)؛
 *    • race بین کلیک‌های متوالی با نگهبانِ in-flight و abort هنگامِ
 *      unmount کنترل می‌شود.
 * ═══════════════════════════════════════════════════════════════════
 */

/** اسکلتِ شیشه‌ای برای مدتِ بارِ دسته‌ی بعد — هم‌ریتم با کارت‌ها. */
function SkeletonRow() {
  return (
    <li
      aria-hidden="true"
      className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-ink-100"
    >
      <span className="h-14 w-14 shrink-0 animate-pulse rounded-xl bg-ink-100" />
      <span className="min-w-0 flex-1 space-y-2">
        <span className="block h-3 w-3/4 animate-pulse rounded-full bg-ink-100" />
        <span className="block h-2.5 w-1/2 animate-pulse rounded-full bg-ink-50" />
      </span>
    </li>
  );
}

export function SearchGroupSection({
  source,
  q,
  initialHits,
  count,
  pageSize,
  label,
  shortLabel,
  seeAllHref,
  variant,
}: {
  source: SearchSource;
  q: string;
  initialHits: SearchHit[];
  count: number;
  pageSize: number;
  label: string;
  shortLabel: string;
  seeAllHref: string;
  variant: SmartImageVariant;
}) {
  const [hits, setHits] = useState<SearchHit[]>(initialHits);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [revealed, setRevealed] = useState(1); // صفحه‌هایی که تاکنون گرفته‌ایم
  const abortRef = useRef<AbortController | null>(null);

  // unmount ⇒ درخواستِ در پرواز لغو می‌شود (نه setState روی کامپوننتِ مرده، نه مصرفِ بیهوده)
  useEffect(() => () => abortRef.current?.abort(), []);

  const shown = hits.length;
  const hasMore = shown < count;

  async function loadMore() {
    if (loading || !hasMore) return;
    const page = revealed + 1;
    const controller = new AbortController();
    abortRef.current?.abort(); // هرگز دو درخواستِ هم‌زمان برای یک گروه
    abortRef.current = controller;
    setLoading(true);
    setFailed(false);
    try {
      const res = await searchSourcePage(source, q, {
        page,
        pageSize,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      setHits((prev) => {
        const seen = new Set(prev.map((h) => h.id));
        const fresh = res.hits.filter((h) => !seen.has(h.id));
        return [...prev, ...fresh];
      });
      setRevealed(page);
    } catch (err) {
      if ((err as { name?: string } | undefined)?.name === 'AbortError') return;
      if (controller.signal.aborted) return;
      setFailed(true);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  return (
    <section aria-label={label}>
      {/* سربرگِ گروه — عنوان + شمارِ واقعی + لینکِ مقصدِ تخصصی */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[15px] font-extrabold text-ink-900 md:text-[16px]">
          {label}
          <span className="mr-2 font-bold tabular-nums text-ink-400">
            ({count.toLocaleString('fa-IR')})
          </span>
          {count > shown ? (
            <span className="mr-2 text-[11.5px] font-semibold tabular-nums text-ink-400">
              — نمایش {shown.toLocaleString('fa-IR')} از {count.toLocaleString('fa-IR')}
            </span>
          ) : null}
        </h2>
        <Link
          href={seeAllHref}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-brand-50 px-3.5 text-[12.5px] font-extrabold text-brand-700 ring-1 ring-inset ring-brand-600/10 transition-colors hover:bg-brand-100 hover:text-brand-800"
        >
          مشاهده همه در {shortLabel} ←
        </Link>
      </div>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {hits.map((h) => (
          <li key={h.id}>
            <SearchHitCard hit={h} variant={variant} />
          </li>
        ))}
        {loading
          ? Array.from({ length: Math.min(4, Math.max(1, count - shown)) }, (_, i) => (
              <SkeletonRow key={`skel-${i}`} />
            ))
          : null}
      </ul>

      {/* پاصفحه‌ی گروه: نمایشِ بیشتر / تلاش دوباره / پایانِ نتایج */}
      <div className="mt-4 flex flex-col items-center gap-2">
        {failed ? (
          <button
            type="button"
            onClick={loadMore}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-rose-50 px-5 text-[13px] font-extrabold text-rose-700 ring-1 ring-inset ring-rose-600/15 transition-colors hover:bg-rose-100"
          >
            <svg
              viewBox="0 0 24 24"
              width="15"
              height="15"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 12a9 9 0 1 1-2.64-6.36" />
              <path d="M21 3v6h-6" />
            </svg>
            بارگیری ناموفق بود — تلاش دوباره
          </button>
        ) : hasMore ? (
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[13px] font-extrabold text-brand-700 ring-1 ring-inset ring-brand-600/20 transition-all hover:bg-brand-50 hover:ring-brand-600/35 active:scale-[.98] disabled:cursor-wait disabled:opacity-70"
          >
            {loading ? (
              <>
                <svg
                  viewBox="0 0 24 24"
                  width="15"
                  height="15"
                  fill="none"
                  aria-hidden="true"
                  className="animate-spin text-brand-600"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray="42"
                    strokeDashoffset="28"
                  />
                </svg>
                در حال جست‌وجوی نتایج بیشتر…
              </>
            ) : (
              <>
                نمایش بیشتر
                <svg
                  viewBox="0 0 24 24"
                  width="15"
                  height="15"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
                <span className="text-[11px] font-bold tabular-nums text-ink-400">
                  ({(count - shown).toLocaleString('fa-IR')} مورد باقی مانده)
                </span>
              </>
            )}
          </button>
        ) : shown > pageSize ? (
          <p className="flex items-center gap-1.5 text-[11.5px] font-bold text-ink-400">
            <svg
              viewBox="0 0 24 24"
              width="13"
              height="13"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="text-brand-500"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
            همه‌ی {count.toLocaleString('fa-IR')} نتیجه‌ی {label} نمایش داده شد
          </p>
        ) : null}
      </div>
    </section>
  );
}
