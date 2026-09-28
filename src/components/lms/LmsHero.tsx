import Image from 'next/image';
import Link from 'next/link';
import { ArrowDown, Award, GraduationCap, ShieldCheck, Sparkles } from 'lucide-react';
import { formatLmsHours, type LmsCatalogStats, type LmsCategoryNode } from '@/lib/lms-shared';
import { LmsSearchBox } from './LmsSearchBox';

/**
 * هیروی هاب «قرارگاه آموزشی» — خواهرِ هیروی مددکار (همان خانواده‌ی تیره +
 * بور‌های گرادیانی + بافتِ خط)، ولی با هویتِ آموزشی: گرادیانتِ mint/brand،
 * آمارِ صادقانه‌ی کاتالوگ، سرچِ بزرگِ مستقیم و سه ویژگیِ اعتماد.
 *
 * قراردادِ صداقت: هر چهار عدد از خودِ داده‌ی واقعیِ API می‌آیند؛ اگر
 * کاتالوگ بزرگ‌تر از صفحه‌ی اسکن باشد، علامتِ «+» در برچسب راستی‌گویی
 * می‌گوید. خالی‌بودن (۰) هم هیچ‌وقت پنهان نمی‌شود.
 */
export function LmsHero({
  stats,
  topCategories,
  suggestedSearches,
}: {
  stats: LmsCatalogStats;
  topCategories: Array<{ node: LmsCategoryNode; href: string }>;
  suggestedSearches: Array<{ label: string; href: string }>;
}) {
  const plus = (v: number) =>
    stats.truncated && v > 0 ? `${v.toLocaleString('fa-IR')}+` : v.toLocaleString('fa-IR');
  const hoursText = formatLmsHours(stats.totalDurationSeconds);
  const statBoxes = [
    { value: plus(stats.courseCount), unit: 'کلاس', label: 'منتشرشده تاکنون' },
    { value: plus(stats.totalLessons), unit: 'جلسه', label: 'در دسترسِ یادگیری' },
    { value: plus(stats.totalLearners), unit: 'یادگیرنده', label: 'ثبت‌نام تا این لحظه' },
    {
      value: stats.truncated && stats.totalDurationSeconds > 0 ? `${hoursText}+` : hoursText,
      unit: 'ساعت',
      label: 'محتوای آموزشی',
    },
  ];

  return (
    <section className="relative overflow-hidden bg-ink-900 text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(-45deg, rgba(255,255,255,.03) 0 2px, transparent 2px 14px)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-brand-500/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-28 bottom-0 h-80 w-80 rounded-full bg-mint-500/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-6 hidden -translate-x-1/2 opacity-[0.12] lg:block"
      >
        <Image src="/brand/pattern-plus.png" alt="" width={130} height={132} aria-hidden="true" />
      </div>

      <div className="container-edge relative py-14 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[12px] font-bold text-white/80 backdrop-blur-sm">
            <GraduationCap className="h-4 w-4 text-mint-400" aria-hidden="true" />
            اپِ «قرارگاه آموزشی» — مدرسه‌ی مهارتِ مردمی
          </p>
          <h1 className="mt-5 text-[27px] font-black leading-[1.4] text-white sm:text-4xl md:text-[44px] md:leading-[1.4]">
            مهارت یاد بگیر،
            <span className="block bg-gradient-to-l from-mint-200 via-mint-300 to-mint-500 bg-clip-text text-transparent">
              برای میدان آماده شو
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-[13.5px] leading-8 text-white/75 md:text-[15px]">
            کلاس‌های رایگانِ سطح‌بندی‌شده با جلساتِ ویدئو، صوت، سند و متن؛ آزمونِ پایانِ دوره و
            گواهی با راستی‌آزماییِ عمومی — همه در سکوی آموزشِ مردمیِ بعثت مردم.
          </p>

          {/* سرچِ بزرگِ هیرو — ورودِ مستقیم به کاتالوگ */}
          <div className="mx-auto mt-8 max-w-2xl">
            <LmsSearchBox variant="hero" placeholder="نامِ کلاس، مدرس یا موضوع…" />
          </div>

          {/* مسیرهای آماده — دسته‌های پرجمعیت و پیشنهادهای موضوعی */}
          {(topCategories.length > 0 || suggestedSearches.length > 0) && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11.5px]">
              <span className="inline-flex items-center gap-1 font-bold text-white/50">
                <Sparkles className="h-3 w-3 text-mint-300" aria-hidden="true" />
                شروعِ سریع:
              </span>
              {topCategories.slice(0, 3).map(({ node, href }) => (
                <Link
                  key={node.slug}
                  href={href}
                  prefetch={false}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 font-bold text-white/85 backdrop-blur-sm transition-all hover:border-mint-400/40 hover:bg-white/10 hover:text-white"
                >
                  {node.title}
                  <span className="rounded-full bg-white/15 px-1.5 py-0.5 text-[9.5px] tabular-nums text-mint-200">
                    {node.coursesCount.toLocaleString('fa-IR')}
                  </span>
                </Link>
              ))}
              {suggestedSearches.slice(0, 2).map((s) => (
                <Link
                  key={s.label}
                  href={s.href}
                  prefetch={false}
                  className="inline-flex h-8 items-center rounded-full border border-dashed border-white/20 px-3 font-bold text-white/60 transition-colors hover:border-mint-300/50 hover:text-white"
                >
                  {s.label}
                </Link>
              ))}
            </div>
          )}

          {/* آمارِ زنده — قراردادِ تایپوگرافیِ یکسان با هاب مددکار */}
          <div className="mx-auto mt-9 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
            {statBoxes.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-white/10 bg-white/[.05] px-3 py-4 backdrop-blur-sm sm:px-4"
              >
                <div className="text-[20px] font-black tabular-nums text-mint-300 md:text-[24px]">
                  {s.value}
                  <span className="ms-1 text-[11.5px] font-extrabold text-mint-200/70 md:text-[13px]">
                    {s.unit}
                  </span>
                </div>
                <div className="mt-1 text-[11.5px] font-bold text-white/70">{s.label}</div>
              </div>
            ))}
          </div>

          {/* نوارِ اعتماد */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11.5px] font-bold text-white/55">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-mint-300" aria-hidden="true" />
              رایگان، بدون نیاز به کارت
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5 text-mint-300" aria-hidden="true" />
              گواهی با راستی‌آزماییِ عمومی
            </span>
            <span className="inline-flex items-center gap-1.5">
              <GraduationCap className="h-3.5 w-3.5 text-mint-300" aria-hidden="true" />
              سطح‌بندی از مقدماتی تا حرفه‌ای
            </span>
          </div>

          <a
            href="#courses"
            className="mt-9 inline-flex items-center gap-2 rounded-2xl bg-mint-500 px-6 py-3.5 text-[14px] font-extrabold text-ink-950 shadow-lg shadow-mint-900/40 transition-all hover:bg-mint-400 active:scale-[.98]"
          >
            دیدن همه‌ی آموزش‌ها
            <ArrowDown className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
