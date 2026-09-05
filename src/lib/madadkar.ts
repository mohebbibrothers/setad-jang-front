/**
 * ═══════════════════════════════════════════════════════════════════════════
 * madadkar — لایهٔ دامنهٔ «مدد به حرکت» (فرانت)
 *
 * قرارداد بک‌اند (apps/madadkar — آیین‌نامهٔ تأییدشده در کدباس):
 *
 *   GET  /api/v1/madadkar/campaigns/                      → لیست عمومی حرکت‌ها
 *   GET  /api/v1/madadkar/campaigns/{slug}/               → جزئیات + گالری
 *   GET  /api/v1/madadkar/campaigns/{slug}/transparency/  → دفتر شفافیت مالی
 *   GET  /api/v1/madadkar/sponsors/                       → مددکاران
 *   POST /api/v1/madadkar/campaigns/{slug}/participate/   → {participation, gateway_url, authority}
 *   POST /api/v1/madadkar/payment/verify/                 → تأیید idempotent پرداخت
 *       (GET همان endpoint = callback مرورگر از درگاه زرین‌پال است که بک‌اند
 *        بعد از verify، با 302 روی /madadkar/paydone/?authority&result
 *        می‌فرستد — این صفحه با همین POST نتیجهٔ قطعی را بازیابی می‌کند.)
 *
 * قواعد دامنه (models/services بک‌اند):
 *   - مبالغ پولی تومان‌اند؛ UI معمولاً تومان نشان می‌دهد و ریال را کمکی (×۱۰).
 *   - share_count ≥ 1 و ≤ remaining_shares؛ قیمت snapshot در لحظهٔ initiate.
 *   - رزرو ۱۵ دقیقه‌ای: سهم‌ها هنگام initiate رزرو و در صورت عدم پرداخت آزاد.
 *   - verify idempotent است؛ تکرار POST بی‌خطر است (مرورگر/کش/تلاش مجدد کاربر).
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { apiFetch, safeApiFetch, ApiError } from './api';
import { absoluteMediaUrl, formatPersianNumber, toPersianDigits } from './utils';
import { isoToJalali, JALALI_MONTH_NAMES } from './jalali';

/* ───────────────────────────────────────────────────────────────────────── */
/*  Types — آینهٔ دقیق serializers بک‌اند                                    */
/* ───────────────────────────────────────────────────────────────────────── */

export type MadadkarSponsor = {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
};

/** آینهٔ CampaignPublicListSerializer */
export type MadadkarCampaignListItem = {
  id: number;
  sponsor: MadadkarSponsor | null;
  title: string;
  slug: string;
  cover_image: string | null;
  /** تومان */
  total_amount: number;
  total_shares: number;
  /** تومان */
  share_price: number;
  purchased_shares: number;
  /** تومان */
  purchased_amount: number;
  participant_count: number;
  remaining_shares: number;
  progress_percent: number;
  is_fully_funded: boolean;
  status: string;
  status_display: string;
  has_deadline: boolean;
  deadline: string | null;
  published_at: string | null;
  completed_at: string | null;
  closed_at: string | null;
};

export type MadadkarCampaignImage = {
  id: number;
  image: string;
  alt_text?: string;
  is_cover?: boolean;
  display_order?: number;
  caption?: string;
};

/** آینهٔ CampaignPublicDetailSerializer = list + description + gallery */
export type MadadkarCampaignDetail = MadadkarCampaignListItem & {
  description: string;
  gallery_images: MadadkarCampaignImage[];
};

/** آینهٔ CampaignTransparencySerializer — همهٔ مبالغ تومان */
export type MadadkarTransparency = {
  campaign_id: number;
  campaign_title: string;
  campaign_slug: string;
  sponsor_name: string;
  generated_at: string;
  target_amount: number;
  gross_raised_amount: number;
  completed_refund_amount: number;
  applied_adjustment_delta: number;
  net_raised_amount: number;
  paid_disbursement_amount: number;
  committed_disbursement_amount: number;
  remaining_disbursable_amount: number;
  receipt_count: number;
  successful_payment_count: number;
  completed_refund_count: number;
  paid_disbursement_count: number;
  net_progress_percent: number;
  public_note: string;
};

