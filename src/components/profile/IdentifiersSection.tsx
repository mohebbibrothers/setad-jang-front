'use client';

/**
 * ═══════════════════════════════════════════════════════════════════
 * IdentifiersSection — مدیریت شناسه‌های ورود (ایمیل | موبایل)
 *
 * قراردادِ دقیقِ بک‌اند (apps/authentication — Phase H.2):
 *
 *   POST /auth/identifiers/add/request/  {identifier}        → کد می‌فرستد
 *     + مواردِ مجاز: اتصالِ شناسه‌ی غایب، یا تأییدِ مجددِ «همانِ»
 *       متصلِ تأییدنشده؛ خطاها (متن‌های فارسیِ آماده): قبلاً تأیید شده /
 *       کانال اشغال است (جایگزینی پشتیبانی نمی‌شود) / متعلق به دیگری.
 *   POST /auth/identifiers/add/verify/   {identifier, code}  → UserMe کامل
 *   POST /auth/identifiers/make-primary/ {identifier_kind}   → UserMe کامل
 *
 * نکته‌ی صادقانه‌ی قرارداد: بک‌اند وضعیتِ تأییدِ موبایل و شناسه‌ی اصلیِ
 * فعلی را در UserMe برنمی‌گرداند (فقط is_email_verified هست). پس UI هیچ
 * نشانِ جعلی نمی‌سازد؛ وضعیتِ موبایل از «خودِ رفتارِ سرور» یاد گرفته
 * می‌شود (علمِ جلسه): اگر add/request گفت «قبلاً تأیید شده» یا آخرین
 * verify موفق بود → تأییدشده. چرخه همگرا و بدون حدس.
 * ═══════════════════════════════════════════════════════════════════
 */

import { useEffect, useRef, useState } from 'react';
import { BadgeCheck, Crown, Mail, ShieldQuestion, Smartphone, TriangleAlert } from 'lucide-react';
import {
  identifierAddRequest,
  identifierAddVerify,
  identifierMakePrimary,
  type AuthUser,
  type IdentifierKind,
} from '@/lib/auth';
import { applyUser } from '@/lib/use-auth';
import { coerceAuthError } from '@/lib/auth-errors';
import {
  prepareIdentifierForSubmit,
  validateIdentifier,
  formatIdentifierForDisplay,
} from '@/lib/auth-identifier';
import { isOtpComplete, OTP_RESEND_COOLDOWN_SECONDS, formatCountdown } from '@/lib/otp';
import { Alert, SubmitButton } from '@/components/auth/ui';
import { IdentifierField } from '@/components/auth/IdentifierField';
import { OtpInput } from '@/components/auth/OtpInput';
import { SectionCard, Badge, GhostButton } from './account-ui';

/* ── انواع ── */

type Step = 'idle' | 'input' | 'code';

interface KindCard {
  kind: IdentifierKind;
  title: string;
  icon: React.ReactNode;
  /** مقدارِ متصل (در صورت وجود) */
  value: string | null;
  /** وضعیتِ تأییدِ آموخته‌شده: true (تأیید)، false (تأییدنشده)، null (ناشناخته) */
  verified: boolean | null;
}

