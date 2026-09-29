import Link from 'next/link';
import { Compass } from 'lucide-react';

export default function LessonNotFound() {
  return (
    <main className="section-y">
      <div className="container-edge flex flex-col items-center py-16 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-600">
          <Compass className="h-7 w-7" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-[22px] font-black text-ink-900">این جلسه پیدا نشد</h1>
        <p className="mt-2 max-w-sm text-[13px] leading-7 text-ink-500">
          جلسه‌ای با این نشانی در سیلابوس این کلاس وجود ندارد؛ شاید جابه‌جا یا بازنشانی شده است.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/lms"
            className="inline-flex h-11 items-center rounded-full bg-mint-500 px-6 text-[13px] font-extrabold text-ink-950 shadow-[0_10px_24px_-10px_rgba(20,184,166,.6)] transition hover:bg-mint-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-300"
          >
            رفتن به قرارگاه آموزشی
          </Link>
        </div>
      </div>
    </main>
  );
}
