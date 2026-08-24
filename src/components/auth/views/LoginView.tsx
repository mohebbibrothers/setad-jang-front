'use client';

/**
 * LoginView — ورود با دو روش:
 *   ۱) رمز عبور           → POST /auth/login/password/
 *   ۲) کد یکبارمصرف (OTP) → /auth/login/otp/request/ + /otp/verify/
 *
 * پیشرفتِ روش/مرحله/کد در auth-flow-session نشسته — سوییچ تب ورود↔ثبت‌نام
 * یا بستن مودال، فلوی در حال اجرا را نمی‌شکند (استاندارد صنعت).
 *
 * نکات سینک با بک‌اند:
 *   • شناسه یکتا (ایمیل/موبایل) — تشخیص kind سِمت سرور است؛ ما فقط
 *     مقدار تمیزشده (ارقام لاتین) را می‌فرستیم.
 *   • 401/403 پیام دقیق خود بک‌اند را می‌بینند؛ خطاها بازنویسی نمی‌شوند.
 *   • verify هنگام کامل‌شدن ۵ رقم خودکار ارسال می‌شود (once).
 *   • «مرا به خاطر بسپار» = persist توکن (localStorage در برابر session).
 *   • رمزِ ورود به‌عمدت در draft سشن نمی‌ماند (امنیت)؛ فقط کد OTP و مرحله.
 */

import { memo, useState } from 'react';
import { KeyRound, ShieldCheck } from 'lucide-react';
import {
  loginPassword,
  loginOtpRequest,
  loginOtpVerify,
  type AuthUser,
  type AuthChallengeResult,
} from '@/lib/auth';
import { coerceAuthError, type AuthErrorModel } from '@/lib/auth-errors';
import { prepareIdentifierForSubmit, validateIdentifier } from '@/lib/auth-identifier';
import { patchAuthFlow, useAuthFlowDraft, type LoginMethod } from '@/lib/auth-flow-session';
import { isOtpComplete } from '@/lib/otp';
import { Alert, SubmitButton } from '../ui';
import { IdentifierField } from '../IdentifierField';
import { PasswordField } from '../PasswordField';
import { OtpStep } from '../OtpStep';
import { useOtpChallenge } from '../useOtpChallenge';
import { Segmented } from '../segmented';

/** نماها memoize‌اند: callbackهای والد پایدارند (useCallback) و draft
 *  هر نما فقط خودش را رِرِندِر می‌کند — تایپ/تیکِ یک نما، نمایِ غیرفعال
 *  را رِرِندِر نمی‌کند (کاهشِ کارِ رندر به حداقلِ ممکن). */
export const LoginView = memo(function LoginView({
  identifier,
  setIdentifier,
  onSuccess,
  goForgot,
}: {
  identifier: string;
  setIdentifier: (v: string) => void;
  onSuccess: (user: AuthUser) => void;
  goForgot: (identifier: string) => void;
}) {
  const draft = useAuthFlowDraft('login');
  const method = draft.method;

  return (
    <div className="space-y-5">
      {/* سوییچ روش — همان کپسولِ اندازه‌گیری‌شده (تک‌منبع با تب‌های مودال):
          آینه‌ی دقیقِ سلولِ فعال، transformِ خالص، ترک کلیپ‌شده */}
      <Segmented<LoginMethod>
        ariaLabel="روش ورود"
        value={method}
        onChange={(next) => patchAuthFlow('login', { method: next })}
        indicatorTestId="auth-method-indicator"
        buttonClassName="flex h-10 items-center justify-center gap-1.5 rounded-lg text-[13px] font-bold transition-colors"
        activeButtonClassName="text-brand-700"
        inactiveButtonClassName="text-ink-500 hover:text-ink-700"
        options={[
          {
            value: 'password',
            label: (
              <>
                <KeyRound className="h-4 w-4" strokeWidth={2.2} />
                <span>رمز عبور</span>
              </>
            ),
          },
          {
            value: 'otp',
            label: (
              <>
                <ShieldCheck className="h-4 w-4" strokeWidth={2.2} />
                <span>کد یکبارمصرف</span>
              </>
            ),
          },
        ]}
      />

      {method === 'password' ? (
        <PasswordLoginForm
          identifier={identifier}
          setIdentifier={setIdentifier}
          onSuccess={onSuccess}
          goForgot={goForgot}
        />
      ) : (
        <OtpLoginFlow identifier={identifier} setIdentifier={setIdentifier} onSuccess={onSuccess} />
      )}
    </div>
  );
});

/* ── روش ۱: رمز عبور ──────────────────────────────────────────────────── */

