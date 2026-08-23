"use client";

import { LockKeyhole, LoaderCircle, PlayCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AuthAlert } from "@/components/auth/AuthUI";
import { apiFetch, firstErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/use-auth";

type Lesson = {
  id: number;
  slug: string;
  title: string;
  video_provider: string;
  video_url?: string;
  embed_url?: string;
  duration_seconds: number;
  attachment_title?: string;
  attachment_file?: string | null;
  is_preview: boolean;
};
type MediaAccess = {
  media_kind: string;
  provider: string;
  url: string;
  expires_in_seconds?: number;
};

export function LessonPlayer({
  lesson,
  courseSlug,
}: {
  lesson: Lesson;
  courseSlug: string;
}) {
  const auth = useAuth();
  const router = useRouter();
  const [media, setMedia] = useState<MediaAccess | null>(
    lesson.is_preview && lesson.video_url
      ? {
          media_kind: "video",
          provider: lesson.video_provider,
          url: lesson.video_url,
        }
      : null,
  );
  const [loading, setLoading] = useState(false);
  const [securedAccess, setSecuredAccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastProgressSecond = useRef(0);

  const loadMedia = async () => {
    if (!auth.isAuthenticated) {
      router.push(
        `/auth/login?next=${encodeURIComponent(`/lms/courses/${courseSlug}/lessons/${lesson.slug}`)}`,
      );
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const access = await apiFetch<MediaAccess>(
        `/lms/lessons/${lesson.id}/media/video/`,
        { cache: "no-store" },
      );
      setMedia(access);
      setSecuredAccess(true);
    } catch (cause) {
      setError(
        firstErrorMessage(cause) ||
          "دسترسی به ویدئوی جلسه صادر نشد. ابتدا در دوره ثبت‌نام کنید.",
      );
    } finally {
      setLoading(false);
    }
  };

  const recordProgress = (video: HTMLVideoElement, force = false) => {
    if (!securedAccess) return;
    const second = Math.max(0, Math.floor(video.currentTime));
    if (!force && second - lastProgressSecond.current < 15) return;
    lastProgressSecond.current = second;
    void apiFetch(`/lms/lessons/${lesson.id}/progress/`, {
      method: "POST",
      body: JSON.stringify({
        watched_seconds: second,
        last_position_seconds: second,
      }),
      cache: "no-store",
    }).catch(() => undefined);
  };

  useEffect(() => {
    if (!lesson.is_preview && auth.isAuthenticated && !media) void loadMedia();
  }, [auth.isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className="overflow-hidden rounded-[2rem] bg-ink-950 shadow-card">
      {media?.url ? (
        <video
          src={media.url}
          controls
          playsInline
          preload="metadata"
          onTimeUpdate={(event) => recordProgress(event.currentTarget)}
          onEnded={(event) => recordProgress(event.currentTarget, true)}
          className="aspect-video w-full bg-black object-contain"
        />
      ) : (
        <div className="flex aspect-video flex-col items-center justify-center p-6 text-center text-white">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
            {loading ? (
              <LoaderCircle className="h-7 w-7 animate-spin" />
            ) : (
              <LockKeyhole className="h-7 w-7" />
            )}
          </span>
          <h2 className="mt-5 text-xl font-black text-white">
            این جلسه برای اعضای دوره است
          </h2>
          <p className="mt-2 text-sm font-medium text-white/60">
            پس از ورود و ثبت‌نام رایگان، ویدئو از مسیر امن در دسترس قرار
            می‌گیرد.
          </p>
          <button
            type="button"
            onClick={loadMedia}
            disabled={loading}
            className="mt-5 btn bg-white text-brand-800 btn-md"
          >
            <PlayCircle className="h-4 w-4" /> دریافت دسترسی
          </button>
        </div>
      )}
      {error && (
        <div className="bg-white p-4">
          <AuthAlert>{error}</AuthAlert>
        </div>
      )}
    </section>
  );
}
