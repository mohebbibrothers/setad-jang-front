/**
 * آینه‌ی دقیقِ سیاست رمز بک‌اند (apps/authentication/password_policy.py +
 * AUTH_PASSWORD_VALIDATORS جنگو) — کاملاً pure و تست‌پذیر.
 *
 * چرا آینه؟ تجربه‌ی مرجع صنعت این است که کاربر همین‌جا، قبل از هر
 * رفت‌وبرگشتِ شبکه، بداند رمزش از کدام قاعده خطا می‌خورد — و پیامِ
 * تبصره‌ی سرور آخرین دژ باشد، نه اولین شوک. پیام‌ها حرف‌به‌حرف از
 * ValidationErrorهای بک‌اند برداشته شده‌اند تا کلاینت و سرور هرگز دو
 * واکِ متفاوت نگویند.
 *
 * قراردادهای بک‌اند (قفل‌شده با تست در password-policy.ts/test):
 *   ۱) حداقل ۱۰ نویسه (MinimumLengthValidator(10) + سیاست بومی)
 *   ۲) حداقل ۳ دسته از ۴ دسته‌ی (کوچک/بزرگ/رقم/نماد) — روی رشته‌ی خام
 *   ۳) بدون توالی/تکرار ≥۴ روی شکل نرمال‌شده (12۳۴، abcd، 9753، aaaa)
 *   ۴) بدون زیررشته‌ی ۴تایی از ردیف‌های کیبرد (qwer، poiuy، asdf…)
 *   ۵) بدون الگوی سال تولد شمسی (13xx) — بعد از نرمال‌سازی ارقام
 *   ۶) بدون نام پلتفرم/سازمان (توکن‌های داخلی — اینجا عمومی‌سازی شده:
 *      «besat» که نام عمومی برند است؛ بقیه‌ی توکن‌ها کلاینت نمی‌داند)
 *   ۷) عضو سیاهه‌ی رمزهای رایج نباشه (مقایسه‌ی دقیق روی شکل نرمال)
 *   ۸) کاملاً عدد نباشد (NumericPasswordValidator جنگو)
 *
 * مرز صداقت: CommonPasswordValidator جنگو (بیست‌هزار رویه‌ی سروری) را
 * کلاینت نه جاسازی می‌کند و نه تقلید می‌کند — آن خطای سرور از راه معمول
 * نمایش داده می‌شود (fieldErrors.password ← پیام فارسی خودِ سرور).
 */

import { toLatinDigits } from './auth-identifier';

/* ───────────────────────── ثابت‌ها ───────────────────────── */

export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MIN_CLASSES = 3;
export const PASSWORD_MAX_RUN = 4;

/** ردیف‌های اصلی کیبرد انگلیسی — مستقیم از password_policy.py */
const KEYBOARD_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'] as const;

/** الگوی سال تولد شمسی — مستقیم از password_policy.py (_SOLAR_BIRTH_YEAR) */
const SOLAR_BIRTH_YEAR = /13\d{2}/;

/**
 * نامِ عمومی برند که طبق سیاست نباید در رمز بیاید. («توکن‌های داخلیِ
 * دیگرِ سرور را کلاینت به‌خودی‌خود نمی‌داند؛ لو رفتنِ آن‌ها از طریق
 * خطای سرور مورد بررسی است و این‌جا فقط توکنِ عمومی آینه می‌شود.)
 */
const PUBLIC_PLATFORM_TOKENS = ['besat'] as const;

/** نویسه‌های «نویزِ» تلفی‌کننده‌ی بک‌اند — برای نرمال‌سازی آینه‌ای. */
const NOISE_CHARS = new Set([...` ._-!@#$%^&*+=~\`'"\\/|:;<>()[]{}`]);

/**
 * نمونه‌ی منتخبِ رایج‌ها از weak_passwords.txt — فقط آیتم‌هایی که
 * از دیگر قواعد گرفتار نمی‌شوند (pede.read—most یعنی نه توالی، نه کیبرد،
 * نه سال): با NFKC نرمال‌سازی/ارقام/نویز سازگار است.
 * هدف: بازخورد فوری روی «سلبریتی‌های» ضعف؛ مرجع نهایی همچنان سرور است.
 */
const MINI_COMMON_LIST = new Set([
  'password',
  'password1',
  'password123',
  'password1234',
  'passw0rd',
  'iloveyou',
  'qwerty123',
  'letmein',
  'welcome1',
  'adminadmin',
  'admin123',
  'usradmin',
  'iran123456',
  'khodabeamorz',
]);

