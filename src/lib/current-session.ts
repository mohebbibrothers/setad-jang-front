/**
 * ═══════════════════════════════════════════════════════════════════
 * current-session — تشخیصِ نشستِ فعلیِ کاربر از روی لیستِ سرور
 *
 * چرا این ماژول وجود دارد (تحلیلِ ریشه‌ای از کدِ بک‌اند):
 *   سریالایزرِ AuthSession عمداً فیلدِ is_current ندارد و last_seen_at
 *   فقط هنگامِ ساختِ نشست (لاگین) مقدار می‌گیرد — پس از آن هرگز
 *   به‌روز نمی‌شود. دو واقعیتِ مکمل، راهِ دقیق و راستگو را می‌سازد:
 *
 *   ۱) بک‌اند هنگام ساختِ نشست، رشته‌ی کاملِ User-Agentِ همان مرورگر
 *      را ذخیره می‌کند (services._create_auth_session ←
 *      request.META["HTTP_USER_AGENT"]).
 *   ۲) مرورگرِ در‌حال‌اجرای همین صفحه، User-Agentِ خودش را می‌داند.
 *
 *   پس «نشست فعلی» = تازه‌ترین نشستِ فعالِ نامنقضی با UAِ یکسان.
 *   اگر هیچ تطبیقی نبود (مثلاً مرورگر بعد از لاگین آپدیت شده)، هیچ
 *   نشستی «فعلی» علامت نمی‌خورد — بهتر از مثبتِ کاذب.
 *
 * منطق خالص و بدون سایدافکت (navigator از بیرون تزریق می‌شود) — تست‌پذیر.
 * ═══════════════════════════════════════════════════════════════════
 */

import type { AuthSession } from './auth';

/** انقضای نشست بر اساس expires_at (زمان سرور، ISO) */
export function isSessionExpired(
  session: Pick<AuthSession, 'expires_at'>,
  now: number = Date.now(),
): boolean {
  if (!session.expires_at) return false;
  const t = Date.parse(session.expires_at);
  return Number.isFinite(t) && t <= now;
}

/**
 * یکسان‌بودن UA ذخیره‌شده با UA فعلی — مقاوم به truncate شدن در
 * ذخیره‌سازی (بک‌اند UA را تا ۵۱۲ کاراکتر می‌بُرد).
 */
export function userAgentMatches(stored: string | null | undefined, actual: string): boolean {
  const s = (stored ?? '').trim();
  const a = (actual ?? '').trim();
  if (!s || !a) return false;
  return s === a || a.startsWith(s) || s.startsWith(a);
}

function recencyKey(s: AuthSession): number {
  return Date.parse(s.last_seen_at || s.created_at || '') || 0;
}

/**
 * id نشستِ فعلی: جدیدترین نشستِ فعال و نامنقضی که UAاش با مرورگرِ
 * فعلی یکی است. بدونِ تطبیق → null (راستگویی بهتر از حدس است).
 */
export function findCurrentSessionId(
  sessions: ReadonlyArray<AuthSession>,
  clientUserAgent: string,
  now: number = Date.now(),
): AuthSession['id'] | null {
  let best: AuthSession | null = null;
  for (const s of sessions) {
    if (s.is_revoked || isSessionExpired(s, now)) continue;
    if (!userAgentMatches(s.user_agent, clientUserAgent)) continue;
    if (!best || recencyKey(s) > recencyKey(best)) best = s;
  }
  return best?.id ?? null;
}

/**
 * ترتیبِ نمایش: نشستِ فعلی همیشه بالای لیست، بقیه به ترتیبِ سرور
 * (مرتب‌سازی پایدار — اصلِ -last_seen_at از selectors حفظ می‌شود).
 */
export function orderSessionsForDisplay(
  sessions: ReadonlyArray<AuthSession>,
  currentId: AuthSession['id'] | null,
): AuthSession[] {
  if (currentId === null) return [...sessions];
  const current = sessions.find((s) => s.id === currentId);
  if (!current) return [...sessions];
  return [current, ...sessions.filter((s) => s.id !== currentId)];
}

/** خواندنِ امنِ UA در محیطِ کلاینت (SSR/تست → رشته‌ی خالی) */
export function clientUserAgent(): string {
  return typeof navigator === 'undefined' ? '' : navigator.userAgent || '';
}
