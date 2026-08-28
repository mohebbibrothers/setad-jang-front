/**
 * ───────────────────────────────────────────────────────────────────────────
 *  Global Search — production omni-search across every PUBLIC list endpoint.
 *
 *  Every backend filter is honoured EXACTLY as declared in the Django
 *  filtersets:
 *
 *  ┌───────────┬────────────────────────────────────┬───────────────────────┐
 *  │ Source    │ Endpoint                           │ ?search matches       │
 *  ├───────────┼────────────────────────────────────┼───────────────────────┤
 *  │ madadkar  │ /madadkar/campaigns/                │ title A               │
 *  │           │                                    │ description B         │
 *  │           │                                    │ sponsor.name C        │
 *  │           │                                    │ + trigram             │
 *  │           │ facets: sponsor · sponsor_slug ·   │                       │
 *  │           │   status · has_deadline ·          │                       │
 *  │           │   is_fully_funded                  │                       │
 *  │           │ ordering: published_at · created_at│                       │
 *  │           │   · progress · deadline            │                       │
 *  ├───────────┼────────────────────────────────────┼───────────────────────┤
 *  │ r4j       │ /r4j/criminals/                    │ first_name A          │
 *  │           │                                    │ last_name A           │
 *  │           │                                    │ slug B                │
 *  │           │                                    │ aliases.alias B       │
 *  │           │                                    │ + trigram + distinct  │
 *  │           │ facets: country · province · city  │                       │
 *  │           │   · gender                         │                       │
 *  ├───────────┼────────────────────────────────────┼───────────────────────┤
 *  │ lms       │ /lms/courses/                      │ title A               │
 *  │           │                                    │ subtitle B            │
 *  │           │                                    │ short_description B   │
 *  │           │                                    │ description C         │
 *  │           │                                    │ instructor_name C     │
 *  │           │ facets: category · level           │                       │
 *  ├───────────┼────────────────────────────────────┼───────────────────────┤
 *  │ kindness  │ /kindness-wall/listings/           │ title A               │
 *  │           │                                    │ description B         │
 *  │           │                                    │ search_document C     │
 *  │           │ facets: listing_type · category ·  │                       │
 *  │           │   province · city                  │                       │
 *  ├───────────┼────────────────────────────────────┼───────────────────────┤
 *  │ tabyin    │ /tabyin/contents/                  │ title A               │
 *  │           │                                    │ description B         │
 *  │           │                                    │ author_username C     │
 *  │           │ facets: media_type · author        │                       │
 *  └───────────┴────────────────────────────────────┴───────────────────────┘
 *
 *  NOTE — /support/knowledge/articles/ is INTENTIONALLY excluded from the
 *  omni-search. That endpoint requires IsAuthenticated on the backend and
 *  would return 401 for every anonymous visitor.
 *
 *  Every source runs in parallel via Promise.allSettled so a slow / errored
 *  domain never blocks the rest, and each call is AbortController-safe so
 *  the search bar cancels in-flight requests on every keystroke.
 * ───────────────────────────────────────────────────────────────────────────
 */

import { apiFetch } from './api';
import { absoluteMediaUrl } from './utils';
import { contentKindTagFa, resolveContentKind, videoCoverUrl } from './media-meta';

/* ───────────────────────────────────────────────────────────────────────── */
/*  Public types                                                              */
/* ───────────────────────────────────────────────────────────────────────── */

export type SearchSource = 'madadkar' | 'r4j' | 'lms' | 'kindness' | 'tabyin';

