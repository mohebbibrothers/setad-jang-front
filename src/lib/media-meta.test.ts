import { describe, expect, it } from 'vitest';
import {
  videoThumbnailGifUrl,
  formatClockFa,
  formatDimensionsFa,
  formatFileSizeFa,
  mediaTypeFa,
} from './media-meta';

/**
 * قرارداد media-meta: ابرداده‌ی غایب هرگز «چیپِ پوچ» نمی‌سازد (null)،
 * اعداد فارسی‌اند، و برچسبِ نوع رسانه همیشه فارسی است.
 */

describe('formatClockFa — مدت به فرمت ساعت', () => {
  it('تابعیِ mm:ss با پدینگ و ارقام فارسی', () => {
    expect(formatClockFa(444)).toBe('۷:۲۴');
    expect(formatClockFa(59)).toBe('۰:۵۹');
    expect(formatClockFa(60)).toBe('۱:۰۰');
  });

  it('بیش از یک ساعت → h:mm:ss', () => {
    expect(formatClockFa(3729)).toBe('۱:۰۲:۰۹');
  });

  it('ورودی نامعتبر/صفر → null (بدون چیپِ تهی)', () => {
    expect(formatClockFa(0)).toBeNull();
    expect(formatClockFa(null)).toBeNull();
    expect(formatClockFa(undefined)).toBeNull();
    expect(formatClockFa(Number.NaN)).toBeNull();
  });
});

describe('formatFileSizeFa — حجم فایل', () => {
  it('زیر یک مگابایت → کیلوبایت', () => {
    expect(formatFileSizeFa(90)).toBe('۹۰ کیلوبایت');
    expect(formatFileSizeFa(1023)).toBe('۱٬۰۲۳ کیلوبایت');
  });

  it('از یک مگابایت → مگابایت با حداکثر یک رقم اعشارِ فارسی', () => {
    expect(formatFileSizeFa(1024)).toBe('۱ مگابایت');
    expect(formatFileSizeFa(1434)).toBe('۱٫۴ مگابایت');
  });

  it('صفر/نامعتبر → null', () => {
    expect(formatFileSizeFa(0)).toBeNull();
    expect(formatFileSizeFa(undefined)).toBeNull();
  });
});

describe('formatDimensionsFa — ابعاد تصویر', () => {
  it('هر دو جداکننده‌ی X/x را می‌شناسد', () => {
    expect(formatDimensionsFa('1280X905')).toBe('۱۲۸۰×۹۰۵ پیکسل');
    expect(formatDimensionsFa('1024x768')).toBe('۱۰۲۴×۷۶۸ پیکسل');
  });

  it('رشته‌ی نامعتبر → null', () => {
    expect(formatDimensionsFa('')).toBeNull();
    expect(formatDimensionsFa('abc')).toBeNull();
    expect(formatDimensionsFa(null)).toBeNull();
    expect(formatDimensionsFa('0x0')).toBeNull();
  });
});

describe('mediaTypeFa — برچسبِ فارسیِ نوع رسانه', () => {
  it('displayِ بک‌اند در اولویت است', () => {
    expect(mediaTypeFa('video', 'ویدئو')).toBe('ویدئو');
  });

  it('نقشه‌ی محلی در غیابِ display', () => {
    expect(mediaTypeFa('image')).toBe('تصویر');
    expect(mediaTypeFa('video')).toBe('ویدئو');
    expect(mediaTypeFa('audio')).toBe('صوت');
    expect(mediaTypeFa('other')).toBe('سایر');
  });

  it('مقدارِ ناشناخته/غایب → null (هیچ‌وقت انگلیسی رندر نمی‌شود)', () => {
    expect(mediaTypeFa(undefined)).toBeNull();
    expect(mediaTypeFa('weird')).toBeNull();
  });
});

describe('videoThumbnailGifUrl — تامنیلِ GIFِ ویدئو', () => {
  it('مسیر org را به thumbnail و پسوند را به gif نگاشت می‌کند', () => {
    expect(videoThumbnailGifUrl('https://app-media.armansky.ir/org/uploads/2026/07/14/x.mp4')).toBe(
      'https://app-media.armansky.ir/thumbnail/uploads/2026/07/14/x.gif',
    );
  });

  it('ورودی غایب → undefined', () => {
    expect(videoThumbnailGifUrl(undefined)).toBeUndefined();
    expect(videoThumbnailGifUrl(null)).toBeUndefined();
  });
});
