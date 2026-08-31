'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BadgeCheck,
  CircleAlert,
  Lock,
  Medal,
  RefreshCw,
  ShieldCheck,
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
 * BountyPanel — جزیره‌ی کلاینتِ «ثبت/افزایش جایزه»
 *
 * قراردادِ بک‌اند (بازخوانی‌شده):
 *   • POST /r4j/criminals/<id>/bounty/  {amount_toman:int ≥ 50_000}
 *     → IsFullyVerifiedUser؛ اگر کاربر قبلاً تعهدِ فعال داشته، همان
 *       رکورد «به‌روزرسانی» (نه جمع) می‌شود — UI این را صادقانه می‌گوید.
 *   • 403: پیامِ مرحله‌ای از permission (ایمیل/موبایل/پروفایل) در
 *     message آمده و اینجا با مسیرِ راهنما نمایش داده می‌شود.
 *   • GET /r4j/me/bounties/?criminal_id=<id> → تعهدِ فعلیِ کاربر؛
 *     POST /r4j/me/bounties/<id>/cancel/ → درخواست لغو (تا تأیید ادمین).
 * ═══════════════════════════════════════════════════════════════════
 */

const QUICK_AMOUNTS = [50_000, 100_000, 500_000, 1_000_000, 5_000_000];

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
      <section className="rounded-3xl border border-ink-100 bg-white p-6 text-center shadow-sm md:p-10">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-500/10 text-accent-600">
          <Lock className="h-6 w-6" aria-hidden="true" />
        </span>
        <h2 className="mt-4 text-lg font-black text-ink-900">برای ثبت جایزه وارد شوید</h2>
        <p className="mx-auto mt-2 max-w-md text-[13px] leading-7 text-ink-500">
          ثبت تعهدِ جایزه فقط برای کاربرانِ احرازهویت‌شده امکان‌پذیر است تا هر تعهد، قابل پیگیری و
          مسئولانه باشد. ورود یا ثبت‌نام کمتر از یک دقیقه طول می‌کشد.
        </p>
        <button
          type="button"
          onClick={() => setAuthOpen(true)}
          className="mt-6 rounded-2xl bg-accent-500 px-8 py-3.5 text-[14px] font-extrabold text-white shadow-lg shadow-accent-500/25 transition-all hover:bg-accent-600 active:scale-[.98]"
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
      <section
        aria-busy="true"
        className="flex items-center justify-center gap-3 rounded-3xl border border-ink-100 bg-white p-12 text-[13px] font-bold text-ink-400 shadow-sm"
      >
        <RefreshCw className="h-5 w-5 animate-spin" aria-hidden="true" />
        در حال آماده‌سازی فرمِ جایزه…
      </section>
    );
  }

  const existingMeta = existing ? bountyStatusMeta(existing.status) : null;

  return (
    <div className="flex flex-col gap-5">
      {/* موفقیت */}
      {justSaved && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-3xl border border-emerald-200 bg-emerald-50 p-5"
        >
          <BadgeCheck className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" aria-hidden="true" />
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

      {/* کارتِ وضعیتِ زنده */}
      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-3xl border border-accent-200 bg-accent-50 p-5">
          <p className="text-[11px] font-bold text-accent-700">جایزهٔ فعلیِ پرونده</p>
          <p className="mt-1 text-xl font-black tabular-nums text-accent-700 md:text-2xl">
            {liveTotal > 0 ? bountyFa(liveTotal) : 'بدون جایزهٔ فعال'}
          </p>
        </div>
        <div className="rounded-3xl border border-ink-100 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-bold text-ink-400">تعدادِ تعهدها</p>
          <p className="mt-1 text-xl font-black tabular-nums text-ink-900 md:text-2xl">
            {formatPersianNumber(liveCount)}
          </p>
        </div>
      </section>

      {/* تعهدِ فعلیِ کاربر */}
      {existing && (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-brand-200 bg-brand-50 p-5">
          <div className="flex items-center gap-3">
            <Medal className="h-6 w-6 text-brand-600" aria-hidden="true" />
            <div>
              <p className="text-[12px] font-bold text-brand-700">تعهدِ فعلیِ شما روی این پرونده</p>
              <p className="mt-0.5 text-lg font-black tabular-nums text-brand-800">
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
                className="flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3 py-1.5 text-[11px] font-extrabold text-ink-500 transition-colors hover:border-rose-300 hover:text-rose-600 disabled:opacity-50"
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
          className="rounded-3xl border border-amber-200 bg-amber-50 p-5 md:p-6"
        >
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-amber-600" aria-hidden="true" />
            <div className="min-w-0">
              <h2 className="text-[15px] font-black text-amber-800">احراز هویتِ کامل لازم است</h2>
              <p className="mt-1 text-[13px] leading-7 text-amber-800/90">{gateMessage}</p>
              <ul className="mt-3 space-y-1 text-[12px] font-bold text-amber-800/80">
                <li>۱. تأیید نشانی ایمیل</li>
                <li>۲. تأیید شمارهٔ موبایل</li>
                <li>۳. تکمیل اطلاعات پروفایل (کد ملی، تاریخ تولد، جنسیت، استان، شهر، نشانی)</li>
              </ul>
              <Link
                href="/profile"
                className="mt-4 inline-flex items-center gap-1.5 rounded-2xl bg-amber-600 px-5 py-2.5 text-[12.5px] font-extrabold text-white transition-colors hover:bg-amber-700"
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
      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-ink-100 bg-white p-5 shadow-sm md:p-6"
      >
        <h2 className="flex items-center gap-2 text-[15px] font-black text-ink-900">
          <Trophy className="h-5 w-5 text-accent-500" aria-hidden="true" />
          {hasActiveExisting ? 'ویرایش مبلغِ تعهد' : 'مبلغِ تعهدِ جایزه (تومان)'}
        </h2>
        {hasActiveExisting && (
          <p className="mt-1.5 text-[12px] font-bold leading-6 text-ink-500">
            ثبتِ مبلغِ جدید، تعهدِ قبلیِ شما را با همان به‌روزرسانی می‌کند (جمع نمی‌شود).
          </p>
        )}

        {/* تراشه‌های سریع */}
        <div className="mt-4 flex flex-wrap gap-2">
          {QUICK_AMOUNTS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => {
                setAmountRaw(a.toLocaleString('en-US'));
                setTouched(true);
              }}
              className={cn(
                'rounded-full border px-3.5 py-2 text-[12px] font-extrabold tabular-nums transition-colors',
                parsed === a
                  ? 'border-accent-500 bg-accent-500 text-white shadow-md'
                  : 'border-ink-200 bg-ink-50/60 text-ink-600 hover:border-accent-400 hover:text-accent-600',
              )}
            >
              {bountyFa(a)}
            </button>
          ))}
        </div>

        <label className="mt-4 block">
          <span className="sr-only">مبلغ به تومان</span>
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
            className={cn(
              'w-full rounded-2xl border-2 bg-ink-50/40 px-4 py-4 text-center text-xl font-black tabular-nums text-ink-900 placeholder:font-bold placeholder:text-ink-300 focus:outline-none focus:ring-4',
              amountError
                ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/10'
                : 'border-ink-200 focus:border-accent-500 focus:ring-accent-500/10',
            )}
          />
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

        {/* پیش‌نمایشِ اثرِ تعهد */}
        {projectedTotal !== null && canSubmit && (
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-ink-50 px-4 py-3 text-[12px] font-extrabold">
            <span className="text-ink-500">
              مجموعِ جایزهٔ پرونده{' '}
              {hasActiveExisting ? 'پس از ویرایش تعهدِ شما' : 'پس از ثبت تعهدِ شما'}:
            </span>
            <span className="tabular-nums text-accent-600">{bountyFa(projectedTotal)}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-5 w-full rounded-2xl bg-accent-500 py-4 text-[15px] font-black text-white shadow-lg shadow-accent-500/25 transition-all hover:bg-accent-600 active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          {submitting
            ? 'در حال ثبت…'
            : hasActiveExisting
              ? 'به‌روزرسانی تعهدِ جایزه'
              : 'ثبت تعهدِ جایزه'}
        </button>

        {/* صداقتِ مکانیزم */}
        <ul className="mt-5 space-y-1.5 text-[11px] leading-6 text-ink-400">
          <li>• این مبلغ، یک تعهدِ اعلامی از سوی شماست و ماهیتِ مردم‌به‌مردم دارد.</li>
          <li>• هر زمان می‌توانید مبلغ را ویرایش یا برای لغو، درخواست ثبت کنید.</li>
          <li>• درخواستِ لغو پس از تأیید مدیریت نهایی می‌شود؛ تا آن‌گاه تعهد فعال می‌ماند.</li>
        </ul>
      </form>
    </div>
  );
}