export type SearchHit = {
  source: SearchSource;
  id: string;
  title: string;
  subtitle?: string;
  /** Absolute thumbnail URL — pre-resolved so <img>/next-image never 404s. */
  thumb?: string;
  href: string;
  /** Right-hand emphasis (e.g. توزیع سهم، ۱۲ درس، بازدید) */
  badge?: string;
  /** Left-of-hit chip (e.g. مقدماتی، ویدئو، نیازمند کمک، فعال) */
  pill?: string;
  /**
   * نوعِ مؤثرِ محتوا (فعلاً فقط برای تبیین پر می‌شود) — از روی پیوست‌های
   * واقعی با همان قراردادِ فید/جزئیات («صوت همیشه می‌برد») تشخیص داده
   * می‌شود تا روی تامنیل، نشانِ ▶/🎙 کوچک رندر شود.
   */
  kind?: 'video' | 'audio' | 'image' | 'other';
};

export type SearchSourceMeta = {
  key: SearchSource;
  label: string;
  shortLabel: string;
  glyph: 'campaign' | 'gavel' | 'graduation' | 'heart' | 'megaphone';
  accent: 'brand' | 'rose' | 'amber' | 'mint' | 'violet';
  seeAllHref: (q: string, facets?: Record<string, string>) => string;
};

/* ───────────────────────────────────────────────────────────────────────── */
/*  Facet types — mirror the backend filtersets exactly                       */
/* ───────────────────────────────────────────────────────────────────────── */

/**
 * All optional facets a caller may combine with a `?search=` term.
 * Everything here is either a valid `ChoiceFilter` value or a
 * lookup=iexact string per the corresponding django filterset.
 */
export type SearchFacets = {
  madadkar?: {
    // Backend CampaignStatus values are stored as lowercase strings
    // (draft / published / completed / closed). The public filter only
    // exposes the three PUBLIC ones.
    status?: 'published' | 'completed' | 'closed';
    has_deadline?: boolean;
    is_fully_funded?: boolean;
    sponsor_slug?: string;
  };
  r4j?: {
    country?: string;
    province?: string;
    city?: string;
    gender?: 'male' | 'female' | 'unknown';
  };
  lms?: {
    category?: string; // category slug (iexact)
    level?: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  };
  kindness?: {
    listing_type?: 'need_help' | 'offer_help';
    category?: string; // category slug
    province?: string;
    city?: string;
  };
  tabyin?: {
    media_type?: 'image' | 'video' | 'audio' | 'other';
    author?: string; // icontains
  };
};

/* ───────────────────────────────────────────────────────────────────────── */
/*  Source registry                                                          */
/* ───────────────────────────────────────────────────────────────────────── */

