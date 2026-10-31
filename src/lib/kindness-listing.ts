/**
 * ═══════════════════════════════════════════════════════════════════
 * kindness-listing.ts — لایهٔ دادهٔ صفحهٔ اسلاگِ آگهی (`/kindness-wall/[slug]`)
 *
 * قراردادِ بک‌اند (apps/kindness_wall v2 — endpoint فقط-جزئیات):
 *
 *   GET /api/v1/kindness-wall/listings/{slug}/
 *     • هر فیلدِ کارت + description کامل + beneficiary_name + contact_note
 *     • images[]        → { id, image, alt_text, is_cover, order } (کاور اول)
 *     • contact_channels[] → { kind, label, value, link }  ← تنها منبعِ تماس؛
 *       هیچ‌کدام از این‌ها در فهرست نیست (سیاستِ ضد اسکرپینگِ بک‌اند).
 *     • my_offer_status / can_offer → فقط برای کاربرِ واردشده، «بیرون از کش».
 *     • هر بازدید شمارنده را بالا می‌برد (bump_listing_view_count).
 *     ۴۰۴ برای آگهیِ غیرِ‌عمومی (پیش‌نویس/منقضی/برطرف/بایگانی).
 *
 *   POST   /api/v1/kindness-wall/listings/{slug}/offer/   { message }  (auth)
 *   DELETE /api/v1/kindness-wall/offers/{offer_id}/withdraw/           (auth)
 *   GET    /api/v1/kindness-wall/my-offers/  → paginated؛ id + listing_slug
 *   GET    /api/v1/kindness-wall/listings/?category=…  → «نیازهای مشابه»
 *
 * نکتهٔ معماری (چرا دیتیلِ سروری کافی نیست): رندرِ سروری بی‌توکن است، پس
 * `my_offer_status` همیشه null و `can_offer` همیشه false برمی‌گردد. وضعیتِ
 * اعلامِ آمادگی پس از mount در جزیرهٔ کلاینتی از `my-offers` خوانده می‌شود
 * (که شناسهٔ رکورد را هم می‌دهد — لازمِ پس‌گرفتن).
 * ═══════════════════════════════════════════════════════════════════
 */

import { apiFetch, isApiError, safeApiFetch, type Paginated } from '@/lib/api';
import { canonicalApiLookup, absoluteMediaUrl } from '@/lib/utils';
import { mapKindnessListings } from '@/lib/home-data';
import type { KindListing } from '@/components/home/KindnessSection';
import type { KindContactChannel } from '@/components/home/KindnessContactSheet';
import { KINDNESS_BOARD_PATH } from '@/lib/kindness-wall';

/* ── تایپ‌ها ──────────────────────────────────────────────────────── */

export type KindnessImage = {
  id: number;
  image: string;
  alt_text?: string;
  is_cover?: boolean;
  order?: number;
};

/** شمایلِ کاملِ DETAIL (فقط همان فیلدهایی که این صفحه مصرف می‌کند). */
export type KindnessListingDetail = {
  id?: number;
  slug: string;
  title: string;
  excerpt?: string;
  description?: string;
  category?: {
    id?: number;
    title?: string;
    slug?: string;
    icon?: string;
    description?: string;
    open_listings_count?: number;
  };
  urgency?: 'normal' | 'urgent' | string;
  urgency_display?: string;
  is_featured?: boolean;
  quantity?: number;
  unit?: string;
  province?: string;
  city?: string;
  locality?: string;
  is_nationwide?: boolean;
  view_count?: number;
  open_offers_count?: number;
  cover_url?: string | null;
  days_left?: number | null;
  published_at?: string | null;
  expires_at?: string | null;
  beneficiary_name?: string;
  contact_note?: string;
  images?: KindnessImage[];
  contact_channels?: KindContactChannel[];
  /**
   * آیا راه‌های ارتباط برای این بیننده ماسک شده‌اند؟ (پاسخِ بی‌نام = true)
   * منبعِ حقیقت **بک‌اند** است؛ فرانت فقط همین پرچم را باور می‌کند و هرگز
   * به «پنهان‌سازیِ ظاهری» تکیه نمی‌کند.
   */
  contact_gated?: boolean;
  my_offer_status?: 'new' | 'contacted' | 'declined' | string | null;
  can_offer?: boolean;
};

/* ── مسیرها و متادیتا ─────────────────────────────────────────────── */

