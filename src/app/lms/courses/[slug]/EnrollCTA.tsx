'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { useAuth } from '@/lib/use-auth';
import { enrollInCourse } from '@/lib/lms';
import { ApiError } from '@/lib/api';

/**
 * Course enroll CTA — auth-gated.
 * POST /api/v1/lms/courses/{slug}/enroll/
 * On success we show a success card + a link to the first lesson (or
 * the enrollments dashboard, when built out).
 */
export function EnrollCTA({ slug, courseTitle }: { slug: string; courseTitle: string }) {
  const { user, isAuthenticated, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok,  setOk]  = useState<null | { enrollmentId: number }>(null);
  const ready = !loading || !isAuthenticated;
  const returnPath = `/lms/courses/${encodeURIComponent(slug)}`;

  async function submit() {
    if (busy) return;
    setBusy(true); setErr(null);
    try {
      const en = await enrollInCourse(slug);
      setOk({ enrollmentId: en.id });
    } catch (e) {
      if (e instanceof ApiError) setErr(e.message || 'ثبت‌نام با خطا مواجه شد.');
      else setErr('ارتباط با سرور برقرار نشد.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-[24px] border border-ink-100 bg-gradient-to-br from-brand-600 to-brand-800 text-white p-5 md:p-6 shadow-[0_24px_60px_-30px_rgba(11,53,48,.4)]">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.7 4 3 6 3s6-1.3 6-3v-5"/></svg>
        </span>
        <div>
          <h2 className="text-[15px] font-extrabold leading-none">ثبت‌نام در دوره</h2>
          <p className="text-[11.5px] text-white/70 mt-1">رایگان · مادام‌العمر</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!ready ? (
          <div key="loading" className="h-11 rounded-xl bg-white/10 animate-pulse" />
        ) : ok ? (
          <motion.div key="ok" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-white/15 ring-1 ring-white/15">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="text-mint-400"><polyline points="20 6 9 17 4 12"/></svg>
              <p className="text-[13px] font-extrabold">با موفقیت ثبت‌نام شدید</p>
            </div>
            <Link href="/me/enrollments" className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-white text-brand-700 font-extrabold text-[13.5px] hover:bg-brand-50 transition-colors">
              <span>رفتن به دوره‌های من</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            </Link>
          </motion.div>
        ) : !user ? (
          <motion.div key="anon" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <p className="text-[12.5px] text-white/85 leading-6">
              برای ثبت‌نام در «{courseTitle}»، ابتدا وارد حساب کاربری شوید.
            </p>
            <Link href={`/auth/login?next=${encodeURIComponent(returnPath)}`} className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-mint-500 hover:bg-mint-600 text-white font-extrabold text-[13.5px] transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
              <span>ورود / ثبت‌نام</span>
            </Link>
          </motion.div>
        ) : (
          <motion.div key="cta" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            {err && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/20 text-white text-[12px] font-bold" role="alert">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>{err}</span>
              </div>
            )}
            <button
              type="button"
              onClick={submit}
              disabled={busy}
              className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-xl bg-white text-brand-700 font-extrabold text-[14.5px] hover:bg-brand-50 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_10px_24px_-8px_rgba(255,255,255,.35)]"
            >
              {busy ? (
                <>
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3"/><path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
                  در حال ثبت‌نام…
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/></svg>
                  ثبت‌نام و شروع
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
