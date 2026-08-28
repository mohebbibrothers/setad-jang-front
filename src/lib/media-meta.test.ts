import { describe, expect, it } from 'vitest';
import {
  videoCoverUrl,
  videoThumbnailGifUrl,
  formatClockFa,
  formatDimensionsFa,
  formatFileSizeFa,
  resolveContentKind,
  contentKindFa,
  contentKindTagFa,
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

describe('resolveContentKind — نوعِ مؤثر با اولویتِ «صوت همیشه می‌برد»', () => {
  it('حضورِ فایلِ صوتی = پادکست، حتی با کاورِ ویدئویی (سناریوی دقیقِ کارفرما)', () => {
    expect(resolveContentKind(['video', 'audio'])).toBe('audio');
    expect(resolveContentKind(['audio', 'video', 'image'])).toBe('audio');
    expect(resolveContentKind(['audio'])).toBe('audio');
  });

  it('بدونِ صوت: ویدئو > تصویر', () => {
    expect(resolveContentKind(['video', 'image'])).toBe('video');
    expect(resolveContentKind(['image', 'video'])).toBe('video');
    expect(resolveContentKind(['image'])).toBe('image');
  });

  it('هرچه رسانه‌ی قابل‌استفاده ندارد → متن‌محور', () => {
    expect(resolveContentKind([])).toBe('other');
    expect(resolveContentKind([undefined, null])).toBe('other');
    expect(resolveContentKind(['other'])).toBe('other');
    expect(resolveContentKind(['hologram'])).toBe('other');
  });
});

describe('برچسب‌ها — جدولِ قراردادِ کارفرما (تگ ↔ نوع محتوا)', () => {
  it('تگِ ویدئو ← نوعِ فیلم', () => {
    expect(contentKindTagFa('video')).toBe('ویدئو');
    expect(contentKindFa('video')).toBe('فیلم');
  });

  it('تگِ تصویر ← نوعِ عکس', () => {
    expect(contentKindTagFa('image')).toBe('تصویر');
    expect(contentKindFa('image')).toBe('عکس');
  });

  it('تگِ صوت ← نوعِ پادکست', () => {
    expect(contentKindTagFa('audio')).toBe('صوت');
    expect(contentKindFa('audio')).toBe('پادکست');
  });

  it('تگِ متن ← نوعِ نوشته', () => {
    expect(contentKindTagFa('other')).toBe('متن');
    expect(contentKindFa('other')).toBe('نوشته');
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

describe('videoCoverUrl — کاورِ امنِ ویدئو برای کارت‌های تصویری', () => {
  it('فقط روی نشانیِ قراردادِ تامنیل‌ساز (/org/uploads/) خروجی می‌دهد', () => {
    expect(videoCoverUrl('https://app-media.armansky.ir/org/uploads/v/film.mp4')).toBe(
      'https://app-media.armansky.ir/thumbnail/uploads/v/film.gif',
    );
  });

  it('هاستِ بیگانه یا مسیرِ خارج از قرارداد → undefined (نه آدرسِ gifِ ساختگی)', () => {
    expect(videoCoverUrl('https://cdn.example.com/v/clip.mp4')).toBeUndefined();
    expect(videoCoverUrl('https://app-media.armansky.ir/files/clip.mp4')).toBeUndefined();
  });

  it('آدرسِ MP4 هرگز به‌عنوانِ تامنیل برگردانده نمی‌شود؛ ورودیِ غایب → undefined', () => {
    expect(videoCoverUrl('https://x/org/uploads/a.mp4')).not.toContain('.mp4');
    expect(videoCoverUrl(undefined)).toBeUndefined();
    expect(videoCoverUrl(null)).toBeUndefined();
    expect(videoCoverUrl('')).toBeUndefined();
  });
});
