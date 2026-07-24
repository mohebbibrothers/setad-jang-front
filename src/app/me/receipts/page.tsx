'use client';

import { useEffect, useState } from 'react';
import { myReceipts, type MadadkarReceipt } from '@/lib/madadkar';
import { ApiError } from '@/lib/api';
import { formatPersianNumber } from '@/lib/utils';
import Link from 'next/link';

export default function MyReceiptsPage() {
  const [items, setItems] = useState<MadadkarReceipt[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await myReceipts({ page_size: 30 });
        if (alive) setItems(res.results ?? []);
      } catch (e) { if (alive) setErr(e instanceof ApiError ? e.message : 'خطا در دریافت رسیدها'); }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <section>
      <h1 className="text-[20px] md:text-[22px] font-extrabold text-ink-900 mb-4">رسیدهای من</h1>
      {items === null && !err ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-20 rounded-2xl bg-ink-100 animate-pulse" />)}</div>
      ) : err ? (
        <div className="rounded-2xl bg-rose-50 text-rose-700 p-4 text-[13px] font-bold">{err}</div>
      ) : items?.length === 0 ? (
        <div className="rounded-2xl bg-white ring-1 ring-ink-100 p-8 text-center">
          <p className="text-[14px] font-extrabold text-ink-800">هنوز رسیدی صادر نشده است.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items!.map((r) => (
            <li key={r.id} className="rounded-2xl bg-white ring-1 ring-ink-100 p-4 flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-0">
                <Link href={`/madadkar/${encodeURIComponent(r.campaign_slug)}`} className="text-[14px] font-extrabold text-ink-900 hover:text-brand-700 truncate block">
                  {r.campaign_title}
                </Link>
                <p className="text-[11.5px] text-ink-500 mt-0.5 tabular-nums">
                  کد رسید: <span dir="ltr" className="font-mono">{r.code}</span>
                  {r.paid_at && <> · {new Date(r.paid_at).toLocaleDateString('fa-IR')}</>}
                </p>
              </div>
              <span className="text-[14.5px] font-extrabold text-ink-900 tabular-nums shrink-0">
                {formatPersianNumber(r.amount_toman)} تومان
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
