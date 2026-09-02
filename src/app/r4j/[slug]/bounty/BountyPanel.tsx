'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BadgeCheck,
  CircleAlert,
  EyeOff,
  Lock,
  Medal,
  PenLine,
  ShieldCheck,
  TrendingUp,
  Trophy,
  Undo2,
} from 'lucide-react';
import { useAuth } from '@/lib/use-auth';
import { isApiError } from '@/lib/api';
import {
  BOUNTY_MIN_TOMAN,
  bountyFa,
  bountyStatusMeta,
  cancelMyBounty,
  fetchCriminalDetailLive,
  fetchMyBountyFor,
  parseTomanInput,
  setCriminalBounty,
  type MyBounty,
} from '@/lib/r4j';
import { AuthModal } from '@/components/auth/AuthModal';
import { cn, formatPersianNumber, toPersianDigits } from '@/lib/utils';

/**
 * ═══════════════════════════════════════════════════════════════════
 * BountyPanel v2 — تجربه‌ی کاملِ «صندوقِ عدالتِ مردمی»
 *
 * ستونِ اصلی: وضعیتِ زنده‌ی صندوق → تعهدِ فعلی → دروازه‌ی احراز →
 *   فرمِ مبلغ (تراشه‌ها + ورودیِ واحددار + پیش‌نمایشِ اثر) → صداقت.
 * ستونِ کناری (چسبان در دسکتاپ): دوناتِ «سهمِ شما از صندوق» →
 *   چرخه‌ی تعهد (۴ گام) → آنچه عمومی می‌شود.
 * قراردادِ بک‌اند (بدون تغییر):
 *   POST /r4j/criminals/<id>/bounty/ {amount_toman ≥ ۵۰٬۰۰۰} — set_or_update
 *   GET/POST me/bounties … — IsFullyVerifiedUser با پیامِ مرحله‌ایِ ۴۰۳.
 * ═══════════════════════════════════════════════════════════════════
 */

const QUICK_AMOUNTS = [50_000, 100_000, 500_000, 1_000_000, 5_000_000];

/* ────────────────────────────────────────────────────────────
 * اتم‌های نمایشیِ پنل
 * ──────────────────────────────────────────────────────────── */

