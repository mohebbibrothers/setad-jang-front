/**
 * ═══════════════════════════════════════════════════════════════════
 * r4j — لایه‌ی دامنه‌ی «جایزه‌ای برای عدالت» (Reward for Justice)
 *
 * قراردادِ بک‌اند (apps/r4j — بازخوانی‌شده از serializers/views):
 *
 *   عمومی:
 *     GET /api/v1/r4j/criminals/              → R4JPublicCriminalListSerializer
 *         (paginated؛ فیلتر: search / country / province / city / gender +
 *          ordering مثل -total_bounty_toman)
 *     GET /api/v1/r4j/criminals/<lookup>/     → R4JPublicCriminalDetailSerializer
 *         (lookup = id یا slug؛ فیلدهای حساس طبق per-criminal visibility
 *          ممکن است null برگردند — schema یکپارچه می‌ماند)
 *
 *   کاربر (احراز):
 *     POST /api/v1/r4j/criminals/<id>/bounty/   {amount_toman}  → IsFullyVerifiedUser
 *         (حداقل ۵۰٬۰۰۰ تومان — R4J_BOUNTY_MIN_TOMAN؛ پیامِ خطای مرحله‌ایِ
 *          تأیید ایمیل/موبایل/پروفایل از detail پاسخ خوانده می‌شود)
 *     POST /api/v1/r4j/criminals/<id>/reports/  (JSON یا multipart) → IsAuthenticated
 *         {notes, field_changes[], alias_suggestions[], phone_suggestions[],
 *          social_suggestions[]} + files[] — حداقل یکی لازم است
 *
 * اصولِ این لایه:
 *   - هیچ متن/مقدارِ نمایشی در کامپوننت‌ها parse نمی‌شود؛ همه‌ی نگاشت‌ها
 *     (پلتفرم‌ها، نوع سند، جنسیت، پول، تاریخ جلالی) همین‌جاست.
 *   - مسیرهای نسبی /media/ فقط با absoluteMediaUrl مطلق می‌شوند.
 *   - visibility-aware: هر فیلدِ null یعنی «برای این پرونده محدود شده»
 *     و UI آن را نمایش نمی‌دهد (نه «—»، نه کلیدِ خالی).
 * ═══════════════════════════════════════════════════════════════════
 */

import { safeApiFetch, apiFetch } from '@/lib/api';
import { absoluteMediaUrl, formatToman, toPersianDigits } from '@/lib/utils';
import { isoToJalali, JALALI_MONTH_NAMES } from '@/lib/jalali';

// ============================================================
// Types — آینه‌ی دقیقِ serializerهای بک‌اند
// ============================================================

export interface CriminalListItem {
  id: number;
  slug: string;
  first_name: string;
  last_name: string;
  country: string | null;
  province: string | null;
  city: string | null;
  primary_photo: { id: number; image: string } | null;
  total_bounty_toman: number;
  bounties_count: number;
}

export interface CriminalPhoto {
  id: number;
  image: string;
  caption: string;
  is_primary: boolean;
  order: number;
}

export interface CriminalPhone {
  id: number;
  label: string;
  number: string;
}

/** پلتفرم‌های SocialPlatform بک‌اند (10 گزینه) */
export type SocialPlatformKey =
  | 'telegram'
  | 'twitter_x'
  | 'instagram'
  | 'linkedin'
  | 'facebook'
  | 'tiktok'
  | 'truth_social'
  | 'youtube'
  | 'website'
  | 'other';

export interface CriminalSocial {
  id: number;
  platform: SocialPlatformKey | string;
  handle_or_url: string;
}

/** نوع پیوست رسمی — CriminalAttachmentKind بک‌اند */
export type AttachmentKind = 'image' | 'document' | 'video' | 'audio' | 'other';

export interface CriminalAttachment {
  id: number;
  file: string;
  title: string;
  kind: AttachmentKind | string;
  description: string;
}

export interface CriminalAlias {
  id: number;
  alias: string;
}

