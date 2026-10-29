'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, MapPin, RotateCcw, Search } from 'lucide-react';
import {
  IRAN_PROVINCES,
  KINDNESS_BOARD_PATH,
  KINDNESS_SORT_OPTIONS,
  kindnessHubHref,
  type KindnessFilters,
} from '@/lib/kindness-wall';
import { cn } from '@/lib/utils';

/**
 * ───────────────────────────────────────────────────────────────────────────
 * KindnessToolbar — نوارِ ابزارِ زندهٔ هابِ دیوار مهربانی
 *
 * فیلترها سندشان URL است (shareable + Back/Forward-friendly) و خودِ API
 * همین نام‌ها را می‌خواند (search/category/province/city/urgent/ordering):
 *
 *   • جست‌وجو: debounce ۴۵۰ms → router.replace(scroll:false) — تایپِ روان
 *     بدون پریدنِ اسکرول؛ Enter/دکمه = اعمال فوری. (FTS/trgm سمتِ بک‌اند)
 *   • مرتب‌سازی: select → push (Back معنادار) → ویژه‌ها اول/تازه/بازدید/
 *     فوری/انقضا — مقدار '' یعنی ترتیبِ مرجعِ تخته (featured-first بک‌اند).
 *   • استان/شهر: ورودیِ آزاد با debounce ۶۰۰ms + datalistِ ۳۱ استان (فقط
 *     پیشنهاد — فیلتر iexact روی رشتهٔ آزادِ ادمین عمل می‌کند).
 *   • «حذف فیلترها» فقط وقتی فیلتری فعال است.
 *   • نوارِ پیشرفتِ برند در لبهٔ پایین هنگامِ ناوبری (useTransition)؛
 *     prefers-reduced-motion آن را ثابت نگه می‌دارد. (globals.css)
 *
 * state محلیِ اینپوت‌ها با props سینک می‌شود تا Back/Forward/چیپ‌های حذفِ
 * تکیِ فیلترها (سروری) این‌جا را هم به‌روز نگه دارند.
 * ───────────────────────────────────────────────────────────────────────────
 */

const INPUT_CLS =
  'w-full rounded-2xl border border-ink-200 bg-ink-50/50 py-3 text-[13px] text-ink-900 placeholder:text-ink-400 transition-colors focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20';

