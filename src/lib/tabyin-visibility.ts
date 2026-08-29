import { absoluteMediaUrl } from './utils';
import { normalizeTabyinAttachments } from './tabyin-attachments';
import type { TabyinStageAttachment } from '@/components/tabyin/TabyinStage';

/**
 * ═══════════════════════════════════════════════════════════════════
 * tabyin-visibility — قراردادِ واحدِ «قابل‌نمایش بودنِ محتوا»
 *
 * چرا این ماژول وجود دارد؟ دیوارِ جهاد تبیین در صفحه‌ی اصلی از
 * دیرباز فقط کاشی برای محتوایی می‌سازد که «چیزی برای نشان‌دادن»
 * دارد: کاور، ویدئو یا متنِ خواندنی؛ سطرهای پوچ اصلاً کاشی نمی‌شوند
 * و در شمارنده‌ی «همه» هم حساب نمی‌شوند. فیدِ روایت‌ها (/tabyin) تا
 * قبل از این قرارداد، همین سطرهای پوچ را به‌شکلِ کارت‌های قشنگِ توخالی
 * نشان می‌داد و در شمارنده‌اش هم می‌آورد — برای همین دو عددِ قابل‌مقایسه
 * با هم برابر نبودند (۳۳۴۴ در برابر ۳۳۳۷).
 *
 * این فایل نسخه‌ی «سطحِ خامِ داده»ی همان شروطِ دیوار است تا فید هم
 * دقیقاً همان جهانِ قابل‌نمایش را پایه بگیرد — یک منبعِ واحد برای
 * هر دو صفحه، بنابراین عددِ دیوار و عددِ فید دیگر هیچ‌وقت از هم نمی‌افتند.
 *
 * نگاشتِ دقیق از کدِ دیوار (home-data.loadTabyinItems +
 * TabyinSection.hasRenderableContent):
 *
 *   دیوار (روی TabyinItem نگاشت‌شده)      این فایل (روی سطرِ خام)
 *   ─────────────────────────────      ─────────────────────────
 *   coverUrl (تصویر یا پوسترِ ویدئو،    hasUsableCover — همان دو
 *   فقط وقتی هاست قابلِ embed است)      کاندیدا + همان محدودیتِ هاست
 *   videoUrl (نخستین پیوستِ ویدئوی      hasUsableVideo — همان شرط
 *   دارای url)                          url-دار بودن
 *   hasReadableText (title/summary      hasReadableContentText
 *   بعد از پاک‌سازیِ نامرئی‌ها)         (title/description با همان
 *                                       مجموعه‌ی strip)
 * ═══════════════════════════════════════════════════════════════════
 */

/** شکلِ حداقلیِ سطرِ خامِ محتوا — هم ApiTabyin هم RevayatItem با آن جفت است. */
export type ContentRow = {
  external_id?: string;
  title?: string | null;
  description?: string | null;
  attachments?: unknown;
};

/**
 * حذف نویسه‌های نامرئی (نیم‌فاصله، ZWJ، BOM، علائم جهت‌دهی، NBSP و
 * word-joiner) پیش از سنجشِ طول — بایت‌به‌بایت همان عبارتِ منظمِ دیوار
 * (TabyinSection.stripInvisibles) تا رفتارِ دو صفحه تفکیک‌ناپذیر باشد.
 */
export function stripInvisibles(s: string | null | undefined): string {
  return (s ?? '').replace(/[\u200B-\u200F\u202A-\u202E\u2060\u00A0\uFEFF]/g, '').trim();
}

/** آیا متنِ قابل‌خواندن دارد (عنوان یا کپشنِ ناتهی)؟ — قراردادِ مشترک. */
export function hasReadableContentText(row: Pick<ContentRow, 'title' | 'description'>): boolean {
  return stripInvisibles(row.title).length > 0 || stripInvisibles(row.description).length > 0;
}

/**
 * پوسترِ ویدئو — همان محدودیتِ سخت‌گیرانه‌ی دیوار: فقط هاستِ مدیا
 * (app-media.armansky.ir) + الگوی /org/uploads/ به تامنیل نگاشت می‌شود.
 */
function videoPosterUrl(videoUrl: string | undefined): string | undefined {
  if (!videoUrl) return undefined;
  try {
    const u = new URL(videoUrl);
    if (u.hostname !== 'app-media.armansky.ir') return undefined;
    u.pathname = u.pathname
      .replace('/org/uploads/', '/thumbnail/uploads/')
      .replace(/\.[a-z0-9]+$/i, '.gif');
    return u.toString();
  } catch {
    return undefined;
  }
}

const firstMedia = (
  attachments: TabyinStageAttachment[],
  type: 'image' | 'video',
): TabyinStageAttachment | undefined => attachments.find((a) => a.media_type === type && a.url);

/**
 * کاورِ قابلِ استفاده: نخستین تصویر، وگرنه پوسترِ ویدئو — اما هاستِ
 * app-service.armansky.ir (که hot-link را 4xx می‌کند) هرگز کاور
 * حساب نمی‌شود؛ دقیقاً همان قانونِ coverIsKnownPublic دیوار.
 */
function hasUsableCover(attachments: TabyinStageAttachment[]): boolean {
  const image = firstMedia(attachments, 'image');
  const video = firstMedia(attachments, 'video');
  const primaryCover = absoluteMediaUrl(image?.url) ?? absoluteMediaUrl(videoPosterUrl(video?.url));
  return Boolean(primaryCover) && !primaryCover!.includes('app-service.armansky.ir');
}

/** ویدئوی قابلِ پخش — وجودِ پیوستِ ویدئوی url-دار (همان videoUrl دیوار). */
function hasUsableVideo(attachments: TabyinStageAttachment[]): boolean {
  return Boolean(absoluteMediaUrl(firstMedia(attachments, 'video')?.url));
}

/**
 * آیا این سطر در دنیای «قابل‌نمایش» است؟ — کاور، ویدئو یا متنِ خواندنی.
 * پوسته‌های تهی (نه متن، نه کاور، نه ویدئو) false برمی‌گیرند و نه در فید
 * نه در دیوار دیده/شمرده می‌شوند. پیوست‌ها از دروازه‌ی امنِ
 * normalizeTabyinAttachments رد می‌شوند تا urlهای تهی/خراب فریب ندهند.
 */
export function hasVisibleContent(row: ContentRow): boolean {
  if (hasReadableContentText(row)) return true;
  const attachments = normalizeTabyinAttachments(row.attachments);
  return hasUsableCover(attachments) || hasUsableVideo(attachments);
}

/** فیلترِ جهانِ قابل‌نمایش — منبعِ واحد برای فید و شمارنده‌ها. */
export function visibleContents<T extends ContentRow>(rows: T[]): T[] {
  return rows.filter(hasVisibleContent);
}
