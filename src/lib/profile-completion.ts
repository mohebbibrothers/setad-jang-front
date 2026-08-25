/**
 * ───────────────────────────────────────────────────────────────────────────
 * profile-completion — درصد تکمیل پروفایل (منطق خالص، آینه‌ی بک‌اند)
 *
 * مبنای فیلدها: PROFILE_R4J_REQUIRED_FIELDS در apps/authentication/models.py
 * (کد ملی، تاریخ تولد، جنسیت، استان، شهر، آدرس) + چهار فیلد هویتیِ بصری
 * (نام، نام‌خانوادگی، عکس پروفایل، درباره من) که «پروفایلِ زنده» را کامل
 * می‌کنند. خروجی برای حلقه‌ی تکمیل در هیرو و چیپ‌های «موارد باقی‌مانده»
 * مصرف می‌شود — هر مورد به فیلدِ فرمِ مشخصی لینک است.
 * ───────────────────────────────────────────────────────────────────────────
 */

import type { AuthUser, AuthProfile } from './auth';

export type CompletionFieldKey =
  | 'first_name'
  | 'last_name'
  | 'avatar'
  | 'national_code'
  | 'birth_date'
  | 'gender'
  | 'province'
  | 'city'
  | 'address'
  | 'bio';

export interface CompletionItem {
  key: CompletionFieldKey;
  label: string;
  done: boolean;
}

export interface ProfileCompletion {
  /** ۰ تا ۱۰۰ (گردشده) */
  percent: number;
  done: number;
  total: number;
  items: CompletionItem[];
}

/** لیست ترتیبیِ فیلدها — برچسب‌ها یکجا تا همه‌ی UI از یک منبع تغذیه شود */
export const COMPLETION_FIELDS: ReadonlyArray<{ key: CompletionFieldKey; label: string }> = [
  { key: 'first_name', label: 'نام' },
  { key: 'last_name', label: 'نام خانوادگی' },
  { key: 'avatar', label: 'عکس پروفایل' },
  { key: 'national_code', label: 'کد ملی' },
  { key: 'birth_date', label: 'تاریخ تولد' },
  { key: 'gender', label: 'جنسیت' },
  { key: 'province', label: 'استان' },
  { key: 'city', label: 'شهر' },
  { key: 'address', label: 'آدرس' },
  { key: 'bio', label: 'درباره من' },
] as const;

const present = (v: unknown): boolean => typeof v === 'string' && v.trim() !== '';

export function computeProfileCompletion(
  user: AuthUser | null,
  profile: AuthProfile | null,
): ProfileCompletion {
  const p = profile ?? user?.profile ?? null;
  const values: Record<CompletionFieldKey, unknown> = {
    first_name: user?.first_name,
    last_name: user?.last_name,
    avatar: p?.avatar,
    national_code: p?.national_code,
    birth_date: p?.birth_date,
    gender: p?.gender,
    province: p?.province,
    city: p?.city,
    address: p?.address,
    bio: p?.bio,
  };

  const items: CompletionItem[] = COMPLETION_FIELDS.map((f) => ({
    key: f.key,
    label: f.label,
    done: present(values[f.key]),
  }));

  const done = items.filter((i) => i.done).length;
  const total = items.length;
  return {
    percent: total === 0 ? 100 : Math.round((done / total) * 100),
    done,
    total,
    items,
  };
}
