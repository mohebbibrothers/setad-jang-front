'use client';

/**
 * ForgotView — بازیابی رمز عبور:
 *   مرحله ۱) شناسه → POST /auth/password/forgot/request/
 *   مرحله ۲) کد + رمز جدید → /auth/password/forgot/confirm/
 *   مرحله ۳) پیام موفقیت → بازگشت به ورود با رمز جدید
 *
 * endpoint ها enumeration-safe نیستند ولی پیام عمومی می‌دهند؛ ما هم
 * هیچ‌وقت وجود/عدم‌وجود حساب را فاش نمی‌کنیم — فقط «کد ارسال شد».
 */

import { useState } from 'react';
import { CheckCircle2, LogIn } from 'lucide-react';
import { forgotPasswordRequest, forgotPasswordConfirm, type AuthChallengeResult } from '@/lib/auth';
import { coerceAuthError, type AuthErrorModel } from '@/lib/auth-errors';
import { prepareIdentifierForSubmit, validateIdentifier } from '@/lib/auth-identifier';
import { isOtpComplete } from '@/lib/otp';
import { Alert, SubmitButton } from '../ui';
import { IdentifierField } from '../IdentifierField';
import { PasswordField, isPasswordAcceptable } from '../PasswordField';
import { OtpStep } from '../OtpStep';
import { useOtpChallenge } from '../useOtpChallenge';

export function ForgotView({
  identifier,
  setIdentifier,
  goLogin,
}: {
  identifier: string;
  setIdentifier: (v: string) => void;
  /** بازگشت به ورود (نمایش پیام موفقیت تغییر رمز) */
  goLogin: (notice?: string) => void;
}) {
  const [step, setStep] = useState<'identifier' | 'code' | 'done'>('identifier');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AuthErrorModel | null>(null);
  const [touched, setTouched] = useState(false);

  const prepared = prepareIdentifierForSubmit(identifier);
  const identifierError = touched ? validateIdentifier(identifier) : null;

  const challenge = useOtpChallenge({
    identifier: prepared,
    request: (id): Promise<AuthChallengeResult> => forgotPasswordRequest(id),
  });

  if (step === 'done') {
    return (
      <div className="space-y-5 py-2 text-center">
        <CheckCircle2
          className="mx-auto h-14 w-14 text-brand-500"
          strokeWidth={1.6}
          aria-hidden="true"
        />
        <div className="space-y-1.5">
          <h3 className="text-[17px] font-extrabold text-ink-900">رمز عبور شما تغییر کرد</h3>
          <p className="text-[13px] leading-6 text-ink-500">
            از این پس با رمز جدید وارد حساب خود شوید.
          </p>
        </div>
        <SubmitButton onClick={() => goLogin('رمز عبور شما با موفقیت تغییر کرد؛ حالا وارد شوید.')}>
          <span className="inline-flex items-center gap-2">
            <LogIn className="h-4 w-4" />
            ورود با رمز جدید
          </span>
        </SubmitButton>
      </div>
    );
  }

  if (step === 'code') {
    const submit = async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (busy || !isOtpComplete(code) || !isPasswordAcceptable(newPassword)) return;
      setBusy(true);
      setError(null);
      try {
        await forgotPasswordConfirm({
          identifier: prepared,
          code,
          new_password: newPassword,
        });
        setStep('done');
      } catch (err) {
        const model = coerceAuthError(err);
        setError(model);
        challenge.markWrongAttempt(model);
      } finally {
        setBusy(false);
      }
    };

    return (
      <form onSubmit={submit} noValidate className="space-y-4">
        {error ? <Alert kind="error">{error.message}</Alert> : null}
        {challenge.sendError ? <Alert kind="error">{challenge.sendError.message}</Alert> : null}

        <OtpStep
          id="forgot-otp"
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
          invalid={Boolean(error && error.kind === 'validation')}
          disabled={busy}
        />

        <PasswordField
          id="forgot-new-password"
          label="رمز عبور جدید"
          autoComplete="new-password"
          value={newPassword}
          onChange={(v) => {
            setNewPassword(v);
            setError(null);
          }}
          error={error?.fieldErrors.password ?? null}
          withChecklist
          disabled={busy}
        />

        <SubmitButton
          loading={busy}
          disabled={!isOtpComplete(code) || !isPasswordAcceptable(newPassword)}
        >
          تغییر رمز عبور
        </SubmitButton>
      </form>
    );
  }

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
      {challenge.sendError ? <Alert kind="error">{challenge.sendError.message}</Alert> : null}
      <p className="text-[12.5px] leading-6 text-ink-500">
        شناسه‌ی حساب‌تان را وارد کنید تا کد بازیابی برایتان ارسال شود.
      </p>
      <IdentifierField
        id="forgot-identifier"
        value={identifier}
        onChange={(v) => setIdentifier(v)}
        error={identifierError}
        disabled={challenge.sending}
        autoFocus
      />
      <SubmitButton loading={challenge.sending}>ارسال کد بازیابی</SubmitButton>
    </form>
  );
}