export interface CriminalDetail {
  id: number;
  slug: string;
  first_name: string;
  last_name: string;
  national_code: string | null;
  birth_date: string | null;
  gender: 'male' | 'female' | 'unknown' | null;
  country: string | null;
  province: string | null;
  city: string | null;
  description: string | null;
  crimes_summary: string | null;
  other_info: string | null;
  photos: CriminalPhoto[];
  phones: CriminalPhone[];
  socials: CriminalSocial[];
  attachments: CriminalAttachment[];
  aliases: CriminalAlias[];
  total_bounty_toman: number;
  bounties_count: number;
  published_at: string | null;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ============================================================
// Fetchers (SSR — revalidate + tags مثل قراردادِ تبین)
// ============================================================

/** صفحه‌ای از لیست عمومی مجرمین — با فیلتر/مرتب‌سازی اختیاری */
export function fetchCriminalsPage(
  params: {
    page?: number;
    pageSize?: number;
    ordering?: string;
    search?: string;
    city?: string;
    province?: string;
    country?: string;
    gender?: string;
  } = {},
) {
  const qs = new URLSearchParams();
  if (params.page && params.page > 1) qs.set('page', String(params.page));
  qs.set('page_size', String(params.pageSize ?? 12));
  if (params.ordering) qs.set('ordering', params.ordering);
  if (params.search?.trim()) qs.set('search', params.search.trim());
  if (params.city?.trim()) qs.set('city', params.city.trim());
  if (params.province?.trim()) qs.set('province', params.province.trim());
  if (params.country?.trim()) qs.set('country', params.country.trim());
  if (params.gender?.trim()) qs.set('gender', params.gender.trim());
  return safeApiFetch<Paginated<CriminalListItem>>(`/r4j/criminals/?${qs.toString()}`, {
    revalidate: 300,
    tags: ['r4j', 'criminals'],
  });
}

/**
 * نرمال‌سازیِ lookup برای استفاده در API path — سندِ باگِ پروداکشن:
 *   paramsِ Next ممکن است (با اسلاگ‌های یونیکد/فارسی مثل «رضا-پهلوی») هنوز
 *   percent-encoded تحویل شود؛ encodeURIComponent روی یک رشته‌ای که از قبل
 *   انکد شده «double-encoding» می‌سازد و لایه‌های میانی (Nginx، ASGI،
 *   Django) فقط یک لایه decode می‌کنند → بک‌اند رشته‌ی هنوز-انکدشده را با
 *   اسلاگِ دیتابیس تطبیق نمی‌دهد و ۴۰۴ می‌گیریم.
 *   این تابع همیشه «دقیقاً یک لایه encode» تضمین می‌کند (idempotent).
 */
export function canonicalApiLookup(lookup: string): string {
  let decoded = lookup;
  if (lookup.includes('%')) {
    try {
      decoded = decodeURIComponent(lookup);
    } catch {
      decoded = lookup; // دنباله‌ی % ناقص — خام رد می‌کنیم و یک لایه encode
    }
  }
  return encodeURIComponent(decoded);
}

/** جزئیات یک مجرم — lookup می‌تواند slug یا id باشد (قراردادِ هیبریدیِ بک‌اند) */
export function fetchCriminalDetail(lookup: string) {
  return safeApiFetch<CriminalDetail>(`/r4j/criminals/${canonicalApiLookup(lookup)}/`, {
    revalidate: 180,
    tags: ['r4j'],
  });
}

/** ثبت/به‌روزرسانی جایزه — پاسخ: جزئیات bounty کاربر */
export function setCriminalBounty(criminalId: number, amountToman: number) {
  return apiFetch(`/r4j/criminals/${criminalId}/bounty/`, {
    method: 'POST',
    body: JSON.stringify({ amount_toman: amountToman }),
  });
}

/** ارسال گزارش کاربر — multipart با field_changes به‌صورت JSON string */
export function submitCriminalReport(criminalId: number, form: FormData) {
  return apiFetch(`/r4j/criminals/${criminalId}/reports/`, {
    method: 'POST',
    body: form,
  });
}

// ============================================================
// مجوزها و حداقل‌ها — هماهنگ با بک‌اند
// ============================================================

/** R4J_BOUNTY_MIN_TOMAN در apps/r4j/validators.py */
export const BOUNTY_MIN_TOMAN = 50_000;

// ============================================================
// Meta — پلتفرم‌های اجتماعی (۱۰ گزینه‌ی بک‌اند)
// ============================================================

export interface SocialPlatformMeta {
  label: string;
  /** رنگِ پس‌زمینه‌ی حباب — هم‌راستا با هویتِ بصریِ پلتفرم، تیره‌سازی‌شده برای خوانایی */
  bubble: string;
  /** ساخت نشانی عمومی از handle (اگر ورودیURL کامل نباشد) */
  buildUrl: (handle: string) => string;
  /** متنِ کوتاهِ نمایشیِ آیکن — برای monogram وقتی برندآیکن lucide نداریم */
  glyph: string;
}

const stripAt = (h: string) => h.trim().replace(/^@+/, '');
const ensureHttp = (s: string) =>
  /^[a-z][a-z0-9+.-]*:\/\//i.test(s) ? s : `https://${s.replace(/^\/+/, '')}`;
/**
 * آیا مقدارِ admin «نشانیِ کامل» است یا «هندل»؟
 * آستانه فقط scheme یا وجودِ «/» است — نه نقطه، چون هندلِ قانونیِ
 * اینستاگرام/تیک‌تاک می‌تواند نقطه داشته باشد (reza.pahlavi ≠ دامنه).
 */
const looksLikeUrl = (h: string) => /^[a-z][a-z0-9+.-]*:\/\//i.test(h) || h.includes('/');

export const SOCIAL_PLATFORM_META: Record<string, SocialPlatformMeta> = {
  telegram: {
    label: 'تلگرام',
    bubble: 'bg-sky-500/15 text-sky-700',
    glyph: 'T',
    buildUrl: (h) => (looksLikeUrl(h) ? ensureHttp(h) : `https://t.me/${stripAt(h)}`),
  },
  twitter_x: {
    label: 'توییتر / ایکس',
    bubble: 'bg-slate-500/15 text-slate-700',
    glyph: 'X',
    buildUrl: (h) => (looksLikeUrl(h) ? ensureHttp(h) : `https://x.com/${stripAt(h)}`),
  },
  instagram: {
    label: 'اینستاگرام',
    bubble: 'bg-fuchsia-500/15 text-fuchsia-700',
    glyph: 'IG',
    buildUrl: (h) => (looksLikeUrl(h) ? ensureHttp(h) : `https://instagram.com/${stripAt(h)}`),
  },
  linkedin: {
    label: 'لینکدین',
    bubble: 'bg-blue-600/15 text-blue-700',
    glyph: 'in',
    buildUrl: (h) => (looksLikeUrl(h) ? ensureHttp(h) : `https://linkedin.com/in/${stripAt(h)}`),
  },
  facebook: {
    label: 'فیسبوک',
    bubble: 'bg-indigo-500/15 text-indigo-700',
    glyph: 'f',
    buildUrl: (h) => (looksLikeUrl(h) ? ensureHttp(h) : `https://facebook.com/${stripAt(h)}`),
  },
  tiktok: {
    label: 'تیک‌تاک',
    bubble: 'bg-zinc-500/15 text-zinc-700',
    glyph: 'TT',
    buildUrl: (h) => (looksLikeUrl(h) ? ensureHttp(h) : `https://tiktok.com/@${stripAt(h)}`),
  },
  truth_social: {
    label: 'تروث سوشال',
    bubble: 'bg-red-500/15 text-red-700',
    glyph: 'TS',
    buildUrl: (h) => (looksLikeUrl(h) ? ensureHttp(h) : `https://truthsocial.com/@${stripAt(h)}`),
  },
  youtube: {
    label: 'یوتیوب',
    bubble: 'bg-rose-500/15 text-rose-700',
    glyph: 'YT',
    buildUrl: (h) => (looksLikeUrl(h) ? ensureHttp(h) : `https://youtube.com/${stripAt(h)}`),
  },
  website: {
    label: 'وب‌سایت',
    bubble: 'bg-emerald-500/15 text-emerald-700',
    glyph: '🌐',
    buildUrl: (h) => ensureHttp(h),
  },
  other: {
    label: 'سایر',
    bubble: 'bg-ink-500/10 text-ink-600',
    glyph: '🔗',
    buildUrl: (h) => ensureHttp(h),
  },
};

export function socialMeta(platform: string): SocialPlatformMeta {
  return SOCIAL_PLATFORM_META[platform] ?? SOCIAL_PLATFORM_META.other;
}

/** نشانی نهاییِ یک شبکه‌ی اجتماعی — safe و قابل کلیک (target=_blank rel=nofollow) */
export function socialUrl(platform: string, handleOrUrl: string): string {
  return socialMeta(platform).buildUrl(handleOrUrl.trim());
}

// ============================================================
// Meta — نوع سند
// ============================================================

export const ATTACHMENT_KIND_META: Record<string, { label: string; glyph: string }> = {
  image: { label: 'تصویر', glyph: '🖼' },
  document: { label: 'سند', glyph: '📄' },
  video: { label: 'ویدئو', glyph: '🎬' },
  audio: { label: 'صدا', glyph: '🎙' },
  other: { label: 'سایر', glyph: '📎' },
};

export function attachmentKindLabel(kind: string): string {
  return ATTACHMENT_KIND_META[kind]?.label ?? ATTACHMENT_KIND_META.other.label;
}

// ============================================================
// Meta — جنسیت
// ============================================================

export const GENDER_LABELS: Record<string, string> = {
  male: 'مرد',
  female: 'زن',
  unknown: 'نامشخص',
};

// ============================================================
// Helpers نمایشی
// ============================================================

/** نام کامل — پرچمِ همیشه‌موجودِ هویت */
export function criminalFullName(c: Pick<CriminalDetail, 'first_name' | 'last_name'>): string {
  return `${c.first_name} ${c.last_name}`.replace(/\s+/g, ' ').trim();
}

/** خطِ مکان: «تهران، تهران، ایران» — فقط قطعاتِ موجود، فقط یک‌بار برای تکراری‌ها */
export function locationLine(c: {
  city: string | null;
  province: string | null;
  country: string | null;
}): string | null {
  const parts = [c.city, c.province, c.country]
    .map((p) => p?.trim())
    .filter((p): p is string => Boolean(p));
  const dedup = parts.filter((p, i) => parts.indexOf(p) === i);
  return dedup.length ? dedup.join('، ') : null;
}

/** تاریخِ ISO (میلادیِ بک‌اند) → «۱۴ خرداد ۱۳۸۵» جلالی */
export function jalaliDateFa(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const j = isoToJalali(iso.slice(0, 10));
  if (!j) return null;
  return `${toPersianDigits(j.jd)} ${JALALI_MONTH_NAMES[j.jm - 1]} ${toPersianDigits(j.jy)}`;
}

/** جایزه‌ی نمایشی — «۱٬۵۰۰٬۰۰۰ تومان» */
export function bountyFa(amount: number): string {
  return formatToman(amount);
}

/** آدرسِ مطلقِ عکس — ورودی ممکن است absolute (بک‌اند با request می‌سازد) یا نسبی باشد */
export function mediaSrc(url: string | null | undefined): string | undefined {
  return absoluteMediaUrl(url);
}

/**
 * نرمال‌سازی گالری: عکس primary اول، بعد بر اساس order/ورودی —
 * بدون این نرمال‌سازی هر serializer reorder کوچکی UI را از هم می‌پاشد.
 */
export interface GalleryItem {
  id: number;
  src: string;
  caption: string;
  isPrimary: boolean;
}

export function normalizeGallery(photos: CriminalPhoto[]): GalleryItem[] {
  const items = (photos ?? [])
    .map((p) => ({
      id: p.id,
      src: mediaSrc(p.image) ?? '',
      caption: p.caption ?? '',
      isPrimary: Boolean(p.is_primary),
    }))
    .filter((p) => p.src);
  items.sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.id - b.id);
  return items;
}

