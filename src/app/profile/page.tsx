import type { Metadata } from 'next';
import { ProfileApp } from '@/components/profile/ProfileApp';

/**
 * /profile — حساب کاربری
 *
 * صفحه‌ی کاملاً خصوصی: داده از endpointهای احرازشده‌ی /api/v1/auth/*
 * خوانده می‌شود و هیچ تکه‌ای از آن نباید ایندکس شود — robots: noindex.
 * خودِ رندر کلاینتی است (توکن‌ها سمت مرورگرند)؛ پوسته‌ی سایت (Header/
 * Footer) از RootLayout می‌آید.
 */

const TITLE = 'حساب کاربری من — بعثت مردم';
const DESCRIPTION =
  'مشاهده و ویرایش اطلاعات حساب، مدیریت شناسه‌های ورود (ایمیل و موبایل)، تغییر رمز عبور و کنترل نشست‌ها و دستگاه‌ها در سامانه بعثت مردم.';

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  robots: { index: false, follow: false },
};

export default function ProfilePage() {
  return <ProfileApp />;
}
