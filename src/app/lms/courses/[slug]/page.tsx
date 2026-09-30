import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { siteConfig } from '@/lib/site';
import { teaserText } from '@/lib/lms-shared';
import { fetchLmsCourseDetail, fetchLmsRelatedCourses } from '@/lib/lms-data';
import { CourseHero } from '@/components/lms/course/CourseHero';
import { CourseClassroom } from '@/components/lms/course/CourseClassroom';
import { CourseInstructor } from '@/components/lms/course/CourseInstructor';
import { CourseCertificateBand } from '@/components/lms/course/CourseCertificateBand';
import { RelatedCourses } from '@/components/lms/course/RelatedCourses';
import { EmptyState } from '@/components/home/EmptyState';
import type { LmsCourseDetail } from '@/lib/lms-shared';
import { normalizeRouteSlug } from '@/lib/route-slug';

/**
 * ═══════════════════════════════════════════════════════════════════
 * /lms/courses/<slug> — صفحه‌ی جزئیاتِ کلاس (بازطراحیِ متراکم)
 *
 *   چیدمانِ جدید پاسخِ ریشه‌ای به چهار گلایه است:
 *     ۱) طولِ اغراق‌آمیز: هفت سکشنِ کش‌آمده‌ی قبلی به چهار باندِ متراکم
 *        فروکاسته شده — هیروی جمع‌وجور (بدونِ جعبه‌های آماریِ بزرگ)،
 *        «کنسول کلاس»ی دوستونه (محتوا + ریلِ چسبانِ وضعیت)، باندِ
 *        دوتاییِ استاد/آزمون‌وگواهی، و در نهایت مرتبط‌ها. باندِ CTAی
 *        تیره‌ی پایانی حذف شد چون ریلِ وضعیت همان کار را بهتر می‌کند.
 *     ۲) ثبت‌نامِ غیرجذاب → CourseStatusCard با ماشینِ حالتِ کامل.
 *     ۳) نوارِ پیشرفت → حلقه + نوارِ سگمنتیِ واقعی (فیکسِ سرویس در بک).
 *     ۴) جلساتِ گم → CourseJourneyMap: تایم‌لاینِ لینک‌دار و وضعیت‌دار.
 *
 *   قراردادِ مصرف‌شده از backend (بدونِ تغییر — فازِ صفر):
 *     • GET /lms/courses/<slug>/          (AllowAny)
 *     • GET /lms/courses/<slug>/quiz/     (احرازشده — QuizMetaPanel)
 *     • POST /lms/courses/<slug>/enroll/  (احرازشده — StatusCard)
 *     • GET /lms/me/enrollments/[id]/     (احرازشده — CourseClassroom)
 *
 *   قواعدِ صفحه:
 *     ۱) سیاستِ آدرسِ خارجی: فقط آنچه classifyVideoUrl به native-embedِ
 *        شناخته‌شده صادر کند رندر می‌شود.
 *     ۲) زبانِ بصریِ هاب: تیره (هیرو) ← سفید (کنسول) ← خاکستری (استاد/
 *        آزمون) ← مذاب به سفید (مرتبط‌ها) — به‌هم‌نخورده و آشنا.
 *     ۳) حالت‌های صادقانه: ۴۰۴ ⇒ notFound؛ قطعی شبکه ⇒ EmptyState با
 *        تلاشِ دوباره؛ auth/fetch در کلاینت یک‌بار و فقط یک‌بار.
 * ═══════════════════════════════════════════════════════════════════
 */

export const dynamic = 'force-dynamic';

const canonicalOf = (slug: string) => `/lms/courses/${encodeURIComponent(slug)}`;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const slug = normalizeRouteSlug((await params).slug);
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
  const slug = normalizeRouteSlug((await params).slug);
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
      {/* هیروی جمع‌وجور — متن، چیپ‌های حیاتی، لنگرهای شروع/نقشه، کاور سینمایی */}
      <CourseHero course={course} />

      {/* کنسول کلاس — نقشه‌ی مسیر + ریلِ چسبانِ وضعیت/ثبت‌نام (قلبِ بازطراحی) */}
      <section className="py-8 md:py-14">
        <div className="container-edge">
          <CourseClassroom course={course} />
        </div>
      </section>

      {/* باندِ دوتایی — مدرس + آزمون و گواهی، هم‌قد و جمع‌وجور */}
      <section className="section-alt py-8 md:py-14">
        <div className="container-edge grid items-stretch gap-5 md:grid-cols-2">
          <CourseInstructor course={course} />
          <CourseCertificateBand slug={course.slug} />
        </div>
      </section>

      {/* کلاس‌های مرتبط — گذرِ مذاب از خاکستری به سفید (الگوی هاب) */}
      <section className="section-melt py-8 md:py-16">
        <div className="container-edge">
          <RelatedCourses course={course} related={related} />
        </div>
      </section>

      <CourseJsonLd course={course} />
    </main>
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
