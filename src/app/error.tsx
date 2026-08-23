'use client';

import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-lg text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <AlertTriangle className="h-10 w-10" />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-ink-900 md:text-3xl">خطایی رخ داد</h1>
        <p className="mt-3 leading-8 text-ink-600">
          متأسفانه در نمایش این صفحه مشکلی پیش آمده است. لطفاً دوباره تلاش کنید.
        </p>
        {error?.digest && <p className="ltr mt-2 text-xs text-ink-400">code: {error.digest}</p>}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button onClick={() => reset()} className="btn-primary btn-md">
            <RefreshCw className="h-4 w-4" /> تلاش دوباره
          </button>
          <Link href="/" className="btn-outline btn-md">
            <Home className="h-4 w-4" /> بازگشت به خانه
          </Link>
        </div>
      </div>
    </section>
  );
}
