import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import { notFound } from 'next/navigation';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarDays,
  ChevronLeft,
  Clock,
  Eye,
  Flame,
  Globe2,
  HandHeart,
  Handshake,
  Info,
  Layers,
  MapPin,
  Package,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  Timer,
  UserRound,
} from 'lucide-react';
import { ListingGallery } from '@/components/kindness/ListingGallery';
import { ListingContactCard } from '@/components/kindness/ListingContactCard';
import { ListingOfferBox } from '@/components/kindness/ListingOfferBox';
import { ListingShareCard } from '@/components/kindness/ListingShareCard';
import { ListingStickyBar } from '@/components/kindness/ListingStickyBar';
import { KindnessBoard } from '@/components/kindness/KindnessBoard';
import { ReadMoreText } from '@/components/ui/ReadMoreText';
import {
  fetchKindnessListingDetail,
  fetchRelatedKindnessListings,
  kindnessListingCanonical,
  listingAlbumImages,
  listingDeadline,
  listingLocationLine,
  listingMetaDescription,
  listingQuantityLabel,
  listingSharePayload,
  orderChannels,
} from '@/lib/kindness-listing';
import {
  KINDNESS_BOARD_PATH,
  kindnessHubHref,
  DEFAULT_KINDNESS_FILTERS,
} from '@/lib/kindness-wall';
import { normalizeRouteSlug } from '@/lib/route-slug';
import { siteConfig } from '@/lib/site';
import { absoluteMediaUrl, cn, formatPersianNumber as fa } from '@/lib/utils';
import { formatJalaliDate } from '@/lib/persian-time';

/**
 * ═══════════════════════════════════════════════════════════════════
 * kindness-wall/[slug] — صفحهٔ جزئیاتِ یک نیاز روی دیوار مهربانی
 *
 * تمامِ قابلیت‌های بک‌اندِ این دامنه استفاده می‌شود:
 *   • DETAIL کامل: شرح، beneficiary_name، contact_note، images[]،
 *     contact_channels[] (تنها منبعِ تماس)، days_left + expires_at،
 *     view_count، open_offers_count، is_nationwide، locality.
 *   • POST offer / DELETE withdraw → جزیرهٔ ListingOfferBox (احراز هویت‌شده).
 *   • فهرستِ عمومی با فیلترِ category → «نیازهای مشابه» (بدونِ اطلاعاتِ تماس).
 *   • STORIES/آمار: از طریق لینک به «دیوارِ نتیجه‌ها» و تخته.
 *
 * معماری:
 *   • SSR + ISR (revalidate=180 روی fetch؛ تگ‌های kindness:<slug>).
 *   • تصویرِ کاور eager (LCP) با SmartImage؛ گالری در جزیرهٔ کوچکِ کلاینتی.
 *   • تماس **درون‌صفحه** (نه پنهان در شیت) — تصمیمِ محصولی، چون اینجا کاربر
 *     دقیقاً برای همین آمده است؛ در موبایل نوارِ چسبان او را همین‌جا می‌آورد.
 *   • حالتِ «روی تخته نیست» = ۴۰۴ واقعی + صفحهٔ اختصاصیِ مهربان
 *     (not-found.tsx همین پوشه) تا سئو و تجربه با هم درست بمانند.
 * ═══════════════════════════════════════════════════════════════════
 */

export const revalidate = 180;

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const slug = normalizeRouteSlug((await params).slug);
  const detail = await fetchKindnessListingDetail(slug);
  if (!detail) {
    return {
      title: 'این نیاز روی تخته نیست | دیوار مهربانی',
      robots: { index: false, follow: true },
    };
  }
  const cover = absoluteMediaUrl(detail.cover_url ?? undefined);
  const canonical = kindnessListingCanonical(detail.slug, siteConfig.url);
  return {
    title: `${detail.title} | دیوار مهربانی`,
    description: listingMetaDescription(detail),
    alternates: { canonical },
    openGraph: {
      title: `${detail.title} | دیوار مهربانی`,
      description: listingMetaDescription(detail),
      url: canonical,
      type: 'article',
      ...(cover ? { images: [{ url: cover, alt: detail.title }] } : {}),
    },
    twitter: {
      card: cover ? 'summary_large_image' : 'summary',
      title: `${detail.title} | دیوار مهربانی`,
      description: listingMetaDescription(detail),
      ...(cover ? { images: [cover] } : {}),
    },
  };
}

