/**
 * ───────────────────────────────────────────────────────────────────────────
 * jalali — تبدیل دقیقِ دوطرفه‌ی تقویم جلالی ↔ گرگوریان
 *
 * چرا از نو؟ بک‌اند تاریخ تولد را به‌صورت ISOِ گرگوریان (DateField جنگو)
 * نگه می‌دارد، ولی کاربر فارسی‌زبان به‌صورت شمسی فکر می‌کند. لایه‌ی نمایش
 * باید صفرخطا تبدیل کند؛ پس الگوریتم مرجعِ صنعت (jalaali — بهرنگ نوروزی‌نیا،
 * الگوریتمِ رایجِ public-domain با جدول سال‌های کبیسه) با قرارداد مینیمال
 * پیاده شده است. پوشش صحت: لنگرهای قطعی + رفت‌وبرگشتِ کاملِ ~۱۷هزار روز.
 *
 * قرارداد:
 *   toJalali(2024, 3, 20)      → { jy: 1403, jm: 1, jd: 1 }
 *   fromJalali(1403, 1, 1)     → { gy: 2024, gm: 3, gd: 20 }
 *   isoToJalali('2000-05-04')  → جلالی | null (ورودی نامعتبر)
 *   jalaliToIso({…})           → 'YYYY-MM-DD' (گرگوریان — سینک با بک‌اند)
 * ───────────────────────────────────────────────────────────────────────────
 */

export interface JalaliDate {
  jy: number;
  jm: number;
  jd: number;
}

export interface GregorianDate {
  gy: number;
  gm: number;
  gd: number;
}

/** نام ماه‌های جلالی — منبعِ واحد برای همه‌ی UI */
export const JALALI_MONTH_NAMES: readonly string[] = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
] as const;

const div = (a: number, b: number): number => ~~(a / b);
const mod = (a: number, b: number): number => a - ~~(a / b) * b;

/** سال‌های کبیسه‌شکن الگوریتم مرجع */
const JALALI_BREAKS = [
  -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394,
  2456, 3178,
] as const;

export const MIN_JALALI_YEAR = JALALI_BREAKS[0] + 1;
export const MAX_JALALI_YEAR = JALALI_BREAKS[JALALI_BREAKS.length - 1];

function jalCal(jy: number): { leap: number; gy: number; march: number } {
  const breaks = JALALI_BREAKS;
  const bl = breaks.length;
  const gy = jy + 621;
  let leapJ = -14;
  let jp: number = breaks[0];
  let jump = 0;

  if (jy < jp || jy >= breaks[bl - 1]) {
    throw new Error(`سال جلالی خارج از بازه‌ی پشتیبانی است: ${jy}`);
  }

  for (let i = 1; i < bl; i += 1) {
    const jm = breaks[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }

  let n = jy - jp;
  leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;

  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;

  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
  let leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;

  return { leap, gy, march };
}

/** روز ژولینی از تاریخ گرگوریان */
function g2d(gy: number, gm: number, gd: number): number {
  let d =
    div((gy + div(gm - 8, 6) + 100100) * 1461, 4) +
    div(153 * mod(gm + 9, 12) + 2, 5) +
    gd -
    34840408;
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
}

/** تاریخ گرگوریان از روز ژولینی */
function d2g(jdn: number): GregorianDate {
  let j = 4 * jdn + 139361631;
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(mod(j, 1461), 4) * 5 + 308;
  const gd = div(mod(i, 153), 5) + 1;
  const gm = mod(div(i, 153), 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
}

/** روز ژولینی از تاریخ جلالی */
function j2d(jy: number, jm: number, jd: number): number {
  const r = jalCal(jy);
  return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
}

/** تاریخ جلالی از روز ژولینی */
function d2j(jdn: number): JalaliDate {
  const gy = d2g(jdn).gy;
  let jy = gy - 621;
  const r = jalCal(jy);
  const jdn1f = g2d(gy, 3, r.march);
  let k = jdn - jdn1f;

  if (k >= 0) {
    if (k <= 185) {
      return { jy, jm: 1 + div(k, 31), jd: mod(k, 31) + 1 };
    }
    k -= 186;
  } else {
    jy -= 1;
    k += 179;
    if (r.leap === 1) k += 1;
  }

  return { jy, jm: 7 + div(k, 30), jd: mod(k, 30) + 1 };
}

/* ── API عمومی ──────────────────────────────────────────────────────────── */

export function toJalali(gy: number, gm: number, gd: number): JalaliDate {
  return d2j(g2d(gy, gm, gd));
}

export function fromJalali(jy: number, jm: number, jd: number): GregorianDate {
  return d2g(j2d(jy, jm, jd));
}

export function isLeapJalaliYear(jy: number): boolean {
  return jalCal(jy).leap === 0;
}

/** طول ماه جلالی — شش‌ماه‌یِ نخست ۳۱، پنج‌ماه‌یِ بعد ۳۰، اسفند ۲۹/۳۰ */
export function jalaliMonthLength(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isLeapJalaliYear(jy) ? 30 : 29;
}

export function isValidJalaliDate(jy: number, jm: number, jd: number): boolean {
  if (jy < MIN_JALALI_YEAR || jy >= MAX_JALALI_YEAR) return false;
  if (jm < 1 || jm > 12) return false;
  if (jd < 1) return false;
  return jd <= jalaliMonthLength(jy, jm);
}

/** 'YYYY-MM-DD' (گرگوریان، قراردادِ DateField جنگو) → جلالی */
export function isoToJalali(iso: string | null | undefined): JalaliDate | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso.trim());
  if (!m) return null;
  const gy = Number(m[1]);
  const gm = Number(m[2]);
  const gd = Number(m[3]);
  if (gm < 1 || gm > 12 || gd < 1 || gd > 31) return null;
  return toJalali(gy, gm, gd);
}

/** جلالی → 'YYYY-MM-DD' (گرگوریان — دقیقاً همان چیزی که بک‌اند می‌خواهد) */
export function jalaliToIso(j: JalaliDate): string {
  const { gy, gm, gd } = fromJalali(j.jy, j.jm, j.jd);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${gy}-${pad(gm)}-${pad(gd)}`;
}

/** تاریخ امروز به جلالی */
export function todayJalali(now: Date = new Date()): JalaliDate {
  return toJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
}
