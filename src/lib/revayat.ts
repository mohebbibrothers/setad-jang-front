import { toPersianDigits } from './utils';
import { resolveContentKind, type ContentKind } from './media-meta';
import { asText, normalizeTabyinAttachments } from './tabyin-attachments';
import type { TabyinStageAttachment } from '@/components/tabyin/TabyinStage';

/**
 * ═══════════════════════════════════════════════════════════════════
 * revayat — لایه‌ی منطقِ خالصِ صفحه‌ی «روایت‌ها» (فیدِ اینستاگرام‌وار)
 *
 * این صفحه تجربه‌ی اجتماعیِ محتوای جهاد تبیین است (نه آرشیو): ستونِ
 * تک‌خطیِ پست‌ها + اسکرولِ بی‌پایان + جست‌وجوی زنده. هر منطقی که
 * قابلِ جدا شدن از React بود اینجاست تا واحدتست شود:
 *
 *   • parseAuthor: حساب‌های بالادست الگوی «شهر/کد (نام مستعار)» دارند
 *     (مثل «هرمزگان/ع۱ (بوستان پیرا)») — این را به «نامِ نمایشی» و
 *     «مکان» تفکیک می‌کنیم؛ مکان، چیپِ قابل‌کلیکِ فیلتر می‌شود.
 *   • readTimeFa: نوشته‌ها برچسب «x دقیقه مطالعه» می‌گیرند.
 *   • buildFeedQuery / buildFeedPath: کوئریِ API و آدرسِ صفحه از یک
 *     منبعِ واحد ساخته می‌شوند تا SSR و کلاینت هرگز ناسازگار نشوند.
 *   • feedItemKind / heroOfFeedItem: نوعِ مؤثر و قهرمان با همان
 *     قراردادِ صفحه‌ی جزئیات («صوت همیشه می‌برد»).
 * ═══════════════════════════════════════════════════════════════════
 */

/* ── مدلِ آیتمِ فید (سریالایزرِ عمومیِ لیست تبیین) ── */
export interface RevayatItem {
  external_id: string;
  title?: string;
  description?: string;
  author_username?: string;
  origin?: 'external' | 'user_submitted';
  source_created_at?: string;
  primary_media_type?: 'image' | 'video' | 'audio' | 'other';
  attachments?: unknown;
}

/* ── فیلترهای فید ── */
export type FeedTypeFilter = '' | 'video' | 'image' | 'audio' | 'other';

export interface FeedFilters {
  q: string;
  type: FeedTypeFilter;
  author: string;
}

export const FEED_PAGE_SIZE = 12;

/* ───────────────────────────────────────────────────────────────── */
/*  نویسنده: نامِ نمایشی + مکان                                        */
/* ───────────────────────────────────────────────────────────────── */

export interface AuthorParts {
  /** نامِ نمایشی: متنِ داخلِ پرانتز اگر هست، وگرنه بخشِ بعد از «/»، وگرنه کل رشته */
  name: string;
  /** مکان: بخشِ قبل از «/» (مثل «هرمزگان») — فقط وقتی الگو «/» دارد */
  location?: string;
}

/**
 * الگوی حساب‌های بالادست: «شهر/کد (نام مستعار)».
 * هر قالبی که نتواند تجزیه شود، امانت‌دارانه به خودِ نامِ کاربری
 * فرو می‌افتد — بدون گمانه‌زنی، بدون متنِ خالی.
 */
export function parseAuthor(username: string | null | undefined): AuthorParts {
  const u = (username ?? '').trim();
  if (!u) return { name: '', location: undefined };
  const segments = u.split('/').map((s) => s.trim());
  const location = segments.length > 1 ? segments[0] || undefined : undefined;
  const rest = segments.length > 1 ? segments.slice(1).join('/').trim() : u;
  const paren = rest.match(/\(([^)]+)\)/);
  const name = (paren?.[1] ?? rest).trim() || u;
  return { name, location };
}

/** نخستین نویسه‌ی معنادارِ نام — برای آواتارِ گرادیانی. */
export function initialOf(name: string | null | undefined): string {
  const n = (name ?? '').trim();
  return n ? n[0]! : 'ر';
}

