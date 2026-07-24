/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  Tabyin (جهاد تبیین) — typed API client.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { apiFetch, safeApiFetch, type Paginated } from './api';

export type TabyinMediaType = 'image' | 'video' | 'audio' | 'other';

export type TabyinAttachment = {
  id: number;
  url: string;
  media_type: TabyinMediaType;
  media_type_display?: string;
  size?: number;
  duration?: number;
  file_size?: number;
  title?: string;
  order?: number;
};

export type TabyinContentListItem = {
  external_id: string;
  title: string;
  description?: string;
  author_username?: string;
  origin?: 'external' | 'user_submitted';
  source_created_at?: string;
  source_url?: string;
  primary_media_type?: TabyinMediaType;
  attachments: TabyinAttachment[];
};

export type TabyinContentDetail = TabyinContentListItem & {
  source_entity_id?: string;
  source_updated_at?: string;
};

/* ───────────────────────────────────────────────────────────────────────── */

export type TabyinListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  media_type?: TabyinMediaType;
  author?: string;
  ordering?: '-source_created_at' | 'source_created_at';
};

export function listContents(params?: TabyinListParams) {
  const qs = new URLSearchParams();
  if (params) Object.entries(params).forEach(([k, v]) => v != null && v !== '' && qs.set(k, String(v)));
  const q = qs.toString();
  return safeApiFetch<Paginated<TabyinContentListItem>>(
    `/tabyin/contents/${q ? `?${q}` : ''}`,
    { revalidate: 120, tags: ['tabyin', 'contents'] },
  );
}

export function getContent(externalId: string) {
  return apiFetch<TabyinContentDetail>(
    `/tabyin/contents/${encodeURIComponent(externalId)}/`,
    { revalidate: 120, tags: ['tabyin', 'content', externalId], skipAuth: true } as never,
  );
}

export function safeGetContent(externalId: string) {
  return safeApiFetch<TabyinContentDetail>(
    `/tabyin/contents/${encodeURIComponent(externalId)}/`,
    { revalidate: 120, tags: ['tabyin', 'content', externalId] },
  );
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  User submissions                                                          */
/* ───────────────────────────────────────────────────────────────────────── */

export function mySubmissions(params?: { page?: number; page_size?: number }) {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.page_size) qs.set('page_size', String(params.page_size));
  const q = qs.toString();
  return apiFetch<Paginated<TabyinContentListItem>>(`/tabyin/me/submissions/${q ? `?${q}` : ''}`);
}

export function mySubmission(externalId: string) {
  return apiFetch<TabyinContentDetail>(`/tabyin/me/submissions/${encodeURIComponent(externalId)}/`);
}

export function createSubmission(payload: FormData) {
  return apiFetch<TabyinContentDetail>('/tabyin/me/submissions/', { method: 'POST', body: payload });
}
