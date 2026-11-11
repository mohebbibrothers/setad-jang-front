import { safeApiFetch } from './api';
import type { FeedFilters, RevayatItem } from './revayat';
import {
  displayFeedPath,
  HOME_PER_BUCKET,
  parseDisplayHome,
  parseDisplayPage,
} from './tabyin-display';

export async function readDisplayHome() {
  const value = await safeApiFetch<unknown>(`/tabyin/display/home/?per_bucket=${HOME_PER_BUCKET}`, {
    revalidate: 60,
    tags: ['tabyin', 'homepage'],
    skipAuth: true,
  });
  return parseDisplayHome(value);
}

export async function readDisplayFeedPage(
  filters: FeedFilters,
  page = 1,
  pageSize = 12,
  revision?: string,
) {
  const value = await safeApiFetch<unknown>(displayFeedPath(filters, page, pageSize, revision), {
    revalidate: 60,
    tags: ['tabyin'],
    skipAuth: true,
  });
  const result = parseDisplayPage(value, { page, pageSize });
  return result && (!revision || result.revision === revision) ? result : null;
}

/** One bounded response, including counts beyond 5000; never scan the corpus in Next.js. */
export async function countVisibleFeedTotal(filters: FeedFilters): Promise<number | undefined> {
  return (await readDisplayFeedPage(filters, 1, 1))?.count;
}

/** Sitemap-only window. At most four sequential requests; not a corpus scanner. */
export async function readTabyinSitemapWindow(limit = 400): Promise<RevayatItem[]> {
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 400) return [];
  const filters: FeedFilters = { q: '', type: '', author: '' };
  const first = await readDisplayFeedPage(filters, 1, 100);
  if (!first) return [];
  const target = Math.min(limit, first.count);
  const out = [...first.results];
  for (let page = 2; out.length < target; page++) {
    const next = await readDisplayFeedPage(filters, page, 100, first.revision);
    if (!next || next.count !== first.count) return [];
    out.push(...next.results);
  }
  return out.slice(0, target);
}
