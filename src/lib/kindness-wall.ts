/**
 * ═══════════════════════════════════════════════════════════════════
 * kindness-wall.ts — لایهٔ دادهٔ هابِ «دیوار مهربانی» (/kindness-wall)
 *
 * قرارداد بک‌اند (apps/kindness_wall v2 — تختهٔ نیاز ادمین‌محور):
 *
 *   GET /api/v1/kindness-wall/listings/
 *     پارامترها (هم‌نامِ URL صفحه — بدون نگاشت):
 *       page, page_size (پیش‌فرض ۲۰، سقف ۱۰۰)
 *       category  → slug دسته (exact)
 *       province  → استان (iexact — رشتهٔ آزاد در ادمین)
 *       city      → شهر (iexact)
 *       urgent    → 'true' فقط فوری‌ها
 *       ordering  → fresh | popular | urgent | expiring
 *                   (بدون پارامتر = ترتیب مرجع تخته: ویژه‌ها اول)
 *                   (مقدار نامعتبر = بی‌اثر، بدون خطای ۴۰۰)
 *       search    → FTS/trgm روی عنوان+شرح+سند ارجعی (fallback icontains)
 *     پاسخ: envelope.data = { count, next, previous, results[] }
 *     ⚠️ لیست هیچ فیلد تماسی ندارد (ضد اسکرپینگ) — تماس فقط در DETAIL.
 *
 *   GET /categories/  → آرایهٔ سادهٔ دسته‌ها (icon=ایموجی + شمارندهٔ زنده)
 *   GET /stats/       → ۶ شمارندهٔ تأثیر tخته
 *   GET /stories/     → paginated؛ بایگانیِ «داستان‌های مهربانی» (۹۰ روز اخیر)
 *
 * این فایل دو منطقه دارد: (۱) توابع خالصِ فیلتر/URL — هم سرور هم کلاینت؛
 * (۲) fetcherهای سروری با ISR-tag «kindness» (مشترک با صفحهٔ اصلی تا یک
 * invalidation هر دو را تازه کند). نگاشت‌های v2 از home-data بازاستفاده
 * می‌شوند (منبع یکتا برای guardهای گذار).
 * ═══════════════════════════════════════════════════════════════════
 */

import { apiFetch, isApiError, safeApiFetch, type Paginated } from '@/lib/api';
import { mapKindnessListings, mapKindnessCategories, mapKindnessStats } from '@/lib/home-data';
import type { KindListing, KindCategory, KindStats } from '@/components/home/KindnessSection';
import { absoluteMediaUrl } from '@/lib/utils';

/* ── ثابت‌های صفحه ────────────────────────────────────────────────── */

export const KINDNESS_BOARD_PATH = '/kindness-wall';

/** ۱۲ = گرید ۳×۴ تمیز؛ با سقف ۱۰۰ بک‌اند سازگار است. */
export const KINDNESS_PAGE_SIZE = 12;

/**
 * گزینه‌های مرتب‌سازی — آینهٔ _ORDERING_CHOICES بک‌اند.
 * مقدار '' = بدون پارامتر ordering → ترتیبِ مرجعِ تخته (-is_featured,…)
 * که ثبیتِ «ویژه‌ها اول» را حفظ می‌کند؛ به همین دلیل گزینهٔ پیش‌فرض است.
 */
export const KINDNESS_SORT_OPTIONS = [
  { value: '', label: 'ویژه‌ها اول' },
  { value: 'fresh', label: 'تازه‌ترین‌ها' },
  { value: 'popular', label: 'پربازدیدترین‌ها' },
  { value: 'urgent', label: 'فوری‌ها اول' },
  { value: 'expiring', label: 'نزدیک به انقضا' },
] as const;

export type KindnessOrdering = (typeof KINDNESS_SORT_OPTIONS)[number]['value'];

/* ۳۱ استان کشور — فقط برای پیشنهادِ datalist (فیلتر بک‌اند iexact روی
   رشتهٔ آزادِ ادمین است؛ ورودی محدود به این لیست نمی‌شود). */
export const IRAN_PROVINCES = [
  'تهران',
  'اصفهان',
  'خراسان رضوی',
  'فارس',
  'خوزستان',
  'مازندران',
  'آذربایجان شرقی',
  'آذربایجان غربی',
  'کرمان',
  'گیلان',
  'سیستان و بلوچستان',
  'البرز',
  'قم',
  'یزد',
  'هرمزگان',
  'اردبیل',
  'کردستان',
  'مرکزی',
  'زنجان',
  'گلستان',
  'قزوین',
  'همدان',
  'بوشهر',
  'چهارمحال و بختیاری',
  'لرستان',
  'خراسان جنوبی',
  'خراسان شمالی',
  'کهگیلویه و بویراحمد',
  'سمنان',
  'ایلام',
  'کرمانشاه',
] as const;