function seeAllUrl(base: string, q: string, facets?: Record<string, string>): string {
  const params = new URLSearchParams();
  if (q) params.set('search', q);
  if (facets) {
    Object.entries(facets).forEach(([k, v]) => {
      if (v !== undefined && v !== '') params.set(k, v);
    });
  }
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

export const SEARCH_SOURCES: Record<SearchSource, SearchSourceMeta> = {
  madadkar: {
    key: 'madadkar',
    label: 'پشتیبانی مالی جنگ',
    shortLabel: 'حرکت‌ها',
    glyph: 'campaign',
    accent: 'brand',
    // Homepage-only milestone: dedicated /madadkar list route is
    // not built yet, so 'مشاهده همه' returns the user to the
    // corresponding homepage anchor instead of shipping a dead link.
    seeAllHref: (q, f) => seeAllUrl('/#warfund', q, f),
  },
  r4j: {
    key: 'r4j',
    label: 'جایزه‌ای برای عدالت',
    shortLabel: 'پرونده‌ها',
    glyph: 'gavel',
    accent: 'rose',
    seeAllHref: (q, f) => seeAllUrl('/#justice', q, f),
  },
  lms: {
    key: 'lms',
    label: 'قرارگاه آموزشی',
    shortLabel: 'دوره‌ها',
    glyph: 'graduation',
    accent: 'amber',
    seeAllHref: (q, f) => seeAllUrl('/#education', q, f),
  },
  kindness: {
    key: 'kindness',
    label: 'دیوار مهربانی',
    shortLabel: 'آگهی‌ها',
    glyph: 'heart',
    accent: 'mint',
    seeAllHref: (q, f) => seeAllUrl('/#kindness', q, f),
  },
  tabyin: {
    key: 'tabyin',
    label: 'جهاد تبیین',
    shortLabel: 'روایت‌ها',
    glyph: 'megaphone',
    accent: 'violet',
    // فیدِ /tabyin پارامترهای خودش را می‌خواند (q / type / author) — نه
    // نام‌های خامِ API (search / media_type). بدون این نگاشت، لینک
    // «مشاهده همه در روایت‌ها» کوئری را گم می‌کرد و فیدِ فیلتربرطرف‌شده
    // باز می‌شد.
    seeAllHref: (q, f) => {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (f?.media_type) params.set('type', f.media_type);
      if (f?.author) params.set('author', f.author);
      const qs = params.toString();
      return qs ? `/tabyin?${qs}` : '/tabyin';
    },
  },
};

export const SEARCH_SOURCE_ORDER: SearchSource[] = ['madadkar', 'r4j', 'lms', 'kindness', 'tabyin'];

/* ───────────────────────────────────────────────────────────────────────── */
/*  Formatting helpers                                                        */
/* ───────────────────────────────────────────────────────────────────────── */

const LEVEL_LABEL: Record<string, string> = {
  beginner: 'مقدماتی',
  intermediate: 'متوسط',
  advanced: 'پیشرفته',
  professional: 'حرفه‌ای',
};

const CAMPAIGN_STATUS_LABEL: Record<string, string> = {
  // Backend stores CampaignStatus in lowercase (draft/published/…).
  // Keep both casings mapped defensively.
  published: 'در حال اجرا',
  completed: 'تکمیل شد',
  closed: 'بسته شد',
  draft: 'پیش‌نویس',
  PUBLISHED: 'در حال اجرا',
  COMPLETED: 'تکمیل شد',
  CLOSED: 'بسته شد',
};

function fa(n: number | undefined | null): string {
  return (n ?? 0).toLocaleString('fa-IR');
}

function clean(s: unknown): string {
  if (typeof s !== 'string') return '';
  return s.replace(/\s+/g, ' ').trim();
}

function formatToman(n: number | undefined | null): string {
  if (!n || n <= 0) return '';
  if (n >= 1_000_000_000)
    return `${(n / 1_000_000_000).toFixed(1).replace('.0', '')} میلیارد تومان`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')} میلیون تومان`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} هزار تومان`;
  return `${fa(n)} تومان`;
}

function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${fa(h)}س ${fa(m)}د`;
  if (h > 0) return `${fa(h)} ساعت`;
  return `${fa(m)} دقیقه`;
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  Per-source fetchers                                                       */
/* ───────────────────────────────────────────────────────────────────────── */

type Paginated<T> = { results?: T[]; count?: number } | T[];

/** لیست + شمارِ واقعیِ سرور (count پاکت) — برای نمایش «۴۷ نتیجه». */
function unwrapCounted<T>(p: Paginated<T> | null | undefined): { items: T[]; count: number } {
  if (!p) return { items: [], count: 0 };
  if (Array.isArray(p)) return { items: p, count: p.length };
  const items = p.results ?? [];
  return { items, count: p.count ?? items.length };
}

/** سقفِ دراپ‌داونِ زنده — خلاصه‌ی سریعِ هر منبع. */
const PER_SOURCE_LIMIT = 5;
/** سقفِ هر گروه در صفحه‌ی اختصاصی /search — مرورِ عمیق‌تر. */
export const SEARCH_PAGE_GROUP_LIMIT = 12;
/** اندازه‌ی هر دسته‌ی «نمایشِ بیشتر» در همان صفحه‌ی /search. */
export const SEARCH_MORE_PAGE_SIZE = 12;

function buildQueryString(
  q: string,
  limit: number,
  extra?: Record<string, string | boolean | undefined>,
  page = 1,
): string {
  const params = new URLSearchParams();
  params.set('search', q);
  params.set('page_size', String(limit));
  if (page > 1) params.set('page', String(page));
  if (extra) {
    Object.entries(extra).forEach(([k, v]) => {
      // NOTE — we DO want to send `false` (django BooleanFilter reads it
      // literally). Only skip when the caller explicitly opts out via
      // undefined / empty-string.
      if (v === undefined || v === '') return;
      params.set(k, typeof v === 'boolean' ? (v ? 'true' : 'false') : String(v));
    });
  }
  return params.toString();
}

/** نتیجه‌ی یک منبع: برشِ نمایشی + شمارِ واقعیِ سمتِ سرور. */
type SourceResult = { hits: SearchHit[]; count: number };

async function fetchMadadkar(
  q: string,
  facets: SearchFacets['madadkar'] | undefined,
  signal: AbortSignal | undefined,
  limit: number,
  page = 1,
): Promise<SourceResult> {
  type C = {
    slug: string;
    title: string;
    sponsor?: { name?: string; slug?: string };
    progress_percent?: number;
    cover_image?: string;
    is_fully_funded?: boolean;
    status?: string;
    status_display?: string;
    participant_count?: number;
    total_amount?: number;
  };
  const qs = buildQueryString(
    q,
    limit,
    {
      status: facets?.status,
      has_deadline: facets?.has_deadline,
      is_fully_funded: facets?.is_fully_funded,
      sponsor_slug: facets?.sponsor_slug,
      ordering: '-published_at',
    },
    page,
  );
  const data = await apiFetch<Paginated<C>>(`/madadkar/campaigns/?${qs}`, {
    signal,
    revalidate: 30,
    skipAuth: true,
  } as never);
  const { items, count } = unwrapCounted(data);
  return {
    count,
    hits: items.slice(0, limit).map((c) => {
      const sponsorName = clean(c.sponsor?.name);
      const progress =
        typeof c.progress_percent === 'number' ? Math.round(c.progress_percent) : null;
      const subtitle = sponsorName ? `مددکار: ${sponsorName}` : undefined;
      const badge = progress !== null ? `${fa(progress)}٪ تأمین شد` : undefined;
      const statusPill = c.is_fully_funded
        ? 'تکمیل شد'
        : c.status
          ? (CAMPAIGN_STATUS_LABEL[c.status] ?? c.status_display)
          : c.status_display;
      return {
        source: 'madadkar',
        id: `madadkar:${c.slug}`,
        title: clean(c.title) || 'حرکت بدون عنوان',
        subtitle,
        thumb: absoluteMediaUrl(c.cover_image),
        // /madadkar/[slug] detail route is not built yet. Route hits
        // back to the homepage warfund anchor so clicks always land on
        // a valid page.
        href: `/#warfund`,
        badge,
        pill: statusPill,
      };
    }),
  };
}

