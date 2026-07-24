import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  getCampaign,
  getCampaignTransparency,
  type MadadkarCampaignDetail,
  type MadadkarTransparency,
} from '@/lib/madadkar';
import { absoluteMediaUrl, formatPersianNumber } from '@/lib/utils';
import { siteConfig } from '@/lib/site';
import { PageHeader } from '@/components/ui/PageHeader';
import { SmartImage } from '@/components/ui/SmartImage';
import { ApiError } from '@/lib/api';

import { CampaignHero } from './CampaignHero';
import { CampaignParticipateCTA } from './CampaignParticipateCTA';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  /madadkar/[slug] — public campaign detail page.
 *
 *  Fully wired against:
 *    GET /api/v1/madadkar/campaigns/{slug}/                  (detail)
 *    GET /api/v1/madadkar/campaigns/{slug}/transparency/     (transparency)
 *    POST /api/v1/madadkar/campaigns/{slug}/participate/     (client-side CTA)
 *
 *  Rendering strategy:
 *    - Server-fetches the detail + transparency in parallel (SSR).
 *    - Streams the album/hero as a client island.
 *    - Renders live counters, progress bar, sponsor block, gallery,
 *      description, transparency ledger and a sticky participate CTA.
 * ═══════════════════════════════════════════════════════════════════════════
 */

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const c = await getCampaign(slug);
    const cover = absoluteMediaUrl(c.cover_image);
    return {
      title: `${c.title} — ${siteConfig.name}`,
      description: (c.description || '').slice(0, 160) || `حرکت «${c.title}» در ${siteConfig.name}.`,
      alternates: { canonical: `/madadkar/${slug}` },
      openGraph: {
        title: c.title,
        description: (c.description || '').slice(0, 200),
        url: `/madadkar/${slug}`,
        images: cover ? [{ url: cover }] : undefined,
      },
    };
  } catch {
    return { title: `حرکت — ${siteConfig.name}`, robots: { index: false, follow: true } };
  }
}

