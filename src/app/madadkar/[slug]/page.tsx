import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowRight,
  BadgeCheck,
  BookOpenText,
  ChevronLeft,
  Image as ImageIcon,
  Landmark,
  Scale,
  ShieldCheck,
  Timer,
  Users,
} from 'lucide-react';
import { SmartImage } from '@/components/ui/SmartImage';
import { ParticipateIsland } from '@/components/madadkar/ParticipateIsland';
import { MadadkarGallery } from '@/components/madadkar/MadadkarGallery';
import { absoluteMediaUrl, formatPersianNumber, toPersianDigits } from '@/lib/utils';
import {
  campaignLifecycle,
  clampPercent,
  fetchCampaignDetail,
  fetchTransparency,
  formatTomanFull,
  jalaliDateShort,
  jalaliDateTimeShort,
  normalizeCampaignAlbum,
  type PaymentSheetCampaignBridge,
} from '@/lib/madadkar';

/**
 * ═══════════════════════════════════════════════════════════════════
 * madadkar/[slug] — صفحهٔ جزئیاتِ حرکت
 *
 *   • SSR کامل + ISR (revalidate روی fetchها) — هیرو، توضیحات، گالری و
 *     دفترِ شفافیتِ مالی همه سرور-رندرند؛ تعامل (شیتِ پرداخت، لایت‌باکس،
 *     اشتراک) فقط در جزیره‌های کوچکِ کلاینتی زندگی می‌کند.
 *   • دفترِ شفافیت مستقیماً از GET /campaigns/{slug}/transparency/
 *     (selector عمومیِ بک‌اند — بدون دادهٔ شخصی مشارکت‌کنندگان) تغذیه می‌شود.
 * ═══════════════════════════════════════════════════════════════════
 */

export const revalidate = 300;

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const c = await fetchCampaignDetail(slug);
  if (!c) return { title: 'مدد به حرکت' };
  const desc =
    c.description?.replace(/\s+/g, ' ').trim().slice(0, 160) ||
    `حمایتِ مالیِ جمعی از «${c.title}»؛ سهم بخرید و مسیرِ هر تومان را شفاف دنبال کنید.`;
  const cover = absoluteMediaUrl(c.cover_image);
  return {
    title: `${c.title} | مدد به حرکت`,
    description: desc,
    openGraph: cover ? { images: [{ url: cover }] } : undefined,
  };
}