/**
 * آیا همه‌ی فیلدهای حساسِ visibility محدود شده‌اند؟ (برای نشانِ «پرونده‌ی محرمانه»)
 */
export function isFullyRedacted(d: CriminalDetail): boolean {
  return (
    !d.national_code &&
    !d.birth_date &&
    !d.gender &&
    !d.country &&
    !d.province &&
    !d.city &&
    !d.description &&
    !d.crimes_summary &&
    !d.other_info
  );
}

// ============================================================
// Report payload builder — آینه‌ی قراردادِ R4JReportSubmitSerializer
// (برای تست‌پذیری و جلوگیری از خطاهای multipart در کامپوننت)
// ============================================================

export interface ReportFieldChangeInput {
  field_name: string;
  suggested_value: string;
}

export interface ReportDraftInput {
  notes: string;
  field_changes: ReportFieldChangeInput[];
  alias_suggestions: { alias: string }[];
  phone_suggestions: { label: string; number: string }[];
  social_suggestions: { platform: string; handle_or_url: string }[];
  attachments: File[];
}

/** پاک‌سازی draft: ورودی‌های خالی حذف می‌شوند تا قانونِ «حداقل یکی» دقیق اعمال شود */
export function pruneReportDraft(draft: ReportDraftInput): ReportDraftInput {
  return {
    notes: draft.notes.trim(),
    field_changes: draft.field_changes
      .map((f) => ({ field_name: f.field_name, suggested_value: f.suggested_value.trim() }))
      .filter((f) => f.suggested_value),
    alias_suggestions: draft.alias_suggestions
      .map((a) => ({ alias: a.alias.trim() }))
      .filter((a) => a.alias),
    phone_suggestions: draft.phone_suggestions
      .map((p) => ({ label: p.label.trim(), number: p.number.trim() }))
      .filter((p) => p.number),
    social_suggestions: draft.social_suggestions
      .map((s) => ({ platform: s.platform, handle_or_url: s.handle_or_url.trim() }))
      .filter((s) => s.handle_or_url),
    attachments: draft.attachments.filter(Boolean),
  };
}

