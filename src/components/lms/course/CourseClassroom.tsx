'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpenText } from 'lucide-react';
import { apiFetch, isApiError } from '@/lib/api';
import { hasSession, onAuthChange } from '@/lib/auth-tokens';
import {
  fetchMyEnrollment,
  fetchQuizMeta,
  type LessonProgressEntry,
  type QuizMeta,
} from '@/lib/lms-lesson';
import type { LmsCourseDetail, LmsLesson } from '@/lib/lms-shared';
import { AuthModal } from '@/components/auth/AuthModal';
import { EnrollConfirmModal } from '@/components/lms/enroll/EnrollConfirmModal';
import { CourseStatusCard } from './CourseStatusCard';
import { CourseFactsCard } from './CourseFactsCard';
import { CourseJourneyMap } from './CourseJourneyMap';
import { CourseAboutText } from './CourseAboutText';

/**
 * ═══════════════════════════════════════════════════════════════════
 * «کنسول کلاس» — مغزِ صفحه‌ی جزئیات آموزش؛ پاسخِ ریشه‌ای به چهار
 * گلایه‌ی مشتری:
 *
 *   ۱) «صفحه خیلی دراز است» → چیدمانِ دوستونه‌ی فشرده: ستونِ محتوا
 *      (درباره + نقشه‌ی مسیر) کنارِ ریلِ چسبانِ وضعیت؛ هفت سکشنِ
 *      پشت‌سرهمِ قدیمی به سه باندِ متراکم فروکاسته شده است.
 *   ۲) «ثبت‌نام ساده و غیرجذاب است» → کارتِ وضعیتِ تیره با ماشینِ
 *      حالتِ کامل (مهمان/بررسی/آماده/عضو/خطا/پروفایل‌ناتمام) + جشنِ
 *      «ثبت‌نام کامل شد» و مزیت‌های شفاف.
 *   ۳) «نوار پیشرفت بد/مشکل‌دار است» → حلقه‌ی پیشرفت + نوارِ سگمنتیِ
 *      جلسه‌به‌جلسه با عددهای واقعیِ سرور؛ درصدِ اشتباه هم در سرویسِ
 *      بک‌اند از ریشه ترمیم شد (میانگینِ جلسه‌محور).
 *   ۴) «لیست جلسات معلوم نیست» → «نقشه‌ی مسیر»: تایم‌لاینِ شماره‌دار
 *      با وضعیتِ هر جلسه (قفل/رایگان/جاری/نیمه‌کاره/کامل)، لینکِ
 *      مستقیم به کنسولِ جلسه، نشانِ «از اینجا ادامه بده» و گرهِ
 *      پایانیِ «آزمون و گواهی».
 *
 * تمامِ وضعیتِ احراز/ثبت‌نام همین‌جا یک‌بار گرفته می‌شود و به هر دو
 * ستون تزریق می‌شود — هیچ فچِ دوبله‌ای در کار نیست.
 * ═══════════════════════════════════════════════════════════════════
 */

export type CourseViewerState =
  | { kind: 'boot' }
  | { kind: 'guest' }
  | { kind: 'checking' }
  | { kind: 'ready' }
  | {
      kind: 'enrolled';
      percent: number;
      status: string;
      progressMap: Map<number, LessonProgressEntry>;
      quizMeta: QuizMeta | null;
    }
  | { kind: 'profile-incomplete'; message: string }
  | { kind: 'error'; message: string };

export type CourseJourney = {
  lessons: LmsLesson[];
  /** جلسه‌ای که دکمه‌ی «ادامه/شروع» باید به آن برود. */
  continueLessonId: number | null;
  doneCount: number;
  percent: number;
};

const sortLessons = (lessons: LmsLesson[]) => [...lessons].sort((a, b) => a.order - b.order);