export default async function CampaignDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const [campaign, transparency] = await Promise.all([
    fetchCampaignDetail(slug),
    fetchTransparency(slug),
  ]);

  if (!campaign) notFound();

  const lifecycle = campaignLifecycle(campaign);
  const pct = clampPercent(campaign.progress_percent);
  const coverUrl = absoluteMediaUrl(campaign.cover_image);
  const sponsorLogo = absoluteMediaUrl(campaign.sponsor?.logo);
  const album = normalizeCampaignAlbum(campaign);
  const deadlineJalali = campaign.has_deadline ? jalaliDateShort(campaign.deadline) : null;

  const sheetCampaign: PaymentSheetCampaignBridge = {
    slug: campaign.slug,
    title: campaign.title,
    sponsor: campaign.sponsor?.name || 'مددکار مجموعه',
    sponsorLogo,
    totalAmount: campaign.total_amount ?? 0,
    sharePrice: campaign.share_price ?? 0,
    sharesTotal: campaign.total_shares ?? 0,
    sharesRemaining: Math.max(0, campaign.remaining_shares ?? 0),
    progressPercent: campaign.progress_percent ?? 0,
    coverUrl,
    gallery: album,
    statusDisplay: campaign.status_display,
    isFullyFunded: campaign.is_fully_funded,
    hasDeadline: campaign.has_deadline,
    deadline: campaign.deadline ?? undefined,
  };

  return (
    <main className="bg-white pb-24 sm:pb-12">
      {/* ── نوارِ برگشت ─────────────────────────────────────────────── */}
      <div className="container-edge pt-4">
        <Link
          href="/madadkar"
          className="inline-flex items-center gap-1.5 text-[12.5px] font-extrabold text-ink-500 transition-colors hover:text-brand-700"
        >
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
          بازگشت به همهٔ حرکت‌ها
        </Link>
      </div>

      {/* ── هیروی سینمایی ──────────────────────────────────────────── */}
      <section className="container-edge mt-3">
        <div className="relative overflow-hidden rounded-[24px] bg-ink-900 text-white shadow-[0_30px_60px_-30px_rgba(11,53,48,.45)]">
          <div className="relative aspect-[16/9] w-full sm:aspect-[21/9]">
            <SmartImage
              src={coverUrl ?? null}
              alt={campaign.title}
              variant="campaign"
              fill
              sizes="(min-width: 1024px) 1100px, 100vw"
              className="object-cover"
              priority
            />
            <div
              aria-hidden="true"
              className="from-ink-950/95 via-ink-950/40 to-ink-950/10 absolute inset-0 bg-gradient-to-t"
            />
          </div>

          {/* مُهرها */}
          <div className="absolute right-4 top-4 flex flex-wrap items-center gap-2 sm:right-6 sm:top-6">
            {lifecycle === 'completed' ? (
              <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-mint-500 px-3 text-[12px] font-extrabold text-white shadow-lg ring-1 ring-white/25">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {campaign.status_display || 'تأمین کامل شد'}
              </span>
            ) : lifecycle === 'closed' ? (
              <span className="inline-flex h-8 items-center rounded-full bg-ink-700/90 px-3 text-[12px] font-extrabold text-white ring-1 ring-white/20 backdrop-blur">
                بسته‌شده
              </span>
            ) : (
              <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-brand-500/95 px-3 text-[12px] font-extrabold text-white shadow-lg ring-1 ring-white/25">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                در حال جمع‌آوری
              </span>
            )}
            {deadlineJalali && lifecycle === 'active' && (
              <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-black/45 px-3 text-[12px] font-extrabold text-white ring-1 ring-white/20 backdrop-blur">
                <Timer className="h-3.5 w-3.5" aria-hidden="true" />
                مهلت: {deadlineJalali}
              </span>
            )}
          </div>

          {/* محتوای پایینیِ هیرو */}
          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 md:p-8">
            <div className="inline-flex items-center gap-2">
              <span className="relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-lg bg-white/10 ring-1 ring-white/20 backdrop-blur-sm">
                {sponsorLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={sponsorLogo} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Landmark className="h-4 w-4 text-white/70" aria-hidden="true" />
                )}
              </span>
              <span className="text-[12px] font-extrabold text-white/85">
                {campaign.sponsor?.name || 'مددکار مجموعه'}
              </span>
              <BadgeCheck
                className="h-4 w-4 text-mint-400"
                aria-hidden="true"
                aria-label="مددکار تأییدشده"
              />
            </div>

            <h1 className="sm:leading-11 mt-2 max-w-3xl text-[20px] font-black leading-9 text-white sm:text-[26px] md:text-[32px]">
              {campaign.title}
            </h1>

            {/* مترِ پیشرفتِ بزرگ + آمار */}
            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <div className="mb-1.5 flex items-center justify-between text-[12px] font-bold text-white/80">
                  <span>
                    {formatPersianNumber(campaign.purchased_shares ?? 0)} سهم از{' '}
                    {formatPersianNumber(campaign.total_shares ?? 0)} تأمین شد
                  </span>
                  <span className="text-mint-300 text-[16px] font-black tabular-nums">
                    ٪{formatPersianNumber(pct)}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-white/15 ring-1 ring-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-l from-mint-400 to-mint-600 transition-[width] duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-[11.5px] font-extrabold text-white ring-1 ring-white/15 backdrop-blur-sm">
                  <Users className="text-mint-300 h-3.5 w-3.5" aria-hidden="true" />
                  {formatPersianNumber(campaign.participant_count ?? 0)} مشارکت‌کننده
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-[11.5px] font-extrabold tabular-nums text-white ring-1 ring-white/15 backdrop-blur-sm">
                  {lifecycle === 'active'
                    ? `${formatPersianNumber(Math.max(0, campaign.remaining_shares))} سهم باقی`
                    : 'حرکت کامل شد'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA + عدادِ ارقام ─────────────────────────────────────────── */}
      <section className="container-edge mt-5">
        <div className="grid gap-5 lg:grid-cols-[1fr_330px]">
          {/* ستونِ محتوا */}
          <div className="min-w-0 space-y-8">
            <ParticipateIsland campaign={sheetCampaign} lifecycle={lifecycle} />

            {/* ارقامِ کلیدی */}
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {[
                {
                  label: 'قیمت هر سهم',
                  value: `${formatPersianNumber(campaign.share_price ?? 0)} تومان`,
                },
                { label: 'مبلغ کل حرکت', value: formatTomanFull(campaign.total_amount) },
                { label: 'تأمین‌شده', value: formatTomanFull(campaign.purchased_amount) },
                {
                  label: 'کل سهم‌ها',
                  value: `${formatPersianNumber(campaign.total_shares ?? 0)} سهم`,
                },
              ].map((k) => (
                <div
                  key={k.label}
                  className="rounded-2xl border border-ink-100 bg-ink-50/60 px-3.5 py-3"
                >
                  <div className="text-[10.5px] font-bold text-ink-400">{k.label}</div>
                  <div
                    className="mt-1 truncate text-[13.5px] font-extrabold tabular-nums text-ink-900"
                    title={k.value}
                  >
                    {k.value}
                  </div>
                </div>
              ))}
            </div>

            {/* توضیحات */}
            {campaign.description && (
              <section aria-labelledby="desc-h">
                <h2
                  id="desc-h"
                  className="mb-3 flex items-center gap-2 text-[17px] font-black text-ink-900"
                >
                  <BookOpenText className="h-5 w-5 text-brand-600" aria-hidden="true" />
                  دربارهٔ این حرکت
                </h2>
                <div className="prose-fa whitespace-pre-wrap rounded-3xl border border-ink-100 bg-white p-5 text-[13.5px] leading-8 text-ink-700 shadow-[0_2px_10px_-6px_rgba(15,20,32,.06)] sm:p-6 sm:text-[14px]">
                  {campaign.description}
                </div>
              </section>
            )}

            {/* گالری */}
            {album.length > 1 && (
              <section aria-labelledby="gallery-h">
                <h2
                  id="gallery-h"
                  className="mb-3 flex items-center gap-2 text-[17px] font-black text-ink-900"
                >
                  <ImageIcon className="h-5 w-5 text-brand-600" aria-hidden="true" />
                  آلبومِ حرکت
                  <span className="text-[12px] font-bold tabular-nums text-ink-400">
                    ({toPersianDigits(album.length)})
                  </span>
                </h2>
                <MadadkarGallery
                  images={album}
                  title={campaign.title}
                  subtitle={
                    campaign.sponsor?.name
                      ? { label: 'مددکار', value: campaign.sponsor.name }
                      : undefined
                  }
                />
              </section>
            )}
          </div>

          {/* ستونِ کناری — دفتر شفافیت + مددکار */}
          <aside className="space-y-4">
            {/* مددکار */}
            <div className="rounded-3xl border border-ink-100 bg-white p-4 shadow-[0_2px_10px_-6px_rgba(15,20,32,.06)]">
              <div className="flex items-center gap-3">
                <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-ink-50 ring-1 ring-ink-100">
                  {sponsorLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={sponsorLogo}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <Landmark className="h-5 w-5 text-ink-400" aria-hidden="true" />
                  )}
                </span>
                <div className="min-w-0">
                  <div className="text-[10.5px] font-bold text-ink-400">مددکارِ این حرکت</div>
                  <div className="mt-0.5 flex items-center gap-1 text-[14px] font-extrabold text-ink-900">
                    <span className="truncate">{campaign.sponsor?.name || 'مددکار مجموعه'}</span>
                    <BadgeCheck className="h-4 w-4 shrink-0 text-mint-600" aria-hidden="true" />
                  </div>
                </div>
              </div>
              <p className="mt-3 border-t border-dashed border-ink-100 pt-3 text-[11px] leading-6 text-ink-500">
                این حرکت توسط مددکارِ رسمیِ مجموعه اداره می‌شود و صورت‌های مالی‌اش در دفترِ شفافیتِ
                همین صفحه قابلِ راستی‌آزمایی است.
              </p>
            </div>

            {/* دفترِ شفافیت */}
            {transparency ? (
              <div
                className="border-mint-200 overflow-hidden rounded-3xl border bg-gradient-to-b from-mint-50/70 to-white shadow-[0_2px_10px_-6px_rgba(13,128,116,.12)]"
                aria-labelledby="transparency-h"
              >
                <div className="flex items-center gap-2 border-b border-mint-100 bg-mint-50/80 px-4 py-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-mint-500/15 text-mint-700">
                    <Scale className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 id="transparency-h" className="text-[13.5px] font-extrabold text-ink-900">
                      دفترِ شفافیتِ مالی
                    </h2>
                    {transparency.generated_at && (
                      <p className="text-[9.5px] font-bold text-ink-400">
                        به‌روزرسانی: {jalaliDateTimeShort(transparency.generated_at)}
                      </p>
                    )}
                  </div>
                </div>
                <dl className="space-y-2.5 px-4 py-4 text-[12px] font-bold">
                  <div className="flex items-center justify-between">
                    <dt className="text-ink-500">هدفِ حرکت</dt>
                    <dd className="tabular-nums text-ink-900">
                      {formatTomanFull(transparency.target_amount)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-ink-500">جذبِ ناخالص</dt>
                    <dd className="tabular-nums text-ink-900">
                      {formatTomanFull(transparency.gross_raised_amount)}
                    </dd>
                  </div>
                  {transparency.completed_refund_amount > 0 && (
                    <div className="flex items-center justify-between">
                      <dt className="text-ink-500">استردادِ انجام‌شده</dt>
                      <dd className="tabular-nums text-rose-600">
                        {formatTomanFull(transparency.completed_refund_amount)}
                      </dd>
                    </div>
                  )}
                  <div className="flex items-center justify-between rounded-xl bg-mint-50 px-2.5 py-2 ring-1 ring-mint-100">
                    <dt className="text-mint-800 font-extrabold">جذبِ خالص</dt>
                    <dd className="text-mint-800 text-[13px] font-extrabold tabular-nums">
                      {formatTomanFull(transparency.net_raised_amount)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-ink-500">هزینه‌کردِ پرداخت‌شده</dt>
                    <dd className="tabular-nums text-ink-900">
                      {formatTomanFull(transparency.paid_disbursement_amount)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-ink-500">تعهدِ هزینه‌کرد (در مسیر)</dt>
                    <dd className="tabular-nums text-ink-900">
                      {formatTomanFull(transparency.committed_disbursement_amount)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-ink-500">قابلِ هزینه‌کردِ باقی</dt>
                    <dd className="tabular-nums text-ink-900">
                      {formatTomanFull(transparency.remaining_disbursable_amount)}
                    </dd>
                  </div>
                  <div className="border-t border-dashed border-ink-100 pt-2.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <dt className="text-ink-400">پرداختِ موفق ثبت‌شده</dt>
                      <dd className="tabular-nums text-ink-700">
                        {formatPersianNumber(transparency.successful_payment_count)}
                      </dd>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px]">
                      <dt className="text-ink-400">رسیدِ دیجیتالِ صادرشده</dt>
                      <dd className="tabular-nums text-ink-700">
                        {formatPersianNumber(transparency.receipt_count)}
                      </dd>
                    </div>
                  </div>
                </dl>
                <p className="text-mint-800/90 border-t border-mint-100 bg-mint-50/50 px-4 py-2.5 text-[10px] font-medium leading-5">
                  {transparency.public_note ||
                    'این گزارش عمومی، بدون نمایش اطلاعات خصوصی مشارکت‌کنندگان تولید شده است.'}
                </p>
              </div>
            ) : (
              <div className="rounded-3xl border border-ink-100 bg-white p-4 text-[11.5px] leading-6 text-ink-500">
                <span className="mb-2 flex items-center gap-1.5 font-extrabold text-ink-700">
                  <Scale className="h-4 w-4 text-ink-400" aria-hidden="true" />
                  دفترِ شفافیتِ مالی
                </span>
                گزارشِ شفافیت فعلاً در دسترس نیست؛ به‌زودی از همین نقطه به‌روزرسانی می‌شود.
              </div>
            )}

            {/* اعتماد */}
            <div className="space-y-2 rounded-3xl border border-ink-100 bg-ink-50/60 p-4">
              <p className="flex items-center gap-2 text-[11.5px] font-extrabold text-ink-700">
                <ShieldCheck className="h-4 w-4 text-brand-600" aria-hidden="true" />
                پرداختِ امن از درگاهِ رسمی
              </p>
              <p className="text-[11px] leading-6 text-ink-500">
                تراکنش فقط روی صفحهٔ بانکی ثبت می‌شود؛ پس از موفقیت، رسیدِ دیجیتال با شمارهٔ پیگیری
                برای شما صادر و در دفترِ شفافیت اثرش ثبت می‌گردد.
              </p>
            </div>
          </aside>
        </div>
      </section>

      {/* ── لینکِ برگشتِ پایانی ───────────────────────────────────────── */}
      <div className="container-edge mt-10 flex justify-center sm:mt-12">
        <Link
          href="/madadkar"
          className="inline-flex h-12 items-center gap-2 rounded-full border-2 border-brand-500 bg-white px-7 text-[14px] font-extrabold text-brand-700 transition-colors hover:bg-brand-50"
        >
          <span>مشاهدهٔ همهٔ حرکت‌ها</span>
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </main>
  );
}