export function KindnessToolbar({
  filters,
  hasFilters,
}: {
  filters: KindnessFilters;
  hasFilters: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  /* state محلیِ کنترل‌شده ← URL (سینک با Back/Forward و چیپ‌های حذف تکی) */
  const [q, setQ] = useState(filters.search);
  const [prov, setProv] = useState(filters.province);
  const [city, setCity] = useState(filters.city);
  const [ord, setOrd] = useState(filters.ordering);
  useEffect(() => setQ(filters.search), [filters.search]);
  useEffect(() => setProv(filters.province), [filters.province]);
  useEffect(() => setCity(filters.city), [filters.city]);
  useEffect(() => setOrd(filters.ordering), [filters.ordering]);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const geoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
      if (geoTimer.current) clearTimeout(geoTimer.current);
    },
    [],
  );

  /** اعمالِ جست‌وجو — debounce روی تایپ، فوری روی Enter/دکمه. */
  const applySearch = (value: string, immediate = false) => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    const go = () => {
      const href = kindnessHubHref(filters, { search: value, page: 1 });
      startTransition(() => router.replace(href, { scroll: false }));
    };
    if (immediate) go();
    else searchTimer.current = setTimeout(go, 450);
  };

  /** اعمالِ جغرافیا — کمی کندتر (۶۰۰ms) چون دو فیلد پشتِ هم ویرایش می‌شوند. */
  const applyGeo = (patch: Partial<Pick<KindnessFilters, 'province' | 'city'>>) => {
    if (geoTimer.current) clearTimeout(geoTimer.current);
    geoTimer.current = setTimeout(() => {
      const href = kindnessHubHref(filters, { ...patch, page: 1 });
      startTransition(() => router.replace(href, { scroll: false }));
    }, 600);
  };

  const applyOrdering = (value: string) => {
    const href = `${kindnessHubHref(filters, { ordering: value as KindnessFilters['ordering'], page: 1 })}#board`;
    startTransition(() => router.push(href));
  };

  return (
    <form
      action={KINDNESS_BOARD_PATH}
      method="get"
      onSubmit={(e) => {
        e.preventDefault();
        applySearch(q, true);
      }}
      aria-busy={pending}
      className="relative rounded-3xl border border-ink-100 bg-white p-3 shadow-[0_1px_2px_rgba(15,20,32,.04)] sm:p-4"
      data-testid="kw-toolbar"
    >
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
        {/* جست‌وجوی هوشمند */}
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">جست‌وجو در آگهی‌های دیوار مهربانی</span>
          <Search
            className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
            aria-hidden="true"
          />
          <input
            type="search"
            name="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              applySearch(e.target.value);
            }}
            placeholder="جست‌وجو در عنوان و شرح نیازها…"
            autoComplete="off"
            className={cn(INPUT_CLS, 'pl-9 pr-10')}
          />
          <Loader2
            className={cn(
              'pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-500 transition-opacity motion-safe:animate-spin',
              pending ? 'opacity-100' : 'opacity-0',
            )}
            aria-hidden="true"
          />
        </label>

        <div className="grid grid-cols-2 gap-2.5 lg:flex lg:items-center">
          {/* مرتب‌سازی — آینهٔ _ORDERING_CHOICES بک‌اند */}
          <label className="min-w-0">
            <span className="sr-only">مرتب‌سازی آگهی‌ها</span>
            <select
              name="ordering"
              value={ord}
              onChange={(e) => {
                setOrd(e.target.value as KindnessFilters['ordering']);
                applyOrdering(e.target.value);
              }}
              className={cn(INPUT_CLS, 'cursor-pointer px-3 font-bold text-ink-700 lg:w-44')}
            >
              {KINDNESS_SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.value === '' ? `مرتب‌سازی: ${o.label}` : o.label}
                </option>
              ))}
            </select>
          </label>

          {/* استان — datalist پیشنهادی (ورودی آزاد؛ iexact سمت سرور) */}
          <label className="relative min-w-0">
            <span className="sr-only">استان</span>
            <input
              type="text"
              name="province"
              list="kw-provinces"
              value={prov}
              onChange={(e) => {
                setProv(e.target.value);
                applyGeo({ province: e.target.value });
              }}
              placeholder="استان…"
              autoComplete="off"
              className={cn(INPUT_CLS, 'px-3 lg:w-32')}
            />
          </label>
          <datalist id="kw-provinces">
            {IRAN_PROVINCES.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>

          {/* شهر */}
          <label className="relative min-w-0">
            <span className="sr-only">شهر</span>
            <MapPin
              className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400"
              aria-hidden="true"
            />
            <input
              type="text"
              name="city"
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                applyGeo({ city: e.target.value });
              }}
              placeholder="شهر…"
              autoComplete="off"
              className={cn(INPUT_CLS, 'pl-3 pr-9 lg:w-32')}
            />
          </label>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            className="h-[46px] flex-1 rounded-2xl bg-[linear-gradient(135deg,#0D8074,#0A6E64_50%,#085C54)] px-6 text-[13px] font-extrabold text-white shadow-[0_6px_14px_-6px_rgba(13,128,116,.55)] transition-all hover:brightness-[1.08] active:scale-[0.985] lg:flex-none"
          >
            جست‌وجو
          </button>
          {hasFilters && (
            <Link
              href={`${KINDNESS_BOARD_PATH}#board`}
              className="inline-flex h-[46px] items-center gap-1.5 rounded-2xl border border-ink-200 px-4 text-[12px] font-bold text-ink-500 transition-colors hover:border-ink-300 hover:text-ink-700"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              حذف فیلترها
            </Link>
          )}
        </div>
      </div>

      {/* نوارِ پیشرفتِ ناوبری — لبهٔ پایینِ کارتِ ابزار */}
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-x-6 bottom-0 h-[3px] overflow-hidden rounded-full transition-opacity duration-200',
          pending ? 'opacity-100' : 'opacity-0',
        )}
      >
        <div className="kw-toolbar-progress h-full w-1/3 rounded-full bg-gradient-to-l from-brand-400 via-brand-500 to-mint-400" />
      </div>
    </form>
  );
}
