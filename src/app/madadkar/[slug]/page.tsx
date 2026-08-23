import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HeartHandshake, ShieldCheck, UsersRound } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import type { CampaignCard } from "@/components/home/WarFundSection";
import { safeApiFetch } from "@/lib/api";
import { absoluteMediaUrl, formatPersianNumber } from "@/lib/utils";
import { CampaignActions } from "./CampaignActions";

type CampaignDetail = {
  id: number;
  slug: string;
  title: string;
  description: string;
  sponsor: { id: number; name: string; slug: string; logo?: string | null };
  cover_image?: string | null;
  total_amount: number;
  total_shares: number;
  share_price: number;
  purchased_shares: number;
  purchased_amount: number;
  participant_count: number;
  remaining_shares: number;
  progress_percent: number;
  is_fully_funded: boolean;
  status: string;
  status_display: string;
  has_deadline: boolean;
  deadline?: string | null;
  published_at?: string | null;
  gallery_images?: Array<{
    id: number;
    image: string;
    alt_text?: string;
    display_order?: number;
  }>;
};

type Transparency = {
  gross_raised_amount: number;
  net_raised_amount: number;
  paid_disbursement_amount: number;
  remaining_disbursable_amount: number;
  receipt_count: number;
  successful_payment_count: number;
  net_progress_percent: number;
  public_note?: string;
};

