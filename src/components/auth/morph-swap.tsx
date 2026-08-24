'use client';

/**
 * ═══════════════════════════════════════════════════════════════════
 * MorphSwap — هدایت‌گرِ یگانه‌ی موشنِ بدنه‌ی مودال (v8، ریشه‌کنیِ لگ)
 *
 * چرا از نو؟ تا پیش از این سه سامانه‌ی مستقل روی یک ناحیه سوار بودند —
 * کراس‌فید (تایمرِ ۱۷۰ms)، مورفِ ارتفاع (ResizeObserver + فریز/هدف/آزاد
 * با ۲۸۰/۳۲۰ms) و keyframes ورود — هرکدام با ساعتِ خودشان. پیامدها
 * دقیقاً همان چیزهایی بود که گزارش شد:
 *
 *   • «همه‌ی اجزا لحظه‌ی اول بالا نمی‌آید؛ چند لحظه بعد بقیه می‌آیند و
 *     صفحه بازتر می‌شود» → محتوا هنگام بازشدن با keyframes مجزا از صفر
 *     محو/سُر می‌خورد (دو ضرب‌المثلِ ورود: پنل + محتوا).
 *   • «ترنزیشن‌ها انفجاری و لگ‌دارند» → در هر سوییچ DOM دو برابر
 *     می‌شد، یک چیدمانِ هم‌گامِ اجباری خوانده می‌شد و سه انیمیشنِ
 *     ناهم‌زمان (خروج ۱۴۰، ورود ۱۸۰، ارتفاع ۲۸۰) با هم می‌جنگیدند.
 *
 * معماریِ جایگزین — یک هدایت‌گر، یک ساعت:
 *
 *   سکون: جعبه height:auto و overflow:visible است؛ نه کلاسِ انیمیشنی،
 *   نه will-change، نه کارِ اضافه — هزینه‌ی هر فریم صفر.
 *
 *   سوییچ (کلید عوض شد): همه‌چیز در useLayoutEffect و پیش از پینت
 *   قفل می‌شود — ۱) ارتفاعِ جعبه به مقدارِ فعلی فریز؛ ۲) نسخه‌ی قدیمی
 *   به‌صورت لایه‌ی absoluteِ غیرتعاملی (inert + aria-hidden) کنار
 *   نسخه‌ی جدید مونت؛ ۳) در فریمِ بعد ارتفاع به هدفِ اندازه‌گیری‌شده
 *   ترنزیشن می‌خورد، هم‌زمان با keyframes خروج/ورود که هر سه از یک
 *   متغیرِ مدت (--morph-ms) تغذیه می‌شوند؛ ۴) پاک‌سازی فقط با تایمرِ
 *   تضمین‌شده (الگوی usePresence): لایه‌ی قدیمی حذف، ارتفاع به auto
 *   آزاد، کلاس‌ها جارو — همه در یک کامیت.
 *
 *   بازشدنِ مودال: نخستین مونت کاملاً ایستا رندر می‌شود — محتوا از
 *   فریمِ اول به‌صورت کامل حاضر است و فقط کرومِ پنل انیمیت می‌شود؛
 *   هیچ «ظاهرشدنِ تدریجی» یا «بازترشدنِ دیررس» وجود ندارد. پنجره‌ی
 *   کوتاهِ مسلح‌نشدن هم مانع جنگِ مورف با انیمیشنِ ورودِ پنل می‌شود.
 *
 *   تغییرِ ارتفاعِ بدون سوییچ (پیام خطا، لودِ فونت): مسیرِ مورفِ
 *   صرفِ ارتفاع از همان ساعت استفاده می‌کند — یک ضربِ تمیز، نه پاپ.
 *
 *   وقفه وسطِ سوییچ (کلیکِ سرراست پشت سر هم): لایه‌ی کهنه بلافاصله
 *   کنار گذاشته می‌شود، نقطه‌ی شروع از چیدمانِ جاریِ در‌حال‌حرکت
 *   خوانده می‌شود و حرکت نرم ادامه می‌یابد — هیچ روزنه‌ی DOM زامبی.
 * ═══════════════════════════════════════════════════════════════════
 */

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** مدتِ یک پاس — منبعِ حقیقت؛ CSS از طریق --morph-ms همان را می‌خواند */
export const MORPH_SWAP_MS = 220;
/** تلورانسِ نویزِ زیرپیکسلی */
const HEIGHT_EPSILON_PX = 0.5;
/** سکوتِ موشن بلافاصله پس از مونت — تا با انیمیشنِ ورودِ خود پنل نجنگد */
const ARM_AFTER_MS = 260;
/** حاشیه‌ی امنِ تایمرِ پاک‌سازی نسبت به پایانِ انیمیشن */
const CLEANUP_SLACK_MS = 40;

type Phase = 'rest' | 'swap' | 'grow';

