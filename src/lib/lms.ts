/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LMS (قرارگاه آموزشی) — typed API client.
 *
 *  Mirrors every PUBLIC + USER endpoint on `apps/lms/urls.py`.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { apiFetch, safeApiFetch, type Paginated } from './api';

/* ───────────────────────────────────────────────────────────────────────── */
/*  Types                                                                     */
/* ───────────────────────────────────────────────────────────────────────── */

export type LMSCategory = {
  id: number;
  slug: string;
  title: string;
  icon?: string | null;
  description?: string | null;
  is_active?: boolean;
  courses_count?: number;
};

export type LMSCourseLevel = 'beginner' | 'intermediate' | 'advanced' | 'professional';

export type LMSCourseSummary = {
  id: number;
  slug: string;
  title: string;
  subtitle?: string | null;
  short_description?: string | null;
  cover_image: string | null;
  category?: LMSCategory | null;
  level: LMSCourseLevel;
  language?: string;
  instructor_name?: string;
  is_featured?: boolean;
  is_new?: boolean;
  published_at?: string | null;
  lessons_count?: number;
  estimated_duration_seconds?: number;
  enrollments_count?: number;
};

export type LMSLesson = {
  id: number;
  slug: string;
  title: string;
  order?: number;
  duration_seconds?: number;
  is_free_preview?: boolean;
  is_active?: boolean;
};

export type LMSCourseDetail = LMSCourseSummary & {
  description?: string;
  instructor_bio?: string;
  instructor_avatar?: string | null;
  intro_video_url?: string;
  lessons: LMSLesson[];
};

export type LMSEnrollment = {
  id: number;
  course: LMSCourseSummary;
  status: 'active' | 'completed' | 'canceled' | 'locked';
  enrolled_at: string;
  completed_at?: string | null;
  progress_percent: number;
  watched_seconds: number;
  total_seconds_snapshot: number;
};

export type LMSCertificate = {
  id: number;
  certificate_code: string;
  verification_slug: string;
  course: LMSCourseSummary;
  issued_at: string;
  user_full_name?: string;
};

export type LMSQuiz = {
  id: number;
  title: string;
  description?: string;
  duration_minutes?: number;
  pass_score: number;
  questions_count: number;
};

export type LMSQuizAttempt = {
  id: number;
  quiz_id: number;
  started_at: string;
  submitted_at?: string | null;
  score?: number;
  passed?: boolean;
  time_left_seconds?: number;
};

/* ───────────────────────────────────────────────────────────────────────── */
/*  Public — categories                                                       */
/* ───────────────────────────────────────────────────────────────────────── */

export function listCategories() {
  return safeApiFetch<Paginated<LMSCategory>>('/lms/categories/', {
    revalidate: 600, tags: ['lms', 'categories'],
  });
}

export function getCategory(slug: string) {
  return apiFetch<LMSCategory>(`/lms/categories/${encodeURIComponent(slug)}/`, {
    revalidate: 600, tags: ['lms', 'category', slug], skipAuth: true,
  } as never);
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  Public — courses & lessons                                                */
/* ───────────────────────────────────────────────────────────────────────── */

export type CourseListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  category?: string; // category slug (iexact per filterset)
  level?: LMSCourseLevel;
  ordering?: '-published_at' | 'published_at';
};

export function listCourses(params?: CourseListParams) {
  const qs = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v === undefined || v === '' || v === null) return;
      qs.set(k, String(v));
    });
  }
  const q = qs.toString();
  return safeApiFetch<Paginated<LMSCourseSummary>>(
    `/lms/courses/${q ? `?${q}` : ''}`,
    { revalidate: 180, tags: ['lms', 'courses'] },
  );
}

export function getCourse(slug: string) {
  return apiFetch<LMSCourseDetail>(`/lms/courses/${encodeURIComponent(slug)}/`, {
    revalidate: 60, tags: ['lms', 'course', slug], skipAuth: true,
  } as never);
}

