/**
 * Server-side data loaders for the homepage.
 *
 * Production policy:
 *   Every loader hits its Django backend endpoint and returns ONLY real
 *   data. When the backend is unreachable or returns an empty list, the
 *   loader returns []  — the sections then render their own empty
 *   state. No demo / seed / mock content is ever shipped to production.
 *
 * Backend contracts (mirror config/urls.py and apps/*):
 *   GET /api/v1/madadkar/campaigns/         → CampaignPublicListSerializer
 *   GET /api/v1/r4j/criminals/              → R4JPublicCriminalListSerializer
 *   GET /api/v1/lms/categories/             → LMSCategoryPublicSerializer
 *   GET /api/v1/lms/courses/                → CourseSummarySerializer
 *   GET /api/v1/kindness-wall/categories/   → KindnessCategorySerializer   (v2: آرایه‌ی ساده)
 *   GET /api/v1/kindness-wall/listings/     → KindnessListingListSerializer (v2: بدون فیلد تماس)
 *   GET /api/v1/kindness-wall/stats/        → KindnessBoardStatsSerializer (v2: شمارنده‌های تأثیر)
 *   GET /api/v1/tabyin/display/home/        → Bounded display window + exact totals
 *   GET /api/v1/public-reports/subjects/    → ReportSubjectPublicSerializer
 */

import { safeApiFetch } from '@/lib/api';
import { absoluteMediaUrl } from '@/lib/utils';
import { courseCoverArt, DEFAULT_INSTRUCTOR_AVATAR } from '@/lib/course-art';
import type { RevayatItem } from '@/lib/revayat';
import { displayWallBucket, type DisplayCounts } from '@/lib/tabyin-display';
import { readDisplayHome } from '@/lib/tabyin-data';
import type { CampaignCard } from '@/components/home/WarFundSection';
import type { CriminalCard } from '@/components/home/JusticeSection';
import type { CourseCard, EduCategory } from '@/components/home/EducationSection';
import type { KindListing, KindCategory, KindStats } from '@/components/home/KindnessSection';
import type { TabyinItem } from '@/components/home/TabyinSection';

type Paginated<T> = { results?: T[]; count?: number } | T[];
function unwrap<T>(x: Paginated<T> | null): T[] {
  if (!x) return [];
  if (Array.isArray(x)) return x;
  return x.results ?? [];
}

/* ─── Madadkar (warfund) ─────────────────────────────────────────────── */
/**
 * Mirrors apps.madadkar.serializers.CampaignPublicListSerializer.
 * Monetary fields are stored in TOMAN; the UI multiplies by 10 to render
 * Rial as required by the designer.
 */
type ApiSponsor = { id?: number; name: string; slug?: string; logo?: string | null };
type ApiCampaign = {
  id?: number;
  slug: string;
  title: string;
  sponsor?: ApiSponsor;
  cover_image?: string | null;
  total_amount?: number; // Toman
  share_price?: number; // Toman
  total_shares?: number;
  purchased_shares?: number;
  remaining_shares?: number;
  progress_percent?: number;
  is_fully_funded?: boolean;
  funded_shares?: number;
  external_funded_shares?: number;
  external_funded_amount?: number;
  participant_count?: number;
  has_deadline?: boolean;
  deadline?: string | null;
  status?: string;
  status_display?: string;
  published_at?: string | null;
  /** Detail / admin endpoints embed the gallery; list endpoint does not. */
  gallery_images?: Array<{
    id: number;
    image: string;
    alt_text?: string;
    display_order?: number;
  }>;
};

