import Link from 'next/link';
import { ArrowLeft, Route } from 'lucide-react';
import { LmsCourseCard } from '@/components/lms/LmsCourseCard';
import type { LmsCourse, LmsCourseDetail } from '@/lib/lms-shared';

/**
 * کلاس‌های مرتبط — همان دسته‌بندی، به‌جز خودِ دوره (داده از
 * fetchLmsRelatedCourses؛ همان فیلترِ category روی endpoint لیست).
 * هدف: بعد از هر تصمیم (ثبت‌نام یا نه)، مسیرِ گشت‌وگذار هرگز بن‌بست
 * نشود — یا به کلاسِ هم‌رده بعدی می‌روی، یا به کاتالوگِ دسته.
 */
export function RelatedCourses({
  course,
  related,
}: {
  course: LmsCourseDetail;
  related: LmsCourse[];
}) {
  const categoryHref = course.categorySlug
    ? `/lms?category=${encodeURIComponent(course.categorySlug)}#courses`
    : '/lms';

  if (related.length === 0) {
    // تنها کلاسِ دسته — به‌جای سکشنِ خالی، دعوتِ جمعی به کاتالوگ.
    return (
      <div className="mx-auto max-w-2xl rounded-[20px] border border-dashed border-brand-200 bg-brand-50/50 p-6 text-center md:p-8">
        <Route className="mx-auto h-8 w-8 text-brand-500" aria-hidden="true" />
        <p className="mt-3 text-[14px] font-extrabold text-ink-800">
          این کلاس فعلاً تنها نگینِ دسته‌ی خودش است
        </p>
        <p className="mx-auto mt-1.5 max-w-sm text-[12px] leading-6 text-ink-500">
          ماشه‌ی شروعِ این مسیر را تو می‌زنی؛ نگاهی به بقیه‌ی دسته‌های قرارگاه هم بینداز — شاید
          مسیرِ دومی هم برایت باز شود.
        </p>
        <Link
          href="/lms"
          prefetch={false}
          className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-full bg-gradient-to-l from-brand-500 to-brand-700 px-5 text-[12.5px] font-extrabold text-white shadow-[0_10px_24px_-10px_rgba(13,128,116,.7)] transition-all hover:from-brand-600 hover:to-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
        >
          دیدنِ همه‌ی کلاس‌ها
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-7 flex flex-col items-center text-center">
        <p className="inline-flex items-center gap-1.5 text-[12px] font-extrabold text-mint-700">
          <Route className="h-3.5 w-3.5" aria-hidden="true" />
          مسیرِ ادامه‌دار
        </p>
        <h2 className="mt-1 text-[22px] font-black text-ink-900 md:text-[26px]">
          {course.categoryTitle
            ? `کلاس‌های بیشتر در «${course.categoryTitle}»`
            : 'کلاس‌های هم‌مسیر'}
        </h2>
        <p className="mt-2 text-[12.5px] leading-7 text-ink-500">
          اگر این کلاس آغازِ مسیر است، این‌ها قدم‌های بعدی‌اند؛ هرکدام را می‌شود مستقل هم گذراند.
        </p>
      </div>

      <ul className="grid list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {related.map((c) => (
          <li key={c.slug} className="min-w-0">
            <LmsCourseCard c={c} />
          </li>
        ))}
      </ul>

      <div className="mt-8 text-center">
        <Link
          href={categoryHref}
          prefetch={false}
          className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-brand-500 bg-white px-6 text-[13px] font-extrabold text-brand-700 transition-colors hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
        >
          دیدنِ همه‌ی کلاس‌های این دسته
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
