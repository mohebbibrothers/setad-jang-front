'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  finalStateFromVerify,
  formatTomanFull,
  gatewayDisplayName,
  jalaliDateTimeShort,
  parsePaydoneResultParam,
  tomanToRial,
  verifyPaymentResult,
  type MadadkarVerifyResult,
  type PaydoneFinalState,
  type PaydoneResultParam,
} from '@/lib/madadkar';
import { absoluteMediaUrl, formatPersianNumber } from '@/lib/utils';
import { SmartImage } from '@/components/ui/SmartImage';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PaydoneClient — «صورت‌جلسهٔ پرداختِ مدد به حرکت»
 *
 * مسیرِ حقیقت:
 *   کاربر از درگاه ← GET callback بک‌اند (verify + 302 ← /madadkar/paydone/)
 *   پارامتر result فقط «سرنخِ اولیه‌ست» برای رنگِ لودینگ؛ نمایشِ نهایی
 *   همیشه از POST /payment/verify/ (idempotent، AllowAny) بازیابی می‌شود —
 *   پارامترهای URL هرگز به‌عنوان منبع حقیقت رندر نمی‌شوند.
 *
 * حالات:
 *   verifying → استیجِ مرحله‌ایِ بررسی (صادقانه: ثبت درخواست → استعلام درگاه
 *              → ثبت نتیجهٔ نهایی)
 *   success   → مُهرِ سبز + کارتِ رسید (ref_id، authority کپی‌شدنی، جلالی)
 *   failed    → مُهرِ قرمز + راهنمای برگشتِ وجه + تلاشِ مجدد
 *   canceled  → مُهرِ کهربایی «شما لغو کردید» — نه خطا؛ سهم‌ها آزاد شدند
 *   pending   → نامشخص (خطای درگاه لحظهٔ verify) — بررسیِ خودکار×۳ + دستی
 *   not_found → authority ناشناخته/غایب
 * ═══════════════════════════════════════════════════════════════════════════
 */

type CheckPhase = 'boot' | 'init' | 'verify' | 'record' | 'done';

const AUTO_RETRY_LIMIT = 3;
const AUTO_RETRY_DELAY_MS = 4000;