/* ── آجرهای کوچک ─────────────────────────────────────────────────── */

function FactRow({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Layers;
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <li className="flex items-center justify-between gap-3 py-2.5">
      <span className="inline-flex items-center gap-2 text-[11.5px] font-bold text-ink-500">
        <Icon className={cn('h-3.5 w-3.5 shrink-0', tone ?? 'text-brand-500')} aria-hidden="true" />
        {label}
      </span>
      <span className="min-w-0 truncate text-left text-[12px] font-extrabold text-ink-900">
        {value}
      </span>
    </li>
  );
}

/* ── صفحه ─────────────────────────────────────────────────────────── */

export default async function KindnessListingPage({ params }: PageProps) {
  const slug = normalizeRouteSlug((await params).slug);
  const detail = await fetchKindnessListingDetail(slug);
  if (!detail) notFound();

  const related = await fetchRelatedKindnessListings(detail, 3);

  const base = siteConfig.url.replace(/\/+$/, '');
  const canonical = kindnessListingCanonical(detail.slug, base);
  const location = listingLocationLine(detail);
  const deadline = listingDeadline(detail);
  const quantity = listingQuantityLabel(detail);
  const channels = orderChannels(detail.contact_channels);
  const hasChannels = channels.length > 0;
  const urgent = detail.urgency === 'urgent';
  const album = listingAlbumImages(detail);
  const share = listingSharePayload(detail, base);
  const categoryTitle = detail.category?.title?.trim();
  const categoryHref = detail.category?.slug
    ? `${kindnessHubHref(DEFAULT_KINDNESS_FILTERS, { category: detail.category.slug })}#board`
    : `${KINDNESS_BOARD_PATH}#board`;

  /* ── JSON-LD: Demand + BreadcrumbList (نمای مرجع، بدونِ دادهٔ تماس) ── */
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'بعثت مردم', item: base },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'دیوار مهربانی',
        item: `${base}${KINDNESS_BOARD_PATH}`,
      },
      ...(categoryTitle
        ? [
            {
              '@type': 'ListItem',
              position: 3,
              name: categoryTitle,
              item: `${base}${categoryHref}`,
            },
          ]
        : []),
      {
        '@type': 'ListItem',
        position: categoryTitle ? 4 : 3,
        name: detail.title,
        item: canonical,
      },
    ],
  };
  const demandLd = {
    '@context': 'https://schema.org',
    '@type': 'Demand',
    '@id': `${canonical}#need`,
    name: detail.title,
    description: (detail.description || detail.excerpt || '').slice(0, 500),
    url: canonical,
    ...(detail.category?.title ? { category: detail.category.title } : {}),
    ...(detail.expires_at ? { availabilityEnds: detail.expires_at } : {}),
    ...(detail.published_at ? { availabilityStarts: detail.published_at } : {}),
    itemOffered: {
      '@type': 'Product',
      name: detail.title,
      ...(quantity ? { description: quantity } : {}),
    },
    ...(location.nationwide
      ? { areaServed: { '@type': 'Country', name: 'ایران' } }
      : {
          areaServed: {
            '@type': 'AdministrativeArea',
            name: [detail.province, detail.city].filter(Boolean).join(' / '),
          },
        }),
    seller: {
      '@type': 'Organization',
      name: 'بعثت مردم — دیوار مهربانی',
      url: `${base}${KINDNESS_BOARD_PATH}`,
    },
  };

  return (
    <main className="bg-white">
      <Script
        id="ld-json-kindness-listing"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(demandLd) }}
      />
      <Script
        id="ld-json-kindness-listing-breadcrumb"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      {/* ══════════ هیرو ══════════ */}
      <section className="relative overflow-hidden bg-ink-950 pb-20 pt-6 text-white md:pb-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.45]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(-45deg, rgba(255,255,255,.035) 0 2px, transparent 2px 15px)',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-28 bottom-0 h-72 w-72 rounded-full bg-rose-500/10 blur-3xl"
        />

        <div className="container-edge relative">
          {/* بردکرامب */}
          <nav aria-label="مسیر صفحه" className="mb-5">
            <ol className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-white/50">
              <li>
                <Link href="/" className="transition-colors hover:text-white">
                  خانه
                </Link>
              </li>
              <li aria-hidden="true">
                <ChevronLeft className="h-3 w-3" />
              </li>
              <li>
                <Link href={KINDNESS_BOARD_PATH} className="transition-colors hover:text-white">
                  دیوار مهربانی
                </Link>
              </li>
              {categoryTitle && (
                <>
                  <li aria-hidden="true">
                    <ChevronLeft className="h-3 w-3" />
                  </li>
                  <li>
                    <Link href={categoryHref} className="transition-colors hover:text-white">
                      {categoryTitle}
                    </Link>
                  </li>
                </>
              )}
              <li aria-hidden="true">
                <ChevronLeft className="h-3 w-3" />
              </li>
              <li aria-current="page" className="max-w-[46vw] truncate text-white/80">
                {detail.title}
              </li>
            </ol>
          </nav>

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-9">
            {/* گالری */}
            <div className="order-1">
              <ListingGallery
                title={detail.title}
                subtitle={{
                  label: 'دسته',
                  value: categoryTitle ? `${categoryTitle} · ${quantity}` : quantity,
                }}
                images={album.map((img) => ({ url: img.url, alt: img.alt ?? detail.title }))}
              />
            </div>

            {/* هویت و اقدام */}
            <div className="order-2 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {urgent ? (
                  <span className="inline-flex h-8 items-center gap-1.5 rounded-2xl bg-gradient-to-l from-[#f43f5e] to-[#e11d48] px-3 text-[11.5px] font-extrabold text-white ring-[2.5px] ring-black/10">
                    <Flame className="h-3.5 w-3.5" aria-hidden="true" />
                    نیازِ فوری
                  </span>
                ) : (
                  detail.is_featured && (
                    <span className="inline-flex h-8 items-center gap-1.5 rounded-2xl bg-gradient-to-l from-brand-500 to-brand-700 px-3 text-[11.5px] font-extrabold text-white ring-[2.5px] ring-black/10">
                      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                      ویژه
                    </span>
                  )
                )}

                {categoryTitle && (
                  <Link
                    href={categoryHref}
                    className="inline-flex h-8 items-center gap-1.5 rounded-2xl border border-white/15 bg-white/[.07] px-3 text-[11.5px] font-extrabold text-white/85 backdrop-blur-sm transition-colors hover:border-brand-300/40 hover:bg-white/[.12]"
                  >
                    {detail.category?.icon && (
                      <span aria-hidden="true" className="text-[13px] leading-none">
                        {detail.category.icon}
                      </span>
                    )}
                    {categoryTitle}
                  </Link>
                )}

                {deadline.tone !== 'none' && (
                  <span
                    className={cn(
                      'inline-flex h-8 items-center gap-1.5 rounded-2xl px-3 text-[11.5px] font-extrabold ring-1 backdrop-blur-sm',
                      deadline.emphasize
                        ? 'bg-amber-400/15 text-amber-200 ring-amber-300/25'
                        : 'bg-white/[.07] text-white/75 ring-white/15',
                    )}
                  >
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    {deadline.label}
                  </span>
                )}
              </div>

              <h1 className="fa-title mt-4 text-[24px] font-black text-white sm:text-[30px] md:text-[36px]">
                {detail.title}
              </h1>

              {detail.excerpt && detail.excerpt !== detail.description && (
                <p className="mt-3 line-clamp-3 text-[12.5px] font-medium leading-7 text-white/65 md:text-[13.5px]">
                  {detail.excerpt}
                </p>
              )}

              {/* آمارِ اعتماد */}
              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11.5px] font-bold text-white/55">
                <span className="inline-flex items-center gap-1.5">
                  {location.nationwide ? (
                    <>
                      <Globe2 className="h-3.5 w-3.5 text-brand-300" aria-hidden="true" />
                      سراسر کشور
                    </>
                  ) : (
                    <>
                      <MapPin className="h-3.5 w-3.5 text-brand-300" aria-hidden="true" />
                      {location.text}
                    </>
                  )}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5 text-brand-300" aria-hidden="true" />
                  {quantity}
                </span>
                {typeof detail.view_count === 'number' && detail.view_count > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5 text-brand-300" aria-hidden="true" />
                    {`${fa(detail.view_count)} بازدید`}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Handshake className="h-3.5 w-3.5 text-mint-300" aria-hidden="true" />
                  {detail.open_offers_count && detail.open_offers_count > 0
                    ? `${fa(detail.open_offers_count)} نفر آمادهٔ کمک`
                    : 'اولین نفرِ کمک شو'}
                </span>
              </div>

              {/* دکمه‌های اصلی (دسکتاپ) */}
              <div className="mt-6 hidden flex-wrap gap-2.5 sm:flex">
                {hasChannels ? (
                  <a
                    href="#contact"
                    className="inline-flex h-[52px] items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#0D8074,#0A6E64_50%,#085C54)] px-6 text-[13.5px] font-extrabold text-white shadow-[0_10px_24px_-10px_rgba(13,128,116,.75)] transition-all hover:brightness-[1.08] active:scale-[.99]"
                  >
                    <PhoneCall className="h-4 w-4" aria-hidden="true" />
                    راه‌های ارتباط
                  </a>
                ) : null}
                <a
                  href="#offer"
                  className="inline-flex h-[52px] items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/[.06] px-5 text-[13px] font-extrabold text-white backdrop-blur-sm transition-colors hover:border-brand-300/50 hover:bg-white/[.12]"
                >
                  <HandHeart className="h-4 w-4" aria-hidden="true" />
                  من هم می‌توانم
                </a>
              </div>

              {/* مُهرِ اعتماد */}
              <p className="mt-5 inline-flex items-start gap-2 rounded-2xl border border-white/10 bg-white/[.04] px-3.5 py-2.5 text-[10.5px] font-medium leading-5 text-white/55">
                <ShieldCheck
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mint-300"
                  aria-hidden="true"
                />
                این نیاز را تیمِ بعثت به‌نیابت از صاحبِ نیاز ثبت و بررسی کرده است؛ راه‌های ارتباط،
                همان‌هایی است که خودِ آگهی می‌دهد.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ بدنه: محتوا + سایدبار ══════════ */}
      <section className="container-edge relative z-10 -mt-12 pb-14 md:pb-20">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6">
          {/* ── ستونِ محتوا ─────────────────────────────────────── */}
          <div className="min-w-0 space-y-5">
            {/* شرح */}
            <article className="rounded-[24px] border border-ink-100 bg-white p-5 shadow-[0_2px_14px_-8px_rgba(15,20,32,.14)] sm:p-6">
              <h2 className="inline-flex items-center gap-2 text-[15px] font-black text-ink-900">
                <Info className="h-4 w-4 text-brand-600" aria-hidden="true" />
                دربارهٔ این نیاز
              </h2>
              <div className="mt-3 text-[13px] leading-8 text-ink-700">
                <ReadMoreText
                  text={detail.description || detail.excerpt || '—'}
                  id="kw-need-text"
                />
              </div>

              {/* چیپ‌های خوانا از همان داده */}
              <dl className="mt-5 flex flex-wrap gap-2">
                {[
                  { icon: Package, label: 'مقدار', value: quantity },
                  {
                    icon: MapPin,
                    label: 'موقعیت',
                    value: location.nationwide ? 'سراسر کشور' : location.text,
                  },
                  ...(categoryTitle ? [{ icon: Layers, label: 'دسته', value: categoryTitle }] : []),
                  ...(detail.beneficiary_name
                    ? [{ icon: UserRound, label: 'به‌نیابت از', value: detail.beneficiary_name }]
                    : []),
                ].map((chip) => (
                  <div
                    key={chip.label}
                    className="inline-flex items-center gap-2 rounded-xl border border-ink-100 bg-ink-50/60 px-3 py-2"
                  >
                    <chip.icon className="h-3.5 w-3.5 shrink-0 text-brand-600" aria-hidden="true" />
                    <dt className="text-[10.5px] font-bold text-ink-400">{chip.label}</dt>
                    <dd className="max-w-[46vw] truncate text-[11.5px] font-extrabold text-ink-800">
                      {chip.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </article>

            {/* راه‌های ارتباط */}
            <div id="contact" className="scroll-mt-24">
              <ListingContactCard
                channels={channels}
                contactNote={detail.contact_note}
                beneficiary={detail.beneficiary_name}
              />
            </div>

            {/* اعلام آمادگی */}
            <div className="scroll-mt-24">
              <ListingOfferBox
                slug={detail.slug}
                listingTitle={detail.title}
                openOffersCount={detail.open_offers_count}
              />
            </div>

            {/* گالریِ کامل (اگر بیش از یک تصویر) */}
            {album.length > 2 && (
              <div className="rounded-[24px] border border-ink-100 bg-white p-5 sm:p-6">
                <h2 className="inline-flex items-center gap-2 text-[15px] font-black text-ink-900">
                  <Layers className="h-4 w-4 text-brand-600" aria-hidden="true" />
                  تصاویرِ این نیاز
                  <span className="text-[11px] font-bold text-ink-400">
                    {`(${fa(album.length)})`}
                  </span>
                </h2>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {album.slice(0, 6).map((img, i) => (
                    <div
                      key={`${img.url}-${i}`}
                      className="relative aspect-[4/3] overflow-hidden rounded-xl bg-ink-100"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={img.alt || detail.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[10.5px] font-bold text-ink-400">
                  برای دیدنِ اندازهٔ کامل، روی عکسِ اصلی بزن.
                </p>
              </div>
            )}

            {/* بازگشت به تخته */}
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`${kindnessHubHref(DEFAULT_KINDNESS_FILTERS, {})}#board`}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 text-[12px] font-extrabold text-ink-700 transition-colors hover:border-brand-300 hover:text-brand-700"
              >
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
                همهٔ نیازهای دیوار
              </Link>
              {categoryTitle && (
                <Link
                  href={categoryHref}
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 text-[12px] font-extrabold text-ink-700 transition-colors hover:border-brand-300 hover:text-brand-700"
                >
                  <Layers className="h-4 w-4" aria-hidden="true" />
                  {`همهٔ نیازهای «${categoryTitle}»`}
                </Link>
              )}
            </div>
          </div>

          {/* ── سایدبار ─────────────────────────────────────────── */}
          <aside className="min-w-0 space-y-4 lg:sticky lg:top-24 lg:self-start">
            {/* مهلت */}
            <div className="rounded-[22px] border border-ink-100 bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="inline-flex items-center gap-1.5 text-[12px] font-black text-ink-900">
                  <Timer className="h-4 w-4 text-brand-600" aria-hidden="true" />
                  مهلتِ این نیاز
                </p>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10.5px] font-extrabold tabular-nums',
                    deadline.tone === 'critical' || deadline.tone === 'expired'
                      ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-100'
                      : deadline.tone === 'soon'
                        ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-100'
                        : 'bg-brand-50 text-brand-700 ring-1 ring-brand-100',
                  )}
                >
                  {deadline.label}
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink-100" role="presentation">
                <div
                  className={cn(
                    'h-full rounded-full transition-[width] duration-700',
                    deadline.tone === 'critical' || deadline.tone === 'expired'
                      ? 'bg-gradient-to-l from-rose-500 to-rose-400'
                      : deadline.tone === 'soon'
                        ? 'bg-gradient-to-l from-amber-500 to-amber-400'
                        : 'bg-gradient-to-l from-brand-600 to-brand-400',
                  )}
                  style={{ width: `${Math.round(deadline.elapsedPct)}%` }}
                />
              </div>
              <p className="mt-2 text-[10.5px] font-medium leading-5 text-ink-500">
                {detail.expires_at
                  ? `تا ${formatJalaliDate(detail.expires_at)} روی تخته می‌ماند.`
                  : 'این آگهی تاریخِ انقضای مشخصی ندارد.'}
              </p>
            </div>

            {/* مشخصات */}
            <div className="rounded-[22px] border border-ink-100 bg-white p-4">
              <p className="text-[12px] font-black text-ink-900">مشخصاتِ آگهی</p>
              <ul className="mt-1 divide-y divide-ink-100">
                <FactRow icon={Package} label="مقدار" value={quantity} />
                <FactRow
                  icon={location.nationwide ? Globe2 : MapPin}
                  label="موقعیت"
                  value={location.nationwide ? 'سراسر کشور' : location.text}
                />
                {categoryTitle && <FactRow icon={Layers} label="دسته" value={categoryTitle} />}
                {detail.beneficiary_name && (
                  <FactRow icon={Building2} label="به‌نیابت از" value={detail.beneficiary_name} />
                )}
                {detail.published_at && (
                  <FactRow
                    icon={CalendarDays}
                    label="انتشار"
                    value={formatJalaliDate(detail.published_at)}
                  />
                )}
                <FactRow
                  icon={Eye}
                  label="بازدید"
                  value={fa(detail.view_count ?? 0)}
                  tone="text-ink-400"
                />
                <FactRow
                  icon={Handshake}
                  label="اعلامِ آمادگی"
                  value={fa(detail.open_offers_count ?? 0)}
                  tone="text-mint-500"
                />
              </ul>
            </div>

            {/* اشتراک‌گذاری */}
            <ListingShareCard title={share.title} text={share.text} url={share.url} />

            {/* یادآوریِ اعتماد */}
            <div className="rounded-[22px] border border-mint-100 bg-mint-50/60 p-4">
              <p className="inline-flex items-center gap-1.5 text-[11.5px] font-black text-mint-800">
                <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                چرا می‌توانی اعتماد کنی؟
              </p>
              <ul className="mt-2 space-y-1.5 text-[10.5px] font-medium leading-5 text-mint-900/80">
                <li>• نیاز توسط تیمِ بعثت ثبت و راستی‌آزمایی شده است.</li>
                <li>• راهِ ارتباط، همان چیزی است که صاحبِ نیاز داده.</li>
                <li>• بدونِ واسطه و بدونِ پرداختِ آنلاین — حضوری هماهنگ کن.</li>
              </ul>
            </div>
          </aside>
        </div>

        {/* ══════════ نیازهای مشابه ══════════ */}
        {related.length > 0 && (
          <div className="mt-12">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="inline-flex items-center gap-1.5 text-[11.5px] font-extrabold text-brand-700">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  شاید این‌ها هم در توانت باشد
                </p>
                <h2 className="fa-title mt-1 text-[19px] font-black text-ink-900 md:text-[22px]">
                  نیازهای مشابه{categoryTitle ? ` در «${categoryTitle}»` : ''}
                </h2>
              </div>
              <Link
                href={categoryHref}
                className="inline-flex h-10 items-center gap-1.5 rounded-full border-2 border-brand-500 bg-white px-4 text-[11.5px] font-extrabold text-brand-700 transition-colors hover:bg-brand-50"
              >
                {`همهٔ ${categoryTitle ?? 'نیازهای تخته'}`}
                <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
            <KindnessBoard listings={related} />
          </div>
        )}
      </section>

      {/* نوارِ چسبانِ موبایل */}
      <ListingStickyBar
        hasChannels={hasChannels}
        shareTitle={share.title}
        shareText={share.text}
        shareUrl={share.url}
      />
    </main>
  );
}