function PasswordLoginForm({
  identifier,
  setIdentifier,
  onSuccess,
  goForgot,
}: {
  identifier: string;
  setIdentifier: (v: string) => void;
  onSuccess: (user: AuthUser) => void;
  goForgot: (identifier: string) => void;
}) {
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AuthErrorModel | null>(null);
  const [touched, setTouched] = useState(false);

  const identifierError = touched ? validateIdentifier(identifier) : null;

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (busy) return;
    const idError = validateIdentifier(identifier);
    setTouched(true);
    if (idError) return;
    if (!password) {
      setError({
        kind: 'validation',
        message: 'رمز عبور را وارد کنید.',
        fieldErrors: { password: 'رمز عبور را وارد کنید.' },
      });
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await loginPassword({
        identifier: prepareIdentifierForSubmit(identifier),
        password,
        persist: remember,
      });
      onSuccess(res.user);
    } catch (err) {
      setError(coerceAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {error ? <Alert kind="error">{error.message}</Alert> : null}

      <IdentifierField
        id="login-identifier"
        value={identifier}
        onChange={(v) => {
          setIdentifier(v);
          setError(null);
        }}
        error={identifierError}
        disabled={busy}
      />

      <PasswordField
        id="login-password"
        value={password}
        onChange={(v) => {
          setPassword(v);
          setError(null);
        }}
        error={error?.fieldErrors.password ?? null}
        disabled={busy}
      />

      <div className="flex items-center justify-between">
        <label className="flex cursor-pointer select-none items-center gap-2 text-[12.5px] font-medium text-ink-700">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 rounded border-ink-200 text-brand-500 accent-brand-500"
          />
          مرا به خاطر بسپار
        </label>
        <button
          type="button"
          onClick={() => goForgot(identifier)}
          className="text-[12.5px] font-bold text-brand-700 underline-offset-2 transition-colors hover:text-brand-600 hover:underline"
        >
          رمز عبورم را فراموش کرده‌ام
        </button>
      </div>

      <SubmitButton loading={busy}>ورود به حساب</SubmitButton>
    </form>
  );
}

/* ── روش ۲: کد یکبارمصرف ─────────────────────────────────────────────── */

function OtpLoginFlow({
  identifier,
  setIdentifier,
  onSuccess,
}: {
  identifier: string;
  setIdentifier: (v: string) => void;
  onSuccess: (user: AuthUser) => void;
}) {
  const draft = useAuthFlowDraft('login');
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AuthErrorModel | null>(null);
  const [touched, setTouched] = useState(false);

  const prepared = prepareIdentifierForSubmit(identifier);
  const identifierError = touched ? validateIdentifier(identifier) : null;

  const challenge = useOtpChallenge({
    flow: 'login',
    identifier: prepared,
    request: (id): Promise<AuthChallengeResult> => loginOtpRequest(id),
  });

  const sendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const idError = validateIdentifier(identifier);
    setTouched(true);
    if (idError) return;
    // خودِ challenge مالک ارسال است — تایمرها با ددلاین مطلق در draft
    // می‌نشینند و سوییچ تب/بستن مودال را جان سالم به در می‌برند.
    const ok = await challenge.send();
    if (ok) {
      patchAuthFlow('login', { step: 'code', code: '' });
      setError(null);
    }
  };

  const verify = async (finalCode: string) => {
    if (busy || !isOtpComplete(finalCode)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await loginOtpVerify({
        identifier: prepared,
        code: finalCode,
        persist: remember,
      });
      onSuccess(res.user);
    } catch (err) {
      const model = coerceAuthError(err);
      setError(model);
      challenge.markWrongAttempt(model);
      patchAuthFlow('login', { code: '' });
    } finally {
      setBusy(false);
    }
  };

  if (draft.step === 'code') {
    return (
      <div className="space-y-4">
        {error ? <Alert kind="error">{error.message}</Alert> : null}
        {challenge.sendError ? <Alert kind="error">{challenge.sendError.message}</Alert> : null}

        <OtpStep
          id="login-otp"
          identifier={prepared}
          code={draft.code}
          onCodeChange={(v) => {
            patchAuthFlow('login', { code: v });
            setError(null);
          }}
          onComplete={verify}
          challenge={challenge}
          onEditIdentifier={() => {
            patchAuthFlow('login', { step: 'identifier', code: '' });
            setError(null);
            challenge.reset();
          }}
          invalid={
            Boolean(error?.fieldErrors.code) || Boolean(error && error.kind === 'validation')
          }
          disabled={busy}
        />

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
          disabled={!isOtpComplete(draft.code)}
          onClick={() => verify(draft.code)}
        >
          تأیید و ورود
        </SubmitButton>
      </div>
    );
  }

  return (
    <form onSubmit={sendCode} noValidate className="space-y-4">
      {challenge.sendError ? <Alert kind="error">{challenge.sendError.message}</Alert> : null}
      <p className="text-[12.5px] leading-6 text-ink-500">
        بدون نیاز به رمز عبور؛ کد ورود برایتان ارسال می‌شود.
      </p>
      <IdentifierField
        id="login-otp-identifier"
        value={identifier}
        onChange={(v) => setIdentifier(v)}
        error={identifierError}
        disabled={challenge.sending}
      />
      <SubmitButton loading={challenge.sending}>ارسال کد ورود</SubmitButton>
    </form>
  );
}
