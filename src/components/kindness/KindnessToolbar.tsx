'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, RotateCcw, SlidersHorizontal, Timer } from 'lucide-react';
import { KindnessSelect, type KindnessOption } from './KindnessSelect';
import { KindnessSearchField } from './KindnessSearchField';
import {
  IRAN_PROVINCES,
  KINDNESS_BOARD_PATH,
  KINDNESS_SORT_OPTIONS,
  fetchGeoCities,
  kindnessHubHref,
  type KindnessFilters,
} from '@/lib/kindness-wall';
import { cn } from '@/lib/utils';

/**
 * ───────────────────────────────────────────────────────────────────────────
 * KindnessToolbar — نوارِ ابزارِ تخته (زنده، بی‌پرش، هم‌نام با API)
 *
 * چیدمان: [جست‌وجو + دکمه] [مرتب‌سازی] [استان] [شهر] [حذف فیلترها]
 *
 * • همهٔ فیلترها سندشان URL است ⇒ shareable، Back/Forward-friendly و
 *   سرور-رندر. تغییرات با `replace(..., {scroll:false})` می‌نشینند تا
 *   صفحه نپرد (مرتب‌سازی با `#board` می‌نشیند تا چشم جای نتیجه بماند).
 * • دراپ‌دان‌ها کامپوننتِ ساختهٔ دستِ KindnessSelect‌اند (پورتالی، کیبورد،
 *   اسکرول‌بارِ سایت، موبایل‌باتم‌شیت) — هیچ selectِ بومی‌ای در صفحه نیست.
 * • استان‌ها از دیتاستِ رسمیِ بک‌اند می‌آیند (`provinces` prop = /geo/provinces/)
 *   و **شهرها به‌صورتِ وابسته** با انتخابِ استان از `/geo/cities/?province=…`
 *   بارگذاری می‌شوند؛ همان دیتاستی که ادمین در پنل از آن انتخاب می‌کند، پس
 *   هر شهری که ادمین برگزیند قطعاً در فیلترِ کاربر هم هست. تا استان انتخاب
 *   نشود، فیلدِ شهر غیرفعال است (شهر بدونِ استان در بک‌اند معنا ندارد).
 * • نوارِ پیشرفتِ برند در لبهٔ پایین هنگامِ pending؛ رعایتِ
 *   prefers-reduced-motion در globals.css.
 * ───────────────────────────────────────────────────────────────────────────
 */

/** گزینه‌های مرتب‌سازی — آینهٔ `_ORDERING_CHOICES` بک‌اند. */
const SORT_OPTIONS: KindnessOption[] = KINDNESS_SORT_OPTIONS.map((o) => ({
  value: o.value,
  label: o.label,
}));

