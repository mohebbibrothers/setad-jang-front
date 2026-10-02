import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Trophy } from 'lucide-react';

import { EmptyState } from '@/components/home/EmptyState';
import { ExamArena } from '@/components/lms/exam/ExamArena';
import { fetchLmsCourseDetail } from '@/lib/lms-data';
import { normalizeRouteSlug } from '@/lib/route-slug';

export const dynamic = 'force-dynamic';

const canonicalOf = (courseSlug: string) => `/lms/courses/${encodeURIComponent(courseSlug)}/exam`;

type Params = Promise<{ slug: string }>;

/**
 * /lms/courses/<slug>/exam — «جلسه‌ی پایانی»: آرنای مستقلِ آزمونِ پایان‌دوره.
 *
 * آزمون دیگر مهمانِ صفحه‌ی آخرین جلسه نیست؛ مثل یک جلسه‌ی جدا، آدرسِ خودش،
 * دروازه‌های خودش (مهمان ← ورود، عضونشده ← رزرو، جلسه‌مانده ← نقشه‌ی بازگشت)
 * و صحنه‌ی خودش را دارد. داده‌ی صفحه public است؛ state دسترسی کاملاً در
 * کلاینت و از دکل‌های احرازشده‌ی enrollment/quiz می‌آید (نشتِ صفر در SSR).
 * robots: noindex — صفحه‌ی عملیاتیِ عضو است، نه مقصدِ جستجو.
 */
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const slug = normalizeRouteSlug((await params).slug);
  const result = await fetchLmsCourseDetail(slug);
  if (result.kind !== 'ok') return { title: 'آزمون پایان دوره' };
  return {
    title: `آزمون پایان دوره | ${result.course.title}`,
    description: `جلسه‌ی پایانی مسیرِ ${result.course.title} — با قبولی در آزمون، گواهی با کدِ راستی‌آزما صادر می‌شود.`,
    alternates: { canonical: canonicalOf(slug) },
    robots: { index: false, follow: false },
  };
}

export default async function ExamPage({ params }: { params: Params }) {
  const slug = normalizeRouteSlug((await params).slug);

  const result = await fetchLmsCourseDetail(slug);
  if (result.kind === 'not-found') notFound();
  if (result.kind === 'offline') {
    return (
      <main className="section-y">
        <div className="container-edge">
          <EmptyState
            title="اتصال به قرارگاه برقرار نشد"
            description="در دریافت اطلاعات کلاس مشکلی پیش آمد؛ چند لحظه‌ی دیگر دوباره تلاش کنید."
            iconPath="M4 4v5h5M20 20v-5h-5M4 9a8 8 0 0 1 14.23-3.36M20 15a8 8 0 0 1-14.23 3.36"
          />
        </div>
      </main>
    );
  }

  const { course } = result;
  const ordered = [...course.lessons].sort((a, b) => a.order - b.order);
  const lastLesson = ordered.length > 0 ? ordered[ordered.length - 1] : null;

  return (
    <main className="section-y min-h-[70vh] bg-[#f4f6f9]">
      <div className="container-edge max-w-4xl">
        {/* ── نوارِ بالا: بازگشت + مسیر + نشانِ پایانی ── */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <Link
            href={`/lms/courses/${encodeURIComponent(course.slug)}`}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-ink-100 bg-white px-3.5 text-[12px] font-extrabold text-ink-700 shadow-sm transition hover:border-brand-200 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
          >
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            بازگشت به کلاس
          </Link>
          <nav aria-label="مسیر" className="min-w-0 text-[11.5px] font-bold text-ink-400">
            <ol className="flex min-w-0 items-center gap-1.5">
              <li className="hidden shrink-0 sm:block">
                <Link href="/lms" className="transition hover:text-ink-700">
                  قرارگاه آموزشی
                </Link>
              </li>
              <li aria-hidden="true" className="hidden sm:block">
                ‹
              </li>
              <li className="min-w-0 truncate">
                <Link
                  href={`/lms/courses/${encodeURIComponent(course.slug)}`}
                  className="transition hover:text-ink-700"
                >
                  {course.title}
                </Link>
              </li>
              <li aria-hidden="true">‹</li>
              <li className="shrink-0 text-gold-700">جلسه‌ی پایانی</li>
            </ol>
          </nav>
          <span className="ms-auto inline-flex items-center gap-1.5 rounded-full border border-gold-200 bg-gold-50 px-3 py-1.5 text-[11px] font-extrabold text-gold-800">
            <Trophy className="h-3 w-3" aria-hidden="true" />
            آزمون پایان دوره و گواهی
          </span>
        </div>

        {ordered.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-brand-200 bg-gradient-to-b from-brand-50/60 to-white p-9 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-[0_14px_30px_-12px_rgba(13,128,116,.7)]">
              <Trophy className="h-7 w-7" aria-hidden="true" />
            </span>
            <p className="mt-4 text-[17px] font-black text-ink-900">
              جلسه‌ی پایانی هنوز ساخته نشده
            </p>
            <p className="mx-auto mt-1.5 max-w-md text-[12.5px] font-bold leading-7 text-ink-500">
              سیلابوس این کلاس در حال آماده‌سازی است؛ وقتی جلسات منتشر شوند و تو آن‌ها را کامل کنی،
              همین‌جا دروازه‌ی آزمون باز می‌شود.
            </p>
            <Link
              href={`/lms/courses/${encodeURIComponent(course.slug)}`}
              className="mt-5 inline-flex h-11 items-center gap-1.5 rounded-full bg-mint-500 px-6 text-[13px] font-extrabold text-ink-950 transition hover:bg-mint-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-300"
            >
              بازگشت به صفحه‌ی کلاس
            </Link>
          </div>
        ) : (
          <ExamArena course={course} orderedLessons={ordered} lastLesson={lastLesson} />
        )}
      </div>
    </main>
  );
}
