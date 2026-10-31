'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle2,
  HandHeart,
  Loader2,
  LogIn,
  Pencil,
  PhoneCall,
  Send,
  Trash2,
  XCircle,
} from 'lucide-react';
import { AuthModal } from '@/components/auth/AuthModal';
import { useAuth } from '@/lib/use-auth';
import { cn, formatPersianNumber as fa } from '@/lib/utils';
import {
  fetchMyOffer,
  isAuthRequired,
  offerErrorMessage,
  offerStatusMeta,
  submitKindnessOffer,
  withdrawKindnessOffer,
  type MyOffer,
} from '@/lib/kindness-listing';

/**
 * ───────────────────────────────────────────────────────────────────────────
 * ListingOfferBox — «من هم می‌توانم کمک کنم» (تنها نوشتنِ کاربر در این دامنه)
 *
 * سیاستِ v2: تماس، راهِ اصلی است؛ اعلامِ آمادگی یک **سیگنالِ اختیاری** برای
 * کاربرِ ثبت‌نام‌کرده است که به تیمِ بعثت می‌گوید چند نفر پای کارند و اجازهٔ
 * پیگیری می‌دهد. پس این باکس هرگز جای تماس را نمی‌گیرد، بلکه *کنارِ* آن
 * می‌نشیند و برای مهمان هم تجربهٔ کامل دارد (مودالِ ورود، بدونِ بن‌بست).
 *
 * ماتریسِ حالت‌ها (همه پوشش داده شده):
 *   ۱) مهمان                     → دکمهٔ «ورود و اعلام آمادگی» + توضیح
 *   ۲) واردشده، بدون اعلام       → فرم با textarea (≤۵۰۰ نویسه) + شمارنده
 *   ۳) اعلامِ «جدید»             → کارتِ وضعیت + ویرایشِ پیام + پس‌گرفتن
 *   ۴) «تماس گرفته شد»           → کارتِ وضعیت (قفل) + راهِ پیگیری
 *   ۵) «رد شد»                   → کارتِ وضعیت + دعوت به نیازهای دیگر
 *   ۶) خطا (۴۲۹/۴۰۱/شبکه)       → پیامِ انسانی + تلاشِ دوباره
 *
 * نکاتِ ریز:
 *   • وضعیت پس از mount از `my-offers` خوانده می‌شود (رندرِ سروری بی‌توکن است
 *     و `my_offer_status` همیشه null برمی‌گردد) — با اسکلتِ لودینگ تا پرش نباشد.
 *   • پیامِ موفقیت ۲.۵ ثانیه بعد نرم محو می‌شود؛ فوکوس به دکمهٔ اصلی برمی‌گردد.
 *   • Escape/کلیکِ بیرون برای بستنِ مودالِ ورود توسط خودِ AuthModal مدیریت می‌شود.
 *   • همهٔ دکمه‌ها در موبایل h-11 (لمسِ راحت) و در دسکتاپ جمع‌وجورتر می‌شوند.
 * ───────────────────────────────────────────────────────────────────────────
 */

const MAX_MESSAGE = 500;

type Phase = 'boot' | 'idle' | 'form' | 'editing';

