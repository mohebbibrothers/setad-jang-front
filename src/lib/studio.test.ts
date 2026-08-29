import { describe, expect, it } from 'vitest';
import {
  acceptForType,
  buildSubmissionPayload,
  effectiveMediaTypeOf,
  formatBytesFa,
  hasMixedMediaTypes,
  HOMOGENEOUS_TYPES_MESSAGE,
  isAcceptableAttachmentUrl,
  isHttpUrl,
  isLocalMediaUrl,
  isStudioSubmittable,
  isTypeDefiningRow,
  lockedMediaTypeOf,
  migrateAttachmentRow,
  newAttachmentRow,
  normalizeStudioUploadConfig,
  previewItemFromDraft,
  sniffMediaTypeFromFilename,
  sniffMediaTypeFromUrl,
  STUDIO_LIMITS,
  STUDIO_UPLOAD_FALLBACK,
  submissionStatusMeta,
  urlConflictsWithLock,
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
  source: 'url',
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
    expect(a.source).toBe('url');
  });

  it('با نوعِ ارثی (قفلِ روایت)، همان نوع اعمال و لمس‌شده علامت می‌خورد', () => {
    const a = newAttachmentRow('video');
    expect(a.mediaType).toBe('video');
    expect(a.typeTouched).toBe(true);
  });
});

describe('قفلِ تک‌نوعی — effective/lock/mixed/conflict', () => {
  it('effectiveMediaTypeOf: فایلِ آپلودی از mime بر همه‌چیز مقدم است', () => {
    const r = row({
      mediaType: 'audio',
      typeTouched: true,
      url: 'https://h.example/a.mp4',
      file: { name: 'p.png', sizeBytes: 1000, mime: 'image/png' },
    });
    expect(effectiveMediaTypeOf(r)).toBe('image');
  });

  it('effectiveMediaTypeOf: انتخابِ دستی بر بو از نشانی مقدم است', () => {
    expect(
      effectiveMediaTypeOf(
        row({ mediaType: 'image', typeTouched: true, url: 'https://h.example/a.mp4' }),
      ),
    ).toBe('image');
  });

  it('effectiveMediaTypeOf: بدونِ لمس، بو از نشانی تعیین می‌کند', () => {
    expect(effectiveMediaTypeOf(row({ url: 'https://h.example/a.mp4' }))).toBe('video');
  });

  it('isTypeDefiningRow: نشانیِ بی‌بو/خالی قفل نمی‌سازد تا کاربر اسیرِ تایپِ اشتباه نشود', () => {
    expect(isTypeDefiningRow(row({ url: '' }))).toBe(false);
    expect(isTypeDefiningRow(row({ url: 'https://h.example/page' }))).toBe(false);
    expect(isTypeDefiningRow(row({ url: 'https://h.example/a.jpg' }))).toBe(true);
    expect(isTypeDefiningRow(row({ url: 'https://h.example/unk', typeTouched: true }))).toBe(true);
  });

  it('lockedMediaTypeOf از اولین سطرِ نوع‌دار می‌آید', () => {
    const list = [
      row({ id: 'a', url: '' }),
      row({ id: 'b', url: 'https://h.example/v.webm' }),
      row({ id: 'c', url: 'https://h.example/a.jpg' }),
    ];
    expect(lockedMediaTypeOf(list)).toBe('video');
    expect(lockedMediaTypeOf([])).toBeNull();
  });

  it('hasMixedMediaTypes ترکیب را تشخیص می‌دهد', () => {
    const mixed = [
      row({ id: 'a', url: 'https://h.example/a.jpg' }),
      row({ id: 'b', url: 'https://h.example/song.mp3' }),
    ];
    expect(hasMixedMediaTypes(mixed)).toBe(true);
    const pure = [
      row({ id: 'a', url: 'https://h.example/a.mp4' }),
      row({ id: 'b', url: 'https://h.example/b.webm' }),
    ];
    expect(hasMixedMediaTypes(pure)).toBe(false);
  });

  it('urlConflictsWithLock فقط با قفلِ فعال دردسر می‌سازد', () => {
    expect(urlConflictsWithLock(row({ url: 'https://h.example/a.jpg' }), 'video')).toBe(true);
    expect(urlConflictsWithLock(row({ url: 'https://h.example/a.jpg' }), 'image')).toBe(false);
    expect(urlConflictsWithLock(row({ url: 'https://h.example/page' }), 'video')).toBe(false);
    expect(urlConflictsWithLock(row({ url: 'https://h.example/a.jpg' }), null)).toBe(false);
    /* انتخابِ دستیِ هم‌نوع با قفل، ناسازگار نیست */
    expect(
      urlConflictsWithLock(
        row({ url: 'https://h.example/a.jpg', mediaType: 'video', typeTouched: true }),
        'video',
      ),
    ).toBe(false);
  });
});

