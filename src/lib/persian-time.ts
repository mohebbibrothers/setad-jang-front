/**
 * ───────────────────────────────────────────────────────────────────────────
 * persian-time — نمایشِ زمانیِ فارسی روی داده‌های ISOِ بک‌اند
 *
 *   formatJalaliDate('2024-05-03T…')  → «۱۴ اردیبهشت ۱۴۰۳»
 *   formatJalaliDateTime(…)           → «۱۴ اردیبهشت ۱۴۰۳، ۲۱:۴۵»
 *   formatRelativeFa(iso, now)        → «هم‌اکنون» / «۵ دقیقه پیش» /
 *                                       «۳ ساعت پیش» / «۲ روز پیش» /
 *                                       «۳ هفته پیش» / تاریخ جلالی (قدیمی‌تر)
 *
 * همه‌ی خروجی‌ها با ارقام فارسی و ماه‌های جلالی‌اند — لایه‌ی نمایش تنها
 * جایی است که زمانِ خامِ سرور (UTC/گرگوریان) معنا پیدا می‌کند.
 * منطق خالص و بدون سایدافکت — تست با ساعتِ منجمد.
 * ───────────────────────────────────────────────────────────────────────────
 */

import { JALALI_MONTH_NAMES, toJalali, type JalaliDate } from './jalali';
import { formatPersianNumber, toPersianDigits } from './utils';

function parseDate(input: string | number | Date | null | undefined): Date | null {
  if (input === null || input === undefined || input === '') return null;
  const d = input instanceof Date ? input : new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}

function jalaliOf(d: Date): JalaliDate {
  return toJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

/**
 * سالِ جلالی با ارقام فارسی — «۱۴۰۳».
 * عمداً بدون جداکننده‌ی هزارگان (formatPersianNumber خروجیِ «۱٬۴۰۳» می‌دهد
 * که برای «سال» نادرست است).
 */
export function formatJalaliYear(jy: number): string {
  return toPersianDigits(String(jy));
}

/** «۱۴ اردیبهشت ۱۴۰۳» — ورودی ISO (محلی/UTC هر دو؛ نمایش به‌تقویم محلی دستگاه) */
export function formatJalaliDate(input: string | number | Date | null | undefined): string {
  const d = parseDate(input);
  if (!d) return '';
  const j = jalaliOf(d);
  return `${formatPersianNumber(j.jd)} ${JALALI_MONTH_NAMES[j.jm - 1]} ${formatJalaliYear(j.jy)}`;
}

/** «اردیبهشت ۱۴۰۳» — برای «عضو از …» */
export function formatJalaliYearMonth(input: string | number | Date | null | undefined): string {
  const d = parseDate(input);
  if (!d) return '';
  const j = jalaliOf(d);
  return `${JALALI_MONTH_NAMES[j.jm - 1]} ${formatJalaliYear(j.jy)}`;
}

/** «۱۴ اردیبهشت ۱۴۰۳، ۲۱:۴۵» */
export function formatJalaliDateTime(input: string | number | Date | null | undefined): string {
  const d = parseDate(input);
  if (!d) return '';
  const date = formatJalaliDate(d);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${date}، ${toPersianDigits(`${hh}:${mm}`)}`;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

/**
 * زمان نسبیِ فارسی — برای «آخرین فعالیت نشست» و امثال آن.
 * قاعده: گذشته → «… پیش»؛ آینده (انقضا) → «… مانده».
 */
export function formatRelativeFa(
  input: string | number | Date | null | undefined,
  now: number = Date.now(),
): string {
  const d = parseDate(input);
  if (!d) return '';
  const diff = d.getTime() - now;
  const abs = Math.abs(diff);
  const future = diff > 45_000;
  const suffix = future ? 'مانده' : 'پیش';

  if (abs < 45_000) return 'هم‌اکنون';
  if (abs < HOUR)
    return `${formatPersianNumber(Math.max(1, Math.round(abs / MINUTE)))} دقیقه ${suffix}`;
  if (abs < DAY) return `${formatPersianNumber(Math.round(abs / HOUR))} ساعت ${suffix}`;
  if (abs < WEEK) return `${formatPersianNumber(Math.round(abs / DAY))} روز ${suffix}`;
  if (abs < 30 * DAY) return `${formatPersianNumber(Math.round(abs / WEEK))} هفته ${suffix}`;
  // قدیمی‌تر/دورتر: خودِ تاریخ شفاف‌تر است
  return formatJalaliDate(d);
}
