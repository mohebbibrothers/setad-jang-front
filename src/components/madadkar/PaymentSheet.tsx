'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { SmartImage } from '@/components/ui/SmartImage';
import { AuthModal } from '@/components/auth/AuthModal';
import { formatPersianNumber, toPersianDigits } from '@/lib/utils';
import { useAuth } from '@/lib/use-auth';
import {
  RESERVE_MINUTES,
  clampPercent,
  classifyParticipateError,
  fetchCampaignDetailClient,
  formatTomanFull,
  gatewayDisplayName,
  initiateParticipation,
  jalaliDateTimeShort,
  tomanToRial,
  verifyPaymentResult,
  type MadadkarInitiated,
} from '@/lib/madadkar';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PaymentSheet — «شییٔتِ پرداختِ مدد به حرکت» (v2 — فلویِ سه‌ایستگاهی)
 *
 * تجربهٔ خریدِ سهم و اتصال به درگاه، به‌حرفه‌ای‌ترین شکلِ ممکن:
 *
 *   ایستگاه ۱ «انتخاب سهم»
 *     ─ کاور + عنوان + مددکار + شمارِ معکوسِ مهلت
 *     ─ مترِ پیشرفتِ تأمین + «X سهم باقی»
 *     ─ اسلایدر + استپرها + چیپ‌های انتخاب سریع
 *     ─ کارتِ مالیِ زنده (قیمت هر سهم، جمعِ تومان/ریال، ٪ سهم شما از حرکت)
 *     ─ تازه‌سازیِ خودکارِ «سهمِ باقی‌مانده» هنگام باز شدن و بازگشتِ فوکوس
 *
 *   ایستگاه ۲ «بازبینی و تأیید»
 *     ─ صورتحسابِ خلاصه (تعداد × قیمت = جمعِ کل)
 *     ─ نشانِ درگاهِ رسمی (زرین‌پال/شاپرک) + وعدهٔ رزرو ۱۵ دقیقه‌ای
 *     ─ اطلاعاتِ تماسِ اختیاری (برای پیامکِ درگاه)
 *
 *   ایستگاه ۳ «انتقال امن»
 *     ─ اینترستیشنالِ اتصال به درگاه + چیپِ کدِ پیگیری (authority) کپی‌شدنی
 *     ─ اگر انتقال خودکار نشد: دکمهٔ دستیِ «رفتن به درگاه»
 *     ─ اگر کاربر به تب برگشت بی‌آنکه پرداخت تمام شود:
 *       «پرداخت را کامل کردید؟» + بررسیِ وضعیت از همین‌جا (POST verify idempotent)
 *
 *   مهمان‌ها: ورود/ثبت‌نام در جریانِ همین شیت (بدونِ از دست رفتنِ انتخاب)؛
 *   خطاها به زبانِ کاربر مپ می‌شوند و «کافی نبودنِ سهم» باعثِ رفرشِ خودکارِ
 *   موجودی می‌شود.
 * ═══════════════════════════════════════════════════════════════════════════
 */

export type PaymentSheetCampaign = {
  slug: string;
  title: string;
  sponsor: string;
  sponsorLogo?: string;
  /** تومان */
  totalAmount: number;
  /** تومان */
  sharePrice: number;
  sharesTotal: number;
  sharesRemaining: number;
  progressPercent: number;
  coverUrl?: string;
  gallery?: { url: string; alt?: string }[];
  statusDisplay?: string;
  isFullyFunded?: boolean;
  hasDeadline?: boolean;
  deadline?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  campaign: PaymentSheetCampaign | null;
  /** نام درگاه برای نمایش در ایستگاه بازبینی (پیش‌فرض: زرین‌پال). */
  gatewayName?: string;
};

type Stage = 'select' | 'review' | 'transfer';
type CheckState = 'idle' | 'checking' | 'success' | 'failed' | 'pending';

const SESSION_AUTHORITY_KEY = 'madadkar.pendingAuthority';

/* ───────────────────────────────────────────────────────────────────────── */
/*  آتُم‌ها                                                                  */
/* ───────────────────────────────────────────────────────────────────────── */

