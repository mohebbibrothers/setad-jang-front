'use client';

/**
 * ═══════════════════════════════════════════════════════════════════
 * scroll-lock — قفلِ اسکرولِ بدنه با شمارش‌مرجع (refcount) و مالکیتِ
 * متمرکز. مالک یگانه‌ی body.style در سراسر اپ.
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
 *
 * چرا position:fixed (iOS-Safe)؟ نسخه‌ی اول فقط overflow=hidden
 * می‌گذاشت؛ اما Safariِ iOS (و تا حدی Chromeِ اندروید با scroll-chaining)
 * اسکرولِ لمسیِ بدنه را با overflow=hidden متوقف نمی‌کند — باگِ معروفِ
 * «scroll bleed»: با باز‌بودنِ شیتِ موبایل، ژستِ کاربر صفحه‌ی پشتِ
 * لایه را حرکت می‌داد و رنگ‌آمیزیِ هم‌زمانِ هدرِ چسبان + اوورلی در هر
 * فریم، لگِ محسوس می‌ساخت (گزارشِ کارفرما). تکنیکِ قطعی و استاندارد:
 *
 *   ۱) scrollYِ فعلی ذخیره می‌شود؛
 *   ۲) بدنه position:fixed با top:−scrollY می‌شود (تصویرِ بصری ثابت
 *      می‌ماند ولی اسکرول از نظر ساختاری ناممکن است)؛
 *   ۳) هنگامِ آزادسازی، استایل‌ها برمی‌گردند و window.scrollTo(0, y)
 *      موقعیت را دقیقاً همان‌جا برمی‌گرداند. چون globals.css روی html
 *      اسکرولِ نرم (smooth) دارد، حینِ بازیابی scroll-behavior موقتاً
 *      auto می‌شود تا بازگشت «فوری» باشد، نه انیمیشنی.
 *
 * این تکنیک فقط روی مرزِ اولین‌lock/آخرین‌release اعمال می‌شود تا
 * قفل‌های تودرتو (شیت ← مودال) scrollY را دوره نیندازند.
 * ═══════════════════════════════════════════════════════════════════
 */

let lockCount = 0;

interface SavedBodyStyles {
  overflow: string;
  paddingRight: string;
  position: string;
  top: string;
  left: string;
  right: string;
  width: string;
}

let saved: SavedBodyStyles | null = null;
let savedScrollY = 0;

export function lockBodyScroll(): () => void {
  if (typeof document === 'undefined') return () => {};

  if (lockCount === 0) {
    const body = document.body;
    saved = {
      overflow: body.style.overflow,
      paddingRight: body.style.paddingRight,
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
    };
    savedScrollY = window.scrollY;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;

    // iOS-Safe: تنها راهِ قطعیِ توقفِ اسکرولِ لمسی در Safariِ موبایل.
    body.style.position = 'fixed';
    body.style.top = `-${savedScrollY}px`;
    body.style.left = '0px';
    body.style.right = '0px';
    body.style.width = '100%';
  }
  lockCount += 1;

  let released = false;
  return () => {
    if (released) return;
    released = true;
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount === 0 && saved) {
      const body = document.body;
      const y = savedScrollY;

      body.style.overflow = saved.overflow;
      body.style.paddingRight = saved.paddingRight;
      body.style.position = saved.position;
      body.style.top = saved.top;
      body.style.left = saved.left;
      body.style.right = saved.right;
      body.style.width = saved.width;
      saved = null;

      // globals.css روی html اسکرولِ نرم دارد؛ بازگشت به موقعیتِ قبلی
      // باید فوری باشد وگرنه کاربر یک پرشِ انیمیشنیِ ناخواسته می‌بیند.
      const html = document.documentElement;
      const prevBehavior = html.style.scrollBehavior;
      html.style.scrollBehavior = 'auto';
      window.scrollTo(0, y);
      html.style.scrollBehavior = prevBehavior;
    }
  };
}
