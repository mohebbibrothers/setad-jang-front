import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthUI";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = {
  title: "ساخت حساب کاربری",
  description: "ثبت‌نام در بعثت مردم با ایمیل یا شماره موبایل و کد تأیید.",
  robots: { index: false, follow: false },
};

export default function SignupPage() {
  return (
    <AuthShell
      eyebrow="شروع همراهی"
      title="به جمع همراهان بعثت بپیوندید"
      description="شناسه‌ی خود را تأیید کنید و در یک فرایند کوتاه، حساب امن خود را بسازید."
    >
      <Suspense
        fallback={<div className="h-96 animate-pulse rounded-2xl bg-ink-50" />}
      >
        <SignupForm />
      </Suspense>
    </AuthShell>
  );
}
