'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { useAuth } from '@/lib/use-auth';
import { formatPersianNumber } from '@/lib/utils';
import { SetBountyModal } from './SetBountyModal';
import { SubmitReportModal } from './SubmitReportModal';

/**
 * Right-rail actions for R4J detail:
 *  1. Set / update bounty (auth required, POST /r4j/criminals/{id}/bounty/)
 *  2. Submit an information report (auth required, POST /r4j/criminals/{id}/reports/)
 *  3. Share URL fallback
 *
 * Anonymous users see friendly login CTA with a return-to path.
 */

export function R4JActionsRail({
  criminal,
}: {
  criminal: {
    id: number;
    slug: string;
    fullName: string;
    photoUrl: string | null;
    totalBountyToman: number;
    bountiesCount: number;
  };
}) {
  const { user, isAuthenticated, loading } = useAuth();
  const [bountyOpen, setBountyOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const returnPath = `/r4j/${encodeURIComponent(criminal.slug)}`;
  const ready = !loading || !isAuthenticated;

  return (
    <>
      <div className="space-y-4">
        {/* Big bounty stat card */}
        <div className="rounded-[24px] border border-ink-100 bg-gradient-to-br from-accent-500 to-accent-700 text-white p-5 shadow-[0_18px_50px_-24px_rgba(229,82,20,.4)]">
          <p className="text-[11.5px] font-extrabold uppercase tracking-wider opacity-85 mb-1">مجموع جوایز مردمی</p>
          <p className="text-[24px] md:text-[28px] font-extrabold tabular-nums leading-none mb-1">
            {formatPersianNumber(criminal.totalBountyToman)}
            <span className="text-[13px] font-bold mr-1.5 opacity-85">تومان</span>
          </p>
          {criminal.bountiesCount > 0 && (
            <p className="text-[11.5px] text-white/85">
              از سوی {formatPersianNumber(criminal.bountiesCount)} تعهد جایزه فعال
            </p>
          )}
        </div>

        {/* Actions card */}
        <div className="rounded-[24px] border border-ink-100 bg-white p-5 space-y-2.5">
          <AnimatePresence mode="wait">
            {!ready ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="h-11 rounded-xl bg-ink-100 animate-pulse mb-2" />
                <div className="h-11 rounded-xl bg-ink-100 animate-pulse" />
              </motion.div>
            ) : !user ? (
              <motion.div key="anon" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                <p className="text-[13px] text-ink-600 leading-7 mb-3">
                  برای ثبت جایزه یا گزارش اطلاعات، ابتدا وارد حساب کاربری شوید.
                </p>
                <Link
                  href={`/auth/login?next=${encodeURIComponent(returnPath)}`}
                  className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-[13.5px] transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                  <span>ورود / ثبت‌نام</span>
                </Link>
              </motion.div>
            ) : (
              <motion.div key="cta" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-2.5">
                {/* Set bounty */}
                <button
                  type="button"
                  onClick={() => setBountyOpen(true)}
                  className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-xl bg-gradient-to-l from-accent-500 to-accent-700 hover:from-accent-600 hover:to-accent-800 text-white font-extrabold text-[14px] shadow-[0_10px_24px_-8px_rgba(229,82,20,.5)] transition-all active:scale-[0.98]"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
                  <span>ثبت / تغییر جایزه</span>
                </button>

                {/* Report info */}
                <button
                  type="button"
                  onClick={() => setReportOpen(true)}
                  className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-xl bg-white border-2 border-brand-500 text-brand-700 font-extrabold text-[14px] hover:bg-brand-50 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                  <span>گزارش اطلاعات تکمیلی</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Info card */}
        <div className="rounded-[20px] bg-ink-50 p-4 border border-ink-100">
          <p className="text-[11.5px] font-extrabold text-ink-500 uppercase tracking-wider mb-2">راهنمای مشارکت</p>
          <ul className="text-[12px] text-ink-700 leading-6 space-y-1.5">
            <li className="flex items-start gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="mt-1 shrink-0 text-brand-500"><polyline points="20 6 9 17 4 12"/></svg>
              <span>هر گزارش شما پس از بررسی ادمین اعمال می‌شود.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="mt-1 shrink-0 text-brand-500"><polyline points="20 6 9 17 4 12"/></svg>
              <span>مبلغ جایزه شما تعهد است، نه پرداخت — پس از تحقق شرایط دریافت می‌شود.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="mt-1 shrink-0 text-brand-500"><polyline points="20 6 9 17 4 12"/></svg>
              <span>هویت شما تا بررسی نهایی محرمانه می‌ماند.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Modals */}
      <SetBountyModal
        open={bountyOpen}
        onClose={() => setBountyOpen(false)}
        criminalId={criminal.id}
        criminalName={criminal.fullName}
      />
      <SubmitReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        criminalId={criminal.id}
        criminalName={criminal.fullName}
      />
    </>
  );
}
