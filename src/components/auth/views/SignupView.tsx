'use client';

/**
 * SignupView — ثبت‌نام دومرحله‌ای:
 *   مرحله ۱) شناسه   → POST /auth/signup/request/   (فقط ارسال کد؛
 *                                                     هنوز حسابی ساخته
 *                                                     نمی‌شود)
 *   مرحله ۲) کد + رمز (+ نام اختیاری) → /auth/signup/verify/ → JWT
 *
 * سینک‌های کلیدی:
 *   • «این شناسه قبلاً ثبت شده است.» چه در request چه در verify بیاید،
 *     به‌جای بن‌بست، پیشنهاد «ورود با همین شناسه» داده می‌شود.
 *   • قواعد رمز با validate_password جنگو آینه شده (۸+ و نه‌عددی) و
 *     پیام دقیقِ سرور در صورت رد، جایگزین حدسِ ما می‌شود.
 *   • نام/نام‌خانوادگی اختیاری است و خالی ارسال نمی‌شود.
 */

import { useState } from 'react';
import { LogIn } from 'lucide-react';
import { signupRequest, signupVerify, type AuthUser, type AuthChallengeResult } from '@/lib/auth';
import { coerceAuthError, type AuthErrorModel } from '@/lib/auth-errors';
import { prepareIdentifierForSubmit, validateIdentifier } from '@/lib/auth-identifier';
import { isOtpComplete } from '@/lib/otp';
import { Alert, Field, SubmitButton, inputClass } from '../ui';
import { IdentifierField } from '../IdentifierField';
import { PasswordField, isPasswordAcceptable } from '../PasswordField';
import { OtpStep } from '../OtpStep';
import { useOtpChallenge } from '../useOtpChallenge';

const DUPLICATE_HINT = 'قبلاً ثبت شده';

export function SignupView({
  identifier,
  setIdentifier,
  onSuccess,
  goLogin,
}: {
  identifier: string;
  setIdentifier: (v: string) => void;
  onSuccess: (user: AuthUser) => void;
  goLogin: () => void;
}) {
  const [step, setStep] = useState<'identifier' | 'code'>('identifier');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AuthErrorModel | null>(null);
  const [touched, setTouched] = useState(false);

  const prepared = prepareIdentifierForSubmit(identifier);
  const identifierError = touched ? validateIdentifier(identifier) : null;

  const challenge = useOtpChallenge({
    identifier: prepared,
    request: (id): Promise<AuthChallengeResult> => signupRequest(id),
  });

  const isDuplicate = Boolean(
    (error?.message.includes(DUPLICATE_HINT) ?? false) ||
    (challenge.sendError?.message.includes(DUPLICATE_HINT) ?? false),
  );

  /* ── مرحله ۱: درخواست کد ─────────────────────────────────────────── */
  if (step === 'identifier') {
    return (
      <form
        noValidate
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const idError = validateIdentifier(identifier);
          setTouched(true);
          if (idError) return;
          const ok = await challenge.send();
          if (ok) {
            setCode('');
            setError(null);
            setStep('code');
          }
        }}
      >
        {challenge.sendError ? (
          <Alert kind={isDuplicate ? 'info' : 'error'}>
            {challenge.sendError.message}{' '}
            {isDuplicate ? (
              <button
                type="button"
                onClick={goLogin}
                className="inline-flex items-center gap-1 font-bold text-brand-700 underline-offset-2 hover:underline"
              >
                <LogIn className="h-3.5 w-3.5" />
                ورود با همین شناسه
              </button>
            ) : null}
          </Alert>
        ) : null}

        <p className="text-[12.5px] leading-6 text-ink-500">
          شناسه‌تان را وارد کنید؛ کد تأیید برایتان ارسال می‌شود و حساب‌تان در چند ثانیه ساخته
          می‌شود.
        </p>

        <IdentifierField
          id="signup-identifier"
          value={identifier}
          onChange={(v) => setIdentifier(v)}
          error={identifierError}
          disabled={challenge.sending}
          autoFocus
        />

        <SubmitButton loading={challenge.sending}>دریافت کد تأیید</SubmitButton>
      </form>
    );
  }

  /* ── مرحله ۲: کد + رمز ────────────────────────────────────────────── */
  const isDuplicateNow = (model: AuthErrorModel) => model.message.includes(DUPLICATE_HINT);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (busy) return;
    if (!isOtpComplete(code) || !isPasswordAcceptable(password)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await signupVerify({
        identifier: prepared,
        code,
        password,
        ...(firstName.trim() ? { first_name: firstName.trim() } : {}),
        ...(lastName.trim() ? { last_name: lastName.trim() } : {}),
        persist: remember,
      });
      onSuccess(res.user);
    } catch (err) {
      const model = coerceAuthError(err);
      setError(model);
      if (!isDuplicateNow(model)) challenge.markWrongAttempt(model);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {error ? (
        <Alert kind={error.message.includes(DUPLICATE_HINT) ? 'info' : 'error'}>
          {error.message}{' '}
          {error.message.includes(DUPLICATE_HINT) ? (
            <button
              type="button"
              onClick={goLogin}
              className="inline-flex items-center gap-1 font-bold text-brand-700 underline-offset-2 hover:underline"
            >
              <LogIn className="h-3.5 w-3.5" />
              ورود با همین شناسه
            </button>
          ) : null}
        </Alert>
      ) : null}
      {challenge.sendError ? <Alert kind="error">{challenge.sendError.message}</Alert> : null}

      <OtpStep
        id="signup-otp"
        identifier={prepared}
        code={code}
        onCodeChange={(v) => {
          setCode(v);
          setError(null);
        }}
        challenge={challenge}
        onEditIdentifier={() => {
          setStep('identifier');
          setCode('');
          setError(null);
          challenge.reset();
        }}
        invalid={Boolean(error && error.kind === 'validation' && !error.fieldErrors.password)}
        disabled={busy}
      />

      <PasswordField
        id="signup-password"
        label="رمز عبور دلخواه"
        autoComplete="new-password"
        value={password}
        onChange={(v) => {
          setPassword(v);
          setError(null);
        }}
        error={error?.fieldErrors.password ?? null}
        withChecklist
        disabled={busy}
      />

      <div className="grid grid-cols-2 gap-3">
        <Field id="signup-first-name" label="نام (اختیاری)">
          <input
            id="signup-first-name"
            type="text"
            autoComplete="given-name"
            maxLength={100}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={busy}
            className={inputClass(false)}
          />
        </Field>
        <Field id="signup-last-name" label="نام خانوادگی (اختیاری)">
          <input
            id="signup-last-name"
            type="text"
            autoComplete="family-name"
            maxLength={100}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            disabled={busy}
            className={inputClass(false)}
          />
        </Field>
      </div>

      <label className="flex cursor-pointer select-none items-center gap-2 text-[12.5px] font-medium text-ink-700">
        <input
          type="checkbox"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
          className="h-4 w-4 rounded border-ink-200 text-brand-500 accent-brand-500"
        />
        مرا به خاطر بسپار
      </label>

      <SubmitButton
        loading={busy}
        disabled={!isOtpComplete(code) || !isPasswordAcceptable(password)}
      >
        ساخت حساب کاربری
      </SubmitButton>
    </form>
  );
}
