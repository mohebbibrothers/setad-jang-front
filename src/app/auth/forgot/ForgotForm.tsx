'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { forgotPasswordRequest, forgotPasswordConfirm, OTP_CODE_LENGTH } from '@/lib/auth';
import { ApiError } from '@/lib/api';

type Stage = 'identifier' | 'confirm';

export function ForgotForm() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>('identifier');
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function request(e: React.FormEvent) {
    e.preventDefault(); if (busy) return;
    if (!identifier.trim()) return;
    setBusy(true); setErr(null);
    try {
      await forgotPasswordRequest(identifier.trim());
      setStage('confirm');
      setMsg('اگر این حساب معتبر باشد، کدی برای بازیابی رمز ارسال شد.');
    } catch (e) {
      setErr(e instanceof ApiError ? (e.message || 'ارسال کد ناموفق بود.') : 'ارتباط با سرور برقرار نشد.');
    } finally { setBusy(false); }
  }

  async function confirm(e: React.FormEvent) {
    e.preventDefault(); if (busy) return;
    if (code.length < OTP_CODE_LENGTH) { setErr('کد کامل نیست.'); return; }
    if (password.length < 8) { setErr('رمز جدید باید حداقل ۸ کاراکتر باشد.'); return; }
    setBusy(true); setErr(null);
    try {
      await forgotPasswordConfirm({ identifier: identifier.trim(), code, new_password: password });
      router.replace('/auth/login');
      router.refresh();
    } catch (e) {
      setErr(e instanceof ApiError ? (e.message || 'بازیابی با خطا مواجه شد.') : 'ارتباط با سرور برقرار نشد.');
    } finally { setBusy(false); }
  }

  return (
    <div className="bg-white text-ink-900 rounded-[28px] p-6 md:p-8 shadow-[0_40px_100px_-25px_rgba(0,0,0,.55)]">
      <h1 className="text-[22px] font-extrabold text-center">بازیابی رمز عبور</h1>

      <AnimatePresence>
        {msg && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[12.5px] text-ink-500 leading-6 text-center mt-2">
            {msg}
          </motion.p>
        )}
        {err && (
          <motion.div key="err" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 text-rose-700 text-[12.5px] font-bold mt-4"
            role="alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span>{err}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {stage === 'identifier' ? (
        <form onSubmit={request} className="space-y-3 mt-5">
          <input
            type="text" placeholder="ایمیل یا شماره تلفن" value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full h-12 px-4 rounded-xl bg-ink-50 border border-ink-200 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 text-[14px]"
            autoComplete="username"
          />
          <button type="submit" disabled={busy} className="w-full h-12 rounded-xl bg-gradient-to-l from-brand-500 to-brand-700 text-white font-extrabold text-[14.5px] disabled:opacity-50">
            ارسال کد بازیابی
          </button>
        </form>
      ) : (
        <form onSubmit={confirm} className="space-y-3 mt-5">
          <input type="text" inputMode="numeric" dir="ltr" maxLength={OTP_CODE_LENGTH}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, OTP_CODE_LENGTH))}
            placeholder="کد بازیابی"
            className="w-full h-14 px-4 rounded-xl bg-ink-50 border border-ink-200 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 text-[24px] font-extrabold tabular-nums text-center tracking-[0.5em]"
          />
          <input type="password" placeholder="رمز عبور جدید" value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-12 px-4 rounded-xl bg-ink-50 border border-ink-200 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 text-[14px]"
            autoComplete="new-password"
          />
          <button type="submit" disabled={busy} className="w-full h-12 rounded-xl bg-gradient-to-l from-brand-500 to-brand-700 text-white font-extrabold text-[14.5px] disabled:opacity-50">
            تغییر رمز عبور
          </button>
        </form>
      )}

      <div className="mt-6 pt-6 border-t border-ink-100 text-center text-[12.5px] text-ink-500">
        بازگشت به <Link href="/auth/login" className="text-brand-600 hover:text-brand-800 font-extrabold">صفحه ورود</Link>
      </div>
    </div>
  );
}