function SealIcon({ state }: { state: PaydoneFinalState | 'verifying' }) {
  const ring =
    state === 'success'
      ? 'from-mint-400 to-brand-600 shadow-[0_24px_54px_-18px_rgba(13,128,116,.65)]'
      : state === 'failed' || state === 'not_found'
        ? 'from-rose-400 to-rose-600 shadow-[0_24px_54px_-18px_rgba(225,29,72,.55)]'
        : 'from-amber-300 to-amber-500 shadow-[0_24px_54px_-18px_rgba(217,119,6,.55)]';

  return (
    <div className="relative mx-auto flex h-[108px] w-[108px] items-center justify-center">
      {(state === 'success' || state === 'pending' || state === 'verifying') && (
        <>
          <motion.span
            aria-hidden="true"
            className={`absolute inset-0 rounded-full ${
              state === 'success' ? 'bg-mint-500/15' : 'bg-amber-400/20'
            }`}
            animate={{ scale: [1, 1.4], opacity: [0.9, 0] }}
            transition={{ duration: 1.7, repeat: Infinity, ease: 'easeOut' }}
          />
          <motion.span
            aria-hidden="true"
            className={`absolute inset-0 rounded-full ${
              state === 'success' ? 'bg-mint-500/10' : 'bg-amber-400/15'
            }`}
            animate={{ scale: [1, 1.4], opacity: [0.9, 0] }}
            transition={{ duration: 1.7, repeat: Infinity, ease: 'easeOut', delay: 0.6 }}
          />
        </>
      )}
      <motion.span
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 240, damping: 16 }}
        className={`relative flex h-[84px] w-[84px] items-center justify-center rounded-full bg-gradient-to-br text-white ${ring}`}
      >
        {state === 'success' && (
          <motion.svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-10 w-10"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </motion.svg>
        )}
        {state === 'failed' && (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-10 w-10"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        )}
        {state === 'not_found' && (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-10 w-10"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="11" y1="8" x2="11" y2="14" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        )}
        {state === 'canceled' && (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-10 w-10"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="8 12 12 12 16 12" />
          </svg>
        )}
        {(state === 'pending' || state === 'verifying') && (
          <svg
            className="h-10 w-10 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeOpacity="0.3"
              strokeWidth="3"
            />
            <path
              d="M22 12a10 10 0 0 0-10-10"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        )}
      </motion.span>
    </div>
  );
}

function StageChecklist({ phase }: { phase: CheckPhase }) {
  const steps: { id: CheckPhase; label: string }[] = [
    { id: 'init', label: 'ثبت اطلاعات تراکنش' },
    { id: 'verify', label: 'استعلام از درگاه' },
    { id: 'record', label: 'ثبت نتیجهٔ نهایی' },
  ];
  const order: Record<CheckPhase, number> = { boot: -1, init: 0, verify: 1, record: 2, done: 3 };
  return (
    <div className="mx-auto mt-6 flex max-w-[320px] flex-col gap-2.5">
      {steps.map((s) => {
        const status =
          order[phase] > order[s.id] ? 'done' : order[phase] === order[s.id] ? 'active' : 'wait';
        return (
          <div key={s.id} className="flex items-center gap-2.5 text-right">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold ${
                status === 'done'
                  ? 'bg-mint-500 text-white'
                  : status === 'active'
                    ? 'bg-brand-500 text-white'
                    : 'bg-ink-100 text-ink-400'
              }`}
            >
              {status === 'done' ? (
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : status === 'active' ? (
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              ) : (
                ''
              )}
            </span>
            <span
              className={`text-[12.5px] font-bold ${
                status === 'wait' ? 'text-ink-400' : 'text-ink-800'
              }`}
            >
              {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function CopyRow({
  label,
  value,
  dir = 'ltr',
}: {
  label: string;
  value: string;
  dir?: 'ltr' | 'rtl';
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        } catch {
          /* ignore */
        }
      }}
      className="group flex w-full items-center justify-between gap-3 rounded-xl bg-ink-50 px-3 py-2.5 text-right transition-colors hover:bg-ink-100"
      title="کپی"
    >
      <span className="shrink-0 text-[11px] font-bold text-ink-400">{label}</span>
      <span className="flex min-w-0 items-center gap-1.5">
        <span dir={dir} className="truncate font-mono text-[11px] text-ink-700">
          {value}
        </span>
        {copied ? (
          <span className="shrink-0 text-[10px] font-extrabold text-mint-600">کپی شد!</span>
        ) : (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 text-ink-300 transition-colors group-hover:text-ink-500"
            aria-hidden="true"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
      </span>
    </button>
  );
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  بدنهٔ اصلی                                                               */
/* ───────────────────────────────────────────────────────────────────────── */

export function PaydoneClient({
  authority,
  resultParam,
}: {
  authority: string;
  resultParam: string | null;
}) {
  const hint: PaydoneResultParam | null = useMemo(
    () => parsePaydoneResultParam(resultParam),
    [resultParam],
  );

  const [state, setState] = useState<PaydoneFinalState | 'verifying'>(() =>
    authority ? 'verifying' : 'not_found',
  );
  const [phase, setPhase] = useState<CheckPhase>('boot');
  const [result, setResult] = useState<MadadkarVerifyResult | null>(null);
  const [attempts, setAttempts] = useState(0);
  const timerRef = useRef<number | null>(null);

  const doCheck = useCallback(
    async (isRetry: boolean) => {
      if (!authority) {
        setState('not_found');
        return;
      }
      if (!isRetry) setState('verifying');

      // استیجِ بصریِ مرحله‌ای (واقعی — موازی با کار شبکه)
      setPhase('init');
      window.setTimeout(() => setPhase((p) => (p === 'init' ? 'verify' : p)), 500);
      try {
        const res = await verifyPaymentResult(authority);
        setPhase('record');
        await new Promise((r) => window.setTimeout(r, 380));
        setPhase('done');
        const final = finalStateFromVerify(res, hint);
        setResult(res);
        if (final === 'pending' && attempts < AUTO_RETRY_LIMIT) {
          setAttempts((a) => a + 1);
          setState('pending');
          timerRef.current = window.setTimeout(() => void doCheck(true), AUTO_RETRY_DELAY_MS);
          return;
        }
        setState(final);
      } catch (err) {
        const status = (err as { status?: number })?.status;
        setPhase('done');
        if (status === 404) {
          setState('not_found');
          return;
        }
        // خطای شبکه/درگاه لحظهٔ verify → نامشخص + برنامهٔ تلاش مجدد
        if (attempts < AUTO_RETRY_LIMIT) {
          setAttempts((a) => a + 1);
          setState('pending');
          timerRef.current = window.setTimeout(() => void doCheck(true), AUTO_RETRY_DELAY_MS);
          return;
        }
        setState('pending');
      }
    },
    [authority, hint, attempts],
  );

  useEffect(() => {
    void doCheck(false);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
    // mount-only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const campaign = result?.participation?.campaign ?? null;
  const payment = result?.participation?.payment ?? null;
  const campaignSlug = campaign?.slug ?? null;
  const coverUrl = absoluteMediaUrl(campaign?.cover_image);
  const amount = result?.participation?.total_amount ?? payment?.amount ?? null;
  const shareCount = result?.participation?.share_count ?? null;

  return (
    <main className="relative min-h-[70vh] bg-gradient-to-b from-brand-50/70 via-white to-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-mint-50/80 to-transparent"
      />
      <div className="container-edge relative flex flex-col items-center pb-16 pt-10 sm:pt-14">
        {/* کارتِ اصلی */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-[560px] overflow-hidden rounded-[26px] border border-ink-100 bg-white shadow-[0_30px_70px_-30px_rgba(11,53,48,.25)]"
        >
          <div className="px-5 pb-6 pt-8 sm:px-8">
            <SealIcon state={state} />
            <AnimatePresence mode="wait">
              {/* ── لودینگ مرحله‌ای ─────────────────────────────────── */}
              {state === 'verifying' && (
                <motion.div
                  key="verifying"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <h1 className="mt-6 text-[18px] font-black text-ink-900">
                    {hint === 'canceled'
                      ? 'در حال پایان‌دادن به تراکنش…'
                      : 'در حال بررسی نتیجهٔ پرداخت…'}
                  </h1>
                  <p className="mx-auto mt-2 max-w-[380px] text-[12px] font-medium leading-6 text-ink-500">
                    چند ثانیه فرصت بده؛ نتیجه را مستقیم از درگاه می‌پرسیم و در دفترِ شفافیت ثبت
                    می‌کنیم.
                  </p>
                  <StageChecklist phase={phase} />
                </motion.div>
              )}

              {/* ── موفق ─────────────────────────────────────────────── */}
              {state === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <h1 className="mt-5 text-[20px] font-black text-ink-900">پرداخت تأیید شد 🎉</h1>
                  <p className="mx-auto mt-2 max-w-[400px] text-[12.5px] font-medium leading-7 text-ink-500">
                    دمت گرم! {shareCount != null && `${formatPersianNumber(shareCount)} سهم`} از این
                    حرکت حالا به نامِ توست و اثرش همانِ امروز ثبت شد.
                  </p>

                  {/* کارتِ رسید */}
                  <div className="border-mint-200 mt-6 overflow-hidden rounded-2xl border bg-gradient-to-b from-mint-50/70 to-white text-right">
                    <div className="flex items-center gap-3 border-b border-mint-100 px-4 py-3">
                      {coverUrl && (
                        <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl ring-1 ring-ink-100">
                          <SmartImage
                            src={coverUrl}
                            alt={campaign?.title ?? ''}
                            variant="campaign"
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-extrabold text-ink-900">
                          {campaign?.title ?? 'حرکت مددکار'}
                        </div>
                        <div className="text-[10.5px] font-bold text-ink-400">
                          صورت‌جلسهٔ رسمی مشارکت
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-mint-500 px-2.5 py-1 text-[10px] font-extrabold text-white">
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        موفق
                      </span>
                    </div>
                    <div className="space-y-2 px-4 py-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[11.5px] font-bold text-ink-400">مبلغِ تأییدشده</span>
                        <span className="text-[17px] font-black tabular-nums text-ink-900">
                          {formatTomanFull(amount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-end text-[10.5px] tabular-nums text-ink-400">
                        معادل {amount != null ? formatPersianNumber(tomanToRial(amount)) : '—'} ریال
                      </div>
                      {shareCount != null && (
                        <div className="flex items-center justify-between text-[12px] font-bold">
                          <span className="text-ink-400">تعداد سهم</span>
                          <span className="tabular-nums text-ink-800">
                            {formatPersianNumber(shareCount)} سهم
                          </span>
                        </div>
                      )}
                      {payment?.ref_id && (
                        <CopyRow label="شناسهٔ درگاه (ref_id)" value={payment.ref_id} />
                      )}
                      <CopyRow label="کد پیگیری" value={authority} />
                      {(result?.participation?.paid_at || payment?.paid_at) && (
                        <div className="flex items-center justify-between text-[12px] font-bold">
                          <span className="text-ink-400">زمان پرداخت</span>
                          <span className="text-ink-800">
                            {jalaliDateTimeShort(
                              result?.participation?.paid_at ?? payment?.paid_at,
                            )}
                          </span>
                        </div>
                      )}
                      {payment?.gateway_name && (
                        <div className="flex items-center justify-between text-[11.5px] font-bold">
                          <span className="text-ink-400">درگاه</span>
                          <span className="text-ink-700">
                            {gatewayDisplayName(payment.gateway_name)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] font-medium text-ink-400">
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    این صورت‌جلسه با کد پیگیری در دفترِ شفافیتِ حرکت قابل راستی‌آزمایی است.
                  </p>

                  <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                    {campaignSlug && (
                      <Link
                        href={`/madadkar/${encodeURIComponent(campaignSlug)}`}
                        className="inline-flex h-12 flex-1 items-center justify-center rounded-full bg-gradient-to-l from-mint-500 to-brand-700 text-[13.5px] font-extrabold text-white shadow-[0_10px_24px_-6px_rgba(13,128,116,.55)] transition-all hover:brightness-105 active:scale-[0.99]"
                      >
                        بازگشت به صفحهٔ حرکت
                      </Link>
                    )}
                    <Link
                      href="/madadkar"
                      className="inline-flex h-12 flex-1 items-center justify-center rounded-full bg-ink-50 text-[13.5px] font-extrabold text-ink-700 ring-1 ring-ink-100 transition-colors hover:bg-ink-100"
                    >
                      حرکت‌های دیگر
                    </Link>
                  </div>
                </motion.div>
              )}

              {/* ── لغو توسط کاربر ───────────────────────────────────── */}
              {state === 'canceled' && (
                <motion.div
                  key="canceled"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <h1 className="mt-5 text-[19px] font-black text-ink-900">پرداخت را لغو کردی</h1>
                  <p className="mx-auto mt-2 max-w-[400px] text-[12.5px] font-medium leading-7 text-ink-500">
                    مشکلی نیست! هیچ مبلغی کسر نشد و سهم‌ها آزاد شدند. هر وقت آماده بودی، حرکت
                    همین‌جاست.
                  </p>
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-right">
                    <p className="text-[11.5px] font-bold leading-6 text-amber-800">
                      اگر وسطِ درگاه منصرف شدی، بدان که فرآیند کاملاً امن است: اطلاعاتِ کارت فقط روی
                      صفحهٔ رسمی بانک ثبت می‌شود و دوباره هیچ رزروی روی دستت باقی نمانده.
                    </p>
                  </div>
                  <CopyRow label="کد پیگیری" value={authority} />
                  <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                    {campaignSlug && (
                      <Link
                        href={`/madadkar/${encodeURIComponent(campaignSlug)}`}
                        className="inline-flex h-12 flex-1 items-center justify-center rounded-full bg-gradient-to-l from-mint-500 to-brand-700 text-[13.5px] font-extrabold text-white shadow-[0_10px_24px_-6px_rgba(13,128,116,.55)] transition-all hover:brightness-105 active:scale-[0.99]"
                      >
                        ادامهٔ مشارکت — تلاش دوباره
                      </Link>
                    )}
                    <Link
                      href="/madadkar"
                      className="inline-flex h-12 flex-1 items-center justify-center rounded-full bg-ink-50 text-[13.5px] font-extrabold text-ink-700 ring-1 ring-ink-100 transition-colors hover:bg-ink-100"
                    >
                      حرکت‌های دیگر
                    </Link>
                  </div>
                </motion.div>
              )}

              {/* ── ناموفق ───────────────────────────────────────────── */}
              {state === 'failed' && (
                <motion.div
                  key="failed"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <h1 className="mt-5 text-[19px] font-black text-ink-900">پرداخت تأیید نشد</h1>
                  <p className="mx-auto mt-2 max-w-[400px] text-[12.5px] font-medium leading-7 text-ink-500">
                    بانک این تراکنش را نهایی نکرد. اگر مبلغی از حسابت کسر شده، طبق مقررات خودکار
                    برمی‌گردد؛ سهم‌های رزروشده نیز آزاد شدند.
                  </p>
                  <div className="mt-4 space-y-2 text-right">
                    <div className="rounded-2xl border border-rose-100 bg-rose-50/60 px-4 py-3 text-[11.5px] font-bold leading-6 text-rose-700">
                      دلیل‌های رایج: موجودیِ ناکافی، رمزِ دوم اشتباه، اتمامِ زمانِ صفحهٔ بانک یا
                      قطعیِ لحظه‌ایِ شبکه.
                    </div>
                    <CopyRow label="کد پیگیری" value={authority} />
                  </div>
                  <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                    {campaignSlug && (
                      <Link
                        href={`/madadkar/${encodeURIComponent(campaignSlug)}`}
                        className="inline-flex h-12 flex-1 items-center justify-center rounded-full bg-gradient-to-l from-mint-500 to-brand-700 text-[13.5px] font-extrabold text-white shadow-[0_10px_24px_-6px_rgba(13,128,116,.55)] transition-all hover:brightness-105 active:scale-[0.99]"
                      >
                        تلاش مجدد برای پرداخت
                      </Link>
                    )}
                    <Link
                      href="/madadkar"
                      className="inline-flex h-12 flex-1 items-center justify-center rounded-full bg-ink-50 text-[13.5px] font-extrabold text-ink-700 ring-1 ring-ink-100 transition-colors hover:bg-ink-100"
                    >
                      حرکت‌های دیگر
                    </Link>
                  </div>
                </motion.div>
              )}

              {/* ── نامشخص ───────────────────────────────────────────── */}
              {state === 'pending' && (
                <motion.div
                  key="pending"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <h1 className="mt-5 text-[19px] font-black text-ink-900">
                    وضعیتِ تراکنش هنوز نامشخص است
                  </h1>
                  <p className="mx-auto mt-2 max-w-[400px] text-[12.5px] font-medium leading-7 text-ink-500">
                    درگاه در لحظهٔ تأیید پاسخ نداد. به‌صورت خودکار تا{' '}
                    {formatPersianNumber(AUTO_RETRY_LIMIT)} بار دیگر هم بررسی می‌کنیم؛ اگر پرداخت
                    کامل شده باشد، نهایی و ثبت می‌شود.
                  </p>
                  <p className="mt-1 text-[11px] font-bold tabular-nums text-amber-600">
                    تلاشِ خودکار: {formatPersianNumber(attempts)} از{' '}
                    {formatPersianNumber(AUTO_RETRY_LIMIT)}
                  </p>
                  <div className="mt-4 space-y-2 text-right">
                    <div className="rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-[11.5px] font-bold leading-6 text-amber-800">
                      اگر مبلغِ شما کسر شده باشد، پس از نهایی‌شدنِ وضعیت از سمتِ بانک، یا تراکنش
                      تأیید می‌شود یا مبلغ خودکار برمی‌گردد — نگران نباش.
                    </div>
                    <CopyRow label="کد پیگیری" value={authority} />
                  </div>
                  <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => {
                        setAttempts(0);
                        void doCheck(false);
                      }}
                      className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-brand-500 text-[13.5px] font-extrabold text-white shadow-[0_10px_24px_-6px_rgba(13,128,116,.55)] transition-all hover:bg-brand-600 active:scale-[0.99]"
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                        <polyline points="21 3 21 9 15 9" />
                      </svg>
                      بررسی مجددِ وضعیت
                    </button>
                    <Link
                      href="/madadkar"
                      className="inline-flex h-12 flex-1 items-center justify-center rounded-full bg-ink-50 text-[13.5px] font-extrabold text-ink-700 ring-1 ring-ink-100 transition-colors hover:bg-ink-100"
                    >
                      بازگشت به حرکت‌ها
                    </Link>
                  </div>
                </motion.div>
              )}

              {/* ── پیدا نشد ─────────────────────────────────────────── */}
              {state === 'not_found' && (
                <motion.div
                  key="not_found"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <h1 className="mt-5 text-[19px] font-black text-ink-900">
                    تراکنشی با این مشخصات پیدا نشد
                  </h1>
                  <p className="mx-auto mt-2 max-w-[400px] text-[12.5px] font-medium leading-7 text-ink-500">
                    {authority
                      ? 'کد پیگیریِ دریافتی در سامانه ثبت نیست؛ لطفاً صحتِ لینک را بررسی کن.'
                      : 'این صفحه فقط با لینکِ بازگشت از درگاه معنا پیدا می‌کند (کد پیگیری در آدرس نیست).'}
                  </p>
                  {authority && (
                    <div className="mt-4 text-right">
                      <CopyRow label="کد پیگیریِ دریافتی" value={authority} />
                    </div>
                  )}
                  <div className="mt-5">
                    <Link
                      href="/madadkar"
                      className="inline-flex h-12 w-full items-center justify-center rounded-full bg-gradient-to-l from-mint-500 to-brand-700 text-[13.5px] font-extrabold text-white shadow-[0_10px_24px_-6px_rgba(13,128,116,.55)] transition-all hover:brightness-105 active:scale-[0.99]"
                    >
                      بازگشت به حرکت‌ها
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <p className="mt-6 text-center text-[11px] font-medium leading-6 text-ink-400">
          نگرانی؟ شمارهٔ پیگیری (authority) را نگه دار؛ پشتیبانی با همین کد خیلی سریعتر جوابت را
          پیدا می‌کند.
        </p>
      </div>
    </main>
  );
}
