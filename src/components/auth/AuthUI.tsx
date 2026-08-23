"use client";

import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import {
  type ClipboardEvent,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="relative min-h-[calc(100vh-9rem)] overflow-hidden bg-ink-50 py-8 md:py-14">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-50 bg-grid-pattern"
      />
      <div
        aria-hidden="true"
        className="absolute -right-32 top-10 h-72 w-72 rounded-full bg-brand-200/50 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -left-32 bottom-10 h-72 w-72 rounded-full bg-mint-100/70 blur-3xl"
      />

      <div className="container-edge relative">
        <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-[0_32px_90px_-42px_rgba(5,56,50,.42)] lg:grid-cols-[1.08fr_.92fr]">
          <section className="p-6 sm:p-9 lg:p-12">
            <div className="mb-8 text-right">
              <span className="inline-flex rounded-full bg-brand-50 px-3 py-1.5 text-xs font-extrabold text-brand-700">
                {eyebrow}
              </span>
              <h1 className="mt-4 text-2xl font-black leading-[1.55] text-ink-900 sm:text-3xl">
                {title}
              </h1>
              <p className="mt-3 max-w-xl text-sm font-medium leading-8 text-ink-500">
                {description}
              </p>
            </div>
            {children}
          </section>

          <aside className="relative hidden overflow-hidden bg-gradient-to-br from-brand-500 via-brand-700 to-brand-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <Image
              src="/brand/wave-dotted-1.png"
              alt=""
              width={470}
              height={254}
              className="pointer-events-none absolute -left-24 top-10 w-[420px] opacity-25"
            />
            <div className="relative">
              <Link
                href="/"
                aria-label="بعثت مردم — خانه"
                className="inline-flex rounded-2xl bg-white p-3 shadow-xl"
              >
                <Image
                  src="/brand/logo-mark.png"
                  width={94}
                  height={94}
                  alt="بعثت مردم"
                  className="h-20 w-auto object-contain"
                />
              </Link>
              <p className="mt-8 text-3xl font-black leading-[1.75]">
                خانه‌ی امن همراهان
                <br />
                بعثت مردم
              </p>
              <p className="mt-4 text-sm font-medium leading-8 text-white/75">
                یک حساب، برای همراهی در آموزش، همدلی، گزارش‌گری و حرکت‌های
                مردمی.
              </p>
            </div>

            <div className="relative space-y-3">
              <TrustRow
                icon={<ShieldCheck />}
                text="احراز هویت چندشناسه‌ای و OTP"
              />
              <TrustRow
                icon={<Smartphone />}
                text="مدیریت نشست‌ها و دستگاه‌های فعال"
              />
              <TrustRow
                icon={<LockKeyhole />}
                text="ارتباط رمزگذاری‌شده روی HTTPS"
              />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function TrustRow({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold backdrop-blur-sm">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 [&>svg]:h-4 [&>svg]:w-4">
        {icon}
      </span>
      <span>{text}</span>
    </div>
  );
}

export function AuthField({
  label,
  icon,
  error,
  hint,
  wrapperClassName,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon?: ReactNode;
  error?: string;
  hint?: string;
  wrapperClassName?: string;
}) {
  return (
    <label className={cn("block", wrapperClassName)}>
      <span className="mb-2 block text-sm font-extrabold text-ink-700">
        {label}
      </span>
      <span className="relative block">
        {icon && (
          <span className="pointer-events-none absolute right-3 top-1/2 z-10 -translate-y-1/2 text-brand-600 [&>svg]:h-5 [&>svg]:w-5">
            {icon}
          </span>
        )}
        <input
          {...props}
          aria-invalid={Boolean(error)}
          className={cn(
            "h-12 w-full rounded-xl border bg-white px-4 text-sm font-semibold text-ink-900 outline-none transition",
            icon && "pr-11",
            error
              ? "border-danger/60 focus:border-danger focus:ring-4 focus:ring-danger/10"
              : "border-ink-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10",
            className,
          )}
        />
      </span>
      {(error || hint) && (
        <span
          className={cn(
            "mt-1.5 block text-xs font-medium leading-6",
            error ? "text-danger" : "text-ink-400",
          )}
        >
          {error || hint}
        </span>
      )}
    </label>
  );
}

export function IdentifierField(
  props: Omit<Parameters<typeof AuthField>[0], "icon" | "type">,
) {
  const value = String(props.value ?? "");
  const isEmail = value.includes("@");
  return (
    <AuthField
      {...props}
      type="text"
      inputMode={isEmail ? "email" : "tel"}
      autoComplete="username"
      dir="ltr"
      icon={isEmail ? <Mail /> : <Phone />}
    />
  );
}

export function PasswordField(
  props: Omit<Parameters<typeof AuthField>[0], "icon" | "type">,
) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <AuthField
        {...props}
        type={visible ? "text" : "password"}
        icon={<LockKeyhole />}
        dir="ltr"
        className="pl-12"
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className="absolute left-2 top-[2.15rem] flex h-10 w-10 items-center justify-center rounded-lg text-ink-400 hover:bg-ink-50 hover:text-ink-700"
        aria-label={visible ? "پنهان کردن رمز عبور" : "نمایش رمز عبور"}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function normalizeOtp(value: string): string {
  const persian = "۰۱۲۳۴۵۶۷۸۹";
  const arabic = "٠١٢٣٤٥٦٧٨٩";
  return value
    .replace(/[۰-۹]/g, (digit) => String(persian.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(arabic.indexOf(digit)))
    .replace(/\D/g, "");
}

export function OtpCodeInput({
  value,
  onChange,
  length = 5,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = useMemo(
    () => Array.from({ length }, (_, index) => value[index] || ""),
    [length, value],
  );

  const setDigit = (index: number, raw: string) => {
    const clean = normalizeOtp(raw);
    if (!clean) {
      const next = digits.slice();
      next[index] = "";
      onChange(next.join(""));
      return;
    }
    const next = digits.slice();
    next[index] = clean.at(-1) || "";
    onChange(next.join(""));
    refs.current[Math.min(index + 1, length - 1)]?.focus();
  };

  const onKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowLeft" && index < length - 1)
      refs.current[index + 1]?.focus();
    if (event.key === "ArrowRight" && index > 0)
      refs.current[index - 1]?.focus();
  };

  const onPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = normalizeOtp(event.clipboardData.getData("text")).slice(
      0,
      length,
    );
    if (!pasted) return;
    event.preventDefault();
    onChange(pasted);
    refs.current[Math.min(pasted.length, length) - 1]?.focus();
  };

  return (
    <fieldset dir="ltr">
      <legend className="mb-2 text-sm font-extrabold text-ink-700">
        کد تأیید
      </legend>
      <div className="flex justify-center gap-2 sm:gap-3">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(element) => {
              refs.current[index] = element;
            }}
            value={digit}
            onChange={(event) => setDigit(index, event.target.value)}
            onKeyDown={(event) => onKeyDown(index, event)}
            onPaste={onPaste}
            disabled={disabled}
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            aria-label={`رقم ${index + 1} کد تأیید`}
            className="h-12 w-11 rounded-xl border border-ink-200 bg-white text-center text-xl font-black tabular-nums text-ink-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 sm:h-14 sm:w-12"
            maxLength={1}
          />
        ))}
      </div>
    </fieldset>
  );
}

