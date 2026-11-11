import { describe, expect, it } from 'vitest';
import {
  displayFeedPath,
  displayWallBucket,
  parseDisplayHome,
  parseDisplayPage,
} from './tabyin-display';
import { displayHome, displayPage, images, notes } from '@/test-utils/tabyin-display';

describe('verified display page contract', () => {
  it('accepts full counts beyond 5000 while the page contains one row', () => {
    const data = displayPage(notes(1), { count: 6101, pageSize: 1 });
    expect(parseDisplayPage(data, { page: 1, pageSize: 1 })?.count).toBe(6101);
  });
  it('accepts an empty dataset but not an incomplete nonempty page', () => {
    expect(parseDisplayPage(displayPage([]), { page: 1, pageSize: 12 })?.count).toBe(0);
    expect(
      parseDisplayPage(displayPage([], { count: 6101 }), { page: 1, pageSize: 12 }),
    ).toBeNull();
  });
  it.each([
    { counts_exact: false },
    { display_contract: 'raw' },
    { revision: '' },
    { count: -1 },
    { count: 1.5 },
    { next: undefined },
    { previous: undefined },
    { count: Number.MAX_SAFE_INTEGER + 1 },
  ])('rejects incomplete or invalid metadata %j', (change) => {
    expect(parseDisplayPage({ ...displayPage(notes(1)), ...change })).toBeNull();
  });
  it('rejects duplicate, empty, malformed or oversized response rows', () => {
    const a = notes(1)[0];
    for (const data of [
      displayPage([a, a]),
      displayPage([{ external_id: 'empty' }]),
      displayPage(notes(101)),
      displayPage([{ external_id: 'bad', title: 'test', attachments: [null] }]),
      displayPage([
        {
          external_id: 'bad',
          title: 'test',
          attachments: [{ url: '/a', media_type: 'video', duration: 'bad' }],
        },
      ]),
    ]) {
      expect(parseDisplayPage(data)).toBeNull();
    }
  });
  it('accepts null dates from the actual backend model', () => {
    const data = displayPage([{ ...notes(1)[0], source_created_at: null }]);
    expect(parseDisplayPage(data)).not.toBeNull();
  });
  it('checks next/previous and page boundary lengths', () => {
    const page = displayPage(notes(1, 12), { count: 13, page: 2 });
    expect(parseDisplayPage(page, { page: 2, pageSize: 12 })).not.toBeNull();
    expect(parseDisplayPage({ ...page, previous: null }, { page: 2, pageSize: 12 })).toBeNull();
    expect(parseDisplayPage({ ...page, next: '/wrong' }, { page: 2, pageSize: 12 })).toBeNull();
    expect(parseDisplayPage(page, { page: 0, pageSize: 12 })).toBeNull();
  });
});

describe('bounded homepage window', () => {
  it('accepts 100 cards for 6101 total eligible images', () => {
    const result = parseDisplayHome(displayHome());
    expect(result?.counts.all).toBe(6101);
    expect(result?.results).toHaveLength(100);
  });
  it('rejects broken partitions and missing bucket coverage', () => {
    const data = displayHome();
    expect(parseDisplayHome({ ...data, counts: { ...data.counts, text: 1 } })).toBeNull();
    expect(parseDisplayHome({ ...data, results: images(99) })).toBeNull();
    expect(parseDisplayHome({ ...data, per_bucket: 200 })).toBeNull();
    expect(parseDisplayHome({ ...data, results: images(401) })).toBeNull();
    expect(parseDisplayHome({ ...data, counts_exact: false })).toBeNull();
  });
  it('empty homepage is different from an unavailable/malformed response', () => {
    expect(parseDisplayHome(displayHome(0))?.counts.all).toBe(0);
    expect(parseDisplayHome(null)).toBeNull();
    expect(parseDisplayHome({})).toBeNull();
  });
  it('preserves exclusive podcast/audio classification', () => {
    expect(
      displayWallBucket({
        external_id: 'a',
        primary_media_type: 'audio',
        attachments: [{ url: '/video', media_type: 'video' }],
      }),
    ).toBe('text');
    expect(
      displayWallBucket({
        external_id: 'b',
        primary_media_type: 'video',
        attachments: [
          { url: '/video', media_type: 'video' },
          { url: '/audio', media_type: 'audio' },
        ],
      }),
    ).toBe('text');
    expect(displayWallBucket(images(1)[0])).toBe('image');
  });
  it('builds encoded bounded filters and a revision-bearing page URL', () => {
    const path = displayFeedPath({ q: ' ایران ', type: 'other', author: 'تهران' }, 2, 12, 'r1');
    const url = new URL(path, 'http://local');
    expect(url.pathname).toBe('/tabyin/display/');
    expect(url.searchParams.get('search')).toBe('ایران');
    expect(url.searchParams.get('revision')).toBe('r1');
    expect(url.searchParams.get('media_type')).toBe('other');
    expect(
      new URL(
        displayFeedPath({ q: 'x'.repeat(400), type: '', author: '' }),
        'http://local',
      ).searchParams.get('search'),
    ).toHaveLength(200);
  });
});
