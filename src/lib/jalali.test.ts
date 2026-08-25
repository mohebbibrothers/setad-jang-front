import { describe, expect, it } from 'vitest';
import {
  MIN_JALALI_YEAR,
  MAX_JALALI_YEAR,
  fromJalali,
  isLeapJalaliYear,
  isValidJalaliDate,
  jalaliMonthLength,
  jalaliToIso,
  isoToJalali,
  toJalali,
  todayJalali,
  JALALI_MONTH_NAMES,
} from './jalali';

/**
 * صحتِ تبدیل جلالی — حیاتی برای سینکِ تاریخ تولد با بک‌اند:
 * ۱) لنگرهای قطعیِ دانشنامه‌ای؛ ۲) قواعد کبیسه و طول ماه؛ ۳) اعتبارسنجی؛
 * ۴) مهم‌تر از همه: رفت‌وبرگشتِ کامل — هر روزِ ~۳۰ سال گذشته/آینده باید
 *    دقیقاً به خودش برگردد (g→j→g و j→g→j).
 */

describe('jalali — لنگرهای قطعی', () => {
  it.each([
    [
      { gy: 2024, gm: 3, gd: 20 },
      { jy: 1403, jm: 1, jd: 1 },
    ],
    [
      { gy: 2023, gm: 3, gd: 21 },
      { jy: 1402, jm: 1, jd: 1 },
    ],
    [
      { gy: 2000, gm: 1, gd: 1 },
      { jy: 1378, jm: 10, jd: 11 },
    ],
    [
      { gy: 1979, gm: 3, gd: 21 },
      { jy: 1358, jm: 1, jd: 1 },
    ],
    [
      { gy: 1988, gm: 10, gd: 11 },
      { jy: 1367, jm: 7, jd: 19 },
    ],
  ])('%o ↔ %o', (g, j) => {
    expect(toJalali(g.gy, g.gm, g.gd)).toEqual(j);
    expect(fromJalali(j.jy, j.jm, j.jd)).toEqual(g);
  });
});

describe('jalali — کبیسه و طول ماه', () => {
  it('سال‌های کبیسه‌ی مرجع', () => {
    expect(isLeapJalaliYear(1399)).toBe(true);
    expect(isLeapJalaliYear(1403)).toBe(true);
    expect(isLeapJalaliYear(1404)).toBe(false);
    expect(isLeapJalaliYear(1375)).toBe(true);
  });

  it('طول ماه‌ها — شش‌ماه‌یِ نخست ۳۱، پنج‌ماه ۳۰، اسفندِ کبیسه ۳۰', () => {
    expect(jalaliMonthLength(1403, 1)).toBe(31);
    expect(jalaliMonthLength(1403, 6)).toBe(31);
    expect(jalaliMonthLength(1403, 7)).toBe(30);
    expect(jalaliMonthLength(1403, 11)).toBe(30);
    expect(jalaliMonthLength(1403, 12)).toBe(30); // کبیسه
    expect(jalaliMonthLength(1404, 12)).toBe(29);
  });

  it('اعتبارسنجیِ تاریخ', () => {
    expect(isValidJalaliDate(1403, 12, 30)).toBe(true);
    expect(isValidJalaliDate(1404, 12, 30)).toBe(false); // اسفند ۲۹ روزه
    expect(isValidJalaliDate(1403, 6, 31)).toBe(true);
    expect(isValidJalaliDate(1403, 7, 31)).toBe(false);
    expect(isValidJalaliDate(1403, 0, 10)).toBe(false);
    expect(isValidJalaliDate(1403, 13, 10)).toBe(false);
    expect(isValidJalaliDate(1403, 1, 0)).toBe(false);
    expect(isValidJalaliDate(MIN_JALALI_YEAR, 1, 1)).toBe(true);
    expect(isValidJalaliDate(MAX_JALALI_YEAR, 1, 1)).toBe(false);
  });
});

describe('jalali — ISO bridge (قراردادِ بک‌اند)', () => {
  it('jalaliToIso خروجی YYYY-MM-DD گرگوریان می‌دهد', () => {
    expect(jalaliToIso({ jy: 1403, jm: 1, jd: 1 })).toBe('2024-03-20');
    expect(jalaliToIso({ jy: 1378, jm: 10, jd: 11 })).toBe('2000-01-01');
  });

  it('isoToJalali ورودی‌های معتبر و نامعتبر', () => {
    expect(isoToJalali('2024-03-20')).toEqual({ jy: 1403, jm: 1, jd: 1 });
    expect(isoToJalali('2024-03-20T15:30:00')).toEqual({ jy: 1403, jm: 1, jd: 1 });
    expect(isoToJalali('۲۰۲۴-۰۳-۲۰')).toBeNull(); // ارقام فارسی → ورودی نامعتبر
    expect(isoToJalali('2024-13-01')).toBeNull();
    expect(isoToJalali('')).toBeNull();
    expect(isoToJalali(null)).toBeNull();
    expect(isoToJalali(undefined)).toBeNull();
  });

  it('رفت‌وبرگشت ISO→جلالی→ISO هویت است', () => {
    expect(jalaliToIso(isoToJalali('2000-05-04')!)).toBe('2000-05-04');
  });
});

describe('jalali — رفت‌وبرگشتِ کامل (sweep استقرایی)', () => {
  it('هر روز از ۱۹۷۹ تا ۲۰۴۰: g→j→g = هویت', () => {
    // نمایه‌ی روزها با Date — حوالی ۲۲٬۷۰۰ روز
    const start = Date.UTC(1979, 2, 21); // 1358-01-01
    const end = Date.UTC(2040, 11, 31);
    let checked = 0;
    for (let t = start; t <= end; t += 86_400_000) {
      const d = new Date(t);
      const gy = d.getUTCFullYear();
      const gm = d.getUTCMonth() + 1;
      const gd = d.getUTCDate();
      const j = toJalali(gy, gm, gd);
      expect(isValidJalaliDate(j.jy, j.jm, j.jd)).toBe(true);
      const back = fromJalali(j.jy, j.jm, j.jd);
      expect(back).toEqual({ gy, gm, gd });
      // و طول ماه با روزِ واقعی منسجم است
      expect(j.jd).toBeLessThanOrEqual(jalaliMonthLength(j.jy, j.jm));
      checked += 1;
    }
    expect(checked).toBeGreaterThan(22_000);
  });

  it('هر روزِ سال‌های ۱۳۷۰–۱۴۱۰: j→g→j = هویت', () => {
    for (let jy = 1370; jy <= 1410; jy += 1) {
      for (let jm = 1; jm <= 12; jm += 1) {
        const len = jalaliMonthLength(jy, jm);
        for (const jd of [1, Math.floor(len / 2), len]) {
          const g = fromJalali(jy, jm, jd);
          expect(toJalali(g.gy, g.gm, g.gd)).toEqual({ jy, jm, jd });
        }
      }
    }
  });
});

describe('jalali — متادیتا', () => {
  it('دوازده ماه فارسی', () => {
    expect(JALALI_MONTH_NAMES).toHaveLength(12);
    expect(JALALI_MONTH_NAMES[0]).toBe('فروردین');
    expect(JALALI_MONTH_NAMES[11]).toBe('اسفند');
  });

  it('todayJalali از تاریخ گرگوریانِ درست استفاده می‌کند', () => {
    expect(todayJalali(new Date(2024, 2, 20))).toEqual({ jy: 1403, jm: 1, jd: 1 });
  });
});