/** participation داخل پاسخ initiate/verify — آینهٔ ParticipationUserDetailSerializer */
export type MadadkarParticipation = {
  id: number;
  campaign: {
    id: number;
    title: string;
    slug: string;
    cover_image: string | null;
    sponsor: MadadkarSponsor | null;
    status: string;
    status_display: string;
  };
  share_count: number;
  share_price_snapshot: number;
  total_amount: number;
  status: string;
  status_display: string;
  created_at: string;
  paid_at: string | null;
  payment: {
    id: number;
    gateway_name: string;
    authority: string;
    ref_id: string | null;
    amount: number;
    status: string;
    status_display: string;
    paid_at: string | null;
    verified_at: string | null;
  } | null;
};

export type MadadkarInitiated = {
  participation: MadadkarParticipation;
  gateway_url: string;
  authority: string;
};

/** آینهٔ PaymentVerifyResultSerializer */
export type MadadkarVerifyResult = {
  payment_status: string;
  payment_status_display: string;
  participation: MadadkarParticipation;
  is_verified: boolean;
  message: string;
};

/* ───────────────────────────────────────────────────────────────────────── */
/*  ثابت‌های دامنه                                                           */
/* ───────────────────────────────────────────────────────────────────────── */

/** مدت اعتبار رزرو سهم — باید با MADADKAR_PAYMENT_TIMEOUT_MINUTES بک‌اند=۱۵ هم‌دوش باشد. */
export const RESERVE_MINUTES = 15;

/** مسیر صفحهٔ نتیجهٔ پرداخت — مقصدی که بک‌اند پس از verify به آن 302 می‌کند. */
export const PAYDONE_PATH = '/madadkar/paydone/';

/* ───────────────────────────────────────────────────────────────────────── */
/*  Fetchers — server-safe (تگ‌های کشِ liked) + client                       */
/* ───────────────────────────────────────────────────────────────────────── */

type Paginated<T> = { results?: T[]; count?: number; next?: string | null };

function unwrapList<T>(data: Paginated<T> | T[] | null | undefined): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}

/** لیست عمومی حرکت‌ها (ISR). تگ `madadkar` برای revalidate هدفمند. */
export async function fetchCampaignsList(opts?: {
  pageSize?: number;
}): Promise<MadadkarCampaignListItem[]> {
  const size = opts?.pageSize ?? 24;
  const data = await safeApiFetch<Paginated<MadadkarCampaignListItem>>(
    `/madadkar/campaigns/?page_size=${size}&ordering=-published_at`,
    { revalidate: 300, tags: ['campaigns', 'madadkar'] },
  );
  return unwrapList(data);
}

/** جزئیات حرکت از روی slug (ISR). null = یافت نشد. */
export async function fetchCampaignDetail(slug: string): Promise<MadadkarCampaignDetail | null> {
  return safeApiFetch<MadadkarCampaignDetail>(`/madadkar/campaigns/${encodeURIComponent(slug)}/`, {
    revalidate: 300,
    tags: [`campaign:${slug}`, 'madadkar'],
  });
}

/** دفتر شفافیت مالی عمومی (ISR). null = ناموفق (پنل به‌حالت خاموش می‌ماند). */
export async function fetchTransparency(slug: string): Promise<MadadkarTransparency | null> {
  return safeApiFetch<MadadkarTransparency>(
    `/madadkar/campaigns/${encodeURIComponent(slug)}/transparency/`,
    { revalidate: 120, tags: [`campaign:${slug}`, 'madadkar'] },
  );
}

/** مددکاران برای strip عمومی (ISR). */
export async function fetchSponsors(): Promise<MadadkarSponsor[]> {
  const data = await safeApiFetch<Paginated<MadadkarSponsor>>('/madadkar/sponsors/', {
    revalidate: 600,
    tags: ['sponsors', 'madadkar'],
  });
  return unwrapList(data);
}

/** رفرشِ کلاینتی جزئیات — برای صداقتِ «سهم باقی‌مانده» داخل PaymentSheet. */
export async function fetchCampaignDetailClient(
  slug: string,
): Promise<MadadkarCampaignDetail | null> {
  try {
    return await apiFetch<MadadkarCampaignDetail>(
      `/madadkar/campaigns/${encodeURIComponent(slug)}/`,
    );
  } catch {
    return null;
  }
}

/** شروع مشارکت → {gateway_url, authority}. خطاها برای مپِ اکوسیستم propagate می‌شوند. */
export async function initiateParticipation(
  slug: string,
  body: { share_count: number; mobile?: string; email?: string },
): Promise<MadadkarInitiated> {
  return apiFetch<MadadkarInitiated>(
    `/madadkar/campaigns/${encodeURIComponent(slug)}/participate/`,
    { method: 'POST', body: JSON.stringify(body) },
  );
}