export async function loadCampaigns(): Promise<CampaignCard[]> {
  // 8 cards = exactly 2 pager pages of 4 on desktop.
  // ترتیب متعلق به سرور است: fair-share (نیازمندترین اول، تأمین‌شده‌ها آخر).
  const data = await safeApiFetch<Paginated<ApiCampaign>>('/madadkar/campaigns/?page_size=8', {
    revalidate: 300,
    tags: ['homepage', 'campaigns', 'madadkar'],
  });
  const list = unwrap(data);
  return list.map((c) => ({
    slug: c.slug,
    title: c.title,
    sponsor: c.sponsor?.name || 'گروه جهادی',
    sponsorLogo: absoluteMediaUrl(c.sponsor?.logo),
    totalAmount: c.total_amount ?? 0,
    sharePrice:
      c.share_price ??
      (c.total_amount && c.total_shares ? Math.floor(c.total_amount / c.total_shares) : 0),
    sharesTotal: c.total_shares ?? 0,
    sharesRemaining:
      c.remaining_shares ?? Math.max(0, (c.total_shares ?? 0) - (c.purchased_shares ?? 0)),
    progressPercent: c.progress_percent ?? 0,
    coverUrl: absoluteMediaUrl(c.cover_image),
    participantCount: c.participant_count,
    isFullyFunded: c.is_fully_funded,
    offlineFundedShares: c.external_funded_shares ?? 0,
    hasDeadline: c.has_deadline,
    deadline: c.deadline ?? undefined,
    statusDisplay: c.status_display,
    gallery: (c.gallery_images ?? [])
      .slice()
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
      .map((g) => ({ url: absoluteMediaUrl(g.image) ?? '', alt: g.alt_text || c.title }))
      .filter((g) => !!g.url),
  }));
}

/* ─── R4J ────────────────────────────────────────────────────────────── */
type ApiCriminalPhoto = { id: number; image: string };
type ApiCriminal = {
  id?: number;
  slug: string;
  first_name?: string;
  last_name?: string;
  country?: string;
  province?: string;
  city?: string;
  primary_photo?: ApiCriminalPhoto | null;
  total_bounty_toman?: number;
  bounties_count?: number;
};
export async function loadCriminals(): Promise<CriminalCard[]> {
  const data = await safeApiFetch<Paginated<ApiCriminal>>(
    '/r4j/criminals/?page_size=8&ordering=-total_bounty_toman',
    { revalidate: 600, tags: ['homepage', 'criminals', 'r4j'] },
  );
  const list = unwrap(data);
  return list.map((p) => {
    const fullName = [p.first_name, p.last_name].filter(Boolean).join(' ').trim() || p.slug;
    return {
      slug: p.slug,
      fullName,
      imageUrl: absoluteMediaUrl(p.primary_photo?.image),
      pillLabel: [p.city, p.province, p.country].filter(Boolean).join('، ') || undefined,
      totalBounty: p.total_bounty_toman,
      bountiesCount: p.bounties_count,
    };
  });
}

/* ─── LMS ────────────────────────────────────────────────────────────── */
type ApiLmsCategory = { slug: string; title: string; courses_count?: number };
/** Mirrors apps.lms.serializers.CourseSummarySerializer (LIST endpoint).
 *  `instructor_avatar` is exposed on the LIST serializer too (added
 *  backend-side so homepage cards can render real instructor photos).
 *  `description` / `instructor_bio` / `intro_video_url` / `lessons` still
 *  live ONLY on the DETAIL serializer. */
