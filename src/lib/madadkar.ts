/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  Madadkar (پشتیبانی مالی جنگ) — typed API client.
 *
 *  Mirrors every PUBLIC + USER endpoint on `apps/madadkar/urls.py`
 *  (admin-only endpoints are intentionally OUT OF SCOPE for the front
 *  site; they live inside the Django admin).
 *
 *  Public
 *  ------
 *  GET  /madadkar/sponsors/                        list sponsors
 *  GET  /madadkar/sponsors/{slug}/                 sponsor detail
 *  GET  /madadkar/campaigns/                       list campaigns
 *  GET  /madadkar/campaigns/{slug}/                campaign detail (+gallery)
 *  GET  /madadkar/campaigns/{slug}/transparency/   transparency report
 *  POST /madadkar/receipts/verify/                 verify donation receipt
 *
 *  User (Bearer required)
 *  ----------------------
 *  POST /madadkar/campaigns/{slug}/participate/    initiate a payment
 *  GET  /madadkar/payment/verify/                  finalise gateway callback
 *  GET  /madadkar/me/participations/               list of my participations
 *  GET  /madadkar/me/participations/{id}/          one participation detail
 *  GET  /madadkar/me/receipts/                     list of my donation receipts
 *  GET  /madadkar/me/receipts/{id}/                one receipt detail
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { apiFetch, safeApiFetch, type Paginated } from './api';

/* ───────────────────────────────────────────────────────────────────────── */
/*  Types — one-to-one with apps/madadkar/serializers.py                     */
/* ───────────────────────────────────────────────────────────────────────── */

export type MadadkarSponsor = {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  short_description?: string | null;
  website?: string | null;
};

export type MadadkarCampaignImage = {
  id: number;
  image: string;
  alt_text?: string;
  display_order?: number;
  created_at?: string;
};

export type MadadkarCampaignSummary = {
  id: number;
  sponsor: MadadkarSponsor | null;
  title: string;
  slug: string;
  cover_image: string | null;
  total_amount: number;         // Toman
  total_shares: number;
  share_price: number;          // Toman per share
  purchased_shares: number;
  purchased_amount: number;
  participant_count: number;
  remaining_shares: number;
  progress_percent: number;
  is_fully_funded: boolean;
  status: 'draft' | 'published' | 'completed' | 'closed';
  status_display: string;
  has_deadline: boolean;
  deadline: string | null;
  published_at: string | null;
  completed_at: string | null;
  closed_at: string | null;
};

export type MadadkarCampaignDetail = MadadkarCampaignSummary & {
  description: string;
  gallery_images: MadadkarCampaignImage[];
};

export type MadadkarTransparency = {
  campaign_slug: string;
  total_amount_toman: number;
  purchased_amount_toman: number;
  refunded_amount_toman: number;
  disbursed_amount_toman: number;
  net_amount_toman: number;
  participant_count: number;
  disbursements?: Array<{
    id: number;
    amount_toman: number;
    beneficiary: string;
    status: string;
    paid_at?: string | null;
    note?: string | null;
  }>;
};

export type MadadkarParticipation = {
  id: number;
  campaign: MadadkarCampaignSummary;
  share_count: number;
  share_price: number;
  total_amount: number;
  status: 'pending_payment' | 'paid' | 'failed' | 'expired' | 'refunded';
  status_display?: string;
  payment?: MadadkarPayment;
  created_at: string;
  updated_at: string;
};

export type MadadkarPayment = {
  id: number;
  amount: number;
  status: 'pending' | 'success' | 'failed';
  provider_ref?: string | null;
  gateway_url?: string | null;
  paid_at?: string | null;
  created_at?: string;
};

export type MadadkarReceipt = {
  id: number;
  code: string;
  amount_toman: number;
  campaign_title: string;
  campaign_slug: string;
  sponsor_name?: string;
  paid_at: string;
  verification_url?: string;
};

export type MadadkarReceiptVerification = {
  valid: boolean;
  receipt?: MadadkarReceipt;
  reason?: string;
};

/* ───────────────────────────────────────────────────────────────────────── */
/*  Public: sponsors                                                          */
/* ───────────────────────────────────────────────────────────────────────── */