function PanelCard({
  icon: Icon,
  title,
  hint,
  iconTone = 'bg-gold-500/15 text-gold-600',
  children,
  className,
}: {
  icon: typeof Trophy;
  title: React.ReactNode;
  hint?: string;
  iconTone?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'rounded-[26px] border border-ink-100 bg-white p-5 shadow-[0_1px_2px_rgba(15,20,32,.04),0_18px_38px_-30px_rgba(15,20,32,.25)] md:p-6',
        className,
      )}
    >
      <h2 className="flex items-center gap-2.5 text-[15px] font-black text-ink-900">
        <span
          className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', iconTone)}
        >
          <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
        </span>
        {title}
      </h2>
      {hint && <p className="mt-2 text-[12px] font-bold leading-6 text-ink-400">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function StepRow({
  icon: Icon,
  index,
  title,
  body,
  last,
}: {
  icon: typeof Trophy;
  index: number;
  title: string;
  body: string;
  last?: boolean;
}) {
  return (
    <li className="relative flex gap-3">
      {!last && (
        <span
          aria-hidden="true"
          className="absolute right-[17px] top-9 h-[calc(100%-1.75rem)] w-px"
          style={{ background: 'linear-gradient(to bottom, #D9DEE5, transparent)' }}
        />
      )}
      <span className="relative z-[1] flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold-400/40 bg-gold-500/10 text-gold-600">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 pb-5">
        <p className="text-[12.5px] font-black text-ink-800">
          <span className="me-1.5 text-[10.5px] font-black tabular-nums text-gold-600">
            {toPersianDigits(index)}
          </span>
          {title}
        </p>
        <p className="mt-1 text-[11.5px] font-medium leading-6 text-ink-500">{body}</p>
      </div>
    </li>
  );
}

export function BountyPanel({
  criminalId,
  slug,
  name,
  initialTotal,
  initialCount,
}: {
  criminalId: number;
  slug: string;
  name: string;
  initialTotal: number;
  initialCount: number;
}) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  // تعهدِ فعلیِ کاربر (در صورت وجود)
  const [existing, setExisting] = useState<MyBounty | null>(null);
  const [existingLoaded, setExistingLoaded] = useState(false);

  // فرم
  const [amountRaw, setAmountRaw] = useState('');
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [gateMessage, setGateMessage] = useState<string | null>(null);

  // وضعیتِ زنده‌ی شمارنده‌های عمومی (پس از ثبت تازه‌سازی می‌شود)
  const [liveTotal, setLiveTotal] = useState(initialTotal);
  const [liveCount, setLiveCount] = useState(initialCount);
  const [justSaved, setJustSaved] = useState<'created' | 'updated' | null>(null);

  // ── واکشیِ تعهدِ فعلیِ کاربر ─────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;
    let alive = true;
    fetchMyBountyFor(criminalId)
      .then((res) => {
        if (!alive) return;
        const active = res.results.find((b) => b.status !== 'canceled') ?? null;
        setExisting(active);
        setExistingLoaded(true);
        if (active && active.status === 'active') {
          setAmountRaw(active.amount_toman.toLocaleString('en-US'));
        }
      })
      .catch(() => {
        if (!alive) return;
        setExistingLoaded(true); // خطای شبکه مانعِ فرم نیست
      });
    return () => {
      alive = false;
    };
  }, [isAuthenticated, criminalId]);

  // ── اعتبارسنجیِ مبلغ ──────────────────────────────────────
  const parsed = useMemo(() => parseTomanInput(amountRaw), [amountRaw]);
  const amountError = touched
    ? parsed === null
      ? 'مبلغ واردشده معتبر نیست؛ فقط عدد صحیح (به تومان) وارد کنید.'
      : parsed < BOUNTY_MIN_TOMAN
        ? `حداقل مبلغِ جایزه ${bountyFa(BOUNTY_MIN_TOMAN)} است.`
        : null
    : null;
  const canSubmit = parsed !== null && parsed >= BOUNTY_MIN_TOMAN && !submitting;

  // پیش‌نمایشِ «پس از ثبت» — با آگاهی از معنای set_or_update
  const hasActiveExisting = existing !== null && existing.status === 'active';
  const projectedTotal =
    parsed !== null
      ? hasActiveExisting
        ? liveTotal - existing.amount_toman + parsed
        : liveTotal + parsed
      : null;

  // سهمِ دونات: در صورتِ مبلغِ معتبر → پس‌از-ثبت؛ وگرنه → وضعیتِ فعلی
  const sharePct = useMemo(() => {
    if (parsed !== null && parsed >= BOUNTY_MIN_TOMAN && projectedTotal && projectedTotal > 0) {
      return Math.min(100, Math.round((parsed / projectedTotal) * 100));
    }
    if (hasActiveExisting && liveTotal > 0) {
      return Math.min(100, Math.round((existing.amount_toman / liveTotal) * 100));
    }
    return null;
  }, [parsed, projectedTotal, hasActiveExisting, existing, liveTotal]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    setApiError(null);
    setGateMessage(null);
    if (parsed === null || parsed < BOUNTY_MIN_TOMAN) return;
    setSubmitting(true);
    try {
      await setCriminalBounty(criminalId, parsed);
      const wasUpdate = hasActiveExisting;
      // تازه‌سازیِ شمارنده‌های عمومی از APIِ زنده
      try {
        const fresh = await fetchCriminalDetailLive(criminalId);
        setLiveTotal(fresh.total_bounty_toman);
        setLiveCount(fresh.bounties_count);
      } catch {
        // شمارنده‌ها با restore بعدی تازه می‌شوند — ناموفقِ غیر بحرانی
        setLiveTotal((t) => (wasUpdate ? t - existing!.amount_toman + parsed : t + parsed));
        if (!wasUpdate) setLiveCount((c) => c + 1);
      }
      // تعهدِ محلی را تازه نگه دار
      try {
        const res = await fetchMyBountyFor(criminalId);
        setExisting(res.results.find((b) => b.status !== 'canceled') ?? null);
      } catch {
        setExisting((prev) =>
          prev
            ? { ...prev, amount_toman: parsed, status: 'active' }
            : {
                id: -1,
                criminal_id: criminalId,
                criminal_name: name,
                criminal_slug: slug,
                amount_toman: parsed,
                status: 'active',
                cancel_requested_at: null,
                canceled_at: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
        );
      }
      setJustSaved(wasUpdate ? 'updated' : 'created');
    } catch (err) {
      if (isApiError(err) && err.status === 403) {
        // پیامِ مرحله‌ای IsFullyVerifiedUser (تأیید ایمیل/موبایل/تکمیل پروفایل)
        setGateMessage(err.message || 'برای این عملیات باید احراز هویتِ حساب شما کامل باشد.');
      } else if (isApiError(err)) {
        setApiError(err.message || 'ثبت جایزه انجام نشد؛ دوباره تلاش کنید.');
      } else {
        setApiError('ارتباط با سامانه برقرار نشد؛ اتصال اینترنت را بررسی کنید.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel() {
    if (!existing || canceling) return;
    setCanceling(true);
    setApiError(null);
    try {
      const updated = await cancelMyBounty(existing.id);
      setExisting((prev) => (prev ? { ...prev, status: updated.status } : prev));
    } catch (err) {
      setApiError(
        isApiError(err) && err.message
          ? err.message
          : 'ثبت درخواستِ لغو انجام نشد؛ دوباره تلاش کنید.',
      );
    } finally {
      setCanceling(false);
    }
  }

  // ── مهمان ────────────────────────────────────────────────
  if (!authLoading && !isAuthenticated) {
    return (
      <section className="relative overflow-hidden rounded-[28px] border border-ink-100 bg-white p-6 text-center shadow-[0_1px_2px_rgba(15,20,32,.04),0_24px_48px_-32px_rgba(15,20,32,.3)] md:p-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-gold-500/15 blur-3xl"
        />
        <span className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-gradient-to-br from-gold-500/20 to-accent-500/15 text-gold-600 ring-1 ring-gold-400/30">
          <Lock className="h-7 w-7" aria-hidden="true" />
        </span>
        <h2 className="relative mt-5 text-lg font-black text-ink-900 md:text-xl">
          برای ثبت جایزه وارد شوید
        </h2>
        <p className="relative mx-auto mt-2.5 max-w-md text-[13px] leading-7 text-ink-500">
          ثبت تعهدِ جایزه فقط برای کاربرانِ احرازهویت‌شده امکان‌پذیر است تا هر تعهد، قابل پیگیری و
          مسئولانه باشد. ورود یا ثبت‌نام کمتر از یک دقیقه طول می‌کشد.
        </p>
        <ul className="relative mx-auto mt-5 grid max-w-md grid-cols-1 gap-2 text-center sm:grid-cols-3">
          {['تعهدِ اعلامی و شفاف', 'قابل ویرایش در هر زمان', 'لغو با تأیید مدیریت'].map((t) => (
            <li
              key={t}
              className="rounded-2xl bg-ink-50 px-3 py-2.5 text-[11px] font-extrabold text-ink-500"
            >
              {t}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setAuthOpen(true)}
          className="relative mt-7 rounded-2xl bg-accent-500 px-10 py-3.5 text-[14px] font-extrabold text-white shadow-lg shadow-accent-500/25 transition-all hover:bg-accent-600 active:scale-[.98]"
        >
          ورود / ثبت‌نام
        </button>
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      </section>
    );
  }

  const loading = authLoading || (isAuthenticated && !existingLoaded);
  if (loading) {
    return (
      <div aria-busy="true" className="grid gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-5 lg:col-span-8">
          {[180, 340].map((h) => (
            <div
              key={h}
              className="animate-pulse rounded-[26px] border border-ink-100 bg-white shadow-sm"
              style={{ height: h }}
            />
          ))}
        </div>
        <div className="hidden flex-col gap-5 lg:col-span-4 lg:flex">
          {[220, 280].map((h) => (
            <div
              key={h}
              className="animate-pulse rounded-[26px] border border-ink-100 bg-white shadow-sm"
              style={{ height: h }}
            />
          ))}
        </div>
      </div>
    );
  }

  const existingMeta = existing ? bountyStatusMeta(existing.status) : null;

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* ═════════ ستونِ اصلی ═════════ */}
      <div className="flex min-w-0 flex-col gap-5 lg:col-span-8">
        {/* موفقیت */}
        {justSaved && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-[26px] border border-emerald-200 bg-emerald-50 p-5 shadow-[0_14px_30px_-24px_rgba(22,160,107,.6)]"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600">
              <BadgeCheck className="h-6 w-6" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="text-[15px] font-black text-emerald-800">
                {justSaved === 'created'
                  ? 'تعهدِ جایزهٔ شما ثبت شد'
                  : 'تعهدِ جایزهٔ شما به‌روزرسانی شد'}
              </h2>
              <p className="mt-1 text-[12.5px] leading-7 text-emerald-700">
                جایزهٔ فعلیِ این پرونده اکنون{' '}
                <span className="font-black tabular-nums">{bountyFa(liveTotal)}</span> با{' '}
                <span className="tabular-nums">{toPersianDigits(liveCount)}</span> تعهد است. از
                همراهیِ شما در مسیرِ عدالت سپاسگزاریم.
              </p>
            </div>
          </div>
        )}

        {/* وضعیتِ زنده‌ی صندوق */}
        <section className="relative overflow-hidden rounded-[26px] border border-accent-100 bg-gradient-to-l from-accent-50/80 via-white to-white p-5 shadow-[0_1px_2px_rgba(15,20,32,.04)] md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-400 to-accent-500 text-white shadow-[0_12px_24px_-10px_rgba(255,107,26,.7)]">
                <Trophy className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-[11px] font-black text-ink-400">
                  صندوقِ لحظه‌ایِ این پرونده
                  <span className="relative flex h-2 w-2" aria-hidden="true">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                </p>
                <p className="mt-1 truncate text-2xl font-black tabular-nums leading-tight text-accent-600 md:text-[28px]">
                  {liveTotal > 0 ? bountyFa(liveTotal) : 'بدون جایزهٔ فعال'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-5">
              <div className="text-center">
                <p className="text-[22px] font-black tabular-nums leading-none text-ink-900 md:text-2xl">
                  {formatPersianNumber(liveCount)}
                </p>
                <p className="mt-1.5 text-[10.5px] font-black text-ink-400">تعهدِ ثبت‌شده</p>
              </div>
              {hasActiveExisting && liveTotal > 0 && (
                <div className="hidden border-s border-ink-100 ps-5 text-center sm:block">
                  <p className="text-[22px] font-black tabular-nums leading-none text-brand-600 md:text-2xl">
                    {sharePct !== null ? `٪${toPersianDigits(sharePct)}` : '—'}
                  </p>
                  <p className="mt-1.5 text-[10.5px] font-black text-ink-400">سهمِ فعلیِ شما</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* تعهدِ فعلیِ کاربر */}
        {existing && (
          <section className="flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-[26px] border border-brand-200 bg-gradient-to-l from-brand-50 via-white to-white p-5 shadow-[0_1px_2px_rgba(15,20,32,.04)]">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600">
                <Medal className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-[12px] font-bold text-brand-700">
                  تعهدِ فعلیِ شما روی این پرونده
                </p>
                <p className="mt-0.5 text-lg font-black tabular-nums leading-tight text-brand-800">
                  {bountyFa(existing.amount_toman)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {existingMeta && (
                <span
                  className={cn(
                    'rounded-full px-3 py-1 text-[11px] font-extrabold',
                    existingMeta.badge,
                  )}
                >
                  {existingMeta.label}
                </span>
              )}
              {existing.status === 'active' && (
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={canceling}
                  className="flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3.5 py-1.5 text-[11px] font-extrabold text-ink-500 transition-colors hover:border-rose-300 hover:text-rose-600 disabled:opacity-50"
                >
                  <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
                  {canceling ? 'در حال ثبت…' : 'درخواست لغوی تعهد'}
                </button>
              )}
            </div>
          </section>
        )}

        {/* راهنمای 403 — دروازه‌ی احراز هویت */}
        {gateMessage && (
          <section
            role="alert"
            className="rounded-[26px] border border-amber-200 bg-gradient-to-l from-amber-50 via-white to-white p-5 shadow-[0_14px_30px_-24px_rgba(245,158,11,.55)] md:p-6"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600">
                <ShieldCheck className="h-6 w-6" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h2 className="text-[15px] font-black text-amber-800">احراز هویتِ کامل لازم است</h2>
                <p className="mt-1 text-[13px] leading-7 text-amber-800/90">{gateMessage}</p>
                <ul className="mt-3 grid gap-1.5 text-[12px] font-bold text-amber-800/80 sm:grid-cols-3">
                  <li className="flex items-center gap-1.5 rounded-xl bg-amber-500/10 px-2.5 py-2">
                    <span className="font-black tabular-nums">۱</span> تأیید نشانی ایمیل
                  </li>
                  <li className="flex items-center gap-1.5 rounded-xl bg-amber-500/10 px-2.5 py-2">
                    <span className="font-black tabular-nums">۲</span> تأیید شمارهٔ موبایل
                  </li>
                  <li className="flex items-center gap-1.5 rounded-xl bg-amber-500/10 px-2.5 py-2">
                    <span className="font-black tabular-nums">۳</span> تکمیل پروفایل
                  </li>
                </ul>
                <p className="mt-2 text-[11px] leading-6 text-amber-800/60">
                  در پروفایل: کد ملی، تاریخ تولد، جنسیت، استان، شهر و نشانی لازم است.
                </p>
                <Link
                  href="/profile"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-2xl bg-amber-600 px-5 py-2.5 text-[12.5px] font-extrabold text-white shadow-md shadow-amber-600/25 transition-colors hover:bg-amber-700"
                >
                  تکمیل احراز هویت در پروفایل
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* خطای عمومی */}
        {apiError && (
          <p
            role="alert"
            className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-[12.5px] font-bold text-rose-700"
          >
            <CircleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
            {apiError}
          </p>
        )}

        {/* فرمِ مبلغ */}
        <PanelCard
          icon={Trophy}
          title={hasActiveExisting ? 'ویرایش مبلغِ تعهد' : 'مبلغِ تعهدِ جایزه (تومان)'}
          hint={
            hasActiveExisting
              ? 'ثبتِ مبلغِ جدید، تعهدِ قبلیِ شما را با همان به‌روزرسانی می‌کند (جمع نمی‌شود).'
              : undefined
          }
        >
          <form onSubmit={handleSubmit}>
            {/* تراشه‌های سریع */}
            <div
              role="group"
              aria-label="مبالغِ پیشنهادی"
              className="grid grid-cols-2 gap-2 sm:grid-cols-5"
            >
              {QUICK_AMOUNTS.map((a) => {
                const selected = parsed === a;
                return (
                  <button
                    key={a}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      setAmountRaw(a.toLocaleString('en-US'));
                      setTouched(true);
                    }}
                    className={cn(
                      'rounded-2xl border px-3 py-2.5 text-[12px] font-extrabold tabular-nums transition-all duration-200',
                      selected
                        ? 'border-accent-500 bg-gradient-to-b from-accent-500 to-accent-600 text-white shadow-[0_12px_24px_-10px_rgba(255,107,26,.65)]'
                        : 'border-ink-200 bg-ink-50/60 text-ink-600 hover:-translate-y-0.5 hover:border-accent-400 hover:text-accent-600 hover:shadow-md',
                    )}
                  >
                    {bountyFa(a)}
                  </button>
                );
              })}
            </div>

            {/* ورودیِ واحددار */}
            <label className="mt-4 block">
              <span className="sr-only">مبلغ به تومان</span>
              <span
                className={cn(
                  'relative block rounded-[22px] border-2 bg-ink-50/40 transition-all focus-within:bg-white focus-within:ring-4',
                  amountError
                    ? 'border-rose-300 focus-within:border-rose-400 focus-within:ring-rose-500/10'
                    : parsed !== null && parsed >= BOUNTY_MIN_TOMAN
                      ? 'border-emerald-300 focus-within:border-accent-500 focus-within:ring-accent-500/10'
                      : 'border-ink-200 focus-within:border-accent-500 focus-within:ring-accent-500/10',
                )}
              >
                <input
                  type="text"
                  inputMode="numeric"
                  dir="ltr"
                  value={amountRaw}
                  onChange={(e) => {
                    setAmountRaw(e.target.value);
                    setApiError(null);
                  }}
                  onBlur={() => setTouched(true)}
                  placeholder={`مثلاً ${formatPersianNumber(250_000)}`}
                  aria-invalid={Boolean(amountError)}
                  className="w-full rounded-[20px] bg-transparent px-4 py-4 pe-20 text-center text-[22px] font-black tabular-nums text-ink-900 placeholder:font-bold placeholder:text-ink-300 focus:outline-none"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 rounded-xl bg-ink-900/[.05] px-2.5 py-1 text-[11px] font-black text-ink-400"
                >
                  تومان
                </span>
              </span>
            </label>
            <p className="mt-2 flex items-center justify-between text-[11px] font-bold text-ink-400">
              <span>حداقل: {bountyFa(BOUNTY_MIN_TOMAN)}</span>
              {parsed !== null && !amountError && (
                <span className="text-accent-600">{bountyFa(parsed)}</span>
              )}
            </p>
            {amountError && (
              <p role="alert" className="mt-2 text-[12px] font-bold text-rose-600">
                {amountError}
              </p>
            )}

            {/* پیش‌نمایشِ اثرِ تعهد — قبل ← بعد */}
            {projectedTotal !== null && canSubmit && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-dashed border-accent-300/70 bg-accent-50/60 px-4 py-3">
                <span className="text-[12px] font-extrabold text-ink-500">
                  مجموعِ صندوق {hasActiveExisting ? 'پس از ویرایش' : 'پس از ثبتِ'} تعهدِ شما:
                </span>
                <span className="flex items-center gap-2 text-[13px] font-black tabular-nums">
                  <span className="text-ink-400 line-through decoration-ink-300">
                    {bountyFa(liveTotal)}
                  </span>
                  <span aria-hidden="true" className="text-accent-500">
                    ←
                  </span>
                  <span className="text-accent-600">{bountyFa(projectedTotal)}</span>
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="mt-5 w-full rounded-[22px] bg-gradient-to-b from-accent-500 to-accent-600 py-4 text-[15px] font-black text-white shadow-[0_16px_32px_-12px_rgba(255,107,26,.6)] transition-all hover:from-accent-400 hover:to-accent-500 active:scale-[.99] disabled:cursor-not-allowed disabled:from-ink-300 disabled:to-ink-300 disabled:shadow-none"
            >
              {submitting
                ? 'در حال ثبت…'
                : hasActiveExisting
                  ? 'به‌روزرسانی تعهدِ جایزه'
                  : 'ثبت تعهدِ جایزه'}
            </button>

            {/* صداقتِ مکانیزم */}
            <ul className="mt-5 grid gap-1.5 text-[11px] leading-6 text-ink-400">
              <li>• این مبلغ، یک تعهدِ اعلامی از سوی شماست و ماهیتِ مردم‌به‌مردم دارد.</li>
              <li>• هر زمان می‌توانید مبلغ را ویرایش یا برای لغو، درخواست ثبت کنید.</li>
              <li>• درخواستِ لغو پس از تأیید مدیریت نهایی می‌شود؛ تا آن‌گاه تعهد فعال می‌ماند.</li>
            </ul>
          </form>
        </PanelCard>
      </div>

      {/* ═════════ ستونِ کناری — چسبان در دسکتاپ ═════════ */}
      <aside className="flex min-w-0 flex-col gap-5 lg:col-span-4">
        <div className="flex flex-col gap-5 lg:sticky lg:top-24">
          {/* دوناتِ «سهمِ شما از صندوق» */}
          <PanelCard icon={TrendingUp} title="سهمِ شما از صندوق" hint="">
            <div className="flex items-center gap-4">
              <div
                aria-hidden="true"
                className="relative h-[104px] w-[104px] shrink-0 rounded-full"
                style={{
                  background: `conic-gradient(#FFB033 0 ${sharePct ?? 0}%, #EEF1F4 ${sharePct ?? 0}% 100%)`,
                }}
              >
                <div className="absolute inset-[10px] flex flex-col items-center justify-center rounded-full bg-white text-center shadow-inner">
                  <span className="text-[17px] font-black tabular-nums leading-none text-ink-900">
                    {sharePct !== null ? `٪${toPersianDigits(sharePct)}` : '—'}
                  </span>
                  <span className="mt-1 text-[9px] font-black text-ink-400">سهمِ شما</span>
                </div>
              </div>
              <div className="min-w-0 text-[11.5px] font-medium leading-6 text-ink-500">
                {parsed !== null && parsed >= BOUNTY_MIN_TOMAN ? (
                  <p>
                    پس از ثبت، تعهدِ شما{' '}
                    <span className="font-black tabular-nums text-accent-600">
                      {`٪${toPersianDigits(sharePct ?? 0)}`}
                    </span>{' '}
                    از صندوقِ {bountyFa(projectedTotal!)} خواهد بود.
                  </p>
                ) : hasActiveExisting ? (
                  <p>
                    تعهدِ فعلیِ شما{' '}
                    <span className="font-black tabular-nums text-brand-600">
                      {`٪${toPersianDigits(sharePct ?? 0)}`}
                    </span>{' '}
                    از صندوقِ این پرونده است. با ویرایش مبلغ، سهمِتان به‌روز می‌شود.
                  </p>
                ) : (
                  <p>
                    مبلغی وارد کنید (یا از تراشه‌ها انتخاب کنید) تا سهمِ دقیقِ شما از صندوقِ
                    پس‌از-ثبت، همین‌جا زنده محاسبه شود.
                  </p>
                )}
              </div>
            </div>
          </PanelCard>

          {/* چرخه‌ی تعهد — ۴ گام */}
          <PanelCard
            icon={PenLine}
            title="چرخه‌ی تعهدِ شما"
            iconTone="bg-brand-500/10 text-brand-600"
          >
            <ol className="flex flex-col">
              <StepRow
                icon={Trophy}
                index={1}
                title="تعهد را اعلام کنید"
                body="مبلغِ دلخواه (از ۵۰ هزار تومان به‌بالا) را به‌صورت تعهدِ اعلامی ثبت می‌کنید."
              />
              <StepRow
                icon={TrendingUp}
                index={2}
                title="صندوق بی‌درنگ به‌روز می‌شود"
                body="شمارنده‌ی عمومیِ جایزه و تعدادِ تعهدها بلافاصله پس از ثبت تازه می‌شود."
              />
              <StepRow
                icon={PenLine}
                index={3}
                title="هر زمان ویرایش کنید"
                body="ثبتِ مبلغِ جدید، همان رکوردِ قبلی را به‌روز می‌کند — بدون ایجادِ تعهدِ تکراری."
              />
              <StepRow
                icon={Undo2}
                index={4}
                title="لغو، با یک درخواست"
                body="درخواستِ لغو ثبت می‌شود و پس از تأیید مدیریت، تعهد از صندوق خارج می‌شود."
                last
              />
            </ol>
          </PanelCard>

          {/* حریمِ عمومی */}
          <section className="rounded-[26px] border border-ink-800/5 bg-ink-900 p-5 text-white shadow-[0_24px_48px_-28px_rgba(15,20,32,.8)] md:p-6">
            <h2 className="flex items-center gap-2.5 text-[14px] font-black text-white">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-mint-400">
                <EyeOff className="h-[18px] w-[18px]" aria-hidden="true" />
              </span>
              آنچه عمومی می‌شود
            </h2>
            <ul className="mt-4 space-y-2.5 text-[11.5px] leading-6 text-white/70">
              <li>
                • در نمایشِ عمومی فقط <span className="font-black text-white">مجموعِ جایزه</span> و{' '}
                <span className="font-black text-white">تعدادِ تعهدها</span> دیده می‌شود.
              </li>
              <li>
                • مبلغِ تعهد و هویتِ تعهدکننده در سایت منتشر نمی‌شود؛ فهرستِ تعهدها فقط در حسابِ
                خودِ شماست.
              </li>
              <li>
                • درخواستِ لغو تا زمانِ تأیید مدیریت، تعهد را از چرخه خارج نمی‌کند — شفاف و قابلِ
                پیگیری.
              </li>
            </ul>
          </section>
        </div>
      </aside>
    </div>
  );
}