type ApiCourse = {
  id?: number;
  slug: string;
  title: string;
  subtitle?: string;
  short_description?: string;
  instructor_name?: string;
  instructor_avatar?: string | null;
  level?: 'beginner' | 'intermediate' | 'advanced' | 'professional' | string;
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

export async function loadLmsCategories(): Promise<EduCategory[]> {
  const data = await safeApiFetch<Paginated<ApiLmsCategory>>('/lms/categories/?page_size=20', {
    revalidate: 600,
    tags: ['homepage', 'lms-categories', 'lms'],
  });
  const list = unwrap(data);
  return list.map((c) => ({ slug: c.slug, title: c.title, count: c.courses_count }));
}

export async function loadCourses(): Promise<CourseCard[]> {
  const data = await safeApiFetch<Paginated<ApiCourse>>(
    '/lms/courses/?page_size=12&ordering=-published_at',
    { revalidate: 300, tags: ['homepage', 'courses', 'lms'] },
  );
  const list = unwrap(data);
  return list.map((c) => ({
    slug: c.slug,
    title: c.title,
    subtitle: c.subtitle,
    shortDescription: c.short_description,
    instructor: c.instructor_name,
    instructorAvatarUrl: absoluteMediaUrl(c.instructor_avatar) ?? DEFAULT_INSTRUCTOR_AVATAR,
    level: c.level,
    coverUrl: absoluteMediaUrl(c.cover_image) ?? courseCoverArt(c.slug),
    lessonsCount: c.lessons_count,
    durationSeconds: c.estimated_duration_seconds,
    enrollmentsCount: c.enrollments_count,
    graduatesCount: c.graduates_count,
    isFeatured: c.is_featured,
    isNew: c.published_at
      ? Date.now() - new Date(c.published_at).getTime() < 1000 * 60 * 60 * 24 * 30
      : false,
    categorySlug: c.category?.slug,
    categoryTitle: c.category?.title,
  }));
}

/* ─── Kindness Wall (v2 — تختهٔ نیازِ ادمین‌محور) ─────────────────────── */
/**
 * سناریوی v2 (apps/kindness_wall — «rebuild as v2 admin-curated board»):
 * ادمین دسته‌بندی و آگهیِ «نیاز» را منتشر می‌کند؛ کاربر می‌بیند و از
 * راه‌های ارتباطیِ درونِ آگهی مستقیم با صاحبِ نیاز تماس می‌گیرد. در نسخهٔ ۱
 * کاربران خودشان آگهی می‌گذاشتند (need_help/offer_help) — آن دنیا تمام شد.
 *
 * قراردادِ جدیدِ بک‌اند:
 *   لیست:   id, slug, title, excerpt, category{slug,title,icon(emoji)},
 *           urgency/urgency_display, is_featured, quantity, unit,
 *           province, city, view_count, open_offers_count, cover_url,
 *           days_left, published_at
 *           ⚠️ هیچ فیلد تماسی در لیست نیست (ضد اسکرپینگ) — contact_channels
 *              فقط در DETAIL می‌آید و صفحه اصلی آن را lazy می‌گیرد.
 *   دسته‌ها: id, title, slug, description, icon, order, open_listings_count
 *   آمار:    open_listings, urgent_listings, fulfilled_total, fulfilled_30d,
 *            volunteers_total, active_categories
 *
 * پنجرهٔ گذار (v1 → v2): تا وقتی پروداکشن روی بک‌اند قدیمی باشد، پاسخ‌ها
 * شمایل قدیمی دارند. تابع نگاشت پایین با «نشان v2» (= وجود excerpt/unit)
 * سطرهای کهنه را بی‌صدا کنار می‌گذارد تا دیوار از صحیح‌بودن خالی نشود؛
 * به‌محض دیپلویِ بکِ جدید، دیوار خودش روشن می‌شود.
 */
type ApiKindnessCategory = {
  id?: number;
  title?: string;
  slug?: string;
  description?: string;
  icon?: string;
  order?: number;
  /** شمارندهٔ زندهٔ آگهی‌های جاری — نشانِ v2 بودنِ دسته. */
  open_listings_count?: number;
};

type ApiKindnessListing = {
  id?: number;
  slug: string;
  title: string;
  /** نشانِ v2 — در شمایل v1 وجود ندارد. */
  excerpt?: string;
  category?: { id?: number; slug?: string; title?: string; icon?: string };
  urgency?: 'normal' | 'urgent' | string;
  urgency_display?: string;
  is_featured?: boolean;
  quantity?: number;
  unit?: string;
  province?: string;
  city?: string;
  locality?: string;
  is_nationwide?: boolean;
  view_count?: number;
  open_offers_count?: number;
  cover_url?: string | null;
  days_left?: number | null;
  published_at?: string | null;
};

type ApiKindnessStats = {
  open_listings?: number;
  urgent_listings?: number;
  fulfilled_total?: number;
  fulfilled_30d?: number;
  volunteers_total?: number;
  active_categories?: number;
};

/** true فقط وقتی آیتم حداقل قابلیت نمایش صادقانهٔ v2 را دارد. */
export function isV2KindnessListing(item: ApiKindnessListing): boolean {
  return (
    typeof item.slug === 'string' &&
    item.slug.trim() !== '' &&
    typeof item.title === 'string' &&
    item.title.trim() !== '' &&
    (typeof item.excerpt === 'string' || typeof item.unit === 'string')
  );
}

/** نگاشت خالصِ لیست → مدل کارت سکشن (قابل تست واحد). */
export function mapKindnessListings(items: ApiKindnessListing[]): KindListing[] {
  return items.filter(isV2KindnessListing).map((l) => ({
    slug: l.slug,
    title: l.title,
    excerpt: (l.excerpt ?? '').trim(),
    categoryTitle: l.category?.title,
    categorySlug: l.category?.slug,
    categoryIcon: l.category?.icon?.trim() || undefined,
    urgency: l.urgency === 'urgent' ? 'urgent' : 'normal',
    isFeatured: l.is_featured === true,
    quantity: typeof l.quantity === 'number' && l.quantity > 0 ? l.quantity : 1,
    unit: l.unit?.trim() || 'عدد',
    province: l.province?.trim() || undefined,
    city: l.city?.trim() || undefined,
    locality: l.locality?.trim() || undefined,
    isNationwide: l.is_nationwide === true,
    viewCount: l.view_count,
    openOffersCount: l.open_offers_count,
    coverImage: absoluteMediaUrl(l.cover_url),
    daysLeft: typeof l.days_left === 'number' ? l.days_left : null,
    publishedAt: l.published_at ?? undefined,
  }));
}

/** نگاشت دسته‌های v2 (فقط دسته‌هایی که شمارندهٔ v2 دارند). */
export function mapKindnessCategories(items: ApiKindnessCategory[]): KindCategory[] {
  return items
    .filter(
      (c): c is ApiKindnessCategory & { slug: string; title: string } =>
        typeof c.slug === 'string' &&
        typeof c.title === 'string' &&
        typeof c.open_listings_count === 'number',
    )
    .map((c) => ({
      slug: c.slug,
      title: c.title,
      icon: c.icon?.trim() || undefined,
      count: c.open_listings_count ?? 0,
    }));
}

/** guard آمار تخته: یا هر ۶ کلید عددی است یا هیچ‌کدام (v1 → 404 → null). */
export function mapKindnessStats(raw: ApiKindnessStats | null): KindStats | null {
  if (
    !raw ||
    typeof raw.open_listings !== 'number' ||
    typeof raw.urgent_listings !== 'number' ||
    typeof raw.fulfilled_total !== 'number' ||
    typeof raw.fulfilled_30d !== 'number' ||
    typeof raw.volunteers_total !== 'number' ||
    typeof raw.active_categories !== 'number'
  ) {
    return null;
  }
  return {
    openListings: raw.open_listings,
    urgentListings: raw.urgent_listings,
    fulfilledTotal: raw.fulfilled_total,
    fulfilled30d: raw.fulfilled_30d,
    volunteersTotal: raw.volunteers_total,
    activeCategories: raw.active_categories,
  };
}

/**
 * لودرِ یک‌جای تختهٔ مهربانی برای صفحهٔ اصلی. سه درخواست موازی؛ هر کدام
 * fail شود فقط همان بخش عقب می‌نشیند (لیست خالی/چیپ‌ها از دادهٔ خود کارت‌ها/
 * بدون روبان آمار) و صفحه هرگز به‌خاطر یک endpoint نمی‌میرد.
 */
export async function loadKindnessBoard(): Promise<{
  listings: KindListing[];
  categories: KindCategory[];
  stats: KindStats | null;
}> {
  const [listingsRes, categoriesRes, statsRes] = await Promise.all([
    safeApiFetch<Paginated<ApiKindnessListing>>('/kindness-wall/listings/?page_size=12', {
      revalidate: 240,
      tags: ['homepage', 'kindness'],
    }),
    safeApiFetch<ApiKindnessCategory[]>('/kindness-wall/categories/', {
      revalidate: 240,
      tags: ['homepage', 'kindness'],
    }),
    safeApiFetch<ApiKindnessStats>('/kindness-wall/stats/', {
      revalidate: 240,
      tags: ['homepage', 'kindness'],
    }),
  ]);
  return {
    listings: mapKindnessListings(unwrap(listingsRes)),
    categories: mapKindnessCategories(
      Array.isArray(categoriesRes) ? categoriesRes : unwrap(categoriesRes),
    ),
    stats: mapKindnessStats(statsRes),
  };
}

/* ─── Tabyin ─────────────────────────────────────────────────────────── */
type ApiTabyinAttachment = {
  id?: number;
  url: string;
  media_type?: 'image' | 'video' | 'audio' | 'other';
  size?: string;
  duration?: number;
  file_size?: number;
  title?: string;
  order?: number;
};
function deriveTabyinVideoThumbnailUrl(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    if (u.hostname !== 'app-media.armansky.ir') return undefined;
    u.pathname = u.pathname
      .replace('/org/uploads/', '/thumbnail/uploads/')
      .replace(/\.[a-z0-9]+$/i, '.gif');
    return u.toString();
  } catch {
    return undefined;
  }
}