export function listSponsors(params?: { page?: number; page_size?: number; search?: string }) {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.page_size) qs.set('page_size', String(params.page_size));
  if (params?.search) qs.set('search', params.search);
  const q = qs.toString();
  return safeApiFetch<Paginated<MadadkarSponsor>>(
    `/madadkar/sponsors/${q ? `?${q}` : ''}`,
    { revalidate: 300, tags: ['madadkar', 'sponsors'] },
  );
}

export function getSponsor(slug: string) {
  return apiFetch<MadadkarSponsor>(`/madadkar/sponsors/${encodeURIComponent(slug)}/`, {
    revalidate: 300,
    tags: ['madadkar', 'sponsor', slug],
    skipAuth: true,
  } as never);
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  Public: campaigns                                                         */
/* ───────────────────────────────────────────────────────────────────────── */

export type CampaignListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  status?: 'published' | 'completed' | 'closed';
  sponsor?: number;
  sponsor_slug?: string;
  has_deadline?: boolean;
  is_fully_funded?: boolean;
  ordering?: '-published_at' | 'published_at' | '-created_at' | 'created_at' | '-progress' | 'progress' | '-deadline' | 'deadline';
};

export function listCampaigns(params?: CampaignListParams) {
  const qs = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v === undefined || v === '' || v === null) return;
      qs.set(k, typeof v === 'boolean' ? (v ? 'true' : 'false') : String(v));
    });
  }
  const q = qs.toString();
  return safeApiFetch<Paginated<MadadkarCampaignSummary>>(
    `/madadkar/campaigns/${q ? `?${q}` : ''}`,
    { revalidate: 180, tags: ['madadkar', 'campaigns'] },
  );
}

export function getCampaign(slug: string) {
  return apiFetch<MadadkarCampaignDetail>(
    `/madadkar/campaigns/${encodeURIComponent(slug)}/`,
    { revalidate: 60, tags: ['madadkar', 'campaign', slug], skipAuth: true } as never,
  );
}

export function safeGetCampaign(slug: string) {
  return safeApiFetch<MadadkarCampaignDetail>(
    `/madadkar/campaigns/${encodeURIComponent(slug)}/`,
    { revalidate: 60, tags: ['madadkar', 'campaign', slug] },
  );
}

export function getCampaignTransparency(slug: string) {
  return safeApiFetch<MadadkarTransparency>(
    `/madadkar/campaigns/${encodeURIComponent(slug)}/transparency/`,
    { revalidate: 300, tags: ['madadkar', 'transparency', slug] },
  );
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  User actions (Bearer)                                                     */
/* ───────────────────────────────────────────────────────────────────────── */

export type ParticipateInput = {
  share_count: number;
  mobile?: string;
  email?: string;
};

export type ParticipateResult = {
  gateway_url: string;
  participation_id: number;
  payment_id?: number;
  authority?: string;
};

export function initiateParticipation(slug: string, body: ParticipateInput) {
  return apiFetch<ParticipateResult>(
    `/madadkar/campaigns/${encodeURIComponent(slug)}/participate/`,
    { method: 'POST', body: JSON.stringify(body) },
  );
}

export function verifyPaymentCallback(query: Record<string, string>) {
  const qs = new URLSearchParams(query).toString();
  return apiFetch<{ status: string; participation_id?: number; receipt_code?: string }>(
    `/madadkar/payment/verify/${qs ? `?${qs}` : ''}`,
  );
}

export function verifyReceipt(code: string) {
  return apiFetch<MadadkarReceiptVerification>('/madadkar/receipts/verify/', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  My participations & receipts                                              */
/* ───────────────────────────────────────────────────────────────────────── */

export function myParticipations(params?: { page?: number; page_size?: number; status?: string }) {
  const qs = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v === undefined || v === '' || v === null) return;
      qs.set(k, String(v));
    });
  }
  const q = qs.toString();
  return apiFetch<Paginated<MadadkarParticipation>>(
    `/madadkar/me/participations/${q ? `?${q}` : ''}`,
  );
}

export function myParticipation(id: number | string) {
  return apiFetch<MadadkarParticipation>(`/madadkar/me/participations/${id}/`);
}

export function myReceipts(params?: { page?: number; page_size?: number }) {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.page_size) qs.set('page_size', String(params.page_size));
  const q = qs.toString();
  return apiFetch<Paginated<MadadkarReceipt>>(
    `/madadkar/me/receipts/${q ? `?${q}` : ''}`,
  );
}

export function myReceipt(id: number | string) {
  return apiFetch<MadadkarReceipt>(`/madadkar/me/receipts/${id}/`);
}