/** قانونِ validate() بک‌اند: حداقل یکی از مسیرهای اطلاع‌رسانی */
export function isReportSubmittable(draft: ReportDraftInput): boolean {
  const d = pruneReportDraft(draft);
  return Boolean(
    d.notes ||
    d.field_changes.length ||
    d.alias_suggestions.length ||
    d.phone_suggestions.length ||
    d.social_suggestions.length,
  );
}

/** ساخت FormData قرارداد: لیست‌ها به‌صورت JSON string، فایل‌ها به‌صورت attachments[] */
export function buildReportFormData(draft: ReportDraftInput): FormData {
  const d = pruneReportDraft(draft);
  const form = new FormData();
  if (d.notes) form.set('notes', d.notes);
  form.set('field_changes', JSON.stringify(d.field_changes));
  form.set('alias_suggestions', JSON.stringify(d.alias_suggestions));
  form.set('phone_suggestions', JSON.stringify(d.phone_suggestions));
  form.set('social_suggestions', JSON.stringify(d.social_suggestions));
  for (const file of d.attachments) form.append('attachments', file);
  return form;
}

// ============================================================
// Bounty amount parser — ورودیِ آزادِ کاربر (هر ارقامی) → عدد صحیح
// ============================================================

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';

function normalizeDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) => String(FA_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)));
}