export type TabyinCounts = DisplayCounts & { exact: true };
export type TabyinHomeSection = {
  items: TabyinItem[];
  counts?: TabyinCounts;
  unavailable: boolean;
};

/** Map only the bounded, already-visible/unique homepage window. */
function mapTabyinItems(rows: RevayatItem[]): TabyinItem[] {
  return rows.map((t) => {
    const attachments = Array.isArray(t.attachments)
      ? (t.attachments as ApiTabyinAttachment[])
      : [];
    const image = attachments.find((a) => a.media_type === 'image' && a.url);
    const video = attachments.find((a) => a.media_type === 'video' && a.url);
    const duration = attachments.find((a) => a.duration)?.duration;
    const thumbnail = absoluteMediaUrl(deriveTabyinVideoThumbnailUrl(video?.url));
    const cover = absoluteMediaUrl(image?.url) ?? thumbnail;
    const publicCover = cover && !cover.includes('app-service.armansky.ir') ? cover : undefined;
    const bucket = displayWallBucket(t);
    return {
      id: t.external_id,
      slug: t.external_id,
      title: t.title,
      summary: t.description,
      coverUrl: publicCover,
      videoUrl: absoluteMediaUrl(video?.url),
      thumbnailUrl: thumbnail,
      variant: publicCover ? 'cover' : 'quote',
      mediaType: bucket === 'text' ? 'other' : bucket,
      durationSeconds: duration,
      origin: t.origin,
      authorName: t.author_username,
    };
  });
}

