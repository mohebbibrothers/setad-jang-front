/**
 * بردارهای آینه‌ای password_policy.py — هر تست دقیقاً همان قضاوتی را
 * انتظار دارد که BesatPasswordPolicyValidator + AUTH_PASSWORD_VALIDATORS
 * جنگو روی سرور می‌دهند. مرجع: apps/authentication/tests/
 * test_password_policy.py (بردارهای معادل انتخاب شده‌اند).
 */

import { describe, expect, it } from 'vitest';
import {
  analyzePassword,
  characterClassCount,
  hasKeyboardRow,
  isPasswordAcceptable,
  longestMonotonicRun,
  longestRepeatRun,
  normalizeForPolicy,
  PASSWORD_MIN_LENGTH,
  PASSWORD_RULE_LABELS,
  SCORE_LABELS,
  type PasswordRule,
} from './password-policy';

/** ترتیبِ قضاوت — همان ORDER داخلیِ analyzePassword (پیش‌شرطِ firstBad). */
const ORDER: PasswordRule[] = [
  'length',
  'classes',
  'notNumeric',
  'noSequential',
  'noKeyboardRow',
  'noBirthYear',
  'noPlatformToken',
  'notCommon',
];

describe('ثابت‌های قرارداد سیاست رمز بک‌اند', () => {
  it('حداقل ۱۰ نویسه و برچسب‌های آمادهٔ قواعد کامل‌اند', () => {
    expect(PASSWORD_MIN_LENGTH).toBe(10);
    expect(Object.keys(PASSWORD_RULE_LABELS)).toHaveLength(8);
    expect(SCORE_LABELS).toHaveLength(5);
  });
});

describe('normalizeForPolicy — عین بک‌اند', () => {
  it('ارقام فارسی/عربی → ASCII، نویز حذف، قطع‌بندیِ حروف', () => {
    expect(normalizeForPolicy('B e s a t!2024')).toBe('besat2024');
    expect(normalizeForPolicy('۱۳۶۶')).toBe('1366');
    expect(normalizeForPolicy('A b C d - 1')).toBe('abcd1');
  });
});

describe('ردیفِ کیبرد (آینهٔ _on_keyboard_row)', () => {
  it.each([
    ['mypasswordqwer!7', true],
    ['poiuyzx!937', true], // poiuy روی ردیف معکوسِ qwertyuiop
    ['ruhesabr2049', false],
    ['sdfg', true],
    ['xyzab2024pass', false],
  ])('%s → keyboard? %s', (value, expected) => {
    expect(hasKeyboardRow(value)).toBe(expected);
  });
});

describe('توالی/تکرار (آینهٔ run_length/monotonic)', () => {
  it('توالیِ صعودی «abcd» به run≥4 می‌رسد', () => {
    expect(longestMonotonicRun('abcdxy938')).toBeGreaterThanOrEqual(4);
  });
  it('توالی‌های کوچکِ اتفاقی تشخیص داده نمی‌شوند', () => {
    expect(longestMonotonicRun('att')).toBeLessThan(4);
    expect(longestMonotonicRun('9871')).toBeLessThan(4);
  });
  it('تکرارِ ≥۴ رد', () => {
    expect(longestRepeatRun('pacoooo7')).toBeGreaterThanOrEqual(4);
  });
});

describe('analyzePassword — بردارهای کلیدیِ قضاوت', () => {
  it('رمزِ قَوِیِ مرجع پذیرفته می‌شود (سه دسته + طول + بدون الگو)', () => {
    const a = analyzePassword('Ruh-e-Sabr#2049');
    expect(a.acceptable).toBe(true);
    expect(a.score).toBe(4);
    expect(a.firstViolation).toBeNull();
    expect(isPasswordAcceptable('Ruh-e-Sabr#2049')).toBe(true);
  });

  it('رمز طولانیِ پرکلاسِ بدون نامِ برند هم می‌گذرد', () => {
    const a = analyzePassword('XyZab!2024pass');
    expect(a.acceptable).toBe(true);
    expect(a.score).toBe(4);
  });

  it.each<[string, PasswordRule]>([
    ['Sh0rt!2', 'length'], // ۷ نویسه
    ['lowercase111', 'classes'], // ۱۱ نویسه ولی فقط ۲ دسته
    ['1234567890', 'classes'], // فقط رقم — classes پیش از notNumeric قضاوت می‌شود
    ['xxxxAttribute1!', 'noSequential'], // xxxx تکرارِ ≥۴
    ['abcdXy!#938', 'noSequential'], // abcd توالیِ ≥۴
    ['MypasswordQwer!7', 'noKeyboardRow'], // qwer
    ['Arash-Ebadi1366!', 'noBirthYear'], // الگوی ۱۳xx صریح
    ['Pooر1366!xY', 'noBirthYear'], // سال در میانه—بعد از نرمال‌سازی ارقام
    ['MyBesat!9210', 'noPlatformToken'], // نام عمومی برند
    ['VeryLongBesat!2024', 'noPlatformToken'], // حتی در دلِ رمز قوی‌نما
    ['Password123!', 'notCommon'], // نرمالِ دقیقِ عضوِ فهرست
  ])('«%s» → نقضِ اول از قاعدهٔ %s با قضاوتِ سرور یکی است', (pw, rule) => {
    const a = analyzePassword(pw);
    expect(a.acceptable).toBe(false);
    expect(a.rules[rule]).toBe(false);
    // قاعده‌ها قبل از آن در ترتیبِ قضاوت سالم‌اند — یعنی اولین نقض واقعاً همین است
    for (const key of ORDER) {
      if (key === rule) break;
      expect(a.rules[key], `قاعدهٔ «${key}» نباید پیش از «${rule}» نقض شود`).toBe(true);
    }
    expect(a.firstViolation).toBeTruthy();
    expect(isPasswordAcceptable(pw)).toBe(false);
  });
});

describe('متر قدرت — سقف نمره هنگام نقض امنیتی', () => {
  it('رمزِ طولانی و پرکلاس ولی با نام برند، در «بسیار ضعیف» محبوس است', () => {
    const a = analyzePassword('VeryLongBesat!2024');
    expect(a.score).toBeLessThanOrEqual(1);
  });

  it('رمزِ خالی «بسیار ضعیف» با نمرهٔ صفر است', () => {
    const a = analyzePassword('');
    expect(a.score).toBe(0);
    expect(a.acceptable).toBe(false);
    expect(a.firstViolation).toBeTruthy();
  });
});

describe('characterClassCount — روی رشتهٔ خام', () => {
  it('شمارِ دسته‌ها دقیق است', () => {
    expect(characterClassCount('Ruh-e-Sabr#2049').count).toBe(4);
    expect(characterClassCount('lowercase1').count).toBe(2);
  });
});
