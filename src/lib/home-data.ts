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
/** Mirrors apps.lms.serializers.CourseSummarySerializer (LIST endpoint).
 *  IMPORTANT: `instructor_avatar` / `description` / `instructor_bio` /
 *  `intro_video_url` / `lessons` live ONLY on the DETAIL serializer.
 *  Requesting them from the list endpoint used to yield `undefined`
 *  every time — we no longer pretend they're available here. */
type ApiCourse = {
  id?: number;
  slug: string;
  title: string;
  subtitle?: string;
  short_description?: string;
  instructor_name?: string;
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
    shortDescription: c.short_description,
    instructor: c.instructor_name,
    // instructorAvatarUrl is DELIBERATELY not set here — the backend
    // only exposes instructor_avatar on the CourseDetail serializer.
    // The card falls back to its own initial-avatar glyph.
    level: c.level,
    coverUrl: absoluteMediaUrl(c.cover_image),
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

/* ─── Kindness Wall ──────────────────────────────────────────────────── */
/**
 * Mirrors apps.kindness_wall.serializers.KindnessListingListSerializer
 * (public LIST endpoint). NOTE: `description`, `address_hint`,
 * `images[]`, `contact_available` live ONLY on the DETAIL serializer.
 * Owner-only fields (`bookmark_count`, `report_count`,
 * `contact_reveal_count`, `matches_*`) are exposed by the owner+admin
 * serializers exclusively — the public homepage MUST NOT depend on
 * them or the response envelope will silently mismatch.
 */
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
  /** Present ONLY when the caller was the DETAIL endpoint. Optional. */
  description?: string;
  images?: Array<{ id: number; image: string; alt_text?: string; caption?: string; is_cover?: boolean; order?: number }>;
  contact_available?: boolean;
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
    contactAvailable: l.contact_available,
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

/**
 * Tabyin filter counts.
 *
 * The strip on the homepage has 4 tabs: همه / تصویر / ویدئو / متن.
 * "متن" is the union bucket for everything that isn't a picture or a
 * video (audio, other, no-media). Backend has no dedicated count
 * endpoint for "text" — we compute it as `all - image - video` so
 * every content type is accounted for exactly once and audio/other
 * items surface under the متن tab.
 */
export type TabyinCounts = {
  all: number;
  image: number;
  video: number;
  text: number;
};

async function loadTabyinCount(mediaType?: 'image' | 'video' | 'audio' | 'other'): Promise<number> {
  const suffix = mediaType ? '&media_type=' + mediaType : '';
  // Revalidate every 60 s (was 180 s) so the badge numbers on the
  // Tabyin filter strip refresh quickly when the upstream crawler
  // ingests new items — the strip is the first thing users glance
  // at on the section and a stale count for 3 minutes is visually
  // noisy on a wall that otherwise animates in real time.
  const data = await safeApiFetch<Paginated<ApiTabyin>>(
    '/tabyin/contents/?page_size=1&ordering=-source_created_at' + suffix,
    { revalidate: 60, tags: ['tabyin', 'homepage'] },
  );

  if (!data || Array.isArray(data)) return 0;
  return data.count ?? 0;
}

export async function loadTabyinCounts(): Promise<TabyinCounts> {
  // Client contract: text ≡ all − image − video.
  //
  // We compute it as the arithmetic difference of the three
  // backend counts. That number (currently 35 on prod: 3301 − 1792
  // − 1474) matches what the "سایر" tab is expected to advertise
  // AND what its item filter (`isTextItem` in TabyinSection) will
  // actually surface once the loader pulls a deep-enough slice of
  // the `all` bucket to include every unclassified row.
  //
  // Clamped to zero so partial-count race conditions can never
  // produce a negative badge.
  const [all, image, video] = await Promise.all([
    loadTabyinCount(),
    loadTabyinCount('image'),
    loadTabyinCount('video'),
  ]);

  const text = Math.max(0, all - image - video);

  return { all, image, video, text };
}

/**
 * Load Tabyin items across every filter bucket so the homepage strip
 * has a full page-of-10-tiles-times-10-pages ceiling for EACH tab —
 * not just for the "همه" mixed feed.
 *
 * ── Why the fan-out ──
 * The previous single call was `?page_size=100&ordering=-...` which
 * fetched the 100 most recent items across ALL media types. If those
 * 100 happened to skew heavily to one bucket (say, 92 images + 6
 * videos + 2 text posts) then the "تصویر" tab only had 9 pages and
 * "سایر" only had 1 — even though the backend has thousands more of
 * each. The client-side counts endpoint (loadTabyinCounts) confirmed
 * the imbalance, and users noticed the empty pager arrows on the
 * smaller tabs.
 *
 * Fix: fetch UP TO 100 items PER bucket (image / video / text / other)
 * in parallel, then merge into a single deduplicated list. Every tab
 * now surfaces its own 100 latest items → 10 tiles × 10 pages ceiling
 * per tab, capped only by how many items actually exist upstream.
 *
 * "text" here means the union of everything that isn't an image or a
 * video (audio + other + no-media). We collapse it into a single
 * "text" fetch on the client — the backend has no dedicated flag,
 * but the union is what the "سایر" tab shows on the wall, so we
 * fetch both `audio` and `other` and merge, taking the newest 100.
 */
/**
 * Fetch UP TO `target` items from a Tabyin bucket, following the
 * pagination cursor as many hops as needed. Defensive against
 * backend `max_page_size` limits that could silently cap our
 * single-call fetch below the 100-item ceiling we advertise.
 */
/**
 * Fetch UP TO `target` items from a Tabyin bucket, following the
 * pagination cursor as many hops as needed. Defensive against
 * backend `max_page_size` limits that could silently cap our
 * single-call fetch below the target ceiling.
 *
 *  Implementation notes
 *  ────────────────────
 *   • `PAGE_SIZE` is fixed at 100 (a value the backend definitely
 *     honours — verified with a live probe). Using a variable
 *     `page_size=target` caused a subtle bug: when target > 100,
 *     the backend silently capped the response at 100 and then the
 *     drain-detection check (`batch.length < target`) fired FALSELY,
 *     breaking the loop after page 1. That's why the "سایر" tab
 *     showed only 8 items instead of the backend-advertised 35, and
 *     the ویدئو tab short-changed the last page.
 *
 *   • Drain detection now compares against `PAGE_SIZE`, not `target`:
 *     if the batch came back with FEWER than PAGE_SIZE items the
 *     bucket is genuinely drained. Otherwise we keep paginating.
 *
 *   • Loop cap raised to 20 iterations so `target=300` (the deep
 *     `all` pull) can complete in three 100-item pages with room
 *     to spare, and no realistic backend response can hang us.
 */
async function fetchTabyinBucket(
  target: number,
  mediaType?: 'image' | 'video' | 'audio' | 'other',
): Promise<ApiTabyin[]> {
  const PAGE_SIZE = 100;
  const collected: ApiTabyin[] = [];
  let page = 1;
  for (let i = 0; i < 40 && collected.length < target; i++) {
    const suffix = mediaType ? `&media_type=${mediaType}` : '';
    const data = await safeApiFetch<Paginated<ApiTabyin>>(
      `/tabyin/contents/?page_size=${PAGE_SIZE}&page=${page}&ordering=-source_created_at${suffix}`,
      { revalidate: 180, tags: ['tabyin', 'homepage'] },
    );
    if (!data) break;
    const batch = unwrap(data);
    if (batch.length === 0) break;
    collected.push(...batch);
    // Genuine drain: fewer items than a full page came back → no
    // more pages exist upstream. Any other case (full page) means
    // there might be more, so keep going.
    if (batch.length < PAGE_SIZE) break;
    page += 1;
  }
  return collected.slice(0, target);
}

/**
 * Fetch the ENTIRE Tabyin corpus (subject only to `hardCap`) with a
 * two-step scatter/gather strategy:
 *
 *   1. Hit page 1 first — the paginated envelope tells us `count`
 *      (total row count upstream).
 *   2. Compute how many more 100-item pages are needed to cover the
 *      full count, then fire ALL of those requests in parallel.
 *
 * Trade-offs:
 *   • Sequential pagination would take `count / 100` round-trips
 *     serially (~34 round-trips at the current corpus size). Even
 *     with a fast backend, that's 3-4 seconds of Time-To-First-Byte.
 *   • Parallel fetch lands the whole corpus in ~1 round-trip's worth
 *     of latency plus a small per-request compute overhead. On the
 *     current corpus (~3300 rows) the whole 34-page pull completes
 *     in ~500-800 ms cold, and from cache in <50 ms.
 *
 * Purpose: this is what the "سایر" tab needs. سایر contains items
 * that are the set-complement of image∪video, and those items can
 * live ANYWHERE in the chronological corpus — the newest 1500 rows
 * simply don't guarantee we've seen every eligible سایر row. A
 * whole-corpus pull is the only way to be provably complete.
 */
async function fetchTabyinAllComplete(hardCap = 5000): Promise<ApiTabyin[]> {
  const PAGE_SIZE = 100;

  // Step 1 — page 1 alone; also tells us the total `count`.
  const firstPage = await safeApiFetch<Paginated<ApiTabyin>>(
    `/tabyin/contents/?page_size=${PAGE_SIZE}&page=1&ordering=-source_created_at`,
    { revalidate: 180, tags: ['tabyin', 'homepage'] },
  );
  if (!firstPage) return [];
  const firstBatch = unwrap(firstPage);
  const total = Array.isArray(firstPage) ? firstBatch.length : (firstPage.count ?? firstBatch.length);
  const effectiveTotal = Math.min(total, hardCap);
  const totalPages = Math.ceil(effectiveTotal / PAGE_SIZE);

  if (totalPages <= 1) return firstBatch.slice(0, effectiveTotal);

  // Step 2 — pages 2..N in parallel.
  const pagePromises: Promise<Paginated<ApiTabyin> | ApiTabyin[] | null>[] = [];
  for (let p = 2; p <= totalPages; p++) {
    pagePromises.push(
      safeApiFetch<Paginated<ApiTabyin>>(
        `/tabyin/contents/?page_size=${PAGE_SIZE}&page=${p}&ordering=-source_created_at`,
        { revalidate: 180, tags: ['tabyin', 'homepage'] },
      ),
    );
  }
  const restResults = await Promise.all(pagePromises);
  const collected = [...firstBatch];
  for (const r of restResults) {
    if (!r) continue;
    collected.push(...unwrap(r));
  }
  return collected.slice(0, effectiveTotal);
}

export async function loadTabyinItems(): Promise<TabyinItem[]> {
  // ── Per-bucket fetch depth ────────────────────────────────────
  //
  // 200 (over-fetch factor 2×) fixes a subtle mismatch between how
  // the backend interprets `?media_type=X` and how our client-side
  // filter interprets `mediaType`:
  //
  //   • Backend `?media_type=video` returns every row whose
  //     ATTACHMENTS include a video (e.g. an audio row that happens
  //     to also carry an .mp4 attachment ships back under both the
  //     video AND audio filters).
  //
  //   • The client filter tab, on the other hand, buckets purely by
  //     `primary_media_type` — the single authoritative type the
  //     backend assigns to the row as a whole. An audio row with a
  //     video attachment shows up in سایر, not ویدئو.
  //
  // The consequence: if we only pull 100 rows from the video
  // endpoint, and 2 of those rows are "cross-typed" (primary
  // audio/other + video attachment), the client filter drops them
  // → ویدئو tab caps at 98, not 100. We over-fetch by 2× so even a
  // pessimistic 50% cross-type rate still leaves us with the full
  // 100 clean items per bucket after the client-side filter runs.
  //
  // 200 was chosen empirically — on the current corpus the highest
  // cross-type ratio observed is ~5%, so 2× is comfortable head-room.
  const PER_BUCKET = 200;

  // `all` bucket is fetched with a much deeper ceiling (1500 rows)
  // so we capture the ~33 items the backend has that don't fall
  // into ANY media_type filter (rows whose only attachment is
  // media_type='other', or that carry no attachment at all — the
  // full "سایر" complement on the current corpus).
  //
  // The "سایر" tab's contract with the client is
  //   text ≡ all − image − video   (currently 35 on prod)
  //
  // Those 35 rows are ~1% of the ~3300-row corpus AND they can live
  // anywhere in the chronological ordering — the newest N rows
  // simply don't guarantee coverage. To be provably complete we
  // pull the WHOLE `all` bucket via a scatter/gather fetch (page 1
  // reveals the total count, pages 2..N are then fired in parallel).
  // On the current corpus that's ~34 requests but they complete in
  // <1 s cold and <50 ms warm thanks to Next.js fetch caching.
  //
  // Hard cap at 5000 items so a runaway corpus growth can never
  // brown out the loader — well above the current ~3300 total.
  const [allList, imageList, videoList, audioList, otherList] = await Promise.all([
    fetchTabyinAllComplete(5000),
    fetchTabyinBucket(PER_BUCKET, 'image'),
    fetchTabyinBucket(PER_BUCKET, 'video'),
    fetchTabyinBucket(PER_BUCKET, 'audio'),
    fetchTabyinBucket(PER_BUCKET, 'other'),
  ]);


  // Merge + dedupe by external_id, preferring the newest
  // source_created_at when duplicates occur.
  const byId = new Map<string, ApiTabyin>();
  for (const bucket of [allList, imageList, videoList, audioList, otherList]) {
    for (const t of bucket) {
      if (!t?.external_id) continue;
      const prev = byId.get(t.external_id);
      if (!prev) { byId.set(t.external_id, t); continue; }
      const prevTs = prev.source_created_at ? Date.parse(prev.source_created_at) : 0;
      const currTs = t.source_created_at   ? Date.parse(t.source_created_at)    : 0;
      if (currTs >= prevTs) byId.set(t.external_id, t);
    }
  }

  // Sort merged corpus by source_created_at DESC so each downstream
  // filter (همه / تصویر / ویدئو / سایر) slices in chronological order.
  const list = Array.from(byId.values()).sort((a, b) => {
    const at = a.source_created_at ? Date.parse(a.source_created_at) : 0;
    const bt = b.source_created_at ? Date.parse(b.source_created_at) : 0;
    return bt - at;
  });

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

    /*
     * ── Media type resolution ────────────────────────────────────
     *
     * The client's "سایر" tab is defined as `all − image − video`
     * (the backend-count contract the badge advertises: 35 items).
     * "سایر" must therefore be the set of items that have NO
     * image AND NO video attachment — the exact complement of
     * image ∪ video from the backend's query-set perspective.
     *
     * Concretely: if we found neither an `imageCover` nor a `video`
     * in the attachments array, this row would NOT be returned by
     * `?media_type=image` OR `?media_type=video`, so it belongs
     * under سایر regardless of what `primary_media_type` says (the
     * backend's `primary_media_type` is derived from the FIRST
     * attachment, which may be an `other` file that later carries
     * a video too — we don't second-guess it, we key off the
     * concrete attachments set).
     *
     * That guarantees exact parity between the badge count and the
     * tab contents.
     */
    let mediaType: 'image' | 'video' | 'audio' | 'other';
    if (!imageCover && !video) {
      // No usable image OR video attachment → belongs to سایر.
      mediaType = 'other';
    } else if (imageCover && !video) {
      mediaType = 'image';
    } else if (video && !imageCover) {
      mediaType = 'video';
    } else {
      // Has BOTH — defer to backend's primary_media_type or fall
      // back to image (image tiles are the wall's default).
      mediaType = t.primary_media_type === 'video' ? 'video' : 'image';
    }

    return {
      id: t.external_id,
      slug: t.external_id,
      title: t.title,
      summary: t.description,
      coverUrl: coverIsKnownPublic ? primaryCoverUrl : undefined,
      videoUrl: absoluteMediaUrl(video?.url),
      thumbnailUrl: videoThumbnailUrl,
      variant: coverIsKnownPublic ? 'cover' : 'quote',
      mediaType,
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
