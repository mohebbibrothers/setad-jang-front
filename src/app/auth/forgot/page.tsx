import type { Metadata } from 'next';
import { Suspense } from 'react';
import { siteConfig } from '@/lib/site';
import { ForgotForm } from './ForgotForm';

export const metadata: Metadata = {
  title: `بازیابی رمز — ${siteConfig.name}`,
  robots: { index: false, follow: false },
};

export default function ForgotPage() {
  return (
    <Suspense>
      <ForgotForm />
    </Suspense>
  );
}
