/**
 * لایه‌ی داده‌ی «صفحه‌ی جلسه‌ی آموزشی» — کنسول یادگیری.
 *
 * قرارداد بک‌اند (از مطالعه‌ی کدِ apps/lms):
 *   PUBLIC (AllowAny):
 *     • GET /lms/courses/<slug>/lessons/<lesson_slug>/  → خلاصه‌ی جلسه
 *   AUTH (+ثبت‌نام؛ رسانه‌ی جلساتِ پیش‌نمایش از ثبت‌نام معاف است):
 *     • GET  /lms/lessons/<id>/media/<video|document|article|attachment>/
 *     • POST /lms/lessons/<id>/progress/  {watched_seconds?, last_position_seconds?, mark_completed?}
 *         — video/audio: درصد از تماشا + تکمیلِ خودکار در ۹۰٪ (mark_completed ممنوع)
 *         — document/article: درصد فقط با mark_completed=true (۰→۱۰۰)
 *     • GET/POST /lms/lessons/<id>/questions/ + answers/accept (فقط ثبت‌نام‌شده)
 *     • quiz: GET meta / POST start / GET attempt / POST submit
 *   AUTH (بدون شرط ثبت‌نام):
 *     • GET /lms/me/enrollments/ + /lms/me/enrollments/<id>/
 *
 * نکته‌ی انکدینگ: همه‌ی فراخوان‌های این فایل با «شناسه‌ی عددی» کار می‌کنند
 * (به‌جز quiz meta/start که اسلاگِ نرمال‌شده از page می‌رسد و اینجا یک‌بار
 * encodeURIComponent می‌شود) — هیچ مسیر دابل‌انکدی وجود ندارد.
 */
import { apiFetch, isApiError, safeApiFetch, type Paginated } from '@/lib/api';
import type { LmsCourseDetail, LmsLesson } from '@/lib/lms-shared';

/* ───── تایپ‌ها ───── */

export interface MyEnrollmentSummary {
  id: number;
  status: string;
  progressPercent: number;
  lastAccessedLessonId?: number | null;
}

export interface LessonProgressEntry {
  lessonId: number;
  watchedSeconds: number;
  durationSnapshot: number;
  progressPercent: number;
  isCompleted: boolean;
  lastPositionSeconds: number;
}

export interface LessonMediaPayload {
  media_kind: string;
  provider: 'uploaded_file' | 'direct_url' | 'embed' | 'inline' | string;
  url: string;
  expires_in_seconds: number | null;
  lesson_id: number;
  course_id: number;
  title?: string;
  body?: string;
}

export interface LessonQuestionAnswer {
  id: number;
  user_display: string;
  body: string;
  status: string;
  is_instructor_answer: boolean;
  is_accepted: boolean;
  created_at: string;
}

export interface LessonQuestion {
  id: number;
  user_id: number;
  user_display: string;
  title: string;
  body: string;
  status: string;
  is_pinned: boolean;
  is_answered: boolean;
  answer_count: number;
  last_activity_at: string;
  created_at: string;
  answers: LessonQuestionAnswer[];
}

export interface QuizMeta {
  id: number;
  course_id: number;
  title: string;
  description: string;
  time_limit_minutes: number;
  passing_score: string;
  max_attempts: number;
  retake_delay_days: number;
  questions_count: number;
}

export interface QuizAttemptOption {
  id: number;
  text: string;
  order: number;
}

export interface QuizAttemptQuestion {
  id: number;
  text: string;
  weight: string;
  options: QuizAttemptOption[];
}

export interface QuizAttemptAnswer {
  question_id: number;
  selected_option_id: number;
  is_correct: boolean | null;
  score_awarded: string;
  correct_option_id?: number;
  explanation?: string;
}

export interface QuizAttempt {
  id: number;
  quiz_id: number;
  course_id: number;
  attempt_number: number;
  status: 'in_progress' | 'submitted' | 'expired' | string;
  started_at: string;
  submitted_at: string | null;
  expires_at: string | null;
  score_percent: string | null;
  score_out_of_20: string | null;
  is_passed: boolean | null;
  questions: QuizAttemptQuestion[];
  answers: QuizAttemptAnswer[];
}

interface ApiEnrollmentRow {
  id: number;
  status: string;
  progress_percent: string | number;
  course: { id: number; slug: string };
}

interface ApiEnrollmentDetail extends ApiEnrollmentRow {
  last_accessed_lesson_id?: number | null;
  lesson_progress?: Array<{
    lesson: { id: number };
    watched_seconds: number;
    duration_seconds_snapshot: number;
    progress_percent: string | number;
    is_completed: boolean;
    last_position_seconds: number;
  }>;
}

