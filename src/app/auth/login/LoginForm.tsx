"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";
import {
  AuthAlert,
  AuthDivider,
  AuthSubmitButton,
  IdentifierField,
  OtpCodeInput,
  PasswordField,
} from "@/components/auth/AuthUI";
import {
  loginOtpRequest,
  loginOtpVerify,
  loginPassword,
  OTP_CODE_LENGTH,
  OTP_RESEND_SECONDS,
} from "@/lib/auth";
import { firstErrorMessage } from "@/lib/api";
import { sanitizeNextPath } from "@/lib/safe-navigation";
import { useCountdown } from "@/lib/use-countdown";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = sanitizeNextPath(searchParams.get("next"));

  const [mode, setMode] = useState<"password" | "otp">("password");
  const [otpRequested, setOtpRequested] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(
    searchParams.get("reset") === "success"
      ? "رمز عبور با موفقیت تغییر کرد؛ اکنون وارد شوید."
      : null,
  );
  const countdown = useCountdown();

  const switchMode = (nextMode: "password" | "otp") => {
    setMode(nextMode);
    setOtpRequested(false);
    setCode("");
    setError(null);
    setNotice(null);
  };

  const requestOtp = async () => {
    const challenge = await loginOtpRequest(identifier.trim());
    setOtpRequested(true);
    setNotice(challenge.message);
    countdown.restart(OTP_RESEND_SECONDS);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!identifier.trim() || loading) return;
    setLoading(true);
    setError(null);

    try {
      if (mode === "password") {
        await loginPassword({
          identifier: identifier.trim(),
          password,
          persist: remember,
        });
      } else if (!otpRequested) {
        await requestOtp();
        return;
      } else {
        await loginOtpVerify({
          identifier: identifier.trim(),
          code,
          persist: remember,
        });
      }
      router.replace(nextPath);
      router.refresh();
    } catch (cause) {
      setError(
        firstErrorMessage(cause) || "ورود انجام نشد. لطفاً دوباره تلاش کنید.",
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
      await requestOtp();
    } catch (cause) {
      setError(firstErrorMessage(cause) || "ارسال مجدد کد انجام نشد.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <div
        className="grid grid-cols-2 rounded-xl bg-ink-50 p-1"
        role="tablist"
        aria-label="روش ورود"
      >
        {(
          [
            ["password", "ورود با رمز"],
            ["otp", "ورود با کد"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={mode === key}
            onClick={() => switchMode(key)}
            className={`h-10 rounded-lg text-sm font-extrabold transition ${
              mode === key
                ? "bg-white text-brand-700 shadow-sm"
                : "text-ink-500 hover:text-ink-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <AuthAlert>{error}</AuthAlert>}
      {notice && <AuthAlert type="info">{notice}</AuthAlert>}

      <IdentifierField
        label="ایمیل یا شماره موبایل"
        value={identifier}
        onChange={(event) => setIdentifier(event.target.value)}
        placeholder="example@email.com یا 0912…"
        maxLength={254}
        disabled={loading || (mode === "otp" && otpRequested)}
        required
      />

      {mode === "password" && (
        <PasswordField
          label="رمز عبور"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />
      )}

      {mode === "otp" && otpRequested && (
        <div className="space-y-3">
          <OtpCodeInput
            value={code}
            onChange={setCode}
            length={OTP_CODE_LENGTH}
            disabled={loading}
          />
          <div className="flex items-center justify-between gap-3 text-xs font-bold">
            <button
              type="button"
              onClick={resend}
              disabled={countdown.active || loading}
              className="text-brand-700 hover:text-brand-900 disabled:cursor-not-allowed disabled:text-ink-300"
            >
              {countdown.active
                ? `ارسال مجدد در ${countdown.seconds.toLocaleString("fa-IR")} ثانیه`
                : "ارسال مجدد کد"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOtpRequested(false);
                setCode("");
              }}
              className="text-ink-500 hover:text-ink-800"
            >
              تغییر شناسه
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 text-xs font-bold">
        <label className="flex cursor-pointer items-center gap-2 text-ink-600">
          <input
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
            className="h-4 w-4 rounded border-ink-300 accent-brand-600"
          />
          مرا به خاطر بسپار
        </label>
        <Link
          href="/auth/forgot-password"
          className="text-brand-700 hover:underline"
        >
          فراموشی رمز عبور
        </Link>
      </div>

      <AuthSubmitButton
        loading={loading}
        disabled={
          !identifier.trim() ||
          (mode === "password" && !password) ||
          (mode === "otp" && otpRequested && code.length !== OTP_CODE_LENGTH)
        }
      >
        {mode === "otp" && !otpRequested ? "دریافت کد ورود" : "ورود به حساب"}
      </AuthSubmitButton>

      <AuthDivider />
      <p className="text-center text-sm font-semibold text-ink-500">
        حساب ندارید؟{" "}
        <Link
          href={`/auth/signup?next=${encodeURIComponent(nextPath)}`}
          className="font-extrabold text-brand-700 hover:underline"
        >
          ثبت‌نام کنید
        </Link>
      </p>
    </form>
  );
}
