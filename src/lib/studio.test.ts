import { describe, expect, it } from 'vitest';
import {
  buildSubmissionPayload,
  isHttpUrl,
  isStudioSubmittable,
  newAttachmentRow,
  previewItemFromDraft,
  sniffMediaTypeFromUrl,
  STUDIO_LIMITS,
  submissionStatusMeta,
  validateStudioDraft,
  type AttachmentDraft,
  type StudioDraft,
} from './studio';

/**
 * studio — قراردادِ آینه‌ایِ «استودیوی روایت» با بک‌اند:
 * هر قانونِ UserTabyinSubmissionCreateSerializer اینجا تست می‌شود تا
 * خطاهای UI دقیقاً همان خطاهای سرور باشند، نه قانونِ ساختگیِ تازه.
 */

const row = (over: Partial<AttachmentDraft> = {}): AttachmentDraft => ({
  id: 'r1',
  url: '',
  mediaType: 'other',
  typeTouched: false,
  title: '',
  ...over,
});

const draft = (over: Partial<StudioDraft> = {}): StudioDraft => ({
  title: 'روایتِ من از جاده‌ی جنوب',
  description: 'آن روز با بچه‌های محله…',
  attachments: [],
  ...over,
});

describe('sniffMediaTypeFromUrl — بوش‌گرِ خودکارِ نوع از روی پسوند', () => {
  it('پسوندهای تصویر/ویدئو/صوت را می‌شناسد', () => {
    expect(sniffMediaTypeFromUrl('https://h.example/a/photo.JPG')).toBe('image');
    expect(sniffMediaTypeFromUrl('https://h.example/a/clip.mp4')).toBe('video');
    expect(sniffMediaTypeFromUrl('https://h.example/a/song.mp3')).toBe('audio');
    expect(sniffMediaTypeFromUrl('https://h.example/x/pic.webp?w=800')).toBe('image');
  });

  it('query/hash و حروف بزرگ فریبش نمی‌دهند', () => {
    expect(sniffMediaTypeFromUrl('https://h.example/v.MOV#t=12')).toBe('video');
    expect(sniffMediaTypeFromUrl('https://h.example/f.jpeg?token=abc.mp4')).toBe('image');
  });

  it('پسوندِ ناشناخته یا نشانیِ نیمه‌کاره → null (کاربر خودش انتخاب می‌کند)', () => {
    expect(sniffMediaTypeFromUrl('https://h.example/file.bin')).toBeNull();
    expect(sniffMediaTypeFromUrl('https://h.example/no-ext')).toBeNull();
    expect(sniffMediaTypeFromUrl('hta')).toBeNull();
    expect(sniffMediaTypeFromUrl('')).toBeNull();
  });
});

describe('isHttpUrl — اعتبارِ نشانی در محدوده‌ی قرارداد', () => {
  it('http/https قبول، بقیه نه', () => {
    expect(isHttpUrl('https://cdn.example/a.png')).toBe(true);
    expect(isHttpUrl('http://cdn.example/a.png')).toBe(true);
    expect(isHttpUrl('ftp://x/a.png')).toBe(false);
    expect(isHttpUrl('/relative/a.png')).toBe(false);
    expect(isHttpUrl('not a url')).toBe(false);
    expect(isHttpUrl('')).toBe(false);
  });

  it('سقفِ طول ۱۰۲۴ نویسه (URLField بک‌اند)', () => {
    const long = `https://h.example/${'a'.repeat(1030)}`;
    expect(isHttpUrl(long)).toBe(false);
    const ok = `https://h.example/${'a'.repeat(100)}`;
    expect(isHttpUrl(ok)).toBe(true);
  });
});