/**
 * «۱٬۵۰۰٬۰۰۰» یا «1500000» یا «۱۵۰۰۰۰۰ تومان» → ۱۵۰۰۰۰۰
 * خروجی null یعنی ورودی نامعتبر؛ عددِ معتبر ممکن است هنوز < BOUNTY_MIN_TOMAN باشد.
 */
export function parseTomanInput(raw: string): number | null {
  const cleaned = normalizeDigits(raw)
    .replace(/[,٬\s_]/g, '')
    .replace(/تومان|تومن/g, '');
  if (!cleaned || !/^\d+$/.test(cleaned)) return null;
  const n = Number(cleaned);
  if (!Number.isSafeInteger(n) || n <= 0) return null;
  return n;
}

// ============================================================
// User scope — «جایزه‌ها/گزارش‌های من» (قراردادِ R4JUser*Serializerها)
// ============================================================

/** وضعیت‌های BountyStatus بک‌اند */
export type BountyStatusKey = 'active' | 'cancel_requested' | 'canceled' | string;

export interface MyBounty {
  id: number;
  criminal_id: number;
  criminal_name: string;
  criminal_slug: string;
  amount_toman: number;
  status: BountyStatusKey;
  cancel_requested_at: string | null;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
}

/** وضعیت‌های ReportStatus بک‌اند */
export type ReportStatusKey =
  | 'pending'
  | 'approved'
  | 'partially_approved'
  | 'rejected'
  | 'cancel_requested'
  | 'canceled'
  | string;

export interface MyReportSummary {
  id: number;
  criminal_id: number;
  criminal_name: string;
  status: ReportStatusKey;
  notes: string;
  created_at: string;
  updated_at: string;
}

/** تعهدِ جایزه‌ی کاربر برای یک پرونده (اگر داشته باشد) — R4JBountyUserFilter پشتیبانی از criminal_id دارد */
export function fetchMyBountyFor(criminalId: number) {
  return apiFetch<Paginated<MyBounty>>(`/r4j/me/bounties/?criminal_id=${criminalId}&page_size=10`);
}

/** درخواست لغوی تعهد — POST بدون بدنه؛ پاسخ: همان bounty با status=cancel_requested */
export function cancelMyBounty(bountyId: number) {
  return apiFetch<MyBounty>(`/r4j/me/bounties/${bountyId}/cancel/`, { method: 'POST' });
}

/** گزارش‌های کاربر — فیلترِ سرور فقط status دارد؛ تطبیقِ پرونده سمتِ کلاینت انجام می‌شود */
export function fetchMyReports() {
  return apiFetch<Paginated<MyReportSummary>>('/r4j/me/reports/?page_size=50');
}

