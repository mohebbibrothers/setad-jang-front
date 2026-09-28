import { Quote, UserRound } from 'lucide-react';
import { SmartImage } from '@/components/ui/SmartImage';
import type { LmsCourseDetail } from '@/lib/lms-shared';

/** کارتِ مدرس — چهره‌ی انسانیِ کلاس؛ بیو اگر هست، سندِ اعتبار است. */
export function CourseInstructor({ course }: { course: LmsCourseDetail }) {
  return (
    <section id="instructor" className="scroll-mt-24">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-col items-center text-center">
          <p className="inline-flex items-center gap-1.5 text-[12px] font-extrabold text-mint-700">
            <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
            مدرس کلاس
          </p>
          <h2 className="mt-1 text-[22px] font-black text-ink-900 md:text-[26px]">
            با چه کسی یاد می‌گیری؟
          </h2>
        </div>

        <div className="relative mt-8 overflow-hidden rounded-[22px] border border-ink-100 bg-white p-7 shadow-[0_16px_40px_-28px_rgba(11,53,48,.3)] sm:p-9">
          <Quote
            aria-hidden="true"
            className="absolute -left-6 -top-6 h-28 w-28 rotate-180 text-brand-50"
          />
          <div className="relative flex flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:text-right">
            <span className="relative shrink-0">
              <span className="absolute -inset-1.5 rounded-full bg-gradient-to-br from-brand-400 to-mint-400 opacity-70 blur-sm" />
              <span className="relative grid h-24 w-24 overflow-hidden rounded-full bg-brand-50 ring-4 ring-white">
                <SmartImage
                  src={course.instructorAvatarUrl}
                  alt={`تصویر ${course.instructor}`}
                  variant="avatar"
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </span>
            </span>
            <div className="min-w-0">
              <p className="text-[17px] font-black text-ink-900">{course.instructor}</p>
              <p className="mt-0.5 text-[11.5px] font-bold text-brand-600">مدرسِ {course.title}</p>
              <p className="mt-3 whitespace-pre-line text-[13px] leading-8 text-ink-600">
                {course.instructorBio?.trim() ||
                  'مدرسِ این کلاس از همراهانِ میدانیِ قرارگاه آموزشی است؛ رزومه‌ی کامل ایشان به‌زودی همین‌جا منتشر می‌شود.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
