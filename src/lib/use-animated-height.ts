'use client';

/**
 * ═══════════════════════════════════════════════════════════════════
 * use-animated-height — مورفِ نرمِ ارتفاع (v2: اندازه → انیمیت → آزاد)
 *
 * چرا v2؟ در نسخه‌ی اول مقدارِ pxِ اندازه‌گیری‌شده «برای همیشه» روی
 * کانتینر می‌نشست؛ هر خطای گردکردنِ زیرپیکسلی یا کوچک‌ترین اختلافِ
 * بعدی، کانتینر را ~۱px اورفلو می‌کرد و چون overflow-y:auto است،
 * اسکرول‌بار حتی با محتوای جاشده هم همیشه دیده می‌شد (باگِ گزارش‌شده‌ی
 * «اسکرول‌بارِ پیش‌فرض کنار پنجره»).
 *
 * قراردادِ v2 — الگوی استانداردِ صنعت (FLIP سبک Stripe/Headless):
 *
 *   سکون → ارتفاع auto. هیچ مقدارِ تحمیلی نیست؛ پس اسکرول‌بار دقیقاً
 *   و دقیقاً فقط با اورفلوِ واقعی ظاهر می‌شود.
 *
 *   تغییر محتوا (سوییچِ نما/روش/مرحله، خطای جدید، …) →
 *   ۱) ارتفاعِ فعلی به px فریز می‌شود؛ ۲) فریمِ بعد، ارتفاعِ هدف با
 *   ترنزیشن اعمال می‌شود؛ ۳) پس از پایان، ارتفاع به auto آزاد
 *   می‌گردد. تغییرِ میانِ انیمیشن؟ فقط هدف عوض می‌شود — ترنزیشن از
 *   مقدارِ جاریِ محاسبه‌شده نرم ادامه پیدا می‌کند (رفتارِ بومیِ CSS).
 *
 *   v3 — ضد «فلشِ اسکرول‌بارِ حین مورف»: در کلِ پنجره‌ی انیمیشن
 *   پرچمِ isAnimating برمی‌خیزد تا مصرف‌کننده کانتینر را از
 *   overflow-auto به overflow-hidden (کلیپ) سوییچ کند؛ چون ارتفاعِ
 *   میانیِ ترنزیشن از محتوای مقصد کوچک‌تر است و auto ناگزیر اسکرول‌بار
 *   را فلش می‌زد (همان «کرسر می‌پره و صفحه بالا می‌آید»).
 *   • اندازه‌گیری با getBoundingClientRect (زیرپیکسل — ضدِ اورفلوِ
 *     فانتومیِ یک‌پیکسلی) و با اپسیلون ۰٫۵px برای جلوگیری از لرزش؛
 *   • مسلح‌شدن با تأخیر تا با انیمیشنِ ورودِ خودِ پنل نجنگد؛
 *   • ریستِ کاملِ state با غیرفعال‌شدن (هیچ باقی‌مانده‌ای برای بازشدنِ
 *     بعدیِ مودال نمی‌ماند)؛
 *   • بدون موتورِ چیدمان/ResizeObserver → کاملاً خنثی (auto همیشه).
 * ═══════════════════════════════════════════════════════════════════
 */

import { useEffect, useRef, useState } from 'react';

/** تلورانسِ چشم‌نادیدنی — جلوگیری از انیمیشن برای نویزهای زیرپیکسلی */
const HEIGHT_EPSILON_PX = 0.5;
/** زمانِ نگه‌داشتنِ ارتفاعِ px پس از آخرین تغییر — اندکی بیش از مدتِ
 *  ترنزیشن (۲۸۰ms) تا آزادسازی هرگز وسطِ حرکت نباشد */
const RELEASE_AFTER_MS = 320;

export interface AnimatedHeight {
  /** به بسته‌ی داخلیِ محتوا وصل می‌شود (کاری که اندازه می‌گیریم) */
  contentRef: React.RefObject<HTMLDivElement | null>;
  /** استایلِ کانتینر: فقط حینِ انیمیشن px؛ در سکون undefined (auto) */
  style: { height: string } | undefined;
  /** آیا ترنزیشن مسلح است؟ (پس از پایانِ انیمیشنِ ورودِ لایه) */
  armed: boolean;
  /** آیا در پنجره‌ی مورفیم؟ (فریز→هدف→آزاد) — مصرف‌کننده در این بازه
   *  کانتینر را کلیپ (overflow-hidden) می‌کند تا اسکرول‌بار فلش نزند */
  isAnimating: boolean;
}

