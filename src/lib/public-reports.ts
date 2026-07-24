/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  Public Reports (گزارش‌های مردمی) — typed API client.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { apiFetch, safeApiFetch } from './api';

export type ReportSubject = {
  id: number;
  title: string;
  description?: string | null;
  is_active?: boolean;
};

export type PublicReport = {
  id: number;
  tracking_code: string;
  status: string;
  status_display?: string;
  full_name: string;
  phone_number?: string;
  subject: ReportSubject;
  description: string;
  attachments_count?: number;
  created_at: string;
};

export function listSubjects() {
  return safeApiFetch<ReportSubject[] | { results?: ReportSubject[] }>(
    '/public-reports/subjects/',
    { revalidate: 600, tags: ['public-reports', 'subjects'] },
  );
}

export type SubmitReportInput = {
  full_name: string;
  phone_number?: string;
  subject_id: number;
  description: string;
  attachments?: File[];
};

export function submitReport(input: SubmitReportInput) {
  const fd = new FormData();
  fd.set('full_name',   input.full_name);
  if (input.phone_number) fd.set('phone_number', input.phone_number);
  fd.set('subject_id',  String(input.subject_id));
  fd.set('description', input.description);
  if (input.attachments) for (const f of input.attachments) fd.append('attachments', f);
  return apiFetch<PublicReport>('/public-reports/reports/', { method: 'POST', body: fd });
}
