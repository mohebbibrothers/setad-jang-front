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
 *   GET /api/v1/kindness-wall/categories/   → KindnessCategorySerializer
 *   GET /api/v1/kindness-wall/listings/     → KindnessListingListSerializer
 *   GET /api/v1/tabyin/contents/            → PublicTabyinContentListSerializer
 *   GET /api/v1/public-reports/subjects/    → ReportSubjectPublicSerializer
 */

import { safeApiFetch } from '@/lib/api';
import { absoluteMediaUrl } from '@/lib/utils';
import type { CampaignCard } from '@/components/home/WarFundSection';
import type { CriminalCard } from '@/components/home/JusticeSection';
import type { CourseCard, EduCategory } from '@/components/home/EducationSection';
import type { KindListing } from '@/components/home/KindnessSection';
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
  total_amount?: number;          // Toman
  share_price?: number;           // Toman
  total_shares?: number;
  purchased_shares?: number;
  remaining_shares?: number;
  progress_percent?: number;
  is_fully_funded?: boolean;
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
  // 8 cards = exactly 2 pager pages of 4 on desktop.  Newest first.
  const data = await safeApiFetch<Paginated<ApiCampaign>>(
    '/madadkar/campaigns/?page_size=8&ordering=-published_at',
    { revalidate: 300, tags: ['homepage', 'campaigns', 'madadkar'] },
  );
  const list = unwrap(data);
  return list.map((c) => ({
    slug: c.slug,
    title: c.title,
    sponsor: c.sponsor?.name || 'گروه جهادی',
    sponsorLogo: absoluteMediaUrl(c.sponsor?.logo),
    totalAmount: c.total_amount ?? 0,
    sharePrice: c.share_price ?? (c.total_amount && c.total_shares
      ? Math.floor(c.total_amount / c.total_shares) : 0),
    sharesTotal: c.total_shares ?? 0,
    sharesRemaining: c.remaining_shares ?? Math.max(
      0, (c.total_shares ?? 0) - (c.purchased_shares ?? 0),
    ),
    progressPercent: c.progress_percent ?? 0,
    coverUrl: absoluteMediaUrl(c.cover_image),
    participantCount: c.participant_count,
    isFullyFunded: c.is_fully_funded,
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
  const data = await safeApiFetch<Paginated<ApiLmsCategory>>(
    '/lms/categories/?page_size=20',
    { revalidate: 600, tags: ['homepage', 'lms-categories', 'lms'] },
  );
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
    instructor: c.instructor_name,
    instructorAvatarUrl: absoluteMediaUrl(c.instructor_avatar),
    level: c.level,
    coverUrl: absoluteMediaUrl(c.cover_image),
    lessonsCount: c.lessons_count,
    durationSeconds: c.estimated_duration_seconds,
    enrollmentsCount: c.enrollments_count,
    isFeatured: c.is_featured,
    isNew: c.published_at
      ? Date.now() - new Date(c.published_at).getTime() < 1000 * 60 * 60 * 24 * 30
      : false,
    categorySlug: c.category?.slug,
  }));
}

