/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  Kindness Wall (دیوار مهربانی) — typed API client.
 *
 *  Mirrors every PUBLIC + USER endpoint on `apps/kindness_wall/urls.py`.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { apiFetch, safeApiFetch, type Paginated } from './api';

/* ───────────────────────────────────────────────────────────────────────── */
/*  Types                                                                     */
/* ───────────────────────────────────────────────────────────────────────── */

export type KindnessCategory = {
  id: number;
  slug: string;
  title: string;
  description?: string;
  icon?: string | null;
  parent_id?: number | null;
  is_active?: boolean;
  listings_count?: number;
};

export type KindnessListingImage = { id: number; image: string; is_cover?: boolean; alt_text?: string };

export type KindnessListingType = 'need_help' | 'offer_help';

export type KindnessListingSummary = {
  id: number;
  slug: string;
  listing_type: KindnessListingType;
  category: KindnessCategory | null;
  title: string;
  province?: string;
  city?: string;
  district?: string;
  owner_full_name_snapshot?: string;
  owner_avatar_snapshot?: string | null;
  published_at?: string | null;
  expires_at?: string | null;
  view_count?: number;
  cover_image?: string | null;
};

export type KindnessListingDetail = KindnessListingSummary & {
  description: string;
  address_hint?: string;
  images: KindnessListingImage[];
  contact_available: boolean;
};

export type KindnessMatch = {
  id: number;
  target_listing: KindnessListingSummary;
  score: number;
  score_breakdown?: Record<string, number>;
  reason_codes?: string[];
  explanation?: string;
  status: string;
  generated_at?: string;
};

export type KindnessBookmark = {
  id: number;
  listing: KindnessListingSummary;
  created_at: string;
};

/* ───────────────────────────────────────────────────────────────────────── */
/*  Public                                                                    */
/* ───────────────────────────────────────────────────────────────────────── */

export function listCategories() {
  return safeApiFetch<Paginated<KindnessCategory>>('/kindness-wall/categories/', {
    revalidate: 600, tags: ['kindness', 'categories'],
  });
}

export type ListingListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  listing_type?: KindnessListingType;
  category?: string; // slug
  province?: string;
  city?: string;
  ordering?: '-published_at' | 'published_at';
};

export function listListings(params?: ListingListParams) {
  const qs = new URLSearchParams();
  if (params) Object.entries(params).forEach(([k, v]) => v != null && v !== '' && qs.set(k, String(v)));
  const q = qs.toString();
  return safeApiFetch<Paginated<KindnessListingSummary>>(
    `/kindness-wall/listings/${q ? `?${q}` : ''}`,
    { revalidate: 120, tags: ['kindness', 'listings'] },
  );
}

export function getListing(slug: string) {
  return apiFetch<KindnessListingDetail>(
    `/kindness-wall/listings/${encodeURIComponent(slug)}/`,
    { revalidate: 60, tags: ['kindness', 'listing', slug], skipAuth: true } as never,
  );
}

export function safeGetListing(slug: string) {
  return safeApiFetch<KindnessListingDetail>(
    `/kindness-wall/listings/${encodeURIComponent(slug)}/`,
    { revalidate: 60, tags: ['kindness', 'listing', slug] },
  );
}

export function getListingMatches(slug: string) {
  return apiFetch<Paginated<KindnessMatch> | KindnessMatch[]>(
    `/kindness-wall/listings/${encodeURIComponent(slug)}/matches/`,
    { revalidate: 60, tags: ['kindness', 'listing', slug, 'matches'], skipAuth: true } as never,
  );
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  User actions                                                              */
/* ───────────────────────────────────────────────────────────────────────── */

export function revealContact(slug: string) {
  return apiFetch<{ phone: string; owner_name?: string; expires_at?: string }>(
    `/kindness-wall/listings/${encodeURIComponent(slug)}/reveal-contact/`,
    { method: 'POST' },
  );
}

export function reportListing(slug: string, reason: string, notes?: string) {
  return apiFetch<{ id: number; status: string }>(
    `/kindness-wall/listings/${encodeURIComponent(slug)}/report/`,
    { method: 'POST', body: JSON.stringify({ reason, notes: notes ?? '' }) },
  );
}

export function bookmarkListing(slug: string) {
  return apiFetch<{ bookmarked: boolean }>(
    `/kindness-wall/listings/${encodeURIComponent(slug)}/bookmark/`,
    { method: 'POST' },
  );
}

export function myListings(params?: { page?: number; page_size?: number; status?: string }) {
  const qs = new URLSearchParams();
  if (params) Object.entries(params).forEach(([k, v]) => v != null && v !== '' && qs.set(k, String(v)));
  const q = qs.toString();
  return apiFetch<Paginated<KindnessListingDetail>>(
    `/kindness-wall/me/listings/${q ? `?${q}` : ''}`,
  );
}

export function createMyListing(payload: FormData | Record<string, unknown>) {
  return apiFetch<KindnessListingDetail>('/kindness-wall/me/listings/', {
    method: 'POST',
    body: payload instanceof FormData ? payload : JSON.stringify(payload),
  });
}

export function updateMyListing(id: number | string, payload: FormData | Record<string, unknown>) {
  return apiFetch<KindnessListingDetail>(`/kindness-wall/me/listings/${id}/`, {
    method: 'PATCH',
    body: payload instanceof FormData ? payload : JSON.stringify(payload),
  });
}

export function submitMyListing(id: number | string) {
  return apiFetch<KindnessListingDetail>(`/kindness-wall/me/listings/${id}/submit/`, { method: 'POST' });
}

export function renewMyListing(id: number | string) {
  return apiFetch<KindnessListingDetail>(`/kindness-wall/me/listings/${id}/renew/`, { method: 'POST' });
}

export function closeMyListing(id: number | string) {
  return apiFetch<KindnessListingDetail>(`/kindness-wall/me/listings/${id}/close/`, { method: 'POST' });
}

export function myBookmarks(params?: { page?: number; page_size?: number }) {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.page_size) qs.set('page_size', String(params.page_size));
  const q = qs.toString();
  return apiFetch<Paginated<KindnessBookmark>>(`/kindness-wall/me/bookmarks/${q ? `?${q}` : ''}`);
}

export function myMatches(params?: { page?: number; page_size?: number }) {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.page_size) qs.set('page_size', String(params.page_size));
  const q = qs.toString();
  return apiFetch<Paginated<KindnessMatch>>(`/kindness-wall/me/matches/${q ? `?${q}` : ''}`);
}

export function dismissMatch(id: number | string) {
  return apiFetch<{ id: number; status: string }>(`/kindness-wall/me/matches/${id}/dismiss/`, { method: 'POST' });
}

export function markMatchContacted(id: number | string) {
  return apiFetch<{ id: number; status: string; contacted_at: string }>(
    `/kindness-wall/me/matches/${id}/contacted/`,
    { method: 'POST' },
  );
}
