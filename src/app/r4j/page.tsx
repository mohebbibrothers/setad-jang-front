import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Gavel,
  MapPin,
  RotateCcw,
  Search,
  Trophy,
} from 'lucide-react';
import {
  bountyFa,
  criminalFullName,
  fetchCriminalsPage,
  locationLine,
  type CriminalListItem,
} from '@/lib/r4j';
import { EmptyState } from '@/components/home/EmptyState';
import { SmartImage } from '@/components/ui/SmartImage';
import { cn, formatPersianNumber, toPersianDigits } from '@/lib/utils';

/**
 * ═══════════════════════════════════════════════════════════════════
 * r4j/ — هابِ «جایزه‌ای برای عدالت»
 *
 *   • SSR کامل + ISR (revalidate=300) — اولین نمایشِ واقعیِ قراردادِ
 *     GET /r4j/criminals/ (search / ordering / location / gender / page).
 *   • مرتب‌سازی‌ها از OrderingFilterِ بک‌اند تغذیه می‌شوند؛ پیش‌فرضِ
 *     صفحه «بیشترین جایزه» است (مثل فهرست‌های Most Wanted مراجع جهانی).
 *   • کارت‌ها کاملاً سرور-رندر می‌شوند: عکس اصلی، نام، مکان، روبانِ
 *     جایزه و شمارِ تعهدها — بدون حتی یک فچِ کلاینت.
 *   • صفحه‌بندی با حفظِ فیلترهای فعال؛ حالتِ خالی با EmptyStateِ مشترک.
 * ═══════════════════════════════════════════════════════════════════
 */

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'جایزه‌ای برای عدالت',
  description:
    'پرونده‌های عمومی «جایزه‌ای برای عدالت»؛ مشاهده‌ی مشخصات اعلام‌شده، افزایش جایزه برای اجرای عدالت و ارسال سرنخ و گزارش تکمیلی از سوی مردم.',
};

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { value: '-total_bounty_toman', label: 'بیشترین جایزه' },
  { value: '-bounties_count', label: 'بیشترین تعهد' },
  { value: '-published_at', label: 'جدیدترین پرونده‌ها' },
  { value: 'published_at', label: 'قدیمی‌ترین پرونده‌ها' },
  { value: 'last_name', label: 'نام خانوادگی (الفبا)' },
  { value: 'first_name', label: 'نام (الفبا)' },
] as const;

const DEFAULT_ORDERING = '-total_bounty_toman';

const GENDER_OPTIONS = [
  { value: '', label: 'جنسیت: همه' },
  { value: 'male', label: 'مرد' },
  { value: 'female', label: 'زن' },
  { value: 'unknown', label: 'نامشخص' },
] as const;

type Filters = {
  search: string;
  ordering: string;
  city: string;
  province: string;
  country: string;
  gender: string;
  page: number;
};

function readFilters(sp: Record<string, string | string[] | undefined>): Filters {
  const one = (k: string) => {
    const v = sp[k];
    return typeof v === 'string' ? v.trim() : '';
  };
  const ordering = one('ordering');
  const allowedOrdering = SORT_OPTIONS.some((o) => o.value === ordering)
    ? ordering
    : DEFAULT_ORDERING;
  const pageRaw = Number(one('page'));
  return {
    search: one('search'),
    ordering: allowedOrdering,
    city: one('city'),
    province: one('province'),
    country: one('country'),
    gender: one('gender'),
    page: Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1,
  };
}

/** ساخت query string با حفظِ فیلترهای فعال (برای صفحه‌بندی و حذف تکیِ فیلترها) */
function qsWith(f: Filters, override: Partial<Filters>): string {
  const merged = { ...f, ...override };
  const q = new URLSearchParams();
  if (merged.search) q.set('search', merged.search);
  if (merged.ordering && merged.ordering !== DEFAULT_ORDERING) q.set('ordering', merged.ordering);
  if (merged.city) q.set('city', merged.city);
  if (merged.province) q.set('province', merged.province);
  if (merged.country) q.set('country', merged.country);
  if (merged.gender) q.set('gender', merged.gender);
  if (merged.page > 1) q.set('page', String(merged.page));
  const s = q.toString();
  return s ? `?${s}` : '';
}

/* ────────────────────────────────────────────────────────────
 * CriminalCard — کارتِ پرونده (سرور-رندر)
 * ──────────────────────────────────────────────────────────── */
