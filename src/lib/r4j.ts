/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  R4J (جایزه‌ای برای عدالت) — typed API client.
 *
 *  Mirrors every PUBLIC + USER endpoint on `apps/r4j/urls.py`.
 *
 *  Public
 *  ------
 *  GET  /r4j/criminals/                            list criminals
 *  GET  /r4j/criminals/{lookup}/                   criminal detail
 *
 *  User (Bearer)
 *  -------------
 *  POST /r4j/criminals/{id}/reports/               submit a new report
 *  POST /r4j/criminals/{id}/bounty/                set / update my bounty
 *  GET  /r4j/me/reports/                           my report history
 *  GET  /r4j/me/reports/{id}/                      one of my reports
 *  POST /r4j/me/reports/{id}/cancel/               request cancel
 *  GET  /r4j/me/bounties/                          my bounty pledges
 *  POST /r4j/me/bounties/{id}/cancel/              request bounty cancel
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { apiFetch, safeApiFetch, type Paginated } from './api';

/* ───────────────────────────────────────────────────────────────────────── */
/*  Types                                                                     */
/* ───────────────────────────────────────────────────────────────────────── */

export type R4JGender = 'male' | 'female' | 'unknown';

export type R4JPhoto  = { id: number; image: string; caption?: string | null; is_primary?: boolean; order?: number };
export type R4JAlias  = { id: number; alias: string };
export type R4JPhone  = { id: number; label?: string; number: string; notes?: string | null };
export type R4JSocial = { id: number; platform: string; handle_or_url: string };
export type R4JAttachment = {
  id: number;
  file: string;
  title: string;
  kind: string;
  description?: string | null;
  file_size?: number;
  file_sha256?: string;
  created_at?: string;
};

export type R4JCriminalListItem = {
  id: number;
  slug: string;
  first_name: string | null;
  last_name: string | null;
  country?: string | null;
  province?: string | null;
  city?: string | null;
  primary_photo?: { image: string } | null;
  total_bounty_toman?: number;
  bounties_count?: number;
  gender?: R4JGender | null;
  published_at?: string | null;
};

export type R4JCriminalDetail = {
  id: number;
  slug: string;
  first_name: string | null;
  last_name: string | null;
  national_code: string | null;
  birth_date: string | null;
  gender: R4JGender | null;
  country: string | null;
  province: string | null;
  city: string | null;
  description: string | null;
  crimes_summary: string | null;
  other_info: string | null;
  photos: R4JPhoto[];
  phones: R4JPhone[];
  socials: R4JSocial[];
  attachments: R4JAttachment[];
  aliases: R4JAlias[];
  total_bounty_toman: number;
  bounties_count: number;
  published_at: string | null;
};

export type R4JBounty = {
  id: number;
  criminal_id: number;
  criminal_name?: string;
  amount_toman: number;
  status: 'active' | 'cancel_requested' | 'canceled' | 'rejected';
  status_display?: string;
  cancel_reason?: string | null;
  cancel_requested_at?: string | null;
  canceled_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type R4JReportFieldChange = {
  id?: number;
  field_name: string;
  current_value?: string | null;
  suggested_value: string;
  status?: 'pending' | 'approved' | 'rejected';
  admin_note?: string | null;
};

export type R4JReportAliasSuggestion  = { id?: number; alias: string };
export type R4JReportPhoneSuggestion  = { id?: number; label?: string; number: string };
export type R4JReportSocialSuggestion = { id?: number; platform: string; handle_or_url: string };

export type R4JReport = {
  id: number;
  criminal_id: number;
  criminal_name?: string;
  notes: string;
  status: 'pending' | 'under_review' | 'accepted' | 'rejected' | 'canceled';
  admin_note?: string | null;
  field_changes: R4JReportFieldChange[];
  alias_suggestions: R4JReportAliasSuggestion[];
  phone_suggestions: R4JReportPhoneSuggestion[];
  social_suggestions: R4JReportSocialSuggestion[];
  attachments: Array<{ id: number; file: string; title?: string; file_size?: number; file_sha256?: string }>;
  cancel_requested_at?: string | null;
  canceled_at?: string | null;
  created_at: string;
  updated_at: string;
};

/* ───────────────────────────────────────────────────────────────────────── */
/*  Public                                                                    */
/* ───────────────────────────────────────────────────────────────────────── */

export type R4JCriminalListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  country?: string;
  province?: string;
  city?: string;
  gender?: R4JGender;
};