/** مسیرِ کانونیکالِ صفحه (اسلاگ فارسی → انکدِ امنِ URL). */
export function kindnessListingPath(slug: string): string {
  return `${KINDNESS_BOARD_PATH}/${encodeURIComponent(slug)}`;
}

/** لینکِ مطلق (برای اشتراک‌گذاری و JSON-LD). */
export function kindnessListingCanonical(slug: string, siteUrl: string): string {
  return `${siteUrl.replace(/\/+$/, '')}${kindnessListingPath(slug)}`;
}

/** توضیحِ متای صفحه: شرحِ واقعی، بریدهٔ تمیز با حفظِ معنا. */
export function listingMetaDescription(detail: KindnessListingDetail, limit = 160): string {
  const raw = (detail.description || detail.excerpt || '').replace(/\s+/g, ' ').trim();
  const fallback = `نیازِ «${detail.title}» روی دیوار مهربانی — بررسی‌شده و آمادهٔ ارتباطِ مستقیم با صاحبِ نیاز.`;
  if (!raw) return fallback;
  if (raw.length <= limit) return raw;
  return `${raw.slice(0, limit).replace(/[\s،.,؛:]+$/, '')}…`;
}

/** پیامِ اشتراک‌گذاری (Web Share / کلیپ‌بورد). */
export function listingSharePayload(
  detail: KindnessListingDetail,
  siteUrl: string,
): { title: string; text: string; url: string } {
  const loc = listingLocationLine(detail);
  return {
    title: `${detail.title} — دیوار مهربانی`,
    text: `این نیاز روی دیوار مهربانی منتظرِ کمک است${loc.nationwide ? '' : ` (${loc.text})`}`,
    url: kindnessListingCanonical(detail.slug, siteUrl),
  };
}

/* ── موقعیت، مقدار و زمان (توابعِ خالص) ───────────────────────────── */

/** خطِ موقعیت: «روستا، شهر، استان» یا نشانِ سراسری. */
export function listingLocationLine(detail: KindnessListingDetail): {
  text: string;
  nationwide: boolean;
} {
  const parts = [detail.locality, detail.city, detail.province]
    .map((p) => (p || '').trim())
    .filter(Boolean);
  const nationwide = detail.is_nationwide === true || parts.length === 0;
  return { text: parts.join('، '), nationwide };
}

/** «۲ دستگاه» با ارقامِ فارسی — مقدارِ نیاز در یک نگاه. */
export function listingQuantityLabel(detail: KindnessListingDetail): string {
  const qty = typeof detail.quantity === 'number' && detail.quantity > 0 ? detail.quantity : 1;
  const unit = (detail.unit || 'عدد').trim();
  return `${qty.toLocaleString('fa-IR')} ${unit}`;
}

export type DeadlineTone = 'none' | 'calm' | 'soon' | 'critical' | 'expired';

export type ListingDeadline = {
  /** روزهای باقی‌مانده (null = بدونِ انقضا). */
  daysLeft: number | null;
  /** درصدِ عمرِ سپری‌شده (۰..۱۰۰) — برای مترِ کنارِ تاریخ. */
  elapsedPct: number;
  tone: DeadlineTone;
  /** برچسبِ کوتاهِ فارسی. */
  label: string;
  /** آیا باید «در حال انقضا» را برجسته کرد؟ */
  emphasize: boolean;
};

/**
 * محاسبهٔ عمرِ آگهی برای مترِ «مهلت» و بجِ کارت.
 *
 * منبعِ حقیقت `days_left` بک‌اند است (بر پایهٔ `expires_at` سروری)؛ فقط برای
 * درصدِ گذشتِ زمان به `published_at`/`expires_at` نیاز داریم. اگر انتشار
 * ثبت نشده باشد، مبنای محاسبه را «همین حالا + روزهای باقی‌مانده» می‌گیریم تا
 * متر هرگز NaN یا منفیِ بی‌معنا نشان ندهد.
 */
