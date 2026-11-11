import type { RevayatItem } from '@/lib/revayat';
import type { DisplayHome, DisplayPage } from '@/lib/tabyin-display';

export function notes(n: number, start = 0): RevayatItem[] {
  return Array.from({ length: n }, (_, i) => ({
    external_id: `note-${start + i}`,
    title: `روایت ${start + i}`,
    attachments: [],
  }));
}
export function images(n: number, start = 0): RevayatItem[] {
  return notes(n, start).map((r, i) => ({
    ...r,
    primary_media_type: 'image',
    attachments: [{ url: `https://cdn.example/${start + i}.jpg`, media_type: 'image' }],
  }));
}
export function displayPage(
  results: RevayatItem[],
  options: { count?: number; page?: number; pageSize?: number; revision?: string } = {},
): DisplayPage {
  const count = options.count ?? results.length;
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 12;
  return {
    count,
    results,
    next: page * pageSize < count ? '/next' : null,
    previous: page > 1 ? '/previous' : null,
    revision: options.revision ?? 'r1',
    counts_exact: true,
    display_contract: 'visible-unique-v1',
  };
}
export function displayHome(n = 6101): DisplayHome {
  return {
    results: images(Math.min(100, n)),
    counts: { all: n, image: n, video: 0, text: 0 },
    revision: 'r1',
    counts_exact: true,
    per_bucket: 100,
    display_contract: 'visible-unique-v1',
  };
}
export function apiResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify({ success: status === 200, status_code: status, data }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
