/**
 * شناسه‌ی کاربر (ایمیل | موبایل) — آینه‌ی سبکِ قواعد بک‌اند.
 *
 * منبع حقیقت نهایی «همیشه» سرور است (apps/authentication/normalizers.py)؛
 * این ماژول فقط دو کار می‌کند:
 *   ۱) بازخورد آنی به کاربر (بدون رفت‌وبرگشت شبکه) با همان منطق تشخیصِ
 *      بک‌اند تا خطای «نوع شناسه قابل تشخیص نیست» تقریباً هرگز از سرور
 *      برنگردد؛
 *   ۲) نمایش استاندارد شناسه (مثلاً ماسک‌کردن مقصد کد در متن راهنما).
 *
 * قواعد آینه‌شده از backend:
 *   - اگر «@» داشته باشد → ایمیل است (بک‌اند همین‌طور تشخیص می‌دهد)؛
 *   - اگر فقط رقم و + و جداکننده‌ها ( -() فاصله) داشته باشد → تلفن؛
 *   - نرمال‌سازی تلفنِ بک‌اند همه‌ی این شکل‌ها را می‌پذیرد:
 *       0912… / 912… / 98912… / +98912… / 0098912… / E.164 غیرایرانی
 *     پس فرانت همان ورودیِ trim‌شده را می‌فرستد و فقط «شکل» را می‌سنجد.
 */

export type IdentifierKind = 'email' | 'phone';

/** همان regex سبکِ بک‌اند (normalizers._EMAIL_PATTERN) */
const EMAIL_PATTERN = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

/** فقط رقم و جداکننده‌های رایج تلفن */
const PHONE_CHARS = /^[0-9+\-()\s]+$/;

const IRAN_LOCAL_PART = /^9\d{9}$/; // 9120000000 (بدون صفر/کد کشور)

/**
 * آینه‌ی دقیقِ normalize_phone بک‌اند — همان چهار حالت، همان ترتیب،
 * همان پیام‌ها؛ چون پیامِ کلاینت نباید با قضاوتِ نهایی سرور تضاد داشته
 * باشد. خروجی true یعنی «سرور هم قبول می‌کند».
 */
function isBackendAcceptablePhone(raw: string): { ok: true } | { ok: false; message: string } {
  const cleaned = raw.replace(/[\s\-()]+/g, '');
  if (cleaned.length < 10) return { ok: false, message: 'شماره موبایل بسیار کوتاه است.' };
  if (cleaned.length > 20) return { ok: false, message: 'شماره موبایل بیش از حد طولانی است.' };

  // 00 بین‌المللی → +
  const intl = cleaned.startsWith('00') ? `+${cleaned.slice(2)}` : cleaned;

  // حالت ۱: محلی ایران با ۰ — هر ۰ی دیگری رد می‌شود
  if (intl.startsWith('0')) {
    return IRAN_LOCAL_PART.test(intl.slice(1))
      ? { ok: true }
      : { ok: false, message: 'شماره موبایل ایرانی نامعتبر است.' };
  }
  // حالت ۲: محلی ایران بدون ۰
  if (IRAN_LOCAL_PART.test(intl)) return { ok: true };
  // حالت ۳: ⁎کد کشور بدون + (۱۱ تا ۱۵ رقم)
  if (/^\d{11,15}$/.test(intl)) return { ok: true };
  // حالت ۴: E.164 با +
  if (/^\+\d{10,15}$/.test(intl)) return { ok: true };

  return { ok: false, message: 'فرمت شماره موبایل نامعتبر است.' };
}

/** تبدیل ارقام فارسی/عربی به لاتین — بک‌اند فقط لاتین می‌فهمد. */
export function toLatinDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

/** ورودی کاربر → نوع شناسه (یا null اگر هنوز قابل تشخیص نیست). */
export function detectIdentifierKind(value: string): IdentifierKind | null {
  const v = toLatinDigits(value).trim();
  if (!v) return null;
  if (v.includes('@')) return 'email';
  if (PHONE_CHARS.test(v)) return 'phone';
  return null;
}

/**
 * شکل کلی شناسه را می‌سنجد (همان سطحِ اعتبارسنجیِ نرمالایزر بک‌اند، همان
 * متن پیام‌ها). خروجی: null یعنی معتبر؛ وگرنه پیام فارسی آماده‌ی نمایش.
 */
export function validateIdentifier(value: string): string | null {
  const v = toLatinDigits(value).trim();
  if (!v) return 'شناسه نمی‌تواند خالی باشد.';

  const kind = detectIdentifierKind(v);
  if (kind === 'email') {
    if (v.length > 254) return 'ایمیل بیش از حد طولانی است.';
    // normalize_email بک‌اند: دقیقاً یک @ + الگوی سبک
    if (v.split('@').length !== 2 || !EMAIL_PATTERN.test(v)) return 'فرمت ایمیل نامعتبر است.';
    return null;
  }
  if (kind === 'phone') {
    const verdict = isBackendAcceptablePhone(v);
    return verdict.ok ? null : verdict.message;
  }
  return 'نوع شناسه قابل تشخیص نیست. لطفاً ایمیل یا شماره موبایل معتبر وارد کنید.';
}

/**
 * مقدار نهایی برای ارسال به سرور: ارقام لاتین + trim.
 * بقیه‌ی نرمال‌سازی (E.164 و…) عمداً به بک‌اند سپرده می‌شود.
 */
export function prepareIdentifierForSubmit(value: string): string {
  return toLatinDigits(value).trim();
}

/**
 * نمایش خوانا از مقصد کد: موبایل‌های ایرانی را به شکل آشنا
 * (۰۹۱۲ ···) نشان می‌دهد؛ بقیه را دست‌نخورده برمی‌گرداند.
 */
export function formatIdentifierForDisplay(value: string): string {
  const v = toLatinDigits(value).trim();
  const cleaned = v.replace(/[\s\-()]+/g, '');
  const intl = cleaned.startsWith('00') ? `+${cleaned.slice(2)}` : cleaned;

  const IRAN_LOCAL = /^09\d{9}$/;

  let local: string | null = null;
  if (IRAN_LOCAL_PART.test(intl)) local = `0${intl}`;
  else if (intl.startsWith('+98') && IRAN_LOCAL_PART.test(intl.slice(3)))
    local = `0${intl.slice(3)}`;
  else if (/^98\d{10}$/.test(intl)) local = `0${intl.slice(2)}`;
  else if (IRAN_LOCAL.test(intl)) local = intl;

  if (!local) return v;
  return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
}
