'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, LayoutGrid, RefreshCw } from 'lucide-react';

/**
 * ═══════════════════════════════════════════════════════════════════
 * تله‌ی خطای اختصاصیِ صفحه‌ی جزئیاتِ جهاد تبیین
 *
 * پیش از این، هر استثنای رندر در این مسیر به error boundaryِ ریشه
 * (src/app/error.tsx) می‌رسید و کاربر «خطایی رخ داد»ی عمومیِ کل سایت
 * را می‌دید. این تله‌ی محلی دو کار می‌کند:
 *
 *   ۱) تجربه‌ی کاربر: به‌جای پیامِ کلیِ سایت، یک پنلِ برندشده با مسیرِ
 *      فرارِ مفید (تلاش دوباره + بازگشت به آرشیو) می‌بیند و هدر/فوتر
 *      سایت دست‌نخورده باقی می‌ماند.
 *
 *   ۲) قابلیتِ دیباگ: استکِ کاملِ خطا در console مرورگر لاگ می‌شود تا
 *      در تولید هم ردِ واقعیِ مشکل در دسترس باشد (کنار digestِ Next).
 * ═══════════════════════════════════════════════════════════════════
 */
export default function TabyinDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // استکِ واقعی برای دیباگِ تولید — در کنسولِ مرورگر باقی می‌ماند
    console.error('[tabyin/[slug]] render error:', error);
  }, [error]);

  return (
    <main className="bg-white">
      <section className="container-edge flex min-h-[60vh] items-center justify-center py-12">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h1 className="mt-5 text-[20px] font-black text-ink-900 md:text-[22px]">
            خطای موقت در نمایش این محتوا
          </h1>
          <p className="mt-3 text-[14px] leading-8 text-ink-600">
            متأسفانه در آماده‌سازی این صفحه مشکلی پیش آمد. معمولاً تلاشِ دوباره مشکل را حل می‌کند؛
            در غیر این صورت می‌توانید از آرشیو محتواهای دیگر را ببینید.
          </p>
          {error?.digest ? (
            <p className="ltr mt-2 text-[11px] text-ink-400">code: {error.digest}</p>
          ) : null}
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              onClick={() => reset()}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-brand-600 px-6 text-[13.5px] font-extrabold text-white transition-colors hover:bg-brand-700"
            >
              <RefreshCw className="h-4 w-4" />
              تلاش دوباره
            </button>
            <Link
              href="/tabyin"
              className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-brand-500 bg-white px-6 text-[13.5px] font-extrabold text-brand-700 transition-colors hover:bg-brand-50"
            >
              <LayoutGrid className="h-4 w-4" />
              آرشیو جهاد تبیین
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