export function listingDeadline(detail: KindnessListingDetail): ListingDeadline {
  const daysLeft =
    typeof detail.days_left === 'number' && Number.isFinite(detail.days_left)
      ? Math.max(0, Math.floor(detail.days_left))
      : null;

  if (!detail.expires_at && daysLeft === null) {
    return {
      daysLeft: null,
      elapsedPct: 0,
      tone: 'none',
      label: 'بدونِ تاریخِ انقضا',
      emphasize: false,
    };
  }

  const end = detail.expires_at ? new Date(detail.expires_at).getTime() : NaN;
  const start = detail.published_at ? new Date(detail.published_at).getTime() : NaN;
  let elapsedPct = 0;
  if (Number.isFinite(end) && Number.isFinite(start) && end > start) {
    elapsedPct = Math.min(100, Math.max(0, ((Date.now() - start) / (end - start)) * 100));
  } else if (daysLeft !== null) {
    /* بدونِ تاریخِ انتشار: عمرِ فرضیِ ۴۵روزه (TTL پیش‌فرض تخته) */
    elapsedPct = Math.min(100, Math.max(0, ((45 - daysLeft) / 45) * 100));
  }

  const days = daysLeft ?? 0;
  /* نکتهٔ قرارداد بک‌اند: `days_left == 0` یعنی «کمتر از ۲۴ ساعت مانده» —
     یعنی امروز آخرین روز است، نه اینکه مهلت تمام شده باشد. آگهیِ منقضی
     اصلاً روی تخته نیست (۴۰۴)، پس toneِ «expired» فقط یک تورِ ایمنی برای
     دادهٔ ناسازگار است و با `days < 0` (هرگز از سرور نمی‌آید) فعال می‌شود.
     همین تفکیک، پیامِ درست را به کاربر می‌دهد: «آخرین روز» ≠ «مهلت تمام شده». */
  const tone: DeadlineTone =
    daysLeft === null
      ? 'calm'
      : days < 0
        ? 'expired'
        : days === 0
          ? 'critical'
          : days <= 3
            ? 'critical'
            : days <= 10
              ? 'soon'
              : 'calm';

  const label =
    tone === 'expired'
      ? 'مهلت تمام شده'
      : days === 0
        ? 'آخرین روز'
        : `${days.toLocaleString('fa-IR')} روز مانده`;

  return {
    daysLeft,
    elapsedPct,
    tone,
    label,
    emphasize: tone === 'critical' || tone === 'expired',
  };
}

/* ── کانال‌های تماس (ترتیب و برچسب) ───────────────────────────────── */

/**
 * ترتیبِ نمایشِ کانال‌ها: تلفن اول (سریع‌ترین راه)، بعد پیام‌رسان‌ها.
 * ناشناخته‌ها ته صف می‌نشینند تا افزودنِ کانالِ تازه در بک‌اند صفحه را نشکند.
 */
const CHANNEL_ORDER = ['phone', 'telegram', 'eitaa', 'bale', 'rubika', 'instagram'];

