/**
 * completion-hint — اشاره‌ی زنده‌ی «تغییرِ تکمیل پروفایل» هنگام ویرایش.
 *
 * منطق خالص: با مقایسه‌ی پیش‌نویسِ فرم و مبنا، تعداد فیلدهایی را که با
 * ذخیره‌ی همین تغییرات «تکمیل» می‌شوند می‌گوید — کاربر قبل از زدنِ
 * ذخیره می‌فهمد چه چیزی به حسابش اضافه می‌شود (ریشه: COMPLETION_FIELDS).
 */

import { formatPersianNumber } from '@/lib/utils';

interface IdentityDraftLike {
  first_name: string;
  last_name: string;
  national_code: string;
  gender: string;
  birth: { jy: number } | null;
  province: string;
  city: string;
  address: string;
  bio: string;
}

const filled = (v: string | null | undefined): boolean => Boolean(v && v.trim() !== '');

/**
 * اگر ذخیره‌ی پیش‌نویس حداقل یک موردِ تازه کامل کند، جمله‌ی راهنما —
 * وگرنه null (چیزی گفته نشود تا UI تمیز بماند).
 */
export function mapProfileCompletionHint(
  draft: IdentityDraftLike,
  baseline: IdentityDraftLike,
): string | null {
  const pairs: Array<[string | null | undefined, string | null | undefined]> = [
    [draft.first_name, baseline.first_name],
    [draft.last_name, baseline.last_name],
    [draft.national_code, baseline.national_code],
    [draft.gender, baseline.gender],
    [draft.birth ? '1' : '', baseline.birth ? '1' : ''],
    [draft.province, baseline.province],
    [draft.city, baseline.city],
    [draft.address, baseline.address],
    [draft.bio, baseline.bio],
  ];
  let completing = 0;
  for (const [next, prev] of pairs) {
    if (filled(next) && !filled(prev)) completing += 1;
  }
  if (completing === 0) return null;
  return `با ذخیره‌ی این تغییرات، ${formatPersianNumber(completing)} مورد به تکمیل پروفایلتان اضافه می‌شود.`;
}
