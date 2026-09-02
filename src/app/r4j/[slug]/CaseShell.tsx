import Link from 'next/link';
import { ChevronRight, FileText, Fingerprint, Images, MapPin, Trophy } from 'lucide-react';
import {
  bountyFa,
  criminalFullName,
  locationLine,
  mediaSrc,
  normalizeGallery,
  type CriminalDetail,
} from '@/lib/r4j';
import { SmartImage } from '@/components/ui/SmartImage';
import { cn, toPersianDigits } from '@/lib/utils';

/**
 * ═══════════════════════════════════════════════════════════════════
 * CaseShell v2 — پوسته‌ی مشترکِ صفحاتِ اقدامِ پرونده (جایزه / گزارش)
 *
 *   • هیروی تیره‌ی پرونده با سه لایه‌ی تزئینی (راه‌راه + هاله‌ی طلایی +
 *     هاله‌ی سبز)، فریمِ عکسِ مهروموم‌شده، آمارِ زنده‌ی صندوق.
 *   • زبانه‌های «چرخه‌ی اقدام»: پرونده ← جایزه ← گزارش — کاربر هرگز
 *     گم نمی‌شود؛ زبانه‌ی فعال با تُنِ همان مسیر (نارنجی=جایزه،
 *     سبز=گزارش) برجسته می‌شود.
 *   • تُنِ تمامِ صفحه از activeTab مشتق می‌شود تا BountyPanel و
 *     ReportPanel هر کدام شناسه‌ی رنگیِ خود را داشته باشند.
 * ═══════════════════════════════════════════════════════════════════
 */

export type CaseActionTab = 'bounty' | 'report';

const TAB_TONE: Record<
  CaseActionTab,
  {
    eyebrow: string;
    stat: string;
    statValue: string;
    activeTab: string;
    inactiveTab: string;
  }
> = {
  bounty: {
    eyebrow: 'bg-accent-500/15 text-accent-300 ring-accent-400/30',
    stat: 'border-gold-400/25 bg-gradient-to-br from-gold-500/[.14] via-transparent to-transparent',
    statValue: 'text-gold-400',
    activeTab: 'bg-accent-500 text-white shadow-[0_10px_22px_-8px_rgba(255,107,26,.7)]',
    inactiveTab: 'text-white/70 hover:bg-white/10 hover:text-white',
  },
  report: {
    eyebrow: 'bg-mint-500/15 text-mint-400 ring-mint-400/30',
    stat: 'border-mint-400/25 bg-gradient-to-br from-mint-500/[.14] via-transparent to-transparent',
    statValue: 'text-mint-400',
    activeTab: 'bg-brand-500 text-white shadow-[0_10px_22px_-8px_rgba(13,128,116,.7)]',
    inactiveTab: 'text-white/70 hover:bg-white/10 hover:text-white',
  },
};

