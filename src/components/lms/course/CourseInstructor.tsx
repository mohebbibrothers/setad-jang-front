import { Quote, UserRound } from 'lucide-react';
import type { LmsCourseDetail } from '@/lib/lms-shared';
import { courseMediaSlides, instructorSlideIndex } from '@/lib/course-art';
import { CourseAvatarAlbumButton } from './LmsMediaAlbum';

/**
 * کارتِ مدرس — نسخه‌ی جمع‌وجور برای باندِ دوتاییِ «استاد | آزمون و
 * گواهی»؛ دیگر یک سکشنِ تمام‌عرضِ بلند نیست، بلکه کارتِ خودکفایی است که
 * چهره‌ی انسانیِ کلاس را کنارِ سندِ مسیر نگه می‌دارد.
 */
export function CourseInstructor({ course }: { course: LmsCourseDetail }) {
  const mediaSlides = courseMediaSlides(course);
  return (
    <article
      id="instructor"
      className="relative h-full scroll-mt-28 overflow-hidden rounded-[22px] border border-ink-100 bg-white p-6 shadow-[0_16px_40px_-28px_rgba(11,53,48,.3)]"
    >
      <Quote
        aria-hidden="true"
        className="pointer-events-none absolute -left-7 -top-7 h-28 w-28 rotate-180 text-brand-50"
      />
      <div className="relative">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-[11px] font-extrabold text-brand-700 ring-1 ring-brand-100">
          <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
          مدرس کلاس
        </p>
        <h2 className="mt-2.5 text-[16px] font-black text-ink-900">با چه کسی یاد می‌گیری؟</h2>

        <div className="mt-4 flex items-start gap-4">
          <span className="relative shrink-0">
            <span className="absolute -inset-1.5 rounded-full bg-gradient-to-br from-brand-400 to-mint-400 opacity-70 blur-sm" />
            <span className="relative grid h-[72px] w-[72px] overflow-hidden rounded-full bg-brand-50 ring-4 ring-white">
              <CourseAvatarAlbumButton
                slides={mediaSlides}
                title={course.title}
                subtitle={{
                  label: 'گالری کلاس',
                  value: course.categoryTitle ?? 'قرارگاه آموزشی',
                }}
                startIndex={instructorSlideIndex(course)}
                avatarSrc={course.instructorAvatarUrl}
                avatarAlt={`تصویر ${course.instructor}`}
                size={72}
              />
            </span>
          </span>
          <div className="min-w-0 pt-1">
            <p className="text-[15px] font-black text-ink-900">{course.instructor}</p>
            <p className="mt-0.5 text-[11px] font-bold text-brand-600">مدرسِ {course.title}</p>
            <p className="mt-2.5 whitespace-pre-line text-[12px] leading-7 text-ink-600">
              {course.instructorBio?.trim() ||
                'مدرسِ این کلاس از همراهانِ میدانیِ قرارگاه آموزشی است؛ رزومه‌ی کامل ایشان به‌زودی همین‌جا منتشر می‌شود.'}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
