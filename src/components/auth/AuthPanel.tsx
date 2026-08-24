'use client';

/**
 * AuthPanel — پنلِ همیشه‌مونتِ یک نما داخل مودال.
 *
 * قرارداد مهم: viewها با سوییچ تب unmount نمی‌شوند؛ فقط با
 * `hidden` + `inert` پنهان/آشکار می‌شوند. نتیجه:
 *   • state فلو (که در auth-flow-session است) و DOM هر دو حیات می‌مانند؛
 *   • هیچ انیمیشنِ خروجِ معلق‌مانده‌ای — پس هیچ «صفحه‌ی سفید» و
 *     هیچ overlay زامبی‌ای که صفحه را قفل کند؛
 *   • فوکوس هر بار روی اولین ورودیِ پنلِ فعال می‌نشیند (چون autoFocus
 *     native روی عناصر پنهان قابل اعتماد نیست، این‌جا متمرکز مدیریت
 *     می‌شود).
 *
 * انیمیشن ورود با CSS keyframes یک‌خطی است — ناممکن است «گیر» کند.
 */

import { useEffect, useRef, type ReactNode } from 'react';

export function AuthPanel({
  id,
  labelledby,
  active,
  /** کلید تغییر محتوا — با عوض شدنش، فوکوس دوباره روی اولین ورودی می‌نشیند
   *  (مثلاً عبور از مرحله‌ی شناسه به مرحله‌ی کد). */
  activeKey,
  children,
}: {
  id: string;
  labelledby: string;
  active: boolean;
  activeKey: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!active) return;
    const frame = window.requestAnimationFrame(() => {
      const el = ref.current?.querySelector<HTMLElement>(
        'input:not([type="checkbox"]):not([type="hidden"])',
      );
      el?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [active, activeKey]);

  return (
    <div
      ref={ref}
      role="tabpanel"
      id={id}
      aria-labelledby={labelledby}
      hidden={!active}
      inert={!active || undefined}
    >
      {/*
        wrapper کلیددار: با تغییر activeKey (مرحله یا روش) فقط همین
        wrapper داخلی ری‌مونت می‌شود تا DOM و فوکوس تازه شوند — بدون
        ازدست‌رفتنِ state (که در سشن است). خودِ موشنِ کراس‌فید/مورف،
        بالاتر و یک‌جا در MorphSwapِ بدنه انجام می‌شود؛ این‌جا عمداً هیچ
        کلاسِ انیمیشنی نیست تا دو لایه‌ی موشن روی هم نیفتند.
      */}
      <div key={activeKey} className="space-y-5">
        {children}
      </div>
    </div>
  );
}
