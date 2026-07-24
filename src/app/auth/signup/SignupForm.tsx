'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { signupRequest, signupVerify, OTP_CODE_LENGTH } from '@/lib/auth';
import { ApiError } from '@/lib/api';

type Stage = 'identifier' | 'otp-code';

export function SignupForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp?.get('next') || '/';

  const [stage, setStage] = useState<Stage>('identifier');
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const safeReturn = (p: string) => (p.startsWith('/') && !p.startsWith('//')) ? p : '/';

  async function request(e: React.FormEvent) {
    e.preventDefault(); if (busy) return;
    if (!identifier.trim()) return;
    setBusy(true); setErr(null);
    try {
      const res = await signupRequest(identifier.trim());
      setStage('otp-code');
      setCooldown(res.cooldown_seconds ?? 60);
    } catch (e) {
      setErr(e instanceof ApiError ? (e.message || 'ارسال کد ناموفق بود.') : 'ارتباط با سرور برقرار نشد.');
    } finally { setBusy(false); }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault(); if (busy) return;
    if (code.length < OTP_CODE_LENGTH) { setErr('کد کامل نیست.'); return; }
    if (password.length < 8) { setErr('رمز عبور باید حداقل ۸ کاراکتر باشد.'); return; }
    setBusy(true); setErr(null);
    try {
      await signupVerify({ identifier: identifier.trim(), code, password });
      router.replace(safeReturn(next));
      router.refresh();
    } catch (e) {
      setErr(e instanceof ApiError ? (e.message || 'ثبت‌نام با خطا مواجه شد.') : 'ارتباط با سرور برقرار نشد.');
    } finally { setBusy(false); }
  }

  return (
    <div className="bg-white text-ink-900 rounded-[28px] p-6 md:p-8 shadow-[0_40px_100px_-25px_rgba(0,0,0,.55)]">
      <div className="text-center mb-6">
        <h1 className="text-[22px] font-extrabold">ثبت‌نام در بعثت مردم</h1>
        <p className="text-[12.5px] text-ink-500 mt-1">
          {stage === 'identifier'
            ? 'ایمیل یا شماره تلفن خود را وارد کنید تا کد تأیید ارسال شود.'
            : `کد ${OTP_CODE_LENGTH} رقمی ارسال شد.`}
        </p>
      </div>

      <AnimatePresence>
        {err && (
          <motion.div key="err" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 text-rose-700 text-[12.5px] font-bold mb-4"
            role="alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span>{err}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {stage === 'identifier' ? (
        <form onSubmit={request} className="space-y-3">
          <input
            type="text"
            placeholder="ایمیل یا شماره تلفن"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full h-12 px-4 rounded-xl bg-ink-50 border border-ink-200 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 text-[14px] text-ink-900"
            autoComplete="username"
          />
          <button type="submit" disabled={busy} className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-xl bg-gradient-to-l from-brand-500 to-brand-700 text-white font-extrabold text-[14.5px] transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] shadow-[0_10px_24px_-8px_rgba(13,128,116,.5)]">
            {busy ? <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3"/><path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg> : null}
            ارسال کد
          </button>
        </form>
      ) : (
        <form onSubmit={verify} className="space-y-3">
          <p className="text-[12.5px] text-ink-600 leading-6 text-center">
            کد ارسال شده به <b className="text-ink-900">{identifier}</b>
          </p>
          <input
            type="text" inputMode="numeric" dir="ltr" maxLength={OTP_CODE_LENGTH}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, OTP_CODE_LENGTH))}
            placeholder={'0'.repeat(OTP_CODE_LENGTH)}
            className="w-full h-14 px-4 rounded-xl bg-ink-50 border border-ink-200 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 text-[24px] font-extrabold tabular-nums text-center tracking-[0.5em]"
          />
          <input
            type="password"
            placeholder="یک رمز عبور امن (حداقل ۸ کاراکتر)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-12 px-4 rounded-xl bg-ink-50 border border-ink-200 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 text-[14px] text-ink-900"
            autoComplete="new-password"
          />
          <button type="submit" disabled={busy} className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-xl bg-gradient-to-l from-brand-500 to-brand-700 text-white font-extrabold text-[14.5px] transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] shadow-[0_10px_24px_-8px_rgba(13,128,116,.5)]">
            {busy ? <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3"/><path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg> : null}
            تکمیل ثبت‌نام
          </button>
          <div className="flex items-center justify-between pt-1 text-[11.5px]">
            <button type="button" onClick={() => setStage('identifier')} className="text-ink-500 hover:text-ink-900 font-extrabold">تغییر ایمیل / شماره</button>
            {cooldown > 0 ? (
              <span className="text-ink-400 tabular-nums">ارسال مجدد پس از {cooldown}s</span>
            ) : (
              <button type="button" onClick={request as unknown as () => void} className="text-brand-600 hover:text-brand-800 font-extrabold">ارسال دوباره کد</button>
            )}
          </div>
        </form>
      )}

      <div className="mt-6 pt-6 border-t border-ink-100 text-center text-[12.5px] text-ink-500">
        قبلاً حساب دارید؟{' '}
        <Link href={`/auth/login?next=${encodeURIComponent(next)}`} className="text-brand-600 hover:text-brand-800 font-extrabold">
          ورود
        </Link>
      </div>
    </div>
  );
}