/* ─── Kindness Wall ──────────────────────────────────────────────────── */
type ApiKindness = {
  id?: number;
  slug: string;
  listing_type: 'need_help' | 'offer_help';
  category?: { id?: number; slug?: string; title?: string; icon?: string };
  title: string;
  province?: string;
  city?: string;
  district?: string;
  owner_full_name_snapshot?: string;
  owner_avatar_snapshot?: string | null;
  published_at?: string;
  expires_at?: string | null;
  view_count?: number;
  cover_image?: string | null;
  description?: string;
  /** Detail endpoint embeds full images + matches count when available. */
  images?: Array<{ id: number; image: string; alt_text?: string; caption?: string; is_cover?: boolean; order?: number }>;
  matches_count?: number;
  bookmark_count?: number;
};
export async function loadKindnessListings(): Promise<KindListing[]> {
  const data = await safeApiFetch<Paginated<ApiKindness>>(
    '/kindness-wall/listings/?page_size=12&ordering=-published_at',
    { revalidate: 240, tags: ['homepage', 'kindness'] },
  );
  const list = unwrap(data);
  return list.map((l) => ({
    slug: l.slug,
    title: l.title,
    type: l.listing_type === 'need_help' ? 'need' : 'offer',
    categoryTitle: l.category?.title,
    categorySlug: l.category?.slug,
    province: l.province,
    city: l.city,
    district: l.district,
    ownerName: l.owner_full_name_snapshot,
    ownerAvatar: absoluteMediaUrl(l.owner_avatar_snapshot),
    coverImage: absoluteMediaUrl(l.cover_image),
    publishedAt: l.published_at,
    expiresAt: l.expires_at ?? undefined,
    viewCount: l.view_count,
    bookmarkCount: l.bookmark_count,
    matchesCount: l.matches_count,
    gallery: (l.images ?? [])
      .slice()
      .sort((a, b) => {
        if (!!b.is_cover !== !!a.is_cover) return b.is_cover ? 1 : -1;
        return (a.order ?? 0) - (b.order ?? 0);
      })
      .map((g) => ({ url: absoluteMediaUrl(g.image) ?? '', alt: g.alt_text || g.caption || l.title }))
      .filter((g) => !!g.url),
  }));
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

type ApiTabyin = {
  external_id: string;
  title?: string;
  description?: string;
  author_username?: string;
  origin?: 'external' | 'user_submitted';
  source_created_at?: string;
  source_url?: string;
  primary_media_type?: 'image' | 'video' | 'audio' | 'other';
  attachments?: ApiTabyinAttachment[];
};

export type TabyinCounts = {
  all: number;
  image: number;
  video: number;
  audio: number;
};

async function loadTabyinCount(mediaType?: 'image' | 'video' | 'audio'): Promise<number> {
  const suffix = mediaType ? '&media_type=' + mediaType : '';
  const data = await safeApiFetch<Paginated<ApiTabyin>>(
    '/tabyin/contents/?page_size=1&ordering=-source_created_at' + suffix,
    { revalidate: 180, tags: ['tabyin', 'homepage'] },
  );

  if (!data || Array.isArray(data)) return 0;
  return data.count ?? 0;
}

export async function loadTabyinCounts(): Promise<TabyinCounts> {
  const [all, image, video, audio] = await Promise.all([
    loadTabyinCount(),
    loadTabyinCount('image'),
    loadTabyinCount('video'),
    loadTabyinCount('audio'),
  ]);

  return { all, image, video, audio };
}

export async function loadTabyinItems(): Promise<TabyinItem[]> {
  const data = await safeApiFetch<Paginated<ApiTabyin>>(
    '/tabyin/contents/?page_size=100&ordering=-source_created_at',
    { revalidate: 180, tags: ['tabyin', 'homepage'] },
  );
  const list = unwrap(data);

  return list.map((t) => {
    const attachments = t.attachments ?? [];
    const imageCover = attachments.find((a) => a.media_type === 'image' && a.url);
    const video      = attachments.find((a) => a.media_type === 'video' && a.url);
    const videoOrAudio = attachments.find((a) => a.duration);

    // Try (a) an image attachment, (b) a derivable poster from the video
    // URL, then (c) any other attachment URL. Every candidate is passed
    // through `absoluteMediaUrl` so relative /media/... paths are
    // resolved against the backend origin.
    const videoThumbnailUrl = absoluteMediaUrl(deriveTabyinVideoThumbnailUrl(video?.url));
    const primaryCoverUrl   = absoluteMediaUrl(imageCover?.url) ?? videoThumbnailUrl;

    // Some external sources (armansky) require auth and 4xx on hot-link,
    // which would leave the tile with a broken frame. Only expose the
    // cover when it's from a host we know can be embedded publicly.
    const coverIsKnownPublic = Boolean(
      primaryCoverUrl && !primaryCoverUrl.includes('app-service.armansky.ir'),
    );

    return {
      id: t.external_id,
      slug: t.external_id,
      title: t.title,
      summary: t.description,
      coverUrl: coverIsKnownPublic ? primaryCoverUrl : undefined,
      videoUrl: absoluteMediaUrl(video?.url),
      thumbnailUrl: videoThumbnailUrl,
      variant: coverIsKnownPublic ? 'cover' : 'quote',
      mediaType: t.primary_media_type ?? imageCover?.media_type ?? video?.media_type ?? 'image',
      durationSeconds: videoOrAudio?.duration,
      origin: t.origin,
      authorName: t.author_username,
      sourceUrl: t.source_url,
    };
  });
}

/* ─── Public Reports ─────────────────────────────────────────────────── */
type ApiReportSubject = { id: number; title: string; slug?: string; description?: string; order?: number };

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

/* ─── Kindness Wall categories (used by the ThemeChip strip) ─────────── */
type ApiKindnessCategory = { id?: number; slug: string; title: string; icon?: string };

export type KindnessCategory = { slug: string; title: string; icon?: string };

export async function loadKindnessCategories(): Promise<KindnessCategory[]> {
  const data = await safeApiFetch<Paginated<ApiKindnessCategory>>(
    '/kindness-wall/categories/?page_size=30',
    { revalidate: 600, tags: ['kindness-categories'] },
  );
  const list = unwrap(data);
  return list.map((c) => ({ slug: c.slug, title: c.title, icon: c.icon }));
}
