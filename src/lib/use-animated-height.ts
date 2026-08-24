'use client';

/**
 * ═══════════════════════════════════════════════════════════════════
 * use-animated-height — مورفِ نرمِ ارتفاع برای محتوای متغیر
 * (رفعِ «جابه‌جایی انفجاری» بین نماهای مودال)
 *
 * الهام: پنل‌های Stripe/Clerk/iOS — وقتی محتوا عوض می‌شود (تبِ ورود↔
 * ثبت‌نام، روشِ رمز↔کد، مرحله‌ی شناسه↔کد)، ارتفاعِ بدنه با یک
 * ترنزیشنِ نرم به مقدارِ جدید می‌رسد؛ چشم «جهش» نمی‌بیند، «مورف» می‌بیند.
 *
 * قرارداد:
 *   • اندازه‌گیری با ResizeObserver روی بسته‌ی داخلیِ محتواست؛ پس رشدِ
 *     در‌حین‌تایپ (خطاها، نکته‌ها) هم همراهی می‌شود — نه فقط سوییچِ نما.
 *   • انتقال فقط پس از «مسلح‌شدن» (پایانِ انیمیشنِ ورودِ خود پنل) فعال
 *     می‌شود تا ارتفاعِ اولیه از صفر انیمیت نشود و با ورودِ پنل نجنگد.
 *   • در محیط‌های بدون موتورِ چیدمان/ResizeObserver ارتفاعی تحمیل
 *     نمی‌شود (`undefined`) — رندر بدونِ همین لایه‌ی نرم دقیقاً مثل
 *     رفتارِ پیشین است: graceful degradation، نه الزام.
 * ═══════════════════════════════════════════════════════════════════
 */

import { useEffect, useRef, useState } from 'react';

export interface AnimatedHeight {
  /** به بسته‌ی داخلیِ محتوا وصل می‌شود (کاری که اندازه می‌گیریم) */
  contentRef: React.RefObject<HTMLDivElement | null>;
  /** استایلِ کانتینرِ بیرونی — فقط وقتی اندازه‌ی معتبری داریم */
  style: { height: string } | undefined;
  /** آیا ترنزیشنِ ارتفاع مسلح است؟ (پس از ورودِ پنل) */
  armed: boolean;
}

export function useAnimatedHeight(
  /** ناحیه فعال است؟ (مثلاً مودال رندر است) */
  active: boolean,
  /** تأخیرِ مسلح‌شدنِ ترنزیشن — ≥ مدتِ انیمیشنِ ورودِ لایه */
  armAfterMs = 320,
): AnimatedHeight {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState<number | null>(null);
  const [armed, setArmed] = useState(false);

  // اندازه‌گیریِ زنده‌ی محتوا
  useEffect(() => {
    if (!active) return undefined;
    const el = contentRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const measure = () => {
      const next = el.offsetHeight;
      if (next > 0) setHeight((prev) => (prev === next ? prev : next));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [active]);

  // مسلح‌شدنِ ترنزیشن پس از پایانِ انیمیشنِ ورود
  useEffect(() => {
    if (!active) {
      setArmed(false);
      return undefined;
    }
    const timer = window.setTimeout(() => setArmed(true), armAfterMs);
    return () => window.clearTimeout(timer);
  }, [active, armAfterMs]);

  return {
    contentRef,
    style: height === null ? undefined : { height: `${height}px` },
    armed: armed && height !== null,
  };
}
