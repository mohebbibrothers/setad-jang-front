import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { safeApiFetch } from "@/lib/api";
import { LessonPlayer } from "./LessonPlayer";

type Lesson = {
  id: number;
  title: string;
  slug: string;
  description?: string;
  order: number;
  video_provider: string;
  video_url?: string;
  embed_url?: string;
  duration_seconds: number;
  summary?: string;
  attachment_title?: string;
  attachment_file?: string | null;
  is_preview: boolean;
};

export const metadata: Metadata = {
  title: "جلسه آموزشی",
  robots: { index: false, follow: true },
};

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; lessonSlug: string }>;
}) {
  const { slug, lessonSlug } = await params;
  const lesson = await safeApiFetch<Lesson>(
    `/lms/courses/${encodeURIComponent(slug)}/lessons/${encodeURIComponent(lessonSlug)}/`,
    { revalidate: 300, tags: ["lms"] },
  );
  if (!lesson) notFound();
  return (
    <main className="min-h-[65vh] bg-ink-50 py-9">
      <div className="container-edge max-w-5xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/lms/courses/${slug}`}
            className="text-sm font-extrabold text-brand-700 hover:underline"
          >
            بازگشت به دوره
          </Link>
          {lesson.is_preview && (
            <span className="rounded-full bg-mint-100 px-3 py-1.5 text-xs font-extrabold text-mint-700">
              پیش‌نمایش رایگان
            </span>
          )}
        </div>
        <LessonPlayer lesson={lesson} courseSlug={slug} />
        <section className="mt-6 rounded-2xl border border-ink-100 bg-white p-6 shadow-soft">
          <h1 className="text-2xl font-black">{lesson.title}</h1>
          {lesson.description && (
            <p className="mt-4 whitespace-pre-line text-sm font-medium leading-8 text-ink-600">
              {lesson.description}
            </p>
          )}
          {lesson.summary && (
            <div className="mt-5 rounded-xl bg-brand-50 p-4 text-sm font-bold leading-8 text-brand-900">
              {lesson.summary}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
