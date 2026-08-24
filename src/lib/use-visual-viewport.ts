'use client';

/**
 * ═══════════════════════════════════════════════════════════════════
 * use-visual-viewport — چسبیدنِ لایه‌ی fixed به «ناحیه‌ی دیدنیِ واقعی»
 * در موبایل (رفع باگ «کیبورد پنجره را می‌پوشاند»)
 *
 * مسئله: وقتی کیبوردِ مجازی باز می‌شود، مرورگر فقط visual viewport را
 * کوچک می‌کند؛ عناصرِ position:fixed به layout viewport می‌چسبند و در
 * نتیجه زیر کیبورد پنهان می‌مانند (به‌ویژه iOS Safari که fixed را با
 * کیبورد جابه‌جا نمی‌کند).
 *
 * راه‌حلِ سه‌لایه (استاندارد صنعت — الگوی Vaul/شیت‌های بومی):
 *
 *   ۱) متاتگ `interactive-widget=resizes-content` (در layout.tsx) —
 *      Chrome/اندروید خودش ICB را با کیبورد resize می‌کند؛ بدون JS.
 *   ۲) همین هوک — Visual Viewport API: با هر resize/scrollِ ویوپورتِ
 *      بصری (باز/بسته‌شدنِ کیبورد، مخفی‌شدنِ آدرس‌بار)، متریک‌های
 *      {height, offsetTop} تحویل می‌دهد تا لایه دقیقاً روی ناحیه‌ی
 *      دیدنی بنشیند؛ یعنی لبه‌ی پایینِ شیت = لبه‌ی بالای کیبورد.
 *      در مسیرِ resizes-content، متریک‌ها با ICB یکی می‌شوند و استایل
 *      عملاً لااقُل تغییری نیست — پس دو مسیر ناسازگار نیستند.
 *   ۳) اسکرولِ فیلدِ فوکوس‌شده به‌نمای — در AuthModal (focusin).
 *
 * قرارداد: فقط وقتی enabled && درگاهِ موبایل فعال است متریک می‌دهد؛
 * در دسکتاپ، SSR یا مرورگرهای بدون API مقدار null برمی‌گردد تا لایه
 * از استایلِ پیش‌فرضِ CSS استفاده کند (رفتارِ امروز — هیچ رگرسیونی).
 * ═══════════════════════════════════════════════════════════════════
 */

import { useEffect, useState } from 'react';

export interface VisualViewportMetrics {
  /** ارتفاعِ ناحیه‌ی دیدنیِ واقعی (به‌جزِ کیبورد) */
  height: number;
  /** فاصله‌ی بالای ناحیه‌ی دیدنی از لبه‌ی layout viewport (اسکرولِ داخلیِ iOS) */
  offsetTop: number;
}

/** درگاهِ موبایل — باید با بریک‌پوینتِ `sm` تیل‌ویند هم‌راستا بماند */
export const MOBILE_VIEWPORT_QUERY = '(max-width: 639px)';

/**
 * استایلِ کانونیِ لایه‌ی fixed برای چسبیدن به ناحیه‌ی دیدنی.
 * تابعِ خالص: هسته‌ی تصمیمِ چیدمان، مستقل از React قابل‌تست است.
 *
 * نکته‌ی چیدمان: روی wrapperِ fixed با کلاسِ inset-0 اعمال می‌شود؛
 * با مشخص‌شدنِ top و height، مقدارِ bottom طبق استانداردِ CSS نادیده
 * گرفته می‌شود — نتیجه: کادرِ دقیقاً برابرِ ناحیه‌ی دیدنی.
 */
export function overlayStyleForViewport(metrics: VisualViewportMetrics): {
  top: string;
  height: string;
} {
  return {
    top: `${Math.max(0, metrics.offsetTop)}px`,
    height: `${Math.max(0, metrics.height)}px`,
  };
}

function readMetrics(vv: VisualViewport): VisualViewportMetrics {
  return { height: vv.height, offsetTop: vv.offsetTop };
}

/**
 * متریکِ زنده‌ی ویوپورتِ بصری.
 * @param enabled فعال‌بودنِ ردیابی (مثلاً تا وقتی مودال رندر است)
 * @returns متریک در موبایلِ فعال، وگرنه null
 */
export function useVisualViewportMetrics(enabled: boolean): VisualViewportMetrics | null {
  const [metrics, setMetrics] = useState<VisualViewportMetrics | null>(null);

  useEffect(() => {
    setMetrics(null);
    if (!enabled) return undefined;
    const viewport =
      typeof window === 'undefined' || typeof window.visualViewport !== 'object'
        ? null
        : window.visualViewport;
    if (!viewport) return undefined;

    const mql = window.matchMedia(MOBILE_VIEWPORT_QUERY);
    const update = () => {
      setMetrics(mql.matches ? readMetrics(viewport) : null);
    };

    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    if (typeof mql.addEventListener === 'function') mql.addEventListener('change', update);
    window.addEventListener('resize', update);

    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
      if (typeof mql.removeEventListener === 'function') mql.removeEventListener('change', update);
      window.removeEventListener('resize', update);
    };
  }, [enabled]);

  return metrics;
}
