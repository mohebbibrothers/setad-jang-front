import type { Metadata } from 'next';
import { Suspense } from 'react';
import { siteConfig } from '@/lib/site';
import { SignupForm } from './SignupForm';

export const metadata: Metadata = {
  title: `ثبت‌نام — ${siteConfig.name}`,
  robots: { index: false, follow: false },
};

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