export function listCriminals(params?: R4JCriminalListParams) {
  const qs = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v === undefined || v === '' || v === null) return;
      qs.set(k, String(v));
    });
  }
  const q = qs.toString();
  return safeApiFetch<Paginated<R4JCriminalListItem>>(
    `/r4j/criminals/${q ? `?${q}` : ''}`,
    { revalidate: 180, tags: ['r4j', 'criminals'] },
  );
}

export function getCriminal(lookup: string) {
  return apiFetch<R4JCriminalDetail>(
    `/r4j/criminals/${encodeURIComponent(lookup)}/`,
    { revalidate: 90, tags: ['r4j', 'criminal', lookup], skipAuth: true } as never,
  );
}

export function safeGetCriminal(lookup: string) {
  return safeApiFetch<R4JCriminalDetail>(
    `/r4j/criminals/${encodeURIComponent(lookup)}/`,
    { revalidate: 90, tags: ['r4j', 'criminal', lookup] },
  );
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  User actions (Bearer)                                                     */
/* ───────────────────────────────────────────────────────────────────────── */

export type SubmitReportInput = {
  notes?: string;
  field_changes?: R4JReportFieldChange[];
  alias_suggestions?: R4JReportAliasSuggestion[];
  phone_suggestions?: R4JReportPhoneSuggestion[];
  social_suggestions?: R4JReportSocialSuggestion[];
  attachments?: File[];
};

export function submitReport(criminalId: number, input: SubmitReportInput) {
  // Multipart when attachments are provided; JSON otherwise.
  if (input.attachments && input.attachments.length) {
    const fd = new FormData();
    if (input.notes) fd.set('notes', input.notes);
    if (input.field_changes?.length)      fd.set('field_changes',      JSON.stringify(input.field_changes));
    if (input.alias_suggestions?.length)  fd.set('alias_suggestions',  JSON.stringify(input.alias_suggestions));
    if (input.phone_suggestions?.length)  fd.set('phone_suggestions',  JSON.stringify(input.phone_suggestions));
    if (input.social_suggestions?.length) fd.set('social_suggestions', JSON.stringify(input.social_suggestions));
    for (const f of input.attachments) fd.append('attachments', f);
    return apiFetch<R4JReport>(`/r4j/criminals/${criminalId}/reports/`, {
      method: 'POST', body: fd,
    });
  }
  return apiFetch<R4JReport>(`/r4j/criminals/${criminalId}/reports/`, {
    method: 'POST',
    body: JSON.stringify({
      notes: input.notes ?? '',
      field_changes:      input.field_changes ?? [],
      alias_suggestions:  input.alias_suggestions ?? [],
      phone_suggestions:  input.phone_suggestions ?? [],
      social_suggestions: input.social_suggestions ?? [],
    }),
  });
}

export function setBounty(criminalId: number, amount_toman: number) {
  return apiFetch<R4JBounty>(`/r4j/criminals/${criminalId}/bounty/`, {
    method: 'POST',
    body: JSON.stringify({ amount_toman }),
  });
}

export function myReports(params?: { page?: number; page_size?: number; status?: string }) {
  const qs = new URLSearchParams();
  if (params) Object.entries(params).forEach(([k, v]) => v != null && v !== '' && qs.set(k, String(v)));
  const q = qs.toString();
  return apiFetch<Paginated<R4JReport>>(`/r4j/me/reports/${q ? `?${q}` : ''}`);
}

export function myReport(id: number | string) {
  return apiFetch<R4JReport>(`/r4j/me/reports/${id}/`);
}

export function cancelMyReport(id: number | string, reason?: string) {
  return apiFetch<R4JReport>(`/r4j/me/reports/${id}/cancel/`, {
    method: 'POST',
    body: JSON.stringify({ reason: reason ?? '' }),
  });
}

export function myBounties(params?: { page?: number; page_size?: number; status?: string }) {
  const qs = new URLSearchParams();
  if (params) Object.entries(params).forEach(([k, v]) => v != null && v !== '' && qs.set(k, String(v)));
  const q = qs.toString();
  return apiFetch<Paginated<R4JBounty>>(`/r4j/me/bounties/${q ? `?${q}` : ''}`);
}

export function cancelMyBounty(id: number | string, reason?: string) {
  return apiFetch<R4JBounty>(`/r4j/me/bounties/${id}/cancel/`, {
    method: 'POST',
    body: JSON.stringify({ reason: reason ?? '' }),
  });
}
