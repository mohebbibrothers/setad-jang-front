'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

import { useAuth } from '@/lib/use-auth';
import { CampaignParticipateModal } from '@/components/home/CampaignParticipateModal';
import type { CampaignCard } from '@/components/home/WarFundSection';
import type { AlbumImage } from '@/components/home/CampaignAlbum';

/**
 * Sticky right-rail CTA for `/madadkar/[slug]`.
 *
 * Behaviour
 * ─────────
 *  • Auth-gated: if signed out we render a friendly login/signup card
 *    that includes the current pathname as `?next=` so the user comes
 *    right back to this campaign after authenticating.
 *  • If the campaign is closed / fully funded, we swap the CTA for a
 *    read-only status card (no orphan buttons that do nothing).
 *  • Otherwise the button opens the existing production-grade
 *    <CampaignParticipateModal /> — same one used from the homepage
 *    grid — so we don't fork the checkout flow into two code paths.
 */
export function CampaignParticipateCTA({
  campaign,
}: {
  campaign: {
    slug: string;
    title: string;
    sharePriceToman: number;
    remainingShares: number;
    totalShares: number;
    sponsorName?: string;
    coverImage: string | null;
    status: string;
    isFullyFunded: boolean;
    gallery: AlbumImage[];
  };
}) {
  const { user, isAuthenticated, loading } = useAuth();
  const [open, setOpen] = useState(false);
  // While the client is hydrating or fetching /auth/me/ we don't yet
  // know whether the user is signed in. Show a subtle skeleton instead
  // of flashing the anon CTA to authenticated users.
  const ready = !loading || !isAuthenticated;

  const disabled =
    campaign.isFullyFunded ||
    campaign.remainingShares <= 0 ||
    campaign.status === 'completed' ||
    campaign.status === 'closed';

  // Build the exact CampaignCard shape the modal expects.
  const card: CampaignCard = {
    slug: campaign.slug,
    title: campaign.title,
    sponsor: campaign.sponsorName ?? '',
    totalAmount: campaign.sharePriceToman * campaign.totalShares,
    sharePrice:  campaign.sharePriceToman,
    sharesTotal: campaign.totalShares,
    sharesRemaining: campaign.remainingShares,
    progressPercent:
      campaign.totalShares > 0
        ? Math.round(((campaign.totalShares - campaign.remainingShares) / campaign.totalShares) * 100)
        : 0,
    coverUrl: campaign.coverImage ?? undefined,
    gallery: campaign.gallery,
    isFullyFunded: campaign.isFullyFunded,
  };

  const returnPath = `/madadkar/${encodeURIComponent(campaign.slug)}`;

  return (
    <>
      <div className="rounded-[24px] border border-ink-100 bg-gradient-to-br from-brand-600 to-brand-800 text-white p-5 md:p-6 shadow-[0_24px_60px_-30px_rgba(11,53,48,.4)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 12v10H4V12"/><rect x="2" y="7" width="20" height="5"/><path d="M12 22V7 M12 7H7.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7z M12 7h4.5a2.5 2.5 0 1 0 0-5C13 2 12 7 12 7z"/>
            </svg>
          </span>
          <div className="min-w-0">
            <h2 className="text-[15px] md:text-[16px] font-extrabold leading-none">مشارکت در حرکت</h2>
            <p className="text-[11.5px] text-white/70 mt-1 truncate">
              قیمت هر سهم: {campaign.sharePriceToman.toLocaleString('fa-IR')} تومان
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!ready ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="h-11 rounded-xl bg-white/10 animate-pulse" />
            </motion.div>
          ) : disabled ? (
            <motion.div key="disabled" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-white/10 ring-1 ring-white/15">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                <p className="text-[13px] font-extrabold">
                  {campaign.isFullyFunded ? 'این حرکت به‌طور کامل تأمین شده است.' : 'مشارکت در این حرکت پایان یافته است.'}
                </p>
              </div>
              <Link
                href="/#warfund"
                className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-white text-brand-700 font-extrabold text-[13.5px] hover:bg-brand-50 transition-colors"
              >
                <span>حرکت‌های دیگر</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
              </Link>
            </motion.div>
          ) : !user ? (
            <motion.div key="anon" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <p className="text-[12.5px] text-white/85 leading-6">
                برای مشارکت در این حرکت، ابتدا وارد حساب کاربری شوید.
              </p>
              <Link
                href={`/auth/login?next=${encodeURIComponent(returnPath)}`}
                className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-mint-500 hover:bg-mint-600 text-white font-extrabold text-[13.5px] transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                <span>ورود / ثبت‌نام</span>
              </Link>
              <p className="text-[11px] text-white/60 text-center">بازگشت خودکار به همین صفحه پس از ورود</p>
            </motion.div>
          ) : (
            <motion.div key="cta" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-xl bg-white text-brand-700 font-extrabold text-[14.5px] hover:bg-brand-50 active:scale-[0.98] transition-all shadow-[0_10px_24px_-8px_rgba(255,255,255,.35)]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-5.7-2.5L1.5 14a2 2 0 0 1 3-2.6L7 13"/></svg>
                <span>مدد به این حرکت</span>
              </button>
              <ul className="text-[11.5px] text-white/70 space-y-1.5">
                <li className="flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  تراکنش امن از طریق درگاه رسمی
                </li>
                <li className="flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  رزرو سهم ۱۵ دقیقه‌ای هنگام پرداخت
                </li>
                <li className="flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  رسید قابل استعلام پس از پرداخت
                </li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <CampaignParticipateModal
        open={open}
        onClose={() => setOpen(false)}
        campaign={open ? card : null}
      />
    </>
  );
}
