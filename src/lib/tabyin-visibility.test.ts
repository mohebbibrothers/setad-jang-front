import { describe, expect, it } from 'vitest';
import {
  hasReadableContentText,
  hasVisibleContent,
  stripInvisibles,
  visibleContents,
} from './tabyin-visibility';

/**
 * tabyin-visibility — قراردادِ «جهانِ قابل‌نمایش»:
 * همان شروطی که دیوارِ جهاد تبیینِ صفحه‌ی اصلی برای ساختنِ کاشی (و
 * شمارشِ «همه») به‌کار می‌برد، این‌بار روی سطرِ خام تا فیدِ روایت‌ها
 * و شمارنده‌اش دقیقاً با دیوار در یک جهان باشند:
 *   کاورِ قابلِ embed  ∨  ویدئوی قابلِ پخش  ∨  متنِ خواندنی
 * وگرنه سطر پوچ است و جایی دیده/شمرده نمی‌شود.
 */

const row = (
  title?: string,
  description?: string,
  attachments?: { url: string; media_type: string }[],
) => ({ external_id: 'x', title, description, attachments });

describe('stripInvisibles — بایت‌به‌بایت همان تنظیمِ دیوار', () => {
  it('نیم‌فاصله، ZWJ، BOM، ALM/RLM و NBSP حذف می‌شوند', () => {
    expect(stripInvisibles('‌ ‍﻿‏ ')).toBe('');
    expect(stripInvisibles('‪‫‬⁠')).toBe('');
    expect(stripInvisibles(' سلام ')).toBe('سلام');
  });

  it('متنِ واقعی را دست نمی‌زند (فقط trim و حذفِ نامرئی‌ها)', () => {
    expect(stripInvisibles('روایتِ روز')).toBe('روایتِ روز');
    expect(stripInvisibles(undefined)).toBe('');
    expect(stripInvisibles(null)).toBe('');
  });
});

describe('hasReadableContentText — متنِ خواندنی (عنوان یا کپشن)', () => {
  it('عنوان یا کپشنِ پر → true؛ هر دو تهی → false', () => {
    expect(hasReadableContentText({ title: 'عنوان', description: undefined })).toBe(true);
    expect(hasReadableContentText({ title: undefined, description: 'کپشن' })).toBe(true);
    expect(hasReadableContentText({ title: '  ', description: '‌' })).toBe(false);
    expect(hasReadableContentText({ title: undefined, description: undefined })).toBe(false);
  });
});

describe('hasVisibleContent — کاور ∨ ویدئو ∨ متن', () => {
  it('فقط متن — حتی بدونِ هیچ رسانه‌ای — قابل‌نمایش است', () => {
    expect(hasVisibleContent(row('روایتِ جهاد تبیین'))).toBe(true);
    expect(hasVisibleContent(row(undefined, 'متنِ نقل‌قول'))).toBe(true);
  });

  it('تصویرِ روی هاستِ عادی کاور است؛ بدونِ متن هم نمایش داده می‌شود', () => {
    expect(
      hasVisibleContent(
        row(undefined, undefined, [{ url: 'https://cdn.example.org/i.jpg', media_type: 'image' }]),
      ),
    ).toBe(true);
  });

  it('کاورِ فقط روی app-service.armansky.ir (hot-link ممنوع) قابل‌نمایش نیست', () => {
    expect(
      hasVisibleContent(
        row(undefined, undefined, [
          { url: 'https://app-service.armansky.ir/media/cover.jpg', media_type: 'image' },
        ]),
      ),
    ).toBe(false);
  });

  it('ویدئوی url-دار قابل‌نمایش است — حتی بدونِ متن و کاور', () => {
    expect(
      hasVisibleContent(
        row(undefined, undefined, [
          { url: 'https://cdn.example.org/v/clip.mp4', media_type: 'video' },
        ]),
      ),
    ).toBe(true);
    expect(
      hasVisibleContent(
        row(undefined, undefined, [
          { url: 'https://app-media.armansky.ir/org/uploads/v/film.mp4', media_type: 'video' },
        ]),
      ),
    ).toBe(true);
  });

  it('ویدئو با url تهی قابل‌نمایش نیست (نرمالایزر ساقطش می‌کند)', () => {
    expect(hasVisibleContent(row(undefined, undefined, [{ url: '', media_type: 'video' }]))).toBe(
      false,
    );
  });

  it('صوتِ تنها (بدونِ کاور/ویدئو/متن) — مثل دیوار — پوچ حساب می‌شود', () => {
    expect(
      hasVisibleContent(
        row(undefined, undefined, [
          { url: 'https://cdn.example.org/a/ep.mp3', media_type: 'audio' },
        ]),
      ),
    ).toBe(false);
  });

  it('پوستهٔ کاملاً تهی (نه متن، نه رسانه) و ورودی‌های خراب امن false می‌گیرند', () => {
    expect(hasVisibleContent({ external_id: 'h1' })).toBe(false);
    expect(hasVisibleContent(row(undefined, undefined, null as never))).toBe(false);
    expect(hasVisibleContent(row(undefined, undefined, 'garbage' as never))).toBe(false);
    expect(hasVisibleContent(row('‌‌'))).toBe(false);
  });
});

describe('visibleContents — فیلترِ جهانِ قابل‌نمایش با حفظِ ترتیب', () => {
  it('فقط مواردِ قابل‌نمایش می‌مانند و ترتیب حفظ می‌شود', () => {
    const items = [
      { external_id: 'a', title: 'متنِ یک' },
      { external_id: 'b' }, // تهی
      { external_id: 'c', attachments: [{ url: 'https://m/i.jpg', media_type: 'image' }] },
      { external_id: 'd', title: '‌' }, // نامرئی
      { external_id: 'e', attachments: [{ url: 'https://m/v.mp4', media_type: 'video' }] },
    ];
    expect(visibleContents(items).map((i) => i.external_id)).toEqual(['a', 'c', 'e']);
  });
});
