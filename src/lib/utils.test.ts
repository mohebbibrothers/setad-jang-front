/** تست‌های ابزارهای نمایش فارسی و نرمال‌سازی URL رسانه. */
import { describe, it, expect } from 'vitest';
import {
  cn,
  formatPersianNumber,
  formatToman,
  toPersianDigits,
  truncate,
  absoluteMediaUrl,
} from './utils';

describe('cn', () => {
  it('کلاس‌های متضاد tailwind را ادغام می‌کند (آخری برنده)', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });
  it('مقادیر falsy را نادیده می‌گیرد', () => {
    expect(cn('a', false, undefined, null, 'b')).toBe('a b');
  });
});

describe('formatPersianNumber', () => {
  it('عدد را با جداکننده‌ی فارسی قالب می‌دهد', () => {
    expect(formatPersianNumber(1234567)).toBe((1234567).toLocaleString('fa-IR'));
  });
  it('رشته‌ی عددی را هم می‌پذیرد', () => {
    expect(formatPersianNumber('1000')).toBe((1000).toLocaleString('fa-IR'));
  });
  it('ورودی نامعتبر را دست‌نخورده برمی‌گرداند', () => {
    expect(formatPersianNumber('abc')).toBe('abc');
  });
});

describe('formatToman', () => {
  it('واحد را اضافه می‌کند', () => {
    expect(formatToman(1000)).toContain('تومان');
  });
});

describe('toPersianDigits', () => {
  it('ارقام لاتین را فارسی می‌کند', () => {
    expect(toPersianDigits('1402/06/01')).toBe('۱۴۰۲/۰۶/۰۱');
  });
  it('کاراکترهای غیرعددی را دست نمی‌زند', () => {
    expect(toPersianDigits('a1b')).toBe('a۱b');
  });
});

describe('truncate', () => {
  it('متن کوتاه‌تر از حد را تغییر نمی‌دهد', () => {
    expect(truncate('سلام', 10)).toBe('سلام');
  });
  it('متن بلند را با سه‌نقطه کوتاه می‌کند', () => {
    const out = truncate('a'.repeat(50), 10);
    expect(out.endsWith('…')).toBe(true);
    expect(out.length).toBeLessThanOrEqual(11);
  });
  it('ورودی خالی را امن هندل می‌کند', () => {
    expect(truncate('')).toBe('');
  });
});

describe('absoluteMediaUrl', () => {
  it('ورودی خالی/نامعتبر → undefined', () => {
    expect(absoluteMediaUrl(null)).toBeUndefined();
    expect(absoluteMediaUrl(undefined)).toBeUndefined();
    expect(absoluteMediaUrl('')).toBeUndefined();
    expect(absoluteMediaUrl('   ')).toBeUndefined();
  });

  it('نشانی مطلق (http/https/protocol-relative) دست‌نخورده', () => {
    expect(absoluteMediaUrl('https://cdn.example/x.jpg')).toBe('https://cdn.example/x.jpg');
    expect(absoluteMediaUrl('http://cdn.example/y.png')).toBe('http://cdn.example/y.png');
    expect(absoluteMediaUrl('//cdn.example/z.webp')).toBe('//cdn.example/z.webp');
  });

  it('مسیر نسبی روی میزبان API سوار می‌شود', () => {
    expect(absoluteMediaUrl('/media/a.jpg')?.endsWith('/media/a.jpg')).toBe(true);
    expect(absoluteMediaUrl('media/b.jpg')?.endsWith('/media/b.jpg')).toBe(true);
    // اسلش‌های اضافه‌ی مرز base/path تکثیر نمی‌شوند
    expect(absoluteMediaUrl('//media/double.jpg')).toBe('//media/double.jpg');
  });
});
