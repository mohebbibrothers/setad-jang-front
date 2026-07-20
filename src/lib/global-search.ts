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

/* ───────────────────────────────────────────────────────────────────────── */
/*  Public types                                                              */
/* ───────────────────────────────────────────────────────────────────────── */

export type SearchSource =
  | 'madadkar'
  | 'r4j'
  | 'lms'
  | 'kindness'
  | 'tabyin';

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
    status?:           'PUBLISHED' | 'COMPLETED' | 'CLOSED';
    has_deadline?:     boolean;
    is_fully_funded?:  boolean;
    sponsor_slug?:     string;
  };
  r4j?: {
    country?:  string;
    province?: string;
    city?:     string;
    gender?:   'male' | 'female' | 'other';
  };
  lms?: {
    category?: string; // category slug (iexact)
    level?:    'beginner' | 'intermediate' | 'advanced' | 'professional';
  };
  kindness?: {
    listing_type?: 'need_help' | 'offer_help';
    category?:     string; // category slug
    province?:     string;
    city?:         string;
  };
  tabyin?: {
    media_type?: 'image' | 'video' | 'audio' | 'other';
    author?:     string; // icontains
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
    seeAllHref: (q, f) => seeAllUrl('/madadkar', q, f),
  },
  r4j: {
    key: 'r4j',
    label: 'جایزه‌ای برای عدالت',
    shortLabel: 'پرونده‌ها',
    glyph: 'gavel',
    accent: 'rose',
    seeAllHref: (q, f) => seeAllUrl('/r4j', q, f),
  },
  lms: {
    key: 'lms',
    label: 'قرارگاه آموزشی',
    shortLabel: 'دوره‌ها',
    glyph: 'graduation',
    accent: 'amber',
    seeAllHref: (q, f) => seeAllUrl('/lms', q, f),
  },
  kindness: {
    key: 'kindness',
    label: 'دیوار مهربانی',
    shortLabel: 'آگهی‌ها',
    glyph: 'heart',
    accent: 'mint',
    seeAllHref: (q, f) => seeAllUrl('/kindness-wall', q, f),
  },
  tabyin: {
    key: 'tabyin',
    label: 'جهاد تبیین',
    shortLabel: 'محتواها',
    glyph: 'megaphone',
    accent: 'violet',
    seeAllHref: (q, f) => seeAllUrl('/tabyin', q, f),
  },
};

export const SEARCH_SOURCE_ORDER: SearchSource[] = [
  'madadkar', 'r4j', 'lms', 'kindness', 'tabyin',
];

/* ───────────────────────────────────────────────────────────────────────── */
/*  Formatting helpers                                                        */
/* ───────────────────────────────────────────────────────────────────────── */

const LEVEL_LABEL: Record<string, string> = {
  beginner:     'مقدماتی',
  intermediate: 'متوسط',
  advanced:     'پیشرفته',
  professional: 'حرفه‌ای',
};

const MEDIA_LABEL: Record<string, string> = {
  image: 'تصویر',
  video: 'ویدئو',
  audio: 'صوت',
  other: 'سایر',
};

const CAMPAIGN_STATUS_LABEL: Record<string, string> = {
  PUBLISHED: 'فعال',
  COMPLETED: 'تکمیل شد',
  CLOSED:    'بسته شد',
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
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1).replace('.0', '')} میلیارد تومان`;
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(1).replace('.0', '')} میلیون تومان`;
  if (n >= 1_000)         return `${(n / 1_000).toFixed(0)} هزار تومان`;
  return `${fa(n)} تومان`;
}