/* ───────────────────────────────────────────────────────────────── */
/*  نوشته: زمانِ مطالعه                                               */
/* ───────────────────────────────────────────────────────────────── */

/** «x دقیقه مطالعه» — با نرخِ متعارفِ ۲۰۰ کلمه در دقیقه، حداقل ۱. */
export function readTimeFa(text: string | null | undefined): string | null {
  const t = (text ?? '').trim();
  if (!t) return null;
  const words = t.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${toPersianDigits(minutes)} دقیقه مطالعه`;
}

/* ───────────────────────────────────────────────────────────────── */
/*  نوعِ مؤثر و قهرمان — قراردادِ مشترک با صفحه‌ی جزئیات               */
/* ───────────────────────────────────────────────────────────────── */

/** پیوست‌های نرمال‌شده‌ی یک آیتمِ فید (دروازه‌ی امنِ داده به UI). */
export function feedAttachments(item: Pick<RevayatItem, 'attachments'>): TabyinStageAttachment[] {
  return normalizeTabyinAttachments(item.attachments);
}

/** نوعِ مؤثر از روی پیوست‌های واقعی — صوت > ویدئو > تصویر > نوشته. */
export function feedItemKind(
  item: Pick<RevayatItem, 'attachments' | 'primary_media_type'>,
): ContentKind {
  const types = feedAttachments(item).map((a) => a.media_type);
  return resolveContentKind(types);
}

/**
 * «قهرمانِ» هر پست برای کارت — صوت > ویدئو > تصویر > نخستین فایل.
 * کارتِ پادکست به کاورِ تصویری هم نیاز دارد، پس دومین خروجی را هم
 * می‌دهد: نخستین پیوستِ تصویری (ممکن است وجود نداشته باشد).
 */
export function heroOfFeedItem(item: Pick<RevayatItem, 'attachments'>): {
  hero?: TabyinStageAttachment;
  image?: TabyinStageAttachment;
  all: TabyinStageAttachment[];
} {
  const all = feedAttachments(item);
  const hero =
    all.find((a) => a.media_type === 'audio') ||
    all.find((a) => a.media_type === 'video') ||
    all.find((a) => a.media_type === 'image') ||
    all[0];
  return { hero, image: all.find((a) => a.media_type === 'image'), all };
}

/* ───────────────────────────────────────────────────────────────── */
/*  کوئری‌ساز — API و مسیرِ صفحه از یک منبع                             */
/* ───────────────────────────────────────────────────────────────── */

/** کوئریِ APIِ لیستِ تبیین (parámetrs: page/page_size/media_type/author/search) */
export function buildFeedQuery(
  filters: FeedFilters,
  page: number,
  pageSize = FEED_PAGE_SIZE,
): string {
  const p = new URLSearchParams();
  p.set('page', String(Math.max(1, page)));
  p.set('page_size', String(pageSize));
  if (filters.type) p.set('media_type', filters.type);
  if (filters.author.trim()) p.set('author', filters.author.trim());
  if (filters.q.trim()) p.set('search', filters.q.trim());
  return p.toString();
}

/** مسیرِ /tabyin با فیلترها — برای سینکِ URL (قابل‌اشتراک‌گذاری). */
export function buildFeedPath(filters: FeedFilters): string {
  const p = new URLSearchParams();
  if (filters.q.trim()) p.set('q', filters.q.trim());
  if (filters.type) p.set('type', filters.type);
  if (filters.author.trim()) p.set('author', filters.author.trim());
  const s = p.toString();
  return s ? `/tabyin?${s}` : '/tabyin';
}

/** خواندنِ فیلترها از searchParamsِ سرور (امن در برابر آرایه/نویز). */
export function feedFiltersFromSearchParams(
  sp: Record<string, string | string[] | undefined>,
): FeedFilters {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';
  const type = one(sp.type);
  return {
    q: one(sp.q),
    type: (['', 'video', 'image', 'audio', 'other'] as const).includes(
      type as '' | 'video' | 'image' | 'audio' | 'other',
    )
      ? (type as FeedTypeFilter)
      : '',
    author: one(sp.author),
  };
}

/* ───────────────────────────────────────────────────────────────── */
/*  ابزارهای ریزِ فید                                                  */
/* ───────────────────────────────────────────────────────────────── */

/** حذفِ موارد تکراری هنگام چسباندنِ صفحات (اسکرولِ بی‌پایان). */
export function dedupeFeed(existing: RevayatItem[], incoming: RevayatItem[]): RevayatItem[] {
  const seen = new Set(existing.map((i) => i.external_id));
  return [...existing, ...incoming.filter((i) => !seen.has(i.external_id))];
}

/* ───────────────────────────────────────────────────────────────── */
/*  حذفِ محتوای تکراریِ «عیناً یکسان» — قرارداد فید                  */
/* ───────────────────────────────────────────────────────────────── */

/**
 * نرمال‌سازیِ متن صرفاً برای ساختِ «کلیدِ قیاس» — هرگز برای نمایش
 * استفاده نمی‌شود. سبک‌نویسی‌های متفاوتِ فارسی/عربی (ی/ك عربی،
 * کشیده، نویسه‌های صفرپهنا، اعراب) نباید باعث شود دو نسخه‌ی یک
 * محتوا دوتا دیده شوند.
 */
function normalizeForKey(s: string | null | undefined): string {
  /* eslint-disable no-misleading-character-class, no-irregular-whitespace --
     عمدی: کلاسِ یونیکدِ نرمال‌سازیِ متنِ فارسی/عربی (ی/ك عربی، کشیده،
     اعراب و نویسه‌های صفرپهنا) — دقیقاً همان چیزی که باید حذف/نگاشت شود. */
  return (
    asText(s)
      .replace(/[يى]/g, 'ی') // ي ى عربی → ی فارسی
      .replace(/ك/g, 'ک') // ك عربی → ک فارسی
      // کشیده + اعراب + نویسه‌های صفرپهنا (برای قیاس، نه نمایش)
      .replace(/[ـً-ْٰ​‌‍‎‏﻿]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  );
  /* eslint-enable no-misleading-character-class, no-irregular-whitespace */
}

/**
 * کلیدِ هویتِ محتواییِ یک روایت. دو پست «عیناً یکسان» — یعنی عنوان و
 * کپشنِ نرمال‌شده‌ی یکسان **و** مجموعه‌ی رسانه‌های یکسان (URL به URL) —
 * کلیدِ مشترک می‌گیرند و فقط نخستین‌شان در فید می‌ماند.
 *
 * حاشیه‌های امن (داده هرگز قربانی نمی‌شود):
 *   • متنِ یکسان + رسانه‌ی متفاوت (مثلاً دو عکسِ مختلف با کپشنِ همسان)
 *     کلیدِ متفاوت دارد و هر دو نمایش داده می‌شوند؛
 *   • پستِ کاملاً تهی (نه عنوان، نه کپشن، نه پیوست) روی external_id
 *     فرو می‌افتد تا کلیدهای تهی به‌هم نچسبند.
 */
export function feedContentKey(item: RevayatItem): string {
  const title = normalizeForKey(item.title);
  const desc = normalizeForKey(item.description);
  const urls = feedAttachments(item)
    .map((a) => a.url)
    .join(' ');
  if (!title && !desc && !urls) return `id:${item.external_id}`;
  return `${title}|${desc}|${urls}`;
}

/**
 * حذفِ نسخه‌های تکراریِ «عیناً یکسان» از لیست — اولین نسخه می‌ماند.
 * در هر فیلتر (همه/متن/…) و بعد از هر واکشی اعمال می‌شود و مخصوصاً
 * نوشته‌های سندیکا‌شده را که چندبار سینک شده‌اند تکی می‌کند.
 */
export function dedupeFeedContent(items: RevayatItem[]): RevayatItem[] {
  const seen = new Set<string>();
  const out: RevayatItem[] = [];
  for (const item of items) {
    const key = feedContentKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

/** برچسب‌های چیپِ نوع — با واژگانِ قراردادِ تگ (ویدئو/تصویر/صوت/متن). */
export const FEED_TYPE_TABS: { value: FeedTypeFilter; label: string }[] = [
  { value: '', label: 'همه' },
  { value: 'video', label: 'ویدئو' },
  { value: 'image', label: 'تصویر' },
  { value: 'audio', label: 'صوت' },
  { value: 'other', label: 'متن' },
];