/** درخواست لغوی گزارش (فقط pending) */
export function cancelMyReport(reportId: number) {
  return apiFetch<MyReportSummary>(`/r4j/me/reports/${reportId}/cancel/`, { method: 'POST' });
}

/** جزئیاتِ عمومیِ تازه‌ی پرونده — برای بازخوانیِ شمارنده‌ها پس از ثبت جایزه (بدون کشِ ISR) */
export function fetchCriminalDetailLive(id: number) {
  return apiFetch<CriminalDetail>(`/r4j/criminals/${id}/`, { skipAuth: true });
}

export const BOUNTY_STATUS_META: Record<string, { label: string; badge: string }> = {
  active: { label: 'فعال', badge: 'bg-emerald-500/15 text-emerald-700' },
  cancel_requested: {
    label: 'درخواست لغو در انتظار تأیید',
    badge: 'bg-amber-500/15 text-amber-700',
  },
  canceled: { label: 'لغو شده', badge: 'bg-slate-500/15 text-slate-600' },
};

export function bountyStatusMeta(status: string) {
  return BOUNTY_STATUS_META[status] ?? { label: status, badge: 'bg-slate-500/15 text-slate-600' };
}

export const REPORT_STATUS_META: Record<string, { label: string; badge: string }> = {
  pending: { label: 'در انتظار بررسی', badge: 'bg-amber-500/15 text-amber-700' },
  approved: { label: 'تأیید شده', badge: 'bg-emerald-500/15 text-emerald-700' },
  partially_approved: { label: 'تأیید جزئی', badge: 'bg-sky-500/15 text-sky-700' },
  rejected: { label: 'رد شده', badge: 'bg-rose-500/15 text-rose-700' },
  cancel_requested: {
    label: 'درخواست لغو در انتظار تأیید',
    badge: 'bg-amber-500/15 text-amber-700',
  },
  canceled: { label: 'لغو شده', badge: 'bg-slate-500/15 text-slate-600' },
};

export function reportStatusMeta(status: string) {
  return REPORT_STATUS_META[status] ?? { label: status, badge: 'bg-slate-500/15 text-slate-600' };
}

// ============================================================
// REPORTABLE_CRIMINAL_FIELDS بک‌اند (services.py) — ۱۱ فیلد مجاز
// ============================================================

export interface ReportableFieldOption {
  value: string;
  label: string;
  placeholder: string;
  /** جهتِ پیشنهادیِ مقدار (کد ملی/تاریخ ← چپ‌چین) */
  dir?: 'ltr';
}

export const REPORTABLE_FIELD_OPTIONS: ReportableFieldOption[] = [
  { value: 'first_name', label: 'نام', placeholder: 'نام صحیح یا تکمیلی…' },
  { value: 'last_name', label: 'نام خانوادگی', placeholder: 'نام خانوادگی صحیح یا تکمیلی…' },
  { value: 'national_code', label: 'کد ملی', placeholder: '۱۰ رقم', dir: 'ltr' },
  {
    value: 'birth_date',
    label: 'تاریخ تولد',
    placeholder: 'مثلاً 1985-06-14 (میلادی)',
    dir: 'ltr',
  },
  { value: 'gender', label: 'جنسیت', placeholder: 'مرد / زن / نامشخص' },
  { value: 'country', label: 'کشور', placeholder: 'نام کشور…' },
  { value: 'province', label: 'استان', placeholder: 'نام استان…' },
  { value: 'city', label: 'شهر', placeholder: 'نام شهر…' },
  { value: 'description', label: 'توضیحات', placeholder: 'متن پیشنهادی برای توضیحات…' },
  {
    value: 'crimes_summary',
    label: 'خلاصهٔ جرائم',
    placeholder: 'متن پیشنهادی برای خلاصهٔ جرائم…',
  },
  { value: 'other_info', label: 'سایر اطلاعات', placeholder: 'متن پیشنهادی برای سایر اطلاعات…' },
];

// ============================================================
// قواعدِ ضمیمه‌ی گزارش — apps/r4j/validators.py
// ============================================================

export const REPORT_ATTACHMENT_ACCEPT = '.jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.mp4,.mp3';
export const REPORT_ATTACHMENT_MAX_BYTES = 20 * 1024 * 1024;
export const REPORT_ATTACHMENT_MAX_COUNT = 5;

/** برچسبهای خوانا برای فرمت‌های مجاز (نمایش به کاربر) */
export const REPORT_ATTACHMENT_ACCEPT_FA =
  'تصویر (JPG/PNG/WebP)، PDF، سند Word، ویدئو MP4 و صدای MP3';
