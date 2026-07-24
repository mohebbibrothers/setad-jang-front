'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { myEnrollments, type LMSEnrollment } from '@/lib/lms';
import { ApiError } from '@/lib/api';
import { formatPersianNumber } from '@/lib/utils';

export default function MyEnrollmentsPage() {
  const [items, setItems] = useState<LMSEnrollment[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await myEnrollments({ page_size: 30 });
        if (alive) setItems(res.results ?? []);
      } catch (e) { if (alive) setErr(e instanceof ApiError ? e.message : 'خطا در دریافت دوره‌ها'); }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <section>
      <h1 className="text-[20px] md:text-[22px] font-extrabold text-ink-900 mb-4">دوره‌های من</h1>
      {items === null && !err ? (
        <div className="grid gap-3">{[0, 1, 2].map((i) => <div key={i} className="h-24 rounded-2xl bg-ink-100 animate-pulse" />)}</div>
      ) : err ? (
        <div className="rounded-2xl bg-rose-50 text-rose-700 p-4 text-[13px] font-bold">{err}</div>
      ) : items?.length === 0 ? (
        <div className="rounded-2xl bg-white ring-1 ring-ink-100 p-8 text-center">
          <p className="text-[14px] font-extrabold text-ink-800 mb-2">هنوز در دوره‌ای ثبت‌نام نکرده‌اید</p>
          <Link href="/#education" className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-brand-500 text-white text-[13px] font-extrabold hover:bg-brand-600 transition-colors">مشاهده دوره‌ها</Link>
        </div>
      ) : (
        <ul className="grid gap-3">
          {items!.map((e) => (
            <li key={e.id} className="rounded-2xl bg-white ring-1 ring-ink-100 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-0">
                  <Link href={`/lms/courses/${encodeURIComponent(e.course.slug)}`} className="text-[14.5px] font-extrabold text-ink-900 hover:text-brand-700 truncate block">
                    {e.course.title}
                  </Link>
                  <p className="text-[11.5px] text-ink-500 mt-0.5">وضعیت: {STATUS[e.status] ?? e.status}</p>
                </div>
                <span className="text-[14px] font-extrabold text-brand-700 tabular-nums">
                  ٪{formatPersianNumber(Math.round(e.progress_percent))}
                </span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-ink-100 overflow-hidden">
                <div className="h-full bg-gradient-to-l from-brand-400 to-brand-600" style={{ width: `${Math.max(0, Math.min(100, e.progress_percent))}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const STATUS: Record<string, string> = {
  active: 'فعال', completed: 'تکمیل‌شده', canceled: 'لغوشده', locked: 'قفل‌شده',
};