function StepRail({ stage }: { stage: Stage }) {
  const steps: { id: Stage; label: string }[] = [
    { id: 'select', label: 'انتخاب سهم' },
    { id: 'review', label: 'بازبینی' },
    { id: 'transfer', label: 'درگاه' },
  ];
  const current = steps.findIndex((s) => s.id === stage);
  return (
    <div className="flex items-center justify-center gap-1.5" aria-hidden="true">
      {steps.map((s, i) => {
        const active = i === current;
        const done = i < current;
        return (
          <div key={s.id} className="flex items-center gap-1.5">
            <span
              className={`inline-flex h-[22px] items-center gap-1 rounded-full px-2 text-[10.5px] font-extrabold transition-all duration-300 ${
                active
                  ? 'bg-brand-500 text-white shadow-[0_6px_14px_-6px_rgba(13,128,116,.55)]'
                  : done
                    ? 'bg-mint-500/15 text-mint-700 ring-1 ring-mint-500/30'
                    : 'bg-ink-50 text-ink-400 ring-1 ring-ink-100'
              }`}
            >
              {done ? (
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <span className="tabular-nums">{toPersianDigits(i + 1)}</span>
              )}
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <span className={`h-px w-4 sm:w-6 ${done ? 'bg-mint-500/50' : 'bg-ink-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Stepper({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`تغییر تعداد سهم ${label}`}
      className="inline-flex h-9 min-w-[40px] shrink-0 items-center justify-center rounded-full bg-white px-2.5 text-[12px] font-extrabold tabular-nums text-ink-700 ring-1 ring-ink-200 transition-all duration-150 hover:text-brand-700 hover:ring-brand-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {label}
    </button>
  );
}

/** نشانِ درگاهِ امن — زرین‌پال با حلقهٔ اعتماد (شاپرک/SSL) */
function GatewayBadge({ gateway }: { gateway: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-amber-200/80 bg-gradient-to-l from-amber-50 to-[#FDF6E3] p-3.5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#F7B500] to-[#E09A00] text-[#5A3B00] shadow-[0_8px_18px_-8px_rgba(224,154,0,.7)]">
        {/* shield-lock */}
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <rect x="9" y="10" width="6" height="5" rx="1" />
          <path d="M10.5 10V8.5a1.5 1.5 0 0 1 3 0V10" />
        </svg>
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-extrabold text-[#6B4A00]">پرداخت امن از طریق {gateway}</p>
        <p className="mt-0.5 text-[11px] font-medium leading-5 text-[#8A6A1F]">
          درگاهِ رسمی روی سکوی شاپرک؛ اطلاعاتِ کارت فقط در صفحهٔ بانکی ثبت می‌شود.
        </p>
      </div>
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0 text-[#B98A1E]"
        aria-hidden="true"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    </div>
  );
}

function HourglassIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 2h12M6 22h12M7 2v4l5 5 5-5V2M7 22v-4l5-5 5 5v4" />
    </svg>
  );
}

function CopyChip({ value, label }: { value: string; label: string }) {
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
          /* کلیپ‌بورد در دسترس نیست — متن قابل‌انتخاب باقی می‌ماند */
        }
      }}
      title="کپی"
      className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-ink-900/[.06] py-1 pl-2.5 pr-3 text-[10.5px] font-extrabold text-ink-700 ring-1 ring-ink-900/10 transition-colors hover:bg-ink-900/[.1]"
    >
      <span className="shrink-0 text-ink-400">{label}</span>
      <span dir="ltr" className="min-w-0 flex-1 truncate font-mono text-[10px] text-ink-600">
        {value}
      </span>
      {copied ? (
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0 text-mint-600"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0"
        >
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
      <span className={`sr-only`}>{copied ? 'کپی شد' : `کپی کردن ${label}`}</span>
      {copied && <span className="shrink-0 text-mint-700">کپی شد!</span>}
    </button>
  );
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  کامپوننتِ اصلی                                                           */
/* ───────────────────────────────────────────────────────────────────────── */

export function PaymentSheet({ open, onClose, campaign, gatewayName = 'zarinpal' }: Props) {
  const { isAuthenticated, loading: authLoading } = useAuth();

  // مقادیر بذر از props + رفرشِ زنده
  const [liveRemaining, setLiveRemaining] = useState<number | null>(null);
  const [liveSharePrice, setLiveSharePrice] = useState<number | null>(null);

  const remaining = liveRemaining ?? Math.max(0, campaign?.sharesRemaining ?? 0);
  const total = Math.max(1, campaign?.sharesTotal ?? 1);
  const sold = Math.max(0, total - remaining);
  const pricePerShare =
    liveSharePrice ??
    campaign?.sharePrice ??
    (campaign && campaign.sharesTotal > 0
      ? Math.floor(campaign.totalAmount / campaign.sharesTotal)
      : 0);
  const progressPct = clampPercent(campaign?.progressPercent ?? (sold / total) * 100);
  const isClosed = remaining <= 0 || Boolean(campaign?.isFullyFunded);

  const [stage, setStage] = useState<Stage>('select');
  const [shareCount, setShareCount] = useState(1);
  const [contactOpen, setContactOpen] = useState(false);
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [freshness, setFreshness] = useState<'idle' | 'loading'>('idle');

  // ایستگاه سوم
  const [initiated, setInitiated] = useState<MadadkarInitiated | null>(null);
  const [checkState, setCheckState] = useState<CheckState>('idle');
  const [checkDetail, setCheckDetail] = useState<{ refId?: string | null; paidAt?: string | null }>(
    {},
  );

  const panelRef = useRef<HTMLDivElement>(null);
  const navigatedRef = useRef(false);
  const initiatedRef = useRef<MadadkarInitiated | null>(null);
  initiatedRef.current = initiated;

  /* ── ریست روی باز شدن ─────────────────────────────────────────────── */
  useEffect(() => {
    if (!open) return;
    setStage('select');
    setShareCount((c) => Math.max(1, Math.min(c, Math.max(1, remaining))));
    setContactOpen(false);
    setMobile('');
    setEmail('');
    setSubmitting(false);
    setError(null);
    setNotice(null);
    setInitiated(null);
    setCheckState('idle');
    setCheckDetail({});
    setLiveRemaining(null);
    setLiveSharePrice(null);
    navigatedRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /* ── رفرشِ زندهٔ موجودی هنگام باز شدن و بازگشتِ فوکوس ────────────── */
  const refreshAvailability = useCallback(
    async (mirrorError: boolean) => {
      if (!campaign) return;
      setFreshness('loading');
      try {
        const fresh = await fetchCampaignDetailClient(campaign.slug);
        if (fresh) {
          setLiveRemaining(Math.max(0, fresh.remaining_shares ?? 0));
          if (fresh.share_price && fresh.share_price > 0) setLiveSharePrice(fresh.share_price);
        } else if (mirrorError) {
          setNotice('به‌روزرسانی موجودی ممکن نشد؛ دادهٔ فعلی نمایش داده می‌شود.');
        }
      } finally {
        setFreshness('idle');
      }
    },
    [campaign],
  );

  useEffect(() => {
    if (!open || !campaign) return;
    void refreshAvailability(false);
    const onFocus = () => {
      if (!initiatedRef.current) void refreshAvailability(false);
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [open, campaign, refreshAvailability]);

  // کلَمپِ تعداد وقتی موجودیِ زنده کمتر شد
  useEffect(() => {
    if (liveRemaining != null) {
      setShareCount((c) => Math.max(1, Math.min(c, Math.max(1, liveRemaining))));
    }
  }, [liveRemaining]);

  /* ── قفلِ اسکرول + Esc ─────────────────────────────────────────────── */
  const locking = open && !authOpen;
  useEffect(() => {
    if (!locking) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting && !initiatedRef.current) onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [locking, onClose, submitting]);

  /* ── بازگشتِ کاربر به تب بعد از رفتن به درگاه ─────────────────────── */
  useEffect(() => {
    if (!open) return;
    const onVis = () => {
      if (document.visibilityState === 'visible' && initiatedRef.current && navigatedRef.current) {
        // کاربر رفت و برگشت — هنوز verify نشده؛ پنل «بررسی وضعیت» فعال می‌ماند
        setCheckState((s) => (s === 'idle' ? 'idle' : s));
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [open]);

  /* ── محاسباتِ مالی ─────────────────────────────────────────────────── */
  const totalToman = useMemo(() => shareCount * pricePerShare, [shareCount, pricePerShare]);
  const totalRial = tomanToRial(totalToman);
  const shareOfCampaignPct = total > 0 ? (shareCount / total) * 100 : 0;

  /* ── شمارِ معکوسِ مهلت ────────────────────────────────────────────── */
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!open || !campaign?.deadline) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [open, campaign?.deadline]);
  const deadlineRemaining = useMemo(() => {
    if (!campaign?.hasDeadline || !campaign?.deadline) return null;
    const ms = new Date(campaign.deadline).getTime() - now;
    if (ms <= 0) return { expired: true } as const;
    const days = Math.floor(ms / 86_400_000);
    const hours = Math.floor((ms % 86_400_000) / 3_600_000);
    const mins = Math.floor((ms % 3_600_000) / 60_000);
    return { expired: false, days, hours, mins } as const;
  }, [campaign, now]);

  /* ── چیپ‌های انتخاب سریع ──────────────────────────────────────────── */
  const quickPicks = useMemo(() => {
    const presets = [1, 5, 10, 50, 100];
    const filtered = presets.filter((v) => v <= remaining);
    return [...filtered, ...(remaining > 0 ? [remaining] : [])];
  }, [remaining]);

  const ticks = useMemo(() => {
    if (remaining <= 1) return [1];
    const t = [1];
    for (let i = 1; i < 4; i += 1) t.push(Math.max(1, Math.round((remaining * i) / 4)));
    t.push(remaining);
    return Array.from(new Set(t)).slice(0, 5);
  }, [remaining]);

  const setSafe = useCallback(
    (v: number) => {
      setShareCount(Math.max(1, Math.min(remaining, Math.floor(v) || 1)));
    },
    [remaining],
  );

  /* ── ارسال ایستگاه ۲ → اتصال ───────────────────────────────────────── */
  const onInitiate = useCallback(async () => {
    if (!campaign || submitting || isClosed) return;
    setError(null);
    setSubmitting(true);
    try {
      const body: { share_count: number; mobile?: string; email?: string } = {
        share_count: shareCount,
      };
      if (mobile.trim()) body.mobile = mobile.trim();
      if (email.trim()) body.email = email.trim();
      const data = await initiateParticipation(campaign.slug, body);
      if (!data?.gateway_url || !data?.authority) {
        setError('پاسخ درگاه ناقص دریافت شد؛ لطفاً دوباره تلاش کنید.');
        setSubmitting(false);
        return;
      }
      setInitiated(data);
      try {
        sessionStorage.setItem(SESSION_AUTHORITY_KEY, data.authority);
      } catch {
        /* private mode */
      }
      setStage('transfer');
      setSubmitting(false);
      // انتقال خودکارِ کوتاه-تأخیر — کاربر اینترستیشنال امن را می‌بیند
      navigatedRef.current = true;
      window.setTimeout(() => {
        try {
          window.location.assign(data.gateway_url);
        } catch {
          /* jsdom/مرورگرهای قدیمی — دکمهٔ دستی نمایش داده می‌شود */
        }
      }, 1400);
    } catch (err) {
      const mapped = classifyParticipateError(err);
      if (mapped.kind === 'insufficient') {
        // صداقتِ موجودی: رفرش زنده کن و به ایستگاه یک برگرد
        void refreshAvailability(false);
        setStage('select');
        setNotice('موجودی به‌روزرسانی شد؛ برخی سهم‌ها لحظاتی پیش رزرو شدند.');
      } else if (mapped.kind === 'auth') {
        setAuthOpen(true);
      } else {
        setError(mapped.message);
      }
      setSubmitting(false);
    }
  }, [campaign, submitting, isClosed, shareCount, mobile, email, refreshAvailability]);

  /* ── بررسیِ وضعیت از داخلِ ایستگاه سوم ─────────────────────────────── */
  const onCheckNow = useCallback(async () => {
    const authority = initiatedRef.current?.authority;
    if (!authority || checkState === 'checking') return;
    setCheckState('checking');
    try {
      const res = await verifyPaymentResult(authority);
      if (res.is_verified && res.payment_status === 'success') {
        setCheckState('success');
        setCheckDetail({
          refId: res.participation?.payment?.ref_id ?? null,
          paidAt: res.participation?.paid_at ?? null,
        });
        try {
          sessionStorage.removeItem(SESSION_AUTHORITY_KEY);
        } catch {
          /* ignore */
        }
      } else {
        setCheckState('failed');
      }
    } catch {
      setCheckState('pending');
    }
  }, [checkState]);

  if (!campaign) return null;

  const phoneValid = !mobile || /^(\+|00)?[0-9]{6,16}$/.test(mobile.replace(/\s/g, ''));
  const emailValid = !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canContinue = !submitting && !isClosed && shareCount >= 1 && shareCount <= remaining;
  const canSubmit = canContinue && phoneValid && emailValid && !authLoading && isAuthenticated;

  const gateway = gatewayDisplayName(gatewayName);

  return (
    <>
      <AnimatePresence>
        {open && !authOpen && (
          <motion.div
            key="payment-sheet-root"
            role="dialog"
            aria-modal="true"
            aria-label={`پرداخت مشارکت — ${campaign.title}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-[60] flex items-end justify-center bg-ink-900/80 p-0 backdrop-blur-md sm:items-center sm:p-5"
            onClick={(e) => {
              if (e.target === e.currentTarget && !submitting) onClose();
            }}
          >
            <motion.div
              ref={panelRef}
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="relative flex max-h-[96vh] w-full max-w-[640px] flex-col overflow-hidden rounded-t-[28px] bg-white shadow-[0_50px_100px_-25px_rgba(0,0,0,.55)] sm:max-h-[92vh] sm:rounded-[28px]"
            >
              {/* ── سربرگ: ریلِ مراحل + بستن ─────────────────────────── */}
              <div className="relative flex shrink-0 items-center justify-between border-b border-ink-100 bg-white/95 px-4 py-3 sm:px-6">
                <StepRail stage={stage} />
                <button
                  type="button"
                  onClick={() => {
                    if (!submitting) onClose();
                  }}
                  aria-label="بستن"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-50 text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* ── هیروی فشرده ───────────────────────────────────────── */}
              <div className="relative flex shrink-0 items-center gap-3 border-b border-ink-100 bg-gradient-to-b from-brand-50/60 to-white px-4 py-3 sm:px-6">
                <span className="relative h-[52px] w-[52px] shrink-0 overflow-hidden rounded-2xl bg-ink-50 ring-1 ring-ink-100">
                  <SmartImage
                    src={campaign.coverUrl ?? campaign.gallery?.[0]?.url ?? null}
                    alt={campaign.title}
                    variant="campaign"
                    fill
                    sizes="52px"
                    className="object-cover"
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="line-clamp-1 text-[14px] font-extrabold text-ink-900">
                    {campaign.title}
                  </h2>
                  <p className="mt-0.5 flex items-center gap-1 text-[11.5px] font-bold text-ink-500">
                    <span className="relative flex h-4 w-4 items-center justify-center overflow-hidden rounded-md bg-ink-50 ring-1 ring-ink-100">
                      {campaign.sponsorLogo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={campaign.sponsorLogo}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-ink-400"
                          aria-hidden="true"
                        >
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                      )}
                    </span>
                    مددکار: <span className="text-ink-700">{campaign.sponsor}</span>
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-mint-600"
                      aria-label="تأییدشده"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </p>
                </div>
                {deadlineRemaining && !deadlineRemaining.expired && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10.5px] font-extrabold tabular-nums text-amber-700 ring-1 ring-amber-200">
                    <HourglassIcon className="h-3 w-3" />
                    {deadlineRemaining.days > 0
                      ? `${formatPersianNumber(deadlineRemaining.days)} روز مانده`
                      : `${formatPersianNumber(deadlineRemaining.hours)}:${String(toPersianDigits(deadlineRemaining.mins)).padStart(2, '۰')}`}
                  </span>
                )}
              </div>

              {/* ── بدنهٔ پیمایشی ─────────────────────────────────────── */}
              <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
                <AnimatePresence mode="wait" initial={false}>
                  {/* ════════════ ایستگاه ۱ — انتخاب سهم ════════════ */}
                  {stage === 'select' && (
                    <motion.div
                      key="stage-select"
                      initial={{ opacity: 0, x: -14 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 14 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      {/* مترِ پیشرفت */}
                      <div>
                        <div className="mb-1.5 flex items-center justify-between text-[12px] font-bold text-ink-600">
                          <span>
                            {formatPersianNumber(sold)} سهم از {formatPersianNumber(total)} تأمین
                            شده
                          </span>
                          <span className="font-extrabold tabular-nums text-brand-700">
                            ٪{formatPersianNumber(progressPct)}
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-ink-100">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPct}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className="h-full rounded-full bg-gradient-to-l from-mint-500 to-brand-600"
                          />
                        </div>
                        <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium tabular-nums text-ink-500">
                          {freshness === 'loading' && (
                            <svg
                              className="h-3 w-3 animate-spin text-ink-300"
                              viewBox="0 0 24 24"
                              fill="none"
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
                          {remaining > 0 ? (
                            <>
                              سهمِ باقی‌مانده:{' '}
                              <strong className="text-ink-800">
                                {formatPersianNumber(remaining)}
                              </strong>
                              <span className="text-ink-300">·</span> هر سهم:{' '}
                              <strong className="text-ink-800">
                                {formatPersianNumber(pricePerShare)}
                              </strong>{' '}
                              تومان
                            </>
                          ) : (
                            'تمام سهم‌ها تأمین شده‌اند.'
                          )}
                        </p>
                      </div>

                      {notice && (
                        <div
                          role="status"
                          className="flex items-start gap-2 rounded-xl bg-brand-50 p-3 text-[12px] font-bold leading-6 text-brand-800 ring-1 ring-brand-100"
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
                            className="mt-0.5 shrink-0"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="16" x2="12" y2="12" />
                            <line x1="12" y1="8" x2="12.01" y2="8" />
                          </svg>
                          {notice}
                        </div>
                      )}

                      {!isClosed && (
                        <>
                          {/* انتخابگر سهم */}
                          <div className="rounded-2xl border border-ink-100 bg-gradient-to-b from-white to-brand-50/30 p-4 sm:p-5">
                            <div className="mb-3 flex items-center justify-between gap-3">
                              <span className="text-[13px] font-extrabold text-ink-700">
                                تعداد سهم
                              </span>
                              <span
                                aria-live="polite"
                                className="inline-flex h-9 items-baseline gap-1 rounded-full bg-gradient-to-l from-brand-500 to-brand-700 px-3 text-white shadow-[0_8px_20px_-6px_rgba(13,128,116,.55)]"
                              >
                                <span className="text-[18px] font-extrabold tabular-nums">
                                  {formatPersianNumber(shareCount)}
                                </span>
                                <span className="text-[11.5px] font-bold opacity-85">سهم</span>
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Stepper
                                label="−۱۰"
                                disabled={shareCount <= 1}
                                onClick={() => setSafe(shareCount - 10)}
                              />
                              <Stepper
                                label="−۱"
                                disabled={shareCount <= 1}
                                onClick={() => setSafe(shareCount - 1)}
                              />
                              <input
                                type="range"
                                min={1}
                                max={Math.max(1, remaining)}
                                step={1}
                                value={shareCount}
                                onChange={(e) => setSafe(+e.target.value)}
                                aria-label="تعداد سهم"
                                className="participate-range min-w-0 flex-1 accent-brand-600"
                                style={{
                                  background: (() => {
                                    const pct =
                                      ((shareCount - 1) / Math.max(1, remaining - 1)) * 100;
                                    return `linear-gradient(to left, var(--brand-500, #0D8074) 0%, var(--brand-700, #085C54) ${pct}%, #EAEEF2 ${pct}%, #EAEEF2 100%)`;
                                  })(),
                                }}
                              />
                              <Stepper
                                label="+۱"
                                disabled={shareCount >= remaining}
                                onClick={() => setSafe(shareCount + 1)}
                              />
                              <Stepper
                                label="+۱۰"
                                disabled={shareCount >= remaining}
                                onClick={() => setSafe(shareCount + 10)}
                              />
                            </div>
                            <div className="mt-2 flex justify-between px-1 text-[10.5px] font-bold tabular-nums text-ink-400">
                              {ticks.map((t) => (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() => setSafe(t)}
                                  className="transition-colors hover:text-brand-700"
                                >
                                  {formatPersianNumber(t)}
                                </button>
                              ))}
                            </div>
                            <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
                              <span className="ml-1 text-[11.5px] font-bold text-ink-500">
                                انتخاب سریع:
                              </span>
                              {quickPicks.map((v, i) => {
                                const isMax = i === quickPicks.length - 1 && v === remaining;
                                const active = shareCount === v;
                                return (
                                  <button
                                    key={`${v}-${i}`}
                                    type="button"
                                    onClick={() => setSafe(v)}
                                    className={`inline-flex h-8 items-center justify-center rounded-full px-3 text-[11.5px] font-extrabold tabular-nums transition-all duration-150 ${
                                      active
                                        ? 'bg-brand-500 text-white shadow-[0_6px_14px_-4px_rgba(13,128,116,.55)]'
                                        : 'bg-white text-ink-700 ring-1 ring-ink-200 hover:text-brand-700 hover:ring-brand-300'
                                    }`}
                                  >
                                    {isMax ? 'حداکثر' : formatPersianNumber(v)}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* کارت مالی زنده */}
                          <div
                            aria-live="polite"
                            className="rounded-2xl bg-brand-500 p-4 text-white shadow-[0_18px_40px_-18px_rgba(13,128,116,.55)] sm:p-5"
                          >
                            <div className="flex items-center justify-between text-[12px] font-bold opacity-85">
                              <span>قیمت هر سهم</span>
                              <span className="tabular-nums">
                                {formatPersianNumber(pricePerShare)} تومان
                              </span>
                            </div>
                            <div className="mt-1 flex items-baseline justify-between gap-3">
                              <span className="text-[12.5px] font-bold opacity-90">
                                جمع پرداختی
                              </span>
                              <motion.span
                                key={totalToman}
                                initial={{ scale: 1.06, opacity: 0.7 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.18 }}
                                className="text-[26px] font-extrabold tabular-nums leading-none sm:text-[30px]"
                              >
                                {formatPersianNumber(totalToman)}
                                <span className="mr-1 text-[12px] font-bold opacity-80">تومان</span>
                              </motion.span>
                            </div>
                            <div className="mt-1 flex items-center justify-end gap-1 text-[11px] tabular-nums opacity-75">
                              معادل {formatPersianNumber(totalRial)} ریال
                            </div>
                            {shareOfCampaignPct > 0 && (
                              <div className="mt-3 inline-flex items-center gap-1.5 border-t border-white/15 pt-3 text-[11.5px] font-medium opacity-90">
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                  aria-hidden="true"
                                >
                                  <path d="M12 3l1.9 5.8H20l-4.9 3.6 1.9 5.8L12 14.6 7 18.2l1.9-5.8L4 8.8h6.1z" />
                                </svg>
                                با این مشارکت{' '}
                                <strong className="font-extrabold">
                                  {shareOfCampaignPct < 0.1
                                    ? `کمتر از ٪${formatPersianNumber('0.1')}`
                                    : `٪${formatPersianNumber(
                                        shareOfCampaignPct.toFixed(shareOfCampaignPct < 1 ? 2 : 1),
                                      )}`}
                                </strong>{' '}
                                از این حرکت را شما تأمین می‌کنید.
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {isClosed && (
                        <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-[12.5px] font-bold leading-6 text-amber-800 ring-1 ring-amber-200">
                          <HourglassIcon className="mt-0.5 h-4 w-4 shrink-0" />
                          این حرکت سهمِ آزاد ندارد؛ به‌زودی حرکت‌های تازه رسیده می‌رسد.
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* ════════════ ایستگاه ۲ — بازبینی ════════════ */}
                  {stage === 'review' && (
                    <motion.div
                      key="stage-review"
                      initial={{ opacity: 0, x: -14 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 14 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      {/* صورتحساب */}
                      <div className="overflow-hidden rounded-2xl border border-ink-100">
                        <div className="border-b border-dashed border-ink-200 bg-ink-50/60 px-4 py-2.5 text-[12px] font-extrabold text-ink-700">
                          صورتحساب مشارکت
                        </div>
                        <dl className="space-y-2.5 px-4 py-4 text-[12.5px] font-bold">
                          <div className="flex items-center justify-between">
                            <dt className="text-ink-500">حرکت</dt>
                            <dd className="max-w-[65%] truncate text-ink-900">{campaign.title}</dd>
                          </div>
                          <div className="flex items-center justify-between">
                            <dt className="text-ink-500">مددکار</dt>
                            <dd className="text-ink-900">{campaign.sponsor}</dd>
                          </div>
                          <div className="flex items-center justify-between">
                            <dt className="text-ink-500">تعداد سهم</dt>
                            <dd className="tabular-nums text-ink-900">
                              {formatPersianNumber(shareCount)} سهم
                            </dd>
                          </div>
                          <div className="flex items-center justify-between">
                            <dt className="text-ink-500">قیمت هر سهم</dt>
                            <dd className="tabular-nums text-ink-900">
                              {formatPersianNumber(pricePerShare)} تومان
                            </dd>
                          </div>
                          <div className="border-t border-dashed border-ink-200 pt-2.5">
                            <div className="flex items-baseline justify-between">
                              <dt className="text-[13px] font-extrabold text-ink-900">جمعِ کل</dt>
                              <dd className="text-right">
                                <span className="text-[20px] font-extrabold tabular-nums text-brand-700">
                                  {formatPersianNumber(totalToman)}
                                </span>
                                <span className="mr-1 text-[11px] font-bold text-ink-500">
                                  تومان
                                </span>
                              </dd>
                            </div>
                            <p className="mt-0.5 text-left text-[10.5px] tabular-nums text-ink-400">
                              معادل {formatPersianNumber(totalRial)} ریال
                            </p>
                          </div>
                        </dl>
                      </div>

                      <GatewayBadge gateway={gateway} />

                      <div className="flex items-start gap-3 rounded-2xl border border-ink-100 bg-ink-50 p-3.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 ring-1 ring-ink-100">
                          <HourglassIcon />
                        </span>
                        <p className="text-[11.5px] font-medium leading-6 text-ink-600">
                          سهم‌های شما هنگام اتصال به درگاه{' '}
                          <strong className="text-ink-900">
                            به مدت {formatPersianNumber(RESERVE_MINUTES)} دقیقه رزرو
                          </strong>{' '}
                          می‌شوند؛ اگر پرداخت تکمیل نشود، خودکار آزاد خواهند شد و مبلغی کسر
                          نمی‌گردد.
                        </p>
                      </div>

                      {/* اطلاعات تماس اختیاری */}
                      <details
                        className="rounded-2xl border border-ink-100 bg-white"
                        open={contactOpen}
                        onToggle={(e) => setContactOpen((e.target as HTMLDetailsElement).open)}
                      >
                        <summary className="flex cursor-pointer select-none list-none items-center justify-between p-4 text-[12.5px] font-extrabold text-ink-700">
                          <span className="inline-flex items-center gap-2">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                            </svg>
                            اطلاعات تماس برای درگاه (اختیاری)
                          </span>
                          <span
                            className={`text-ink-400 transition-transform duration-200 ${contactOpen ? 'rotate-180' : ''}`}
                            aria-hidden="true"
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.6"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </span>
                        </summary>
                        <div className="grid grid-cols-1 gap-3 px-4 pb-4 sm:grid-cols-2">
                          <input
                            type="tel"
                            inputMode="tel"
                            placeholder="شماره موبایل"
                            value={mobile}
                            onChange={(e) =>
                              setMobile(e.target.value.replace(/[^0-9+]/g, '').slice(0, 16))
                            }
                            dir="ltr"
                            className={`h-11 rounded-xl bg-ink-50 px-3 text-[13px] font-medium text-ink-800 outline-none transition focus:ring-2 ${phoneValid ? 'focus:ring-brand-300' : 'ring-2 ring-rose-300'}`}
                          />
                          <input
                            type="email"
                            inputMode="email"
                            placeholder="ایمیل"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            dir="ltr"
                            className={`h-11 rounded-xl bg-ink-50 px-3 text-[13px] font-medium text-ink-800 outline-none transition focus:ring-2 ${emailValid ? 'focus:ring-brand-300' : 'ring-2 ring-rose-300'}`}
                          />
                          <p className="text-[11px] font-medium leading-6 text-ink-500 sm:col-span-2">
                            اگر خالی بماند، پروفایل شما به درگاه معرفی می‌شود؛ صدور رسید کاغذی نیز
                            با همین مشخصات انجام می‌گیرد.
                          </p>
                        </div>
                      </details>

                      {/* خطای inline */}
                      <AnimatePresence>
                        {error && (
                          <motion.div
                            key="err"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            role="alert"
                            className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-[12.5px] font-bold leading-6 text-rose-700 ring-1 ring-rose-200"
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="mt-0.5 shrink-0"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <line x1="12" y1="8" x2="12" y2="12" />
                              <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <span>{error}</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}

                  {/* ════════════ ایستگاه ۳ — انتقال به درگاه ════════════ */}
                  {stage === 'transfer' && initiated && (
                    <motion.div
                      key="stage-transfer"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-4 py-2"
                    >
                      {checkState === 'success' ? (
                        <TransferSuccess
                          title={campaign.title}
                          totalToman={totalToman}
                          shareCount={shareCount}
                          authority={initiated.authority}
                          refId={checkDetail.refId ?? null}
                          paidAt={checkDetail.paidAt ?? null}
                          onClose={onClose}
                        />
                      ) : (
                        <>
                          {/* سپرِ درگاه — هالهٔ پالس */}
                          <div className="relative mx-auto flex h-[104px] w-[104px] items-center justify-center">
                            <motion.span
                              aria-hidden="true"
                              className="absolute inset-0 rounded-full bg-[#F7B500]/15"
                              animate={{ scale: [1, 1.35], opacity: [0.8, 0] }}
                              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
                            />
                            <motion.span
                              aria-hidden="true"
                              className="absolute inset-0 rounded-full bg-[#F7B500]/20"
                              animate={{ scale: [1, 1.35], opacity: [0.8, 0] }}
                              transition={{
                                duration: 1.6,
                                repeat: Infinity,
                                ease: 'easeOut',
                                delay: 0.55,
                              }}
                            />
                            <span className="relative flex h-[76px] w-[76px] items-center justify-center rounded-full bg-gradient-to-br from-[#F7B500] to-[#E09A00] text-[#5A3B00] shadow-[0_18px_40px_-14px_rgba(224,154,0,.65)]">
                              <svg
                                width="34"
                                height="34"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.1"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                <rect x="9" y="10" width="6" height="5" rx="1" />
                                <path d="M10.5 10V8.5a1.5 1.5 0 0 1 3 0V10" />
                              </svg>
                            </span>
                          </div>

                          <div className="text-center">
                            <h3 className="text-[16px] font-extrabold text-ink-900">
                              در حال اتصال به درگاه امن {gateway}
                            </h3>
                            <p className="mt-1 text-[12px] font-medium leading-6 text-ink-500">
                              چشم‌پوشی می‌کنی به صفحه‌ی پرداخت رسمی منتقل شوی…
                            </p>
                          </div>

                          {/* کد پیگیری */}
                          <div className="flex justify-center">
                            <CopyChip value={initiated.authority} label="کد پیگیری" />
                          </div>

                          {/* مبالغ خلاصه */}
                          <div className="mx-auto flex max-w-[340px] items-center justify-between rounded-2xl bg-ink-50 px-4 py-3 text-[12px] font-bold">
                            <span className="text-ink-500">
                              {formatPersianNumber(shareCount)} سهم ×{' '}
                              {formatPersianNumber(pricePerShare)}
                            </span>
                            <span className="font-extrabold tabular-nums text-ink-900">
                              {formatTomanFull(totalToman)}
                            </span>
                          </div>

                          {/* دکمهٔ دستی اگر انتقال خودکارِ مرورگر خُرد شد */}
                          <div className="space-y-2">
                            <button
                              type="button"
                              onClick={() => {
                                navigatedRef.current = true;
                                try {
                                  window.location.assign(initiated.gateway_url);
                                } catch {
                                  /* noop */
                                }
                              }}
                              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-l from-[#F7B500] to-[#E09A00] text-[14px] font-extrabold text-[#5A3B00] shadow-[0_10px_24px_-6px_rgba(224,154,0,.55)] transition-all hover:brightness-105 active:scale-[0.99]"
                            >
                              {checkState === 'idle'
                                ? 'اگر منتقل نشدی، اینجا بزن — رفتن به درگاه'
                                : 'برگشت به درگاه برای تکمیل پرداخت'}
                            </button>

                            {/* بررسیِ وضعیت از تبِ برگشته */}
                            <div className="rounded-2xl border border-ink-100 bg-white p-3">
                              <p className="mb-2 text-center text-[11px] font-medium leading-5 text-ink-500">
                                پرداخت را در درگاه کامل کردی و به سایت برگشتی؟ همین حالا وضعیت را
                                بررسی می‌کنیم.
                              </p>
                              <button
                                type="button"
                                onClick={onCheckNow}
                                disabled={checkState === 'checking'}
                                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-brand-500 text-[12.5px] font-extrabold text-white shadow-[0_8px_16px_-6px_rgba(13,128,116,.55)] transition-all hover:bg-brand-600 active:scale-[0.99] disabled:opacity-60"
                              >
                                {checkState === 'checking' ? (
                                  <>
                                    <svg
                                      className="h-4 w-4 animate-spin"
                                      viewBox="0 0 24 24"
                                      fill="none"
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
                                    در حال بررسی…
                                  </>
                                ) : (
                                  'بررسی وضعیت پرداخت'
                                )}
                              </button>
                              {checkState === 'failed' && (
                                <p
                                  role="alert"
                                  className="mt-2 text-center text-[11.5px] font-bold text-rose-600"
                                >
                                  پرداخت تأیید نشد؛ اگر مبلغی کسر شده، خودکار برمی‌گردد. می‌توانی
                                  دوباره تلاش کنی.
                                </p>
                              )}
                              {checkState === 'pending' && (
                                <p
                                  role="status"
                                  className="mt-2 text-center text-[11.5px] font-bold text-amber-600"
                                >
                                  نتیجه فعلاً نامشخص است؛ چند ثانیهٔ دیگر دوباره بررسی کن.
                                </p>
                              )}
                            </div>
                          </div>

                          <p className="flex items-center justify-center gap-1.5 text-center text-[10.5px] font-medium text-ink-400">
                            <HourglassIcon className="h-3 w-3" />
                            سهم‌ها تا {formatPersianNumber(RESERVE_MINUTES)} دقیقه برای تو رزرو‌اند
                          </p>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── پابرگ — فقط ایستگاه‌های ۱ و ۲ ─────────────────────── */}
              {stage !== 'transfer' && (
                <div className="flex shrink-0 items-center justify-between gap-3 border-t border-ink-100 bg-white px-4 py-3.5 sm:px-6">
                  {stage === 'select' ? (
                    <>
                      <button
                        type="button"
                        onClick={onClose}
                        className="h-12 rounded-full bg-ink-50 px-5 text-[13px] font-extrabold text-ink-700 transition-colors hover:bg-ink-100"
                      >
                        انصراف
                      </button>
                      {authLoading ? (
                        <div className="flex h-12 flex-1 items-center justify-center">
                          <svg
                            className="h-5 w-5 animate-spin text-brand-500"
                            viewBox="0 0 24 24"
                            fill="none"
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
                        </div>
                      ) : isAuthenticated ? (
                        <button
                          type="button"
                          onClick={() => canContinue && setStage('review')}
                          disabled={!canContinue}
                          className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-l from-mint-500 to-brand-700 text-[14px] font-extrabold text-white shadow-[0_10px_24px_-6px_rgba(13,128,116,.55)] transition-all hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <span>ادامه — {formatPersianNumber(totalToman)} تومان</span>
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <polyline points="15 18 9 12 15 6" />
                          </svg>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setAuthOpen(true)}
                          className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-l from-brand-500 to-brand-700 text-[14px] font-extrabold text-white shadow-[0_10px_24px_-6px_rgba(13,128,116,.55)] transition-all hover:brightness-105 active:scale-[0.99]"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                            <polyline points="10 17 15 12 10 7" />
                            <line x1="15" y1="12" x2="3" y2="12" />
                          </svg>
                          ورود برای مشارکت
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          if (!submitting) {
                            setError(null);
                            setStage('select');
                          }
                        }}
                        disabled={submitting}
                        className="inline-flex h-12 items-center gap-1.5 rounded-full bg-ink-50 px-4 text-[13px] font-extrabold text-ink-700 transition-colors hover:bg-ink-100 disabled:opacity-50"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                        ویرایش سهم
                      </button>
                      <button
                        type="button"
                        onClick={onInitiate}
                        disabled={!canSubmit}
                        className="relative inline-flex h-12 flex-1 items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-l from-[#F7B500] to-[#E09A00] text-[14px] font-extrabold text-[#5A3B00] shadow-[0_10px_24px_-6px_rgba(224,154,0,.55)] transition-all hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {submitting ? (
                          <>
                            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
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
                            در حال ساخت تراکنش…
                          </>
                        ) : (
                          <>
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              <rect x="3" y="11" width="18" height="11" rx="2" />
                              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            اتصال امن به درگاه و پرداخت {formatPersianNumber(totalToman)} تومان
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              )}
              {stage === 'transfer' && checkState !== 'success' && (
                <div className="shrink-0 border-t border-ink-100 bg-white px-4 py-3 text-center">
                  <Link
                    href={`/madadkar/${encodeURIComponent(campaign.slug)}`}
                    className="text-[11.5px] font-bold text-ink-500 underline-offset-4 transition-colors hover:text-brand-700 hover:underline"
                  >
                    بازگشت به صفحهٔ حرکت
                  </Link>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ورود در جریان — بالای شیت (z-[80])؛ انتخاب کاربر حفظ می‌ماند. */}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  موفقیتِ داخلِ شیت (پس از بررسیِ وضعیت بدونِ ریدایرکتِ درگاه)              */
/* ───────────────────────────────────────────────────────────────────────── */

function TransferSuccess({
  title,
  totalToman,
  shareCount,
  authority,
  refId,
  paidAt,
  onClose,
}: {
  title: string;
  totalToman: number;
  shareCount: number;
  authority: string;
  refId: string | null;
  paidAt: string | null;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-4 py-2 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.05 }}
        className="mx-auto flex h-[84px] w-[84px] items-center justify-center rounded-full bg-gradient-to-br from-mint-500 to-brand-600 text-white shadow-[0_20px_44px_-16px_rgba(13,128,116,.6)]"
      >
        <svg
          width="38"
          height="38"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </motion.div>
      <div>
        <h3 className="text-[17px] font-extrabold text-ink-900">پرداختت تأیید شد 🙌</h3>
        <p className="mt-1 text-[12px] font-medium leading-6 text-ink-500">
          {formatPersianNumber(shareCount)} سهم از «{title}» حالا به نام توست.
        </p>
      </div>
      <div className="border-mint-200 mx-auto max-w-[360px] space-y-2 rounded-2xl border bg-mint-50/60 p-3.5 text-right">
        <div className="flex items-center justify-between text-[12px] font-bold">
          <span className="text-ink-500">مبلغ تأییدشده</span>
          <span className="font-extrabold tabular-nums text-ink-900">
            {formatTomanFull(totalToman)}
          </span>
        </div>
        {refId && (
          <div className="flex items-center justify-between text-[12px] font-bold">
            <span className="text-ink-500">شناسهٔ درگاه (ref_id)</span>
            <span dir="ltr" className="font-mono text-[11px] text-ink-800">
              {refId}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-ink-500">کد پیگیری</span>
          <span dir="ltr" className="max-w-[62%] truncate font-mono text-[10px] text-ink-600">
            {authority}
          </span>
        </div>
        {paidAt && (
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="text-ink-500">زمان پرداخت</span>
            <span className="text-ink-800">{jalaliDateTimeShort(paidAt)}</span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Link
          href={`/madadkar/paydone/?authority=${encodeURIComponent(authority)}&result=success`}
          className="inline-flex h-12 w-full items-center justify-center rounded-full bg-gradient-to-l from-mint-500 to-brand-700 text-[13.5px] font-extrabold text-white shadow-[0_10px_24px_-6px_rgba(13,128,116,.55)] transition-all hover:brightness-105 active:scale-[0.99]"
        >
          مشاهدهٔ صورت‌جلسهٔ کامل پرداخت
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="h-11 w-full rounded-full bg-ink-50 text-[12.5px] font-extrabold text-ink-700 transition-colors hover:bg-ink-100"
        >
          بستن
        </button>
      </div>
    </motion.div>
  );
}
