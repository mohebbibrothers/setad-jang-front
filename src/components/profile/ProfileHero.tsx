'use client';

/**
 * ═══════════════════════════════════════════════════════════════════
 * ProfileHero — سربرگِ زنده‌ی حساب: عکس، نام، وضعیت‌ها و حلقه‌ی تکمیل
 *
 * نخستین چیزی که کاربرِ واردشده می‌بیند — گرادیانیِ برند با عمقِ لایه‌ای،
 * AvatarEditor برای تعویض عکس درجا، نشان‌های تأیید/نقش، «عضو از…» به
 * تاریخ جلالی، و حلقه‌ی تکمیل پروفایل (منطق: lib/profile-completion ←
 * مرجعِ فیلدها: PROFILE_R4J_REQUIRED_FIELDS در بک‌اند).
 * ═══════════════════════════════════════════════════════════════════
 */

import { BadgeCheck, Crown, Sparkles } from 'lucide-react';
import type { AuthUser, AuthProfile } from '@/lib/auth';
import { formatIdentifierForDisplay } from '@/lib/auth-identifier';
import { formatJalaliYearMonth } from '@/lib/persian-time';
import type { ProfileCompletion } from '@/lib/profile-completion';
import { formatPersianNumber } from '@/lib/utils';
import { AvatarEditor } from './AvatarEditor';
import { Badge, CompletionRing } from './account-ui';

export function ProfileHero({
  user,
  profile,
  completion,
  onAvatarError,
  onGoFields,
}: {
  user: AuthUser;
  profile: AuthProfile | null;
  completion: ProfileCompletion;
  onAvatarError?: (message: string) => void;
  /** کلیک روی چیپِ «موارد باقی‌مانده» → رفتن به فرم */
  onGoFields?: () => void;
}) {
  const name =
    user.full_name?.trim() ||
    [user.first_name, user.last_name].filter(Boolean).join(' ').trim() ||
    'کاربر بعثت';
  const identifier = user.email || profile?.phone_number || '';
  const missing = completion.items.filter((i) => !i.done);
  const memberSince = formatJalaliYearMonth(user.date_joined);

  return (
    <header className="relative overflow-hidden rounded-[28px] bg-gradient-to-l from-brand-700 via-brand-600 to-mint-600 p-5 text-white shadow-[0_30px_60px_-25px_rgba(13,128,116,.55)] sm:p-7">
      {/* عمقِ تزئینی — حلقه‌های نورِ لایه‌ای */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-16 -top-24 h-64 w-64 rounded-full bg-white/10 blur-2xl"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-mint-400/20 blur-3xl"
      />

      {/* موبایل: ستونِ وسط‌چین (آواتار بالا، نام/نشان‌ها/شناسه زیرِ هم،
          پنلِ تکمیل تمام‌عرض) — چیدمانِ قبلیِ سمت‌چسب در کادرِ سبز
          «نامرتب» می‌نمود (گزارشِ کارفرما). ≥sm همان چیدمانِ ردیفی. */}
      <div className="relative flex flex-col items-center gap-5 text-center sm:flex-row sm:items-center sm:gap-6 sm:text-right">
        <AvatarEditor
          avatar={profile?.avatar}
          fallbackText={name}
          size={92}
          onError={onAvatarError}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            {/* قاعده‌ی سراسریِ globals به h1 رنگِ تیره می‌دهد — اینجا صریحاً سفید */}
            <h1 className="text-[21px] font-extrabold text-white [text-shadow:0_1px_10px_rgba(6,60,52,.35)] sm:truncate sm:text-[24px]">
              {name}
            </h1>
            {user.role === 'admin' ? (
              <Badge tone="neutral" icon={<Crown className="h-3.5 w-3.5" />}>
                مدیر سیستم
              </Badge>
            ) : null}
            {user.is_email_verified ? (
              <span
                title="ایمیل تأیید شده"
                className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold text-white ring-1 ring-inset ring-white/25"
              >
                <BadgeCheck className="h-3.5 w-3.5" />
                تأیید شده
              </span>
            ) : null}
          </div>
          {identifier ? (
            <p
              className="mt-1 truncate text-center text-[13px] font-semibold text-white/90 sm:text-right"
              dir="ltr"
            >
              {formatIdentifierForDisplay(identifier)}
            </p>
          ) : null}
          {memberSince ? (
            <p className="mt-1.5 flex items-center justify-center gap-1 text-[11.5px] font-semibold text-white/80 sm:justify-start">
              <span aria-hidden="true" className="inline-block h-1 w-1 rounded-full bg-white/60" />
              عضو از {memberSince}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onGoFields}
          className="group flex w-full items-center justify-center gap-3 self-stretch rounded-2xl bg-white/10 p-3 pl-4 ring-1 ring-inset ring-white/20 transition-all duration-200 hover:bg-white/15 sm:w-auto sm:self-auto"
        >
          <CompletionRing percent={completion.percent} />
          <span className="text-right">
            <span className="block text-[12.5px] font-extrabold">تکمیل پروفایل</span>
            <span className="mt-0.5 block text-[11px] font-medium text-white/75">
              {missing.length === 0 ? (
                'پروفایل شما کامل است ✨'
              ) : (
                <>
                  {formatPersianNumber(missing.length)} مورد باقی مانده —{' '}
                  <span className="underline decoration-dotted underline-offset-4 transition-colors group-hover:text-white">
                    تکمیل
                  </span>
                </>
              )}
            </span>
          </span>
          {missing.length ? (
            <Sparkles className="h-4 w-4 text-white/70 transition-transform duration-300 group-hover:rotate-12 group-hover:text-white" />
          ) : null}
        </button>
      </div>
    </header>
  );
}