/**
 * استخراجِ مقاومِ عکسِ اصلیِ پرونده‌ی عدالت. قراردادِ رسمیِ سریالایزرِ
 * عمومی primary_photo = {id, image} است، اما این استخراج در برابر همه‌ی
 * قالب‌های ممکن (آبجکت/رشته‌ی خالی/گالری photos[]/فیلدهای جایگزین)
 * تسلیم‌ناپذیر است تا عکسِ موجود هرگز به‌خاطرِ شکلِ پاکت جا نماند.
 */
function firstR4JPhotoUrl(p: {
  primary_photo?: { image?: string } | string | null;
  photo?: string;
  image?: string;
  photos?: ({ image?: string } | null)[];
}): string | undefined {
  const pp = p.primary_photo;
  const candidates: unknown[] = [
    typeof pp === 'string' ? pp : pp?.image,
    p.photo,
    p.image,
    Array.isArray(p.photos)
      ? p.photos.find((g) => g && typeof g.image === 'string')?.image
      : undefined,
  ];
  return candidates.find((c): c is string => typeof c === 'string' && c.trim() !== '');
}

async function fetchR4J(
  q: string,
  facets: SearchFacets['r4j'] | undefined,
  signal: AbortSignal | undefined,
  limit: number,
  page = 1,
): Promise<SourceResult> {
  type P = {
    slug: string;
    first_name?: string;
    last_name?: string;
    country?: string;
    province?: string;
    city?: string;
    // سریالایزرِ عمومی آبجکت {id, image} برمی‌گرداند، ولی برای مقاومتِ
    // کامل در برابر انحرافِ داده، قالب‌های جایگزین هم پذیرفته می‌شوند.
    primary_photo?: { image?: string } | string | null;
    photo?: string;
    image?: string;
    photos?: ({ image?: string } | null)[];
    total_bounty_toman?: number;
    bounties_count?: number;
  };
  const qs = buildQueryString(
    q,
    limit,
    {
      country: facets?.country,
      province: facets?.province,
      city: facets?.city,
      gender: facets?.gender,
      ordering: '-total_bounty_toman',
    },
    page,
  );
  const data = await apiFetch<Paginated<P>>(`/r4j/criminals/?${qs}`, {
    signal,
    revalidate: 60,
    skipAuth: true,
  } as never);
  const { items, count } = unwrapCounted(data);
  return {
    count,
    hits: items.slice(0, limit).map((p) => {
      const fullName = clean(`${p.first_name ?? ''} ${p.last_name ?? ''}`) || p.slug;
      const loc = [p.city, p.province, p.country].filter(Boolean).join('، ');
      return {
        source: 'r4j',
        id: `r4j:${p.slug}`,
        title: fullName,
        subtitle: loc || undefined,
        thumb: absoluteMediaUrl(firstR4JPhotoUrl(p)),
        // See note above — R4J detail route TBD, fall back to anchor.
        href: `/#justice`,
        badge: p.total_bounty_toman ? formatToman(p.total_bounty_toman) : undefined,
        pill: p.bounties_count ? `${fa(p.bounties_count)} جایزه` : undefined,
      };
    }),
  };
}

