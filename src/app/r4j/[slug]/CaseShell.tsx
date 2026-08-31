import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { bountyFa, criminalFullName, locationLine, type CriminalDetail } from '@/lib/r4j';
import { SmartImage } from '@/components/ui/SmartImage';
import { toPersianDigits } from '@/lib/utils';

/**
 * ═══════════════════════════════════════════════════════════════════
 * CaseShell — پوسته‌ی مشترکِ صفحاتِ فرعیِ پرونده (جایزه / گزارش)
 *
 *   سربرگِ فشرده با هویتِ پرونده (عکس، نام، جایزهٔ فعلی) + لینکِ بازگشت
 *   به پرونده + معرفیِ مسیر (آیکن + عنوان + توضیح). بدنه (children)
 *   همان جزیره‌ی کلاینتِ فرم است.
 * ═══════════════════════════════════════════════════════════════════
 */

export function CaseShell({
  d,
  eyebrow,
  title,
  lead,
  children,
}: {
  d: CriminalDetail;
  eyebrow: string;
  title: string;
  lead: string;
  children: React.ReactNode;
}) {
  const name = criminalFullName(d) || d.slug;
  const loc = locationLine(d);
  return (
    <main className="pb-20 lg:pb-16">
      <header className="relative overflow-hidden bg-ink-900 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(-45deg, rgba(255,255,255,.03) 0 2px, transparent 2px 14px)',
          }}
        />
        <div className="container-edge relative py-7 md:py-9">
          <Link
            href={`/r4j/${encodeURIComponent(d.slug)}`}
            className="inline-flex items-center gap-1 text-[12px] font-bold text-white/60 transition-colors hover:text-white"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
            بازگشت به پرونده
          </Link>
          <div className="mt-4 flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-white/15 bg-ink-800 md:h-20 md:w-20">
              <SmartImage
                src={
                  (d.photos.find((p) => p.is_primary) ?? d.photos[0])
                    ? (d.photos.find((p) => p.is_primary) ?? d.photos[0])!.image
                    : null
                }
                alt={name}
                variant="criminal"
                fill
                sizes="80px"
                priority
                quietSkeleton
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-black tracking-[0.18em] text-accent-300">{eyebrow}</p>
              <h1 dir="auto" className="mt-1 truncate text-xl font-black text-white md:text-2xl">
                {title}
              </h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] font-bold text-white/60">
                <span dir="auto">{name}</span>
                {loc && <span>· {loc}</span>}
                <span className="text-accent-300/90">
                  جایزهٔ فعلی:{' '}
                  {d.total_bounty_toman > 0
                    ? `${bountyFa(d.total_bounty_toman)} (${toPersianDigits(d.bounties_count)} تعهد)`
                    : 'بدون جایزهٔ فعال'}
                </span>
              </p>
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-[12.5px] leading-7 text-white/65">{lead}</p>
        </div>
      </header>
      <div className="container-edge mt-8 max-w-3xl">{children}</div>
    </main>
  );
}
