import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadTabyinSection } from './home-data';
import { apiResponse, displayHome, images } from '@/test-utils/tabyin-display';

afterEach(() => vi.unstubAllGlobals());

describe('homepage display adapter — bounded window, complete counts', () => {
  it('loads 100 cards for 6101 eligible items with one request, not a corpus scan', async () => {
    const mock = vi.fn(async (_input: unknown) => apiResponse(displayHome()));
    vi.stubGlobal('fetch', mock);
    const section = await loadTabyinSection();
    expect(section.items).toHaveLength(100);
    expect(section.counts).toEqual({ all: 6101, image: 6101, video: 0, text: 0, exact: true });
    expect(section.unavailable).toBe(false);
    expect(mock).toHaveBeenCalledTimes(1);
    expect(String(mock.mock.calls[0]?.[0])).toContain('/tabyin/display/home/?per_bucket=100');
    expect(String(mock.mock.calls[0]?.[0])).not.toContain('/contents/');
  });
  it('maps the current 144 image / 4 video contract without changing full counts', async () => {
    const video = Array.from({ length: 4 }, (_, i) => ({
      external_id: `video-${i}`,
      title: `فیلم ${i}`,
      primary_media_type: 'video',
      attachments: [
        { url: `https://app-media.armansky.ir/org/uploads/${i}.mp4`, media_type: 'video' },
      ],
    }));
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        apiResponse({
          ...displayHome(),
          results: [...images(100), ...video],
          counts: { all: 148, image: 144, video: 4, text: 0 },
        }),
      ),
    );
    const data = await loadTabyinSection();
    expect(data.counts?.all).toBe(148);
    expect(data.items).toHaveLength(104);
    expect(data.items.filter((x) => x.mediaType === 'video')).toHaveLength(4);
    expect(data.items.find((x) => x.id === 'video-0')?.thumbnailUrl).toContain(
      '/thumbnail/uploads/0.gif',
    );
  });
  it('maps podcasts into other and never forwards the external source link', async () => {
    const row = {
      external_id: 'pod',
      title: 'پادکست',
      primary_media_type: 'audio',
      source_url: 'https://external-source.example/private-link',
      attachments: [
        { url: '/audio.mp3', media_type: 'audio' },
        { url: 'https://cdn.example/image.jpg', media_type: 'image' },
      ],
    };
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        apiResponse({
          ...displayHome(),
          counts: { all: 1, image: 0, video: 0, text: 1 },
          results: [row],
        }),
      ),
    );
    const section = await loadTabyinSection();
    expect(section.items[0]?.mediaType).toBe('other');
    expect(section.items[0]?.coverUrl).toBe('https://cdn.example/image.jpg');
    expect(JSON.stringify(section.items)).not.toContain('external-source.example');
  });
  it('an unavailable index is not presented as a verified zero count', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => apiResponse({}, 503)),
    );
    const section = await loadTabyinSection();
    expect(section).toEqual({ items: [], unavailable: true });
    expect(section.counts).toBeUndefined();
  });
  it('a genuinely empty index is explicitly valid', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => apiResponse(displayHome(0))),
    );
    const section = await loadTabyinSection();
    expect(section.unavailable).toBe(false);
    expect(section.counts?.all).toBe(0);
  });
});
