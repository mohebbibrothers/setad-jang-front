import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getListing, type KindnessListingDetail } from '@/lib/kindness';
import { absoluteMediaUrl } from '@/lib/utils';
import { siteConfig } from '@/lib/site';
import { PageHeader } from '@/components/ui/PageHeader';
import { ApiError } from '@/lib/api';

import { KindnessGallery } from './KindnessGallery';
import { ContactRevealCard } from './ContactRevealCard';

type Props = { params: Promise<{ slug: string }> };
export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const l = await getListing(slug);
    return {
      title: `${l.title} — دیوار مهربانی — ${siteConfig.name}`,
      description: (l.description || '').slice(0, 160),
      alternates: { canonical: `/kindness-wall/${slug}` },
      openGraph: {
        title: l.title,
        images: l.cover_image ? [{ url: absoluteMediaUrl(l.cover_image) as string }] : undefined,
      },
    };
  } catch {
    return { title: `آگهی — ${siteConfig.name}`, robots: { index: false, follow: true } };
  }
}

export default async function KindnessListingPage({ params }: Props) {
  const { slug } = await params;

  let l: KindnessListingDetail;
  try { l = await getListing(slug); }
  catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const isNeed = l.listing_type === 'need_help';
  const images = (l.images ?? [])
    .slice()
    .sort((a, b) => (a.is_cover ? -1 : b.is_cover ? 1 : 0))
    .map((im) => ({ image: absoluteMediaUrl(im.image) as string, alt_text: im.alt_text }));
  const cover = absoluteMediaUrl(l.cover_image);
  const heroImages = images.length
    ? images
    : cover ? [{ image: cover, alt_text: l.title }] : [];

  const location = [l.city, l.province, l.district].filter(Boolean).join('، ');

  return (
    <>
      <PageHeader
        eyebrow="دیوار مهربانی"
        crumbs={[
          { label: 'خانه', href: '/' },
          { label: 'دیوار مهربانی', href: '/#kindness' },
          l.category ? { label: l.category.title, href: `/kindness-wall?category=${encodeURIComponent(l.category.slug)}` } : { label: 'آگهی' },
          { label: l.title },
        ]}
        title={l.title}
        description={location || undefined}
        actions={
          <span className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[12px] font-extrabold text-white ${
            isNeed
              ? 'bg-gradient-to-l from-[#f43f5e] to-[#e11d48]'
              : 'bg-gradient-to-l from-[#2FE0CC] to-[#1FB3A8]'
          }`}>
            {isNeed
              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"/></svg>
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12v10H4V12"/><rect x="2" y="7" width="20" height="5"/><path d="M12 22V7 M12 7H7.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7z M12 7h4.5a2.5 2.5 0 1 0 0-5C13 2 12 7 12 7z"/></svg>}
            {isNeed ? 'نیازمند کمک' : 'پیشنهاد کمک'}
          </span>
        }
      />

      <section className="section-y bg-white">
        <div className="container-edge grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6 lg:gap-10">
          <div className="min-w-0 space-y-6">
            {heroImages.length > 0 && <KindnessGallery images={heroImages} title={l.title} />}

            {l.description && (
              <div className="rounded-[24px] border border-ink-100 bg-white p-5 md:p-7">
                <h2 className="text-[16px] md:text-[18px] font-extrabold text-ink-900 mb-3">شرح آگهی</h2>
                <div className="prose prose-sm md:prose-base max-w-none text-ink-700 leading-8 rtl" style={{ whiteSpace: 'pre-wrap' }}>
                  {l.description}
                </div>
              </div>
            )}

            {l.address_hint && (
              <div className="rounded-[24px] border border-ink-100 bg-ink-50 p-5">
                <p className="text-[11.5px] font-extrabold text-ink-500 uppercase tracking-wider mb-1">نشانی محل</p>
                <p className="text-[13.5px] text-ink-800 font-bold">{l.address_hint}</p>
              </div>
            )}

            {/* Meta chips */}
            <div className="flex flex-wrap items-center gap-2">
              {location && (
                <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-ink-50 text-ink-700 text-[12px] font-extrabold ring-1 ring-ink-100">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {location}
                </span>
              )}
              {l.view_count ? (
                <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-ink-50 text-ink-700 text-[12px] font-extrabold ring-1 ring-ink-100">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  {l.view_count.toLocaleString('fa-IR')} بازدید
                </span>
              ) : null}
              {l.expires_at && (
                <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-amber-50 text-amber-700 text-[12px] font-extrabold ring-1 ring-amber-100">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  انقضا: {formatDate(l.expires_at)}
                </span>
              )}
              {l.published_at && (
                <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-ink-50 text-ink-700 text-[12px] font-extrabold ring-1 ring-ink-100">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  انتشار: {formatDate(l.published_at)}
                </span>
              )}
            </div>
          </div>

          {/* Rail */}
          <aside className="lg:sticky lg:top-24 lg:self-start space-y-4">
            {/* Owner card */}
            <div className="rounded-[24px] border border-ink-100 bg-white p-5">
              <p className="text-[11px] font-extrabold text-brand-600 uppercase tracking-wider mb-2">اطلاعات ثبت‌کننده</p>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-extrabold text-[15px] shrink-0 ${isNeed ? 'bg-rose-500' : 'bg-brand-500'}`}>
                  {(l.owner_full_name_snapshot ?? 'کاربر')[0] ?? '؟'}
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-extrabold text-ink-900 truncate">
                    {l.owner_full_name_snapshot || 'کاربر دیوار مهربانی'}
                  </p>
                  <p className="text-[11.5px] text-ink-500">عضو دیوار مهربانی</p>
                </div>
              </div>
            </div>

            {/* Contact reveal — auth-gated + PII-protected */}
            <ContactRevealCard slug={l.slug} available={l.contact_available} isNeed={isNeed} />

            {/* Report / bookmark */}
            <div className="rounded-[20px] border border-ink-100 bg-white p-4 space-y-1.5">
              <Link
                href={`/kindness-wall?listing_type=${isNeed ? 'need_help' : 'offer_help'}`}
                className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-xl bg-ink-50 hover:bg-ink-100 text-ink-700 font-extrabold text-[12.5px] transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                <span>آگهی‌های مشابه</span>
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}

function formatDate(iso: string) {
  try { return new Date(iso).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }); }
  catch { return iso; }
}