export function safeGetCourse(slug: string) {
  return safeApiFetch<LMSCourseDetail>(`/lms/courses/${encodeURIComponent(slug)}/`, {
    revalidate: 60, tags: ['lms', 'course', slug],
  });
}

export function getCourseLessons(slug: string) {
  return apiFetch<LMSLesson[] | Paginated<LMSLesson>>(
    `/lms/courses/${encodeURIComponent(slug)}/lessons/`,
    { revalidate: 60, tags: ['lms', 'course', slug, 'lessons'], skipAuth: true } as never,
  );
}

export function getLesson(slug: string, lessonSlug: string) {
  return apiFetch<LMSLesson & { content?: string; video_url?: string; attachments?: unknown[] }>(
    `/lms/courses/${encodeURIComponent(slug)}/lessons/${encodeURIComponent(lessonSlug)}/`,
  );
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  User actions                                                              */
/* ───────────────────────────────────────────────────────────────────────── */

export function enrollInCourse(slug: string) {
  return apiFetch<LMSEnrollment>(`/lms/courses/${encodeURIComponent(slug)}/enroll/`, {
    method: 'POST',
  });
}

export function updateLessonProgress(lessonId: number, payload: {
  watched_seconds: number;
  completed?: boolean;
}) {
  return apiFetch<{ progress_percent: number; watched_seconds: number; completed: boolean }>(
    `/lms/lessons/${lessonId}/progress/`,
    { method: 'POST', body: JSON.stringify(payload) },
  );
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  Me: enrollments / certificates / recommendations                          */
/* ───────────────────────────────────────────────────────────────────────── */

export function myEnrollments(params?: { page?: number; page_size?: number }) {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.page_size) qs.set('page_size', String(params.page_size));
  const q = qs.toString();
  return apiFetch<Paginated<LMSEnrollment>>(`/lms/me/enrollments/${q ? `?${q}` : ''}`);
}

export function myEnrollment(id: number | string) {
  return apiFetch<LMSEnrollment>(`/lms/me/enrollments/${id}/`);
}

export function myCertificates(params?: { page?: number; page_size?: number }) {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.page_size) qs.set('page_size', String(params.page_size));
  const q = qs.toString();
  return apiFetch<Paginated<LMSCertificate>>(`/lms/me/certificates/${q ? `?${q}` : ''}`);
}

export function myCertificate(id: number | string) {
  return apiFetch<LMSCertificate>(`/lms/me/certificates/${id}/`);
}

export function verifyCertificate(verificationSlug: string) {
  return safeApiFetch<LMSCertificate>(
    `/lms/certificates/verify/${encodeURIComponent(verificationSlug)}/`,
    { revalidate: 3600, tags: ['lms', 'cert', verificationSlug] },
  );
}

export function myRecommendations() {
  return apiFetch<{ recommended: LMSCourseSummary[] }>('/lms/me/recommendations/');
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  Quiz                                                                      */
/* ───────────────────────────────────────────────────────────────────────── */

export function getCourseQuiz(slug: string) {
  return apiFetch<LMSQuiz>(`/lms/courses/${encodeURIComponent(slug)}/quiz/`, {
    revalidate: 60, tags: ['lms', 'course', slug, 'quiz'], skipAuth: true,
  } as never);
}

export function startQuiz(slug: string) {
  return apiFetch<LMSQuizAttempt>(`/lms/courses/${encodeURIComponent(slug)}/quiz/start/`, {
    method: 'POST',
  });
}

export function getQuizAttempt(attemptId: number | string) {
  return apiFetch<LMSQuizAttempt & { questions: unknown[] }>(
    `/lms/quiz/attempts/${attemptId}/`,
  );
}

export function submitQuizAttempt(attemptId: number | string, answers: Record<string, unknown>) {
  return apiFetch<LMSQuizAttempt & { certificate?: LMSCertificate }>(
    `/lms/quiz/attempts/${attemptId}/submit/`,
    { method: 'POST', body: JSON.stringify({ answers }) },
  );
}
