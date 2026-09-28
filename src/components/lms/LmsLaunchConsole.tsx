import Link from 'next/link';
import { Award, BadgeCheck, FileText, ListVideo, Mic, MonitorPlay, Type } from 'lucide-react';

/**
 * کنسولِ راه‌اندازیِ هاب — وقتی کاتالوگ هنوز کاملاً خالی است، همان روایتِ
 * صادقانه‌ی صفحه‌ی اصلی را در قالبِ بزرگِ هاب می‌آوریم: راه‌پیمای واقعی،
 * چهار رسانه، و پیش‌نمایشِ گواهی؛ بدون CTA بن‌بست.
 */
const ROADMAP = [
  { title: 'آماده‌سازی و کنترل کیفیتِ محتوای آموزشی', state: 'now', label: 'در جریان' },
  { title: 'انتشارِ نخستین کلاس‌های قرارگاه', state: 'soon', label: 'به‌زودی' },
  { title: 'ثبت‌نام، آزمون و صدور گواهی', state: 'soon', label: 'پس از انتشار' },
] as const;

const MEDIA = [
  { icon: MonitorPlay, label: 'ویدئو' },
  { icon: Mic, label: 'صوت' },
  { icon: FileText, label: 'سند PDF' },
  { icon: Type, label: 'متن غنی' },
] as const;

export function LmsLaunchConsole() {
  return (
    <div className="overflow-hidden rounded-[24px] border border-ink-100 bg-white shadow-card">
      <div className="grid lg:grid-cols-2">
        <div className="p-6 md:p-8">
          <h2 className="text-[17px] font-extrabold leading-8 text-ink-900 md:text-[19px]">
            نخستین کلاس‌های قرارگاه در راه‌اند
          </h2>
          <p className="mt-3 max-w-md text-[13px] leading-7 text-ink-600 md:text-[13.5px]">
            محتوای آموزشی همین حالا در مرحلهٔ آماده‌سازی و کنترل کیفیت است؛ به‌محض انتشار، کلاس‌های
            رایگان با دسته‌بندی و سطح‌بندی، همین‌جا در این صفحه می‌نشینند.
          </p>

          <ol className="mt-6 space-y-3" aria-label="راهپیمای راه‌اندازی">
            {ROADMAP.map((r) => (
              <li key={r.title} className="flex items-center gap-3">
                {r.state === 'now' ? (
                  <span className="relative inline-flex h-2.5 w-2.5 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint-400 opacity-60" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-mint-500" />
                  </span>
                ) : (
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full bg-white ring-2 ring-ink-200"
                    aria-hidden="true"
                  />
                )}
                <span className="min-w-0 flex-1 truncate text-[12.5px] font-bold text-ink-700">
                  {r.title}
                </span>
                <span
                  className={`inline-flex h-5 shrink-0 items-center rounded-full px-2 text-[10px] font-extrabold ${
                    r.state === 'now'
                      ? 'bg-mint-100 text-mint-800 ring-1 ring-mint-200'
                      : 'bg-ink-50 text-ink-500 ring-1 ring-ink-100'
                  }`}
                >
                  {r.label}
                </span>
              </li>
            ))}
          </ol>

          <div className="mt-7 border-t border-ink-100 pt-5">
            <p className="mb-2.5 text-[11px] font-bold text-ink-400">
              هر جلسه، به رسانه‌ای که به آن می‌آید:
            </p>
            <div className="flex flex-wrap gap-2">
              {MEDIA.map((m) => (
                <span
                  key={m.label}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full bg-ink-50 px-3 text-[11.5px] font-bold text-ink-600 ring-1 ring-ink-100"
                >
                  <m.icon className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />
                  {m.label}
                </span>
              ))}
            </div>
          </div>

          <Link
            href="/#education"
            prefetch={false}
            className="mt-7 inline-flex h-11 items-center gap-2 rounded-full border-2 border-brand-500 bg-white px-6 text-[13px] font-extrabold text-brand-700 transition-colors hover:bg-brand-50"
          >
            <ListVideo className="h-4 w-4" aria-hidden="true" />
            برگشت به صفحه‌ی اصلی
          </Link>
        </div>

        {/* پنلِ گواهی — پیش‌نمایشِ راستی‌آزما */}
        <div className="relative grid place-items-center border-t border-ink-100 bg-ink-50/60 p-6 md:p-8 lg:border-s lg:border-t-0">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-60"
          />
          <div className="relative w-full max-w-[340px] rounded-2xl border border-brand-100 bg-white p-5 shadow-card">
            <span className="absolute -top-2.5 left-4 inline-flex h-5 items-center rounded-full bg-ink-50 px-2 text-[9.5px] font-bold text-ink-400 ring-1 ring-ink-100">
              پیش‌نمایش
            </span>
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow">
                <Award className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-[12.5px] font-extrabold text-ink-800">گواهی‌نامهٔ پایان دوره</p>
                <p className="mt-0.5 text-[10.5px] font-medium text-ink-400">
                  بعثت مردم • قرارگاه آموزشی
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-2" aria-hidden="true">
              <span className="block h-2.5 w-3/4 rounded-full bg-ink-100" />
              <span className="block h-2 w-1/2 rounded-full bg-ink-50" />
              <span className="block h-2 w-2/3 rounded-full bg-ink-50" />
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-ink-50 px-3 py-2.5 ring-1 ring-ink-100">
              <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold text-ink-500">
                <BadgeCheck className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />
                کد یکتای راستی‌آزمایی
              </span>
              <span dir="ltr" className="font-mono text-[12px] tracking-[0.22em] text-ink-400">
                BSM••••••
              </span>
            </div>
            <p className="mt-3 text-center text-[10.5px] font-medium leading-5 text-ink-400">
              اعتبارِ هر گواهی برای همه — حتی بدون ورود — قابل استعلام است.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
