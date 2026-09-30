import { FileText, Mic, MonitorPlay, Type } from 'lucide-react';

/**
 * قراردادِ مشترکِ صفحه‌ی هاب «قرارگاه آموزشی» (/lms) — خالص و بدون
 * وابستگیِ fetch، تا هم سمتِ سرور (loaderها) و هم کلاینت (نوار ابزار)
 * ایمن import شود.
 *
 * منبع حقیقت (خوانده‌شده از apps/lms در بک‌اند — مطالعه‌ی فاز صفر):
 *
 *   GET /api/v1/lms/categories/   → LMSCategorySerializer (بدون صفحه‌بندی؛
 *       مرتب‌شده با order,title) — فیلد count ندارد؛ شمار‌ه‌ها در فرانت
 *       از فهرستِ دوره‌ها مشتق می‌شوند.
 *   GET /api/v1/lms/courses/      → CourseSummarySerializer + StandardPagination
 *       ترتیب: -published_at,-created_at (جدیدترین نخست)
 *       فیلترها (apps/lms/filters.py::CoursePublicFilter):
 *         • category=<slug>      — iexact روی category__slug
 *         • level=<beginner|intermediate|advanced|professional>
 *         • is_featured=<bool>   — فقط ویژه / فقط غیرویژه
 *         • search=<term>        — PostgreSQL FTS + trigram روی
 *           title(A) / subtitle(B) / short_description(B) /
 *           description(C) / instructor_name(C)
 *       صفحه‌بندی: page + page_size (پیش‌فرض ۲۰، حداکثر ۱۰۰)
 *   در URLِ عمومیِ سایت به‌جای is_featured از کلیدِ کوتاهِ featured=1
 *   استفاده می‌کنیم و لودر آن را به قراردادِ backend ترجمه می‌کند
 *   (آدرس‌های کوتاه‌تر، قابل‌خواندن‌تر و پایدارتر در برابر rename شدن
 *   نامِ فیلدِ داخلی).
 *   اسلاگ‌ها می‌توانند فارسی باشند (پروداکشن: «تست»، «نظامی») — هر بار
 *   ساخت URL باید با encodeURIComponent امن شود.
 */

/* ── سطوح — آینه‌ی apps.lms.choices.CourseLevel ─────────────────────── */
export const LMS_LEVELS = ['beginner', 'intermediate', 'advanced', 'professional'] as const;
export type LmsLevel = (typeof LMS_LEVELS)[number];

export const LMS_LEVEL_LABEL: Record<LmsLevel, string> = {
  beginner: 'مقدماتی',
  intermediate: 'متوسط',
  advanced: 'پیشرفته',
  professional: 'حرفه‌ای',
};

export function normalizeLevel(raw: string | undefined | null): LmsLevel | null {
  return LMS_LEVELS.includes(raw as LmsLevel) ? (raw as LmsLevel) : null;
}

/* ── مدل‌های صفحه‌ی جزئیاتِ دوره — آینه‌ی Lesson/CourseDetailSerializer ── */
export type LmsLessonType = 'video' | 'audio' | 'document' | 'article';
export type LmsVideoProvider = 'direct_url' | 'embed' | 'uploaded_file' | 'hybrid';

export type LmsLesson = {
  id: number;
  title: string;
  slug: string;
  description?: string;
  order: number;
  contentType: LmsLessonType;
  contentTypeDisplay: string;
  videoProvider?: LmsVideoProvider | string;
  /** فیلدهای عمومیِ سریالایزرِ خلاصه — برای پیش‌نمایشِ بدونِ ورود کافی‌اند. */
  videoUrl?: string;
  embedUrl?: string;
  durationSeconds: number;
  summary?: string;
  attachmentTitle?: string;
  attachmentUrl?: string;
  isPreview: boolean;
};

export type LmsCourseDetail = LmsCourse & {
  description?: string;
  instructorBio?: string;
  introVideoUrl?: string;
  lessons: LmsLesson[];
};

/* ── برچسبِ فارسیِ نوعِ جلسه (آینه‌ی LessonContentType) ───────────────── */
export const LESSON_TYPE_LABEL: Record<LmsLessonType, string> = {
  video: 'ویدئو',
  audio: 'صوت',
  document: 'سند',
  article: 'متن',
};

/* نقشه‌ی آیکون + تُنِ رنگیِ نوعِ جلسه — منبعِ واحد برای ریلِ جلسه و نقشه‌ی
 * مسیرِ کلاس؛ مرجعِ ارجاع به مقادیر (بدونِ JSX) تا در فایلِ .ts بماند. */
export const TYPE_ICON: Record<LmsLessonType, typeof MonitorPlay> = {
  video: MonitorPlay,
  audio: Mic,
  document: FileText,
  article: Type,
};