async function fetchLms(
  q: string,
  facets: SearchFacets['lms'] | undefined,
  signal: AbortSignal | undefined,
  limit: number,
  page = 1,
): Promise<SourceResult> {
  type Co = {
    slug: string;
    title: string;
    subtitle?: string;
    short_description?: string;
    instructor_name?: string;
    level?: string;
    cover_image?: string;
    lessons_count?: number;
    estimated_duration_seconds?: number;
    enrollments_count?: number;
  };
  const qs = buildQueryString(
    q,
    limit,
    {
      category: facets?.category,
      level: facets?.level,
      ordering: '-published_at',
    },
    page,
  );
  const data = await apiFetch<Paginated<Co>>(`/lms/courses/?${qs}`, {
    signal,
    revalidate: 30,
    skipAuth: true,
  } as never);
  const { items, count } = unwrapCounted(data);
  return {
    count,
    hits: items.slice(0, limit).map((c) => {
      const instructor = clean(c.instructor_name);
      const dur = formatDuration(c.estimated_duration_seconds);
      const parts: string[] = [];
      if (instructor) parts.push(`مدرس: ${instructor}`);
      if (c.lessons_count) parts.push(`${fa(c.lessons_count)} درس`);
      if (dur) parts.push(dur);
      return {
        source: 'lms',
        id: `lms:${c.slug}`,
        title: clean(c.title),
        subtitle: parts.length ? parts.join(' · ') : clean(c.short_description),
        thumb: absoluteMediaUrl(c.cover_image),
        // See note above — LMS course detail route TBD.
        href: `/#education`,
        badge: c.enrollments_count ? `${fa(c.enrollments_count)} یادگیرنده` : undefined,
        pill: c.level ? (LEVEL_LABEL[c.level] ?? c.level) : undefined,
      };
    }),
  };
}