export default async function CampaignDetailPage({ params }: Props) {
  const { slug } = await params;

  let detail: MadadkarCampaignDetail;
  try {
    detail = await getCampaign(slug);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const transparency: MadadkarTransparency | null = await getCampaignTransparency(slug);

  const pct = Math.round(detail.progress_percent ?? 0);
  const totalToman     = detail.total_amount ?? 0;
  const purchasedToman = detail.purchased_amount ?? 0;
  const remainingShares = detail.remaining_shares ?? 0;
  const gallery = (detail.gallery_images ?? [])
    .map((g) => ({ ...g, image: absoluteMediaUrl(g.image) ?? g.image }))
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

  const heroImages = [
    detail.cover_image ? { image: absoluteMediaUrl(detail.cover_image) as string, alt_text: detail.title } : null,
    ...gallery.map((g) => ({ image: g.image, alt_text: g.alt_text || detail.title })),
  ].filter(Boolean) as Array<{ image: string; alt_text?: string }>;

  return (
    <>
      <PageHeader
        eyebrow="پشتیبانی مالی جنگ"
        crumbs={[
          { label: 'خانه', href: '/' },
          { label: 'پشتیبانی مالی جنگ', href: '/#warfund' },
          { label: detail.title },
        ]}
        title={detail.title}
        description={detail.sponsor?.name ? `مددکار: ${detail.sponsor.name}` : undefined}
        actions={
          <StatusChip
            status={detail.status}
            statusDisplay={detail.status_display}
            isFullyFunded={detail.is_fully_funded}
          />
        }
      />

      <section className="section-y bg-white" id="campaign">
        <div className="container-edge grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6 lg:gap-10">
          {/* ── Left / main column ────────────────────────────────── */}
          <div className="min-w-0 space-y-6 md:space-y-8">
            <CampaignHero title={detail.title} images={heroImages} />

            {/* Description */}
            {detail.description && (
              <div className="rounded-[24px] border border-ink-100 bg-white p-5 md:p-7">
                <h2 className="text-[16px] md:text-[18px] font-extrabold text-ink-900 mb-3">درباره‌ی این حرکت</h2>
                <div
                  className="prose prose-sm md:prose-base max-w-none text-ink-700 leading-8 rtl"
                  style={{ whiteSpace: 'pre-wrap' }}
                >
                  {detail.description}
                </div>
              </div>
            )}

            {/* Sponsor block */}
            {detail.sponsor && (
              <div className="rounded-[24px] border border-ink-100 bg-gradient-to-br from-brand-50 to-white p-5 md:p-6 flex items-center gap-4">
                <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden ring-2 ring-white shadow-soft shrink-0 bg-white">
                  <SmartImage
                    src={absoluteMediaUrl(detail.sponsor.logo)}
                    alt={detail.sponsor.name}
                    variant="avatar"
                    quietSkeleton
                    fill
                    sizes="80px"
                    className="object-contain p-1.5"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11.5px] font-extrabold text-brand-700 uppercase tracking-wider mb-1">مددکار</p>
                  <h3 className="text-[15px] md:text-[17px] font-extrabold text-ink-900 truncate">
                    {detail.sponsor.name}
                  </h3>
                  {detail.sponsor.short_description && (
                    <p className="text-[12.5px] text-ink-600 leading-6 line-clamp-2 mt-1">
                      {detail.sponsor.short_description}
                    </p>
                  )}
                </div>
                {detail.sponsor.slug && (
                  <Link
                    href={`/madadkar?sponsor_slug=${encodeURIComponent(detail.sponsor.slug)}`}
                    className="hidden sm:inline-flex items-center gap-1.5 h-9 px-4 rounded-full border-2 border-brand-500 text-brand-700 font-extrabold text-[12.5px] hover:bg-brand-50 transition-colors"
                  >
                    حرکت‌های این مددکار
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                  </Link>
                )}
              </div>
            )}

            {/* Transparency ledger */}
            {transparency && (
              <TransparencyBlock t={transparency} campaignSlug={slug} />
            )}
          </div>

          {/* ── Right / participate rail ──────────────────────────── */}
          <aside className="lg:sticky lg:top-24 lg:self-start space-y-5">
            {/* Big stats card */}
            <div className="rounded-[24px] border border-ink-100 bg-white p-5 md:p-6 shadow-[0_18px_50px_-24px_rgba(11,53,48,.20)]">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-[12px] font-bold text-ink-500">پیشرفت</span>
                <span className="text-[22px] font-extrabold text-brand-700 tabular-nums leading-none">
                  ٪{formatPersianNumber(pct)}
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-ink-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-l from-brand-400 to-brand-600 transition-[width] duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>

              <dl className="mt-5 space-y-3">
                <MoneyRow label="مبلغ کل"            value={totalToman}     highlight />
                <MoneyRow label="جمع‌آوری شده تاکنون" value={purchasedToman} />
                <NumberRow label="مشارکت‌کنندگان" value={detail.participant_count ?? 0} unit="نفر" />
                <NumberRow label="سهم باقی‌مانده"  value={remainingShares} unit="سهم" />
                {detail.has_deadline && detail.deadline && (
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-ink-500 font-bold">مهلت پایان</span>
                    <span className="text-ink-900 font-extrabold">{formatDate(detail.deadline)}</span>
                  </div>
                )}
              </dl>
            </div>

            {/* CTA client island */}
            <CampaignParticipateCTA
              campaign={{
                slug: detail.slug,
                title: detail.title,
                sharePriceToman: detail.share_price,
                remainingShares,
                totalShares: detail.total_shares ?? 0,
                sponsorName: detail.sponsor?.name,
                coverImage: absoluteMediaUrl(detail.cover_image) ?? null,
                status: detail.status,
                isFullyFunded: detail.is_fully_funded ?? false,
                gallery: heroImages.map((h) => ({ url: h.image, alt: h.alt_text })),
              }}
            />
          </aside>
        </div>
      </section>
    </>
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/*  Sub-components                                                        */
/* ────────────────────────────────────────────────────────────────────── */

function StatusChip({
  status, statusDisplay, isFullyFunded,
}: { status: string; statusDisplay?: string; isFullyFunded?: boolean }) {
  const tone =
    isFullyFunded ? 'bg-mint-500'
    : status === 'published' ? 'bg-brand-500'
    : status === 'completed' ? 'bg-mint-500'
    : status === 'closed'   ? 'bg-ink-500'
    : 'bg-ink-400';
  const label =
    isFullyFunded ? 'تأمین شد'
    : status === 'published' ? 'در حال اجرا'
    : statusDisplay ?? status;
  return (
    <span className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[12px] font-extrabold text-white ${tone}`}>
      <span className="w-2 h-2 rounded-full bg-white/90 animate-pulse" />
      {label}
    </span>
  );
}

function MoneyRow({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  const rial = value * 10;
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-ink-500 font-bold text-[12.5px] shrink-0">{label}</span>
      <span className={`tabular-nums font-extrabold text-left flex items-baseline gap-1 min-w-0 ${highlight ? 'text-[15.5px] text-ink-900' : 'text-[14px] text-ink-800'}`}>
        <span className="truncate">{formatPersianNumber(rial)}</span>
        <span className="text-[11px] text-ink-400 shrink-0">ریال</span>
      </span>
    </div>
  );
}

function NumberRow({ label, value, unit }: { label: string; value: number; unit?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-ink-500 font-bold text-[12.5px] shrink-0">{label}</span>
      <span className="tabular-nums font-extrabold text-[14px] text-ink-800 flex items-baseline gap-1">
        <span>{formatPersianNumber(value)}</span>
        {unit && <span className="text-[11px] text-ink-400 shrink-0">{unit}</span>}
      </span>
    </div>
  );
}

function TransparencyBlock({ t, campaignSlug }: { t: MadadkarTransparency; campaignSlug: string }) {
  const rows = [
    { label: 'جمع پرداختی مردم',   value: t.purchased_amount_toman, tone: 'text-brand-700' },
    { label: 'برگشت‌ها',           value: t.refunded_amount_toman,  tone: 'text-rose-600' },
    { label: 'مصرف‌شده',           value: t.disbursed_amount_toman, tone: 'text-mint-600' },
    { label: 'خالص در دسترس',      value: t.net_amount_toman,       tone: 'text-ink-900' },
  ];
  return (
    <div className="rounded-[24px] border border-ink-100 bg-white p-5 md:p-6" id={`transparency-${campaignSlug}`}>
      <div className="flex items-center gap-2 mb-4">
        <span className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
        </span>
        <div>
          <h2 className="text-[16px] md:text-[17px] font-extrabold text-ink-900 leading-none">شفافیت مالی</h2>
          <p className="text-[12px] text-ink-500 mt-1">اعداد مستقیم از بک‌اند مالی خوانده می‌شوند.</p>
        </div>
      </div>

      <ul className="divide-y divide-ink-100">
        {rows.map((r) => (
          <li key={r.label} className="flex items-baseline justify-between py-2.5">
            <span className="text-[13px] font-bold text-ink-600">{r.label}</span>
            <span className={`tabular-nums font-extrabold text-[14px] ${r.tone}`}>
              {formatPersianNumber((r.value ?? 0) * 10)}
              <span className="text-[10.5px] text-ink-400 mr-1">ریال</span>
            </span>
          </li>
        ))}
      </ul>

      {t.disbursements && t.disbursements.length > 0 && (
        <div className="mt-5">
          <h3 className="text-[13px] font-extrabold text-ink-800 mb-2">پرداخت‌های خروجی</h3>
          <ul className="space-y-2">
            {t.disbursements.map((d) => (
              <li key={d.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-ink-50">
                <span className="w-8 h-8 rounded-lg bg-white text-brand-600 flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] font-extrabold text-ink-800 truncate">{d.beneficiary}</p>
                  {d.paid_at && <p className="text-[11px] text-ink-500">{formatDate(d.paid_at)}</p>}
                </div>
                <span className="text-[12.5px] font-extrabold tabular-nums text-ink-900 shrink-0">
                  {formatPersianNumber((d.amount_toman ?? 0) * 10)}
                  <span className="text-[10.5px] text-ink-400 mr-1">ریال</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return iso; }
}