/**
 * بازیابیِ نتیجهٔ قطعی تراکنش — idempotent، بدون نیاز به لاگین (AllowAny).
 * قرارداد: POST (نمی‌خواهیم به contractِ 302ِ GET مرورگر بخوریم).
 */
export async function verifyPaymentResult(authority: string): Promise<MadadkarVerifyResult> {
  return apiFetch<MadadkarVerifyResult>('/madadkar/payment/verify/', {
    method: 'POST',
    body: JSON.stringify({ authority }),
  });
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  Helpers نمایشی                                                           */
/* ───────────────────────────────────────────────────────────────────────── */

/** تومان → ریال (فقط نمایش؛ واحد ذخیرهٔ بک‌اند تومان است). */
export function tomanToRial(toman: number): number {
  return Math.round(toman * 10);
}

/** «۱۲٬۵۰۰٬۰۰۰ تومان» یا fallback خط — برای همهٔ ارقام از جداکنندهٔ فارسی. */
export function formatTomanFull(amount: number | null | undefined): string {
  if (amount == null || !Number.isFinite(amount)) return '—';
  return `${formatPersianNumber(amount)} تومان`;
}

export function gatewayDisplayName(name: string | null | undefined): string {
  const key = (name ?? '').toLowerCase();
  if (key === 'zarinpal') return 'زرین‌پال';
  if (key === 'sandbox') return 'درگاه آزمایشی';
  return name || 'درگاه پرداخت';
}

/** تاریخ ISO → «۱۴ تیر ۱۴۰۵» */
export function jalaliDateShort(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const j = isoToJalali(iso.slice(0, 10));
  if (!j) return null;
  return `${toPersianDigits(j.jd)} ${JALALI_MONTH_NAMES[j.jm - 1]} ${toPersianDigits(j.jy)}`;
}

/** تاریخ ISO → «۱۴ تیر ۱۴۰۵ · ۱۹:۴۲» (ساعت به وقت محلی مرورگر کاربر) */
export function jalaliDateTimeShort(iso: string | null | undefined): string | null {
  const date = jalaliDateShort(iso);
  if (!date || !iso) return date;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return date;
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${date} · ${toPersianDigits(`${hh}:${mm}`)}`;
}

/** «٪X از حرکت تکمیل شده» — ورودی progress_percent بک‌اند (float). */
export function clampPercent(p: number | null | undefined): number {
  if (p == null || !Number.isFinite(p)) return 0;
  return Math.max(0, Math.min(100, Math.round(p)));
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  چرخۀ عمر حرکت — stamp + cta                                             */
/* ───────────────────────────────────────────────────────────────────────── */

export type CampaignLifecycle = 'active' | 'completed' | 'closed';

export function campaignLifecycle(
  c: Pick<MadadkarCampaignListItem, 'status' | 'is_fully_funded' | 'remaining_shares'>,
): CampaignLifecycle {
  if (c.is_fully_funded || c.status === 'completed' || c.remaining_shares <= 0) return 'completed';
  if (c.status === 'closed') return 'closed';
  return 'active';
}

/** متن دکمهٔ اصلی — تک‌منبعی برای کارت/جزئیات/شیت. */
export function campaignCtaLabel(lifecycle: CampaignLifecycle): string {
  switch (lifecycle) {
    case 'completed':
      return 'حرکت کامل شد';
    case 'closed':
      return 'حرکت بسته شد';
    default:
      return 'مدد به حرکت';
  }
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  نتیجهٔ پرداخت — پارامتر `result` روی paydone + وضعیت نهایی از POST      */
/* ───────────────────────────────────────────────────────────────────────── */

/** resultهایی که بک‌اند روی URL می‌گذارد (views_admin_misc.MadadkarPaymentVerifyView.get). */
export type PaydoneResultParam = 'success' | 'failed' | 'canceled' | 'pending' | 'error';

const PAYDONE_PARAMS: readonly PaydoneResultParam[] = [
  'success',
  'failed',
  'canceled',
  'pending',
  'error',
];

/** نرمال‌سازی پارامتر URL — هر چیز غریبه null می‌شود تا رنگِ لودینگ خنثی بماند. */
export function parsePaydoneResultParam(raw: string | null | undefined): PaydoneResultParam | null {
  const v = (raw ?? '').trim().toLowerCase();
  return (PAYDONE_PARAMS as readonly string[]).includes(v) ? (v as PaydoneResultParam) : null;
}

/**
 * حالت نتیجهٔ نهایی که صفحهٔ paydone رندر می‌کند — ترکیبِ:
 *   وضعیت قطعی رکورد (payment_status از POST verify)
 *   + تطبیق با `cancel_pending_payment` (gateway_status=NOK).
 * ترجمهٔ کلمات رکورد (models.Payment.get_status_display): success=موفق، failed=ناموفق.
 */
export type PaydoneFinalState = 'success' | 'failed' | 'canceled' | 'pending' | 'not_found';

/**
 * از روی پاسخ POST verify حالت نهایی را نتیجه می‌گیریم.
 * «لغو» از «شکستِ فنی» با بودن/نبودن ref_id تمیز داده نمی‌شود — از پارامتر
 * اولیهٔ URL هم راهنما می‌گیریم ولی فقط برای FAILED (نباید SUCCESS را override کند):
 * اگر verify failed گفت و درگاه NOK ارسال کرده بود → canceled.
 */
export function finalStateFromVerify(
  result: MadadkarVerifyResult,
  hint: PaydoneResultParam | null,
): PaydoneFinalState {
  if (result.is_verified && result.payment_status === 'success') return 'success';
  if (result.payment_status === 'pending') return 'pending';
  if (hint === 'canceled') return 'canceled';
  return 'failed';
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  مپِ پیامِ خطای initiate — آینهٔ خانوادهٔ خطاهای services بک‌اند          */
/* ───────────────────────────────────────────────────────────────────────── */

export type ParticipateErrorKind = 'insufficient' | 'closed' | 'gateway' | 'auth' | 'generic';

export function classifyParticipateError(err: unknown): {
  kind: ParticipateErrorKind;
  message: string;
} {
  const raw = err instanceof ApiError ? err.message : '';
  const lower = raw.toLowerCase();
  const status = err instanceof ApiError ? err.status : 0;

  if (status === 401 || status === 403) {
    return {
      kind: 'auth',
      message: 'برای مشارکت ابتدا وارد حساب شوید.',
    };
  }
  const hasShareWord = raw.includes('سهم') || raw.includes('سهام');
  if (
    hasShareWord &&
    (raw.includes('کافی') ||
      raw.includes('بیشتر') ||
      raw.includes('باقی‌مانده') ||
      raw.includes('باقی'))
  ) {
    return { kind: 'insufficient', message: raw };
  }
  if (raw.includes('تکمیل') || raw.includes('بسته') || raw.includes('دریافت مشارکت')) {
    return { kind: 'closed', message: raw };
  }
  if (lower.includes('gateway') || raw.includes('درگاه')) {
    return { kind: 'gateway', message: raw };
  }
  return {
    kind: 'generic',
    message: raw || 'خطا در برقراری ارتباط با سرور. اینترنت خود را بررسی کرده و دوباره تلاش کنید.',
  };
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  مدلِ آمادهٔ UI — تبدیل detail بک‌اند به props آمادهٔ کامپوننت           */
/* ───────────────────────────────────────────────────────────────────────── */

export type MadadkarAlbumImage = { url: string; alt?: string };

/**
 * شکل‌های آمادهٔ محاورهٔ پرداخت — پل ساختاری میان detail/list بک‌اند
 * و props کامپوننت PaymentSheet (تعریف در این‌جا تا lib به component
 * وابسته نباشد؛ PaymentSheetCampaign ساختاراً هم‌شکلِ همین است).
 */
export type PaymentSheetCampaignBridge = {
  slug: string;
  title: string;
  sponsor: string;
  sponsorLogo?: string;
  totalAmount: number;
  sharePrice: number;
  sharesTotal: number;
  sharesRemaining: number;
  progressPercent: number;
  coverUrl?: string;
  gallery?: MadadkarAlbumImage[];
  statusDisplay?: string;
  isFullyFunded?: boolean;
  hasDeadline?: boolean;
  deadline?: string;
};

/** گالری: cover اول (اگر inline تکرار نشده)، به تعقیب بقیهٔ sorted by display_order. */
export function normalizeCampaignAlbum(
  c: Pick<MadadkarCampaignDetail, 'cover_image' | 'title' | 'gallery_images'>,
): MadadkarAlbumImage[] {
  const out: MadadkarAlbumImage[] = [];
  const cover = absoluteMediaUrl(c.cover_image);
  if (cover) out.push({ url: cover, alt: c.title });
  const rest = [...(c.gallery_images ?? [])]
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
    .map((g) => ({ url: absoluteMediaUrl(g.image) ?? '', alt: g.alt_text || c.title }))
    .filter((g) => Boolean(g.url));
  for (const im of rest) {
    if (!out.some((o) => o.url === im.url)) out.push(im);
  }
  return out;
}
