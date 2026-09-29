import Link from 'next/link';
import { ChevronLeft, Clock3, Flag, GraduationCap, ListVideo, Sparkles, Users } from 'lucide-react';
import { SmartImage } from '@/components/ui/SmartImage';
import {
  LMS_LEVEL_LABEL,
  classifyVideoUrl,
  formatLmsDuration,
  type LmsCourseDetail,
} from '@/lib/lms-shared';
import { CourseEnrollCta } from './CourseEnrollCta';
import { CourseHeroMedia } from './CourseHeroMedia';
import { CourseAvatarAlbumButton, CourseCoverAlbumButton } from './LmsMediaAlbum';
import { courseMediaSlides, instructorSlideIndex } from '@/lib/course-art';

/**
 * هیروی صفحه‌ی دوره — همان خانواده‌ی تیره‌ی هاب/مددکار با چیدمانِ دو
 * ستونه‌ی «فروشگاه محتوا»: متن و CTA در یک سو، کاورِ سینمایی + پخشِ
 * ویدئوی معرفی (در صورت منبعِ امن) در سو دیگر. مسیرِ نان (breadcrumbs)
 * به کاربر و گوگل هر دو ساختار می‌دهد؛ آمارِ دوره، همان تایپوگرافیِ
 * جعبه‌های شیشه‌ایِ هاب است.
 */