/** A single response supplies both bounded cards and full, verified badge counts. */
export async function loadTabyinSection(): Promise<TabyinHomeSection> {
  const data = await readDisplayHome();
  if (!data) return { items: [], unavailable: true };
  return {
    items: mapTabyinItems(data.results),
    counts: { ...data.counts, exact: true },
    unavailable: false,
  };
}

/* ─── Public Reports ─────────────────────────────────────────────────── */
type ApiReportSubject = {
  id: number;
  title: string;
  slug?: string;
  description?: string;
  order?: number;
};

export type ReportSubject = { id: string; name: string; description?: string };

export async function loadReportSubjects(): Promise<ReportSubject[]> {
  const data = await safeApiFetch<Paginated<ApiReportSubject>>(
    '/public-reports/subjects/?page_size=20',
    { revalidate: 600, tags: ['homepage', 'report-subjects', 'public-reports'] },
  );
  const list = unwrap(data);
  return list.map((s) => ({
    id: String(s.id),
    name: s.title,
    description: s.description,
  }));
}

/* نکتهٔ تاریخی: لودرِ قدیمیِ «loadKindnessCategories» (قرارداد v1، paginated)
 * با بازسازی v2 حذف شد — دسته‌ها حالا از همان loadKindnessBoard می‌آیند.
 * (endpoint در v2 آرایهٔ ساده برمی‌گرداند، نه paginated؛ نگه‌داشتن آن لودر
 * یعنی سکوتِ شکسته‌ای که همیشه [] برگرداند.) */
