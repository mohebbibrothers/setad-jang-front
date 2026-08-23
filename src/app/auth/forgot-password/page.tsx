import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthUI";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata: Metadata = {
  title: "بازیابی رمز عبور",
  description: "بازیابی امن رمز عبور حساب بعثت مردم با کد یکبارمصرف.",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="بازیابی حساب"
      title="رمز عبور را دوباره تنظیم کنید"
      description="شناسه‌ی حساب را وارد کنید؛ اگر حسابی برای آن وجود داشته باشد، کد بازیابی ارسال می‌شود."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
