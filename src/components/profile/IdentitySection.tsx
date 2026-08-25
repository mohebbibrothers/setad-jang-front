'use client';

/**
 * ═══════════════════════════════════════════════════════════════════
 * IdentitySection — ویرایش اطلاعات هویتی و پروفایل تکمیلی
 *
 * سینکِ دقیق با دو قراردادِ متوازیِ بک‌اند:
 *
 *   PATCH /auth/me/      → فقط first_name/last_name (پاسخ = UserMe کامل)
 *   PATCH /auth/profile/ → national_code, birth_date(ISO گرگوریان),
 *                          gender(male|female|''), bio, province, city,
 *                          address (پاسخ = ProfileSerializer کامل)
 *
 * اصول:
 *   • PATCHِ تدریجی (partial): فقط فیلدهای «تغییرکرده» ارسال می‌شوند —
 *     دقیقاً مطابقِ معنای partial=True در سریالایزر؛ بدون داده‌ی الاضافی
 *     (مقاوم در برابر honeypot/اعتبارسنجی‌های سخت‌گیرانه).
 *   • راستگوییِ قرارداد: birth_date در بک‌اند «فقط تنظیم» است (null در
 *     سرویس نادیده گرفته می‌شود) → UI امکان پاک‌کردن نمی‌دهد؛ فیلدهای
 *     متنی با '' پاک می‌شوند (allow_blank=True).
 *   • خطاهای سطح فیلد از envelope به ورودیِ مطابقشان می‌چسبند و خطای
 *     کلی به Alert — همان الگوی مودال احراز.
 * ═══════════════════════════════════════════════════════════════════
 */

import { useEffect, useMemo, useState } from 'react';
import { UserRoundPen } from 'lucide-react';
import { updateMe, updateProfile, type AuthUser, type AuthProfile } from '@/lib/auth';
import { applyUser, applyUserPatch } from '@/lib/use-auth';
import { firstErrorMessage } from '@/lib/api';
import { toLatinDigits } from '@/lib/auth-identifier';
import { isoToJalali, jalaliToIso, type JalaliDate } from '@/lib/jalali';
import { Segmented } from '@/components/auth/segmented';
import { Alert, Field, inputClass, SubmitButton } from '@/components/auth/ui';
import { JalaliCalendarField } from './JalaliCalendarField';
import { SectionCard, extractFieldErrors } from './account-ui';
import { mapProfileCompletionHint } from './completion-hint';

type Gender = '' | 'male' | 'female';

interface Drafts {
  first_name: string;
  last_name: string;
  national_code: string;
  gender: Gender;
  birth: JalaliDate | null;
  province: string;
  city: string;
  address: string;
  bio: string;
}

