"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useMemo, useState } from "react";
import {
  AuthAlert,
  AuthSubmitButton,
  IdentifierField,
  OtpCodeInput,
  PasswordField,
  AuthField,
} from "@/components/auth/AuthUI";
import {
  OTP_CODE_LENGTH,
  OTP_RESEND_SECONDS,
  signupRequest,
  signupVerify,
} from "@/lib/auth";
import { firstErrorMessage } from "@/lib/api";
import { sanitizeNextPath } from "@/lib/safe-navigation";
import { useCountdown } from "@/lib/use-countdown";

function passwordScore(password: string): number {
  return [
    password.length >= 8,
    /[a-zA-Z]/.test(password),
    /\d/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ].filter(Boolean).length;
}

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = sanitizeNextPath(searchParams.get("next"));

  const [stage, setStage] = useState<"identifier" | "complete">("identifier");
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const countdown = useCountdown();
  const strength = useMemo(() => passwordScore(password), [password]);

  const requestCode = async () => {
    const challenge = await signupRequest(identifier.trim());
    setNotice(challenge.message);
    setStage("complete");
    countdown.restart(OTP_RESEND_SECONDS);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading || !identifier.trim()) return;
    setLoading(true);
    setError(null);
    try {
      if (stage === "identifier") {
        await requestCode();
        return;
      }
      if (password !== confirmation) {
        setError("تکرار رمز عبور با رمز انتخابی یکسان نیست.");
        return;
      }
      await signupVerify({
        identifier: identifier.trim(),
        code,
        password,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        persist: remember,
      });
      router.replace(nextPath);
      router.refresh();
    } catch (cause) {
      setError(
        firstErrorMessage(cause) ||
          "ساخت حساب انجام نشد. لطفاً دوباره تلاش کنید.",
      );
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (countdown.active || loading) return;
    setLoading(true);
    setError(null);
    try {
      await requestCode();
    } catch (cause) {
      setError(firstErrorMessage(cause) || "ارسال مجدد کد انجام نشد.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <div className="mb-2 flex items-center gap-2" aria-label="مراحل ثبت‌نام">
        <span
          className={`h-2 flex-1 rounded-full ${stage === "identifier" ? "bg-brand-500" : "bg-brand-200"}`}
        />
        <span
          className={`h-2 flex-1 rounded-full ${stage === "complete" ? "bg-brand-500" : "bg-ink-100"}`}
        />
      </div>

      {error && <AuthAlert>{error}</AuthAlert>}
      {notice && <AuthAlert type="info">{notice}</AuthAlert>}

      <IdentifierField
        label="ایمیل یا شماره موبایل"
        value={identifier}
        onChange={(event) => setIdentifier(event.target.value)}
        placeholder="شناسه‌ای که به آن دسترسی دارید"
        maxLength={254}
        disabled={loading || stage === "complete"}
        required
      />

      {stage === "complete" && (
        <>
          <OtpCodeInput
            value={code}
            onChange={setCode}
            length={OTP_CODE_LENGTH}
            disabled={loading}
          />
          <div className="flex items-center justify-between text-xs font-bold">
            <button
              type="button"
              onClick={resend}
              disabled={countdown.active || loading}
              className="text-brand-700 disabled:text-ink-300"
            >
              {countdown.active
                ? `ارسال مجدد در ${countdown.seconds.toLocaleString("fa-IR")} ثانیه`
                : "ارسال مجدد کد"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStage("identifier");
                setCode("");
                setNotice(null);
              }}
              className="text-ink-500 hover:text-ink-800"
            >
              تغییر شناسه
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <AuthField
              label="نام"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              maxLength={100}
              autoComplete="given-name"
            />
            <AuthField
              label="نام خانوادگی"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              maxLength={100}
              autoComplete="family-name"
            />
          </div>

          <PasswordField
            label="رمز عبور"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            hint="حداقل ۸ کاراکتر؛ از رمزهای رایج یا کاملاً عددی استفاده نکنید."
            required
          />
          <div
            className="-mt-3 grid grid-cols-4 gap-1.5"
            aria-label={`قدرت رمز: ${strength} از ۴`}
          >
            {[1, 2, 3, 4].map((item) => (
              <span
                key={item}
                className={`h-1.5 rounded-full ${item <= strength ? (strength <= 2 ? "bg-amber-500" : "bg-emerald-500") : "bg-ink-100"}`}
              />
            ))}
          </div>
          <PasswordField
            label="تکرار رمز عبور"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="new-password"
            error={
              confirmation && password !== confirmation
                ? "رمزها یکسان نیستند."
                : undefined
            }
            required
          />

          <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-ink-600">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              className="h-4 w-4 accent-brand-600"
            />
            ورود من روی این دستگاه حفظ شود
          </label>
        </>
      )}

      <AuthSubmitButton
        loading={loading}
        disabled={
          stage === "identifier"
            ? !identifier.trim()
            : code.length !== OTP_CODE_LENGTH ||
              password.length < 8 ||
              password !== confirmation
        }
      >
        {stage === "identifier" ? "ارسال کد تأیید" : "تأیید و ساخت حساب"}
      </AuthSubmitButton>

      <p className="text-center text-sm font-semibold text-ink-500">
        قبلاً ثبت‌نام کرده‌اید؟{" "}
        <Link
          href={`/auth/login?next=${encodeURIComponent(nextPath)}`}
          className="font-extrabold text-brand-700 hover:underline"
        >
          وارد شوید
        </Link>
      </p>
    </form>
  );
}
