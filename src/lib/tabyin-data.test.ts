import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  countVisibleFeedTotal,
  readDisplayFeedPage,
  readDisplayHome,
  readTabyinSitemapWindow,
} from './tabyin-data';
import { apiResponse, displayHome, displayPage, notes } from '@/test-utils/tabyin-display';

const filters = { q: '', type: '' as const, author: '' };
const urlOf = (input: unknown) => new URL(String(input), 'http://test.local');
afterEach(() => vi.unstubAllGlobals());

describe('bounded display data adapters', () => {
  it('counts 6101 with exactly one page_size=1 request', async () => {
    const mock = vi.fn(async (_input: unknown) =>
      apiResponse(displayPage(notes(1), { count: 6101, pageSize: 1 })),
    );
    vi.stubGlobal('fetch', mock);
    expect(await countVisibleFeedTotal(filters)).toBe(6101);
    expect(mock).toHaveBeenCalledTimes(1);
    expect(urlOf(mock.mock.calls[0]?.[0]).searchParams.get('page_size')).toBe('1');
    expect(urlOf(mock.mock.calls[0]?.[0]).pathname).toContain('/tabyin/display/');
  });
  it('applies the actual feed filters to the one count request', async () => {
    const mock = vi.fn(async (_input: unknown) =>
      apiResponse(displayPage(notes(1), { count: 32, pageSize: 1 })),
    );
    vi.stubGlobal('fetch', mock);
    expect(await countVisibleFeedTotal({ q: 'ایران', type: 'other', author: 'هرمزگان' })).toBe(32);
    const url = urlOf(mock.mock.calls[0]?.[0]);
    expect(url.searchParams.get('media_type')).toBe('other');
    expect(url.searchParams.get('author')).toBe('هرمزگان');
    expect(url.searchParams.get('search')).toBe('ایران');
  });
  it('network or incomplete metadata never becomes a guessed number', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => apiResponse({ count: 6101, results: notes(1) })),
    );
    expect(await countVisibleFeedTotal(filters)).toBeUndefined();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => apiResponse({}, 503)),
    );
    expect(await countVisibleFeedTotal(filters)).toBeUndefined();
  });
  it('home receives one bounded response with full counts', async () => {
    const mock = vi.fn(async (_input: unknown) => apiResponse(displayHome()));
    vi.stubGlobal('fetch', mock);
    const data = await readDisplayHome();
    expect(data?.counts.all).toBe(6101);
    expect(data?.results).toHaveLength(100);
    expect(mock).toHaveBeenCalledTimes(1);
  });
  it('rejects an incorrect returned revision', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => apiResponse(displayPage(notes(1), { revision: 'new' }))),
    );
    expect(await readDisplayFeedPage(filters, 1, 12, 'old')).toBeNull();
  });
  it('sitemap uses at most four sequential requests and includes a fixed revision', async () => {
    let active = 0;
    let peak = 0;
    const mock = vi.fn(async (input: unknown) => {
      active++;
      peak = Math.max(peak, active);
      await Promise.resolve();
      const url = urlOf(input);
      const page = Number(url.searchParams.get('page'));
      if (page > 1) expect(url.searchParams.get('revision')).toBe('r1');
      active--;
      return apiResponse(
        displayPage(notes(100, (page - 1) * 100), { count: 6101, page, pageSize: 100 }),
      );
    });
    vi.stubGlobal('fetch', mock);
    expect(await readTabyinSitemapWindow()).toHaveLength(400);
    expect(mock).toHaveBeenCalledTimes(4);
    expect(peak).toBe(1);
  });
  it('sitemap discards a partial cross-revision window rather than mixing it', async () => {
    const mock = vi.fn(async (input: unknown) => {
      const page = Number(urlOf(input).searchParams.get('page'));
      return apiResponse(
        displayPage(notes(100, (page - 1) * 100), {
          count: 6101,
          page,
          pageSize: 100,
          revision: page === 1 ? 'r1' : 'r2',
        }),
      );
    });
    vi.stubGlobal('fetch', mock);
    expect(await readTabyinSitemapWindow()).toEqual([]);
    expect(mock).toHaveBeenCalledTimes(2);
  });
  it('invalid/unbounded sitemap limit cannot start an unbounded scan', async () => {
    const mock = vi.fn();
    vi.stubGlobal('fetch', mock);
    expect(await readTabyinSitemapWindow(5000)).toEqual([]);
    expect(await readTabyinSitemapWindow(0)).toEqual([]);
    expect(mock).not.toHaveBeenCalled();
  });
});