export const TYPE_TONE: Record<LmsLessonType, string> = {
  video: 'bg-brand-50 text-brand-700 ring-brand-100',
  audio: 'bg-mint-50 text-mint-800 ring-mint-200',
  document: 'bg-gold-50 text-gold-800 ring-gold-200',
  article: 'bg-ink-50 text-ink-700 ring-ink-100',
};

export function normalizeLessonType(raw: string | undefined | null): LmsLessonType {
  return raw === 'audio' || raw === 'document' || raw === 'article' ? raw : 'video';
}

/* ═══ طبقه‌بندیِ امنِ آدرسِ ویدئو — چه چیزی را «واقعاً» رندر می‌کنیم ═══
 * قانونِ صیانت: embed_url/video_url را مدیری در پنل می‌نویسد (معتمد)، ولی
 * ما باز هم فقط الگوهای شناخته‌شده را به پلیر می‌فرستیم؛ هر URLِ عجیب،
 * بی‌صدا به «بدون ویدئو» سقوط می‌کند — نه لینک‌بازیِ بیرونی.
 *   • فایلِ مستقیم (.mp4/.webm/.mov/.m3u8 یا میزبانِ مدیای خودمان) → <video>
 *   • آپارات (/v/<hash>) → iframeِ embed استانداردِ آپارات
 *   • یوتیوب (watch / youtu.be / embed) → youtube-nocookie embed
 */
export type LmsVideoSource = { kind: 'native' | 'embed'; src: string };

const NATIVE_VIDEO_EXT = /\.(mp4|webm|mov|m3u8)(\?.*)?$/i;

export function classifyVideoUrl(raw: string | undefined | null): LmsVideoSource | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  const host = url.hostname.toLowerCase();

  // یوتیوب — همیشه به nocookie embed تبدیل شود
  if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
    const id =
      url.searchParams.get('v') ?? url.pathname.match(/\/(embed|shorts)\/([\w-]{6,})/)?.[2] ?? null;
    return id ? { kind: 'embed', src: `https://www.youtube-nocookie.com/embed/${id}` } : null;
  }
  if (host === 'youtu.be') {
    const id = url.pathname.replace(/^\//, '').split('/')[0];
    return id ? { kind: 'embed', src: `https://www.youtube-nocookie.com/embed/${id}` } : null;
  }
  // آپارات — لینکِ صفحه به embed استاندارد تبدیل شود
  if (host.endsWith('aparat.com')) {
    const existing = url.pathname.match(/\/video\/video\/embed\/videohash\/([\w-]+)/);
    if (existing) return { kind: 'embed', src: trimmed };
    const page = url.pathname.match(/^\/v\/([\w-]+)/);
    if (page)
      return {
        kind: 'embed',
        src: `https://www.aparat.com/video/video/embed/videohash/${page[1]}/vt/frame`,
      };
    return null;
  }
  // فایلِ مستقیم (پسوندِ رسانه) — از جمله میزبانِ مدیای خودمان
  if (NATIVE_VIDEO_EXT.test(url.pathname)) return { kind: 'native', src: trimmed };
  // میزبان‌های ویدئو پلتفرم‌های شناخته‌شده که مسیر embed خام می‌دهند
  if (/^player\.vimeo\.com$/.test(host) && /\/video\/\d+/.test(url.pathname))
    return { kind: 'embed', src: trimmed };
  return null;
}

/** چکیده‌ی وبلاگ‌نما از متنِ ساده — خط‌های خالی حذف، سقفِ نویسه رعایت شود. */
export function teaserText(raw: string | undefined, maxLen = 170): string {
  if (!raw) return '';
  const flat = raw.replace(/\s+/g, ' ').trim();
  if (flat.length <= maxLen) return flat;
  return `${flat.slice(0, maxLen - 1).trimEnd()}…`;
}
/* ── مدل‌های نمایشی ─────────────────────────────────────────────────── */
export type LmsCategoryNode = {
  slug: string;
  title: string;
  description?: string;
  coverUrl?: string;
  /** مشتق‌شده از خودِ فهرستِ دوره‌ها (بک‌اند count نمی‌دهد). */
  coursesCount: number;
};

export type LmsCourse = {
  slug: string;
  title: string;
  subtitle?: string;
  shortDescription?: string;
  instructor: string;
  instructorAvatarUrl?: string;
  level?: LmsLevel | null;
  coverUrl?: string;
  lessonsCount: number;
  durationSeconds: number;
  enrollmentsCount: number;
  graduatesCount: number;
  isFeatured: boolean;
  isNew: boolean;
  publishedAt?: string;
  categorySlug?: string;
  categoryTitle?: string;
};