/* ───── خلاصه‌ی عمومیِ جلسه (SSR) ───── */

type ApiLessonDetail = {
  id: number;
  title: string;
  slug: string;
  description?: string | null;
  order: number;
  content_type: string;
  content_type_display?: string;
  duration_seconds?: number | null;
  summary?: string | null;
  attachment_title?: string | null;
  attachment_file?: string | null;
  is_preview: boolean;
};

export type LmsLessonResult =
  { kind: 'ok'; lesson: ApiLessonDetail } | { kind: 'not-found' } | { kind: 'offline' };

export async function fetchLmsLesson(
  courseSlug: string,
  lessonSlug: string,
): Promise<LmsLessonResult> {
  try {
    const data = await apiFetch<ApiLessonDetail>(
      `/lms/courses/${encodeURIComponent(courseSlug)}/lessons/${encodeURIComponent(lessonSlug)}/`,
      { revalidate: 120, tags: ['lms', 'courses', `course-${courseSlug}`, `lesson-${lessonSlug}`] },
    );
    if (!data?.id) return { kind: 'not-found' };
    return { kind: 'ok', lesson: data };
  } catch (err) {
    if (isApiError(err) && err.status === 404) return { kind: 'not-found' };
    return { kind: 'offline' };
  }
}

/* ───── ثبت‌نامِ من (کلاینت) ───── */

const toPercent = (v: string | number | null | undefined): number => {
  const n = typeof v === 'string' ? parseFloat(v) : (v ?? 0);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0;
};

/** ثبت‌نامِ فعال/تکمیل‌شده‌ی کاربر برای این کلاس (اگر هست) + جزئیات پیشرفت. */
export async function fetchMyEnrollment(
  courseSlug: string,
): Promise<{ summary: MyEnrollmentSummary; progressMap: Map<number, LessonProgressEntry> } | null> {
  const list = await safeApiFetch<Paginated<ApiEnrollmentRow> | ApiEnrollmentRow[]>(
    '/lms/me/enrollments/?page_size=100',
    { cache: 'no-store' },
  );
  const rows: ApiEnrollmentRow[] = Array.isArray(list)
    ? list
    : ((list as Paginated<ApiEnrollmentRow> | null)?.results ?? []);
  const mine = rows.find(
    (r) => r.course?.slug === courseSlug && (r.status === 'active' || r.status === 'completed'),
  );
  if (!mine) return null;

  const summary: MyEnrollmentSummary = {
    id: mine.id,
    status: mine.status,
    progressPercent: toPercent(mine.progress_percent),
    lastAccessedLessonId: null,
  };

  const detail = await safeApiFetch<ApiEnrollmentDetail>(`/lms/me/enrollments/${mine.id}/`, {
    cache: 'no-store',
  });
  const progressMap = new Map<number, LessonProgressEntry>();
  for (const p of detail?.lesson_progress ?? []) {
    progressMap.set(p.lesson.id, {
      lessonId: p.lesson.id,
      watchedSeconds: p.watched_seconds ?? 0,
      durationSnapshot: p.duration_seconds_snapshot ?? 0,
      progressPercent: toPercent(p.progress_percent),
      isCompleted: p.is_completed ?? false,
      lastPositionSeconds: p.last_position_seconds ?? 0,
    });
  }
  summary.lastAccessedLessonId = detail?.last_accessed_lesson_id ?? null;
  return { summary, progressMap };
}

/* ───── رسانه ───── */

export type LessonMediaResult =
  | { kind: 'ok'; media: LessonMediaPayload }
  | { kind: 'forbidden' }
  | { kind: 'unavailable'; message: string };

export async function fetchLessonMedia(
  lessonId: number,
  mediaKind: 'video' | 'document' | 'article' | 'attachment',
): Promise<LessonMediaResult> {
  try {
    const data = await apiFetch<LessonMediaPayload>(
      `/lms/lessons/${lessonId}/media/${mediaKind}/`,
      {
        cache: 'no-store',
      },
    );
    return { kind: 'ok', media: data };
  } catch (err) {
    if (isApiError(err) && err.status === 403) return { kind: 'forbidden' };
    if (isApiError(err) && err.status === 404) {
      return { kind: 'unavailable', message: err.message || 'رسانه‌ای برای این جلسه موجود نیست.' };
    }
    return { kind: 'unavailable', message: 'در دریافت رسانه مشکلی پیش آمد.' };
  }
}