async function loadCampaign(slug: string) {
  return safeApiFetch<CampaignDetail>(
    `/madadkar/campaigns/${encodeURIComponent(slug)}/`,
    {
      revalidate: 180,
      tags: ["madadkar", `campaign:${slug}`],
      timeoutMs: 10_000,
    },
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const campaign = await loadCampaign(slug);
  return {
    title: campaign ? campaign.title : "حرکت مردمی",
    description:
      campaign?.description?.slice(0, 160) || "جزئیات حرکت مردمی در بعثت مردم",
    alternates: { canonical: `/madadkar/${encodeURIComponent(slug)}` },
  };
}

export default async function CampaignPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [campaign, transparency] = await Promise.all([
    loadCampaign(slug),
    safeApiFetch<Transparency>(
      `/madadkar/campaigns/${encodeURIComponent(slug)}/transparency/`,
      { revalidate: 180, tags: ["madadkar"] },
    ),
  ]);
  if (!campaign) notFound();

  const gallery = (campaign.gallery_images || [])
    .slice()
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  const cover =
    absoluteMediaUrl(campaign.cover_image) ||
    absoluteMediaUrl(gallery[0]?.image);
  const card: CampaignCard = {
    slug: campaign.slug,
    title: campaign.title,
    sponsor: campaign.sponsor.name,
    sponsorLogo: absoluteMediaUrl(campaign.sponsor.logo),
    totalAmount: campaign.total_amount,
    sharePrice: campaign.share_price,
    sharesTotal: campaign.total_shares,
    sharesRemaining: campaign.remaining_shares,
    progressPercent: campaign.progress_percent,
    coverUrl: cover,
    participantCount: campaign.participant_count,
    isFullyFunded: campaign.is_fully_funded,
    hasDeadline: campaign.has_deadline,
    deadline: campaign.deadline || undefined,
    statusDisplay: campaign.status_display,
    gallery: gallery
      .map((image) => ({
        url: absoluteMediaUrl(image.image) || "",
        alt: image.alt_text || campaign.title,
      }))
      .filter((image) => image.url),
  };

  return (
    <main className="bg-ink-50 pb-16">
      <section className="bg-white py-9 md:py-14">
        <div className="container-edge">
          <Link
            href="/#warfund"
            className="text-sm font-extrabold text-brand-700 hover:underline"
          >
            بازگشت به حرکت‌ها
          </Link>
          <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(350px,.9fr)]">
            <div className="relative aspect-[16/10] overflow-hidden rounded-[2rem] bg-brand-50 shadow-card">
              <SmartImage
                src={cover}
                alt={campaign.title}
                variant="campaign"
                fill
                priority
                sizes="(max-width:1024px) 100vw, 58vw"
                className="object-cover"
              />
            </div>
            <div>
              <span className="inline-flex rounded-full bg-brand-50 px-3 py-1.5 text-xs font-extrabold text-brand-700">
                {campaign.status_display}
              </span>
              <h1 className="mt-4 text-3xl font-black leading-[1.55] md:text-4xl">
                {campaign.title}
              </h1>
              <div className="mt-5 flex items-center gap-3">
                <span className="relative h-11 w-11 overflow-hidden rounded-xl bg-ink-50">
                  <SmartImage
                    src={absoluteMediaUrl(campaign.sponsor.logo)}
                    alt={campaign.sponsor.name}
                    variant="avatar"
                    fill
                    sizes="44px"
                    className="object-cover"
                  />
                </span>
                <div>
                  <span className="block text-xs text-ink-400">مددکار</span>
                  <strong className="text-sm text-ink-800">
                    {campaign.sponsor.name}
                  </strong>
                </div>
              </div>
              <div className="mt-7">
                <div className="mb-2 flex justify-between text-xs font-extrabold">
                  <span>پیشرفت حرکت</span>
                  <span>
                    {formatPersianNumber(Math.round(campaign.progress_percent))}
                    ٪
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-ink-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-l from-brand-500 to-mint-500"
                    style={{
                      width: `${Math.min(100, campaign.progress_percent)}%`,
                    }}
                  />
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <Metric
                  label="مبلغ کل"
                  value={`${formatPersianNumber(campaign.total_amount)} تومان`}
                />
                <Metric
                  label="قیمت هر سهم"
                  value={`${formatPersianNumber(campaign.share_price)} تومان`}
                />
                <Metric
                  label="سهم باقی‌مانده"
                  value={formatPersianNumber(campaign.remaining_shares)}
                />
                <Metric
                  label="مشارکت‌کنندگان"
                  value={formatPersianNumber(campaign.participant_count)}
                />
              </div>
              <div className="mt-7">
                <CampaignActions campaign={card} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container-edge mt-8 space-y-7">
        <section className="rounded-2xl border border-ink-100 bg-white p-6 shadow-soft md:p-8">
          <h2 className="text-xl font-black">درباره این حرکت</h2>
          <p className="mt-4 whitespace-pre-line text-sm font-medium leading-9 text-ink-700">
            {campaign.description}
          </p>
        </section>

        {transparency && (
          <section className="rounded-2xl border border-brand-100 bg-gradient-to-br from-white to-brand-50/50 p-6 shadow-soft md:p-8">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-brand-700" />
              <div>
                <h2 className="text-xl font-black">شفافیت مالی</h2>
                <p className="mt-1 text-xs text-ink-400">
                  نمای عمومی و بدون اطلاعات هویتی مشارکت‌کنندگان
                </p>
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric
                label="مبلغ خالص جمع‌آوری‌شده"
                value={`${formatPersianNumber(transparency.net_raised_amount)} تومان`}
              />
              <Metric
                label="پرداخت‌شده به هدف"
                value={`${formatPersianNumber(transparency.paid_disbursement_amount)} تومان`}
              />
              <Metric
                label="مانده قابل تخصیص"
                value={`${formatPersianNumber(transparency.remaining_disbursable_amount)} تومان`}
              />
              <Metric
                label="پرداخت‌های موفق"
                value={formatPersianNumber(
                  transparency.successful_payment_count,
                )}
              />
            </div>
            {transparency.public_note && (
              <p className="mt-5 rounded-xl bg-white p-4 text-xs font-bold leading-7 text-ink-600">
                {transparency.public_note}
              </p>
            )}
          </section>
        )}

        {gallery.length > 0 && (
          <section>
            <h2 className="mb-5 text-xl font-black">گالری حرکت</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {gallery.map((image) => (
                <a
                  key={image.id}
                  href={absoluteMediaUrl(image.image)}
                  target="_blank"
                  rel="noreferrer"
                  className="relative aspect-square overflow-hidden rounded-2xl bg-ink-100"
                >
                  <SmartImage
                    src={absoluteMediaUrl(image.image)}
                    alt={image.alt_text || campaign.title}
                    variant="campaign"
                    fill
                    sizes="(max-width:640px) 50vw, 280px"
                    className="object-cover transition duration-300 hover:scale-105"
                  />
                </a>
              ))}
            </div>
          </section>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <Feature icon={<HeartHandshake />} text="مشارکت سهم‌محور" />
          <Feature icon={<UsersRound />} text="آمار عمومی مشارکت" />
          <Feature icon={<ShieldCheck />} text="رسید و شفافیت قابل بررسی" />
        </div>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ink-100 bg-white p-4">
      <span className="block text-[11px] font-bold text-ink-400">{label}</span>
      <strong className="mt-2 block text-sm font-black text-ink-800">
        {value}
      </strong>
    </div>
  );
}
function Feature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-4 text-sm font-extrabold shadow-soft">
      <span className="text-brand-700 [&>svg]:h-5 [&>svg]:w-5">{icon}</span>
      {text}
    </div>
  );
}