/* ───────────────────────── نرمال‌سازی (آینه) ───────────────────────── */

/** NFKC + ارقام فارسی/عربی→ASCII + حذف نویز + casefold — عین بک‌اند. */
export function normalizeForPolicy(raw: string): string {
  const nfkc = raw.normalize('NFKC');
  const asciiDigits = toLatinDigits(nfkc);
  let out = '';
  for (const ch of asciiDigits) if (!NOISE_CHARS.has(ch)) out += ch;
  return out.toLowerCase();
}

/* ───────────────────────── سنجه‌های منفرد ───────────────────────── */

/** بلندترین run کاراکترهای تکراری روی شکل نرمال (خطی). */
export function longestRepeatRun(value: string): number {
  let longest = value.length > 0 ? 1 : 0;
  let current = 1;
  for (let i = 1; i < value.length; i += 1) {
    current = value[i] === value[i - 1] ? current + 1 : 1;
    if (current > longest) longest = current;
  }
  return longest;
}

/** بلندترین توالی monotonic با گام ±۱ (1234 / 4321 / abcd / dcba). */
export function longestMonotonicRun(value: string): number {
  if (value.length < 2) return value.length;
  let longest = 1;
  for (const step of [1, -1]) {
    let current = 1;
    for (let i = 1; i < value.length; i += 1) {
      if (value.charCodeAt(i) - value.charCodeAt(i - 1) === step) {
        current += 1;
        if (current > longest) longest = current;
      } else {
        current = 1;
      }
    }
  }
  return longest;
}

/** زیررشته‌ی ۴تایی از هر ردیف کیبرد (هر دو جهت) در شکل نرمال هست؟ */
export function hasKeyboardRow(value: string, minLen: number = PASSWORD_MAX_RUN): boolean {
  if (value.length < minLen) return false;
  for (const row of KEYBOARD_ROWS) {
    const reverse = [...row].reverse().join('');
    for (let i = 0; i <= value.length - minLen; i += 1) {
      const part = value.slice(i, i + minLen);
      if (row.includes(part) || reverse.includes(part)) return true;
    }
  }
  return false;
}

/** شمار دسته‌های کاراکتری (کوچک/بزرگ/رقم/نماد) — روی شکل خام، عین بک‌اند. */
export function characterClassCount(raw: string): {
  count: number;
  lower: boolean;
  upper: boolean;
  digit: boolean;
  symbol: boolean;
} {
  let lower = false;
  let upper = false;
  let digit = false;
  let symbol = false;
  for (const ch of toLatinDigits(raw)) {
    if (/[0-9]/.test(ch)) digit = true;
    else if (ch.toLowerCase() === ch && ch.toUpperCase() !== ch) lower = true;
    else if (ch.toUpperCase() === ch && ch.toLowerCase() !== ch) upper = true;
    else if (!/\s/.test(ch) && !/[\p{L}\p{N}]/u.test(ch)) symbol = true;
  }
  return {
    count: Number(lower) + Number(upper) + Number(digit) + Number(symbol),
    lower,
    upper,
    digit,
    symbol,
  };
}

/* ───────────────────────── تحلیلِ جامع ───────────────────────── */

export type PasswordRule =
  | 'length'
  | 'classes'
  | 'notNumeric'
  | 'noSequential'
  | 'noKeyboardRow'
  | 'noBirthYear'
  | 'noPlatformToken'
  | 'notCommon';

export type PasswordAnalysis = {
  /** وضعیت تک‌تک قاعده‌ها (ok=true یعنی رد نمی‌شود) */
  rules: Record<PasswordRule, boolean>;
  /** شکلِ قابل قبول محلی — پیش‌شرط ارسال؛ CommonPassword سرور کنارش می‌ماند */
  acceptable: boolean;
  /** نمره‌ی قدرت ۰..۴ برای متر رنگی */
  score: 0 | 1 | 2 | 3 | 4;
  /** اولین پیام فارسیِ نقض (اگر هست) — کلید کل چک‌لیست برای aria */
  firstViolation: string | null;
};

