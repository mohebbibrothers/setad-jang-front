import { describe, expect, it } from 'vitest';
import { primaryNav, footerNav } from './nav';

/**
 * قفل ساختاری ناوبری — این لیست‌ها قراردادِ کلیدیِ سئو/کراولِ سایت‌اند؛
 * تغییر ناخواسته‌ی href یا حذف آیتم باید باعث fail شدن تست شود.
 */
describe('primaryNav', () => {
  it('همه‌ی بخش‌های اصلی دامنه را دارد و ترتیب برند محفوظ است', () => {
    const hrefs = primaryNav.map((i) => i.href);
    expect(hrefs).toEqual([
      '/',
      '/#warfund',
      '/#justice',
      '/#education',
      '/#kindness',
      '/#tabyin',
      '/#reports',
    ]);
  });

  it('آیتم‌های لنگری پرچم anchor دارند و صفحه‌ی اصلی ندارد', () => {
    for (const item of primaryNav) {
      if (item.href.startsWith('/#')) expect(item.anchor).toBe(true);
      else expect(item.anchor).toBeFalsy();
    }
  });

  it('label ها فارسی و غیرتکراری‌اند', () => {
    const labels = primaryNav.map((i) => i.label);
    expect(new Set(labels).size).toBe(labels.length);
    for (const l of labels) expect(l.length).toBeGreaterThan(1);
  });
});

describe('footerNav', () => {
  it('گروه‌بندی معتبر: گروه‌ها عنوان+آیتم غیرخالی دارند', () => {
    expect(footerNav.length).toBeGreaterThan(0);
    for (const group of footerNav) {
      expect(group.label.length).toBeGreaterThan(0);
      expect(group.items.length).toBeGreaterThan(0);
    }
  });
});