export function CaseShell({
  d,
  eyebrow,
  title,
  lead,
  activeTab,
  children,
}: {
  d: CriminalDetail;
  eyebrow: string;
  title: string;
  lead: string;
  activeTab: CaseActionTab;
  children: React.ReactNode;
}) {
  const name = criminalFullName(d) || d.slug;
  const loc = locationLine(d);
  const tone = TAB_TONE[activeTab];
  const photo = d.photos.find((p) => p.is_primary) ?? d.photos[0];
  const frames = normalizeGallery(d.photos).length;
  const caseHref = `/r4j/${encodeURIComponent(d.slug)}`;

  return (
    <main className="pb-24 lg:pb-16">
      {/* ══════════ هیروی پرونده ══════════ */}
      <header className="relative overflow-hidden bg-ink-900 text-white">
        {/* راه‌راهِ مورب */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(-45deg, rgba(255,255,255,.03) 0 2px, transparent 2px 14px)',
          }}
        />
        {/* هاله‌های نوری */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 left-[-10%] h-[420px] w-[420px] rounded-full bg-accent-500/[.16] blur-[110px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-48 right-[-8%] h-[460px] w-[460px] rounded-full bg-brand-500/[.18] blur-[120px]"
        />

        <div className="container-edge relative py-6 md:py-9">
          {/* مسیرِ بازگشت */}
          <Link
            href={caseHref}
            className="inline-flex items-center gap-1 rounded-full py-1 pe-3 ps-1 text-[12px] font-bold text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
            بازگشت به پرونده
          </Link>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-6">
            {/* هویت */}
            <div className="flex min-w-0 items-center gap-4 md:gap-5">
              <div className="relative shrink-0">
                <div className="relative h-[74px] w-[74px] overflow-hidden rounded-3xl border border-white/15 bg-ink-800 shadow-[0_16px_32px_-16px_rgba(0,0,0,.7)] ring-2 ring-white/10 md:h-24 md:w-24">
                  <SmartImage
                    src={photo ? (mediaSrc(photo.image) ?? null) : null}
                    alt={name}
                    variant="criminal"
                    fill
                    sizes="(min-width:768px) 96px, 74px"
                    priority
                    quietSkeleton
                    className="object-cover"
                  />
                </div>
                {frames > 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-2 -left-2 flex h-7 items-center gap-1 rounded-full bg-ink-800/95 px-2 text-[10px] font-black tabular-nums text-white ring-1 ring-white/20 backdrop-blur"
                  >
                    <Images className="h-3 w-3 text-gold-400" />
                    {toPersianDigits(frames)}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10.5px] font-black tracking-[0.14em] ring-1',
                    tone.eyebrow,
                  )}
                >
                  {eyebrow}
                </p>
                <h1
                  dir="auto"
                  className="mt-2 break-words text-2xl font-black leading-tight text-white md:text-3xl"
                >
                  {title}
                </h1>
                <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-bold text-white/60">
                  <span dir="auto" className="text-white/85">
                    {name}
                  </span>
                  {loc && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-gold-400/90" aria-hidden="true" />
                      {loc}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* آمارِ صندوق */}
            <div
              className={cn(
                'w-full max-w-[15.5rem] shrink-0 rounded-3xl border p-4 backdrop-blur-sm sm:w-auto',
                tone.stat,
              )}
            >
              <p className="flex items-center gap-1.5 text-[10.5px] font-black tracking-wide text-white/55">
                <Trophy className="h-3.5 w-3.5 text-gold-400" aria-hidden="true" />
                جایزهٔ فعلیِ صندوقِ این پرونده
              </p>
              <p
                className={cn(
                  'mt-1 text-xl font-black tabular-nums leading-tight md:text-[26px]',
                  tone.statValue,
                )}
              >
                {d.total_bounty_toman > 0 ? bountyFa(d.total_bounty_toman) : 'بدون جایزهٔ فعال'}
              </p>
              <p className="mt-0.5 text-[10.5px] font-bold text-white/50">
                {d.bounties_count > 0
                  ? `${toPersianDigits(d.bounties_count)} تعهدِ ثبت‌شده`
                  : 'نخستین تعهد را شما ثبت کنید'}
              </p>
            </div>
          </div>

          {/* لیدِ مسیر */}
          <p className="mt-5 max-w-2xl text-[12.5px] leading-7 text-white/65">{lead}</p>

          {/* ── زبانه‌های چرخه‌ی اقدام ── */}
          <nav aria-label="چرخه‌ی اقدام روی پرونده" className="mt-6">
            <ul className="inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-2xl bg-white/[.06] p-1.5 ring-1 ring-white/10 backdrop-blur">
              <li>
                <Link
                  href={caseHref}
                  aria-current={undefined}
                  className={cn(
                    'flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-[12px] font-extrabold transition-all duration-200 sm:px-4',
                    tone.inactiveTab,
                  )}
                >
                  <Fingerprint className="h-4 w-4" aria-hidden="true" />
                  پرونده
                </Link>
              </li>
              <li>
                <Link
                  href={`${caseHref}/bounty`}
                  aria-current={activeTab === 'bounty' ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-[12px] font-extrabold transition-all duration-200 sm:px-4',
                    activeTab === 'bounty' ? tone.activeTab : tone.inactiveTab,
                  )}
                >
                  <Trophy className="h-4 w-4" aria-hidden="true" />
                  افزایش جایزه
                </Link>
              </li>
              <li>
                <Link
                  href={`${caseHref}/report`}
                  aria-current={activeTab === 'report' ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-[12px] font-extrabold transition-all duration-200 sm:px-4',
                    activeTab === 'report' ? TAB_TONE.report.activeTab : tone.inactiveTab,
                  )}
                >
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  گزارش اطلاعات
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* حاشیه‌ی پایانیِ نرم */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-l from-transparent via-white/25 to-transparent"
        />
      </header>

      <div className="container-edge mt-8 max-w-6xl">{children}</div>
    </main>
  );
}