async function fetchKindness(
  q: string,
  facets: SearchFacets['kindness'] | undefined,
  signal: AbortSignal | undefined,
  limit: number,
  page = 1,
): Promise<SourceResult> {
  type L = {
    slug: string;
    title: string;
    listing_type?: 'need_help' | 'offer_help' | string;
    category?: { title?: string; slug?: string };
    province?: string;
    city?: string;
    cover_image?: string;
    view_count?: number;
  };
  const qs = buildQueryString(
    q,
    limit,
    {
      listing_type: facets?.listing_type,
      category: facets?.category,
      province: facets?.province,
      city: facets?.city,
      ordering: '-published_at',
    },
    page,
  );
  const data = await apiFetch<Paginated<L>>(`/kindness-wall/listings/?${qs}`, {
    signal,
    revalidate: 30,
    skipAuth: true,
  } as never);
  const { items, count } = unwrapCounted(data);
  return {
    count,
    hits: items.slice(0, limit).map((l) => {
      const loc = [l.city, l.province].filter(Boolean).join('، ');
      const catTitle = clean(l.category?.title);
      return {
        source: 'kindness',
        id: `kindness:${l.slug}`,
        title: clean(l.title),
        subtitle: [catTitle, loc].filter(Boolean).join(' · ') || undefined,
        thumb: absoluteMediaUrl(l.cover_image),
        // See note above — Kindness listing detail route TBD.
        href: `/#kindness`,
        badge: l.view_count ? `${fa(l.view_count)} بازدید` : undefined,
        pill:
          l.listing_type === 'need_help'
            ? 'نیازمند کمک'
            : l.listing_type === 'offer_help'
              ? 'پیشنهاد کمک'
              : undefined,
      };
    }),
  };
}

async function fetchTabyin(
  q: string,
  facets: SearchFacets['tabyin'] | undefined,
  signal: AbortSignal | undefined,
  limit: number,
  page = 1,
): Promise<SourceResult> {
  type T = {
    external_id: string;
    title?: string;
    description?: string;
    author_username?: string;
    primary_media_type?: string;
    attachments?: { url?: string; media_type?: string }[];
    origin?: string;
  };
  /**
   * قراردادِ تامنیلِ کارتِ جست‌وجو برای روایت‌ها:
   *   ۱) نخستین پیوستِ تصویری (عکسِ واقعی یا کاورِ پادکست)؛
   *   ۲) در نبودِ عکس: کاورِ GIFِ فریمِ اولِ ویدئو (نگاشتِ امنِ سرویسِ
   *      تامنیل‌سازِ منبع — videoCoverUrl)؛
   *   ۳) در غیر این صورت undefined تا جایگزینِ طراحی‌شده رندر شود.
   * نکته‌ی حساس: URLِ فایلِ MP4 هرگز به‌عنوانِ تامنیلِ <img> برگردانده
   * نمی‌شود — همان ریشه‌ی باگِ قبلی بود که کارت‌های ویدئویی را بی‌عکس
   * (آیکنِ بنفش) نشان می‌داد.
   */
  const tabyinThumb = (t: T): string | undefined => {
    const atts = Array.isArray(t.attachments) ? t.attachments : [];
    const image = atts.find((a) => a?.media_type === 'image' && a?.url)?.url;
    if (image) return absoluteMediaUrl(image);
    const video = atts.find((a) => a?.media_type === 'video' && a?.url)?.url;
    return videoCoverUrl(absoluteMediaUrl(video));
  };
  const qs = buildQueryString(
    q,
    limit,
    {
      media_type: facets?.media_type,
      author: facets?.author,
      ordering: '-source_created_at',
    },
    page,
  );
  const data = await apiFetch<Paginated<T>>(`/tabyin/contents/?${qs}`, {
    signal,
    revalidate: 30,
    skipAuth: true,
  } as never);
  const { items, count } = unwrapCounted(data);
  return {
    count,
    hits: items.slice(0, limit).map((t) => {
      const atts = Array.isArray(t.attachments) ? t.attachments : [];
      // نوعِ مؤثر از روی پیوست‌های واقعی — با همان قانونِ فید و صفحه‌ی
      // جزئیات («صوت همیشه می‌برد»)؛ برچسبِ بالادست primary_media_type
      // گاهی پادکستِ دارای کاورِ ویدئویی را به‌غلط «ویدئو» معرفی می‌کند.
      const kind = resolveContentKind(atts.map((a) => a?.media_type));
      const title =
        clean(t.title) ||
        (t.description ? clean(t.description).slice(0, 60) + '…' : 'محتوای تبیینی');
      return {
        source: 'tabyin',
        id: `tabyin:${t.external_id}`,
        title,
        subtitle: t.author_username ? `@${clean(t.author_username)}` : undefined,
        thumb: tabyinThumb(t),
        href: `/tabyin/${t.external_id}`,
        pill: contentKindTagFa(kind),
        kind,
        badge: t.origin === 'user_submitted' ? 'مردمی' : undefined,
      };
    }),
  };
}