/* ── مدل فیلتر + خواندن/ساختن URL (خالص — قابل تست) ───────────────── */

export type KindnessFilters = {
  /** عبارت جست‌وجوی هوشمند (پارامتر search بک‌اند). */
  search: string;
  /** slug دسته — '' یعنی همهٔ دسته‌ها. */
  category: string;
  province: string;
  city: string;
  /** فقط فوری‌ها. */
  urgent: boolean;
  /** '' = ترتیب مرجع تخته (ویژه‌ها اول). */
  ordering: KindnessOrdering;
  /** شمارهٔ صفحهٔ ۱-مبنا. */
  page: number;
};

export const DEFAULT_KINDNESS_FILTERS: KindnessFilters = {
  search: '',
  category: '',
  province: '',
  city: '',
  urgent: false,
  ordering: '',
  page: 1,
};

function oneOf(sp: Record<string, string | string[] | undefined>, key: string): string {
  const v = sp[key];
  return typeof v === 'string' ? v.trim() : '';
}

/** خواندن امنِ searchParams → فیلترهای نرمال‌شده (ورودی نامعتبر به پیش‌فرض می‌نشیند). */
export function readKindnessFilters(
  sp: Record<string, string | string[] | undefined>,
): KindnessFilters {
  const orderingRaw = oneOf(sp, 'ordering');
  const ordering = (KINDNESS_SORT_OPTIONS as readonly { value: string }[]).some(
    (o) => o.value === orderingRaw,
  )
    ? (orderingRaw as KindnessOrdering)
    : '';
  const pageRaw = Number(oneOf(sp, 'page'));
  return {
    search: oneOf(sp, 'search'),
    category: oneOf(sp, 'category'),
    province: oneOf(sp, 'province'),
    city: oneOf(sp, 'city'),
    urgent: oneOf(sp, 'urgent') === 'true',
    ordering,
    page: Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1,
  };
}

/** آیا کاربر فیلتری فراتر از حالت پیش‌فرض تخته فعال کرده؟ */
export function hasActiveKindnessFilters(f: KindnessFilters): boolean {
  return Boolean(f.search || f.category || f.province || f.city || f.urgent || f.ordering);
}

/**
 * ساخت query string با حفظِ فیلترهای فعال (الگوی qsWith در /r4j):
 * نام‌ها دقیقاً همان نام‌های API‌اند تا لینک‌ها shareable و مستند بمانند؛
 * مقادیر پیش‌فرض و page=1 نوشته نمی‌شوند تا URL تمیز بماند.
 */
export function kindnessHubHref(f: KindnessFilters, override: Partial<KindnessFilters>): string {
  const merged = { ...f, ...override };
  const q = new URLSearchParams();
  if (merged.search) q.set('search', merged.search);
  if (merged.category) q.set('category', merged.category);
  if (merged.province) q.set('province', merged.province);
  if (merged.city) q.set('city', merged.city);
  if (merged.urgent) q.set('urgent', 'true');
  if (merged.ordering) q.set('ordering', merged.ordering);
  if (merged.page > 1) q.set('page', String(merged.page));
  const s = q.toString();
  return s ? `${KINDNESS_BOARD_PATH}?${s}` : KINDNESS_BOARD_PATH;
}

/* ── داستان‌های مهربانی (بایگانی برطرف‌شده‌ها) ─────────────────────── */

/** شمایل KindnessStorySerializer بک‌اند. */
type ApiKindnessStory = {
  slug?: string;
  title?: string;
  category?: { title?: string; icon?: string } | null;
  quantity?: number;
  unit?: string;
  city?: string;
  fulfilled_at?: string | null;
  fulfillment_note?: string;
  cover_url?: string | null;
};

export type KindStory = {
  slug: string;
  title: string;
  categoryTitle?: string;
  categoryIcon?: string;
  quantity: number;
  unit: string;
  city?: string;
  fulfilledAt?: string;
  note?: string;
  coverImage?: string;
};

/** نگاشت خالصِ استوری‌ها؛ سطرهای بی‌عنوان/بی‌اسلاگ بی‌صدا حذف می‌شوند. */
export function mapKindnessStories(items: ApiKindnessStory[]): KindStory[] {
  return items
    .filter(
      (s): s is ApiKindnessStory & { slug: string; title: string } =>
        typeof s.slug === 'string' &&
        s.slug.trim() !== '' &&
        typeof s.title === 'string' &&
        s.title.trim() !== '',
    )
    .map((s) => ({
      slug: s.slug,
      title: s.title.trim(),
      categoryTitle: s.category?.title?.trim() || undefined,
      categoryIcon: s.category?.icon?.trim() || undefined,
      quantity: typeof s.quantity === 'number' && s.quantity > 0 ? s.quantity : 1,
      unit: s.unit?.trim() || 'عدد',
      city: s.city?.trim() || undefined,
      fulfilledAt: s.fulfilled_at ?? undefined,
      note: s.fulfillment_note?.trim() || undefined,
      coverImage: absoluteMediaUrl(s.cover_url),
    }));
}