function CriminalCard({ c, eager }: { c: CriminalListItem; eager: boolean }) {
  const name = criminalFullName(c) || c.slug;
  const loc = locationLine(c);
  const photo = c.primary_photo?.image ?? null;
  return (
    <Link
      href={`/r4j/${encodeURIComponent(c.slug)}`}
      className="group relative block overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-[0_1px_2px_rgba(15,20,32,.04)] transition-all duration-300 hover:-translate-y-1 hover:border-ink-200 hover:shadow-[0_16px_40px_-16px_rgba(15,20,32,.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-ink-100">
        <SmartImage
          src={photo}
          alt={name}
          variant="criminal"
          fill
          sizes="(min-width:1280px) 25vw, (min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
          priority={eager}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
        />
        {/* گرادیانِ پایین برای خواناییِ نوارِ هویت */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-ink-900/85 via-ink-900/40 to-transparent"
        />
        {/* روبانِ جایزه */}
        <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-accent-500/95 px-3 py-1.5 text-[12px] font-extrabold text-white shadow-lg shadow-accent-900/20 backdrop-blur-sm">
          <Trophy className="h-3.5 w-3.5" aria-hidden="true" />
          <span>
            {c.total_bounty_toman > 0 ? bountyFa(c.total_bounty_toman) : 'بدون جایزهٔ فعال'}
          </span>
        </div>
        {/* نوارِ هویت */}
        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
          <h3 dir="auto" className="truncate text-[16px] font-extrabold leading-snug text-white">
            {name}
          </h3>
          <div className="mt-1 flex items-center justify-between gap-3 text-[12px] text-white/85">
            {loc ? (
              <span className="flex min-w-0 items-center gap-1">
                <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{loc}</span>
              </span>
            ) : (
              <span aria-hidden="true" />
            )}
            <span className="shrink-0 rounded-full bg-white/15 px-2 py-0.5 font-bold backdrop-blur-sm">
              {c.bounties_count > 0
                ? `${toPersianDigits(c.bounties_count)} تعهد`
                : 'نخستین تعهد را ثبت کنید'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default async function R4JHubPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const f = readFilters(sp);

  const [page, top] = await Promise.all([
    fetchCriminalsPage({
      page: f.page,
      pageSize: PAGE_SIZE,
      ordering: f.ordering,
      search: f.search,
      city: f.city,
      province: f.province,
      country: f.country,
      gender: f.gender,
    }),
    // آمارِ قهرمانِ هاب: تعداد کلِ پرونده‌ها + بیشترین جایزهٔ فعال (کش‌شده)
    fetchCriminalsPage({ pageSize: 1, ordering: '-total_bounty_toman' }),
  ]);

  const items = page?.results ?? [];
  const count = page?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const currentPage = Math.min(f.page, totalPages);

  const totalProfiles = top?.count ?? count;
  const topBounty = top?.results?.[0]?.total_bounty_toman ?? 0;

  const hasFilter = Boolean(f.search || f.city || f.province || f.country || f.gender);

  // بازه‌ی صفحه‌ها (پنجره‌ی لغزانِ ۵تایی، RTL: از صفحه‌ی ۱ به بالا)
  const windowStart = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  const windowPages = Array.from(
    { length: Math.min(5, totalPages) },
    (_, i) => windowStart + i,
  ).filter((p) => p <= totalPages);

  return (
    <main className="pb-16">
      {/* ══════════ قهرمانِ هاب ══════════ */}
      <section className="relative overflow-hidden bg-ink-900 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.55]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(-45deg, rgba(255,255,255,.035) 0 2px, transparent 2px 14px)',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-accent-500/20 blur-3xl"
        />
        <div className="container-edge relative py-14 md:py-20">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[12px] font-bold text-white/80 backdrop-blur-sm">
              <Gavel className="h-4 w-4 text-accent-300" aria-hidden="true" />
              صندوقِ عدالتِ مردمی
            </p>
            <h1 className="mt-5 text-3xl font-black leading-tight text-white md:text-5xl">
              جایزه‌ای برای عدالت
            </h1>
            <p className="mt-4 max-w-2xl text-[14px] leading-8 text-white/75 md:text-[15px]">
              این‌جا پرونده‌های عمومی نمایش داده می‌شود؛ هر کاربر می‌تواند با ثبتِ تعهد، جایزه‌ی
              اجرای عدالت را بیشتر کند و با ارسال گزارش و سرنخ، اطلاعات هر پرونده را تکمیل‌تر. هر
              کمکِ کوچک، عدالت را یک قدم نزدیک‌تر می‌کند.
            </p>
            {/* آمار */}
            <div className="mt-8 flex flex-wrap items-stretch gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-sm">
                <div className="text-2xl font-black tabular-nums text-accent-300 md:text-3xl">
                  {formatPersianNumber(totalProfiles)}
                </div>
                <div className="mt-1 text-[12px] font-bold text-white/70">پروندهٔ عمومیِ فعال</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-sm">
                <div className="text-2xl font-black tabular-nums text-accent-300 md:text-3xl">
                  {topBounty > 0 ? bountyFa(topBounty) : '—'}
                </div>
                <div className="mt-1 text-[12px] font-bold text-white/70">
                  بیشترین جایزهٔ فعال روی یک پرونده
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-sm">
                <div className="text-2xl font-black tabular-nums text-accent-300 md:text-3xl">
                  {bountyFa(50_000)}
                </div>
                <div className="mt-1 text-[12px] font-bold text-white/70">حداقل مبلغِ هر تعهد</div>
              </div>
            </div>
            <div className="mt-8">
              <a
                href="#cases"
                className="inline-flex items-center gap-2 rounded-2xl bg-accent-500 px-6 py-3.5 text-[14px] font-extrabold text-white shadow-lg shadow-accent-900/30 transition-all hover:bg-accent-400 active:scale-[.98]"
              >
                مشاهده‌ی پرونده‌ها
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ چگونه مشارکت کنیم ══════════ */}
      <section className="container-edge relative z-10 -mt-8">
        <div className="grid gap-3 rounded-3xl border border-ink-100 bg-white p-4 shadow-[0_12px_32px_-20px_rgba(15,20,32,.25)] sm:grid-cols-3 md:p-5">
          {[
            {
              icon: Search,
              title: 'پرونده را باز کنید',
              text: 'مشخصات، عکس‌ها و اسنادِ اعلام‌شدهٔ هر مجرم را کامل ببینید.',
            },
            {
              icon: FileText,
              title: 'سرنخ دارید؟ گزارش دهید',
              text: 'هر اطلاعات تکمیلی — از نام مستعار تا شماره تماس — پس از بررسی اعمال می‌شود.',
            },
            {
              icon: Trophy,
              title: 'جایزه را بیشتر کنید',
              text: 'با ثبت تعهدِ مالی، انگیزه‌ی همکاری برای اجرای عدالت را بالا ببرید.',
            },
          ].map((s) => (
            <div key={s.title} className="flex items-start gap-3 rounded-2xl bg-ink-50/60 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600">
                <s.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h2 className="text-[13px] font-extrabold text-ink-900">{s.title}</h2>
                <p className="mt-1 text-[12px] leading-6 text-ink-500">{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════ نوارِ فیلتر ══════════ */}
      <section id="cases" className="container-edge mt-10 scroll-mt-24">
        <form
          action="/r4j"
          method="get"
          className="flex flex-col gap-3 rounded-3xl border border-ink-100 bg-white p-4 shadow-[0_1px_2px_rgba(15,20,32,.04)] md:flex-row md:items-center"
        >
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">جستجو در پرونده‌ها</span>
            <Search
              className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
              aria-hidden="true"
            />
            <input
              type="search"
              name="search"
              defaultValue={f.search}
              placeholder="جستجو در نام، نام مستعار یا شناسهٔ پرونده…"
              className="w-full rounded-2xl border border-ink-200 bg-ink-50/50 py-3 pl-3 pr-10 text-[13px] text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </label>
          <div className="grid grid-cols-2 gap-3 md:flex md:items-center">
            <label className="min-w-0">
              <span className="sr-only">شهر</span>
              <input
                type="text"
                name="city"
                defaultValue={f.city}
                placeholder="شهر…"
                className="w-full rounded-2xl border border-ink-200 bg-ink-50/50 px-3 py-3 text-[13px] text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 md:w-32"
              />
            </label>
            <label className="min-w-0">
              <span className="sr-only">جنسیت</span>
              <select
                name="gender"
                defaultValue={f.gender}
                className="w-full rounded-2xl border border-ink-200 bg-ink-50/50 px-3 py-3 text-[13px] font-bold text-ink-700 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 md:w-32"
              >
                {GENDER_OPTIONS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="min-w-0">
              <span className="sr-only">مرتب‌سازی</span>
              <select
                name="ordering"
                defaultValue={f.ordering}
                className="w-full rounded-2xl border border-ink-200 bg-ink-50/50 px-3 py-3 text-[13px] font-bold text-ink-700 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 md:w-44"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 rounded-2xl bg-ink-900 px-6 py-3 text-[13px] font-extrabold text-white transition-colors hover:bg-ink-800 md:flex-none"
            >
              اعمال فیلتر
            </button>
            {hasFilter && (
              <Link
                href="/r4j"
                className="flex items-center gap-1.5 rounded-2xl border border-ink-200 px-4 py-3 text-[12px] font-bold text-ink-500 transition-colors hover:border-ink-300 hover:text-ink-700"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                حذف فیلترها
              </Link>
            )}
          </div>
        </form>

        {/* تراژدیِ نتایج */}
        <div className="mt-6 flex items-center justify-between text-[12px] font-bold text-ink-500">
          <p>
            {hasFilter ? 'نتایج فیلترشده:' : 'همه‌ی پرونده‌ها:'}{' '}
            <span className="tabular-nums text-ink-900">{formatPersianNumber(count)}</span> پرونده
            {totalPages > 1 && (
              <>
                {' '}
                — صفحه <span className="tabular-nums">{toPersianDigits(currentPage)}</span> از{' '}
                <span className="tabular-nums">{toPersianDigits(totalPages)}</span>
              </>
            )}
          </p>
        </div>

        {/* ══════════ شبکه‌ی کارت‌ها ══════════ */}
        {items.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((c, i) => (
              <CriminalCard key={c.id} c={c} eager={currentPage === 1 && i < 4} />
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-3xl border border-dashed border-ink-200 bg-white/60">
            <EmptyState
              title={page === null ? 'فهرست پرونده‌ها در دسترس نیست' : 'پرونده‌ای یافت نشد'}
              description={
                page === null
                  ? 'اتصال به سامانه برقرار نشد؛ لطفاً چند لحظهٔ دیگر دوباره تلاش کنید.'
                  : hasFilter
                    ? 'با این فیلترها نتیجه‌ای نیست؛ فیلترها را حذف کنید یا عبارت دیگری جستجو کنید.'
                    : 'به‌زودی پرونده‌های عمومی در این راستا قرار می‌گیرد.'
              }
              iconPath="M21 21l-4.35-4.35M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z"
            />
            {hasFilter && (
              <div className="-mt-6 pb-8 text-center">
                <Link
                  href="/r4j"
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-ink-200 bg-white px-5 py-2.5 text-[12px] font-extrabold text-ink-700 transition-colors hover:border-ink-300"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  حذف فیلترها و مشاهده‌ی همه
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ══════════ صفحه‌بندی ══════════ */}
        {totalPages > 1 && (
          <nav
            aria-label="صفحه‌بندی پرونده‌ها"
            className="mt-10 flex items-center justify-center gap-1.5"
          >
            {currentPage > 1 && (
              <Link
                href={`/r4j${qsWith(f, { page: currentPage - 1 })}`}
                aria-label="صفحهٔ قبلی"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-ink-200 bg-white text-ink-600 transition-colors hover:border-ink-300 hover:text-ink-900"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            )}
            {windowPages.map((p) => (
              <Link
                key={p}
                href={`/r4j${qsWith(f, { page: p })}`}
                aria-current={p === currentPage ? 'page' : undefined}
                className={cn(
                  'flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-[13px] font-extrabold tabular-nums transition-colors',
                  p === currentPage
                    ? 'bg-ink-900 text-white shadow-md'
                    : 'border border-ink-200 bg-white text-ink-600 hover:border-ink-300 hover:text-ink-900',
                )}
              >
                {toPersianDigits(p)}
              </Link>
            ))}
            {currentPage < totalPages && (
              <Link
                href={`/r4j${qsWith(f, { page: currentPage + 1 })}`}
                aria-label="صفحهٔ بعدی"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-ink-200 bg-white text-ink-600 transition-colors hover:border-ink-300 hover:text-ink-900"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </Link>
            )}
          </nav>
        )}
      </section>
    </main>
  );
}