export function CourseClassroom({ course }: { course: LmsCourseDetail }) {
  const router = useRouter();
  const [viewer, setViewer] = useState<CourseViewerState>({ kind: 'boot' });
  const [posting, setPosting] = useState(false);
  const [justNow, setJustNow] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!hasSession()) {
      if (alive.current) setViewer({ kind: 'guest' });
      return;
    }
    setViewer((v) =>
      v.kind === 'enrolled' || v.kind === 'profile-incomplete' || v.kind === 'error'
        ? v
        : { kind: 'checking' },
    );
    const mine = await fetchMyEnrollment(course.slug);
    if (!alive.current) return;
    if (!mine) {
      setViewer({ kind: 'ready' });
      return;
    }
    const quizMeta = await fetchQuizMeta(course.slug);
    if (!alive.current) return;
    setViewer({
      kind: 'enrolled',
      percent: mine.summary.progressPercent,
      status: mine.summary.status,
      progressMap: mine.progressMap,
      quizMeta,
    });
  }, [course.slug]);

  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => onAuthChange(() => void refresh()), [refresh]);

  // هر دکمه‌ی «ثبت‌نام» اول پنجره‌ی تأیید را باز می‌کند؛ POST فقط پس از تأیید.
  const askEnroll = useCallback(() => {
    if (!hasSession()) {
      setAuthOpen(true);
      return;
    }
    setConfirmError(null);
    setConfirmOpen(true);
  }, []);

  const enroll = useCallback(async () => {
    setPosting(true);
    setConfirmError(null);
    try {
      await apiFetch(`/lms/courses/${encodeURIComponent(course.slug)}/enroll/`, {
        method: 'POST',
        cache: 'no-store',
      });
      const mine = await fetchMyEnrollment(course.slug);
      if (!alive.current) return;
      setPosting(false);
      setConfirmOpen(false);
      setJustNow(true);
      if (mine) {
        const quizMeta = await fetchQuizMeta(course.slug);
        if (!alive.current) return;
        setViewer({
          kind: 'enrolled',
          percent: mine.summary.progressPercent,
          status: mine.summary.status,
          progressMap: mine.progressMap,
          quizMeta,
        });
      } else {
        setViewer({
          kind: 'enrolled',
          percent: 0,
          status: 'active',
          progressMap: new Map(),
          quizMeta: null,
        });
      }
      router.refresh(); // شمارنده‌های SSR (یادگیرنده/فارغ‌التحصیل) تازه شوند
      window.setTimeout(() => alive.current && setJustNow(false), 1900);
    } catch (err) {
      if (!alive.current) return;
      setPosting(false);
      const msg = isApiError(err) ? err.message : '';
      setConfirmError(msg || 'ثبت‌نام برقرار نشد؛ چند لحظه‌ی دیگر دوباره تلاش کن.');
      if (isApiError(err) && err.status === 403 && msg.includes('پروفایل')) {
        setConfirmOpen(false);
        setViewer({ kind: 'profile-incomplete', message: msg });
      } else {
        setViewer({
          kind: 'error',
          message: msg || 'ثبت‌نام برقرار نشد؛ چند لحظه‌ی دیگر دوباره تلاش کن.',
        });
      }
    }
  }, [course.slug, router]);

  /* ── مدلِ مشترکِ مسیر (ریل و نقشه هر دو از همین می‌خورند) ─────────── */
  const journey: CourseJourney = useMemo(() => {
    const lessons = sortLessons(course.lessons);
    if (viewer.kind !== 'enrolled') {
      return { lessons, continueLessonId: null, doneCount: 0, percent: 0 };
    }
    let doneCount = 0;
    for (const l of lessons) {
      if (viewer.progressMap.get(l.id)?.isCompleted) doneCount += 1;
    }
    const firstOpen = lessons.find((l) => !viewer.progressMap.get(l.id)?.isCompleted);
    const continueLessonId = (firstOpen ?? lessons[lessons.length - 1])?.id ?? null;
    return { lessons, continueLessonId, doneCount, percent: viewer.percent };
  }, [course.lessons, viewer]);

  const continueLesson = journey.lessons.find((l) => l.id === journey.continueLessonId) ?? null;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,368px)] lg:gap-9 xl:gap-10">
      {/* ── ستونِ محتوا — درباره + نقشه‌ی مسیر (در RTL ستونِ نخست = راست) ── */}
      <div className="min-w-0">
        {course.description?.trim() && (
          <section aria-label="درباره‌ی این کلاس" className="mb-8">
            <p className="inline-flex items-center gap-1.5 text-[12px] font-extrabold text-mint-700">
              <BookOpenText className="h-3.5 w-3.5" aria-hidden="true" />
              این کلاس برای چیست؟
            </p>
            <CourseAboutText text={course.description.trim()} />
          </section>
        )}

        <CourseJourneyMap course={course} viewer={viewer} journey={journey} />
      </div>

      {/* ── ریلِ وضعیت — چسبان در دسکتاپ، نخست در موبایل ─────────────── */}
      <aside className="min-w-0 max-lg:order-first" aria-label="وضعیت و ثبت‌نام کلاس">
        <div className="flex flex-col gap-4 lg:sticky lg:top-[104px]">
          <CourseStatusCard
            course={course}
            viewer={viewer}
            journey={journey}
            continueLesson={continueLesson}
            posting={posting}
            justNow={justNow}
            onEnroll={askEnroll}
            onRetry={() => void refresh()}
          />
          <CourseFactsCard course={course} />
        </div>
      </aside>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} initialView="signup" />
      <EnrollConfirmModal
        open={confirmOpen}
        course={course}
        busy={posting}
        error={confirmError}
        onConfirm={() => void enroll()}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  );
}
