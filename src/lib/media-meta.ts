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
 *  واقعیتِ پیوست‌ها ناسازگار است: پادکستی که «صوت + کاور» داشت با
 *  برچسبِ «ویدئو» همگام شده بود و صفحه به‌غلط تگِ فیلم می‌زد.
 *
 *  قاعده‌ی تثبیت‌شده با کارفرما (به‌روزرسانیِ سوم):
 *    • نوع فقط از روی «سندِ واقعی» (پیوست‌های قابل‌استفاده) تعیین می‌شود؛
 *    • اولویت: صوت > ویدئو > تصویر — **محتوایی که فایلِ صوتی دارد
 *      پادکست است، حتی اگر کاورِ ویدئویی/تصویری هم داشته باشد**؛
 *    • هرچه رسانه‌ی قابل‌استفاده ندارد → متن‌محور.
 *
 *  دو برچسبِ مجزا (قراردادِ کارفرما):
 *    تگِ بیضیِ سربرگ        نوعِ محتوا (برگه‌ی مشخصات)
 *    ─────────────          ─────────────────────────
 *    ویدئو            ───►  فیلم
 *    تصویر            ───►  عکس
 *    صوت              ───►  پادکست
 *    متن              ───►  نوشته
 */
export type ContentKind = 'image' | 'video' | 'audio' | 'other';

/**
 * نوعِ مؤثر را از روی فهرستِ media_type پیوست‌های واقعی تشخیص می‌دهد.
 * صوت همیشه می‌برد؛ بعد ویدئو؛ بعد تصویر؛ وگرنه «other» (متن/نوشته).
 */
export function resolveContentKind(types: Array<string | null | undefined>): ContentKind {
  if (types.includes('audio')) return 'audio';
  if (types.includes('video')) return 'video';
  if (types.includes('image')) return 'image';
  return 'other';
}

/** «نوع محتوا» در برگه‌ی مشخصات — قرارداد: فیلم/عکس/پادکست/نوشته. */
export function contentKindFa(kind: ContentKind): string {
  switch (kind) {
    case 'image':
      return 'عکس';
    case 'video':
      return 'فیلم';
    case 'audio':
      return 'پادکست';
    default:
      return 'نوشته';
  }
}

/** «تگ» — چیپِ بیضیِ بالای صفحه — قرارداد: ویدئو/تصویر/صوت/متن. */
export function contentKindTagFa(kind: ContentKind): string {
  switch (kind) {
    case 'image':
      return 'تصویر';
    case 'video':
      return 'ویدئو';
    case 'audio':
      return 'صوت';
    default:
      return 'متن';
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
