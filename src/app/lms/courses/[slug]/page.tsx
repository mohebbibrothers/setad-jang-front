import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BookOpen,
  Clock3,
  GraduationCap,
  PlayCircle,
  UsersRound,
} from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { safeApiFetch } from "@/lib/api";
import { absoluteMediaUrl, formatPersianNumber } from "@/lib/utils";
import { CourseEnrollButton } from "./CourseEnrollButton";

type Lesson = {
  id: number;
  title: string;
  slug: string;
  description?: string;
  order: number;
  duration_seconds: number;
  is_preview: boolean;
};
type Course = {
  id: number;
  slug: string;
  title: string;
  subtitle?: string;
  short_description?: string;
  description: string;
  category: { title: string; slug: string };
  cover_image?: string | null;
  instructor_name: string;
  instructor_bio?: string;
  instructor_avatar?: string | null;
  level: string;
  is_featured: boolean;
  lessons_count: number;
  estimated_duration_seconds: number;
  enrollments_count: number;
  graduates_count: number;
  intro_video_url?: string;
  lessons?: Lesson[];
};

async function loadCourse(slug: string) {
  return safeApiFetch<Course>(`/lms/courses/${encodeURIComponent(slug)}/`, {
    revalidate: 300,
    tags: ["lms", `course:${slug}`],
    timeoutMs: 10_000,
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = await loadCourse(slug);
  return {
    title: course?.title || "دوره آموزشی",
    description:
      course?.short_description || course?.description?.slice(0, 160),
    alternates: { canonical: `/lms/courses/${encodeURIComponent(slug)}` },
  };
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await loadCourse(slug);
  if (!course) notFound();
  const lessons = course.lessons || [];
  const duration = Math.max(
    1,
    Math.round(course.estimated_duration_seconds / 60),
  );

  return (
    <main className="bg-ink-50 pb-16">
      <section className="bg-white py-9 md:py-14">
        <div className="container-edge">
          <Link
            href="/#education"
            className="text-sm font-extrabold text-brand-700 hover:underline"
          >
            بازگشت به آموزش‌ها
          </Link>
          <div className="mt-6 grid items-start gap-8 lg:grid-cols-[1.1fr_.9fr]">
            <div className="relative aspect-[16/10] overflow-hidden rounded-[2rem] bg-gold-50 shadow-card">
              <SmartImage
                src={absoluteMediaUrl(course.cover_image)}
                alt={course.title}
                variant="course"
                fill
                priority
                sizes="(max-width:1024px) 100vw, 58vw"
                className="object-cover"
              />
            </div>
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-gold-50 px-3 py-1.5 text-xs font-extrabold text-gold-700">
                  {course.category.title}
                </span>
                <span className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-extrabold text-brand-700">
                  {levelLabel(course.level)}
                </span>
              </div>
              <h1 className="mt-4 text-3xl font-black leading-[1.55] md:text-4xl">
                {course.title}
              </h1>
              {course.subtitle && (
                <p className="mt-3 text-sm font-bold leading-8 text-ink-500">
                  {course.subtitle}
                </p>
              )}
              <div className="mt-6 grid grid-cols-2 gap-3">
                <Metric
                  icon={<BookOpen />}
                  value={formatPersianNumber(course.lessons_count)}
                  label="جلسه"
                />
                <Metric
                  icon={<Clock3 />}
                  value={formatPersianNumber(duration)}
                  label="دقیقه"
                />
                <Metric
                  icon={<UsersRound />}
                  value={formatPersianNumber(course.enrollments_count)}
                  label="یادگیرنده"
                />
                <Metric
                  icon={<GraduationCap />}
                  value={formatPersianNumber(course.graduates_count)}
                  label="فارغ‌التحصیل"
                />
              </div>
              <div className="mt-7">
                <CourseEnrollButton slug={course.slug} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container-edge mt-8 grid gap-6 lg:grid-cols-[1fr_310px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-ink-100 bg-white p-6 shadow-soft md:p-8">
            <h2 className="text-xl font-black">درباره دوره</h2>
            <p className="mt-4 whitespace-pre-line text-sm font-medium leading-9 text-ink-700">
              {course.description}
            </p>
          </section>
          <section className="rounded-2xl border border-ink-100 bg-white p-6 shadow-soft md:p-8">
            <h2 className="text-xl font-black">جلسه‌های دوره</h2>
            <div className="mt-5 space-y-3">
              {lessons.length ? (
                lessons.map((lesson, index) => (
                  <Link
                    key={lesson.id}
                    href={`/lms/courses/${course.slug}/lessons/${lesson.slug}`}
                    className="group flex items-center gap-4 rounded-xl border border-ink-100 p-4 hover:border-brand-200 hover:bg-brand-50/30"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink-50 text-sm font-black text-ink-500 group-hover:bg-brand-100 group-hover:text-brand-700">
                      {formatPersianNumber(index + 1)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <strong className="block truncate text-sm text-ink-800">
                        {lesson.title}
                      </strong>
                      <small className="mt-1 block text-ink-400">
                        {Math.round(
                          lesson.duration_seconds / 60,
                        ).toLocaleString("fa-IR")}{" "}
                        دقیقه {lesson.is_preview ? "· پیش‌نمایش رایگان" : ""}
                      </small>
                    </span>
                    <PlayCircle className="h-5 w-5 text-brand-600" />
                  </Link>
                ))
              ) : (
                <p className="rounded-xl bg-ink-50 p-5 text-center text-sm font-bold text-ink-400">
                  جلسه‌ای منتشر نشده است.
                </p>
              )}
            </div>
          </section>
        </div>
        <aside className="h-fit rounded-2xl border border-ink-100 bg-white p-5 shadow-soft">
          <h2 className="text-sm font-black">مدرس دوره</h2>
          <div className="mt-4 flex items-center gap-3">
            <span className="relative h-14 w-14 overflow-hidden rounded-2xl bg-ink-50">
              <SmartImage
                src={absoluteMediaUrl(course.instructor_avatar)}
                alt={course.instructor_name}
                variant="avatar"
                fill
                sizes="56px"
                className="object-cover"
              />
            </span>
            <strong className="text-sm">{course.instructor_name}</strong>
          </div>
          {course.instructor_bio && (
            <p className="mt-4 text-xs font-medium leading-7 text-ink-500">
              {course.instructor_bio}
            </p>
          )}
        </aside>
      </div>
    </main>
  );
}

function levelLabel(level: string) {
  return (
    (
      {
        beginner: "مقدماتی",
        intermediate: "متوسط",
        advanced: "پیشرفته",
        professional: "حرفه‌ای",
      } as Record<string, string>
    )[level] || level
  );
}
function Metric({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-ink-50 p-3">
      <span className="text-brand-700 [&>svg]:h-5 [&>svg]:w-5">{icon}</span>
      <div>
        <strong className="block text-sm">{value}</strong>
        <small className="text-ink-400">{label}</small>
      </div>
    </div>
  );
}