export function IdentifiersSection({ user }: { user: AuthUser }) {
  const email = user.email ?? null;
  const phone = user.profile?.phone_number ?? null;

  // علمِ جلسه درباره‌ی تأیید موبایل (بک‌اند آن را در UserMe نمی‌دهد)
  const [phoneVerified, setPhoneVerified] = useState<boolean | null>(null);

  const [activeKind, setActiveKind] = useState<IdentifierKind | null>(null);
  const [step, setStep] = useState<Step>('idle');
  const [identifier, setIdentifier] = useState('');
  const [lockedInput, setLockedInput] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const cards: KindCard[] = [
    {
      kind: 'email',
      title: 'ایمیل',
      icon: <Mail className="h-[18px] w-[18px]" />,
      value: email,
      verified: email ? Boolean(user.is_email_verified) : null,
    },
    {
      kind: 'phone',
      title: 'شماره موبایل',
      icon: <Smartphone className="h-[18px] w-[18px]" />,
      value: phone,
      verified: phone ? phoneVerified : null,
    },
  ];

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
      // همگراییِ صادقانه: اگر سرور گفت «قبلاً تأیید شده»، نشان را ببین
      if (model.message.includes('قبلاً') && model.message.includes('تأیید')) {
        if (activeKind === 'phone') setPhoneVerified(true);
        if (activeKind === 'email') {
          /* ایمیل از UserMe فیدبک می‌گیرد */
        }
        setNotice(model.message);
        resetFlow();
      } else {
        setError(model.message);
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
      const model = coerceAuthError(err);
      setError(model.message);
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
      applyUser(freshUser); // پاسخ = UserMeSerializer کامل → سینکِ سراسری
      if (activeKind === 'phone') setPhoneVerified(true);
      setNotice('شناسه با موفقیت به حساب شما متصل و تأیید شد.');
      resetFlow();
    } catch (err) {
      const model = coerceAuthError(err);
      setError(model.message);
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
      setError(coerceAuthError(err).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SectionCard
      icon={<ShieldQuestion className="h-[18px] w-[18px]" />}
      title="شناسه‌های ورود"
      description="با هر کدام از این شناسه‌ها می‌توانید وارد شوید یا رمز را بازیابی کنید. اتصالِ شناسه‌ی جدید فقط با کد تأیید انجام می‌شود."
    >
      <div className="space-y-3">
        {notice ? <Alert kind="success">{notice}</Alert> : null}
        {error && step === 'idle' ? <Alert kind="error">{error}</Alert> : null}

        {cards.map((card) => {
          const flowOpen = activeKind === card.kind && step !== 'idle';
          return (
            <div
              key={card.kind}
              className="rounded-2xl border border-ink-100 bg-white p-4 transition-shadow duration-200 hover:shadow-[0_10px_26px_-16px_rgba(15,20,32,.22)]"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600"
                >
                  {card.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[13.5px] font-extrabold text-ink-900">{card.title}</h3>
                    {card.value && card.verified ? (
                      <Badge tone="ok" icon={<BadgeCheck className="h-3.5 w-3.5" />}>
                        تأیید شده
                      </Badge>
                    ) : null}
                    {card.value && card.verified === false ? (
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
                    {card.value ? formatIdentifierForDisplay(card.value) : 'متصل نشده'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {!card.value && !flowOpen ? (
                    <GhostButton onClick={() => startFlow(card.kind, null)} disabled={busy}>
                      افزودن {card.title}
                    </GhostButton>
                  ) : null}
                  {card.value && card.verified !== true && !flowOpen ? (
                    <GhostButton onClick={() => startFlow(card.kind, card.value)} disabled={busy}>
                      تأیید {card.title}
                    </GhostButton>
                  ) : null}
                  {card.value && card.verified === true ? (
                    <button
                      type="button"
                      onClick={() => makePrimary(card.kind)}
                      disabled={busy}
                      title="این شناسه، روش پیش‌فرض ورود و بازیابی حساب می‌شود"
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11.5px] font-bold text-brand-700 transition-colors hover:bg-brand-50 disabled:opacity-60"
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
                      <Alert kind="error">{error}</Alert>
                    </div>
                  ) : null}

                  {step === 'input' ? (
                    <form onSubmit={send} noValidate className="space-y-4">
                      {lockedInput ? (
                        <div>
                          <span className="mb-1.5 block text-[13px] font-bold text-ink-900">
                            {card.title}
                          </span>
                          <div
                            className="flex h-12 items-center rounded-xl border border-ink-200 bg-white px-3.5 text-left text-[14px] font-bold text-ink-800"
                            dir="ltr"
                          >
                            {formatIdentifierForDisplay(identifier)}
                          </div>
                          <p className="mt-1.5 text-[12px] leading-5 text-ink-500">
                            کد تأیید برای همین {card.title.toLowerCase()} ارسال می‌شود.
                          </p>
                        </div>
                      ) : (
                        <IdentifierField
                          id={`identifier-add-${card.kind}`}
                          value={identifier}
                          onChange={(v) => {
                            setIdentifier(v);
                            setIdentifierError(null);
                            setError(null);
                          }}
                          error={identifierError}
                          disabled={busy}
                          label={card.title}
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
                        کد ۵رقمی به{' '}
                        <bdi dir="ltr" className="font-extrabold text-ink-900">
                          {formatIdentifierForDisplay(identifier)}
                        </bdi>{' '}
                        ارسال شد.
                      </p>
                      <OtpInput
                        id={`identifier-otp-${card.kind}`}
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
                          ویرایش {card.title.toLowerCase()}
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
          ممکن است. جایگزینیِ یک شناسه‌ی موجود طبق سیاست امنیتی بک‌اند پشتیبانی نمی‌شود — فقط اتصالِ
          شناسه‌ی غایب.
        </p>
      </div>
    </SectionCard>
  );
}