export function KindnessToolbar({
  filters,
  hasFilters,
  provinces,
}: {
  filters: KindnessFilters;
  hasFilters: boolean;
  /** فهرستِ رسمیِ استان‌ها (از /geo/provinces/ با fallback ثابتِ فرانت). */
  provinces?: string[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const navigate = useCallback(
    (next: KindnessFilters) => {
      startTransition(() => router.replace(kindnessHubHref(next, {}), { scroll: false }));
    },
    [router],
  );

  /* ── سینکِ خوش‌رفتارِ مقادیرِ انتخابی با URL ──────────────────────────
     مقدارِ محلی فوراً عوض می‌شود (بازخوردِ کلیک)، ولی اگر prop از بیرون
     تغییر کند (Back/چیپِ حذف) هم دوباره هم‌گام می‌شود. `lastPushed` جلوی
     بازنویسیِ مقدارِ تازه‌تایپ‌شده را می‌گیرد. */
  const [pv, setPv] = useState(filters.province);
  const [ct, setCt] = useState(filters.city);
  const pushed = useRef({ province: filters.province, city: filters.city });

  useEffect(() => {
    if (filters.province !== pushed.current.province) {
      pushed.current.province = filters.province;
      setPv(filters.province);
    }
    if (filters.city !== pushed.current.city) {
      pushed.current.city = filters.city;
      setCt(filters.city);
    }
  }, [filters.province, filters.city]);

  /* گزینه‌ها: اجتماعِ «۳۱ استانِ رسمی» + «استان‌های موجود در تخته» + مقدارِ
     فعالِ فعلی. بدون این اجتماع، اگر ادمین استانی بیرون از فهرستِ رسمی تایپ
     کرده باشد یا کاربر با لینکِ اشتراکیِ استانی بیاید، فیلد خالی («همهٔ
     استان‌ها») نشان می‌داد درحالی‌که فیلتر فعال بود. */
  const provinceOptions: KindnessOption[] = Array.from(
    new Set([...(provinces?.length ? provinces : IRAN_PROVINCES), ...(pv ? [pv] : [])]),
  ).map((p) => ({ value: p, label: p }));

  /* ── شهرهای وابسته: هر بار که استان عوض شود از APIِ geo می‌آیند ──────── */
  const [cityList, setCityList] = useState<string[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  useEffect(() => {
    const province = pv.trim();
    if (!province) {
      setCityList([]);
      return;
    }
    let alive = true;
    setCitiesLoading(true);
    fetchGeoCities(province)
      .then((list) => {
        if (alive) setCityList(list);
      })
      .finally(() => {
        if (alive) setCitiesLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [pv]);

  const cityOptions: KindnessOption[] = Array.from(new Set([...cityList, ...(ct ? [ct] : [])])).map(
    (c) => ({ value: c, label: c }),
  );

  return (
    <div
      aria-busy={pending}
      className="relative rounded-3xl border border-ink-100 bg-white p-3 shadow-[0_1px_2px_rgba(15,20,32,.04)] sm:p-4"
      data-testid="kw-toolbar"
    >
      <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center">
        {/* جست‌وجوی هوشمند — کامپوننتِ بی‌پرش */}
        <div className="min-w-0 flex-1">
          <KindnessSearchField
            value={filters.search}
            pending={pending}
            onNavigate={(search) => navigate({ ...filters, search, page: 1 })}
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:flex xl:w-auto xl:items-center">
          {/* مرتب‌سازی */}
          <div className="min-w-0">
            <KindnessSelect
              ariaLabel="مرتب‌سازی آگهی‌ها"
              value={filters.ordering}
              onChange={(ordering) =>
                // مرتب‌سازی با push + لنگرِ #board: Back معنادار، چشم جای نتیجه
                startTransition(() =>
                  router.push(
                    `${kindnessHubHref({ ...filters, ordering: ordering as KindnessFilters['ordering'], page: 1 }, {})}#board`,
                  ),
                )
              }
              options={SORT_OPTIONS}
              placeholder="مرتب‌سازی"
              stackedLabel="مرتب‌سازی"
              leadingIcon={SlidersHorizontal}
              className="xl:w-[184px]"
              testId="kw-filter-sort"
            />
          </div>

          {/* استان */}
          <div className="min-w-0">
            <KindnessSelect
              ariaLabel="فیلتر استان"
              value={pv}
              onChange={(province) => {
                pushed.current.province = province;
                setPv(province);
                navigate({ ...filters, province, page: 1 });
              }}
              options={provinceOptions}
              placeholder="همهٔ استان‌ها"
              searchable
              searchPlaceholder="نامِ استان…"
              clearLabel="همهٔ استان‌ها"
              className="xl:w-[150px]"
              testId="kw-filter-province"
            />
          </div>

          {/* شهر — پیشنهاد از تخته + عبارتِ آزاد */}
          <div className="col-span-2 min-w-0 sm:col-span-1">
            <KindnessSelect
              ariaLabel="فیلتر شهر"
              value={ct}
              onChange={(city) => {
                pushed.current.city = city;
                setCt(city);
                navigate({ ...filters, city, page: 1 });
              }}
              options={cityOptions}
              placeholder={
                !pv
                  ? 'ابتدا استان را انتخاب کنید'
                  : citiesLoading
                    ? 'در حال بارگذاری…'
                    : 'همهٔ شهرها'
              }
              disabled={!pv}
              searchable
              searchPlaceholder="نامِ شهر…"
              clearLabel="همهٔ شهرها"
              leadingIcon={MapPin}
              className="xl:w-[150px]"
              testId="kw-filter-city"
            />
          </div>
        </div>

        {/* حذفِ فیلترها — فقط وقتی فیلتری فعال است */}
        {hasFilters && (
          <Link
            href={`${KINDNESS_BOARD_PATH}#board`}
            className="inline-flex h-[52px] items-center justify-center gap-1.5 rounded-2xl border border-ink-200 px-4 text-[12px] font-extrabold text-ink-500 transition-colors hover:border-brand-300 hover:bg-brand-50/60 hover:text-brand-700"
            data-testid="kw-clear-filters"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            حذف فیلترها
          </Link>
        )}
      </div>

      {/* راهنمای زیرِ نوار: چرا این فیلترها + کدام فیلتر فعال است */}
      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-[10.5px] font-bold text-ink-400">
        <span className="inline-flex items-center gap-1">
          <Timer className="h-3 w-3" aria-hidden="true" />
          نتایج زنده از تختهٔ دیوار مهربانی
        </span>
        <span className="hidden sm:inline">·</span>
        <span className="hidden sm:inline">جست‌وجو روی عنوان، شرح و سندِ نیاز اجرا می‌شود</span>
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
    </div>
  );
}