describe('validateStudioDraft — همان خطاهای بک‌اند، این‌طرفِ سیم', () => {
  it('عنوان و شرح الزامی‌اند؛ سقفِ عنوان ۵۱۲', () => {
    expect(validateStudioDraft(draft({ title: '  ' })).title).toBeTruthy();
    expect(validateStudioDraft(draft({ description: '' })).description).toBeTruthy();
    expect(validateStudioDraft(draft({ title: 'x'.repeat(513) })).title).toBeTruthy();
    expect(validateStudioDraft(draft({ title: 'x'.repeat(512) })).title).toBeUndefined();
  });

  it('سقفِ ۵ پیوست — پیامِ همان قانونِ سرور', () => {
    const atts = Array.from({ length: 6 }, (_, i) =>
      row({ id: `r${i}`, url: `https://h.example/${i}.jpg` }),
    );
    expect(validateStudioDraft(draft({ attachments: atts })).attachments).toBeTruthy();
    expect(isStudioSubmittable(draft({ attachments: atts }))).toBe(false);
  });

  it('نشانیِ خالی/نامعتبر دقیقاً پرِسطر خطا می‌گیرد (وابسته به id سطر)', () => {
    const bad1 = row({ id: 'bad1', url: 'htp://..' });
    const bad2 = row({ id: 'bad2', url: '' });
    const good = row({ id: 'good', url: 'https://h.example/a.mp4' });
    const e = validateStudioDraft(draft({ attachments: [bad1, good, bad2] }));
    expect(e.attachmentUrl.bad1).toBeTruthy();
    expect(e.attachmentUrl.bad2).toBeTruthy();
    expect(e.attachmentUrl.good).toBeUndefined();
  });

  it('فرمِ سالمِ حداقلی (بدونِ پیوست) ارسال‌پذیر است — مطابقِ بک‌اند (attachments اختیاری)', () => {
    expect(isStudioSubmittable(draft())).toBe(true);
    expect(isStudioSubmittable(draft({ title: '' }))).toBe(false);
  });
});

describe('buildSubmissionPayload — دقیقاً شکلِ serializerِ بک‌اند', () => {
  it('trim + ترتیبِ صفرمبنا + عنوانِ خالیِ پیوست حذف می‌شود', () => {
    const p = buildSubmissionPayload(
      draft({
        title: '  روایتِ مرز  ',
        description: '  متن کامل  ',
        attachments: [
          row({ url: ' https://h.example/a.mp4 ', mediaType: 'video', title: ' کلیپِ مراسم ' }),
          row({ url: 'https://h.example/b.jpg', mediaType: 'image' }),
        ],
      }),
    );
    expect(p.title).toBe('روایتِ مرز');
    expect(p.description).toBe('متن کامل');
    expect(p.attachments).toEqual([
      { url: 'https://h.example/a.mp4', media_type: 'video', title: 'کلیپِ مراسم', order: 0 },
      { url: 'https://h.example/b.jpg', media_type: 'image', order: 1 },
    ]);
  });

  it('اگر بیش از سقف سطر باشد (حالتِ غیرعادی)، فقط ۵ تای اول می‌روند', () => {
    const atts = Array.from({ length: 7 }, (_, i) =>
      row({ id: `r${i}`, url: `https://h.example/${i}.jpg`, mediaType: 'image' }),
    );
    const p = buildSubmissionPayload(draft({ attachments: atts }));
    expect(p.attachments).toHaveLength(STUDIO_LIMITS.ATTACHMENTS_MAX);
    expect(p.attachments[4]?.order).toBe(4);
  });
});

describe('previewItemFromDraft — آیتمِ پیش‌نمایشِ کارتِ واقعی', () => {
  it('سطرهای نشانی‌خالی حذف می‌شوند و origin همیشه user_submitted است', () => {
    const item = previewItemFromDraft(
      draft({
        title: 'عنوان',
        description: 'بدنه',
        attachments: [
          row({ url: '' }),
          row({ url: 'https://h.example/a.jpg', mediaType: 'image' }),
        ],
      }),
      'حسابِ من',
    );
    expect(item.origin).toBe('user_submitted');
    expect(item.author_username).toBe('حسابِ من');
    expect(((item.attachments as Array<{ url: string }>) ?? []).length).toBe(1);
  });
});

describe('submissionStatusMeta — لیبلِ فارسیِ وضعیت‌های بررسی', () => {
  it('سه وضعیتِ قرارداد + fallback امن', () => {
    expect(submissionStatusMeta('pending_review').label).toBe('در انتظار بررسی');
    expect(submissionStatusMeta('approved').tone).toBe('emerald');
    expect(submissionStatusMeta('rejected').tone).toBe('rose');
    expect(submissionStatusMeta('???').tone).toBe('ink');
  });
});

describe('newAttachmentRow — شناسه‌های یکتا', () => {
  it('ردیف‌های پشت‌سرهم id متفاوت دارند و mediaType پیش‌فرض other است', () => {
    const a = newAttachmentRow();
    const b = newAttachmentRow();
    expect(a.id).not.toBe(b.id);
    expect(a.mediaType).toBe('other');
    expect(a.typeTouched).toBe(false);
  });
});
