'use client';

/**
 * ═══════════════════════════════════════════════════════════════════
 * IdentifiersSection — شناسه‌های ورود (ایمیل | موبایل)
 *
 * منبع حقیقت = پیلودِ UserMeSerializer بک‌اند (سینکِ دوسویه):
 *   user.identifiers = [{kind, value, is_primary, is_verified}] — لیست
 *   کانال‌های «متصل»، با نشانِ «اصل‌یه» و وضعیتِ تأیید هر کانال. این
 *   یعنی هیچ «علمِ جلسه‌ای» (session knowledge) در کار نیست: پرچمِ
 *   تأییدِ موبایل و شناسه‌ی اصلی از خودِ سرور می‌آیند و پس از رفرش
 *   مرورگر هم گم نمی‌شوند.
 *
 * چرخهٔ سینک: identifiersAddVerify / identifierMakePrimary هر دو
 * UserMeSerializerِ کامل برمی‌گردانند → applyUser(freshUser) نوپایِ
 * سراسری را یک‌جا نو می‌کند → همین سکشن بدون هیچ حدسی دوباره رندر و
 * نشان‌ها/کارت‌ها از نو سنجیده می‌شوند.
 *
 * flowها (Phase H.2):
 *   POST /auth/identifiers/add/request/ {identifier}      → کد ۶رقمی
 *   POST /auth/identifiers/add/verify/  {identifier,code} → کاربرِ نو
 *   POST /auth/identifiers/make-primary/{identifier_kind} → کاربرِ نو
 *
 * سیاست امنیتی بک‌اند که همین‌جا به کاربر شفاف‌سازی می‌شود: جایگزینیِ
 * یک شناسه‌ی موجود در همان کانال پشتیبانی نمی‌شود؛ فقط «اتصالِ شناسه‌ی
 * غایب» یا «تأییدِ مجددِ همانِ متصل‌یِ تأییدنشده».
 * ═══════════════════════════════════════════════════════════════════
 */

import { useEffect, useRef, useState } from 'react';
import { BadgeCheck, Crown, Mail, ShieldQuestion, Smartphone, TriangleAlert } from 'lucide-react';
import {
  identifierAddRequest,
  identifierAddVerify,
  identifierMakePrimary,
  type AuthIdentifier,
  type AuthUser,
  type IdentifierKind,
} from '@/lib/auth';
import { applyUser } from '@/lib/use-auth';
import { coerceAuthError, type AuthErrorModel } from '@/lib/auth-errors';
import {
  detectIdentifierKind,
  formatIdentifierForDisplay,
  prepareIdentifierForSubmit,
  validateIdentifier,
} from '@/lib/auth-identifier';
import {
  isOtpComplete,
  OTP_CODE_LENGTH_FA,
  OTP_RESEND_COOLDOWN_SECONDS,
  formatCountdown,
} from '@/lib/otp';
import { Alert, AuthErrorBox, SubmitButton } from '@/components/auth/ui';
import { IdentifierField } from '@/components/auth/IdentifierField';
import { OtpInput } from '@/components/auth/OtpInput';
import { SectionCard, Badge, GhostButton } from './account-ui';
import { cn } from '@/lib/utils';

type Step = 'idle' | 'input' | 'code';

const KIND_META: Record<
  IdentifierKind,
  { title: string; icon: React.ReactNode; addLabel: string }
> = {
  email: { title: 'ایمیل', icon: <Mail className="h-[18px] w-[18px]" />, addLabel: 'افزودن ایمیل' },
  phone: {
    title: 'شماره موبایل',
    icon: <Smartphone className="h-[18px] w-[18px]" />,
    addLabel: 'افزودن شماره موبایل',
  },
};

/** دو کانال بصورت پایدار: ایمیل اول، موبایل دوم — آینه‌ی نظم بک‌اند. */
const KIND_ORDER: IdentifierKind[] = ['email', 'phone'];

