'use client';

/**
 * ═══════════════════════════════════════════════════════════════════
 * SwapTransition — کراس‌فیدِ تمیزِ تعویض محتوا (ضدِ «ترنزیشنِ انفجاری»)
 *
 * مسئله: با تعویض کلید (تب، روشِ ورود، مرحله‌ی فلو)، محتوای قدیمی در
 * یک فریم نابود و محتوای جدید با fade طولانی از صفر وارد می‌شد —
 * چند فریمِ نیم‌خالی + پاپِ ناگهانی = حسِ «انفجار».
 *
 * الگوی استاندارد صنعت (Linear / Clerk / iOS):
 *
 *   نسخه‌ی قبلی ~۱۶۰ms بیشتر زنده می‌ماند — absolute، غیرتعاملی
 *   (inert + aria-hidden + pointer-events-none) و با fade/outِ کوتاه
 *   ۱۴۰ms محو می‌شود؛ هم‌زمان نسخه‌ی جدید با fade/liftِ ۱۸۰ms وارد
 *   می‌شود. هیچ‌وقت صفحه‌ی خالی، هیچ‌وقت پاپ — فقط عبورِ ابریشمی.
 *
 * قواعد سفت:
 *   • ارتفاعِ چیدمان = فقط نسخه‌ی جدید (خروجی absolute است) → اندازه‌ی
 *     ناحیه‌ی مورف (useAnimatedHeight) همیشه درست است.
 *   • خروجی فقط بصری است: inert + aria-hidden + pointer-events-none —
 *     نه فوکوس، نه کلیک، نه خوانشِ اسکرین‌ریدر، نه کوئریِ تست.
 *   • حذفِ خروجی فقط با تایمر (تضمین‌شده) — الگوی usePresence؛ هیچ
 *     آویزانی به رویدادِ انیمیشن نیست.
 *   • به‌روزرسانیِ محتوا بدون تغییر کلید = بدون تعویض (تایپ کردن فلش
 *     نمی‌زند).
 * ═══════════════════════════════════════════════════════════════════
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** عمرِ لایه‌ی خروجی — اندکی بیش از مدتِ انیمیشنِ خروج (۱۴۰ms) */
const OUTGOING_LIFETIME_MS = 170;

export interface SwapTransitionProps {
  /** هر تغییر کلید = یک تعویضِ کراس‌فیدی */
  swapKey: string;
  className?: string;
  children: ReactNode;
}

export function SwapTransition({ swapKey, className, children }: SwapTransitionProps) {
  const [outgoing, setOutgoing] = useState<{ key: string; node: ReactNode } | null>(null);
  const previousKey = useRef(swapKey);
  const committedNode = useRef<ReactNode>(children);

  // تصمیمِ تعویض — قبل از اثرِ ردیاب (که گرهِ جاری را به‌روز می‌کند)
  useEffect(() => {
    if (previousKey.current === swapKey) return;
    const oldKey = previousKey.current;
    const oldNode = committedNode.current;
    previousKey.current = swapKey;
    setOutgoing({ key: oldKey, node: oldNode });
    const timer = window.setTimeout(() => {
      setOutgoing((current) => (current && current.key === oldKey ? null : current));
    }, OUTGOING_LIFETIME_MS);
    return () => window.clearTimeout(timer);
  }, [swapKey]);

  // ردیابِ گرهِ جاری — برای تعویضِ بعدی همیشه تازه‌ترین نسخه‌ی قدیم را
  // داشته باشیم (بدون بازتحریکِ اثرِ بالا روی هر رندر)
  useEffect(() => {
    committedNode.current = children;
  });

  return (
    <div className={cn('relative', className)}>
      {outgoing ? (
        <div
          aria-hidden="true"
          inert
          className="auth-view-exit pointer-events-none absolute inset-x-0 top-0"
        >
          {outgoing.node}
        </div>
      ) : null}
      <div className="auth-view-enter">{children}</div>
    </div>
  );
}