export function AuthAlert({
  type = "error",
  children,
}: {
  type?: "error" | "success" | "info";
  children: ReactNode;
}) {
  const styles = {
    error: "border-rose-200 bg-rose-50 text-rose-800",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    info: "border-brand-100 bg-brand-50 text-brand-800",
  };
  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm font-bold leading-7",
        styles[type],
      )}
    >
      {type === "success" ? (
        <CheckCircle2 className="mt-1 h-4 w-4 shrink-0" />
      ) : (
        <AlertCircle className="mt-1 h-4 w-4 shrink-0" />
      )}
      <span>{children}</span>
    </div>
  );
}

export function AuthSubmitButton({
  loading,
  children,
  disabled,
}: {
  loading?: boolean;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={disabled || loading}
      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-brand-500 to-brand-700 px-6 text-sm font-extrabold text-white shadow-[0_12px_28px_-12px_rgba(13,128,116,.8)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_34px_-14px_rgba(13,128,116,.85)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading && <LoaderCircle className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export function AuthDivider() {
  return (
    <div className="my-6 flex items-center gap-3 text-xs font-bold text-ink-400">
      <span className="h-px flex-1 bg-ink-100" />
      <span>یا</span>
      <span className="h-px flex-1 bg-ink-100" />
    </div>
  );
}
