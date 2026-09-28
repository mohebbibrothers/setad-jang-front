import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BookOpenText } from 'lucide-react';
import { siteConfig } from '@/lib/site';
import { teaserText } from '@/lib/lms-shared';
import { fetchLmsCourseDetail, fetchLmsRelatedCourses } from '@/lib/lms-data';
import { CourseHero } from '@/components/lms/course/CourseHero';
import { CourseSyllabus } from '@/components/lms/course/CourseSyllabus';
import { CourseInstructor } from '@/components/lms/course/CourseInstructor';
import { CourseCertificateBand } from '@/components/lms/course/CourseCertificateBand';
import { RelatedCourses } from '@/components/lms/course/RelatedCourses';
import { CourseEnrollCta } from '@/components/lms/course/CourseEnrollCta';
import { EmptyState } from '@/components/home/EmptyState';
import type { LmsCourseDetail } from '@/lib/lms-shared';

/**
 * ═══════════════════════════════════════════════════════════════════
 * /lms/courses/<slug> — صفحه‌ی جزئیاتِ کلاس
 *
 *   قراردادِ مصرف‌شده از backend (فازِ صفر — مطالعه‌ی خط‌به‌خطِ apps/lms):
 *     • GET /lms/courses/<slug>/          (AllowAny + کشِ وارینت)
 *       → CourseDetailSerializer: همه‌ی فیلدهای خلاصه + description،
 *         instructor_bio، intro_video_url، lessons[] (LessonSummary —
 *         بدونِ مدیای gated؛ video_url/embed_url عمداً عمومی).
 *     • GET /lms/courses/<slug>/quiz/     (احرازشده — در QuizMetaPanel)
 *     • POST /lms/courses/<slug>/enroll/  (احرازشده — در CourseEnrollCta،
 *       با مدیریتِ دقیقِ ۴۰۳ِ پروفایل‌ناتمام / غیرقابل‌ثبت‌نام)
 *     • GET /lms/me/enrollments/          (احرازشده — وضعیتِ قبلِ کلیک)
 *     • گواهیِ راستی‌آزما (در CourseCertificateBand → /lms#certificate-verify)
 *
 *   قواعدِ صفحه:
 *     ۱) سیاستِ آدرسِ خارجی: هیچ لینک/آی‌فریمِ خام از backend مستقیم رندر
 *        نمی‌شود؛ فقط آنچه classifyVideoUrl به native-embedِ شناخته‌شده
 *        صادر کند (قانونِ کلاینت برای لینک‌های کاربر‌ساخته).
 *     ۲) باندهای رنگیِ بی‌وقفه: تیره (هیرو) → سفید (درباره) → خاکستری
 *        (سیلابوس) → سفید (مدرس) → خاکستری (آزمون/گواهی) → مذاب به سفید
 *        (مرتبط‌ها) → تیره (CTAی پایانی) — همان زبانِ هاب، به‌هم‌نخورده.
 *     ۳) سه بُعد: محتوا (SSRِ کامل برای SEO)، تعامل (کلاینت فقط کجا که
 *        auth/ویدئو لازم است)، و ساختار (JSON-LDِ Course+Breadcrumb).
 *     ۴) حالت‌های صادقانه: ۴۰۴ ⇒ notFound سگمنت؛ قطعیِ شبکه ⇒ EmptyState
 *        با تلاشِ دوباره — هیچ‌وقت اسکلتِ بی‌نهایت یا داده‌ی جعلی.
 * ═══════════════════════════════════════════════════════════════════
 */

export const dynamic = 'force-dynamic';