/* ───── پیشرفت ───── */

export async function postLessonProgress(
  lessonId: number,
  body: { watched_seconds?: number; last_position_seconds?: number; mark_completed?: boolean },
): Promise<{ isCompleted: boolean; progressPercent: number; lastPositionSeconds: number } | null> {
  const data = await safeApiFetch<{
    is_completed?: boolean;
    progress_percent?: string | number;
    last_position_seconds?: number;
  }>(`/lms/lessons/${lessonId}/progress/`, {
    method: 'POST',
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  if (!data) return null;
  return {
    isCompleted: data.is_completed ?? false,
    progressPercent: toPercent(data.progress_percent),
    lastPositionSeconds: data.last_position_seconds ?? 0,
  };
}

/* ───── پرسش‌وپاسخ ───── */

export type LessonQuestionsResult =
  | { kind: 'ok'; questions: LessonQuestion[]; total: number }
  | { kind: 'forbidden' }
  | { kind: 'error' };

export async function fetchLessonQuestions(lessonId: number): Promise<LessonQuestionsResult> {
  try {
    const data = await apiFetch<Paginated<LessonQuestion>>(
      `/lms/lessons/${lessonId}/questions/?page_size=30`,
      { cache: 'no-store' },
    );
    return { kind: 'ok', questions: data.results ?? [], total: data.count ?? 0 };
  } catch (err) {
    if (isApiError(err) && err.status === 403) return { kind: 'forbidden' };
    return { kind: 'error' };
  }
}

export async function postLessonQuestion(
  lessonId: number,
  input: { title: string; body: string },
): Promise<LessonQuestion | null> {
  return safeApiFetch<LessonQuestion>(`/lms/lessons/${lessonId}/questions/`, {
    method: 'POST',
    body: JSON.stringify(input),
    cache: 'no-store',
  });
}

export async function postQuestionAnswer(
  questionId: number,
  body: string,
): Promise<LessonQuestionAnswer | null> {
  return safeApiFetch<LessonQuestionAnswer>(`/lms/questions/${questionId}/answers/`, {
    method: 'POST',
    body: JSON.stringify({ body }),
    cache: 'no-store',
  });
}

export async function postAcceptAnswer(questionId: number, answerId: number): Promise<boolean> {
  const res = await safeApiFetch(`/lms/questions/${questionId}/answers/${answerId}/accept/`, {
    method: 'POST',
    cache: 'no-store',
  });
  return res !== null;
}

/* ───── آزمون ───── */

export async function fetchQuizMeta(courseSlug: string): Promise<QuizMeta | null> {
  return safeApiFetch<QuizMeta>(`/lms/courses/${encodeURIComponent(courseSlug)}/quiz/`, {
    cache: 'no-store',
  });
}

export type QuizStartResult =
  | { kind: 'ok'; attempt: QuizAttempt; resumed: boolean }
  | { kind: 'locked'; message: string }
  | { kind: 'unavailable'; message: string };

export async function startQuizAttempt(courseSlug: string): Promise<QuizStartResult> {
  try {
    const data = await apiFetch<QuizAttempt>(
      `/lms/courses/${encodeURIComponent(courseSlug)}/quiz/start/`,
      { method: 'POST', cache: 'no-store' },
    );
    const resumed = data.status === 'in_progress' && (data.answers?.length ?? 0) > 0;
    return { kind: 'ok', attempt: data, resumed };
  } catch (err) {
    if (isApiError(err)) {
      if (err.status === 403)
        return { kind: 'locked', message: err.message || 'در حال حاضر امکان آزمون نیست.' };
      if (err.status === 404)
        return { kind: 'unavailable', message: err.message || 'آزمونی منتشر نشده است.' };
    }
    return { kind: 'unavailable', message: 'در آغاز آزمون مشکلی پیش آمد.' };
  }
}

export type QuizSubmitResult =
  { kind: 'ok'; attempt: QuizAttempt } | { kind: 'error'; message: string };

export async function submitQuizAttempt(
  attemptId: number,
  answers: Array<{ question_id: number; selected_option_id: number }>,
): Promise<QuizSubmitResult> {
  try {
    const data = await apiFetch<QuizAttempt>(`/lms/quiz/attempts/${attemptId}/submit/`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
      cache: 'no-store',
    });
    return { kind: 'ok', attempt: data };
  } catch (err) {
    return {
      kind: 'error',
      message: isApiError(err) ? err.message : 'در ثبت پاسخ‌ها مشکلی پیش آمد.',
    };
  }
}

export type { LmsCourseDetail, LmsLesson };