export function useAnimatedHeight(
  /** ناحیه فعال است؟ (مثلاً مودال رندر است) */
  active: boolean,
  /** تأخیرِ مسلح‌شدنِ ترنزیشن — ≥ مدتِ انیمیشنِ ورودِ لایه */
  armAfterMs = 320,
): AnimatedHeight {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [styleHeight, setStyleHeight] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [armed, setArmed] = useState(false);
  // آینه‌ی refِ مسلح‌بودن — اندازه‌گیر (که یک‌بار subscribe می‌شود)
  // تصمیمِ «مورف یا نه» را همیشه با جدیدترین وضعیت می‌گیرد
  const armedRef = useRef(false);
  const lastMeasured = useRef(0);
  const releaseTimer = useRef<number | null>(null);
  const frame = useRef<number | null>(null);

  const scheduleRelease = () => {
    if (releaseTimer.current !== null) window.clearTimeout(releaseTimer.current);
    releaseTimer.current = window.setTimeout(() => {
      releaseTimer.current = null;
      // آزادسازی: بازگشت به auto + پایانِ پنجره‌ی کلیپ — در یک کامیت تا
      // هیچ فریمی اسکرول‌بارِ فانتومی رخ ندهد
      setStyleHeight(null);
      setIsAnimating(false);
    }, RELEASE_AFTER_MS);
  };

  // مسلح/خلع‌سلاح‌کردنِ ترنزیشن + ریستِ کاملِ state با غیرفعال‌شدن
  useEffect(() => {
    if (!active) {
      armedRef.current = false;
      setArmed(false);
      // ریست: هیچ باقی‌مانده‌ی px/کلیپ برای بازشدنِ بعدی نمی‌ماند
      setStyleHeight(null);
      setIsAnimating(false);
      lastMeasured.current = 0;
      return undefined;
    }
    const timer = window.setTimeout(() => {
      armedRef.current = true;
      setArmed(true);
    }, armAfterMs);
    return () => {
      window.clearTimeout(timer);
      if (releaseTimer.current !== null) window.clearTimeout(releaseTimer.current);
      if (frame.current !== null) window.cancelAnimationFrame(frame.current);
      releaseTimer.current = null;
      frame.current = null;
    };
  }, [active, armAfterMs]);

  // ردیابیِ زنده‌ی ارتفاعِ محتوا
  useEffect(() => {
    if (!active) return undefined;
    const el = contentRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;

    const measure = () => {
      const target = el.getBoundingClientRect().height;
      if (target <= 0) return; // محیطِ بدون موتورِ چیدمان — دست نمی‌زنیم
      if (Math.abs(target - lastMeasured.current) < HEIGHT_EPSILON_PX) return;

      // پایه‌گذاریِ اولیه یا پیش از مسلح‌شدن: فقط مرجع به‌روز می‌شود —
      // پنل خودش با CSS وارد می‌شود و مورفِ ارتفاع نباید با آن تصادم کند.
      if (lastMeasured.current <= 0 || !armedRef.current) {
        lastMeasured.current = target;
        return;
      }

      // مورف: فریزِ مقدارِ قبلی → هدفِ جدید در فریمِ بعد → آزادسازی
      const baseline = lastMeasured.current;
      lastMeasured.current = target;
      setStyleHeight((current) => current ?? baseline);
      setIsAnimating(true); // کلیپ در کلِ پنجره‌ی انیمیشن
      if (frame.current !== null) window.cancelAnimationFrame(frame.current);
      frame.current = window.requestAnimationFrame(() => {
        frame.current = null;
        setStyleHeight(target);
      });
      scheduleRelease();
    };

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [active]);

  return {
    contentRef,
    style: styleHeight === null ? undefined : { height: `${styleHeight}px` },
    armed,
    isAnimating,
  };
}