describe('اعتبارسنجیِ تک‌نوعی و آپلود', () => {
  it('ترکیبِ انواع پیامِ object-level بک‌اند را می‌دهد', () => {
    const e = validateStudioDraft(
      draft({
        attachments: [
          row({ id: 'a', url: 'https://h.example/a.jpg' }),
          row({ id: 'b', url: 'https://h.example/b.mp4' }),
        ],
      }),
    );
    expect(e.attachments).toBe(HOMOGENEOUS_TYPES_MESSAGE);
    expect(e.attachmentUrl.b).toContain('هم‌خوانی ندارد');
  });

  it('همه‌ی هم‌نوع (ترکیبِ نشانی و آپلود) معتبر است', () => {
    const e = validateStudioDraft(
      draft({
        attachments: [
          row({ id: 'a', url: 'https://h.example/a.jpg' }),
          row({
            id: 'b',
            source: 'upload',
            url: '/media/public/tabyin/users/9/b.png',
            file: { name: 'b.png', sizeBytes: 2048, mime: 'image/png' },
          }),
        ],
      }),
    );
    expect(e.attachments).toBeUndefined();
  });

  it('حالتِ آپلود بدونِ فایلِ کامل، پیامِ آپلود می‌گیرد نه پیامِ نشانی', () => {
    const e = validateStudioDraft(draft({ attachments: [row({ id: 'u', source: 'upload' })] }));
    expect(e.attachmentUrl.u).toContain('آپلود');
  });

  it('نشانیِ بومیِ /media/ در هر دو حالت پذیرفته است', () => {
    expect(isStudioSubmittable(draft({ attachments: [row({ url: '/media/public/u.jpg' })] }))).toBe(
      true,
    );
  });
});

describe('نشانیِ بومیِ مدیاسرور', () => {
  it('isLocalMediaUrl مسیرِ نسبی و هاستِ بعثت را می‌شناسد', () => {
    expect(isLocalMediaUrl('/media/public/tabyin/users/12/abc.jpg')).toBe(true);
    expect(isLocalMediaUrl('media/public/x.png')).toBe(true);
    expect(isLocalMediaUrl('https://besat.me/media/public/tabyin/users/1/a.webp')).toBe(true);
    expect(isLocalMediaUrl('https://www.besat.me/media/public/x.png')).toBe(true);
    expect(isLocalMediaUrl('https://cdn.besat.me/media/public/x.png')).toBe(true);
    expect(isLocalMediaUrl('https://example.com/a.jpg')).toBe(false);
    expect(isLocalMediaUrl('')).toBe(false);
  });

  it('isAcceptableAttachmentUrl: https یا مدیاي بومی', () => {
    expect(isAcceptableAttachmentUrl('https://a.com/f.mp4')).toBe(true);
    expect(isAcceptableAttachmentUrl('/media/public/u.jpg')).toBe(true);
    expect(isAcceptableAttachmentUrl('tg://x')).toBe(false);
    expect(isAcceptableAttachmentUrl('')).toBe(false);
  });
});

describe('پیکربندیِ آپلود — آینه‌ی uploads/config/', () => {
  it('پیکربندیِ ناقص با پیش‌فرض‌های قرارداد پر می‌شود', () => {
    const cfg = normalizeStudioUploadConfig({ max_mb: { video: 120 } });
    expect(cfg.maxAttachments).toBe(STUDIO_LIMITS.ATTACHMENTS_MAX);
    expect(cfg.maxMb.video).toBe(120);
    expect(cfg.maxMb.image).toBe(10);
    expect(cfg.extensions.video).toContain('mp4');
  });

  it('ورودیِ خراب → پیش‌فرضِ کامل', () => {
    const cfg = normalizeStudioUploadConfig(null);
    expect(cfg).toEqual(STUDIO_UPLOAD_FALLBACK);
  });

  it('acceptForType با قفل فقط پسوندهای همان نوع را می‌دهد و svg مجاز نیست', () => {
    const acc = acceptForType('image', null);
    expect(acc).toContain('.jpg');
    expect(acc).toContain('image/*');
    expect(acc).not.toContain('.mp4');
    expect(acc).not.toContain('.svg');
    const all = acceptForType(null, null);
    expect(all).toContain('.mp3');
    expect(all).toContain('.zip');
    expect(all).toContain('.mp4');
  });
});

describe('ابزارهای فایل (نام/حجم)', () => {
  it('sniffMediaTypeFromFilename نوع را از روی نام فایل حدس می‌زند', () => {
    expect(sniffMediaTypeFromFilename('IMG_2042.JPG')).toBe('image');
    expect(sniffMediaTypeFromFilename('clip.MP4')).toBe('video');
    expect(sniffMediaTypeFromFilename('voice note.m4a')).toBe('audio');
    expect(sniffMediaTypeFromFilename('دفتر.xlsx')).toBe('other');
    expect(sniffMediaTypeFromFilename('no-extension')).toBe('other');
  });

  it('formatBytesFa اعدادِ خوانای فارسی می‌دهد', () => {
    expect(formatBytesFa(512)).toBe('۵۱۲ بایت');
    expect(formatBytesFa(2048)).toBe('۲ کیلوبایت');
    expect(formatBytesFa(3 * 1024 * 1024)).toBe('۳ مگابایت');
    expect(formatBytesFa(Number.NaN)).toBe('');
  });
});

describe('migrateAttachmentRow — پیش‌نویس‌های قدیمیِ localStorage', () => {
  it('سطرِ قدیمی (بدونِ source) به مدلِ تازه مهاجرت می‌کند', () => {
    const m = migrateAttachmentRow({
      id: 'old-1',
      url: 'https://x.example/a.mp4',
      mediaType: 'video',
    });
    expect(m).not.toBeNull();
    expect(m?.source).toBe('url');
    expect(m?.id).toBe('old-1');
    expect(m?.mediaType).toBe('video');
  });

  it('نشانیِ بومیِ ذخیره‌شده، حالتِ آپلود برمی‌دارد', () => {
    const m = migrateAttachmentRow({ id: 'old-2', url: '/media/public/tabyin/users/9/a.jpg' });
    expect(m?.source).toBe('upload');
  });

  it('ورودیِ خراب امن رد می‌شود', () => {
    expect(migrateAttachmentRow(null)).toBeNull();
    expect(migrateAttachmentRow(42)).toBeNull();
    expect(migrateAttachmentRow({})).toBeNull();
  });
});
