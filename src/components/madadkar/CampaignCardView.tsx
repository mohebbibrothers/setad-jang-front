'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { SmartImage } from '@/components/ui/SmartImage';
import { absoluteMediaUrl, formatPersianNumber, toPersianDigits } from '@/lib/utils';
import {
  campaignCtaLabel,
  campaignLifecycle,
  clampPercent,
  type MadadkarCampaignListItem,
  type PaymentSheetCampaignBridge,
} from '@/lib/madadkar';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CampaignCardView — کارتِ حرکت در هابِ «مدد به حرکت»
 *
 * زبانِ تصویریِ یکدست با سکشنِ هوم، ولی برای سطحِ صفحه کامل: کاورِ ۱۶:۱۰
 * بالای کارت، مُهرِ چرخه‌عمر، شمارِ معکوسِ مهلت، مترِ پیشرفتِ گرادیانی،
 * دو ارقامِ پولی (هر سهم + باقی) و CTAِ زنده. کلیک روی کاور/عنوان →
 * صفحه جزئیات؛ دکمه → باز شدن شیتِ پرداخت از طریق والد.
 * ═══════════════════════════════════════════════════════════════════════════
 */

function HandIcon({ className = 'w-[18px] h-[18px]' }: { className?: string }) {
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

export function CampaignCardView({
  c,
  index = 0,
  onParticipate,
}: {
  c: MadadkarCampaignListItem;
  index?: number;
  onParticipate: (c: MadadkarCampaignListItem) => void;
}) {
  const lifecycle = campaignLifecycle(c);
  const pct = clampPercent(c.progress_percent);
  const coverUrl = absoluteMediaUrl(c.cover_image);
  const sponsorLogo = absoluteMediaUrl(c.sponsor?.logo);

  const daysLeft = useMemo(() => {
    if (!c.has_deadline || !c.deadline) return null;
    const ms = Date.parse(c.deadline) - Date.now();
    return Math.max(0, Math.ceil(ms / 86_400_000));
  }, [c.has_deadline, c.deadline]);

  const disabled = lifecycle !== 'active';
  const cta = campaignCtaLabel(lifecycle);
  const galleryCount = 1 + ((c as { gallery_count?: number }).gallery_count ?? 0);

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay: Math.min(index, 5) * 0.06 }}
      className="group flex w-full min-w-0 flex-col overflow-hidden rounded-[20px] border border-ink-100 bg-white shadow-[0_2px_10px_-4px_rgba(15,20,32,.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_-22px_rgba(11,53,48,.24)]"
    >
      {/* ── کاور ─────────────────────────────────────────────────────── */}
      <Link
        href={`/madadkar/${encodeURIComponent(c.slug)}`}
        aria-label={`مشاهدهٔ حرکت ${c.title}`}
        className="relative block aspect-[16/10] w-full overflow-hidden bg-ink-50"
      >
        <SmartImage
          src={coverUrl ?? null}
          alt={c.title}
          variant="campaign"
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <span
          className="absolute inset-0 bg-gradient-to-t from-ink-900/45 via-transparent to-transparent"
          aria-hidden="true"
        />

        {/* مُهرِ چرخه‌عمر */}
        <span className="absolute right-3 top-3">
          {lifecycle === 'completed' ? (
            <span className="inline-flex h-7 items-center gap-1 rounded-full bg-mint-500 px-2.5 text-[11px] font-extrabold text-white shadow-lg ring-1 ring-mint-600/40">
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              تأمین کامل
            </span>
          ) : lifecycle === 'closed' ? (
            <span className="inline-flex h-7 items-center rounded-full bg-ink-800/85 px-2.5 text-[11px] font-extrabold text-white ring-1 ring-white/20 backdrop-blur">
              بسته‌شده
            </span>
          ) : (
            <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-brand-500/95 px-2.5 text-[11px] font-extrabold text-white shadow-lg ring-1 ring-white/20">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              در حال جمع‌آوری
            </span>
          )}
        </span>

        {/* شمارِ معکوس */}
        {daysLeft !== null && lifecycle === 'active' && (
          <span
            className={`absolute left-3 top-3 inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[11px] font-extrabold tabular-nums ring-1 backdrop-blur ${
              daysLeft <= 3
                ? 'bg-amber-500/90 text-white ring-amber-300/60'
                : 'bg-black/45 text-white ring-white/20'
            }`}
          >
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 16 14" />
            </svg>
            {daysLeft === 0 ? 'آخرین روز' : `${toPersianDigits(daysLeft)} روز مانده`}
          </span>
        )}

        {/* درصد روی کاور */}
        <span className="absolute bottom-3 left-3 inline-flex h-8 items-center rounded-lg bg-black/50 px-2 text-[12.5px] font-extrabold tabular-nums text-white ring-1 ring-white/25 backdrop-blur">
          ٪{formatPersianNumber(pct)}
        </span>
      </Link>

      {/* ── بدنه ─────────────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col p-3.5 sm:p-4">
        {/* مددکار */}
        <div className="mb-2 flex items-center gap-1.5">
          <span className="relative flex h-5 w-5 items-center justify-center overflow-hidden rounded-md bg-ink-50 ring-1 ring-ink-100">
            {sponsorLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={sponsorLogo} alt="" className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <svg
                width="11"
                height="11"
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
          <span className="truncate text-[11.5px] font-bold text-ink-500">
            مددکار: <span className="text-ink-700">{c.sponsor?.name || 'مددکار مجموعه'}</span>
          </span>
        </div>

        <Link
          href={`/madadkar/${encodeURIComponent(c.slug)}`}
          className="line-clamp-2 min-h-[3.5rem] text-[15px] font-extrabold leading-7 text-ink-900 transition-colors hover:text-brand-600"
        >
          {c.title}
        </Link>

        {/* مترِ پیشرفت */}
        <div className="mt-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-ink-100">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${pct}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1.05, ease: 'easeOut', delay: 0.15 }}
              className="h-full rounded-full bg-gradient-to-l from-mint-500 to-brand-600"
            />
          </div>
          <div className="mt-2 grid grid-cols-3 gap-1.5 text-center">
            <div className="rounded-lg bg-ink-50 px-1 py-1.5">
              <div className="text-[9.5px] font-bold text-ink-400">هر سهم</div>
              <div className="mt-0.5 truncate text-[11px] font-extrabold tabular-nums text-ink-900">
                {formatPersianNumber(c.share_price)}{' '}
                <span className="text-[9px] font-bold text-ink-400">تومان</span>
              </div>
            </div>
            <div className="rounded-lg bg-ink-50 px-1 py-1.5">
              <div className="text-[9.5px] font-bold text-ink-400">باقی‌مانده</div>
              <div className="mt-0.5 truncate text-[11px] font-extrabold tabular-nums text-ink-900">
                {formatPersianNumber(Math.max(0, c.remaining_shares))}{' '}
                <span className="text-[9px] font-bold text-ink-400">سهم</span>
              </div>
            </div>
            <div className="rounded-lg bg-ink-50 px-1 py-1.5">
              <div className="text-[9.5px] font-bold text-ink-400">مشارکت‌کننده</div>
              <div className="mt-0.5 truncate text-[11px] font-extrabold tabular-nums text-ink-900">
                {formatPersianNumber(c.participant_count ?? 0)}{' '}
                <span className="text-[9px] font-bold text-ink-400">نفر</span>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={() => !disabled && onParticipate(c)}
          disabled={disabled}
          aria-disabled={disabled}
          className={`relative mt-3.5 inline-flex h-[46px] w-full items-center justify-center gap-2 overflow-hidden rounded-[12px] text-[14px] font-extrabold text-white transition-colors ${
            disabled
              ? 'cursor-not-allowed bg-ink-300 shadow-none'
              : 'cursor-pointer bg-brand-500 shadow-[0_6px_14px_-6px_rgba(13,128,116,.55)] hover:bg-brand-600 active:bg-brand-700'
          }`}
        >
          <span>{cta}</span>
          {!disabled && <HandIcon />}
        </button>
      </div>

      {/* گالری‌هِنت نامرئی برای SEO/دسترس‌پذیری اگر بعداً استفاده شود */}
      {galleryCount > 1 ? <span className="sr-only">دارای آلبوم تصاویر</span> : null}
    </motion.article>
  );
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  پلِ دیتا به PaymentSheet                                                */
/* ───────────────────────────────────────────────────────────────────────── */

/** MadadkarCampaignListItem → props آمادهٔ PaymentSheet */
export function toSheetCampaign(c: MadadkarCampaignListItem): PaymentSheetCampaignBridge {
  return {
    slug: c.slug,
    title: c.title,
    sponsor: c.sponsor?.name || 'مددکار مجموعه',
    sponsorLogo: absoluteMediaUrl(c.sponsor?.logo),
    totalAmount: c.total_amount ?? 0,
    sharePrice: c.share_price ?? 0,
    sharesTotal: c.total_shares ?? 0,
    sharesRemaining: Math.max(0, c.remaining_shares ?? 0),
    progressPercent: c.progress_percent ?? 0,
    coverUrl: absoluteMediaUrl(c.cover_image),
    statusDisplay: c.status_display,
    isFullyFunded: c.is_fully_funded,
    hasDeadline: c.has_deadline,
    deadline: c.deadline ?? undefined,
  };
}