/* ── آمارِ جمعیِ کاتالوگ — از همان صفحه‌ی ۱۰۰تاییِ بدون فیلتر ─────────── */
export type LmsCatalogStats = {
  courseCount: number;
  /** تعدادِ دوره‌های ویژه — برای چیپِ طلاییِ «پیشنهاد سردبیر». */
  featuredCount: number;
  totalLessons: number;
  totalLearners: number;
  totalGraduates: number;
  totalDurationSeconds: number;
  /** تعدادِ دوره‌یِ هر دسته (برای نشانِ ریل). */
  countByCategory: Map<string, number>;
  /** اگر count > page_size بود، جمع‌ها تقریبی‌اند و با «+» صادقانه نشان می‌دهیم. */
  truncated: boolean;
};

export function buildStats(courses: LmsCourse[], totalCount: number): LmsCatalogStats {
  const countByCategory = new Map<string, number>();
  let featuredCount = 0,
    totalLessons = 0,
    totalLearners = 0,
    totalGraduates = 0,
    totalDurationSeconds = 0;
  for (const c of courses) {
    if (c.categorySlug)
      countByCategory.set(c.categorySlug, (countByCategory.get(c.categorySlug) ?? 0) + 1);
    if (c.isFeatured) featuredCount += 1;
    totalLessons += c.lessonsCount;
    totalLearners += c.enrollmentsCount;
    totalGraduates += c.graduatesCount;
    totalDurationSeconds += c.durationSeconds;
  }
  return {
    courseCount: totalCount,
    featuredCount,
    totalLessons,
    totalLearners,
    totalGraduates,
    totalDurationSeconds,
    countByCategory,
    truncated: totalCount > courses.length,
  };
}

/* ── کوئریِ هاب و سازنده‌ی آدرس — قراردادِ قابل‌اشتراک، بدون ضعف تزریق ── */
export type LmsHubQuery = {
  category?: string;
  level?: LmsLevel | null;
  q?: string;
  /** featured=1 در URL ⇒ لودر is_featured=true را به backend می‌دهد. */
  featured?: boolean;
  page?: number;
};

export const LMS_HUB_PAGE_SIZE = 12;

/** پارسِ دفاعیِ searchParams: فقط کلیدهای شناخته‌شده عبور می‌کنند،
 *  level تنها وقتی وارد URL می‌شود که عضوِ LMS_LEVELS باشد و featured
 *  فقط با مقدارِ صریحِ ۱/true روشن می‌شود — صفحه با هر ورودیِ
 *  دست‌کاری‌شده هم پاک و قابل‌پیش‌بینی می‌ماند. */
export function parseLmsHubQuery(sp: Record<string, string | string[] | undefined>): LmsHubQuery {
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const category = first(sp.category)?.trim() || undefined;
  const q = first(sp.q)?.trim().slice(0, 120) || undefined;
  const level = normalizeLevel(first(sp.level));
  const featuredRaw = first(sp.featured)?.trim().toLowerCase();
  const featured = featuredRaw === '1' || featuredRaw === 'true' ? true : undefined;
  const pageRaw = Number(first(sp.page) ?? '1');
  const page = Number.isFinite(pageRaw) && pageRaw > 1 ? Math.min(Math.floor(pageRaw), 100) : 1;
  return { category, level, q, featured, page };
}

/** سازنده‌ی آدرسِ هاب: فقط کلیدهایِ غیرخالی‌اند و نظمِ خواندنی دارند. */
export function lmsHref(patch: LmsHubQuery = {}, base: LmsHubQuery = {}): string {
  const merged: LmsHubQuery = { ...base, ...patch };
  const p = new URLSearchParams();
  if (merged.q) p.set('q', merged.q);
  if (merged.category) p.set('category', merged.category);
  if (merged.level) p.set('level', merged.level);
  if (merged.featured) p.set('featured', '1');
  if (merged.page && merged.page > 1) p.set('page', String(merged.page));
  const s = p.toString();
  return s ? `/lms?${s}` : '/lms';
}

/** قالب‌بندیِ کوتاهِ مدت — ۹۰د → «۴۵د»، ۲س+۳۰د → «۲س ۳۰د». */
export function formatLmsDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h.toLocaleString('fa-IR')}س ${m.toLocaleString('fa-IR')}د`;
  if (h > 0) return `${h.toLocaleString('fa-IR')} ساعت`;
  return `${m.toLocaleString('fa-IR')} دقیقه`;
}

/** ساعتِ آموزشِ جمعی — نمایشِ صادقانه‌ی «تا این لحظه». */
export function formatLmsHours(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  return h.toLocaleString('fa-IR');
}

/** مدلِ پنجره‌ی شماره‌ی صفحه‌ها — حداکثر ۷ نشان با حذفِ هوشمندانه‌ی لبه‌ها. */
export function pageWindow(current: number, total: number): Array<number | 'gap'> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const inner = new Set<number>([1, total, current - 1, current, current + 1]);
  const sorted = [...inner].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out: Array<number | 'gap'> = [];
  let prev = 0;
  for (const n of sorted) {
    if (n - prev > 1) out.push('gap');
    out.push(n);
    prev = n;
  }
  return out;
}
