import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthUI";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "ورود به حساب کاربری",
  description: "ورود امن به حساب بعثت مردم با رمز عبور یا کد یکبارمصرف.",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="حساب کاربری"
      title="خوش آمدید؛ وارد حساب خود شوید"
      description="با ایمیل یا شماره موبایل وارد شوید. برای امنیت بیشتر می‌توانید از کد یکبارمصرف استفاده کنید."
    >
      <Suspense
        fallback={<div className="h-80 animate-pulse rounded-2xl bg-ink-50" />}
      >
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
