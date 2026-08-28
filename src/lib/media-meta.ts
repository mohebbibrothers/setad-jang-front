/**
 * ═══════════════════════════════════════════════════════════════════
 * media-meta — قالب‌بندیِ فارسیِ ابرداده‌های رسانه‌ایِ جهاد تبیین
 *
 * صفحه‌ی جزئیاتِ محتوا (tabyin/[slug]) باید «هر آنچه در دیتابیس داریم»
 * را زیبا نشان دهد: مدتِ ویدئو/صوت، ابعادِ تصویر، حجمِ فایل و برچسبِ
 * فارسیِ نوع رسانه. قوانینِ نمایش اینجا متمرکز و تست‌پذیر است:
 *
 *   • مقادیر نامعتبر/صفر/غایب هرگز رندر نمی‌شوند → خروجی null است
 *     تا UI به‌جای «۰ کیلوبایت» هیچ چیپی نشان ندهد.
 *   • اعداد فارسی (formatPersianNumber) و جداکننده‌ی اعشاریِ فارسی «٫».
 * ═══════════════════════════════════════════════════════════════════
 */

import { formatPersianNumber, toPersianDigits } from './utils';

/** ثانیه → «۷:۲۴» / «۱:۰۲:۰۹» با ارقام فارسی؛ ورودی نامعتبر/صفر → null */
export function formatClockFa(totalSeconds: number | null | undefined): string | null {
  if (!totalSeconds || !Number.isFinite(totalSeconds) || totalSeconds <= 0) return null;
  const total = Math.floor(totalSeconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  const raw = h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
  return toPersianDigits(raw);
}

/** حجم بر حسب کیلوبایت → «۹۸۰ کیلوبایت» / «۱٫۴ مگابایت»؛ صفر/نامعتبر → null */
export function formatFileSizeFa(kb: number | null | undefined): string | null {
  if (!kb || !Number.isFinite(kb) || kb <= 0) return null;
  if (kb < 1024) return `${formatPersianNumber(kb)} کیلوبایت`;
  const mb = kb / 1024;
  // یک رقم اعشار، بدون «.۰» اضافی: ۱.۰ مگابایت → ۱ مگابایت
  const rounded = Math.round(mb * 10) / 10;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${formatPersianNumber(text)} مگابایت`;
}

/** ابعادِ خامِ منبع («1280X905» | «1024x768») → «۱۲۸۰×۹۰۵ پیکسل»؛ نامعتبر → null */
export function formatDimensionsFa(size: string | null | undefined): string | null {
  if (!size) return null;
  const match = size.trim().match(/^(\d+)\s*[x×X]\s*(\d+)$/i);
  if (!match) return null;
  const w = Number(match[1]);
  const h = Number(match[2]);
  if (!w || !h) return null;
  // بدون جداکننده‌ی هزارگان — «۱۲۸۰×۹۰۵» نه «۱٬۲۸۰×۹۰۵»
  return `${toPersianDigits(w)}×${toPersianDigits(h)} پیکسل`;
}

/**
 * ── نوعِ مؤثرِ محتوا (قراردادِ نمایشِ صفحه‌ی جزئیات) ──────────────
 *
 *  چرا این لایه هست؟ طبقه‌بندیِ بالادست (primary_media_type) گاهی با
 *  واقعیتِ پیوست‌ها ناسازگار است: پادکستی که فقط «صوت + کاورِ تصویری»
 *  داشت با برچسبِ «ویدئو» همگام شده بود و صفحه به‌غلط تگِ ویدئو می‌زد.
 *
 *  قاعده‌ی تثبیت‌شده با کارفرما:
 *    نوعِ مؤثر = پیوستِ قهرمان (همان چیزی که استیج واقعاً نمایش می‌دهد)
 *    در غیابِ پیوست → primary_media_type؛ در غیابِ هر دو → متن‌محور.
 *
 *  برچسب‌های کانونیکال (قراردادِ کارفرما، به‌جای display خامِ بالادست):
 *    image → تصویر · video → ویدئو · audio → پادکست · سایر‌اش → نوشته
 *    («هر چیزی که تصویری، ویدئویی و پادکست نباشد، نوشته است»)
 */
export type ContentKind = 'image' | 'video' | 'audio' | 'other';

function asKind(v: string | null | undefined): ContentKind | undefined {
  return v === 'image' || v === 'video' || v === 'audio' || v === 'other' ? v : undefined;
}

/** نوعِ مؤثر را با اولویتِ «پیوستِ واقعی» از روی دو سرچشمه تشخیص می‌دهد. */
export function resolveContentKind(
  heroType: string | null | undefined,
  primaryType: string | null | undefined,
): ContentKind {
  return asKind(heroType) ?? asKind(primaryType) ?? 'other';
}

/** برچسبِ فارسیِ کانونیکال — همیشه مقدار دارد، هیچ‌وقت انگلیسی نیست. */
export function contentKindFa(kind: ContentKind): string {
  switch (kind) {
    case 'image':
      return 'تصویر';
    case 'video':
      return 'ویدئو';
    case 'audio':
      return 'پادکست';
    default:
      return 'نوشته';
  }
}

/**
 * تامنیلِ GIFِ ویدئوهای منبع: نسخه‌ی /org/uploads/ روی هاستِ مدیا به
 * /thumbnail/uploads/ + پسوند .gif نگاشت می‌شود (قراردادِ سرویسِ
 * تامنیل‌سازِ منبع — همان الگویی که کاشی‌های دیوار هم استفاده می‌کنند).
 */
export function videoThumbnailGifUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  return url.replace('/org/uploads/', '/thumbnail/uploads/').replace(/\.[a-z0-9]+$/i, '.gif');
}
