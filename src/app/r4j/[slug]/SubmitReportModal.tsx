'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { submitReport } from '@/lib/r4j';
import { ApiError } from '@/lib/api';

/**
 * Modal: user submits a supplementary intel report about a criminal.
 * Backend endpoint: POST /api/v1/r4j/criminals/{id}/reports/
 *   - multipart when attachments present
 *   - at least one of {notes, field_changes, alias/phone/social suggestions} required
 *
 * MVP surface: `notes` + `attachments` — the advanced field-changes
 * editor is intentionally kept for a future release so we don't ship a
 * confusing wall of inputs. The backend accepts empty suggestion lists.
 */

const NOTES_MAX = 4000;
const ATTACH_MAX = 5;
const ATTACH_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const ATTACH_MAX_SIZE = 8 * 1024 * 1024; // 8 MiB

export function SubmitReportModal({
  open, onClose, criminalId, criminalName,
}: {
  open: boolean;
  onClose: () => void;
  criminalId: number;
  criminalName: string;
}) {
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess]   = useState<null | { id: number }>(null);
  const [mounted, setMounted]   = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (open) { setNotes(''); setFiles([]); setErrorMsg(null); setSuccess(null); }
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

  function addFiles(list: FileList | File[]) {
    const incoming = Array.from(list);
    const combined: File[] = [];
    for (const f of [...files, ...incoming]) {
      if (combined.length >= ATTACH_MAX) break;
      if (!ATTACH_TYPES.includes(f.type)) continue;
      if (f.size > ATTACH_MAX_SIZE) continue;
      if (combined.some((x) => x.name === f.name && x.size === f.size)) continue;
      combined.push(f);
    }
    setFiles(combined);
  }

  async function submit() {
    if (submitting) return;
    const cleaned = notes.trim();
    if (!cleaned && files.length === 0) {
      setErrorMsg('لطفاً یادداشتی بنویسید یا حداقل یک سند پیوست کنید.');
      return;
    }
    if (cleaned.length > NOTES_MAX) {
      setErrorMsg(`متن یادداشت نباید بیش از ${NOTES_MAX.toLocaleString('fa-IR')} کاراکتر باشد.`);
      return;
    }
    setSubmitting(true); setErrorMsg(null);
    try {
      const res = await submitReport(criminalId, { notes: cleaned, attachments: files });
      setSuccess({ id: res.id });
    } catch (err) {
      if (err instanceof ApiError) setErrorMsg(err.message || 'ثبت گزارش با خطا مواجه شد.');
      else setErrorMsg('ارتباط با سرور برقرار نشد.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="report-root"
          role="dialog"
          aria-modal="true"
          aria-label={`ثبت گزارش درباره ${criminalName}`}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-ink-900/70 backdrop-blur-md p-2 sm:p-6"
          onClick={(e) => { if (e.target === e.currentTarget && !submitting) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="relative w-full max-w-[540px] max-h-[92vh] bg-white rounded-t-[28px] sm:rounded-[28px] shadow-[0_40px_80px_-25px_rgba(0,0,0,.55)] flex flex-col overflow-hidden"
          >
            <div className="relative bg-gradient-to-l from-brand-500 to-brand-700 text-white p-5 md:p-6 shrink-0">
              <button type="button" onClick={() => !submitting && onClose()} aria-label="بستن"
                className="absolute top-3 left-3 w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center backdrop-blur transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
              <p className="text-[11.5px] uppercase tracking-wider font-extrabold opacity-85 mb-1">جایزه‌ای برای عدالت</p>
              <h2 className="text-[18px] md:text-[20px] font-extrabold leading-tight">
                گزارش اطلاعات درباره «{criminalName}»
              </h2>
              <p className="text-[12.5px] text-white/85 mt-2 leading-6">
                هر سرنخ، سند یا یادداشت تکمیلی شما پس از بررسی ادمین به پرونده اضافه می‌شود.
              </p>
            </div>

            {success ? (
              <div className="p-6 text-center">
                <div className="mx-auto mb-3 w-14 h-14 rounded-2xl bg-mint-500 text-white flex items-center justify-center shadow-[0_10px_24px_-8px_rgba(37,197,186,.5)]">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <p className="text-[15px] font-extrabold text-ink-900">گزارش شما ثبت شد</p>
                <p className="text-[13px] text-ink-600 mt-2">
                  کد پیگیری: <b className="tabular-nums">#{success.id}</b>
                  <br />
                  می‌توانید وضعیت گزارش خود را در پیشخوان کاربری پیگیری کنید.
                </p>
                <button type="button" onClick={onClose}
                  className="mt-5 inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-[13.5px] transition-colors">
                  بستن
                </button>
              </div>
            ) : (
              <div className="p-5 md:p-6 space-y-4 overflow-y-auto flex-1">
                {/* Notes */}
                <div>
                  <label className="text-[12.5px] font-extrabold text-ink-700 flex items-center justify-between mb-1.5">
                    <span>یادداشت / سرنخ</span>
                    <span className="text-[11px] text-ink-400 tabular-nums font-medium">
                      {notes.length.toLocaleString('fa-IR')} / {NOTES_MAX.toLocaleString('fa-IR')}
                    </span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => { setNotes(e.target.value.slice(0, NOTES_MAX)); setErrorMsg(null); }}
                    rows={5}
                    dir="rtl"
                    placeholder="متن یادداشت یا سرنخ خود را با جزئیات بنویسید…"
                    className="w-full px-4 py-3 rounded-xl bg-ink-50 border border-ink-200 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 text-[13.5px] text-ink-800 leading-7 resize-y min-h-[120px]"
                  />
                </div>

                {/* File dropzone */}
                <div>
                  <label className="text-[12.5px] font-extrabold text-ink-700 block mb-1.5">
                    اسناد پیوست (اختیاری — تا {ATTACH_MAX} فایل)
                  </label>
                  <label className="relative block w-full rounded-2xl border-2 border-dashed border-ink-200 hover:border-brand-400 hover:bg-brand-50/50 cursor-pointer transition-all px-4 py-5 text-center">
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp,application/pdf,.jpg,.jpeg,.png,.webp,.pdf"
                      className="sr-only"
                      onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.currentTarget.value = ''; }}
                    />
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="w-10 h-10 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      </span>
                      <p className="text-[12.5px] font-extrabold text-ink-700">فایل را بکشید یا کلیک کنید</p>
                      <p className="text-[10.5px] text-ink-400">JPG، PNG، WEBP یا PDF · حداکثر ۸ مگابایت</p>
                    </div>
                  </label>

                  {files.length > 0 && (
                    <ul className="mt-3 space-y-1.5">
                      {files.map((f, i) => (
                        <li key={`${f.name}-${i}`} className="flex items-center gap-2 p-2.5 rounded-xl bg-ink-50">
                          <span className="w-8 h-8 rounded-lg bg-white text-brand-600 flex items-center justify-center shrink-0">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-extrabold text-ink-800 truncate">{f.name}</p>
                            <p className="text-[10.5px] text-ink-500 tabular-nums">{(f.size / 1024).toFixed(0)} KB</p>
                          </div>
                          <button type="button" aria-label={`حذف ${f.name}`}
                            onClick={() => setFiles((cur) => cur.filter((_, j) => j !== i))}
                            className="w-8 h-8 rounded-full text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-colors">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {errorMsg && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 text-rose-700 text-[12.5px] font-bold" role="alert">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="button"
                  disabled={submitting}
                  onClick={submit}
                  className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-xl bg-gradient-to-l from-brand-500 to-brand-700 text-white font-extrabold text-[14.5px] transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] shadow-[0_10px_24px_-8px_rgba(13,128,116,.5)]"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3"/><path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
                      در حال ارسال…
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                      ارسال گزارش
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
