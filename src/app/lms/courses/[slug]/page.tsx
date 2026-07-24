import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getCourse, type LMSCourseDetail } from '@/lib/lms';
import { absoluteMediaUrl, formatPersianNumber } from '@/lib/utils';
import { siteConfig } from '@/lib/site';
import { PageHeader } from '@/components/ui/PageHeader';
import { SmartImage } from '@/components/ui/SmartImage';
import { ApiError } from '@/lib/api';

import { EnrollCTA } from './EnrollCTA';

type Props = { params: Promise<{ slug: string }> };
export const revalidate = 60;

const LEVEL: Record<string, string> = {
  beginner: 'مقدماتی', intermediate: 'متوسط', advanced: 'پیشرفته', professional: 'حرفه‌ای',
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const c = await getCourse(slug);
    return {
      title: `${c.title} — ${siteConfig.name}`,
      description: (c.short_description || c.description || '').slice(0, 160),
      alternates: { canonical: `/lms/courses/${slug}` },
      openGraph: {
        title: c.title,
        images: c.cover_image ? [{ url: absoluteMediaUrl(c.cover_image) as string }] : undefined,
      },
    };
  } catch {
    return { title: `دوره — ${siteConfig.name}`, robots: { index: false, follow: true } };
  }
}

export default async function CourseDetailPage({ params }: Props) {
  const { slug } = await params;

  let course: LMSCourseDetail;
  try {
    course = await getCourse(slug);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const lessons = (course.lessons ?? []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const totalDuration = lessons.reduce((s, l) => s + (l.duration_seconds ?? 0), 0)
                     || course.estimated_duration_seconds || 0;

  return (
    <>
      <PageHeader
        eyebrow="قرارگاه آموزشی"
        crumbs={[
          { label: 'خانه', href: '/' },
          { label: 'قرارگاه آموزشی', href: '/#education' },
          course.category ? { label: course.category.title, href: `/lms?category=${encodeURIComponent(course.category.slug)}` } : { label: 'دوره' },
          { label: course.title },
        ]}
        title={course.title}
        description={course.subtitle || course.short_description || undefined}
      />

      <section className="section-y bg-white">
        <div className="container-edge grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-6 lg:gap-10">
          {/* ── Main ────────────────────────────────────────────── */}
          <div className="min-w-0 space-y-6">
            {/* Cover */}
            <div className="relative aspect-[16/9] rounded-[28px] overflow-hidden bg-ink-100 ring-1 ring-ink-100">
              <SmartImage
                src={absoluteMediaUrl(course.cover_image)}
                alt={course.title}
                variant="course"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 66vw"
                className="object-cover"
              />
              {course.intro_video_url && (
                <a
                  href={course.intro_video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-0 flex items-center justify-center bg-black/25 hover:bg-black/40 transition-colors group"
                  aria-label="پخش تیزر دوره"
                >
                  <span className="w-16 h-16 rounded-full bg-white/95 text-brand-600 flex items-center justify-center shadow-[0_10px_28px_-4px_rgba(0,0,0,.5)] group-hover:scale-110 transition-transform">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="6,4 20,12 6,20"/></svg>
                  </span>
                </a>
              )}
            </div>

            {/* Meta chips */}
            <div className="flex flex-wrap items-center gap-2">
              {course.level && (
                <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-brand-50 text-brand-700 text-[12px] font-extrabold ring-1 ring-brand-100">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.7 4 3 6 3s6-1.3 6-3v-5"/></svg>
                  {LEVEL[course.level] ?? course.level}
                </span>
              )}
              {lessons.length > 0 && (
                <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-ink-50 text-ink-700 text-[12px] font-extrabold ring-1 ring-ink-100">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="6,4 20,12 6,20"/></svg>
                  {formatPersianNumber(lessons.length)} درس
                </span>
              )}
              {totalDuration > 0 && (
                <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-ink-50 text-ink-700 text-[12px] font-extrabold ring-1 ring-ink-100">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {formatDuration(totalDuration)}
                </span>
              )}
              {course.language && (
                <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-ink-50 text-ink-700 text-[12px] font-extrabold ring-1 ring-ink-100">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                  {course.language}
                </span>
              )}
              {course.enrollments_count ? (
                <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-mint-500/10 text-mint-700 text-[12px] font-extrabold ring-1 ring-mint-500/20">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  {formatPersianNumber(course.enrollments_count)} یادگیرنده
                </span>
              ) : null}
            </div>

            {/* Description */}
            {course.description && (
              <div className="rounded-[24px] border border-ink-100 bg-white p-5 md:p-7">
                <h2 className="text-[16px] md:text-[18px] font-extrabold text-ink-900 mb-3">درباره‌ی این دوره</h2>
                <div className="prose prose-sm md:prose-base max-w-none text-ink-700 leading-8 rtl" style={{ whiteSpace: 'pre-wrap' }}>
                  {course.description}
                </div>
              </div>
            )}

            {/* Lessons */}
            {lessons.length > 0 && (
              <div className="rounded-[24px] border border-ink-100 bg-white p-5 md:p-6">
                <div className="flex items-baseline justify-between mb-3">
                  <h2 className="text-[16px] md:text-[17px] font-extrabold text-ink-900">درس‌ها</h2>
                  <span className="text-[11.5px] text-ink-500 font-bold tabular-nums">
                    {formatPersianNumber(lessons.length)} درس · {formatDuration(totalDuration)}
                  </span>
                </div>
                <ol className="space-y-1.5">
                  {lessons.map((l, idx) => (
                    <li key={l.id}>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-ink-50 hover:bg-brand-50/60 transition-colors">
                        <span className="w-8 h-8 rounded-lg bg-white text-brand-600 flex items-center justify-center font-extrabold text-[12px] tabular-nums shrink-0">
                          {formatPersianNumber(idx + 1)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13.5px] font-extrabold text-ink-900 truncate">{l.title}</p>
                          {l.duration_seconds ? (
                            <p className="text-[11px] text-ink-500 tabular-nums mt-0.5">{formatDuration(l.duration_seconds)}</p>
                          ) : null}
                        </div>
                        {l.is_free_preview ? (
                          <span className="inline-flex items-center gap-1 h-6 px-2 rounded-full bg-mint-500 text-white text-[10.5px] font-extrabold shrink-0">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="6,4 20,12 6,20"/></svg>
                            پیش‌نمایش رایگان
                          </span>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-ink-400 shrink-0"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          {/* ── Rail ───────────────────────────────────────────── */}
          <aside className="lg:sticky lg:top-24 lg:self-start space-y-4">
            <EnrollCTA slug={slug} courseTitle={course.title} />

            {/* Instructor */}
            {course.instructor_name && (
              <div className="rounded-[24px] border border-ink-100 bg-white p-5">
                <div className="flex items-center gap-3">
                  <div className="relative w-14 h-14 rounded-full overflow-hidden ring-2 ring-white shadow-soft shrink-0">
                    <SmartImage
                      src={absoluteMediaUrl(course.instructor_avatar)}
                      alt={course.instructor_name}
                      variant="avatar"
                      quietSkeleton
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-extrabold text-brand-600 uppercase tracking-wider">مدرس</p>
                    <p className="text-[14px] font-extrabold text-ink-900 truncate">{course.instructor_name}</p>
                  </div>
                </div>
                {course.instructor_bio && (
                  <p className="mt-3 text-[12.5px] text-ink-600 leading-7" style={{ whiteSpace: 'pre-wrap' }}>
                    {course.instructor_bio}
                  </p>
                )}
              </div>
            )}

            {/* Category link */}
            {course.category && (
              <Link
                href={`/lms?category=${encodeURIComponent(course.category.slug)}`}
                className="block rounded-[20px] bg-ink-50 p-4 border border-ink-100 hover:bg-brand-50 transition-colors"
              >
                <p className="text-[11.5px] font-extrabold text-ink-500 uppercase tracking-wider mb-1">دسته‌بندی</p>
                <div className="flex items-center justify-between">
                  <span className="text-[13.5px] font-extrabold text-ink-900 truncate">{course.category.title}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="text-brand-600 shrink-0"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                </div>
              </Link>
            )}
          </aside>
        </div>
      </section>
    </>
  );
}

function formatDuration(seconds: number): string {
  if (!seconds) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${formatPersianNumber(h)} ساعت ${formatPersianNumber(m)} دقیقه`;
  if (h > 0) return `${formatPersianNumber(h)} ساعت`;
  return `${formatPersianNumber(m)} دقیقه`;
}
