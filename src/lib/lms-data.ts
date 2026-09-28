import { apiFetch, isApiError, safeApiFetch, type Paginated } from '@/lib/api';
import { absoluteMediaUrl } from '@/lib/utils';
import {
  LMS_HUB_PAGE_SIZE,
  buildStats,
  normalizeLevel,
  type LmsCatalogStats,
  type LmsCategoryNode,
  type LmsCourse,
  type LmsHubQuery,
} from './lms-shared';

/**
 * لایه‌ی داده‌ی سرورِ هابِ «قرارگاه آموزشی» (/lms).
 *
 *  • سه fetch هم‌موازی در صفحه: فهرستِ صفحه‌بندی‌شده‌ی فیلترخور + فهرستِ
 *    کاملِ دسته‌ها + یک اسکنِ ۱۰۰تاییِ بدون فیلتر برای آمارِ صادقانه.
 *  • همه‌ی fetchها با تگ‌های `lms`/`courses`/`lms-categories` نشان‌دارند
 *    تا هوکِ /api/revalidate بتواند دقیق باطل کند.
 *  • هر پارامترِ کوئری که backend نمی‌شناسد (ordering و…) این‌جا حذف
 *    می‌شود — قراردادِ لودر دقیقاً برابرِ CoursePublicFilter است تا کشِ
 *    وارینت‌آگاهِ سمت سرور به‌صرفه بماند و کلیدهای کشِ فرانت پرت‌وپلا
 *    نسازد.
 */

/* ── انعکاسِ یک‌به‌یکِ سریالایزرها (بدون تکیه بر مدیای خام) ──────────── */
type ApiCategory = {
  id?: number;
  slug: string;
  title: string;
  description?: string;
  icon?: string | null;
  cover_image?: string | null;
};

type ApiCourse = {
  id?: number;
  slug: string;
  title: string;
  subtitle?: string;
  short_description?: string;
  instructor_name?: string;
  instructor_avatar?: string | null;
  level?: string;
  status?: string;
  is_featured?: boolean;
  cover_image?: string | null;
  lessons_count?: number;
  estimated_duration_seconds?: number;
  enrollments_count?: number;
  graduates_count?: number;
  published_at?: string;
  category?: { id?: number; slug?: string; title?: string };
};

const THIRTY_DAYS = 1000 * 60 * 60 * 24 * 30;

function mapCourse(c: ApiCourse): LmsCourse {
  const publishedAt = c.published_at || undefined;
  return {
    slug: c.slug,
    title: c.title,
    subtitle: c.subtitle || undefined,
    shortDescription: c.short_description || undefined,
    instructor: c.instructor_name?.trim() || 'مدرس قرارگاه',
    instructorAvatarUrl: absoluteMediaUrl(c.instructor_avatar),
    level: normalizeLevel(c.level),
    coverUrl: absoluteMediaUrl(c.cover_image),
    lessonsCount: c.lessons_count ?? 0,
    durationSeconds: c.estimated_duration_seconds ?? 0,
    enrollmentsCount: c.enrollments_count ?? 0,
    graduatesCount: c.graduates_count ?? 0,
    isFeatured: c.is_featured ?? false,
    isNew: publishedAt ? Date.now() - new Date(publishedAt).getTime() < THIRTY_DAYS : false,
    publishedAt,
    categorySlug: c.category?.slug,
    categoryTitle: c.category?.title,
  };
}

/* ── دسته‌بندی‌ها (بدون صفحه‌بندی؛ count از خودِ فهرستِ دوره‌ها) ──────── */
export async function fetchLmsCategories(): Promise<LmsCategoryNode[]> {
  const data = await safeApiFetch<ApiCategory[]>('/lms/categories/?page_size=100', {
    revalidate: 300,
    tags: ['lms', 'lms-categories'],
  });
  return (Array.isArray(data) ? data : []).map((c) => ({
    slug: c.slug,
    title: c.title,
    description: c.description || undefined,
    coverUrl: absoluteMediaUrl(c.cover_image),
    coursesCount: 0, // با buildStats پر می‌شود
  }));
}

/* ── اسکنِ صادقانه‌ی کاتالوگ برای آمار + شمارِ دسته‌ها ────────────────── */
export async function fetchLmsStats(): Promise<LmsCatalogStats> {
  const data = await safeApiFetch<Paginated<ApiCourse>>('/lms/courses/?page_size=100', {
    revalidate: 300,
    tags: ['lms', 'courses', 'lms-stats'],
  });
  const items = (data?.results ?? []).map(mapCourse);
  return buildStats(items, data?.count ?? items.length);
}

/* ── صفحه‌ی فیلترخورِ هاب — قراردادِ CoursePublicFilter ─────────────── */
export type LmsCoursesPage = {
  items: LmsCourse[];
  count: number;
  totalPages: number;
  page: number;
  /** true ⇒ این صفحه وجود ندارد (DRF برای صفحه‌ی فراتر از محدوده 404 می‌دهد). */
  invalidPage: boolean;
  /** true ⇒ ارتباط با سرور برقرار نشد؛ صفحه حالتِ آفلاین را می‌نشان دهد. */
  offline: boolean;
};

export async function fetchLmsCoursesPage(query: LmsHubQuery): Promise<LmsCoursesPage> {
  const params = new URLSearchParams();
  params.set('page_size', String(LMS_HUB_PAGE_SIZE));
  if (query.category) params.set('category', query.category);
  if (query.level) params.set('level', query.level);
  if (query.q) params.set('search', query.q);
  // ترجمه‌ی کلیدِ کوتاهِ عمومی به قراردادِ CoursePublicFilter
  if (query.featured) params.set('is_featured', 'true');
  params.set('page', String(Math.max(1, query.page ?? 1)));

  try {
    const data = await apiFetch<Paginated<ApiCourse>>(`/lms/courses/?${params.toString()}`, {
      revalidate: 120,
      tags: ['lms', 'courses', 'lms-hub'],
    });
    const count = data?.count ?? 0;
    const items = (data?.results ?? []).map(mapCourse);
    return {
      items,
      count,
      totalPages: Math.max(1, Math.ceil(count / LMS_HUB_PAGE_SIZE)),
      page: Math.max(1, query.page ?? 1),
      invalidPage: false,
      offline: false,
    };
  } catch (err) {
    // صفحه‌ی فراتر از محدوده = درخواستِ «معتبر» با وضعیتِ خالی — با
    // آفلاین‌بودن قاطی نشود تا UI بتواند «برگرد به صفحه‌ی ۱» بگوید.
    const invalidPage = isApiError(err) && err.status === 404;
    return {
      items: [],
      count: 0,
      totalPages: 0,
      page: Math.max(1, query.page ?? 1),
      invalidPage,
      offline: !invalidPage,
    };
  }
}

export type { LmsCatalogStats, LmsCategoryNode, LmsCourse, LmsHubQuery };
export {
  LMS_HUB_PAGE_SIZE,
  LMS_LEVEL_LABEL,
  LMS_LEVELS,
  formatLmsDuration,
  formatLmsHours,
  lmsHref,
  pageWindow,
  parseLmsHubQuery,
} from './lms-shared';
