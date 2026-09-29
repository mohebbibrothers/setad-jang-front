import { describe, expect, it } from 'vitest';

import { normalizeRouteSlug } from './route-slug';

const FA_ENCODED = '%D8%AC%D8%A7%D9%88%D8%A7-%D8%A7%D8%B3%DA%A9%D8%B1%DB%8C%D9%BE%D8%AA';
const FA_DECODED = 'جاوا-اسکریپت';

describe('normalizeRouteSlug — ترمیمِ ۴۰۴ اسلاگ‌های فارسی در پروداکشن', () => {
  it('اسلاگِ ASCII دست‌نخورده می‌ماند', () => {
    expect(normalizeRouteSlug('php')).toBe('php');
    expect(normalizeRouteSlug('course-1_v2')).toBe('course-1_v2');
  });

  it('اسلاگِ فارسیِ انکدشده (رفتارِ next start در پروداکشن) decode می‌شود', () => {
    expect(normalizeRouteSlug(FA_ENCODED)).toBe(FA_DECODED);
  });

  it('اسلاگِ فارسیِ decodeشده (رفتارِ dev) همان‌طور باقی می‌ماند', () => {
    expect(normalizeRouteSlug(FA_DECODED)).toBe(FA_DECODED);
  });

  it('هر دو رفتارِ Next به یک wire-format واحد می‌رسند (ضدِ double-encode)', () => {
    const fromEncoded = normalizeRouteSlug(FA_ENCODED);
    const fromDecoded = normalizeRouteSlug(FA_DECODED);
    expect(encodeURIComponent(fromEncoded)).toBe(FA_ENCODED.toUpperCase());
    expect(encodeURIComponent(fromDecoded)).toBe(FA_ENCODED.toUpperCase());
  });

  it('ورودیِ mixed (ASCII + بایتِ فارسیِ انکدشده) درست باز می‌شود', () => {
    expect(normalizeRouteSlug('py%D8%AAhon')).toBe('pyتhon');
  });

  it('لینکِ دوبارانکدشده (مسنجرها/واسط‌ها) هم خودترمیم می‌شود', () => {
    const doubleEncoded = encodeURIComponent(FA_ENCODED); // %25D8%25AC…
    expect(normalizeRouteSlug(doubleEncoded)).toBe(FA_DECODED);
  });

  it('٪ِ ناقص یا نامعتبر → ورودیِ خام، بدون throw', () => {
    expect(normalizeRouteSlug('abc%')).toBe('abc%');
    expect(normalizeRouteSlug('abc%ZZdef')).toBe('abc%ZZdef');
    expect(normalizeRouteSlug('100%2')).toBe('100%2');
  });

  it('canonicalِ اسلاگِ فارسی دیگر double-encode نمی‌شود', () => {
    // قبل از ترمیم: canonicalOf(params.slug) ⇒ /lms/courses/%25D8… (خرابِ SEO)
    const canonical = (slug: string) => `/lms/courses/${encodeURIComponent(slug)}`;
    expect(canonical(normalizeRouteSlug(FA_ENCODED))).toBe(`/lms/courses/${FA_ENCODED}`);
  });
});