const canonicalOf = (slug: string) => `/lms/courses/${encodeURIComponent(slug)}`;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await fetchLmsCourseDetail(slug);
  if (result.kind !== 'ok') return { title: 'کلاس یافت نشد' };
  const c = result.course;
  const description =
    c.shortDescription ||
    teaserText(c.description, 155) ||
    `کلاسِ رایگانِ «${c.title}» در قرارگاه آموزشیِ بعثت مردم — جلساتِ ساخت‌یافته، آزمونِ پایان دوره و گواهیِ راستی‌آزما.`;
  return {
    title: c.title,
    description,
    alternates: { canonical: canonicalOf(c.slug) },
    openGraph: {
      title: `${c.title} — قرارگاه آموزشی | بعثت مردم`,
      description,
      type: 'website',
      images: c.coverUrl ? [{ url: c.coverUrl }] : undefined,
    },
  };
}

export default async function LmsCourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await fetchLmsCourseDetail(slug);

  if (result.kind === 'not-found') notFound();

  if (result.kind === 'offline') {
    return (
      <main className="bg-white">
        <section className="section-y">
          <div className="container-edge">
            <div className="mx-auto max-w-xl">
              <EmptyState
                title="ارتباط با قرارگاه برقرار نشد"
                description="دریافت اطلاعات کلاس با خطا روبه‌رو شد؛ چند لحظه‌ی دیگر دوباره امتحان کن."
                iconPath="M22 10 12 5 2 10l10 5 10-5z M6 12v5c3 3 9 3 12 0v-5"
              />
              <p className="-mt-6 text-center">
                <Link
                  href={canonicalOf(slug)}
                  prefetch={false}
                  className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-brand-500 bg-white px-6 text-[13px] font-extrabold text-brand-700 transition-colors hover:bg-brand-50"
                >
                  تلاشِ دوباره
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const { course } = result;
  const related = await fetchLmsRelatedCourses(course);

  return (
    <main className="bg-white">
      {/* هیروی تیره — متن، آمار، CTAی ثبت‌نام و کادرِ مدرس / کاور+معرفی */}
      <CourseHero course={course} />

      {/* درباره‌ی کلاس — متنِ آزادِ ادمین (description) با تایپوگرافیِ خوانا */}
      {course.description && <AboutSection course={course} />}

      {/* سیلابوس — باندِ خاکستری؛ صفر جلسه ⇒ دعوتِ «رزرو صندلی» به #enroll-cta */}
      <section className="section-alt section-y">
        <div className="container-edge">
          <CourseSyllabus course={course} />
        </div>
      </section>

      {/* مدرس — باندِ سفید */}
      <section className="section-y">
        <div className="container-edge">
          <CourseInstructor course={course} />
        </div>
      </section>

      {/* آزمون + گواهی — باندِ خاکستری؛ پنلِ کوئیز زنده و احرازشده */}
      <section className="section-alt section-y">
        <div className="container-edge">
          <CourseCertificateBand slug={course.slug} />
        </div>
      </section>

      {/* کلاس‌های مرتبط — گذرِ مذاب از خاکستری به سفید (الگوی هاب) */}
      <section className="section-melt section-y">
        <div className="container-edge">
          <RelatedCourses course={course} related={related} />
        </div>
      </section>

      {/* CTAی پایانی — دعوتِ دوم، در آستانه‌ی خروج از صفحه */}
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
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-mint-500/15 blur-3xl"
        />
        <div className="container-edge relative py-12 md:py-16">
          <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
            <p className="text-[12px] font-extrabold text-mint-300">هنوز مرددی؟</p>
            <h2 className="mt-2 text-[24px] font-black leading-[1.4] md:text-[28px]">
              رزروی جایت در «{course.title}» فقط یک کلیک است
            </h2>
            <p className="mt-3 max-w-prose text-[12.5px] leading-7 text-white/65">
              ثبت‌نام رایگان است و هر زمان خواستی می‌توانی از ادامه‌ی مسیر انصراف بدهی؛ پس بهترین
              زمان برای شروع، همین حالاست.
            </p>
            <div className="mt-6 w-full max-w-sm">
              <CourseEnrollCta slug={course.slug} durationSeconds={course.durationSeconds} />
            </div>
          </div>
        </div>
      </section>

      <CourseJsonLd course={course} />
    </main>
  );
}

/* ── سکشنِ «درباره‌ی کلاس» ─────────────────────────────────────────── */
function AboutSection({ course }: { course: LmsCourseDetail }) {
  return (
    <section className="section-y">
      <div className="container-edge">
        <div className="mx-auto max-w-3xl">
          <div className="flex flex-col items-center text-center">
            <p className="inline-flex items-center gap-1.5 text-[12px] font-extrabold text-mint-700">
              <BookOpenText className="h-3.5 w-3.5" aria-hidden="true" />
              درباره‌ی کلاس
            </p>
            <h2 className="mt-1 text-[22px] font-black text-ink-900 md:text-[26px]">
              این کلاس چه قصدی دارد؟
            </h2>
          </div>
          <div className="relative mt-8 overflow-hidden rounded-[22px] border border-ink-100 bg-white p-7 shadow-[0_16px_40px_-30px_rgba(11,53,48,.3)] sm:p-10">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-0 top-0 h-full w-1.5 bg-gradient-to-b from-brand-400 via-mint-400 to-brand-500"
            />
            <p className="whitespace-pre-line text-[13.5px] leading-9 text-ink-700 md:text-[14px]">
              {course.description}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── داده‌ی ساخت‌یافته — Course + BreadcrumbList ─────────────────────── */
function CourseJsonLd({ course }: { course: LmsCourseDetail }) {
  const url = `${siteConfig.url}${canonicalOf(course.slug)}`;
  const crumbs: Array<{ name: string; item?: string }> = [
    { name: 'بعثت مردم', item: siteConfig.url },
    { name: 'آموزش‌ها', item: `${siteConfig.url}/lms` },
    ...(course.categoryTitle && course.categorySlug
      ? [
          {
            name: course.categoryTitle,
            item: `${siteConfig.url}/lms?category=${encodeURIComponent(course.categorySlug)}#courses`,
          },
        ]
      : []),
    { name: course.title },
  ];
  const workload = (() => {
    if (!course.durationSeconds) return undefined;
    const h = Math.floor(course.durationSeconds / 3600);
    const m = Math.round((course.durationSeconds % 3600) / 60);
    if (h === 0 && m === 0) return undefined;
    return `PT${h ? `${h}H` : ''}${m ? `${m}M` : ''}`;
  })();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Course',
            name: course.title,
            description:
              course.shortDescription ||
              teaserText(course.description, 300) ||
              `کلاسِ رایگانِ ${course.title} در قرارگاه آموزشیِ بعثت مردم`,
            url,
            inLanguage: 'fa',
            isAccessibleForFree: true,
            ...(course.coverUrl ? { image: [course.coverUrl] } : {}),
            ...(course.publishedAt ? { datePublished: course.publishedAt } : {}),
            provider: {
              '@type': 'Organization',
              name: siteConfig.organization.legalName,
              sameAs: siteConfig.url,
            },
            instructor: {
              '@type': 'Person',
              name: course.instructor,
              ...(course.instructorBio
                ? { description: teaserText(course.instructorBio, 200) }
                : {}),
              ...(course.instructorAvatarUrl ? { image: course.instructorAvatarUrl } : {}),
            },
            ...(course.lessonsCount > 0
              ? {
                  teaches: course.lessons
                    .slice(0, 30)
                    .map((l) => l.title)
                    .join('، '),
                }
              : {}),
            hasCourseInstance: {
              '@type': 'CourseInstance',
              courseMode: 'online',
              ...(workload ? { courseWorkload: workload } : {}),
            },
            offers: {
              '@type': 'Offer',
              price: 0,
              priceCurrency: 'IRR',
              availability: 'https://schema.org/InStock',
              category: 'Free',
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: crumbs.map((c, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: c.name,
              ...(c.item ? { item: c.item } : {}),
            })),
          }),
        }}
      />
    </>
  );
}
