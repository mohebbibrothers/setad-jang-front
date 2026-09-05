import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PaydoneClient } from './PaydoneClient';

/**
 * /madadkar/paydone/ — صورت‌جلسهٔ پرداخت
 *
 * مقصدِ نهاییِ callback درگاه: بک‌اند پس از verify با 302 به این‌جا
 * می‌فرستد (/?authority=…&result=…). این صفحه خودش به‌صورت کلاینتی،
 * با POST idempotent نتیجهٔ قطعی را بازیابی و رندر می‌کند تا پارامترهای
 * URL هرگز «منبع حقیقت» نباشند. noindex متعهدانه — این صفحه نباید
 * ایندکس شود (نقطهٔ امنیت و تجربهٔ کاربری).
 */

export const metadata: Metadata = {
  title: 'نتیجهٔ پرداخت | مدد به حرکت',
  robots: { index: false, follow: false },
};

export default async function PaydonePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const authority =
    (typeof sp.authority === 'string' ? sp.authority : undefined) ??
    (typeof sp.Authority === 'string' ? sp.Authority : undefined) ??
    '';
  const result = typeof sp.result === 'string' ? sp.result : null;

  return (
    <Suspense
      fallback={
        <main className="min-h-[70vh] bg-gradient-to-b from-brand-50/70 via-white to-white">
          <div className="container-edge flex items-center justify-center py-24">
            <svg className="h-8 w-8 animate-spin text-brand-500" viewBox="0 0 24 24" fill="none">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeOpacity="0.3"
                strokeWidth="3"
              />
              <path
                d="M22 12a10 10 0 0 0-10-10"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </main>
      }
    >
      <PaydoneClient authority={authority} resultParam={result} />
    </Suspense>
  );
}
