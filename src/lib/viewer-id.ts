/**
 * ═══════════════════════════════════════════════════════════════════
 * viewer-id.ts — شناسهٔ پایدارِ «بیننده» در مرورگر
 *
 * چرا این فایل وجود دارد (یافتهٔ آزمونِ زندهٔ production):
 *   شمارشِ بازدیدِ یکتا ابتدا در سرور بر پایهٔ «IP + User-Agent» ساخته
 *   می‌شد. اما ترافیک از لبهٔ Vercel می‌آید و `REMOTE_ADDR`ی که به جنگو
 *   می‌رسد IPِ خروجیِ Vercel است که بین درخواست‌ها عوض می‌شود؛ نتیجه اینکه
 *   یک مرورگر در هر درخواست «بینندهٔ تازه» به نظر می‌رسید و شمارنده چند
 *   برابر می‌شد (سه شمارش روی سه پردازهٔ Passenger).
 *
 *   راه‌حل استانداردِ صنعتی: یک شناسهٔ تصادفیِ یکتا سمتِ **مرورگر** که یک
 *   بار ساخته و در `localStorage` نگه داشته می‌شود و در هر درخواست با هدرِ
 *   `X-Viewer-Id` فرستاده می‌شود. با این کار dedupe مستقل از IP، NAT،
 *   پردازه و حتی تغییرِ شبکه می‌شود.
 *
 * حریمِ خصوصی:
 *   • UUID کاملاً تصادفی است؛ هیچ انگشت‌نگاریِ مرورگر یا دادهٔ شخصی در آن نیست.
 *   • در `localStorage`ِ همان دامنه می‌ماند و با پاک‌کردنِ داده‌های سایت
 *     از بین می‌رود.
 *   • سرور آن را هش می‌کند و شناسهٔ خام را ذخیره نمی‌کند.
 *
 * مقاومت در برابر خطا:
 *   • حالتِ ناشناس/مسدود (Safari/فایرفاکس سخت‌گیر): دسترسی به localStorage
 *     throw می‌کند ⇒ در همان نشست یک شناسهٔ موقتِ درون‌حافظه استفاده می‌شود
 *     (شمارش کار می‌کند، فقط بینِ تب‌ها پایدار نیست).
 *   • بدونِ `crypto.randomUUID` (مرورگرهای قدیمی/بسترِ ناامن): fallbackِ
 *     دستی از `crypto.getRandomValues` و در نهایت `Math.random`.
 * ═══════════════════════════════════════════════════════════════════
 */

const STORAGE_KEY = 'besat.viewer_id';

/** شناسهٔ حافظه‌ایِ پشتیبان (وقتی localStorage در دسترس نیست). */
let memoryId: string | null = null;

/** RFC4122 v4 — با `crypto.randomUUID` اگر باشد، وگرنه ساختِ دستی. */
function randomId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      const bytes = crypto.getRandomValues(new Uint8Array(16));
      /* نسخه ۴ و variant مطابقِ RFC4122 */
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }
  } catch {
    /* ادامه به fallbackِ نهایی */
  }
  /* آخرین پناه: تصادفیِ کافی برای dedupe (نه برای امنیت) */
  return `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/**
 * شناسهٔ پایدارِ این مرورگر (بار اول ساخته و ذخیره می‌شود).
 *
 * همیشه یک رشتهٔ معتبر برمی‌گرداند؛ هرگز throw نمی‌کند. در سرور (SSR) رشتهٔ
 * خالی برمی‌گرداند تا هیچ‌جا ناخواسته استفاده نشود.
 */
export function getViewerId(): string {
  if (typeof window === 'undefined') return '';
  if (memoryId) return memoryId;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && stored.length >= 8 && stored.length <= 64) {
      memoryId = stored;
      return stored;
    }
    const fresh = randomId();
    window.localStorage.setItem(STORAGE_KEY, fresh);
    memoryId = fresh;
    return fresh;
  } catch {
    /* localStorage مسدود/پر است — شناسهٔ نشست */
    memoryId = randomId();
    return memoryId;
  }
}

/** فقط برای تست: پاک‌کردنِ شناسهٔ حافظه‌ای. */
export function __resetViewerIdForTests(): void {
  memoryId = null;
}
