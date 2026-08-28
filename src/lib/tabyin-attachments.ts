import type { TabyinStageAttachment } from '@/components/tabyin/TabyinStage';

/**
 * ═══════════════════════════════════════════════════════════════════
 * عادی‌سازیِ دفاعیِ پیوست‌های جهاد تبیین
 *
 * چرا این لایه وجود دارد؟ قراردادِ سریالایزرِ بک‌اند (attachments[] با
 * فیلدهای url / media_type / duration / file_size / size / title) در
 * همه‌ی تست‌های محلی و بیلدِ تولید سالم رندر شد، اما تجربه‌ی تولید
 * نشان داد هر انحرافِ داده‌ی بالادستی (پیوستِ null، url غیررشته‌ای،
 * duration رشته‌ای، …) نباید بتواند کل صفحه‌ی جزئیات را بترکاند.
 *
 * این نرمالایزر تنها دروازه‌ی ورودِ داده به لایه‌ی UI است:
 *   • ورودی غیرآرایه (null / object / string) → لیستِ خالی؛
 *   • رکوردهای نامعتبر یا بدون url معتبر → حذف؛
 *   • duration / file_size → عدد (رشته‌ی عددی هم پذیرفته می‌شود)؛
 *   • media_type ناشناخته → undefined (نه رشته‌ی ساختگی).
 *
 * خروجی همیشه TabyinStageAttachment[]ِ تمیز و type-safe است.
 * ═══════════════════════════════════════════════════════════════════
 */

/** مقدار را — اگر رشته است — همان‌طور، وگرنه به رشته‌ی خالی کوتاه می‌کند. */
export function asText(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

/** coercion دفاعیِ عدد: NaN/Infinity/رشته‌ی غیرعددی → undefined */
function asFiniteNumber(v: unknown): number | undefined {
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

const MEDIA_TYPES = new Set(['image', 'video', 'audio', 'other'] as const);

type MediaType = 'image' | 'video' | 'audio' | 'other';

/**
 * هر چیزی که از API آمده را به لیستِ تمیزِ پیوست تبدیل می‌کند.
 * هیچ‌وقت throw نمی‌کند — بدترین حالت، لیستِ خالی است.
 */
export function normalizeTabyinAttachments(raw: unknown): TabyinStageAttachment[] {
  if (!Array.isArray(raw)) return [];
  const out: TabyinStageAttachment[] = [];
  for (const a of raw) {
    if (!a || typeof a !== 'object') continue;
    const rec = a as Record<string, unknown>;
    const url = asText(rec.url).trim();
    if (!url) continue;
    const mt = asText(rec.media_type);
    out.push({
      id: typeof rec.id === 'number' && Number.isFinite(rec.id) ? rec.id : undefined,
      url,
      media_type: MEDIA_TYPES.has(mt as MediaType) ? (mt as MediaType) : undefined,
      media_type_display: asText(rec.media_type_display) || undefined,
      duration: asFiniteNumber(rec.duration),
      file_size: asFiniteNumber(rec.file_size),
      size: asText(rec.size) || undefined,
      title: asText(rec.title) || undefined,
    });
  }
  return out;
}
