'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { setBounty } from '@/lib/r4j';
import { ApiError } from '@/lib/api';
import { formatPersianNumber } from '@/lib/utils';

/**
 * Modal: user pledges (or updates) a bounty amount for a criminal.
 * Backend: POST /api/v1/r4j/criminals/{id}/bounty/ with { amount_toman }.
 * Backend rule: amount_toman >= R4J_BOUNTY_MIN_TOMAN (from settings).
 * The 400 error message from the backend is surfaced verbatim to the
 * user because it's already the authoritative, localised source.
 */

const QUICK_AMOUNTS = [50_000, 100_000, 500_000, 1_000_000, 5_000_000, 10_000_000];
const DEFAULT_MIN = 10_000;

export function SetBountyModal({
  open, onClose, criminalId, criminalName,
}: {
  open: boolean;
  onClose: () => void;
  criminalId: number;
  criminalName: string;
}) {
  const [amount, setAmount] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess]   = useState<null | { total: number }>(null);
  const [mounted, setMounted]   = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Reset on open
  useEffect(() => {
    if (open) {
      setAmount(0);
      setErrorMsg(null);
      setSuccess(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !submitting) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, submitting, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  async function submit() {
    if (submitting) return;
    if (!amount || amount < DEFAULT_MIN) {
      setErrorMsg(`حداقل مبلغ جایزه ${formatPersianNumber(DEFAULT_MIN)} تومان است.`);
      return;
    }
    setSubmitting(true); setErrorMsg(null);
    try {
      const res = await setBounty(criminalId, amount);
      setSuccess({ total: res.amount_toman });
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message || 'ثبت جایزه با خطا مواجه شد.');
      } else {
        setErrorMsg('ارتباط با سرور برقرار نشد.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="bounty-root"
          role="dialog"
          aria-modal="true"
          aria-label={`ثبت جایزه برای ${criminalName}`}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-ink-900/70 backdrop-blur-md p-2 sm:p-6"
          onClick={(e) => { if (e.target === e.currentTarget && !submitting) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit   ={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="relative w-full max-w-[500px] bg-white rounded-t-[28px] sm:rounded-[28px] shadow-[0_40px_80px_-25px_rgba(0,0,0,.55)] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="relative bg-gradient-to-l from-accent-500 to-accent-700 text-white p-5 md:p-6">
              <button
                type="button"
                onClick={() => !submitting && onClose()}
                aria-label="بستن"
                className="absolute top-3 left-3 w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center backdrop-blur transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
              <p className="text-[11.5px] uppercase tracking-wider font-extrabold opacity-85 mb-1">جایزه‌ای برای عدالت</p>
              <h2 className="text-[18px] md:text-[20px] font-extrabold leading-tight">
                ثبت جایزه برای «{criminalName}»
              </h2>
              <p className="text-[12.5px] text-white/85 mt-2 leading-6">
                این مبلغ یک تعهد ثبت‌شده است، نه پرداخت. پس از تحقق شرایط دریافت، اقدام می‌شود.
              </p>
            </div>

            {/* Body */}
            <div className="p-5 md:p-6 space-y-5">
              {success ? (
                <div className="text-center py-4">
                  <div className="mx-auto mb-3 w-14 h-14 rounded-2xl bg-mint-500 text-white flex items-center justify-center shadow-[0_10px_24px_-8px_rgba(37,197,186,.5)]">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <p className="text-[15px] font-extrabold text-ink-900">تعهد جایزه ثبت شد</p>
                  <p className="text-[13px] text-ink-600 mt-2">مبلغ ثبت‌شده: <b className="tabular-nums">{formatPersianNumber(success.total)} تومان</b></p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-5 inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-[13.5px] transition-colors"
                  >
                    بستن
                  </button>
                </div>
              ) : (
                <>
                  {/* Amount input */}
                  <div>
                    <label className="text-[12.5px] font-extrabold text-ink-700 block mb-2">مبلغ جایزه (تومان)</label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        dir="ltr"
                        value={amount ? amount.toLocaleString('en-US') : ''}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '');
                          const n = digits ? parseInt(digits, 10) : 0;
                          setAmount(Number.isFinite(n) ? n : 0);
                          setErrorMsg(null);
                        }}
                        placeholder="0"
                        className="w-full h-14 pr-16 pl-4 rounded-xl bg-ink-50 border border-ink-200 text-[20px] font-extrabold text-ink-900 tabular-nums outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-100 text-right"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-extrabold text-ink-500">تومان</span>
                    </div>
                    {amount > 0 && (
                      <p className="mt-1.5 text-[11.5px] text-ink-500 text-right">
                        معادل: <span className="tabular-nums font-bold">{formatPersianNumber(amount * 10)} ریال</span>
                      </p>
                    )}
                  </div>

                  {/* Quick amounts */}
                  <div>
                    <p className="text-[11.5px] font-extrabold text-ink-500 mb-2">مبالغ پیشنهادی</p>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_AMOUNTS.map((a) => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => { setAmount(a); setErrorMsg(null); }}
                          className={`inline-flex items-center h-9 px-3.5 rounded-full text-[12px] font-extrabold tabular-nums transition-all ${
                            amount === a
                              ? 'bg-accent-500 text-white shadow-[0_6px_14px_-4px_rgba(229,82,20,.5)]'
                              : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
                          }`}
                        >
                          {formatPersianNumber(a)} تومان
                        </button>
                      ))}
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 text-rose-700 text-[12.5px] font-bold" role="alert">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={submitting || !amount}
                    onClick={submit}
                    className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-xl bg-gradient-to-l from-accent-500 to-accent-700 text-white font-extrabold text-[14.5px] transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] shadow-[0_10px_24px_-8px_rgba(229,82,20,.5)]"
                  >
                    {submitting ? (
                      <>
                        <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3"/><path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
                        در حال ثبت…
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
                        ثبت تعهد جایزه
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
