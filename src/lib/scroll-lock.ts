'use client';

/**
 * ═══════════════════════════════════════════════════════════════════
 * scroll-lock — قفلِ اسکرولِ بدنه با شمارش‌مرجع (refcount) و مالکیتِ
 * متمرکز. مالک یگانه‌ی body.style.overflow/paddingRight در سراسر اپ.
 *
 * چرا؟ چند لایه‌ی مستقل (مودال احراز هویت، شیتِ موبایلِ هدر، …) روی
 * body.style.overflow مستقیم می‌نشستند و کارِ هم را خالی می‌کردند؛
 * یک جفتِ نامتوازن (lock بدون release یا releaseِ زودهنگام) کافی بود تا
 * یا صفحه برای همیشه قفل بماند یا مودالِ باز روی صفحه‌ای اسکرول‌شونده
 * بنشیند. این ماژول آن کلاسِ باگ را ساختاری غیرممکن می‌کند:
 *
 *   • هر lock یک release برمی‌گرداند — شبیه درِ توالتِ عمومی:
 *     آخرین نفری که بیرون می‌رود چراغ را خاموش می‌کند.
 *   • release idempotent است؛ دو بار صدا زدن، آسیبی نمی‌زند.
 *   • قفل‌های تودرتو/هم‌زمان همدیگر را نمی‌شکنند: فقط اولین lock
 *     استایل می‌گذارد و فقط آخرین release برمی‌گرداند.
 *   • استایل‌های قبلیِ بدنه دقیقاً همان‌طور که بودند برمی‌گردند
 *     (نه «ریستِ خشک» به '') تا قفلِ بیرونیِ احتمالی حفظ شود.
 *   • پهنای اسکرول‌بار جبران می‌شود تا چیدمان موقع قفل نپرد.
 * ═══════════════════════════════════════════════════════════════════
 */

let lockCount = 0;
let savedOverflow: string | null = null;
let savedPaddingRight: string | null = null;

export function lockBodyScroll(): () => void {
  if (typeof document === 'undefined') return () => {};

  if (lockCount === 0) {
    savedOverflow = document.body.style.overflow;
    savedPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
  }
  lockCount += 1;

  let released = false;
  return () => {
    if (released) return;
    released = true;
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount === 0) {
      document.body.style.overflow = savedOverflow ?? '';
      document.body.style.paddingRight = savedPaddingRight ?? '';
      savedOverflow = null;
      savedPaddingRight = null;
    }
  };
}
