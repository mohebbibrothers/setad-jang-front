import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Lock } from 'lucide-react';

import { EmptyState } from '@/components/home/EmptyState';
import { LessonConsole } from '@/components/lms/lesson/LessonConsole';
import { fetchLmsCourseDetail } from '@/lib/lms-data';
import { LESSON_TYPE_LABEL } from '@/lib/lms-shared';
import { normalizeRouteSlug } from '@/lib/route-slug';

export const dynamic = 'force-dynamic';

const canonicalOf = (courseSlug: string, lessonSlug: string) =>
  `/lms/courses/${encodeURIComponent(courseSlug)}/lessons/${encodeURIComponent(lessonSlug)}`;

type Params = Promise<{ slug: string; lesson: string }>;

/**
 * /lms/courses/<slug>/lessons/<lesson> — کنسول جلسه (جواهرِ قرارگاه آموزشی).
 *
 *   • SSR: دوره + سیلابوس (public) — خودِ محتوا فقط از راهِ کلاینت و دکل‌های
 *     احرازشده‌ی media/progress/questions می‌آید (عمدی: نشتِ محتوای قفل‌شده در
 *     HTMLِ SSR نمی‌تواند رخ دهد).
 *   • هر دو پارامتر با normalizeRouteSlug نرمال می‌شوند (ترمیمِ double-encode).
 *   • robots: noindex — محتوای جلسات پشتِ ثبت‌نام است؛ کانونیکال فقط برای
 *     یکپارچگی آدرس نگه داشته می‌شود.
 */
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const slug = normalizeRouteSlug((await params).slug);
  const lessonParam = normalizeRouteSlug((await params).lesson);
  const result = await fetchLmsCourseDetail(slug);
  if (result.kind !== 'ok') return { title: 'جلسه‌ی آموزشی' };
  const lesson = result.course.lessons.find((l) => l.slug === lessonParam);
  if (!lesson) return { title: 'جلسه‌ی آموزشی' };
  return {
    title: `${lesson.title} | ${result.course.title}`,
    description:
      lesson.summary?.trim() ||
      `جلسه‌ی ${lesson.title} از کلاس ${result.course.title} در قرارگاه آموزشی بعثت مردم`,
    alternates: { canonical: canonicalOf(slug, lesson.slug) },
    robots: { index: false, follow: false },
  };
}

export default async function LessonPage({ params }: { params: Params }) {
  const slug = normalizeRouteSlug((await params).slug);
  const lessonParam = normalizeRouteSlug((await params).lesson);

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
  const index = ordered.findIndex((l) => l.slug === lessonParam);
  if (index < 0) notFound();
  const lesson = ordered[index];
  const prev = index > 0 ? ordered[index - 1] : null;
  const next = index < ordered.length - 1 ? ordered[index + 1] : null;
  const isFreePreview = lesson.isPreview;

  return (
    <main className="section-y min-h-[70vh] bg-[#f4f6f9]">
      <div className="container-edge">
        {/* ── نوارِ بالا: بازگشت + مسیر + متا ── */}
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
              <li className="shrink-0 text-ink-600">جلسه‌ی {index + 1}</li>
            </ol>
          </nav>
          <span className="ms-auto inline-flex items-center gap-1.5 rounded-full border border-ink-100 bg-white px-3 py-1.5 text-[11px] font-extrabold text-ink-600">
            <Lock className="h-3 w-3 text-mint-600" aria-hidden="true" />
            {isFreePreview
              ? 'جلسه‌ی رایگان — بدون ثبت‌نام قابل تماشاست'
              : 'محتوای ویژه‌ی ثبت‌نام‌شده‌ها'}
          </span>
        </div>

        {/* ── کنسول (کلاینت): صحنه + ریل + تب‌ها + فوتر ── */}
        <LessonConsole
          course={course}
          lesson={lesson}
          lessonIndex={index}
          totalLessons={ordered.length}
          orderedLessons={ordered}
          prevLesson={prev}
          nextLesson={next}
          typeLabel={LESSON_TYPE_LABEL[lesson.contentType]}
        />
      </div>
    </main>
  );
}
