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
  if (/^(https?:)?\/\//i.test(trimmed)) return normalizeSameOriginScheme(trimmed);
  const base = siteConfig.apiUrl.replace(/\/+$/, '');
  return `${base}/${trimmed.replace(/^\/+/, '')}`;
}

/**
 * نشانیِ مطلقی که به میزبانِ خودِ API اشاره می‌کند باید با همان پروتکلِ
 * API سرو شود؛ در غیر این صورت مرورگر (mixed content) یا لودرِ
 * next/image (remotePatterns) آن را پس می‌زند. نشانیِ میزبانِ خارجی
 * هرگز دست‌نخورده برمی‌گردد.
 */
function normalizeSameOriginScheme(url: string): string {
  try {
    const base = new URL(siteConfig.apiUrl);
    const abs = new URL(url, base);
    if (abs.host !== base.host) return url;
    if (abs.protocol === base.protocol) return url;
    abs.protocol = base.protocol;
    return abs.href;
  } catch {
    return url;
  }
}
