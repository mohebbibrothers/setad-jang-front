'use client';

/**
 * ═══════════════════════════════════════════════════════════════════
 * Segmented — کنترلِ سگمنت‌شده با کپسولِ لغزانِ «اندازه‌گیری‌شده»
 *
 * چرا از نو؟ نسخه‌ی قبلی (.auth-pill-indicator) هندسه را با اعدادِ
 * جادویی حدس می‌زد — width: calc(50% − 6px)، translateX(−100% − 4px) —
 * و با منحنیِ اورشوت (cubic-bezier(0.34,1.3,…)) حرکت می‌کرد. نتیجه:
 * کپسول هنگامِ سوییچ تا ~۱۵٪ از سلولِ مقصد بیرون می‌زد و چون ترک
 * overflow نبود، روی پس‌زمینه‌ای بیرون از ترک نقاشی می‌شد؛ ضمن‌اینکه هر
 * انحرافِ زیرپیکسلی/زوم/فونت، هندسه‌ی حدسی را می‌شکست. (همان «کپسولِ
 * بدشکل/مستطیل/خراب»).
 *
 * قراردادِ ریشه‌ایِ این نسخه:
 *
 *   ۱) هندسه حدس زده نمی‌شود؛ اندازه گرفته می‌شود. کپسول دقیقاً آینه‌ی
 *      جعبه‌ی دکمه‌ی فعال است (offsetLeft/Top/Width/Height) — برای هر
 *      تعداد گزینه، هر گپ/پدینگ، هر زوم و هر فونت صادق است.
 *
 *   ۲) حرکت فقط با transform (translate3d فیزیکی — ذاتاً بی‌تفاوت به
 *      RTL/LTR) روی کامپوزیتور؛ هیچ reflow/اندازه‌ای در تایپ یا تیکِ
 *      تایمر رخ نمی‌دهد (اندازه فقط هنگام تغییر مقدار/ریسایز/لودِ فونت).
 *
 *   ۳) ترک overflow-hidden با گوشه‌های هم‌مرکز است (۱۲px بیرون، ۴px
 *      فاصله، ۸px کپسول)؛ حتی بدترین اورشوتِ فرضی هم هرگز بیرون از ترک
 *      نقاشی نمی‌شود — خرابیِ بصری از نظر ساختاری ناممکن است.
 *
 *   ۴) نخستین اندازه‌گیری در useLayoutEffect و پیش از پینت انجام و بدون
 *      ترنزیشن اعمال می‌شود (هیچ لغزشِ فلش‌مانندی هنگام مونت نیست)؛
 *      ترنزیشن فقط بعد از آن مسلح می‌گردد. منحنی: ۰٫۲/۰٫۸، بدون
 *      اورشوت — نشستِ نرمِ حرفه‌ای (الگوی Material emphasized).
 * ═══════════════════════════════════════════════════════════════════
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
  /** id دکمه — برای اتصال aria-labelledby پنل‌ها */
  id?: string;
  /** aria-controls دکمه — پنلِ متصل */
  controls?: string;
}

export interface SegmentedProps<T extends string> {
  value: T;
  options: readonly SegmentedOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
  /** testid کپسول — قراردادِ تست */
  indicatorTestId?: string;
  className?: string;
  /** کلاس‌های ظاهریِ دکمه — پایه + واریانتِ فعال/غیرفعال از مصرف‌کننده */
  buttonClassName?: string;
  activeButtonClassName?: string;
  inactiveButtonClassName?: string;
}

interface IndicatorBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  indicatorTestId,
  className,
  buttonClassName,
  activeButtonClassName,
  inactiveButtonClassName,
}: SegmentedProps<T>) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [box, setBox] = useState<IndicatorBox | null>(null);
  // تا نخستین جعبه‌ی واقعی مسلح نشده، لغزش ممنوع است (بدون فلشِ مونت)
  const [armed, setArmed] = useState(false);
  const frame = useRef<number | null>(null);

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const activeBtn = track.querySelector<HTMLElement>('[data-active="true"]');
    if (!activeBtn) return;
    // offset* فیزیکی و نسبت به ترک (offsetParent) است — هیچ حدسی در کار نیست
    const next: IndicatorBox = {
      x: activeBtn.offsetLeft,
      y: activeBtn.offsetTop,
      w: activeBtn.offsetWidth,
      h: activeBtn.offsetHeight,
    };
    setBox((prev) =>
      prev && prev.x === next.x && prev.y === next.y && prev.w === next.w && prev.h === next.h
        ? prev
        : next,
    );
  }, []);

  const scheduleMeasure = useCallback(() => {
    if (frame.current !== null) window.cancelAnimationFrame(frame.current);
    frame.current = window.requestAnimationFrame(() => {
      frame.current = null;
      measure();
    });
  }, [measure]);

  // ۱) تغییر مقدار — پیش از پینت آینه شود (هیچ فریمی در جای قدیم دیده نمی‌شود)
  useLayoutEffect(() => {
    measure();
  }, [value, measure]);

  // ۲) تغییر اندازه‌ی ترک (ریسایز/چرخش/زوم) — دسته‌بندی‌شده با rAF
  useEffect(() => {
    const track = trackRef.current;
    if (!track || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(scheduleMeasure);
    observer.observe(track);
    return () => observer.disconnect();
  }, [scheduleMeasure]);

  // ۳) لودِ فونت — متریکسِ متنِ دکمه‌ها را دوباره بسنج (یک‌بار)
  useEffect(() => {
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    let alive = true;
    fonts?.ready
      ?.then(() => {
        if (alive) scheduleMeasure();
      })
      ?.catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [scheduleMeasure]);

  // مسلح‌کردنِ ترنزیشن یک فریم پس از نخستین جعبه — بدون لغزشِ هنگامِ مونت
  useEffect(() => {
    if (box === null || armed) return;
    const f = window.requestAnimationFrame(() => setArmed(true));
    return () => window.cancelAnimationFrame(f);
  }, [box, armed]);

  useEffect(
    () => () => {
      if (frame.current !== null) window.cancelAnimationFrame(frame.current);
    },
    [],
  );

  return (
    <div
      ref={trackRef}
      role="tablist"
      aria-label={ariaLabel}
      className={cn('relative grid gap-1 overflow-hidden rounded-xl bg-ink-50 p-1', className)}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      <span
        aria-hidden="true"
        data-testid={indicatorTestId}
        data-active={value}
        data-instant={!armed}
        className="auth-seg-indicator"
        style={
          box
            ? {
                transform: `translate3d(${box.x}px, ${box.y}px, 0)`,
                width: `${box.w}px`,
                height: `${box.h}px`,
              }
            : undefined
        }
      />
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            id={opt.id}
            aria-controls={opt.controls}
            aria-selected={active}
            data-active={active || undefined}
            onClick={() => onChange(opt.value)}
            className={cn(
              'relative',
              buttonClassName,
              active ? activeButtonClassName : inactiveButtonClassName,
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
