import type { Metadata } from 'next';
import { LayoutList, PenLine, ShieldCheck, Trash2 } from 'lucide-react';
import { MyStoriesManager } from '@/components/revayat/studio/MyStoriesManager';

/**
 * ═══════════════════════════════════════════════════════════════════
 * /tabyin/mine — «روایت‌های من» (داشبوردِ مدیریتِ محتوای مردمی)
 *
 * صندوقِ شخصیِ هر راوی: آمارِ زنده‌ی صفِ بررسی، جست‌وجو، مشاهده‌ی غنی
 * (متن + گالریِ رسانه + وضعیتِ نگه‌داشت روی سرور)، ویرایشِ کامل با
 * همان قراردادِ استودیو، و حذفِ قطعی که بلافاصله کش‌های عمومی و دیوارِ
 * خانه را تازه می‌کند.
 *
 * معماری: قهرمانِ سبک (SSR) + داشبوردِ کلاینتی — متن‌های چارچوب اینجا
 * سروررندر می‌شوند؛ منطقِ داده/احراز در MyStoriesManager است و مهمان‌ها
 * با پنلِ قفل و AuthModalِ درجا وارد می‌شوند (بدونِ خروج از صفحه).
 * ═══════════════════════════════════════════════════════════════════
 */

export const metadata: Metadata = {
  title: 'روایت‌های من | مدیریت محتوا',
  description:
    'داشبوردِ مدیریتِ روایت‌های مردمی — آمارِ بررسی، مشاهده‌ی کامل، ویرایش و حذفِ روایت‌هایی که به جهاد تبیین فرستاده‌ای.',
  openGraph: {
    title: 'روایت‌های من | بعثت مردم',
    description: 'روایت‌هایت را ببین، ویرایش کن و مدیریتشان کن — همه در یک جا.',
    type: 'website',
  },
};

export default function MyStoriesPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* ── نوارِ قهرمانِ جمع‌وجور (هم‌خانواده با /tabyin/new) ── */}
      <section className="relative overflow-hidden border-b border-ink-100 bg-gradient-to-l from-brand-50/80 via-white to-mint-50/50">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-28 h-64 w-64 rounded-full bg-brand-200/40 blur-3xl"
        />
        <span
          aria-hidden="true"
          className="bg-mint-200/40 pointer-events-none absolute -bottom-32 -left-16 h-56 w-56 rounded-full blur-3xl"
        />
        <div className="container-edge relative mx-auto max-w-3xl px-4 py-7 text-center md:py-9">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3.5 py-1.5 text-[11.5px] font-extrabold text-brand-700 shadow-sm ring-1 ring-inset ring-brand-600/15 backdrop-blur">
            <LayoutList className="h-3.5 w-3.5" />
            مدیریت محتوا
          </span>
          <h1 className="mt-3 text-[25px] font-black text-ink-900 md:text-[30px]">روایت‌های من</h1>
          <p className="mx-auto mt-2.5 max-w-md text-[13px] font-semibold leading-7 text-ink-600">
            همه‌ی روایت‌هایی که فرستاده‌ای — هر وضعیتی که دارند — اینجاست: ببین، ویرایش کن و هر وقت
            خواستی حذفشان کن.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-3 py-1.5 text-[10.5px] font-extrabold text-white">
              <PenLine className="h-3 w-3 text-mint-400" />
              ویرایشِ کامل
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[10.5px] font-bold text-ink-500 ring-1 ring-inset ring-ink-100">
              <Trash2 className="h-3 w-3 text-rose-500" />
              حذف با اثرِ فوری روی دیوار
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[10.5px] font-bold text-ink-500 ring-1 ring-inset ring-ink-100">
              <ShieldCheck className="h-3 w-3 text-emerald-600" />
              پیگیریِ وضعیتِ بررسی
            </span>
          </div>
        </div>
      </section>

      {/* ── داشبورد (کلاینت) ── */}
      <section className="mx-auto max-w-6xl px-3 pt-6 sm:px-4 md:pt-8">
        <MyStoriesManager />
      </section>
    </main>
  );
}