const VIOLATIONS: Record<PasswordRule, string> = {
  length: `رمز عبور باید حداقل ${PASSWORD_MIN_LENGTH} نویسه باشد.`,
  classes: 'رمز عبور باید حداقل شامل سه دسته از چهار دستهٔ حرف کوچک، حرف بزرگ، رقم و نماد باشد.',
  notNumeric: 'رمز عبور نمی‌تواند فقط از اعداد تشکیل شده باشد.',
  noSequential:
    'رمز عبور نباید شامل توالی یا تکرارِ قابل‌پیش‌بینیِ کاراکتر مانند «۱۲۳۴»، «abcd» یا «aaaa» باشد.',
  noKeyboardRow: 'رمز عبور نباید شامل دنبالهٔ صفحه‌کلید (مثل «qwer» یا «asdf») باشد.',
  noBirthYear: 'رمز عبور نباید شامل سالِ تولد (الگوی ۱۳xx) باشد.',
  noPlatformToken: 'رمز عبور نباید شامل نامِ پلتفرم یا سازمان باشد.',
  notCommon: 'این رمز عبور در فهرستِ رمزهای رایج/لو‌رفته قرار دارد.',
};

export const PASSWORD_RULE_LABELS: Record<PasswordRule, string> = {
  length: `حداقل ${PASSWORD_MIN_LENGTH} نویسه`,
  classes: 'حداقل ۳ دسته از (حروف کوچک، بزرگ، رقم، نماد)',
  notNumeric: 'فقط عدد نباشد',
  noSequential: 'بدون توالی یا تکرار (مثل ۱۲۳۴ یا aaaa)',
  noKeyboardRow: 'بدون دنباله‌ی کیبرد (مثل qwer)',
  noBirthYear: 'بدون سال تولد شمسی (۱۳xx)',
  noPlatformToken: 'بدون نام سایت یا سازمان',
  notCommon: 'رمز رایج/لو‌رفته نباشد',
};

export function analyzePassword(raw: string): PasswordAnalysis {
  const normalized = normalizeForPolicy(raw);
  const classes = characterClassCount(raw);

  const rules: Record<PasswordRule, boolean> = {
    length: raw.length >= PASSWORD_MIN_LENGTH,
    classes: classes.count >= PASSWORD_MIN_CLASSES,
    notNumeric: !/^[0-9]+$/.test(toLatinDigits(raw).replace(/\s/g, '')),
    noSequential:
      longestRepeatRun(normalized) < PASSWORD_MAX_RUN &&
      longestMonotonicRun(normalized) < PASSWORD_MAX_RUN,
    noKeyboardRow: !hasKeyboardRow(normalized),
    noBirthYear: !SOLAR_BIRTH_YEAR.test(normalized),
    noPlatformToken: !PUBLIC_PLATFORM_TOKENS.some((t) => normalized.includes(t)),
    notCommon: !MINI_COMMON_LIST.has(normalized),
  };

  const order: PasswordRule[] = [
    'length',
    'classes',
    'notNumeric',
    'noSequential',
    'noKeyboardRow',
    'noBirthYear',
    'noPlatformToken',
    'notCommon',
  ];
  const firstBad = order.find((k) => !rules[k]) ?? null;

  // نمره‌ی قدرت: حداکثر = ۴؛ قاعده‌های امنیتیِ نقض‌شده سقف را پایین می‌آورند
  let s = 0;
  if (raw.length > 0) s = 1;
  if (rules.length) s += 1;
  if (raw.length >= 14) s += 1;
  if (classes.count >= 4) s += 1;
  const securityBroken =
    !rules.noSequential ||
    !rules.noKeyboardRow ||
    !rules.noBirthYear ||
    !rules.noPlatformToken ||
    !rules.notCommon;
  if (securityBroken) s = Math.min(s, 1);
  if (!rules.classes || !rules.notNumeric) s = Math.min(s, 2);

  return {
    rules,
    acceptable: firstBad === null,
    score: Math.max(0, Math.min(4, s)) as PasswordAnalysis['score'],
    firstViolation: firstBad ? VIOLATIONS[firstBad] : null,
  };
}

/** سازگاری با مصرف‌کننده‌های موجود: آیا از صافی محلی عبور می‌کند؟ */
export function isPasswordAcceptable(raw: string): boolean {
  return analyzePassword(raw).acceptable;
}

/** توصیه‌ی کوتاه کنار متر (نمایشِ زنده بین ۰..۴) */
export const SCORE_LABELS = ['بسیار ضعیف', 'ضعیف', 'متوسط', 'قوی', 'عالی'] as const;