function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${fa(h)}س ${fa(m)}د`;
  if (h > 0)          return `${fa(h)} ساعت`;
  return `${fa(m)} دقیقه`;
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  Per-source fetchers                                                       */
/* ───────────────────────────────────────────────────────────────────────── */

type Paginated<T> = { results?: T[]; count?: number } | T[];

function unwrap<T>(p: Paginated<T> | null | undefined): T[] {
  if (!p) return [];
  if (Array.isArray(p)) return p;
  return p.results ?? [];
}

const PER_SOURCE_LIMIT = 5;

function buildQueryString(q: string, extra?: Record<string, string | boolean | undefined>): string {
  const params = new URLSearchParams();
  params.set('search', q);
  params.set('page_size', String(PER_SOURCE_LIMIT));
  if (extra) {
    Object.entries(extra).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && v !== false) params.set(k, String(v));
    });
  }
  return params.toString();
}

async function fetchMadadkar(
  q: string,
  facets: SearchFacets['madadkar'] | undefined,
  signal?: AbortSignal,
): Promise<SearchHit[]> {
  type C = {
    slug: string; title: string;
    sponsor?: { name?: string; slug?: string };
    progress_percent?: number;
    cover_image?: string;
    is_fully_funded?: boolean;
    status?: string;
    status_display?: string;
    participant_count?: number;
    total_amount?: number;
  };
  const qs = buildQueryString(q, {
    status:          facets?.status,
    has_deadline:    facets?.has_deadline,
    is_fully_funded: facets?.is_fully_funded,
    sponsor_slug:    facets?.sponsor_slug,
    ordering:        '-published_at',
  });
  const data = await apiFetch<Paginated<C>>(
    `/madadkar/campaigns/?${qs}`,
    { signal, revalidate: 30, skipAuth: true } as never,
  );
  return unwrap(data).slice(0, PER_SOURCE_LIMIT).map((c) => {
    const sponsorName = clean(c.sponsor?.name);
    const progress = typeof c.progress_percent === 'number' ? Math.round(c.progress_percent) : null;
    const subtitle = sponsorName ? `مددکار: ${sponsorName}` : undefined;
    const badge = progress !== null ? `${fa(progress)}٪ تأمین شد` : undefined;
    const statusPill =
      c.is_fully_funded ? 'تکمیل شد'
        : c.status ? CAMPAIGN_STATUS_LABEL[c.status] ?? c.status_display
        : c.status_display;
    return {
      source:   'madadkar',
      id:       `madadkar:${c.slug}`,
      title:    clean(c.title) || 'حرکت بدون عنوان',
      subtitle,
      thumb:    absoluteMediaUrl(c.cover_image),
      href:     `/madadkar/${c.slug}`,
      badge,
      pill:     statusPill,
    };
  });
}

async function fetchR4J(
  q: string,
  facets: SearchFacets['r4j'] | undefined,
  signal?: AbortSignal,
): Promise<SearchHit[]> {
  type P = {
    slug: string;
    first_name?: string;
    last_name?: string;
    country?: string;
    province?: string;
    city?: string;
    primary_photo?: { image?: string } | null;
    total_bounty_toman?: number;
    bounties_count?: number;
  };
  const qs = buildQueryString(q, {
    country:  facets?.country,
    province: facets?.province,
    city:     facets?.city,
    gender:   facets?.gender,
    ordering: '-total_bounty_toman',
  });
  const data = await apiFetch<Paginated<P>>(
    `/r4j/criminals/?${qs}`,
    { signal, revalidate: 60, skipAuth: true } as never,
  );
  return unwrap(data).slice(0, PER_SOURCE_LIMIT).map((p) => {
    const fullName = clean(`${p.first_name ?? ''} ${p.last_name ?? ''}`) || p.slug;
    const loc = [p.city, p.province, p.country].filter(Boolean).join('، ');
    return {
      source:   'r4j',
      id:       `r4j:${p.slug}`,
      title:    fullName,
      subtitle: loc || undefined,
      thumb:    absoluteMediaUrl(p.primary_photo?.image ?? null),
      href:     `/r4j/${p.slug}`,
      badge:    p.total_bounty_toman ? formatToman(p.total_bounty_toman) : undefined,
      pill:     p.bounties_count ? `${fa(p.bounties_count)} جایزه` : undefined,
    };
  });
}

async function fetchLms(
  q: string,
  facets: SearchFacets['lms'] | undefined,
  signal?: AbortSignal,
): Promise<SearchHit[]> {
  type Co = {
    slug: string; title: string;
    subtitle?: string;
    short_description?: string;
    instructor_name?: string;
    level?: string;
    cover_image?: string;
    lessons_count?: number;
    estimated_duration_seconds?: number;
    enrollments_count?: number;
  };
  const qs = buildQueryString(q, {
    category: facets?.category,
    level:    facets?.level,
    ordering: '-published_at',
  });
  const data = await apiFetch<Paginated<Co>>(
    `/lms/courses/?${qs}`,
    { signal, revalidate: 30, skipAuth: true } as never,
  );
  return unwrap(data).slice(0, PER_SOURCE_LIMIT).map((c) => {
    const instructor = clean(c.instructor_name);
    const dur        = formatDuration(c.estimated_duration_seconds);
    const parts: string[] = [];
    if (instructor) parts.push(`مدرس: ${instructor}`);
    if (c.lessons_count) parts.push(`${fa(c.lessons_count)} درس`);
    if (dur) parts.push(dur);
    return {
      source:   'lms',
      id:       `lms:${c.slug}`,
      title:    clean(c.title),
      subtitle: parts.length ? parts.join(' · ') : clean(c.short_description),
      thumb:    absoluteMediaUrl(c.cover_image),
      href:     `/lms/courses/${c.slug}`,
      badge:    c.enrollments_count ? `${fa(c.enrollments_count)} یادگیرنده` : undefined,
      pill:     c.level ? LEVEL_LABEL[c.level] ?? c.level : undefined,
    };
  });
}

async function fetchKindness(
  q: string,
  facets: SearchFacets['kindness'] | undefined,
  signal?: AbortSignal,
): Promise<SearchHit[]> {
  type L = {
    slug: string; title: string;
    listing_type?: 'need_help' | 'offer_help' | string;
    category?: { title?: string; slug?: string };
    province?: string; city?: string;
    cover_image?: string;
    view_count?: number;
  };
  const qs = buildQueryString(q, {
    listing_type: facets?.listing_type,
    category:     facets?.category,
    province:     facets?.province,
    city:         facets?.city,
    ordering:     '-published_at',
  });
  const data = await apiFetch<Paginated<L>>(
    `/kindness-wall/listings/?${qs}`,
    { signal, revalidate: 30, skipAuth: true } as never,
  );
  return unwrap(data).slice(0, PER_SOURCE_LIMIT).map((l) => {
    const loc = [l.city, l.province].filter(Boolean).join('، ');
    const catTitle = clean(l.category?.title);
    return {
      source:   'kindness',
      id:       `kindness:${l.slug}`,
      title:    clean(l.title),
      subtitle: [catTitle, loc].filter(Boolean).join(' · ') || undefined,
      thumb:    absoluteMediaUrl(l.cover_image),
      href:     `/kindness-wall/${l.slug}`,
      badge:    l.view_count ? `${fa(l.view_count)} بازدید` : undefined,
      pill:
        l.listing_type === 'need_help'  ? 'نیازمند کمک'
          : l.listing_type === 'offer_help' ? 'پیشنهاد کمک'
          : undefined,
    };
  });
}

async function fetchTabyin(
  q: string,
  facets: SearchFacets['tabyin'] | undefined,
  signal?: AbortSignal,
): Promise<SearchHit[]> {
  type T = {
    external_id: string;
    title?: string;
    description?: string;
    author_username?: string;
    primary_media_type?: string;
    attachments?: { url?: string; media_type?: string }[];
    origin?: string;
  };
  const qs = buildQueryString(q, {
    media_type: facets?.media_type,
    author:     facets?.author,
    ordering:   '-source_created_at',
  });
  const data = await apiFetch<Paginated<T>>(
    `/tabyin/contents/?${qs}`,
    { signal, revalidate: 30, skipAuth: true } as never,
  );
  return unwrap(data).slice(0, PER_SOURCE_LIMIT).map((t) => {
    const image = t.attachments?.find((a) => a.media_type === 'image')?.url
                ?? t.attachments?.[0]?.url;
    const title = clean(t.title)
                  || (t.description ? clean(t.description).slice(0, 60) + '…' : 'محتوای تبیینی');
    return {
      source:   'tabyin',
      id:       `tabyin:${t.external_id}`,
      title,
      subtitle: t.author_username ? `@${clean(t.author_username)}` : undefined,
      thumb:    absoluteMediaUrl(image),
      href:     `/tabyin/${t.external_id}`,
      pill:     t.primary_media_type ? MEDIA_LABEL[t.primary_media_type] ?? t.primary_media_type : undefined,
      badge:    t.origin === 'user_submitted' ? 'مردمی' : undefined,
    };
  });
}

const FETCHERS: {
  [K in SearchSource]: (
    q: string,
    facets: SearchFacets[K] | undefined,
    signal?: AbortSignal,
  ) => Promise<SearchHit[]>;
} = {
  madadkar: fetchMadadkar,
  r4j:      fetchR4J,
  lms:      fetchLms,
  kindness: fetchKindness,
  tabyin:   fetchTabyin,
};

/* ───────────────────────────────────────────────────────────────────────── */
/*  Aggregator                                                                */
/* ───────────────────────────────────────────────────────────────────────── */

export type SearchAggregate = {
  q: string;
  groups: { source: SearchSource; hits: SearchHit[] }[];
  total: number;
  errored: SearchSource[];
};

export async function searchAll(
  q: string,
  opts?: {
    sources?: SearchSource[];
    facets?: SearchFacets;
    signal?: AbortSignal;
  },
): Promise<SearchAggregate> {
  const cleaned = (q ?? '').trim();
  const empty: SearchAggregate = { q: cleaned, groups: [], total: 0, errored: [] };
  if (!cleaned || cleaned.length < 2) return empty;

  const wanted = opts?.sources ?? SEARCH_SOURCE_ORDER;
  const settled = await Promise.allSettled(
    wanted.map((src) => {
      const fn = FETCHERS[src];
      const facets = opts?.facets?.[src];
      // TypeScript can't correlate the per-source facet type through the
      // discriminant here — the mapped type on FETCHERS already enforces
      // it at each fetcher's declaration site, so this cast is safe.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (fn as any)(cleaned, facets, opts?.signal);
    }),
  );

  const groups: SearchAggregate['groups'] = [];
  const errored: SearchSource[] = [];
  let total = 0;
  settled.forEach((result, idx) => {
    const src = wanted[idx];
    if (result.status === 'fulfilled') {
      if (result.value.length) {
        groups.push({ source: src, hits: result.value });
        total += result.value.length;
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
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch { /* ignore */ }
  return list;
}

export function clearRecent(): void {
  if (typeof window === 'undefined') return;
  try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  Trending presets                                                          */
/* ───────────────────────────────────────────────────────────────────────── */

export const TRENDING_QUERIES: { label: string; q: string; source?: SearchSource }[] = [
  { label: 'حرکت‌های فعال',   q: 'فعال',   source: 'madadkar' },
  { label: 'دوره‌های امداد',  q: 'امداد',  source: 'lms' },
  { label: 'نیازمند کمک',    q: 'نیازمند', source: 'kindness' },
  { label: 'روایت‌های مردمی', q: 'مردمی',  source: 'tabyin' },
];
