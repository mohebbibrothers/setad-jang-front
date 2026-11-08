/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  api-base — «آدرسِ API» فقط در همین یک فایل تصمیم گرفته می‌شود
 *
 *  چرا این فایل جدا شد (حادثهٔ واقعی: «خوش آمدید» و بعد بیرون‌انداختنِ فوری)
 *  ──────────────────────────────────────────────────────────────────────────
 *  قراردادِ پروژه این است که مرورگر هیچ‌وقت مستقیم با هاستِ بک‌اند حرف نزند:
 *  همهٔ درخواست‌ها از `/api/proxy/...` (Route Handler هم‌دامنه) رد می‌شوند.
 *
 *  ولی `auth-tokens.ts` برای **بازfresh کردن توکن** آدرس را از
 *  `siteConfig.apiUrl` می‌ساخت؛ یعنی `https://api.besat.me/...` و در نتیجه:
 *
 *      • بقیهٔ درخواست‌ها  → هم‌دامنه  → کار می‌کنند
 *      • فقط refresh      → cross-origin → preflight
 *        (`Content-Type: application/json` ⇒ درخواستِ غیرساده) بی‌جواب می‌ماند
 *        چون `CORS_ALLOWED_ORIGINS` در production خالی است
 *
 *  نتیجهٔ زنجیره‌ای: هر ۴۰۱ کوچک (توکنِ کهنه در مرورگر، انقضای ۳۰ دقیقه‌ای، …)
 *  → تلاشِ refresh → شکستِ شبکه/CORS → `clearTokens()` → **خروجِ فوری**.
 *  یعنی کاربر «خوش آمدید» را می‌دید و همان لحظه بیرون می‌افتاد.
 *
 *  حالا هر دو مصرف‌کننده (`api.ts` و `auth-tokens.ts`) از همین ماژول آدرس
 *  می‌گیرند؛ یک منبعِ حقیقت، صفر واگرایی. این فایل هیچ وابستگی‌ای ندارد تا
 *  ایجادِ import چرخه‌ای (api ⇄ auth-tokens) ممکن نباشد.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { siteConfig } from './site';

/** پیشوندی که در مرورگر مصرف می‌شود: `/api/v1` (هم‌دامنه) یا `/api/proxy`. */
export function resolveBrowserApiBaseUrl(): string {
  if (typeof window === 'undefined') return '/api/v1';
  try {
    const configured = (siteConfig.apiUrl || '').trim();
    if (!configured) return '/api/v1';
    const apiHost = new URL(configured, window.location.origin).host;
    if (apiHost === window.location.host) return '/api/v1';
  } catch {
    /* URLِ نامعتبر → مسیرِ امن‌تر (پروکسی) */
  }
  return '/api/proxy';
}

/** آدرسِ کاملِ سمتِ سرور (SSR/RSC) — همان چیزی که api.ts استفاده می‌کند. */
export function resolveServerApiBaseUrl(): string {
  return `${siteConfig.apiUrl.replace(/\/+$/, '')}/api/v1`;
}

/**
 * در مرورگر همیشه از پروکسی هم‌دامنه می‌گیریم — چه `apiUrl` هم‌دامنه باشد چه
 * نباشد. (اگر `apiUrl` هم‌دامنه باشد، `/api/v1` هم همان نتیجه را می‌دهد و
 * درخواست یک hop کمتر دارد.)
 */
export function browserApiUrl(path: string): string {
  const base = resolveBrowserApiBaseUrl();
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
