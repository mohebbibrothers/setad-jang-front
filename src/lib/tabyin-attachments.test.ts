import { describe, expect, it } from 'vitest';
import { asText, normalizeTabyinAttachments } from './tabyin-attachments';

/**
 * نرمالایزرِ پیوست‌ها — گاردِ ورودیِ لایه‌ی UI:
 * هیچ ورودیِ بالادستی، هرقدر هم خراب، نباید بتواند صفحه را بترکاند.
 */

describe('normalizeTabyinAttachments', () => {
  it('ورودیِ سالم را بدون تغییرِ معنایی عبور می‌دهد', () => {
    const out = normalizeTabyinAttachments([
      {
        id: 7,
        url: 'https://media.example.org/a.mp4',
        media_type: 'video',
        media_type_display: 'ویدئو',
        duration: 444,
        file_size: 1434,
        size: '1280X905',
        title: 'کلیپ',
      },
    ]);
    expect(out).toEqual([
      {
        id: 7,
        url: 'https://media.example.org/a.mp4',
        media_type: 'video',
        media_type_display: 'ویدئو',
        duration: 444,
        file_size: 1434,
        size: '1280X905',
        title: 'کلیپ',
      },
    ]);
  });

  it('ورودیِ غیرآرایه (null / object / string / undefined) → لیستِ خالی', () => {
    expect(normalizeTabyinAttachments(null)).toEqual([]);
    expect(normalizeTabyinAttachments(undefined)).toEqual([]);
    expect(normalizeTabyinAttachments({ url: 'x' })).toEqual([]);
    expect(normalizeTabyinAttachments('https://…')).toEqual([]);
    expect(normalizeTabyinAttachments(12345)).toEqual([]);
  });

  it('رکوردهای null، غیرشیء و بدون url معتبر حذف می‌شوند', () => {
    const out = normalizeTabyinAttachments([
      null,
      undefined,
      42,
      'x',
      {},
      { url: '' },
      { url: '   ' },
      { url: 123 },
      { url: 'https://media.example.org/ok.png' },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].url).toBe('https://media.example.org/ok.png');
  });

  it('url حاشیه‌دار تمیز می‌شود و id غیرعددی حذف می‌گردد', () => {
    const out = normalizeTabyinAttachments([
      { id: 'nope', url: '  https://media.example.org/x.jpg  ' },
    ]);
    expect(out[0]).toMatchObject({ url: 'https://media.example.org/x.jpg', id: undefined });
  });

  it('duration / file_size: رشته‌ی عددی → عدد؛ مقدار خراب → undefined', () => {
    const out = normalizeTabyinAttachments([
      { url: 'https://m/a.mp3', duration: '1850', file_size: '980' },
      { url: 'https://m/b.mp4', duration: '7:24', file_size: NaN },
      { url: 'https://m/c.png', duration: Infinity, file_size: {} },
    ]);
    expect(out[0]).toMatchObject({ duration: 1850, file_size: 980 });
    expect(out[1]).toMatchObject({ duration: undefined, file_size: undefined });
    expect(out[2]).toMatchObject({ duration: undefined, file_size: undefined });
  });

  it('media_type ناشناخته → undefined (نه رشته‌ی ساختگی)', () => {
    const out = normalizeTabyinAttachments([
      { url: 'https://m/a', media_type: 'hologram' },
      { url: 'https://m/b', media_type: 'IMAGE' },
      { url: 'https://m/c', media_type: 'image' },
    ]);
    expect(out.map((a) => a.media_type)).toEqual([undefined, undefined, 'image']);
  });

  it('فیلدهای متنی غیررشته‌ای امن به undefined می‌افتند', () => {
    const out = normalizeTabyinAttachments([
      { url: 'https://m/a', title: 7, size: null, media_type_display: [] },
    ]);
    expect(out[0]).toMatchObject({
      title: undefined,
      size: undefined,
      media_type_display: undefined,
    });
  });
});

describe('asText', () => {
  it('فقط رشته را عبور می‌دهد', () => {
    expect(asText('سلام')).toBe('سلام');
    expect(asText(null)).toBe('');
    expect(asText(undefined)).toBe('');
    expect(asText(42)).toBe('');
    expect(asText(['a'])).toBe('');
  });
});
