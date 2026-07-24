'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { useAuth } from '@/lib/use-auth';
import { revealContact } from '@/lib/kindness';
import { ApiError } from '@/lib/api';

/**
 * Reveals the owner's phone number for a listing.
 *   POST /api/v1/kindness-wall/listings/{slug}/reveal-contact/
 * Backend audits every reveal call so we render a small privacy
 * disclaimer above the button.
 */
export function ContactRevealCard({
  slug, available, isNeed,
}: { slug: string; available: boolean; isNeed: boolean }) {
  const { user, isAuthenticated, loading } = useAuth();
  const [phone, setPhone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const ready = !loading || !isAuthenticated;
  const returnPath = `/kindness-wall/${encodeURIComponent(slug)}`;
  const accent = isNeed ? 'rose' : 'brand';

  async function reveal() {
    if (busy) return;
    setBusy(true); setErr(null);
    try {
      const res = await revealContact(slug);
      setPhone(res.phone);
    } catch (e) {
      if (e instanceof ApiError) setErr(e.message || 'دریافت اطلاعات تماس با خطا مواجه شد.');
      else setErr('ارتباط با سرور برقرار نشد.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`rounded-[24px] border p-5 md:p-6 shadow-[0_18px_50px_-24px_rgba(11,53,48,.20)] ${
      accent === 'rose' ? 'bg-gradient-to-br from-rose-50 to-white border-rose-100' : 'bg-gradient-to-br from-brand-50 to-white border-brand-100'
    }`}>
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent === 'rose' ? 'bg-rose-500 text-white' : 'bg-brand-500 text-white'}`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
        </span>
        <h2 className="text-[15px] font-extrabold text-ink-900">تماس با ثبت‌کننده</h2>
      </div>

      {!available ? (
        <p className="text-[12.5px] text-ink-500 leading-6">
          برای این آگهی هنوز اطلاعات تماس ثبت نشده است.
        </p>
      ) : (
        <AnimatePresence mode="wait">
          {!ready ? (
            <div className="h-11 rounded-xl bg-ink-100 animate-pulse" />
          ) : phone ? (
            <motion.div key="revealed" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <a
                href={`tel:${phone.replace(/[^\d+]/g, '')}`}
                dir="ltr"
                className="w-full flex items-center justify-center gap-2 h-14 rounded-xl bg-white ring-1 ring-ink-200 text-ink-900 text-[18px] font-extrabold tabular-nums shadow-inner hover:bg-ink-50 transition-colors"
              >
                {phone}
              </a>
              <p className="text-[11px] text-ink-500 text-center">
                برای تماس مستقیم بر روی شماره تلفن ضربه بزنید.
              </p>
            </motion.div>
          ) : !user ? (
            <motion.div key="anon" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <p className="text-[12.5px] text-ink-600 leading-6">
                برای دیدن شماره تماس ثبت‌کننده، ابتدا وارد حساب کاربری شوید.
              </p>
              <Link href={`/auth/login?next=${encodeURIComponent(returnPath)}`}
                className={`w-full inline-flex items-center justify-center gap-2 h-11 rounded-xl text-white font-extrabold text-[13.5px] transition-colors ${
                  accent === 'rose' ? 'bg-rose-500 hover:bg-rose-600' : 'bg-brand-500 hover:bg-brand-600'
                }`}>
                ورود / ثبت‌نام
              </Link>
            </motion.div>
          ) : (
            <motion.div key="cta" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              {err && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 text-rose-700 text-[12px] font-bold" role="alert">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <span>{err}</span>
                </div>
              )}
              <button
                type="button"
                onClick={reveal}
                disabled={busy}
                className={`w-full inline-flex items-center justify-center gap-2 h-11 rounded-xl text-white font-extrabold text-[13.5px] transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  accent === 'rose' ? 'bg-rose-500 hover:bg-rose-600' : 'bg-brand-500 hover:bg-brand-600'
                }`}
              >
                {busy ? 'در حال دریافت…' : 'نمایش شماره تماس'}
              </button>
              <p className="text-[10.5px] text-ink-400 text-center leading-5">
                افشای اطلاعات تماس در سرور ثبت و حسابرسی می‌شود.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