export function CourseHero({ course }: { course: LmsCourseDetail }) {
  const fa = (n: number) => n.toLocaleString('fa-IR');
  const intro = classifyVideoUrl(course.introVideoUrl);
  // گالریِ رسانه‌ای — کاور + فضای یادگیری + پرتره‌ی استاد (اسلایدآلبومِ سینمایی)
  const mediaSlides = courseMediaSlides(course);
  const avatarSlide = instructorSlideIndex(course);
  const levelLabel = course.level ? LMS_LEVEL_LABEL[course.level] : null;
  const crumbs: Array<{ label: string; href?: string }> = [
    { label: 'آموزش‌ها', href: '/lms' },
    ...(course.categoryTitle && course.categorySlug
      ? [
          {
            label: course.categoryTitle,
            href: `/lms?category=${encodeURIComponent(course.categorySlug)}#courses`,
          },
        ]
      : []),
    { label: course.title },
  ];
  const stats: Array<{ value: string; label: string }> = [
    { value: fa(course.lessonsCount), label: 'جلسه' },
    ...(course.durationSeconds > 0
      ? [{ value: formatLmsDuration(course.durationSeconds), label: 'مدتِ یادگیری' }]
      : []),
    { value: fa(course.enrollmentsCount), label: 'یادگیرنده' },
    { value: fa(course.graduatesCount), label: 'فارغ‌التحصیل' },
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
        className="pointer-events-none absolute -left-24 -top-28 h-80 w-80 rounded-full bg-brand-500/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-28 bottom-0 h-80 w-80 rounded-full bg-mint-500/15 blur-3xl"
      />

      <div className="container-edge relative py-10 md:py-14">
        {/* مسیرِ نان */}
        <nav aria-label="مسیر صفحه" className="mb-6">
          <ol className="flex flex-wrap items-center gap-1.5 text-[11.5px] font-bold text-white/55">
            {crumbs.map((c, i) => (
              <li key={i} className="inline-flex items-center gap-1.5">
                {i > 0 && <ChevronLeft className="h-3 w-3 text-white/30" aria-hidden="true" />}
                {c.href ? (
                  <Link
                    href={c.href}
                    className="rounded px-1 py-0.5 transition-colors hover:text-mint-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-300"
                  >
                    {c.label}
                  </Link>
                ) : (
                  <span aria-current="page" className="max-w-[42vw] truncate text-mint-200/90">
                    {c.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_1fr] lg:gap-12">
          {/* ── متن و CTA ── */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {course.categoryTitle && course.categorySlug && (
                <Link
                  href={`/lms?category=${encodeURIComponent(course.categorySlug)}#courses`}
                  className="inline-flex h-7 items-center rounded-full border border-white/15 bg-white/5 px-3 text-[11px] font-bold text-white/85 backdrop-blur-sm transition-colors hover:border-mint-400/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-300"
                >
                  دسته‌ی {course.categoryTitle}
                </Link>
              )}
              {levelLabel && (
                <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-white/10 px-3 text-[11px] font-extrabold text-mint-200 ring-1 ring-white/15">
                  <Flag className="h-3 w-3" aria-hidden="true" />
                  سطح {levelLabel}
                </span>
              )}
              {course.isFeatured && (
                <span className="inline-flex h-7 items-center gap-1 rounded-full bg-gradient-to-l from-gold-400 to-gold-500 px-3 text-[11px] font-extrabold text-white shadow-[0_6px_16px_-6px_rgba(240,148,26,.7)]">
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                  پیشنهادِ سردبیر
                </span>
              )}
            </div>

            <h1 className="mt-4 text-[26px] font-black leading-[1.35] sm:text-[34px] md:text-[40px] md:leading-[1.35]">
              {course.title}
            </h1>
            {course.subtitle && (
              <p className="mt-3 text-[14px] font-bold leading-7 text-mint-200/90 md:text-[15px]">
                {course.subtitle}
              </p>
            )}
            {course.shortDescription && (
              <p className="mt-3 max-w-2xl text-[12.5px] leading-7 text-white/70 md:text-[13.5px]">
                {course.shortDescription}
              </p>
            )}

            {/* آمارِ فشرده — زبانِ همان جعبه‌های شیشه‌ای */}
            <dl className="mt-6 grid max-w-xl grid-cols-2 gap-2.5 sm:grid-cols-4">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-white/10 bg-white/[.05] px-3 py-2.5 backdrop-blur-sm"
                >
                  <dt className="order-2 mt-0.5 block text-[10.5px] font-bold text-white/55">
                    {s.label}
                  </dt>
                  <dd className="text-[16px] font-black tabular-nums text-mint-300">{s.value}</dd>
                </div>
              ))}
            </dl>

            {/* مدرس + CTA — لنگرِ #enroll-cta مقصدِ دعوتِ حالتِ
                «سیلابوس در حال آماده‌سازی» و دکمه‌ی دومِ AboutSection است.
                عرضِ دسکتاپِ CTA سقف‌دار است: پنل‌های پیام‌دار (پروفایل‌ناتمام/
                خطا) اگر بدون سقف پهن شوند کارتِ مدرس را له می‌کنند. */}
            <div className="mt-7 flex flex-col gap-5 sm:flex-row sm:items-end">
              <div id="enroll-cta" className="w-full min-w-0 scroll-mt-32 sm:w-[330px] sm:shrink-0">
                <CourseEnrollCta slug={course.slug} durationSeconds={course.durationSeconds} />
              </div>
              <div className="inline-flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
                <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-brand-50 ring-2 ring-white/20">
                  <CourseAvatarAlbumButton
                    slides={mediaSlides}
                    title={course.title}
                    subtitle={{
                      label: 'گالری کلاس',
                      value: course.categoryTitle ?? 'قرارگاه آموزشی',
                    }}
                    startIndex={avatarSlide}
                    avatarSrc={course.instructorAvatarUrl}
                    avatarAlt={`تصویر ${course.instructor}`}
                    size={44}
                  />
                </span>
                <span className="min-w-0">
                  <span className="block text-[10.5px] font-bold text-white/50">مدرس کلاس</span>
                  <span className="block truncate text-[13px] font-extrabold text-white">
                    {course.instructor}
                  </span>
                </span>
                <a
                  href="#instructor"
                  className="ms-2 shrink-0 rounded text-[11px] font-extrabold text-mint-200 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-300"
                >
                  رزومه
                </a>
              </div>
            </div>
          </div>

          {/* ── کاور + پخشِ معرفی ── */}
          <div className="relative order-first lg:order-none">
            <div className="relative aspect-[16/10] overflow-hidden rounded-[22px] border border-white/10 shadow-[0_32px_80px_-30px_rgba(0,0,0,.8)] ring-1 ring-white/10">
              <SmartImage
                src={course.coverUrl}
                alt={`کاور کلاس ${course.title}`}
                variant="course"
                fill
                sizes="(min-width: 1024px) 42vw, 100vw"
                className="object-cover"
                priority
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/50 via-transparent to-ink-950/10"
              />
              <CourseHeroMedia
                source={intro}
                courseTitle={course.title}
                description={course.shortDescription}
              />
              {/* لانچرِ گالری — گوشه‌ی خلوتِ بالا-چپ، بالاتر از اورلیِ پخش (z-20) */}
              <CourseCoverAlbumButton
                slides={mediaSlides}
                title={course.title}
                subtitle={{
                  label: 'گالری کلاس',
                  value: course.categoryTitle ?? 'قرارگاه آموزشی',
                }}
              />
              {/* در عرض‌های باریک با چیپِ «تماشای ویدئوی معرفی» هم‌مسر می‌شود؛
                  فقط از sm به بالا نمایش داده می‌شود (اطلاعاتِ تکراری نیست — ردیفِ اعتماد هست) */}
              {course.lessonsCount > 0 && (
                <span className="absolute bottom-3 right-3 hidden h-7 items-center gap-1.5 rounded-full bg-black/55 px-3 text-[11px] font-bold text-white ring-1 ring-white/20 backdrop-blur-sm sm:inline-flex">
                  <ListVideo className="h-3.5 w-3.5" aria-hidden="true" />
                  {fa(course.lessonsCount)} جلسه‌ی ساخت‌یافته
                </span>
              )}
            </div>
            {/* رتبه‌ی اعتمادِ زیر کاور */}
            <div className="mt-3.5 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-[11px] font-bold text-white/50">
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-3.5 w-3.5 text-mint-300" aria-hidden="true" />
                یادگیری بدون محدودیتِ زمان
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-mint-300" aria-hidden="true" />
                {fa(course.enrollmentsCount)} نفر تا این لحظه
              </span>
              <span className="inline-flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5 text-mint-300" aria-hidden="true" />
                گواهی پایان دوره
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