const FETCHERS: {
  [K in SearchSource]: (
    q: string,
    facets: SearchFacets[K] | undefined,
    signal: AbortSignal | undefined,
    limit: number,
    page?: number,
  ) => Promise<SourceResult>;
} = {
  madadkar: fetchMadadkar,
  r4j: fetchR4J,
  lms: fetchLms,
  kindness: fetchKindness,
  tabyin: fetchTabyin,
};

/* ───────────────────────────────────────────────────────────────────────── */
/*  Aggregator                                                                */
/* ───────────────────────────────────────────────────────────────────────── */

export type SearchGroup = { source: SearchSource; hits: SearchHit[]; count: number };

export type SearchAggregate = {
  q: string;
  groups: SearchGroup[];
  /** جمعِ شمارِ واقعیِ سرور در همه‌ی منابع (نه طولِ برشِ نمایشی). */
  total: number;
  errored: SearchSource[];
};

export async function searchAll(
  q: string,
  opts?: {
    sources?: SearchSource[];
    facets?: SearchFacets;
    signal?: AbortSignal;
    /** سقفِ آیتم‌های نمایشیِ هر منبع؛ پیش‌فرض: برشِ سبکِ دراپ‌داون (۵). */
    perSourceLimit?: number;
  },
): Promise<SearchAggregate> {
  const cleaned = (q ?? '').trim();
  const empty: SearchAggregate = { q: cleaned, groups: [], total: 0, errored: [] };
  if (!cleaned || cleaned.length < 2) return empty;

  const wanted = opts?.sources ?? SEARCH_SOURCE_ORDER;
  const limit = Math.max(1, Math.min(100, opts?.perSourceLimit ?? PER_SOURCE_LIMIT));
  const settled = await Promise.allSettled(
    wanted.map((src) => {
      const fn = FETCHERS[src];
      const facets = opts?.facets?.[src];
      // TypeScript can't correlate the per-source facet type through the
      // discriminant here — the mapped type on FETCHERS already enforces
      // it at each fetcher's declaration site, so this cast is safe.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (fn as any)(cleaned, facets, opts?.signal, limit);
    }),
  );

  const groups: SearchAggregate['groups'] = [];
  const errored: SearchSource[] = [];
  let total = 0;
  settled.forEach((result, idx) => {
    const src = wanted[idx];
    if (result.status === 'fulfilled') {
      if (result.value.hits.length) {
        groups.push({ source: src, hits: result.value.hits, count: result.value.count });
        total += result.value.count;
      }
    } else {
      const reason = result.reason as { name?: string } | undefined;
      if (reason?.name !== 'AbortError') errored.push(src);
    }
  });

  groups.sort(
    (a, b) => SEARCH_SOURCE_ORDER.indexOf(a.source) - SEARCH_SOURCE_ORDER.indexOf(b.source),
  );

  return { q: cleaned, groups, total, errored };
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  واکشیِ صفحه‌ایِ تکیِ یک منبع — موتورِ «نمایشِ بیشتر» در /search           */
/* ───────────────────────────────────────────────────────────────────────── */

export type SearchSourcePage = {
  source: SearchSource;
  q: string;
  page: number;
  pageSize: number;
  hits: SearchHit[];
  count: number;
  /** آیا بعد از این صفحه هنوز نتیجه‌ی نمایش‌نیافته روی سرور هست؟ */
  hasMore: boolean;
};

/**
 * نتیجه‌ی «فقط یک منبع» را صفحه‌به‌صفحه می‌آورد — مکملِ searchAll که همه‌ی
 * منابع را با هم و فقط صفحه‌ی اول را می‌گیرد. صفحه‌ی /search برشِ اولیه را
 * سرور-ساید رندر می‌کند و دکمه‌ی «نمایش بیشتر» همین تابع را کلاینت-ساید
 * صدا می‌زند تا کاربر بدون ترکِ صفحه، هر ۷۲ نتیجه را ببیند.
 *
 * صفحه و اندازه‌ی صفحه سخت clamp می‌شوند (page ∈ [1,1000]،
 * pageSize ∈ [1,100] — مطابق سقفِ page_size در StandardPaginationِ بک‌اند).
 */
export async function searchSourcePage(
  source: SearchSource,
  q: string,
  opts?: { page?: number; pageSize?: number; signal?: AbortSignal },
): Promise<SearchSourcePage> {
  const cleaned = (q ?? '').trim();
  const page = Math.max(1, Math.min(1000, Math.trunc(opts?.page ?? 1) || 1));
  const pageSize = Math.max(
    1,
    Math.min(100, Math.trunc(opts?.pageSize ?? SEARCH_MORE_PAGE_SIZE) || SEARCH_MORE_PAGE_SIZE),
  );
  if (!cleaned || cleaned.length < 2) {
    return { source, q: cleaned, page, pageSize, hits: [], count: 0, hasMore: false };
  }
  const fn = FETCHERS[source];
  // TypeScript can't correlate per-source facets through the discriminant;
  // page-fetching never combines facets (they belong to the server-rendered
  // first slice via searchAll), so `undefined` is the honest value here.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { hits, count } = await (fn as any)(cleaned, undefined, opts?.signal, pageSize, page);
  return {
    source,
    q: cleaned,
    page,
    pageSize,
    hits,
    count,
    hasMore: page * pageSize < count,
  };
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  Recent searches — localStorage                                            */
/* ───────────────────────────────────────────────────────────────────────── */

const STORAGE_KEY = 'sj.recent-searches';
const MAX_RECENT = 6;

export function loadRecent(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === 'string').slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

export function pushRecent(q: string): string[] {
  if (typeof window === 'undefined') return [];
  const cleaned = (q ?? '').trim();
  if (!cleaned) return loadRecent();
  const list = [cleaned, ...loadRecent().filter((x) => x !== cleaned)].slice(0, MAX_RECENT);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
  return list;
}

export function clearRecent(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  Trending presets                                                          */
/* ───────────────────────────────────────────────────────────────────────── */

export const TRENDING_QUERIES: { label: string; q: string; source?: SearchSource }[] = [
  { label: 'حرکت‌های فعال', q: 'فعال', source: 'madadkar' },
  { label: 'دوره‌های امداد', q: 'امداد', source: 'lms' },
  { label: 'نیازمند کمک', q: 'نیازمند', source: 'kindness' },
  { label: 'روایت‌های مردمی', q: 'مردمی', source: 'tabyin' },
];