/* ── fetcherهای سروری (ISR — tag مشترک «kindness») ─────────────────── */

export type KindnessListingPage = {
  items: KindListing[];
  /** تعداد کل نتایجِ فیلترشده (count بک‌اند). */
  count: number;
  page: number;
  pageCount: number;
  /**
   * صفحهٔ درخواستی فراتر از انتهای تخته است (DRF برای page خارج از
   * محدوده ۴۰۴ می‌دهد — با «خاموشیِ API» اشتباه نشود). count/pageCount با
   * یک کوئریِ سبکِ page_size=1 بازخوانی شده‌اند تا صفحه پیامِ دقیقِ
   * «این صفحه در تخته نیست» بدهد نه خطای اتصال.
   */
  outOfRange?: boolean;
};

type ApiListingRow = Parameters<typeof mapKindnessListings>[0][number];

/**
 * یک صفحه از تخته با فیلترهای نرمال‌شده. null = اتصال/پاسخ ناموفق
 * (صفحه با EmptyStateِ «در دسترس نیست» زنده می‌ماند، نه ۵۰۰).
 */
export async function fetchKindnessListingsPage(
  f: KindnessFilters,
): Promise<KindnessListingPage | null> {
  const q = new URLSearchParams();
  q.set('page_size', String(KINDNESS_PAGE_SIZE));
  q.set('page', String(f.page));
  if (f.search) q.set('search', f.search);
  if (f.category) q.set('category', f.category);
  if (f.province) q.set('province', f.province);
  if (f.city) q.set('city', f.city);
  if (f.urgent) q.set('urgent', 'true');
  if (f.ordering) q.set('ordering', f.ordering);

  try {
    const data = await apiFetch<Paginated<ApiListingRow>>(
      `/kindness-wall/listings/?${q.toString()}`,
      {
        revalidate: 240,
        tags: ['kindness', `kindness-page:${f.page}`],
      },
    );
    const pageCount = Math.max(1, Math.ceil(data.count / KINDNESS_PAGE_SIZE));
    return {
      items: mapKindnessListings(data.results ?? []),
      count: data.count ?? 0,
      page: f.page,
      pageCount,
    };
  } catch (err) {
    /* DRF برای page > آخرین صفحه ۴۰۴ می‌دهد — معناش «خارج از محدوده» است نه
       «قطعی». ولی ۴۰۴ روی page=1 یا هر خطای غیر-۴۰۴ یعنی قطعیِ واقعی. */
    if (!(isApiError(err) && err.status === 404 && f.page > 1)) return null;
    const probe = await safeApiFetch<Paginated<ApiListingRow>>(
      '/kindness-wall/listings/?page_size=1',
      { revalidate: 240, tags: ['kindness'] },
    );
    /* نکته: probe عمداً بدون فیلترهاست — دقیق‌ترین countِ فیلترشده در ۴۰۴ در
       دسترس نیست و CTA هم «بازگشت به صفحهٔ اولِ همین نمایِ فیلتردار» است. */
    if (!probe) return null;
    return {
      items: [],
      count: probe.count ?? 0,
      page: f.page,
      pageCount: Math.max(1, Math.ceil((probe.count ?? 0) / KINDNESS_PAGE_SIZE)),
      outOfRange: true,
    };
  }
}

/** دسته‌های فعال با شمارندهٔ زنده (برای ریل و چیپ‌ها). */
export async function fetchKindnessCategories(): Promise<KindCategory[]> {
  const data = await safeApiFetch<unknown>('/kindness-wall/categories/', {
    revalidate: 240,
    tags: ['kindness'],
  });
  return mapKindnessCategories(Array.isArray(data) ? data : []);
}

/** شمارنده‌های تأثیر تخته (هیرو). null = endpoint در دسترس نیست. */
export async function fetchKindnessStats(): Promise<KindStats | null> {
  const data = await safeApiFetch<Parameters<typeof mapKindnessStats>[0]>('/kindness-wall/stats/', {
    revalidate: 240,
    tags: ['kindness'],
  });
  return mapKindnessStats(data);
}

/** صف اولِ «داستان‌های مهربانی» (پنجرهٔ ۹۰ روزِ بک‌اند). */
export async function fetchKindnessStories(limit = 8): Promise<KindStory[]> {
  const data = await safeApiFetch<Paginated<ApiKindnessStory>>(
    `/kindness-wall/stories/?page_size=${limit}`,
    { revalidate: 240, tags: ['kindness', 'kindness-stories'] },
  );
  return mapKindnessStories(data?.results ?? []);
}
