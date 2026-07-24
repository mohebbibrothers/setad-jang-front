'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { myParticipations, type MadadkarParticipation } from '@/lib/madadkar';
import { ApiError } from '@/lib/api';
import { formatPersianNumber } from '@/lib/utils';

const STATUS: Record<string, { label: string; tone: string }> = {
  pending_payment: { label: 'در انتظار پرداخت', tone: 'bg-amber-100 text-amber-700' },
  paid:            { label: 'پرداخت‌شده',       tone: 'bg-mint-500/15 text-mint-700' },
  failed:          { label: 'ناموفق',           tone: 'bg-rose-100 text-rose-700' },
  expired:         { label: 'منقضی',            tone: 'bg-ink-100 text-ink-600' },
  refunded:        { label: 'بازپرداخت‌شده',    tone: 'bg-violet-100 text-violet-700' },
};

export default function MyParticipationsPage() {
  const [items, setItems] = useState<MadadkarParticipation[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await myParticipations({ page_size: 30 });
        if (alive) setItems(res.results ?? []);
      } catch (e) {
        if (alive) setErr(e instanceof ApiError ? e.message : 'خطا در دریافت مشارکت‌ها');
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <section>
      <h1 className="text-[20px] md:text-[22px] font-extrabold text-ink-900 mb-4">مشارکت‌های من</h1>
      {items === null && !err ? (
        <Skeleton />
      ) : err ? (
        <div className="rounded-2xl bg-rose-50 text-rose-700 p-4 text-[13px] font-bold">{err}</div>
      ) : items?.length === 0 ? (
        <EmptyBox />
      ) : (
        <ul className="space-y-3">
          {items!.map((p) => {
            const st = STATUS[p.status] ?? { label: p.status_display ?? p.status, tone: 'bg-ink-100 text-ink-700' };
            return (
              <li key={p.id} className="rounded-2xl bg-white ring-1 ring-ink-100 p-4 flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-0">
                  <Link href={`/madadkar/${encodeURIComponent(p.campaign.slug)}`} className="text-[14.5px] font-extrabold text-ink-900 hover:text-brand-700 truncate block">
                    {p.campaign.title}
                  </Link>
                  <p className="text-[11.5px] text-ink-500 mt-0.5 tabular-nums">
                    {formatPersianNumber(p.share_count)} سهم · {formatPersianNumber(p.total_amount)} تومان
                  </p>
                </div>
                <span className={`inline-flex items-center h-7 px-3 rounded-full text-[11.5px] font-extrabold ${st.tone}`}>
                  {st.label}
                </span>
                {p.payment?.gateway_url && p.status === 'pending_payment' && (
                  <a href={p.payment.gateway_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-brand-500 text-white text-[11.5px] font-extrabold hover:bg-brand-600 transition-colors">
                    ادامه پرداخت
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function Skeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => <div key={i} className="h-20 rounded-2xl bg-ink-100 animate-pulse" />)}
    </div>
  );
}

function EmptyBox() {
  return (
    <div className="rounded-2xl bg-white ring-1 ring-ink-100 p-8 text-center">
      <p className="text-[14px] font-extrabold text-ink-800 mb-2">هنوز در هیچ حرکتی مشارکت نکرده‌اید</p>
      <Link href="/#warfund" className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-brand-500 text-white text-[13px] font-extrabold hover:bg-brand-600 transition-colors">
        مشاهده حرکت‌های فعال
      </Link>
    </div>
  );
}
