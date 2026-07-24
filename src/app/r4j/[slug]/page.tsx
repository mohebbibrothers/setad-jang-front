import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getCriminal, type R4JCriminalDetail } from '@/lib/r4j';
import { absoluteMediaUrl, formatPersianNumber } from '@/lib/utils';
import { siteConfig } from '@/lib/site';
import { PageHeader } from '@/components/ui/PageHeader';
import { ApiError } from '@/lib/api';

import { CriminalGallery } from './CriminalGallery';
import { R4JActionsRail } from './R4JActionsRail';

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 90;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const p = await getCriminal(slug);
    const fullName = `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || p.slug;
    const primary = p.photos?.[0]?.image;
    return {
      title: `${fullName} — پرونده در ${siteConfig.name}`,
      description: (p.crimes_summary || p.description || '').slice(0, 160),
      alternates: { canonical: `/r4j/${slug}` },
      openGraph: {
        title: fullName,
        images: primary ? [{ url: absoluteMediaUrl(primary) as string }] : undefined,
      },
    };
  } catch {
    return { title: `پرونده — ${siteConfig.name}`, robots: { index: false, follow: true } };
  }
}

export default async function CriminalDetailPage({ params }: Props) {
  const { slug } = await params;

  let detail: R4JCriminalDetail;
  try {
    detail = await getCriminal(slug);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const fullName = `${detail.first_name ?? ''} ${detail.last_name ?? ''}`.trim() || detail.slug;
  const location = [detail.city, detail.province, detail.country].filter(Boolean).join('، ');
  const photos = (detail.photos ?? [])
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((p) => ({ image: absoluteMediaUrl(p.image) as string, caption: p.caption }));
  const aliases = detail.aliases?.map((a) => a.alias).filter(Boolean) ?? [];

  return (
    <>
      <PageHeader
        eyebrow="جایزه‌ای برای عدالت"
        crumbs={[
          { label: 'خانه', href: '/' },
          { label: 'جایزه‌ای برای عدالت', href: '/#justice' },
          { label: fullName },
        ]}
        title={fullName}
        description={location || undefined}
        actions={
          detail.total_bounty_toman > 0 ? (
            <span className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-[12.5px] font-extrabold text-white bg-gradient-to-l from-accent-500 to-accent-700 shadow-[0_10px_24px_-8px_rgba(229,82,20,.5)]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
              جایزه کل: {formatPersianNumber(detail.total_bounty_toman)} تومان
            </span>
          ) : undefined
        }
      />

      <section className="section-y bg-white" id="criminal">
        <div className="container-edge grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-6 lg:gap-10">
          {/* ── Main column ─────────────────────────────────────── */}
          <div className="min-w-0 space-y-6">
            <CriminalGallery photos={photos} title={fullName} />

            {/* Identity chips */}
            <div className="flex flex-wrap gap-2">
              {location && <Chip glyph="pin" label={location} />}
              {detail.gender && <Chip glyph="user" label={GENDER_LABEL[detail.gender] ?? detail.gender} />}
              {detail.birth_date && <Chip glyph="calendar" label={`تولد: ${formatDate(detail.birth_date)}`} />}
              {detail.national_code && <Chip glyph="id" label={`کد ملی: ${detail.national_code}`} />}
              {detail.bounties_count > 0 && (
                <Chip glyph="trophy" label={`${formatPersianNumber(detail.bounties_count)} جایزه فعال`} tone="accent" />
              )}
            </div>

            {/* Aliases */}
            {aliases.length > 0 && (
              <div className="rounded-[24px] border border-ink-100 bg-white p-5">
                <h2 className="text-[15px] font-extrabold text-ink-900 mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="5"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>
                  </span>
                  نام‌های مستعار
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {aliases.map((a) => (
                    <span key={a} className="inline-flex items-center h-8 px-3 rounded-full bg-rose-50 text-rose-700 text-[12px] font-extrabold ring-1 ring-rose-100">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Crimes summary */}
            {detail.crimes_summary && (
              <div className="rounded-[24px] border border-ink-100 bg-gradient-to-br from-rose-50 to-white p-5 md:p-7">
                <h2 className="text-[16px] md:text-[18px] font-extrabold text-rose-900 mb-3 flex items-center gap-2">
                  <span className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-soft">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  </span>
                  خلاصه جنایات
                </h2>
                <div className="prose prose-sm md:prose-base max-w-none text-ink-800 leading-8 rtl" style={{ whiteSpace: 'pre-wrap' }}>
                  {detail.crimes_summary}
                </div>
              </div>
            )}

            {/* Description */}
            {detail.description && (
              <div className="rounded-[24px] border border-ink-100 bg-white p-5 md:p-7">
                <h2 className="text-[16px] md:text-[18px] font-extrabold text-ink-900 mb-3">شرح پرونده</h2>
                <div className="prose prose-sm md:prose-base max-w-none text-ink-700 leading-8 rtl" style={{ whiteSpace: 'pre-wrap' }}>
                  {detail.description}
                </div>
              </div>
            )}

            {/* Other info */}
            {detail.other_info && (
              <div className="rounded-[24px] border border-ink-100 bg-white p-5 md:p-6">
                <h2 className="text-[15px] font-extrabold text-ink-900 mb-2">سایر اطلاعات</h2>
                <p className="text-[13.5px] text-ink-700 leading-8" style={{ whiteSpace: 'pre-wrap' }}>{detail.other_info}</p>
              </div>
            )}

            {/* Contacts: phones + socials */}
            {(detail.phones?.length || detail.socials?.length) ? (
              <div className="rounded-[24px] border border-ink-100 bg-white p-5 md:p-6 space-y-4">
                <h2 className="text-[15px] font-extrabold text-ink-900">اطلاعات تماس و شبکه‌های اجتماعی</h2>
                {detail.phones?.length ? (
                  <ul className="space-y-1.5">
                    {detail.phones.map((p) => (
                      <li key={p.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-ink-50">
                        <span className="w-8 h-8 rounded-lg bg-white text-brand-600 flex items-center justify-center">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                        </span>
                        <div className="flex-1 min-w-0">
                          {p.label && <p className="text-[11px] text-ink-500 leading-none mb-0.5">{p.label}</p>}
                          <a href={`tel:${p.number}`} className="text-[13.5px] font-extrabold text-ink-900 tabular-nums hover:text-brand-700 transition-colors">
                            {p.number}
                          </a>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {detail.socials?.length ? (
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {detail.socials.map((s) => (
                      <li key={s.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-ink-50">
                        <span className="w-8 h-8 rounded-lg bg-white text-brand-600 flex items-center justify-center capitalize">
                          <SocialGlyph platform={s.platform} />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-ink-500 leading-none mb-0.5 capitalize">{s.platform}</p>
                          <a href={normaliseSocialUrl(s.platform, s.handle_or_url)} target="_blank" rel="noopener noreferrer" className="text-[12.5px] font-extrabold text-ink-800 truncate block hover:text-brand-700 transition-colors">
                            {s.handle_or_url}
                          </a>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}

            {/* Attachments */}
            {detail.attachments?.length ? (
              <div className="rounded-[24px] border border-ink-100 bg-white p-5 md:p-6">
                <h2 className="text-[15px] font-extrabold text-ink-900 mb-3">اسناد و مدارک عمومی</h2>
                <ul className="space-y-1.5">
                  {detail.attachments.map((a) => (
                    <li key={a.id}>
                      <a
                        href={absoluteMediaUrl(a.file)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-xl bg-ink-50 hover:bg-brand-50 transition-colors group"
                      >
                        <span className="w-10 h-10 rounded-xl bg-white text-brand-600 flex items-center justify-center shrink-0">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-extrabold text-ink-900 truncate">{a.title || 'سند'}</p>
                          {a.description && <p className="text-[11.5px] text-ink-500 truncate">{a.description}</p>}
                        </div>
                        {a.file_size ? (
                          <span className="text-[11px] font-bold text-ink-500 tabular-nums shrink-0">
                            {(a.file_size / 1024).toFixed(0)} KB
                          </span>
                        ) : null}
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-ink-400 group-hover:text-brand-600 transition-colors"><path d="M15 3h6v6M10 14 21 3M21 14v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6"/></svg>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {/* ── Actions rail ──────────────────────────────────────── */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <R4JActionsRail
              criminal={{
                id: detail.id,
                slug: detail.slug,
                fullName,
                photoUrl: photos[0]?.image ?? null,
                totalBountyToman: detail.total_bounty_toman,
                bountiesCount: detail.bounties_count,
              }}
            />
          </aside>
        </div>
      </section>
    </>
  );
}

/* ────────────────────────────────────────────────────────────────────── */

const GENDER_LABEL: Record<string, string> = {
  male: 'مرد',
  female: 'زن',
  unknown: 'نامشخص',
};

function Chip({ label, glyph, tone = 'ink' }: { label: string; glyph: 'pin' | 'user' | 'calendar' | 'id' | 'trophy'; tone?: 'ink' | 'accent' }) {
  const cls =
    tone === 'accent'
      ? 'bg-accent-50 text-accent-700 ring-1 ring-accent-100'
      : 'bg-ink-50 text-ink-700 ring-1 ring-ink-100';
  return (
    <span className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[12px] font-extrabold ${cls}`}>
      <ChipGlyph name={glyph} />
      {label}
    </span>
  );
}

