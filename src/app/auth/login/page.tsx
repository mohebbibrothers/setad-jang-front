import type { Metadata } from 'next';
import { Suspense } from 'react';
import { siteConfig } from '@/lib/site';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = {
  title: `ورود — ${siteConfig.name}`,
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
