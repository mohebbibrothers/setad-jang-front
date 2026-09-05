'use client';

import { useCallback, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatPersianNumber } from '@/lib/utils';
import { campaignCtaLabel, type CampaignLifecycle } from '@/lib/madadkar';
import { PaymentSheet, type PaymentSheetCampaign } from './PaymentSheet';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ParticipateIsland — جزیرهٔ تعاملیِ صفحهٔ جزئیاتِ حرکت
 *
 * دو سطحِ CTA را مالک است و شیتِ پرداخت را حاضرِ دائم نگه می‌دارد:
 *   ۱) دکمهٔ بزرگِ زیرِ هیرو (دسکتاپ/موبایل)
 *   ۲) نوارِ چسبانِ پایینِ موبایل — قیمت هر سهم + دکمهٔ «مدد به حرکت»
 *      که هنگام اسکرولِ توضیحات/گالری همیشه در دستانِ شست است.
 *
 * چرخه عمر (active/completed/closed) رفتار دکمه‌ها را قطعی می‌کند؛
 * اشتراک لینکِ صفحه با Web Share API (fallback: کپی به کلیپ‌بورد).
 * ═══════════════════════════════════════════════════════════════════════════
 */

function HandIcon({ className = 'h-[18px] w-[18px]' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.1}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M18 11V6a2 2 0 0 0-4 0v5" />
      <path d="M14 10V4a2 2 0 0 0-4 0v6" />
      <path d="M10 10.5V6a2 2 0 0 0-4 0v8" />
      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-5.7-2.5L1.5 14a2 2 0 0 1 3-2.6L7 13" />
    </svg>
  );
}

function ShareIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

export function ParticipateIsland({
  campaign,
  lifecycle,
}: {
  campaign: PaymentSheetCampaign;
  lifecycle: CampaignLifecycle;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [shareState, setShareState] = useState<'idle' | 'copied'>('idle');

  const open = useCallback(() => setSheetOpen(true), []);
  const close = useCallback(() => setSheetOpen(false), []);

  const disabled = lifecycle !== 'active';
  const cta = campaignCtaLabel(lifecycle);

  const pageUrl = useMemo(() => `/madadkar/${encodeURIComponent(campaign.slug)}`, [campaign.slug]);

  const onShare = useCallback(async () => {
    const absolute = `${window.location.origin}${pageUrl}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: campaign.title, url: absolute });
        return;
      }
    } catch {
      /* کاربر لغو کرد — ادامه به fallback کپی */
    }
    try {
      await navigator.clipboard.writeText(absolute);
      setShareState('copied');
      window.setTimeout(() => setShareState('idle'), 2200);
    } catch {
      /* کلیپ‌بورد در دسترس نیست */
    }
  }, [pageUrl, campaign.title]);

  return (
    <>
      {/* دکمهٔ شناورِ بالا — زیرِ هیرو */}
      <div id="madadkar-participate" className="flex flex-col gap-2.5 sm:flex-row">
        <button
          type="button"
          onClick={open}
          disabled={disabled}
          className={`inline-flex h-[54px] flex-1 items-center justify-center gap-2 overflow-hidden rounded-[16px] text-[15.5px] font-extrabold text-white transition-all ${
            disabled
              ? 'cursor-not-allowed bg-ink-300'
              : 'bg-gradient-to-l from-mint-500 to-brand-700 shadow-[0_16px_36px_-12px_rgba(13,128,116,.6)] hover:brightness-105 active:scale-[0.99]'
          }`}
        >
          <HandIcon />
          {cta}
        </button>
        <button
          type="button"
          onClick={onShare}
          aria-live="polite"
          className="inline-flex h-[54px] items-center justify-center gap-2 rounded-[16px] border-2 border-ink-100 bg-white px-6 text-[13.5px] font-extrabold text-ink-700 transition-colors hover:border-brand-200 hover:text-brand-700"
        >
          <ShareIcon />
          {shareState === 'copied' ? 'لینک کپی شد!' : 'اشتراک حرکت'}
        </button>
      </div>

      {/* نوارِ چسبانِ موبایل — دسکتاپ CTA داخلِ همین صفحه دارد */}
      <AnimatePresence>
        <motion.div
          initial={{ y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 240, damping: 24, delay: 0.3 }}
          className="fixed inset-x-0 bottom-0 z-[40] border-t border-ink-100 bg-white/95 px-3 pb-[calc(0.65rem+env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-14px_34px_-18px_rgba(11,53,48,.35)] backdrop-blur-md sm:hidden"
          role="region"
          aria-label="اقدام سریع مشارکت"
        >
          <div className="flex items-center gap-2.5">
            <div className="min-w-0 shrink-0">
              <div className="text-[10px] font-bold text-ink-400">هر سهم</div>
              <div className="whitespace-nowrap text-[14px] font-extrabold tabular-nums text-ink-900">
                {formatPersianNumber(campaign.sharePrice)}{' '}
                <span className="text-[10px] font-bold text-ink-400">تومان</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onShare}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-ink-50 text-ink-600 transition-colors hover:bg-ink-100"
              aria-label="اشتراک‌گذاری"
            >
              <ShareIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={open}
              disabled={disabled}
              className={`inline-flex h-12 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-[14px] text-[14px] font-extrabold text-white transition-all ${
                disabled
                  ? 'cursor-not-allowed bg-ink-300'
                  : 'bg-gradient-to-l from-mint-500 to-brand-700 shadow-[0_10px_22px_-8px_rgba(13,128,116,.6)] active:scale-[0.99]'
              }`}
            >
              <HandIcon className="h-4 w-4" />
              <span className="truncate">{cta}</span>
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      <PaymentSheet open={sheetOpen} onClose={close} campaign={campaign} />
    </>
  );
}
