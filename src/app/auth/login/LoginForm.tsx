'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { loginPassword, loginOtpRequest, loginOtpVerify, OTP_CODE_LENGTH } from '@/lib/auth';
import { ApiError } from '@/lib/api';

type Mode = 'password' | 'otp';
type Stage = 'identifier' | 'otp-code';

const IDENT_PLACEHOLDER = 'ایمیل یا شماره تلفن';

export function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp?.get('next') || '/';

  const [mode, setMode] = useState<Mode>('password');
  const [stage, setStage] = useState<Stage>('identifier');

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function safeReturn(path: string) {
    // Only allow same-origin returns to prevent open-redirect abuse.
    if (path.startsWith('/') && !path.startsWith('//')) return path;
    return '/';
  }

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault(); if (busy) return;
    if (!identifier.trim() || !password) return;
    setBusy(true); setErr(null);
    try {
      await loginPassword({ identifier: identifier.trim(), password });
      router.replace(safeReturn(next));
      router.refresh();
    } catch (e) {
      setErr(e instanceof ApiError ? (e.message || 'ورود ناموفق بود.') : 'ارتباط با سرور برقرار نشد.');
    } finally { setBusy(false); }
  }

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault(); if (busy) return;
    if (!identifier.trim()) return;
    setBusy(true); setErr(null);
    try {
      const res = await loginOtpRequest(identifier.trim());
      setStage('otp-code');
      setCooldown(res.cooldown_seconds ?? 60);
    } catch (e) {
      setErr(e instanceof ApiError ? (e.message || 'ارسال کد ناموفق بود.') : 'ارتباط با سرور برقرار نشد.');
    } finally { setBusy(false); }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault(); if (busy) return;
    if (code.length < OTP_CODE_LENGTH) { setErr('کد ورود کامل نیست.'); return; }
    setBusy(true); setErr(null);
    try {
      await loginOtpVerify({ identifier: identifier.trim(), code });
      router.replace(safeReturn(next));
      router.refresh();
    } catch (e) {
      setErr(e instanceof ApiError ? (e.message || 'کد وارد شده معتبر نیست.') : 'ارتباط با سرور برقرار نشد.');
    } finally { setBusy(false); }
  }

  return (
    <div className="bg-white text-ink-900 rounded-[28px] p-6 md:p-8 shadow-[0_40px_100px_-25px_rgba(0,0,0,.55)]">
      <div className="text-center mb-6">
        <h1 className="text-[22px] font-extrabold">ورود به بعثت مردم</h1>
        <p className="text-[12.5px] text-ink-500 mt-1">با ایمیل، شماره تلفن یا کد یک‌بارمصرف وارد شوید.</p>
      </div>

      {/* Mode switcher */}
      <div className="grid grid-cols-2 p-1 bg-ink-50 rounded-full mb-5 gap-1">
        {(['password', 'otp'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setStage('identifier'); setErr(null); setCode(''); setPassword(''); }}
            className={`h-9 rounded-full text-[12.5px] font-extrabold transition-all ${
              mode === m
                ? 'bg-white text-ink-900 shadow-[0_4px_12px_-4px_rgba(15,20,32,.12)]'
                : 'text-ink-500 hover:text-ink-800'
            }`}
          >
            {m === 'password' ? 'رمز عبور' : 'کد یک‌بارمصرف'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {err && (
          <motion.div
            key="err" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 text-rose-700 text-[12.5px] font-bold mb-4"
            role="alert"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span>{err}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {mode === 'password' ? (
        <form onSubmit={submitPassword} className="space-y-3">
          <Field label={IDENT_PLACEHOLDER} value={identifier} onChange={setIdentifier} type="text" name="identifier" autoComplete="username" />
          <Field label="رمز عبور" value={password} onChange={setPassword} type="password" name="password" autoComplete="current-password" />
          <SubmitBtn busy={busy} label="ورود" />
          <div className="text-center pt-2">
            <Link href="/auth/forgot" className="text-[12px] text-brand-600 hover:text-brand-800 font-extrabold">
              رمز عبور را فراموش کرده‌اید؟
            </Link>
          </div>
        </form>
      ) : stage === 'identifier' ? (
        <form onSubmit={requestOtp} className="space-y-3">
          <Field label={IDENT_PLACEHOLDER} value={identifier} onChange={setIdentifier} type="text" name="identifier" autoComplete="username" />
          <SubmitBtn busy={busy} label="ارسال کد" />
        </form>
      ) : (
        <form onSubmit={verifyOtp} className="space-y-3">
          <p className="text-[12.5px] text-ink-600 leading-6">
            کد {OTP_CODE_LENGTH.toLocaleString('fa-IR')} رقمی به <b className="text-ink-900">{identifier}</b> ارسال شد.
          </p>
          <input
            type="text"
            inputMode="numeric"
            dir="ltr"
            maxLength={OTP_CODE_LENGTH}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, OTP_CODE_LENGTH))}
            className="w-full h-14 px-4 rounded-xl bg-ink-50 border border-ink-200 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 text-[24px] font-extrabold tabular-nums text-center tracking-[0.5em]"
            aria-label="کد یک‌بارمصرف"
            placeholder={'0'.repeat(OTP_CODE_LENGTH)}
          />
          <SubmitBtn busy={busy} label="ورود" />
          <div className="flex items-center justify-between pt-1 text-[11.5px]">
            <button type="button" onClick={() => { setStage('identifier'); setCode(''); }} className="text-ink-500 hover:text-ink-900 font-extrabold">
              تغییر ایمیل / شماره
            </button>
            {cooldown > 0 ? (
              <span className="text-ink-400 tabular-nums">ارسال مجدد پس از {cooldown}s</span>
            ) : (
              <button type="button" onClick={requestOtp as unknown as () => void} className="text-brand-600 hover:text-brand-800 font-extrabold">
                ارسال دوباره کد
              </button>
            )}
          </div>
        </form>
      )}

      <div className="mt-6 pt-6 border-t border-ink-100 text-center text-[12.5px] text-ink-500">
        حساب کاربری ندارید؟{' '}
        <Link href={`/auth/signup?next=${encodeURIComponent(next)}`} className="text-brand-600 hover:text-brand-800 font-extrabold">
          ثبت‌نام
        </Link>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, type = 'text', name, autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  name?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={label}
        className="w-full h-12 px-4 rounded-xl bg-ink-50 border border-ink-200 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 text-[14px] text-ink-900 placeholder:text-ink-400"
      />
    </label>
  );
}

function SubmitBtn({ busy, label }: { busy: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-xl bg-gradient-to-l from-brand-500 to-brand-700 text-white font-extrabold text-[14.5px] transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] shadow-[0_10px_24px_-8px_rgba(13,128,116,.5)]"
    >
      {busy ? (
        <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3"/><path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
      ) : null}
      {label}
    </button>
  );
}