export function MorphSwap({
  swapKey,
  children,
  boxClassName,
  contentClassName,
  boxTestId,
}: {
  /** هر تغییر کلید = یک پاسِ کراس‌فید + مورفِ هم‌زمان */
  swapKey: string;
  children: ReactNode;
  /** کلاسِ جعبه‌ی بیرونی (ناحیه‌ی مورف) */
  boxClassName?: string;
  /** کلاسِ بسته‌ی داخلیِ اندازه‌گیری */
  contentClassName?: string;
  /** testid جعبه — قراردادِ تست */
  boxTestId?: string;
}) {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const committed = useRef(children);
  const prevKey = useRef(swapKey);
  const lastHeight = useRef(0);
  const armedAfter = useRef(0);
  const timers = useRef<number[]>([]);
  const frame = useRef<number | null>(null);

  const [outgoing, setOutgoing] = useState<ReactNode | null>(null);
  const [phase, setPhase] = useState<Phase>('rest');
  const [pxHeight, setPxHeight] = useState<number | null>(null);
  // آینه‌ی refِ فاز — شنونده‌های async (RO) همیشه جدیدترین را می‌بینند
  const phaseRef = useRef<Phase>('rest');
  phaseRef.current = phase;

  const clearScheduled = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    if (frame.current !== null) {
      window.cancelAnimationFrame(frame.current);
      frame.current = null;
    }
  };

  const measureContent = () => {
    const el = contentRef.current;
    if (!el || typeof el.getBoundingClientRect !== 'function') return 0;
    return el.getBoundingClientRect().height;
  };

  /** آزادسازیِ تضمین‌شده: لایه‌ی قدیمی + قفلِ ارتفاع + کلاس‌ها — در یک کامیت */
  const scheduleCleanup = () => {
    timers.current.push(
      window.setTimeout(() => {
        setOutgoing(null);
        setPhase('rest');
        setPxHeight(null);
      }, MORPH_SWAP_MS + CLEANUP_SLACK_MS),
    );
  };

  // ── مسیرِ سوییچ (تغییر کلید) — همه‌چیز پیش از پینت ────────────────
  useLayoutEffect(() => {
    if (prevKey.current === swapKey) {
      committed.current = children;
      return;
    }
    const oldNode = committed.current;
    prevKey.current = swapKey;
    committed.current = children;

    clearScheduled();

    // نقطه‌ی شروع: میانه‌ی انیمیشنِ قبلی → چیدمانِ جاریِ جعبه؛
    // سکون → آخرین ارتفاعِ ردیابی‌شده (RO مرجع را تازه نگه می‌دارد؛
    // جعبه با height:auto پیش از این کامیت هم‌اکنون هدف را نشان می‌دهد)
    const box = boxRef.current;
    const liveRect =
      box && typeof box.getBoundingClientRect === 'function'
        ? box.getBoundingClientRect().height
        : 0;
    const from = phaseRef.current !== 'rest' && liveRect > 0 ? liveRect : lastHeight.current;
    // هدف: محتوای جدید همین حالا در DOM است (پیش از پینت) — مستقیم بسنج
    const target = measureContent();
    if (target > 0) lastHeight.current = target;

    setOutgoing(oldNode);
    setPhase('swap');
    setPxHeight(
      from > 0 && target > 0 && Math.abs(target - from) >= HEIGHT_EPSILON_PX ? from : null,
    );

    frame.current = window.requestAnimationFrame(() => {
      frame.current = null;
      if (target > 0) {
        setPxHeight((current) => (current === null ? null : target));
      }
    });
    scheduleCleanup();
  }, [swapKey, children]);

  // ── مسیرِ رشدِ بدون سوییچ (پیام خطا/فونت/…) — مورفِ صرفِ ارتفاع ────
  useEffect(() => {
    const el = contentRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    if (armedAfter.current === 0) armedAfter.current = Date.now() + ARM_AFTER_MS;

    const observer = new ResizeObserver(() => {
      const target = measureContent();
      if (target <= 0) return; // محیطِ بدون موتورِ چیدمان (تست) → ساکت
      if (phaseRef.current !== 'rest') {
        lastHeight.current = target;
        return;
      }
      const last = lastHeight.current;
      lastHeight.current = target;
      if (last <= 0 || Math.abs(target - last) < HEIGHT_EPSILON_PX) return;
      if (Date.now() < armedAfter.current) return; // مونتِ نخست — بدون مورف

      clearScheduled();
      setPhase('grow');
      setPxHeight(last);
      frame.current = window.requestAnimationFrame(() => {
        frame.current = null;
        setPxHeight(target);
      });
      scheduleCleanup();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // پاک‌سازیِ مطلق هنگامِ آن‌مونت — هیچ تایمر/فریمی زنده نمی‌ماند
  useEffect(
    () => () => {
      clearScheduled();
    },
    [],
  );

  return (
    <div
      ref={boxRef}
      data-testid={boxTestId}
      data-phase={phase}
      className={cn('morph-swap', boxClassName)}
      style={pxHeight === null ? undefined : { height: `${pxHeight}px` }}
    >
      {phase === 'swap' && outgoing !== null ? (
        <div
          aria-hidden="true"
          inert
          className="morph-swap-out pointer-events-none absolute inset-x-0 top-0"
        >
          {outgoing}
        </div>
      ) : null}
      <div
        ref={contentRef}
        className={cn('flex flex-col', phase === 'swap' && 'morph-swap-in', contentClassName)}
      >
        {children}
      </div>
    </div>
  );
}
