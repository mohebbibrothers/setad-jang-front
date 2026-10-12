import { describe, expect, it } from 'vitest';
import { indexNowUrlsFor } from './indexnow';

describe('indexNowUrlsFor', () => {
  it('همیشه ریشه و sitemap را دارد', () => {
    const urls = indexNowUrlsFor([], []);
    expect(urls).toContain('/');
    expect(urls).toContain('/sitemap.xml');
    expect(urls[0]).toBe('/');
  });

  it('تگ‌های دامنه را به بخشِ عمومیِ درست نگاشت می‌کند', () => {
    const urls = indexNowUrlsFor(['tabyin', 'lms', 'r4j', 'madadkar'], []);
    expect(urls).toEqual(
      expect.arrayContaining(['/tabyin', '/lms', '/r4j', '/madadkar', '/', '/sitemap.xml']),
    );
  });

  it('تگِ ناشناخته هیچ بخشی اضافه نمی‌کند', () => {
    const urls = indexNowUrlsFor(['unknown-tag'], []);
    expect(urls).toEqual(['/', '/sitemap.xml']);
  });

  it('pathهای عمومیِ قابل‌نمایه مهمان می‌شوند', () => {
    const urls = indexNowUrlsFor(['tabyin'], ['/tabyin/abc-123', '/lms/courses/x']);
    expect(urls).toContain('/tabyin/abc-123');
    expect(urls).toContain('/lms/courses/x');
  });

  it('مسیرهای غیرعمومی و خطرناک نمی‌توانند مهمان شوند', () => {
    const urls = indexNowUrlsFor(
      [],
      ['/admin/secret', '/api/v1/x', '/profile/me', '//evil.com/x', 'not-a-path', '/search?q=x'],
    );
    for (const bad of ['/admin/secret', '/api/v1/x', '/profile/me', '/search?q=x']) {
      expect(urls).not.toContain(bad);
    }
  });

  it('دِدِیوپ: تگ و pathِ همسان یک بار در می‌آیند', () => {
    const urls = indexNowUrlsFor(['tabyin'], ['/tabyin']);
    expect(urls.filter((u) => u === '/tabyin')).toHaveLength(1);
  });

  it('سقفِ خروجی محترم است', () => {
    const urls = indexNowUrlsFor([], [...Array.from({ length: 200 }, (_, i) => `/tabyin/${i}`)]);
    expect(urls.length).toBeLessThanOrEqual(50);
  });
});
