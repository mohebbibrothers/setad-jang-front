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

/**
 * کلیدِ دامنه‌ی فیلتر — قراردادِ جفت‌کردنِ «شمارِ اسکن‌شده» با دیدگاهِ
 * فعلی: عدد فقط وقتی معتبر است که scopeاش با scopeِ فیلترهای فعلی
 * برابر باشد، وگرنه عددیِ بی‌ربط مطمئن به نظر می‌رسد (دقیقاً همان باگی
 * که شمارنده‌ی فیلتردار قبلاً داشت). از جداکننده‌ی یونیکدِ واحد
 * (U+001F) استفاده می‌شود تا با متنِ کاربر برخورد نکند.
 */
export function feedScopeKey(filters: FeedFilters): string {
  return [filters.q.trim(), filters.type, filters.author.trim()].join('\u001f');
}

/** کوئریِ سرویسِ شمارِ واقعی (/api/tabyin-count) — واژگانِ عمومیِ صفحه. */
export function buildFeedCountQuery(filters: FeedFilters): string {
  const p = new URLSearchParams();
  if (filters.q.trim()) p.set('q', filters.q.trim());
  if (filters.type) p.set('type', filters.type);
  if (filters.author.trim()) p.set('author', filters.author.trim());
  return p.toString();
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

/** شکلِ حداقلیِ سازگار با یک محتوای تبیینی — برای استفاده‌ی دیوار و فید. */
export type DedupeableContent = {
  external_id: string;
  title?: string | null;
  description?: string | null;
  author_username?: string | null;
  attachments?: unknown;
};

export function feedContentKey(item: DedupeableContent): string {
  const title = normalizeForKey(item.title);
  const desc = normalizeForKey(item.description);
  const urls = feedAttachments(item)
    .map((a) => a.url)
    .join(' ');
  if (!title && !desc && !urls) return `id:${item.external_id}`;
  return `${title}|${desc}|${urls}`;
}

/** پیوستِ «رسانه‌ای قابل‌رؤیت» — تصویر/ویدئو/صوت هویتِ بصریِ کارت را می‌سازند. */
const RENDERABLE_MEDIA = new Set(['image', 'video', 'audio']);

/**
 * کلیدِ «فشرده» — پاسِ دومِ شکارِ تکرار، مخصوص نوشته‌ها.
 *
 * چرا لازم است؟ پاسِ اول (feedContentKey) دو پست را فقط وقتی یکی می‌داند
 * که متنِ نرمال‌شده‌شان «حرف به حرف» برابر باشد؛ اما سندیکای بالادست
 * گاهی دو نسخه‌ی یک نوشته را با تفاوت‌های «نامرئی» می‌فرستد: نشانه‌های
 * جهت‌دهیِ یونیکد (ALM/RLM/LRM)، نویسه‌های bidi embedding
 * (\u202A-\u202E و \u2066-\u2069)، تفاوتِ سجاوند (نقطه/ویرگول/سه‌نقطه)،
 * اینکه عنوان در یکی خالی و در دیگری در کپشن تکرار شده باشد، یا اینکه
 * مرزِ پیوست‌ها فرق کند (مثلاً یکی فایلِ «سایر» داشته باشد). دو نسخه
 * روی صفحه «عیناً یکسان» دیده می‌شوند ولی کلیدِ پاسِ اول‌شان فرق
 * می‌کند. پاسِ فشرده هویتِ متنی را می‌گیرد تا این شباهت‌ها گیر نیفتند.
 *
 * مرزِ دقیقِ پاس (داده هرگز قربانی نمی‌شود):
 *   • فقط وقتی فعال است که آیتم **هیچ رسانه‌ی قابل‌رؤیتی** (تصویر/
 *     ویدئو/صوت) نداشته باشد — دو پست با متنِ همسان ولی عکس/ویدئو/صوتِ
 *     متفاوت محتواهای متمایزی‌اند و هر دو می‌مانند؛
 *   • پیوست‌های «سایر» (سند/فایل) در کلید با **عنوانِ** فایل لحاظ
 *     می‌شوند، نه URL — چون URLِ ذخیره‌سازی بین دو سینک فرق می‌کند
 *     ولی عنوانِ فایل هویتِ واقعی‌اش است؛ دو متنِ همسان با سندهایِ
 *     متفاوت تیترشان، جدا می‌مانند و هر دو نمایش داده می‌شوند؛
 *   • پوسته‌های کاملاً تهی (نه متنِ خواندنی، نه رسانه، نه فایلِ
 *     عنوانی‌دار) با کلیدِ `void:<نویسنده>` ادغام می‌شوند — دوتایی که
 *     همان نویسنده را دارد دقیقاً یکی می‌ماند، پوسته‌ی نویسنده‌های
 *     متفاوت نجوا به‌هم نمی‌چسبند (چون نامِ نویسنده تنها تفاوتِ
 *     دیداری‌شان است و باید باقی بماند).
 */
export function feedLooseKey(item: DedupeableContent): string | null {
  const attachments = feedAttachments(item);
  if (attachments.some((a) => a.media_type && RENDERABLE_MEDIA.has(a.media_type))) return null;

  /* فقط «حروف و ارقامِ یونیکدِ معنادار» می‌مانند؛ نویسه‌های فرمتینگ،
     سجاوند، فاصله‌ها و نشانه‌های نامرئی (ALM/RLM/bidi و…) همگی با
     الگوی نگاتیوِ L/N حذف می‌شوند و در کلیدِ قیاس بی‌اثر می‌شوند. */
  const toLoose = (s: string | null | undefined): string =>
    normalizeForKey(s)
      .normalize('NFKC')
      .replace(/[^\p{L}\p{N}]+/gu, '');

  const title = toLoose(item.title);
  const desc = toLoose(item.description);
  const textParts = [...new Set([title, desc].filter(Boolean))];
  const otherTitles = attachments
    .map((a) => toLoose(a.title))
    .filter(Boolean)
    .sort()
    .join('#');

  if (!textParts.length && !otherTitles) {
    /* پوستهٔ تهی: با نویسندهٔ عیناً یکسان ادغام می‌شود. */
    const author = toLoose(item.author_username);
    return author ? `void:${author}` : 'void:';
  }
  return `loose:${textParts.join('|')}${otherTitles ? `#${otherTitles}` : ''}`;
}

/**
 * حذفِ نسخه‌های تکراریِ «عیناً یکسان» با keep-first — نه کلاً حذف،
 * نه هر دو نسخه: دقیقاً یک نسخه از هر محتوا.
 * دو پاسِ متوالی: (۱) کلیدِ دقیق — متنِ نرمال‌شده + مجموعه‌ی رسانه‌ها؛
 * (۲) کلیدِ فشرده برای مواردِ بدونِ رسانه‌ی قابل‌رؤیت — فقط هویتِ
 * متنی/نویسنده، که نسخه‌های سندیکاشده‌ی بصری‌ی‌یکسان را هم می‌گیرد.
 * در هر فیلتر (همه/متن/…) و بعد از هر واکشی اعمال می‌شود و همان
 * منطقِ واحد در دیوارِ صفحه‌ی اصلی هم مصرف می‌شود.
 */
export function dedupeFeedContent<T extends DedupeableContent>(items: T[]): T[] {
  const seen = new Set<string>();
  const seenLoose = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const key = feedContentKey(item);
    if (seen.has(key)) continue;
    const loose = feedLooseKey(item);
    if (loose && seenLoose.has(loose)) continue;
    seen.add(key);
    if (loose) seenLoose.add(loose);
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
