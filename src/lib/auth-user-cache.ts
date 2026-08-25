/**
 * ───────────────────────────────────────────────────────────────────────────
 * auth-user-cache — استورِ کوچکِ مشترکِ «کاربرِ فعلی» بیرون از درخت React
 *
 * چرا؟ تا امروز کاربرِ لاگین‌شده فقط داخل هوکِ useAuth کش می‌شد؛ نتیجه:
 * وقتی صفحه‌ی پروفایل نام/عکس/شناسه را ویرایش می‌کرد، چیپِ هدر تا
 * رفرشِ بعدی قدیمی می‌ماند. حالا یک منبعِ واحدِ حقیقت داریم:
 *
 *   • useAuth روی همین استور سوار است (useSyncExternalStore)؛
 *   • هر میوتیشنی که بک‌اند UserMeِ تازه برمی‌گرداند (ویرایش نام، اتصال
 *     شناسه، تغییر شناسه‌ی اصلی، ویرایش پروفایل) با applyUser/
 *     patchCachedUser همین‌جا به‌روز می‌شود؛
 *   • همه‌ی مصرف‌کننده‌ها (هدر، پروفایل، …) در همان فریمِ بعد سینک‌اند.
 *
 * قرارداد سینک دقیق با بک‌اند:
 *   - خروجیِ موفقِ /auth/me/, identifiers/verify, identifiers/make-primary
 *     = UserMeSerializer کامل → applyUser (جایگزینی کامل).
 *   - خروجیِ موفق /auth/profile/ = ProfileSerializer → فقط زیرشاخه‌ی
 *     profile مرج می‌شود؛ فیلدهای سطحِ user دست‌نخورده می‌مانند
 *     (patchCachedUser مرجِ کم‌عمق با ادغامِ profile).
 * ───────────────────────────────────────────────────────────────────────────
 */

import type { AuthUser } from './auth';

type Listener = () => void;

let currentUser: AuthUser | null = null;
const listeners = new Set<Listener>();

function emit(): void {
  listeners.forEach((fn) => fn());
}

export function getCachedUser(): AuthUser | null {
  return currentUser;
}

/** جایگزینیِ مطلق — فقط با UserMeِ کاملِ تازه از سرور (یا null برای پاک‌سازی) */
export function setCachedUser(user: AuthUser | null): void {
  currentUser = user;
  emit();
}

/**
 * مرجِ تدریجی — مخصوص خروجی‌هایی که UserMeِ کامل نیستند:
 * مثلاً ProfileSerializer (زیرکلید profile را جایگزین می‌کند).
 */
export function patchCachedUser(patch: Partial<AuthUser>): void {
  if (!currentUser) return;
  currentUser = {
    ...currentUser,
    ...patch,
    profile: patch.profile
      ? { ...(currentUser.profile ?? {}), ...patch.profile }
      : currentUser.profile,
  };
  emit();
}

export function subscribeCachedUser(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