export function IdentitySection({
  user,
  profile,
}: {
  user: AuthUser;
  profile: AuthProfile | null;
}) {
  const baseline = useMemo<Drafts>(
    () => ({
      first_name: user.first_name ?? '',
      last_name: user.last_name ?? '',
      national_code: profile?.national_code ?? '',
      gender: (profile?.gender as Gender) || '',
      birth: isoToJalali(profile?.birth_date),
      province: profile?.province ?? '',
      city: profile?.city ?? '',
      address: profile?.address ?? '',
      bio: profile?.bio ?? '',
    }),
    [user.first_name, user.last_name, profile],
  );

  const [drafts, setDrafts] = useState<Drafts>(baseline);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // با رسیدنِ داده‌ی تازه از سرور (بعدِ ذخیره)، قالب‌ها تازه شوند
  useEffect(() => {
    setDrafts(baseline);
  }, [baseline]);

  const set = <K extends keyof Drafts>(key: K, value: Drafts[K]) => {
    setDrafts((d) => ({ ...d, [key]: value }));
    setFieldErrors((e) => {
      if (!e[key]) return e;
      const next = { ...e };
      delete next[key];
      return next;
    });
    setNotice(null);
  };

  const dirty = JSON.stringify(drafts) !== JSON.stringify(baseline);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (busy || !dirty) return;

    // ── اعتبارسنجیِ کلاینت (هم‌راستا با قواعدِ بک‌اند: ≤۱۰ کاراکتر) ──
    const nc = toLatinDigits(drafts.national_code.trim());
    if (nc !== '' && !/^\d{10}$/.test(nc)) {
      setFieldErrors({ national_code: 'کد ملی باید دقیقاً ۱۰ رقم باشد.' });
      setFormError(null);
      setNotice(null);
      return;
    }

    const mePatch: Record<string, string> = {};
    if (drafts.first_name.trim() !== baseline.first_name)
      mePatch.first_name = drafts.first_name.trim();
    if (drafts.last_name.trim() !== baseline.last_name) mePatch.last_name = drafts.last_name.trim();

    const profilePatch: Record<string, string> = {};
    if (nc !== toLatinDigits(baseline.national_code)) profilePatch.national_code = nc;
    if (drafts.gender !== baseline.gender) profilePatch.gender = drafts.gender;
    const birthIsoBaseline = baseline.birth ? jalaliToIso(baseline.birth) : null;
    const birthIsoDraft = drafts.birth ? jalaliToIso(drafts.birth) : null;
    if (birthIsoDraft && birthIsoDraft !== birthIsoBaseline)
      profilePatch.birth_date = birthIsoDraft;
    if (drafts.province.trim() !== baseline.province)
      profilePatch.province = drafts.province.trim();
    if (drafts.city.trim() !== baseline.city) profilePatch.city = drafts.city.trim();
    if (drafts.address.trim() !== baseline.address) profilePatch.address = drafts.address.trim();
    if (drafts.bio.trim() !== baseline.bio) profilePatch.bio = drafts.bio.trim();

    setBusy(true);
    setFormError(null);
    setFieldErrors({});
    setNotice(null);
    try {
      // ترتیب مهم نیست — دو منبعِ مستقل‌اند؛ هر دو پاسخِ کامل می‌دهند.
      if (Object.keys(mePatch).length) {
        const freshUser = await updateMe(mePatch);
        applyUser(freshUser);
      }
      if (Object.keys(profilePatch).length) {
        const freshProfile = await updateProfile(profilePatch);
        applyUserPatch({ profile: freshProfile });
      }
      setNotice('اطلاعات شما با موفقیت به‌روزرسانی شد.');
    } catch (err) {
      const fe = extractFieldErrors(err);
      if (Object.keys(fe).length) setFieldErrors(fe);
      setFormError(firstErrorMessage(err) ?? 'به‌روزرسانی انجام نشد. دوباره تلاش کنید.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SectionCard
      icon={<UserRoundPen className="h-[18px] w-[18px]" />}
      title="اطلاعات هویتی و تکمیلی"
      description="نام، مشخصات فردی و نشانی — هر چه کامل‌تر، حساب معتبرتر. فقط فیلدهای تغییرکرده برای سرور ارسال می‌شوند."
    >
      <form onSubmit={submit} noValidate className="space-y-5">
        {notice ? <Alert kind="success">{notice}</Alert> : null}
        {formError ? <Alert kind="error">{formError}</Alert> : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="acc-first-name" label="نام" error={fieldErrors.first_name ?? null}>
            <input
              id="acc-first-name"
              value={drafts.first_name}
              maxLength={100}
              disabled={busy}
              onChange={(e) => set('first_name', e.target.value)}
              placeholder="علی"
              className={inputClass(Boolean(fieldErrors.first_name))}
            />
          </Field>
          <Field id="acc-last-name" label="نام خانوادگی" error={fieldErrors.last_name ?? null}>
            <input
              id="acc-last-name"
              value={drafts.last_name}
              maxLength={100}
              disabled={busy}
              onChange={(e) => set('last_name', e.target.value)}
              placeholder="رضایی"
              className={inputClass(Boolean(fieldErrors.last_name))}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="acc-national-code" label="کد ملی" error={fieldErrors.national_code ?? null}>
            <input
              id="acc-national-code"
              value={drafts.national_code}
              inputMode="numeric"
              dir="ltr"
              maxLength={10}
              disabled={busy}
              onChange={(e) =>
                set('national_code', toLatinDigits(e.target.value).replace(/\D/g, ''))
              }
              placeholder="۰۰۱۲۳۴۵۶۷۸"
              className={`${inputClass(Boolean(fieldErrors.national_code))} text-left tabular-nums`}
            />
          </Field>

          <div className="space-y-1.5">
            <span className="block text-[13px] font-bold text-ink-900">جنسیت</span>
            <Segmented<Gender>
              ariaLabel="جنسیت"
              value={drafts.gender}
              onChange={(g) => set('gender', g)}
              indicatorTestId="acc-gender-indicator"
              buttonClassName="h-11 rounded-lg text-[12.5px] font-bold transition-[color,transform] duration-150 active:scale-[0.97]"
              activeButtonClassName="text-brand-700"
              inactiveButtonClassName="text-ink-500 hover:text-ink-700"
              options={[
                { value: '', label: 'نامشخص' },
                { value: 'male', label: 'مرد' },
                { value: 'female', label: 'زن' },
              ]}
            />
            {fieldErrors.gender ? (
              <p role="alert" className="text-[12px] font-medium leading-5 text-rose-600">
                {fieldErrors.gender}
              </p>
            ) : null}
          </div>
        </div>

        <JalaliCalendarField
          id="acc-birth-date"
          label="تاریخ تولد"
          value={drafts.birth}
          disabled={busy}
          onChange={(v) => set('birth', v)}
          error={fieldErrors.birth_date ?? null}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="acc-province" label="استان" error={fieldErrors.province ?? null}>
            <input
              id="acc-province"
              value={drafts.province}
              maxLength={100}
              disabled={busy}
              onChange={(e) => set('province', e.target.value)}
              placeholder="تهران"
              className={inputClass(Boolean(fieldErrors.province))}
            />
          </Field>
          <Field id="acc-city" label="شهر" error={fieldErrors.city ?? null}>
            <input
              id="acc-city"
              value={drafts.city}
              maxLength={100}
              disabled={busy}
              onChange={(e) => set('city', e.target.value)}
              placeholder="تهران"
              className={inputClass(Boolean(fieldErrors.city))}
            />
          </Field>
        </div>

        <Field id="acc-address" label="آدرس" error={fieldErrors.address ?? null}>
          <textarea
            id="acc-address"
            value={drafts.address}
            rows={2}
            disabled={busy}
            onChange={(e) => set('address', e.target.value)}
            placeholder="نشانی کامل پستی"
            className={`${inputClass(Boolean(fieldErrors.address))} h-auto min-h-[60px] resize-y py-3 leading-7`}
          />
        </Field>

        <Field id="acc-bio" label="درباره من" error={fieldErrors.bio ?? null}>
          <textarea
            id="acc-bio"
            value={drafts.bio}
            rows={3}
            disabled={busy}
            onChange={(e) => set('bio', e.target.value)}
            placeholder="چند جمله درباره‌ی خودتان — دیدگاه، مهارت، انگیزه‌ی همراهی…"
            className={`${inputClass(Boolean(fieldErrors.bio))} h-auto min-h-[84px] resize-y py-3 leading-7`}
          />
        </Field>

        {mapProfileCompletionHint(drafts, baseline) ? (
          <p className="text-[12px] font-medium text-brand-700">
            {mapProfileCompletionHint(drafts, baseline)}
          </p>
        ) : null}

        <div className="flex items-center gap-3">
          <SubmitButton loading={busy} disabled={!dirty} className="max-w-[220px]">
            ذخیره تغییرات
          </SubmitButton>
          {dirty && !busy ? (
            <button
              type="button"
              onClick={() => {
                setDrafts(baseline);
                setFieldErrors({});
                setFormError(null);
                setNotice(null);
              }}
              className="text-[12.5px] font-bold text-ink-500 transition-colors hover:text-ink-800"
            >
              بازگردانی
            </button>
          ) : null}
        </div>
      </form>
    </SectionCard>
  );
}
