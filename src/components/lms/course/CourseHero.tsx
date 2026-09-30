import Link from 'next/link';
import {
  ChevronLeft,
  Clock3,
  Flag,
  GraduationCap,
  ListVideo,
  Route,
  Rocket,
  Sparkles,
  Users,
} from 'lucide-react';
import { SmartImage } from '@/components/ui/SmartImage';
import {
  LMS_LEVEL_LABEL,
  classifyVideoUrl,
  formatLmsDuration,
  type LmsCourseDetail,
} from '@/lib/lms-shared';
import { CourseHeroMedia } from './CourseHeroMedia';
import { CourseAvatarAlbumButton, CourseCoverAlbumButton } from './LmsMediaAlbum';
import { courseMediaSlides, instructorSlideIndex } from '@/lib/course-art';

/**
 * هیروی جمع‌وجورِ کلاس — نسخه‌ی متراکمِ بازطراحی: به‌جای جعبه‌های آماریِ
 * بزرگ و دکمه‌ی ثبت‌نامی که صفحه را می‌کشید، همه‌ی علائمِ حیاتی در یک
 * ردیفِ چیپ‌های شیشه‌ای می‌آیند و تصمیمِ اصلی (ثبت‌نام/ادامه) به کارتِ
 * وضعیتِ ریل سپرده می‌شود؛ دو لنگرِ ملایم کاربر را مستقیم به همان‌جا
 * می‌برند. نتیجه: ارتفاعِ هیرو تقریباً نصف، اما هیچ اطلاعاتی گم نشده.
 */
export function CourseHero({ course }: { course: LmsCourseDetail }) {
  const fa = (n: number) => n.toLocaleString('fa-IR');
  const intro = classifyVideoUrl(course.introVideoUrl);
  const mediaSlides = courseMediaSlides(course);
  const avatarSlide = instructorSlideIndex(course);
  const levelLabel = course.level ? LMS_LEVEL_LABEL[course.level] : null;
  const duration = formatLmsDuration(course.durationSeconds);
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
  const meta: Array<{ icon: typeof ListVideo; value: string; label: string }> = [
    { icon: ListVideo, value: fa(course.lessonsCount), label: 'جلسه' },
    ...(duration ? [{ icon: Clock3, value: duration, label: 'مدتِ مسیر' }] : []),
    { icon: Users, value: fa(course.enrollmentsCount), label: 'یادگیرنده' },
    { icon: GraduationCap, value: fa(course.graduatesCount), label: 'فارغ‌التحصیل' },
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
        className="pointer-events-none absolute -left-24 -top-28 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-mint-500/15 blur-3xl"
      />

      <div className="container-edge relative py-8 md:py-11">
        {/* مسیرِ نان */}
        <nav aria-label="مسیر صفحه" className="mb-5">
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

        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,440px)] lg:gap-10">
          {/* ── متن ── */}
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

            <h1 className="mt-3.5 text-[24px] font-black leading-[1.4] sm:text-[30px] md:text-[36px] md:leading-[1.4]">
              {course.title}
            </h1>
            {course.subtitle && (
              <p className="mt-2.5 text-[13px] font-bold leading-7 text-mint-200/90 md:text-[14px]">
                {course.subtitle}
              </p>
            )}
            {course.shortDescription && (
              <p className="mt-2 max-w-2xl text-[12px] leading-7 text-white/70 md:text-[13px]">
                {course.shortDescription}
              </p>
            )}

            {/* علائمِ حیاتی — یک ردیفِ چیپِ شیشه‌ای به‌جای چهار جعبه‌ی بزرگ */}
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {meta.map((m) => (
                <span
                  key={m.label}
                  className="inline-flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/[.05] px-3.5 backdrop-blur-sm"
                >
                  <m.icon className="h-3.5 w-3.5 text-mint-300" aria-hidden="true" />
                  <span className="text-[12.5px] font-black tabular-nums text-white">
                    {m.value}
                  </span>
                  <span className="text-[10.5px] font-bold text-white/55">{m.label}</span>
                </span>
              ))}
            </div>

            {/* مدرس — چیپِ فشرده با آلبومِ پرتره؛ در موبایل باندِ
                «استاد|آزمون» همین اطلاعات را می‌دهد، پس اینجا حذف می‌شود */}
            <div className="mt-5 hidden min-w-0 max-w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3.5 py-2.5 backdrop-blur-sm lg:inline-flex">
              <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-brand-50 ring-2 ring-white/20">
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
                  size={40}
                />
              </span>
              <span className="min-w-0">
                <span className="block text-[10px] font-bold text-white/50">مدرس کلاس</span>
                <span className="block truncate text-[12.5px] font-extrabold text-white">
                  {course.instructor}
                </span>
              </span>
              <a
                href="#instructor"
                className="ms-1 shrink-0 rounded-lg bg-white/10 px-2.5 py-1.5 text-[10.5px] font-extrabold text-mint-200 ring-1 ring-white/10 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-300"
              >
                رزومه
              </a>
            </div>

            {/* لنگرهای راهنما — تصمیمِ واقعی در کارتِ وضعیت رخ می‌دهد */}
            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <a
                href="#class-deck"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-mint-500 px-5 text-[13px] font-extrabold text-ink-950 shadow-lg shadow-mint-900/40 transition-all hover:bg-mint-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-200 active:scale-[.98]"
              >
                <Rocket className="h-4 w-4" aria-hidden="true" />
                شروع مسیر — رایگان
              </a>
              <a
                href="#journey"
                className="inline-flex h-11 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 text-[13px] font-extrabold text-white/90 backdrop-blur-sm transition-colors hover:border-mint-400/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-300"
              >
                <Route className="h-4 w-4 text-mint-300" aria-hidden="true" />
                نقشه‌ی جلسات
              </a>
            </div>
          </div>

          {/* ── کاور + پخشِ معرفی ── */}
          <div className="relative">
            <div className="relative aspect-[16/10] overflow-hidden rounded-[20px] border border-white/10 shadow-[0_28px_64px_-28px_rgba(0,0,0,.75)] ring-1 ring-white/10">
              <SmartImage
                src={course.coverUrl}
                alt={`کاور کلاس ${course.title}`}
                variant="course"
                fill
                sizes="(min-width: 1024px) 36vw, 100vw"
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
              <CourseCoverAlbumButton
                slides={mediaSlides}
                title={course.title}
                subtitle={{
                  label: 'گالری کلاس',
                  value: course.categoryTitle ?? 'قرارگاه آموزشی',
                }}
              />
              {course.lessonsCount > 0 && (
                <span className="absolute bottom-3 right-3 hidden h-7 items-center gap-1.5 rounded-full bg-black/55 px-3 text-[11px] font-bold text-white ring-1 ring-white/20 backdrop-blur-sm sm:inline-flex">
                  <ListVideo className="h-3.5 w-3.5" aria-hidden="true" />
                  {fa(course.lessonsCount)} جلسه‌ی ساخت‌یافته
                </span>
              )}
            </div>
            {/* متا: ردیفِ اعتمادِ زیرِ کاور آگاهانه حذف شد —
                همان‌اطلاعات در چیپ‌های شیشه‌ای + کارتِ مشخصاتِ ریل
                تکرار می‌شد؛ حذفش هیروی موبایل را ~۴۰px کوتاه کرد. */}
          </div>
        </div>
      </div>
    </section>
  );
}