export function IdentifiersSection({ user }: { user: AuthUser }) {
  const byKind = new Map<IdentifierKind, AuthIdentifier>(
    (user.identifiers ?? []).map((item) => [item.kind, item]),
  );

  const [activeKind, setActiveKind] = useState<IdentifierKind | null>(null);
  const [step, setStep] = useState<Step>('idle');
  const [identifier, setIdentifier] = useState('');
  const [lockedInput, setLockedInput] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AuthErrorModel | null>(null);
  const [identifierError, setIdentifierError] = useState<string | null>(null);
  const [codeInvalid, setCodeInvalid] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [, forceTick] = useState(0);
  const tickRef = useRef<number | null>(null);

  // تیکِ ثانیه‌ای برای شمارشِ معکوسِ ارسالِ مجدد
  useEffect(() => {
    if (cooldownUntil <= Date.now()) return;
    tickRef.current = window.setInterval(() => forceTick((n) => n + 1), 1000);
    return () => {
      if (tickRef.current !== null) window.clearInterval(tickRef.current);
      tickRef.current = null;
    };
  }, [cooldownUntil]);

  const cooldownLeft = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));

  const resetFlow = () => {
    setActiveKind(null);
    setStep('idle');
    setIdentifier('');
    setLockedInput(false);
    setCode('');
    setCodeInvalid(false);
    setError(null);
    setIdentifierError(null);
  };

  const startFlow = (kind: IdentifierKind, preset: string | null) => {
    setNotice(null);
    setError(null);
    setIdentifierError(null);
    setCode('');
    setCodeInvalid(false);
    setActiveKind(kind);
    setIdentifier(preset ?? '');
    setLockedInput(Boolean(preset));
    setStep('input');
  };

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (busy) return;
    const validationError = validateIdentifier(identifier);
    if (validationError) {
      setIdentifierError(validationError);
      return;
    }
    const kind = activeKind ?? 'email'; // flow فقط با activeKind تعریف‌شده باز است
    if (detectIdentifierKind(identifier) !== kind) {
      const other = kind === 'email' ? 'phone' : 'email';
      setIdentifierError(
        `این مقدار از نوع ${KIND_META[other].title} است، نه ${KIND_META[kind].title}.`,
      );
      return;
    }
    setBusy(true);
    setError(null);
    setIdentifierError(null);
    try {
      await identifierAddRequest(prepareIdentifierForSubmit(identifier));
      setCooldownUntil(Date.now() + OTP_RESEND_COOLDOWN_SECONDS * 1000);
      setStep('code');
      setCode('');
    } catch (err) {
      const model = coerceAuthError(err);
      if (model.message.includes('قبلاً') && model.message.includes('تأیید')) {
        setNotice(model.message);
        resetFlow();
      } else {
        setError(model);
        if (model.fieldErrors.identifier) setIdentifierError(model.fieldErrors.identifier);
      }
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (busy || cooldownLeft > 0) return;
    setBusy(true);
    setError(null);
    try {
      await identifierAddRequest(prepareIdentifierForSubmit(identifier));
      setCooldownUntil(Date.now() + OTP_RESEND_COOLDOWN_SECONDS * 1000);
      setCode('');
    } catch (err) {
      setError(coerceAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const verify = async (finalCode: string) => {
    if (busy || !isOtpComplete(finalCode)) return;
    setBusy(true);
    setError(null);
    setCodeInvalid(false);
    try {
      const freshUser = await identifierAddVerify({
        identifier: prepareIdentifierForSubmit(identifier),
        code: finalCode,
      });
      applyUser(freshUser); // پاسخ = UserMe کامل با identifiers نو → سینک سراسری
      setNotice('شناسه با موفقیت به حساب شما متصل و تأیید شد.');
      resetFlow();
    } catch (err) {
      setError(coerceAuthError(err));
      setCodeInvalid(true);
      setCode('');
    } finally {
      setBusy(false);
    }
  };

  const makePrimary = async (kind: IdentifierKind) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const freshUser = await identifierMakePrimary(kind);
      applyUser(freshUser);
      setNotice('شناسه‌ی اصلی حساب با موفقیت تغییر کرد.');
    } catch (err) {
      setError(coerceAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SectionCard
      icon={<ShieldQuestion className="h-[18px] w-[18px]" />}
      title="شناسه‌های ورود"
      description="با هر کدام از این شناسه‌ها می‌توانید وارد شوید یا رمز را بازیابی کنید. اتصال شناسه‌ی جدید فقط با کد تأیید انجام می‌شود."
    >
      <div className="space-y-3">
        {notice ? <Alert kind="success">{notice}</Alert> : null}
        {error && step === 'idle' ? <AuthErrorBox model={error} /> : null}

        {KIND_ORDER.map((kind) => {
          const meta = KIND_META[kind];
          const attached = byKind.get(kind) ?? null;
          const flowOpen = activeKind === kind && step !== 'idle';
          return (
            <div
              key={kind}
              className={cn(
                'rounded-2xl border bg-white p-4 transition-shadow duration-200 hover:shadow-[0_10px_26px_-16px_rgba(15,20,32,.22)]',
                attached?.is_primary ? 'border-[#f3dfa8]' : 'border-ink-100',
              )}
            >
              <div className="flex flex-wrap items-center gap-3">
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                    attached?.is_verified
                      ? 'bg-mint-500/10 text-brand-600'
                      : 'bg-brand-50 text-brand-600',
                  )}
                >
                  {meta.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[13.5px] font-extrabold text-ink-900">{meta.title}</h3>
                    {attached?.is_primary ? (
                      <Badge tone="gold" icon={<Crown className="h-3.5 w-3.5" />}>
                        شناسه اصلی
                      </Badge>
                    ) : null}
                    {attached?.is_verified ? (
                      <Badge tone="ok" icon={<BadgeCheck className="h-3.5 w-3.5" />}>
                        تأیید شده
                      </Badge>
                    ) : null}
                    {attached && !attached.is_verified ? (
                      <Badge tone="warn" icon={<TriangleAlert className="h-3.5 w-3.5" />}>
                        تأیید نشده
                      </Badge>
                    ) : null}
                  </div>
                  <p
                    className="mt-0.5 truncate text-[12.5px] font-medium text-ink-500"
                    dir="ltr"
                    style={{ textAlign: 'right' }}
                  >
                    {attached ? formatIdentifierForDisplay(attached.value) : 'متصل نشده'}
                  </p>
                </div>

                {/* روی گوشی، کنش‌ها به خطِ تمام‌عرضِ خودشان می‌روند تا
                    کنارِ عنوان/شناسه له نشوند (ریسپانسیوِ ردیف‌ها). */}
                <div className="flex flex-wrap items-center gap-2 max-sm:basis-full max-sm:justify-end">
                  {!attached && !flowOpen ? (
                    <GhostButton onClick={() => startFlow(kind, null)} disabled={busy}>
                      {meta.addLabel}
                    </GhostButton>
                  ) : null}
                  {attached && !attached.is_verified && !flowOpen ? (
                    <GhostButton onClick={() => startFlow(kind, attached.value)} disabled={busy}>
                      تأیید {meta.title}
                    </GhostButton>
                  ) : null}
                  {attached && attached.is_verified && !attached.is_primary ? (
                    <button
                      type="button"
                      onClick={() => makePrimary(kind)}
                      disabled={busy}
                      title="این شناسه، روش پیش‌فرض ورود و بازیابی حساب می‌شود"
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11.5px] font-bold text-[#9a6b00] transition-colors hover:bg-[#fff7e0] disabled:opacity-60"
                    >
                      <Crown className="h-3.5 w-3.5" />
                      تنظیم به‌عنوان شناسه‌ی اصلی
                    </button>
                  ) : null}
                </div>
              </div>

              {flowOpen ? (
                <div className="mt-4 rounded-xl bg-ink-50/60 p-4">
                  {error ? (
                    <div className="mb-3">
                      <AuthErrorBox model={error} />
                    </div>
                  ) : null}

                  {step === 'input' ? (
                    <form onSubmit={send} noValidate className="space-y-4">
                      {lockedInput ? (
                        <div>
                          <span className="mb-1.5 block text-[13px] font-bold text-ink-900">
                            {meta.title}
                          </span>
                          <div
                            className="flex h-12 items-center rounded-xl border border-ink-200 bg-white px-3.5 text-left text-[14px] font-bold text-ink-800"
                            dir="ltr"
                          >
                            {formatIdentifierForDisplay(identifier)}
                          </div>
                          <p className="mt-1.5 text-[12px] leading-5 text-ink-500">
                            کد تأیید برای همین {meta.title.toLowerCase()} ارسال می‌شود.
                          </p>
                        </div>
                      ) : (
                        <IdentifierField
                          id={`identifier-add-${kind}`}
                          value={identifier}
                          onChange={(v) => {
                            setIdentifier(v);
                            setIdentifierError(null);
                            setError(null);
                          }}
                          error={identifierError}
                          disabled={busy}
                          label={meta.title}
                        />
                      )}
                      <div className="flex items-center gap-3">
                        <SubmitButton loading={busy} className="max-w-[190px]">
                          ارسال کد تأیید
                        </SubmitButton>
                        <button
                          type="button"
                          onClick={resetFlow}
                          className="text-[12.5px] font-bold text-ink-500 transition-colors hover:text-ink-800"
                        >
                          انصراف
                        </button>
                      </div>
                    </form>
                  ) : null}

                  {step === 'code' ? (
                    <div className="space-y-4">
                      <p className="text-center text-[12.5px] leading-6 text-ink-600">
                        کد {OTP_CODE_LENGTH_FA} به{' '}
                        <bdi dir="ltr" className="font-extrabold text-ink-900">
                          {formatIdentifierForDisplay(identifier)}
                        </bdi>{' '}
                        ارسال شد.
                      </p>
                      <OtpInput
                        id={`identifier-otp-${kind}`}
                        value={code}
                        onChange={(v) => {
                          setCode(v);
                          setCodeInvalid(false);
                          setError(null);
                        }}
                        onComplete={verify}
                        invalid={codeInvalid}
                        disabled={busy}
                        autoFocus
                      />
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] font-bold">
                        <button
                          type="button"
                          onClick={() => {
                            setStep('input');
                            setCode('');
                            setError(null);
                          }}
                          className="text-ink-500 transition-colors hover:text-ink-800"
                        >
                          ویرایش {meta.title.toLowerCase()}
                        </button>
                        <button
                          type="button"
                          onClick={resend}
                          disabled={busy || cooldownLeft > 0}
                          className="text-brand-700 transition-colors hover:text-brand-600 disabled:text-ink-400"
                        >
                          {cooldownLeft > 0
                            ? `ارسال مجدد تا ${formatCountdown(cooldownLeft)}`
                            : 'ارسال مجدد کد'}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}

        <p className="pt-1 text-[11.5px] leading-5 text-ink-500">
          شناسه‌ی اصلی، روش پیش‌فرضِ ورود و بازیابی حساب است؛ تغییر آن فقط برای شناسه‌های تأییدشده
          ممکن است. جایگزینیِ یک شناسه‌ی موجود طبق سیاست امنیتی پشتیبانی نمی‌شود — فقط اتصالِ
          شناسه‌ی غایب یا تأییدِ شناسه‌ی متصلِ تأییدنشده.
        </p>
      </div>
    </SectionCard>
  );
}
