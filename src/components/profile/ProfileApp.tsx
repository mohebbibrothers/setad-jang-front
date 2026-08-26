'use client';

/**
 * ═══════════════════════════════════════════════════════════════════
 * ProfileApp — مغزِ صفحه‌ی حساب کاربری (/profile)
 *
 * معماری داده (سینکِ دقیق با بک‌اند — بدون حدس):
 *   • «کاربر» منبعِ واحدش auth-user-cache است (آنچه /auth/me برمی‌گرداند
 *     + هر خروجیِ UserMe از میوتیشن‌ها) — هدر و این صفحه همیشه یک‌نمای
 *     واحد را می‌بینند.
 *   • ورود: به‌محضِ داشتنِ سشن، یک refreshِ پس‌زمینه (GET /auth/me) و
 *     بارگذاریِ صفحه‌ی اولِ نشست‌ها؛ میوتیشن‌ها پاسخِ کاملِ سرور را
 *     جایگزین می‌کنند (هیچ گمانه‌ای در کار نیست).
 *   • مهمان: حالتِ خالیِ طراحی‌شده + AuthModalِ توکار؛ بلافاصله بعد از
 *     ورودِ موفق، همین صفحه بدون ناوبریِ اضافه ساخته می‌شود.
 *
 * ساختار: ProfileHero → Segmented (همان کپسولِ مودال) → سه بخش:
 *   هویتی و تکمیلی | شناسه‌های ورود | امنیت و نشست‌ها
 *   جابه‌جایی بخش‌ها با MorphSwap (هدایت‌گرِ یگانه‌ی موشنِ ما).
 * ═══════════════════════════════════════════════════════════════════
 */

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IdCard, KeyRound, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/use-auth';
import { listSessionsPage, type AuthUser, type AuthSession, type SessionsPage } from '@/lib/auth';
import { computeProfileCompletion } from '@/lib/profile-completion';
import { Segmented } from '@/components/auth/segmented';
import { MorphSwap } from '@/components/auth/morph-swap';
import { AuthModal } from '@/components/auth/AuthModal';
import { Alert } from '@/components/auth/ui';
import { ProfileHero } from './ProfileHero';
import { IdentitySection } from './IdentitySection';
import { IdentifiersSection } from './IdentifiersSection';
import { SecuritySection } from './SecuritySection';

type Tab = 'identity' | 'identifiers' | 'security';

const TABS = [
  // short: نسخه‌ی فشرده‌ی برچسب برای گوشی؛ سه تبِ سه‌ستونه در عرضِ ~۳۶۰px
  // هرکدام فقط ~۹۰px جا دارند و برچسب‌های کامل (مخصوصاً «امنیت و
  // نشست‌ها» + آیکن) از سلول خارج می‌زدند و کپسول «در هم» می‌رفت
  // (گزارشِ کارفرما). نامِ دسترس‌پذیر همچنان برچسبِ کامل می‌ماند.
  { value: 'identity', label: 'اطلاعات حساب', short: 'حساب', icon: <IdCard className="h-4 w-4" /> },
  {
    value: 'identifiers',
    label: 'شناسه‌ها',
    short: 'شناسه‌ها',
    icon: <KeyRound className="h-4 w-4" />,
  },
  {
    value: 'security',
    label: 'امنیت و نشست‌ها',
    short: 'امنیت',
    icon: <ShieldCheck className="h-4 w-4" />,
  },
] as const;

/* ── اسکلتِ بارگذاری (بدون جهش چیدمان) ─────────────────────────────────── */

function Skeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      <div className="h-44 animate-pulse rounded-[28px] bg-ink-100/80" />
      <div className="mx-auto h-12 max-w-md animate-pulse rounded-xl bg-ink-100/80" />
      {[180, 220, 140].map((h) => (
        <div key={h} className="animate-pulse rounded-2xl bg-ink-100/60" style={{ height: h }} />
      ))}
    </div>
  );
}

/* ── حالتِ مهمان ────────────────────────────────────────────────────────── */

function GuestState({ onOpenAuth }: { onOpenAuth: () => void }) {
  return (
    <div className="mx-auto max-w-md py-6 text-center">
      <span
        aria-hidden="true"
        className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[28px] bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-[0_20px_40px_-16px_rgba(13,128,116,.6)]"
      >
        <LockKeyhole className="h-9 w-9" strokeWidth={1.8} />
      </span>
      <h1 className="text-[20px] font-extrabold text-ink-900">حساب کاربری شما</h1>
      <p className="mx-auto mt-2 max-w-sm text-[13.5px] leading-7 text-ink-500">
        برای دیدن و ویرایش اطلاعات حساب، مدیریت شناسه‌های ورود، تغییر رمز و کنترل نشست‌ها، ابتدا
        وارد شوید.
      </p>
      <button
        type="button"
        onClick={onOpenAuth}
        className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-brand-500 to-brand-600 px-8 text-[14.5px] font-extrabold text-white shadow-[0_10px_24px_-10px_rgba(13,128,116,.55)] transition-all duration-300 hover:shadow-[0_16px_32px_-10px_rgba(13,128,116,.6)] hover:brightness-[1.05] active:scale-[.99]"
      >
        ورود | ثبت‌نام
      </button>
    </div>
  );
}

