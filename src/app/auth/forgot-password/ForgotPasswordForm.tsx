"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import {
  AuthAlert,
  AuthSubmitButton,
  IdentifierField,
  OtpCodeInput,
  PasswordField,
} from "@/components/auth/AuthUI";
import {
  forgotPasswordConfirm,
  forgotPasswordRequest,
  OTP_CODE_LENGTH,
  OTP_RESEND_SECONDS,
} from "@/lib/auth";
import { firstErrorMessage } from "@/lib/api";
import { useCountdown } from "@/lib/use-countdown";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [stage, setStage] = useState<"request" | "confirm">("request");
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const countdown = useCountdown();

  const request = async () => {
    const result = await forgotPasswordRequest(identifier.trim());
    setNotice(result.message);
    setStage("confirm");
    countdown.restart(OTP_RESEND_SECONDS);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (stage === "request") {
        await request();
        return;
      }
      if (password !== confirmation) {
        setError("تکرار رمز عبور با رمز جدید یکسان نیست.");
        return;
      }
      await forgotPasswordConfirm({
        identifier: identifier.trim(),
        code,
        new_password: password,
      });
      router.replace("/auth/login?reset=success");
    } catch (cause) {
      setError(firstErrorMessage(cause) || "بازیابی رمز عبور انجام نشد.");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (countdown.active || loading) return;
    setLoading(true);
    setError(null);
    try {
      await request();
    } catch (cause) {
      setError(firstErrorMessage(cause) || "ارسال مجدد کد انجام نشد.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      {error && <AuthAlert>{error}</AuthAlert>}
      {notice && <AuthAlert type="info">{notice}</AuthAlert>}

      <IdentifierField
        label="ایمیل یا شماره موبایل"
        value={identifier}
        onChange={(event) => setIdentifier(event.target.value)}
        disabled={loading || stage === "confirm"}
        maxLength={254}
        required
      />

      {stage === "confirm" && (
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
                setStage("request");
                setCode("");
                setNotice(null);
              }}
              className="text-ink-500"
            >
              تغییر شناسه
            </button>
          </div>
          <PasswordField
            label="رمز عبور جدید"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            required
          />
          <PasswordField
            label="تکرار رمز عبور جدید"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="new-password"
            error={
              confirmation && confirmation !== password
                ? "رمزها یکسان نیستند."
                : undefined
            }
            required
          />
        </>
      )}

      <AuthSubmitButton
        loading={loading}
        disabled={
          !identifier.trim() ||
          (stage === "confirm" &&
            (code.length !== OTP_CODE_LENGTH ||
              password.length < 8 ||
              password !== confirmation))
        }
      >
        {stage === "request" ? "ارسال کد بازیابی" : "ثبت رمز عبور جدید"}
      </AuthSubmitButton>

      <p className="text-center text-sm font-semibold text-ink-500">
        رمز عبور را به یاد آوردید؟{" "}
        <Link
          href="/auth/login"
          className="font-extrabold text-brand-700 hover:underline"
        >
          بازگشت به ورود
        </Link>
      </p>
    </form>
  );
}