export function orderChannels(channels: KindContactChannel[] | undefined): KindContactChannel[] {
  const list = Array.isArray(channels) ? [...channels] : [];
  return list.sort((a, b) => {
    const ia = CHANNEL_ORDER.indexOf(a.kind);
    const ib = CHANNEL_ORDER.indexOf(b.kind);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
}

/** آیا این کانال لینکِ قابلِ‌بازکردن دارد؟ (بله آگاهانه ندارد) */
export function channelIsLinkable(channel: KindContactChannel): boolean {
  const link = (channel.link || '').trim();
  return link.length > 0 && /^(https?:|tel:)/i.test(link);
}

/* ── وضعیتِ اعلام آمادگی ──────────────────────────────────────────── */

export type OfferStatusKey = 'new' | 'contacted' | 'declined';

export type OfferStatusMeta = {
  label: string;
  /** توضیحِ انسانی برای کارتِ وضعیت. */
  hint: string;
  /** آیا کاربر می‌تواند پیامش را ویرایش/پس بگیرد؟ (فقط تا پیش از بررسی) */
  editable: boolean;
  tone: 'mint' | 'brand' | 'amber' | 'rose';
};

export const OFFER_STATUS_META: Record<OfferStatusKey, OfferStatusMeta> = {
  new: {
    label: 'ثبت شد — در صف بررسی',
    hint: 'اعلام آمادگیِ شما ثبت شد. تیمِ بعثت آن را می‌بیند و در صورتِ نیاز هماهنگ می‌کند؛ یادت باشد خودت هم می‌توانی از راه‌های ارتباطی، مستقیم پیگیری کنی.',
    editable: true,
    tone: 'mint',
  },
  contacted: {
    label: 'تماس گرفته شد',
    hint: 'تیمِ بعثت با شما تماس گرفته است. اگر هماهنگی نیمه‌کاره ماند، از راه‌های ارتباطیِ همین آگهی مستقیم پیگیری کنید.',
    editable: false,
    tone: 'brand',
  },
  declined: {
    label: 'این اعلام بسته شد',
    hint: 'این اعلام آمادگی بسته شده است (مثلاً نیاز با کمکِ دیگری برطرف شد). می‌توانید نیازهای دیگرِ تخته را ببینید.',
    editable: false,
    tone: 'rose',
  },
};

export function offerStatusMeta(status: string | null | undefined): OfferStatusMeta | null {
  if (!status) return null;
  return OFFER_STATUS_META[status as OfferStatusKey] ?? null;
}

/* ── fetcherهای سروری ─────────────────────────────────────────────── */

/**
 * جزئیاتِ کاملِ یک آگهی. `null` = روی تخته نیست (پیش‌نویس/منقضی/برطرف/بایگانی)
 * یا خطای شبکه — صفحه با حالتِ «این نیاز روی تخته نیست» پاسخ می‌دهد، نه ۵۰۰.
 */
export async function fetchKindnessListingDetail(
  slug: string,
): Promise<KindnessListingDetail | null> {
  const key = canonicalApiLookup(slug);
  const detail = await safeApiFetch<KindnessListingDetail>(`/kindness-wall/listings/${key}/`, {
    revalidate: 180,
    tags: [`kindness:${slug}`, 'kindness'],
    skipAuth: true,
  });
  /* رندرِ سروری همیشه بی‌توکن است ⇒ هر کانالی که سرور داده، اگر دروازه باز
     است، پیش از رسیدن به props ماسک می‌شود (بدونِ نشتی در HTMLِ خام). */
  return detail ? redactGatedChannels(detail) : null;
}

/**
 * همان جزئیات، ولی **با هویتِ کاربر** — برای بازخوانی پس از ورود یا در شیتِ
 * تخته وقتی نشست وجود دارد. سرور برای کاربرِ واردشده مقدار و لینکِ کامل
 * را می‌دهد (`contact_gated=false`) و برای بی‌نام ماسک‌شده.
 */
/**
 * پاک‌سازیِ کانال‌ها **پیش از رسیدن به props کامپوننت** وقتی دروازه باز است.
 *
 * چرا لازم است؟ حتی اگر UI مقدار را رندر نکند، هر چیزی که در props/سریالایزِ
 * RSC برود در HTMLِ خام صفحه دیده می‌شود (DevTools/View Source). پس برای
 * بینندهٔ بی‌نام، خودِ داده نیز باید ماسک‌شده به کامپوننت برسد — لایهٔ دومِ
 * دفاع، مستقل از رفتارِ سرور (که در نسخهٔ جدید خودش ماسک می‌کند).
 */
export function redactGatedChannels(detail: KindnessListingDetail): KindnessListingDetail {
  if (!isContactGated(detail)) return detail;
  const mask = (value: string, kind: string): string => {
    const raw = (value || '').trim();
    if (!raw) return '';
    if (kind === 'phone') {
      const digits = raw.replace(/\D/g, '');
      return digits.length >= 7 ? `${digits.slice(0, 4)}•••••${digits.slice(-2)}` : '••••';
    }
    return raw.length <= 3 ? '•••' : `${raw.slice(0, 3)}•••`;
  };
  return {
    ...detail,
    contact_gated: true,
    contact_channels: (detail.contact_channels ?? []).map((channel) => ({
      kind: channel.kind,
      label: channel.label,
      value: mask(channel.value, channel.kind),
      link: '',
      masked: 'true',
    })) as typeof detail.contact_channels,
  };
}

export async function fetchKindnessListingDetailAuthed(
  slug: string,
): Promise<KindnessListingDetail | null> {
  const key = canonicalApiLookup(slug);
  try {
    return await apiFetch<KindnessListingDetail>(`/kindness-wall/listings/${key}/`, {
      cache: 'no-store',
    });
  } catch {
    return null;
  }
}

/**
 * آیا این پاسخ، کانال‌های پنهان‌شده دارد؟ (پرچمِ سرور، با fallbackِ امن)
 *
 * ورودیِ ساختاریِ سبک هم پذیرفته می‌شود (`{contact_gated, contact_channels}`)
 * چون شیتِ تخته فقط همین دو فیلد را از DETAIL نگه می‌دارد.
 *
 * ⚠️ پنجرهٔ گذار: تا وقتی نسخهٔ قدیمیِ بک‌اند روی پروداکشن است، پرچم اصلاً
 * نمی‌آید (`undefined`) در حالی که سرور مقدارِ کامل را به بی‌نام می‌دهد.
 * سیاستِ محصول می‌گوید بی‌نام نباید ببیند؛ پس در نبودِ پرچم، «دروازهٔ دفاعی»
 * روشن می‌شود. به‌محضِ دیپلویِ بک‌اند، پرچم می‌آید و همین تابع دقیقاً از
 * سرور تبعیت می‌کند (کاربرِ واردشده همچنان مقدارِ کامل می‌گیرد).
 */
export function isContactGated(
  detail:
    | (Partial<Pick<KindnessListingDetail, 'contact_gated' | 'contact_channels'>> & {
        contact_gated?: boolean;
        contact_channels?: KindContactChannel[];
      })
    | null
    | undefined,
): boolean {
  if (!detail) return false;
  if (detail.contact_gated === true) return true;
  /* سرورِ قدیمی پرچم را نفرستاده ⇒ دروازهٔ دفاعی روشن (با هر کانالِ موجود). */
  if (detail.contact_gated === undefined) return (detail.contact_channels ?? []).length > 0;
  /* fallbackِ دفاعی: اگر سرورِ قدیمی پرچم را نفرستد ولی همهٔ مقادیر ماسک
     باشند، باز هم درگاه را نشان می‌دهیم (هرگز برعکسش: مقدارِ کامل را با
     حدس پنهان نمی‌کنیم). */
  const channels = detail.contact_channels ?? [];
  return channels.length > 0 && channels.every((c) => c.link === '' && c.value.includes('•'));
}

/**
 * «نیازهای مشابه» — از endpoint اختصاصی `listings/{slug}/related/`.
 *
 * چرا endpoint جدا و نه فهرستِ عمومی؟
 *   • **حذفِ خودِ آگهی سمتِ سرور** است (پیش‌تر در فرانت حذف می‌شد و یک جای
 *     خالی در گرید می‌گذاشت)؛
 *   • ترتیب بر پایهٔ **ربط** است (دسته+شهر › دسته › استان › سراسری)، نه فقط
 *     تازگی — پس پیشنهادها واقعاً «شبیه» هستند؛
 *   • پاسخ سبک است و وقتی دسته کم‌جمعیت باشد، سرور با نیازهای هم‌استان و
 *     سراسری پرش می‌کند؛ بخشِ صفحه هرگز نصفه نمی‌ماند.
 *
 * خروجی هیچ فیلدِ تماسی ندارد (همان سیاستِ ضد اسکرپینگِ فهرست).
 */
export async function fetchRelatedKindnessListings(
  detail: KindnessListingDetail,
  limit = 4,
): Promise<KindListing[]> {
  const key = canonicalApiLookup(detail.slug);
  const data = await safeApiFetch<Parameters<typeof mapKindnessListings>[0]>(
    `/kindness-wall/listings/${key}/related/?limit=${limit}`,
    { revalidate: 240, tags: ['kindness', `kindness:related:${detail.slug}`] },
  );
  if (!Array.isArray(data)) return [];
  return mapKindnessListings(data).filter((item) => item.slug !== detail.slug);
}

/* ── شمارشِ بازدید (beacon کلاینتی) ─────────────────────────────────── */

export type ViewBeaconResult = { counted: boolean; viewCount: number };

/**
 * ثبتِ بازدیدِ یکتا از مرورگر.
 *
 * صفحهٔ جزئیات سروری/ISR است، پس شمارش در آن هر revalidate را «بازدید»
 * می‌کرد. این beacon از سمتِ کلاینت (یک‌بار در هر mount) صدا زده می‌شود و
 * سرور با پنجرهٔ dedupe (پیش‌فرض ۶ ساعت) و شناسهٔ کاربر یا اثرِ IP+UA
 * تصمیم می‌گیرد. پاسخ عددِ **تازه** را می‌دهد تا رابط بی‌درنگ به‌روز شود.
 *
 * هرگز throw نمی‌کند: شمارشِ آماری نباید تجربهٔ خواندن را بشکند.
 */
export async function registerListingView(slug: string): Promise<ViewBeaconResult | null> {
  const key = canonicalApiLookup(slug);
  try {
    const data = await apiFetch<{ counted?: boolean; view_count?: number }>(
      `/kindness-wall/listings/${key}/view/`,
      { method: 'POST', skipRefresh: true, cache: 'no-store' },
    );
    if (!data || typeof data.view_count !== 'number') return null;
    return { counted: data.counted === true, viewCount: data.view_count };
  } catch {
    return null;
  }
}

/* ── اعلام آمادگی (کلاینت، احراز هویت‌شده) ────────────────────────── */

export type MyOffer = {
  id: number;
  listingSlug: string;
  message: string;
  status: OfferStatusKey | string;
  statusDisplay?: string;
};

type ApiOffer = {
  id?: number;
  listing_slug?: string;
  message?: string;
  status?: string;
  status_display?: string;
};

/** اعلامِ آمادگیِ فعلیِ کاربر روی همین آگهی (upsert در بک‌اند). */
export async function fetchMyOffer(slug: string): Promise<MyOffer | null> {
  const data = await apiFetch<Paginated<ApiOffer>>('/kindness-wall/my-offers/?page_size=100');
  const rows = Array.isArray(data?.results) ? data.results : [];
  const hit = rows.find((row) => row.listing_slug === slug);
  if (!hit || typeof hit.id !== 'number') return null;
  return {
    id: hit.id,
    listingSlug: hit.listing_slug ?? slug,
    message: hit.message ?? '',
    status: hit.status ?? 'new',
    statusDisplay: hit.status_display,
  };
}

/** ثبت/به‌روزرسانیِ اعلام آمادگی (پیام اختیاری، ≤۵۰۰ نویسه). */
export async function submitKindnessOffer(slug: string, message: string): Promise<MyOffer> {
  const key = canonicalApiLookup(slug);
  const data = await apiFetch<ApiOffer>(`/kindness-wall/listings/${key}/offer/`, {
    method: 'POST',
    body: JSON.stringify({ message: message.slice(0, 500) }),
  });
  return {
    id: typeof data?.id === 'number' ? data.id : 0,
    listingSlug: data?.listing_slug ?? slug,
    message: data?.message ?? message,
    status: data?.status ?? 'new',
    statusDisplay: data?.status_display,
  };
}

/** پس‌گرفتنِ اعلام (فقط تا پیش از بررسیِ ادمین). */
export async function withdrawKindnessOffer(offerId: number): Promise<void> {
  await apiFetch(`/kindness-wall/offers/${offerId}/withdraw/`, { method: 'DELETE' });
}

/** آیا خطای درخواست از نوعِ «نیاز به ورود» است؟ (برای گیتِ ورود در UI) */
export function isAuthRequired(err: unknown): boolean {
  return isApiError(err) && (err.status === 401 || err.status === 403);
}

/** متنِ کوتاهِ خطای سرور برای نمایشِ انسانی. */
export function offerErrorMessage(err: unknown): string {
  if (isApiError(err)) {
    if (err.status === 429) return 'کمی بعد دوباره تلاش کنید (محدودیتِ تعداد درخواست).';
    const message = (err.message || '').trim();
    if (message && !/^HTTP\s*\d+$/i.test(message)) return message;
  }
  return 'ثبت نشد؛ اتصال را بررسی و دوباره تلاش کنید.';
}

/** تصاویرِ مرتب‌شده: کاور اول، بعد ترتیبِ ادمین (بدونِ تکرارِ آدرس). */
export function orderedListingImages(detail: KindnessListingDetail): KindnessImage[] {
  const rows = Array.isArray(detail.images) ? [...detail.images] : [];
  const sorted = rows.sort((a, b) => {
    if (Boolean(b.is_cover) !== Boolean(a.is_cover)) return b.is_cover ? 1 : -1;
    return (a.order ?? 0) - (b.order ?? 0);
  });
  const seen = new Set<string>();
  return sorted.filter((img) => {
    const url = (img.image || '').trim();
    if (!url || seen.has(url)) return false;
    seen.add(url);
    return true;
  });
}

/** آلبومِ آماده برای CampaignAlbum: کاورِ کارت + تصاویرِ جزئیات. */
export function listingAlbumImages(
  detail: KindnessListingDetail,
): Array<{ url: string; alt?: string }> {
  const out: Array<{ url: string; alt?: string }> = [];
  const cover = absoluteMediaUrl(detail.cover_url ?? undefined);
  const images = orderedListingImages(detail);
  const coverFromList = images.find((img) => img.is_cover) ?? images[0];
  const first = cover || absoluteMediaUrl(coverFromList?.image);
  if (first) out.push({ url: first, alt: detail.title });
  for (const img of images) {
    const url = absoluteMediaUrl(img.image) ?? img.image;
    if (!url || out.some((item) => item.url === url)) continue;
    out.push({ url, alt: img.alt_text || detail.title });
  }
  return out;
}