/* ── اپ ──────────────────────────────────────────────────────────────────── */

export function ProfileApp() {
  const router = useRouter();
  const { isAuthenticated, user, loading, refresh } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('identity');
  const [pageAlert, setPageAlert] = useState<{ kind: 'error' | 'success'; text: string } | null>(
    null,
  );

  const [sessionsPage, setSessionsPage] = useState<SessionsPage | null>(null);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [sessionsLoadingMore, setSessionsLoadingMore] = useState(false);
  const [sessionsPageNo, setSessionsPageNo] = useState(1);

  // سینکِ پس‌زمینه با سرور (بدون اسکلت: محتوا از کش فوری رندر می‌شود)
  useEffect(() => {
    if (!isAuthenticated) return;
    void refresh();
    let cancelled = false;
    listSessionsPage(1)
      .then((page) => {
        if (cancelled) return;
        setSessionsPage(page);
        setSessionsPageNo(1);
        setSessionsError(null);
      })
      .catch(() => {
        if (!cancelled) setSessionsError('فهرست نشست‌ها دریافت نشد.');
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, refresh]);

  const loadMoreSessions = useCallback(async () => {
    if (sessionsLoadingMore) return;
    setSessionsLoadingMore(true);
    try {
      const next = await listSessionsPage(sessionsPageNo + 1);
      setSessionsPageNo((n) => n + 1);
      setSessionsPage((prev) =>
        prev
          ? {
              results: [...prev.results, ...next.results],
              count: next.count,
              next: next.next,
            }
          : next,
      );
    } catch {
      setSessionsError('بارگذاری نشست‌های بیشتر انجام نشد.');
    } finally {
      setSessionsLoadingMore(false);
    }
  }, [sessionsLoadingMore, sessionsPageNo]);

  const patchSession = useCallback((fresh: AuthSession) => {
    setSessionsPage((prev) =>
      prev ? { ...prev, results: prev.results.map((s) => (s.id === fresh.id ? fresh : s)) } : prev,
    );
  }, []);

  /* ── مهمان ── */
  if (!isAuthenticated) {
    // هنوز وضعیتِ سشن معلوم نشده (از hydrated نشدن) → اسکلتِ سبک
    if (loading) {
      return (
        <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
          <Skeleton />
        </div>
      );
    }
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <GuestState onOpenAuth={() => setAuthOpen(true)} />
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      </div>
    );
  }

  /* ── واردشده ولی کاربر هنوز نیامده ── */
  if (!user) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <Skeleton />
      </div>
    );
  }

  const profile = user.profile ?? null;
  const completion = computeProfileCompletion(user, profile);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="space-y-4">
        {pageAlert ? (
          <Alert kind={pageAlert.kind} role={pageAlert.kind === 'error' ? 'alert' : 'status'}>
            {pageAlert.text}
          </Alert>
        ) : null}

        <ProfileHero
          user={user}
          profile={profile}
          completion={completion}
          onAvatarError={(text) => setPageAlert({ kind: 'error', text })}
          onGoFields={() => setTab('identity')}
        />

        <div className="rounded-2xl border border-ink-100 bg-white p-2 shadow-[0_8px_30px_-18px_rgba(15,20,32,.18)]">
          <Segmented<Tab>
            ariaLabel="بخش‌های حساب کاربری"
            value={tab}
            onChange={setTab}
            indicatorTestId="profile-tab-indicator"
            className="!bg-transparent !shadow-none !ring-0 sm:bg-ink-50 sm:shadow-[inset_0_1px_2px_rgba(15,20,32,0.06)] sm:ring-1 sm:ring-inset sm:ring-ink-900/[0.04]"
            buttonClassName="flex h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-1 text-[12.5px] font-bold transition-[color,transform] duration-150 active:scale-[0.97] sm:text-[13px]"
            activeButtonClassName="text-brand-700"
            inactiveButtonClassName="text-ink-500 hover:text-ink-700"
            options={TABS.map((t) => ({
              value: t.value,
              label: (
                <>
                  {t.icon}
                  {/* دو نسخه‌ی متنی: کامل ≥sm و کوتاه <sm. نسخه‌ی کوتاه
                      aria-hidden است تا نامِ دسترس‌پذیرِ تب (صفحه‌خوان‌ها و
                      کوئریِ byRole در تست‌ها) همیشه برچسبِ کامل بماند. */}
                  <span className="hidden sm:inline">{t.label}</span>
                  <span aria-hidden="true" className="sm:hidden">
                    {t.short}
                  </span>
                </>
              ),
            }))}
          />
        </div>

        <MorphSwap swapKey={tab}>
          {tab === 'identity' ? (
            <IdentitySection key="identity" user={user as AuthUser} profile={profile} />
          ) : tab === 'identifiers' ? (
            <IdentifiersSection key="identifiers" user={user as AuthUser} />
          ) : (
            <SecuritySection
              key="security"
              sessionsPage={sessionsPage}
              onPatchSession={patchSession}
              onLoadMoreSessions={loadMoreSessions}
              loadingMoreSessions={sessionsLoadingMore}
              onLoggedOut={() => router.push('/')}
            />
          )}
        </MorphSwap>

        {sessionsError ? (
          <div className="pt-1 text-center">
            <p className="text-[12px] font-medium text-rose-600">{sessionsError}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
