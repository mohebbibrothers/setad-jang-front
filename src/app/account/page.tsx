import type { Metadata } from "next";
import { AccountDashboard } from "./AccountDashboard";

export const metadata: Metadata = {
  title: "حساب کاربری",
  description: "مدیریت پروفایل، امنیت و نشست‌های حساب بعثت مردم.",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return <AccountDashboard />;
}
