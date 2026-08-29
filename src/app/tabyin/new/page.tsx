import type { Metadata } from 'next';
import { PencilLine, ShieldCheck, Sparkles } from 'lucide-react';
import { SubmissionStudio } from '@/components/revayat/studio/SubmissionStudio';

/**
 * ═══════════════════════════════════════════════════════════════════
 * /tabyin/new — «استودیوی روایت» (ارسال محتوای مردمی)
 *
 * دروازه‌ی رسمیِ «رسانه‌ی مردم»: کاربر روایتش را می‌نویسد، نشانیِ
 * رسانه‌هایش را می‌چسباند، پیش‌نمایشِ واقعی را می‌بیند و برای صفِ
 * بررسی می‌فرستد؛ بعد وضعیتش را همان‌جا ردیابی می‌کند.
 *
 * معماری: قهرمانِ سبک (SSR) + استودیوی کلاینتی — متن‌های دعوت‌گر
 * همین‌جا سروررندر می‌شوند تا LCP تمیز بماند؛ منطقِ فرم/احراز
 * در SubmissionStudio است.
 * ═══════════════════════════════════════════════════════════════════
 */

export const metadata: Metadata = {
  title: 'ارسال روایت | روایت‌های مردم',
  description:
    'استودیوی روایت — داستان و مستندات خودت (عکس، فیلم، صوت) را برای جهاد تبیین بفرست؛ پس از تأیید، روایتت در فیدِ روایت‌ها و صفحه‌ی اصلیِ بعثت مردم منتشر می‌شود.',
  openGraph: {
    title: 'استودیوی روایت | بعثت مردم',
    description: 'روایتِ مردمی خودت را بنویس و به دیوارِ جهاد تبیین بفرست.',
    type: 'website',
  },
};

export default function NewTabyinPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* ── نوارِ قهرمانِ جمع‌وجور (هم‌خانواده با /tabyin) ── */}
      <section className="relative overflow-hidden border-b border-ink-100 bg-gradient-to-l from-brand-50/80 via-white to-mint-50/50">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-28 h-64 w-64 rounded-full bg-brand-200/40 blur-3xl"
        />
        <span
          aria-hidden="true"
          className="bg-mint-200/40 pointer-events-none absolute -bottom-32 -left-16 h-56 w-56 rounded-full blur-3xl"
        />
        <div className="container-edge relative mx-auto max-w-xl px-4 py-7 text-center md:py-9">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3.5 py-1.5 text-[11.5px] font-extrabold text-brand-700 shadow-sm ring-1 ring-inset ring-brand-600/15 backdrop-blur">
            <PencilLine className="h-3.5 w-3.5" />
            رسانه‌ی مردم
          </span>
          <h1 className="mt-3 text-[25px] font-black text-ink-900 md:text-[30px]">
            استودیوی روایت
          </h1>
          <p className="mx-auto mt-2.5 max-w-md text-[13px] font-semibold leading-7 text-ink-600">
            روایتِ خودت را بنویس و به دیوار روایت‌ها بفرست — بعد از تأیید، هزاران نفر آن را در بعثت
            مردم می‌بینند.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-3 py-1.5 text-[10.5px] font-extrabold text-white">
              <Sparkles className="h-3 w-3 text-mint-400" />
              پیش‌نمایشِ زنده
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[10.5px] font-bold text-ink-500 ring-1 ring-inset ring-ink-100">
              <ShieldCheck className="h-3 w-3 text-emerald-600" />
              انتشار پس از بررسی مدیر
            </span>
          </div>
        </div>
      </section>

      {/* ── استودیو (کلاینت) ── */}
      <section className="mx-auto max-w-xl px-3 pt-5 sm:px-4 md:pt-7 lg:max-w-6xl 2xl:max-w-7xl">
        <SubmissionStudio />
      </section>
    </main>
  );
}
