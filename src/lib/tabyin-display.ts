import type { Paginated } from './api';
import { buildFeedQuery, dedupeFeedContent, type FeedFilters, type RevayatItem } from './revayat';
import { hasVisibleContent } from './tabyin-visibility';

export const DISPLAY_CONTRACT = 'visible-unique-v1';
export const HOME_PER_BUCKET = 100;

export type DisplayPage = Paginated<RevayatItem> & {
  revision: string;
  counts_exact: true;
  display_contract: typeof DISPLAY_CONTRACT;
};

export type DisplayCounts = { all: number; image: number; video: number; text: number };
export type DisplayHome = {
  counts: DisplayCounts;
  results: RevayatItem[];
  revision: string;
  counts_exact: true;
  per_bucket: number;
  display_contract: typeof DISPLAY_CONTRACT;
};

const record = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
const natural = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
const text = (value: unknown) => value === undefined || typeof value === 'string';
const kinds = new Set(['image', 'video', 'audio', 'other']);

function row(value: unknown): value is RevayatItem {
  if (!record(value) || typeof value.external_id !== 'string' || !value.external_id) return false;
  if (
    !['title', 'description', 'author_username'].every((k) => text(value[k])) ||
    !(value.source_created_at === null || text(value.source_created_at))
  ) {
    return false;
  }
  if (
    value.origin !== undefined &&
    value.origin !== 'external' &&
    value.origin !== 'user_submitted'
  )
    return false;
  if (value.primary_media_type !== undefined && !kinds.has(String(value.primary_media_type)))
    return false;
  if (
    value.attachments !== undefined &&
    (!Array.isArray(value.attachments) ||
      !value.attachments.every(
        (a: unknown) =>
          record(a) &&
          typeof a.url === 'string' &&
          text(a.title) &&
          text(a.size) &&
          ['id', 'order', 'duration', 'file_size'].every(
            (k) =>
              a[k] === undefined ||
              (typeof a[k] === 'number' && Number.isFinite(a[k]) && a[k] >= 0),
          ) &&
          (a.media_type === undefined || kinds.has(String(a.media_type))),
      ))
  )
    return false;
  return true;
}

function rows(value: unknown): value is RevayatItem[] {
  return (
    Array.isArray(value) &&
    value.every(row) &&
    new Set(value.map((r) => r.external_id)).size === value.length &&
    value.every(hasVisibleContent) &&
    dedupeFeedContent(value).length === value.length
  );
}

function contract(value: Record<string, unknown>): boolean {
  return (
    value.counts_exact === true &&
    value.display_contract === DISPLAY_CONTRACT &&
    typeof value.revision === 'string' &&
    value.revision.length > 0 &&
    value.revision.length <= 100
  );
}

/** Do not turn missing metadata, partial pages or untrusted totals into exact counts. */
export function parseDisplayPage(
  value: unknown,
  context?: { page: number; pageSize: number },
): DisplayPage | null {
  if (!record(value) || !contract(value) || !natural(value.count) || !rows(value.results))
    return null;
  if (value.results.length > 100 || value.results.length > value.count) return null;
  if (
    ![value.next, value.previous].every(
      (v) => v === null || (typeof v === 'string' && v.length > 0),
    )
  )
    return null;
  if (context) {
    const { page, pageSize } = context;
    if (
      !Number.isSafeInteger(page) ||
      page < 1 ||
      !Number.isSafeInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > 100
    )
      return null;
    const expected = Math.min(pageSize, Math.max(0, value.count - (page - 1) * pageSize));
    if (
      value.results.length !== expected ||
      Boolean(value.next) !== page * pageSize < value.count ||
      Boolean(value.previous) !== page > 1
    )
      return null;
  }
  return value as DisplayPage;
}

/** Exclusive homepage classification, deliberately different from attachment-based feed filters. */
export function displayWallBucket(item: RevayatItem): 'image' | 'video' | 'text' {
  const attachments = Array.isArray(item.attachments) ? item.attachments : [];
  const has = (kind: string) =>
    attachments.some((a: unknown) => record(a) && a.media_type === kind);
  if (item.primary_media_type === 'audio' || item.primary_media_type === 'other' || has('audio'))
    return 'text';
  const image = has('image');
  const video = has('video');
  if (!image && !video) return 'text';
  if (image && !video) return 'image';
  if (video && !image) return 'video';
  return item.primary_media_type === 'video' ? 'video' : 'image';
}

export function parseDisplayHome(
  value: unknown,
  expectedPerBucket = HOME_PER_BUCKET,
): DisplayHome | null {
  if (!record(value) || !contract(value) || !record(value.counts) || !rows(value.results))
    return null;
  const counts = value.counts;
  if (!['all', 'image', 'video', 'text'].every((k) => natural(counts[k]))) return null;
  const c = counts as DisplayCounts;
  if (
    c.all !== c.image + c.video + c.text ||
    value.per_bucket !== expectedPerBucket ||
    !Number.isSafeInteger(expectedPerBucket) ||
    expectedPerBucket < 1 ||
    expectedPerBucket > 100
  )
    return null;
  if (
    value.results.length > 4 * expectedPerBucket ||
    value.results.length > c.all ||
    value.results.length < Math.min(c.all, expectedPerBucket)
  )
    return null;
  const local = { image: 0, video: 0, text: 0 };
  for (const item of value.results) local[displayWallBucket(item)]++;
  if (
    !(['image', 'video', 'text'] as const).every(
      (k) => local[k] >= Math.min(c[k], expectedPerBucket) && local[k] <= c[k],
    )
  )
    return null;
  return value as DisplayHome;
}

export function displayFeedPath(
  filters: FeedFilters,
  page = 1,
  pageSize = 12,
  revision?: string,
): string {
  const bounded = {
    ...filters,
    q: filters.q.trim().slice(0, 200),
    author: filters.author.trim().slice(0, 200),
  };
  const query = new URLSearchParams(buildFeedQuery(bounded, page, pageSize));
  if (revision) query.set('revision', revision);
  return `/tabyin/display/?${query}`;
}
