import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { siteConfig } from './site';

/** Tailwind-merge + clsx helper for safe className composition. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Format integer using Persian locale (٬ thousands separator and Persian digits). */
export function formatPersianNumber(value: number | string): string {
  const n = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(n)) return String(value);
  return n.toLocaleString('fa-IR');
}

/** Format a Toman/Rial currency amount in Persian. */
export function formatToman(amount: number): string {
  return `${formatPersianNumber(amount)} تومان`;
}

/** Convert any digits in a string to Persian digits. */
export function toPersianDigits(input: string | number): string {
  const map = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(input).replace(/[0-9]/g, (d) => map[Number(d)]);
}

/** Truncate a long text safely with an ellipsis. */
export function truncate(text: string, maxLen = 120): string {
  if (!text) return '';
  return text.length <= maxLen ? text : `${text.slice(0, maxLen).trim()}…`;
}

/**
 * نرمال‌سازیِ lookup برای استفاده در API path — سند و نگهبانِ باگِ
 * double-encoding در پروداکشن (Next.js 15.5.x, مسیرهای ISR با پارامِ فارسی):
 *
 *   در صفحه‌های RSC با `revalidate`، وقتی کاربر روی مسیرِ
 *   `/madadkar/تست` می‌زند، ممکن است `params.slug` هنوز percent-encoded
 *   («%D8%AA%D8%B3%D8%AA») تحویل شود؛ در حالی که در route handler ها
 *   همان مقدار دیکود‌شده («تست») می‌رسد. اگر روی مقدارِ انکدشده دوباره
 *   `encodeURIComponent` بزنیم، «%» خودش انکد می‌شود («%25D8…») و
 *   لایه‌های میانی (Nginx → ASGI → Django) فقط یک لایه decode می‌کنند،
 *   پس بک‌اند رشته‌ی هنوز-انکدشده را با اسلاگِ دیتابیس تطبیق نمی‌دهد و
 *   پاسخ ۴۰۴ می‌شود — دقیقاً باگِ «صفحه‌ی جزئیات حرکت ۴۰۴ می‌دهد».
 *
 *   این تابع ورودی را در صورت نیاز یک‌بار decode و سپس دقیقاً یک‌بار
 *   encode می‌کند؛ یعنی idempotent است و روی هر دو حالتِ ورودی
 *   (خام/انکدشده) خروجیِ درست و یکسان می‌دهد.
 *
 * مثال:
 *   canonicalApiLookup('تست')            → '%D8%AA%D8%B3%D8%AA'
 *   canonicalApiLookup('%D8%AA%D8%B3%D8%AA') → '%D8%AA%D8%B3%D8%AA'
 */
export function canonicalApiLookup(lookup: string): string {
  let decoded = lookup;
  if (lookup.includes('%')) {
    try {
      decoded = decodeURIComponent(lookup);
    } catch {
      decoded = lookup; // دنباله‌ی % ناقص — خام می‌گذریم و یک لایه encode
    }
  }
  return encodeURIComponent(decoded);
}

/**
 * Normalise any backend-supplied media URL to an absolute one.
 *
 * Django's `ImageField.to_representation()` returns an absolute URL
 * only when a request context is available. Some list serializers and
 * SerializerMethodField overrides skip that context and return the
 * relative `/media/xxx.jpg` path instead.
 *
 * When we hand such a relative URL to <img> or <Image>, the browser
 * resolves it against the FRONT-END origin (188.253.2.86:3000) and
 * inevitably 404s, because the media lives on the backend origin
 * (188.253.2.86:18080). This helper resolves the URL against
 * NEXT_PUBLIC_API_URL so the picture always loads.
 *
 * Behaviour:
 *   ""                         → undefined
 *   "https://cdn.example/x"     → passthrough (already absolute)
 *   "http://…"                  → passthrough
 *   "//cdn.example/x"           → passthrough (protocol-relative)
 *   "http://<API_HOST>/x"       → scheme upgraded to the API URL's scheme
 *                                 (e.g. http→https) so a same-origin media
 *                                 URL never trips mixed-content blocking
 *                                 or a next/image remotePatterns mismatch
 *   "/media/x.jpg"              → `${API_URL}/media/x.jpg`
 *   "media/x.jpg"               → `${API_URL}/media/x.jpg`
 */
export function absoluteMediaUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  const trimmed = String(url).trim();
  if (!trimmed) return undefined;
  if (/^(https?:)?\/\//i.test(trimmed)) return normalizeMediaUrl(trimmed);
  const base = siteConfig.apiUrl.replace(/\/+$/, '');
  return `${base}/${trimmed.replace(/^\/+/, '')}`;
}

/** هاست را به فرمِ «خانواده» درمی‌آورد: بدون www و با حروف کوچک. */
function familyHost(hostname: string): string {
  return hostname.toLowerCase().replace(/^www\./, '');
}

/**
 * آیا این نشانی به «زیرمجموعه‌ی رسانه‌ی خودی» تعلق دارد؟
 * خانواده = همان apex (با/بدون www) یا زیردامنه‌ی apiِ آن.
 */
function isOwnMediaFamily(abs: URL, base: URL): boolean {
  const host = familyHost(abs.hostname);
  const baseFamily = familyHost(base.hostname);
  return host === baseFamily || host === `api.${baseFamily}`;
}

/**
 * نشانیِ مطلقِ رسانه همیشه باید با میزبانِ عمومیِ فعلی
 * (NEXT_PUBLIC_API_URL) سرو شود — نه با هاستی که بک‌اند هنگامِ ساختِ
 * پاسخ دیده است.
 *
 * چرا؟ در حالت «API پشت Vercel» درخواستِ سرور Next به upstream می‌رود و
 * request.host در جنگو هاستِ upstream (مثل api.besat.me) است؛ وقتی
 * سریالایزر build_absolute_uri کند، URLهای مطلق با هاستِ upstream بیرون
 * می‌آیند (باگِ واقعی: عکس‌های R4J) — آدرس‌هایی که نه در remotePatterns
 * هستند و نه روی شبکه‌های محدود برای کاربر قابل دریافت. قراردادِ پلتفرم:
 * مسیر /media/ روی همه‌ی میزبان‌های خانواده (apex/www/api) به یک فایل
 * اشاره می‌کند، پس بازنویسیِ مبدأ امن است. هر میزبانِ خارجی — حتی با
 * مسیر /media/ — دست‌نخورده می‌ماند (CDNهای واقعی محافظت می‌شوند).
 */
function normalizeMediaUrl(url: string): string {
  try {
    const base = new URL(siteConfig.apiUrl);
    const abs = new URL(url, base);
    if (!isOwnMediaFamily(abs, base)) return url;
    if (!abs.pathname.startsWith('/media/')) {
      // نشانیِ خودیِ غیررسانه: فقط پروتکل را با API هم‌سو کن (رفتار قبلی)
      if (abs.host === base.host && abs.protocol !== base.protocol) {
        abs.protocol = base.protocol;
        return abs.href;
      }
      return url;
    }
    // بازنویسیِ مبدأ به میزبانِ عمومیِ فعلی — مسیر، کوئری و هَش حفظ می‌شوند
    return `${base.origin}${abs.pathname}${abs.search}${abs.hash}`;
  } catch {
    return url;
  }
}