export function ListingOfferBox({
  slug,
  listingTitle,
  openOffersCount,
}: {
  slug: string;
  listingTitle: string;
  openOffersCount?: number;
}) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [phase, setPhase] = useState<Phase>('boot');
  const [offer, setOffer] = useState<MyOffer | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const alive = useRef(true);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      if (savedTimer.current) clearTimeout(savedTimer.current);
    };
  }, []);

  /* ── خواندنِ وضعیت پس از مشخص‌شدنِ نشست ─────────────────────────── */
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setPhase('idle');
      setOffer(null);
      return;
    }
    let active = true;
    setPhase('boot');
    fetchMyOffer(slug)
      .then((mine) => {
        if (!active) return;
        setOffer(mine);
        setMessage(mine?.message ?? '');
        setPhase(mine ? 'idle' : 'form');
      })
      .catch(() => {
        if (active) setPhase('form');
      });
    return () => {
      active = false;
    };
  }, [slug, isAuthenticated, authLoading]);

  const meta = offerStatusMeta(offer?.status ?? null);

  const submit = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const saved = await submitKindnessOffer(slug, message);
      if (!alive.current) return;
      setOffer(saved);
      setPhase('idle');
      setJustSaved(true);
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => {
        if (alive.current) setJustSaved(false);
      }, 2500);
    } catch (err) {
      if (!alive.current) return;
      if (isAuthRequired(err)) {
        setAuthOpen(true);
        setPhase('idle');
      } else {
        setError(offerErrorMessage(err));
      }
    } finally {
      if (alive.current) setBusy(false);
    }
  }, [slug, message]);

  const withdraw = useCallback(async () => {
    if (!offer?.id) return;
    setBusy(true);
    setError(null);
    try {
      await withdrawKindnessOffer(offer.id);
      if (!alive.current) return;
      setOffer(null);
      setMessage('');
      setPhase('form');
    } catch (err) {
      if (alive.current) setError(offerErrorMessage(err));
    } finally {
      if (alive.current) setBusy(false);
    }
  }, [offer?.id]);

  /* ── کارتِ اسکلت (پیش از مشخص‌شدنِ وضعیت) ───────────────────────── */
  if (phase === 'boot' || authLoading) {
    return (
      <div
        className="rounded-[24px] border border-ink-100 bg-white p-5"
        aria-busy="true"
        data-testid="kw-offer-skeleton"
      >
        <div className="skeleton h-4 w-40 rounded-md" />
        <div className="skeleton mt-3 h-3 w-64 rounded-md" />
        <div className="skeleton mt-4 h-11 w-full rounded-xl" />
      </div>
    );
  }

  const openers = typeof openOffersCount === 'number' ? openOffersCount : 0;

  return (
    <div
      className="overflow-hidden rounded-[24px] border border-ink-100 bg-white shadow-[0_2px_14px_-8px_rgba(15,20,32,.14)]"
      data-testid="kw-offer-box"
      id="offer"
    >
      {/* سربرگ */}
      <div className="flex items-start gap-3 border-b border-ink-100 bg-[linear-gradient(180deg,#f7fbfa,#ffffff)] px-4 py-4 sm:px-5">
        <span
          aria-hidden="true"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-500/10 text-brand-700 ring-1 ring-brand-100"
        >
          <HandHeart className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-black text-ink-900">من هم می‌توانم کمک کنم</p>
          <p className="mt-1 text-[11px] font-medium leading-6 text-ink-500">
            اگر می‌توانی این نیاز را برآورده کنی، اعلام کن تا تیمِ بعثت بداند چند نفر پای کارند —
            تماسِ اصلی همچنان از راه‌های ارتباطیِ بالا انجام می‌شود.
          </p>
        </div>
        {openers > 0 && (
          <span className="mt-1 hidden shrink-0 rounded-full bg-mint-50 px-2.5 py-1 text-[10.5px] font-extrabold text-mint-700 ring-1 ring-mint-100 sm:inline-flex">
            {`${fa(openers)} نفر پیش از تو`}
          </span>
        )}
      </div>

      <div className="p-4 sm:p-5">
        {/* ── ۱) مهمان ─────────────────────────────────────────────── */}
        {!isAuthenticated && (
          <>
            <button
              type="button"
              onClick={() => setAuthOpen(true)}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#0D8074,#0A6E64_50%,#085C54)] text-[13px] font-extrabold text-white shadow-[0_6px_14px_-6px_rgba(13,128,116,.55)] transition-all hover:brightness-[1.08] active:scale-[.99]"
            >
              <LogIn className="h-4 w-4" aria-hidden="true" />
              ورود و ثبتِ اعلام آمادگی
            </button>
            <p className="mt-2.5 text-center text-[10.5px] font-medium leading-5 text-ink-400">
              برای ثبتِ اعلام آمادگی فقط لازم است وارد شوی؛ دیدنِ آگهی و راه‌های تماس آزاد است.
            </p>
          </>
        )}

        {/* ── ۲) فرم ───────────────────────────────────────────────── */}
        {isAuthenticated && (phase === 'form' || phase === 'editing') && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            <label className="block">
              <span className="mb-1.5 flex items-center justify-between text-[11.5px] font-extrabold text-ink-700">
                پیامِ اختیاری برای تیمِ بعثت
                <span
                  className={cn(
                    'text-[10.5px] font-bold tabular-nums',
                    message.length > MAX_MESSAGE - 50 ? 'text-amber-600' : 'text-ink-400',
                  )}
                >
                  {`${fa(message.length)}/${fa(MAX_MESSAGE)}`}
                </span>
              </span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE))}
                rows={3}
                placeholder="مثلاً: «یک پتوی نو در منزل دارم و می‌توانم تا پایان هفته برسانم.»"
                className="w-full resize-y rounded-2xl border border-ink-200 bg-ink-50/50 px-3.5 py-3 text-[12.5px] font-medium leading-7 text-ink-900 transition-colors placeholder:text-ink-400 focus:border-brand-500 focus:bg-white focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/25"
              />
            </label>

            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
              <button
                type="submit"
                disabled={busy}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#0D8074,#0A6E64_50%,#085C54)] text-[13px] font-extrabold text-white shadow-[0_6px_14px_-6px_rgba(13,128,116,.55)] transition-all hover:brightness-[1.08] active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {busy ? (
                  <Loader2
                    className="h-4 w-4 animate-spin motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                ) : (
                  <Send className="h-4 w-4" aria-hidden="true" />
                )}
                {offer ? 'ذخیرهٔ پیام' : 'ثبتِ اعلام آمادگی'}
              </button>
              {phase === 'editing' && (
                <button
                  type="button"
                  onClick={() => {
                    setPhase('idle');
                    setMessage(offer?.message ?? '');
                    setError(null);
                  }}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-ink-200 px-4 text-[12px] font-extrabold text-ink-600 transition-colors hover:border-ink-300 hover:text-ink-900"
                >
                  انصراف
                </button>
              )}
            </div>
          </form>
        )}

        {/* ── ۳) کارتِ وضعیت ───────────────────────────────────────── */}
        {isAuthenticated && phase === 'idle' && offer && meta && (
          <div>
            <div
              className={cn(
                'flex items-start gap-3 rounded-2xl px-3.5 py-3 ring-1',
                meta.tone === 'mint' && 'bg-mint-50/70 ring-mint-100',
                meta.tone === 'brand' && 'bg-brand-50/70 ring-brand-100',
                meta.tone === 'amber' && 'bg-amber-50/70 ring-amber-100',
                meta.tone === 'rose' && 'bg-rose-50/70 ring-rose-100',
              )}
            >
              <span className="mt-0.5 shrink-0">
                {meta.tone === 'rose' ? (
                  <XCircle className="h-[18px] w-[18px] text-rose-600" aria-hidden="true" />
                ) : meta.tone === 'brand' ? (
                  <PhoneCall className="h-[18px] w-[18px] text-brand-700" aria-hidden="true" />
                ) : (
                  <CheckCircle2 className="h-[18px] w-[18px] text-mint-600" aria-hidden="true" />
                )}
              </span>
              <div className="min-w-0">
                <p className="text-[12.5px] font-black text-ink-900">{meta.label}</p>
                <p className="mt-1 text-[11px] font-medium leading-6 text-ink-600">{meta.hint}</p>
              </div>
            </div>

            {offer.message?.trim() && (
              <p className="mt-3 rounded-xl bg-ink-50 px-3.5 py-2.5 text-[11.5px] font-medium leading-6 text-ink-600 ring-1 ring-ink-100">
                <span className="font-extrabold text-ink-700">پیامِ تو: </span>
                {offer.message}
              </p>
            )}

            {meta.editable && (
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setPhase('editing')}
                  className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-ink-200 text-[12px] font-extrabold text-ink-700 transition-colors hover:border-brand-300 hover:text-brand-700"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  ویرایشِ پیام
                </button>
                <button
                  type="button"
                  onClick={() => void withdraw()}
                  disabled={busy}
                  className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-rose-200 text-[12px] font-extrabold text-rose-600 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy ? (
                    <Loader2
                      className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none"
                      aria-hidden="true"
                    />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  پس‌گرفتن
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── بازخوردها ────────────────────────────────────────────── */}
        <AnimatePresence initial={false}>
          {justSaved && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-mint-50 px-3 py-2 text-[11.5px] font-extrabold text-mint-700 ring-1 ring-mint-100"
              role="status"
            >
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              اعلامِ آمادگیِ تو ثبت شد — ممنون که هستی.
            </motion.p>
          )}
        </AnimatePresence>

        {error && (
          <p
            role="alert"
            className="mt-3 rounded-xl bg-rose-50 px-3.5 py-2.5 text-[11.5px] font-bold leading-6 text-rose-700 ring-1 ring-rose-100"
          >
            {error}
          </p>
        )}
      </div>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        initialView="login"
        /* پس از ورود، اثرِ useAuth دوباره وضعیت را می‌خواند؛ نیازی به reload نیست. */
      />
      <span className="sr-only">{listingTitle}</span>
    </div>
  );
}