function ChipGlyph({ name }: { name: string }) {
  const props = { width: 12, height: 12, viewBox: '0 0 24 24', fill: 'none' as const, stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
  switch (name) {
    case 'pin':      return <svg {...props}><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
    case 'user':     return <svg {...props}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
    case 'calendar': return <svg {...props}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
    case 'id':       return <svg {...props}><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="12" r="2.5"/><path d="M14 10h5M14 14h3"/></svg>;
    case 'trophy':   return <svg {...props}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>;
    default:         return null;
  }
}

function SocialGlyph({ platform }: { platform: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-label={platform} aria-hidden="true">
      <path d="M18 2h3l-7 8 8 12h-6l-5-7-6 7H2l8-9L2 2h6l5 6z" />
    </svg>
  );
}

function normaliseSocialUrl(platform: string, handle: string): string {
  if (/^https?:\/\//i.test(handle)) return handle;
  const clean = handle.replace(/^@/, '');
  switch ((platform || '').toLowerCase()) {
    case 'telegram':  return `https://t.me/${clean}`;
    case 'twitter':
    case 'twitter_x':
    case 'x':         return `https://x.com/${clean}`;
    case 'instagram': return `https://instagram.com/${clean}`;
    case 'youtube':   return `https://youtube.com/${clean.startsWith('@') ? clean : `@${clean}`}`;
    case 'linkedin':  return `https://linkedin.com/in/${clean}`;
    default:          return handle;
  }
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return iso; }
}


