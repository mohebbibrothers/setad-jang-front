import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HeartHandshake, MapPin, Sparkles, UserRound } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { safeApiFetch } from "@/lib/api";
import { absoluteMediaUrl, formatPersianNumber } from "@/lib/utils";
import { KindnessActions } from "./KindnessActions";

type Listing = {
  id: number;
  slug: string;
  listing_type: "need_help" | "offer_help";
  category: { title: string; slug: string };
  title: string;
  description: string;
  address_hint?: string;
  province: string;
  city: string;
  district?: string;
  owner_full_name_snapshot: string;
  owner_avatar_snapshot?: string;
  published_at?: string;
  expires_at?: string | null;
  view_count: number;
  cover_image?: string | null;
  contact_available: boolean;
  images?: Array<{
    id: number;
    image: string;
    caption?: string;
    alt_text?: string;
    is_cover?: boolean;
    order?: number;
  }>;
};
type Match = {
  id: number;
  score: number;
  explanation?: string;
  target_listing: {
    slug: string;
    title: string;
    listing_type: string;
    city?: string;
    province?: string;
    cover_image?: string | null;
  };
};

async function loadListing(slug: string) {
  return safeApiFetch<Listing>(
    `/kindness-wall/listings/${encodeURIComponent(slug)}/`,
    { revalidate: 180, tags: ["kindness", `listing:${slug}`] },
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const listing = await loadListing(slug);
  return {
    title: listing?.title || "دیوار مهربانی",
    description: listing?.description?.slice(0, 160),
    alternates: { canonical: `/kindness-wall/${encodeURIComponent(slug)}` },
  };
}

export default async function KindnessDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [listing, matchesPayload] = await Promise.all([
    loadListing(slug),
    safeApiFetch<{ results?: Match[] } | Match[]>(
      `/kindness-wall/listings/${encodeURIComponent(slug)}/matches/`,
      { revalidate: 180, tags: ["kindness"] },
    ),
  ]);
  if (!listing) notFound();
  const images = (listing.images || [])
    .slice()
    .sort(
      (a, b) =>
        Number(Boolean(b.is_cover)) - Number(Boolean(a.is_cover)) ||
        (a.order || 0) - (b.order || 0),
    );
  const cover =
    absoluteMediaUrl(listing.cover_image) || absoluteMediaUrl(images[0]?.image);
  const matches = Array.isArray(matchesPayload)
    ? matchesPayload
    : matchesPayload?.results || [];
  const isNeed = listing.listing_type === "need_help";

  return (
    <main className="bg-ink-50 pb-16">
      <section
        className={`py-10 text-white ${isNeed ? "bg-gradient-to-br from-rose-700 to-rose-500" : "bg-gradient-to-br from-brand-800 to-mint-600"}`}
      >
        <div className="container-edge">
          <Link
            href="/#kindness"
            className="text-sm font-extrabold text-white/80 hover:text-white"
          >
            بازگشت به دیوار مهربانی
          </Link>
          <div className="mt-6 grid items-center gap-8 lg:grid-cols-[1fr_.9fr]">
            <div className="relative aspect-[16/10] overflow-hidden rounded-[2rem] border border-white/20 bg-white/10 shadow-2xl">
              <SmartImage
                src={cover}
                alt={listing.title}
                variant="kindness"
                fill
                priority
                sizes="(max-width:1024px) 100vw, 55vw"
                className="object-cover"
              />
            </div>
            <div>
              <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-extrabold backdrop-blur">
                {isNeed ? "نیاز به کمک" : "پیشنهاد کمک"} ·{" "}
                {listing.category.title}
              </span>
              <h1 className="mt-5 text-3xl font-black leading-[1.55] text-white md:text-4xl">
                {listing.title}
              </h1>
              <p className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-white/75">
                <MapPin className="h-4 w-4" />{" "}
                {[listing.city, listing.province].filter(Boolean).join("، ")}
              </p>
              <div className="mt-6 flex items-center gap-3">
                <span className="relative h-11 w-11 overflow-hidden rounded-full bg-white/15">
                  <SmartImage
                    src={absoluteMediaUrl(listing.owner_avatar_snapshot)}
                    alt={listing.owner_full_name_snapshot}
                    variant="avatar"
                    fill
                    sizes="44px"
                    className="object-cover"
                  />
                </span>
                <span className="text-sm font-extrabold">
                  {listing.owner_full_name_snapshot || "کاربر دیوار مهربانی"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
      <div className="container-edge mt-8 grid gap-6 lg:grid-cols-[1fr_330px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-ink-100 bg-white p-6 shadow-soft md:p-8">
            <h2 className="text-xl font-black">شرح آگهی</h2>
            <p className="mt-4 whitespace-pre-line text-sm font-medium leading-9 text-ink-700">
              {listing.description}
            </p>
            {listing.address_hint && (
              <p className="mt-5 rounded-xl bg-ink-50 p-4 text-xs font-bold text-ink-500">
                نشانی تقریبی: {listing.address_hint}
              </p>
            )}
          </section>
          {images.length > 1 && (
            <section>
              <h2 className="mb-5 text-xl font-black">تصاویر آگهی</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {images.map((image) => (
                  <a
                    key={image.id}
                    href={absoluteMediaUrl(image.image)}
                    target="_blank"
                    rel="noreferrer"
                    className="relative aspect-square overflow-hidden rounded-2xl bg-ink-100"
                  >
                    <SmartImage
                      src={absoluteMediaUrl(image.image)}
                      alt={image.alt_text || image.caption || listing.title}
                      variant="kindness"
                      fill
                      sizes="240px"
                      className="object-cover"
                    />
                  </a>
                ))}
              </div>
            </section>
          )}
          {matches.length > 0 && (
            <section className="rounded-2xl border border-ink-100 bg-white p-6 shadow-soft">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-mint-600" />
                <h2 className="text-xl font-black">پیشنهادهای مرتبط</h2>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {matches.slice(0, 4).map((match) => (
                  <Link
                    key={match.id}
                    href={`/kindness-wall/${match.target_listing.slug}`}
                    className="rounded-xl border border-ink-100 p-4 hover:border-brand-200"
                  >
                    <strong className="block text-sm">
                      {match.target_listing.title}
                    </strong>
                    <span className="mt-2 block text-xs text-ink-400">
                      تطبیق {formatPersianNumber(match.score)}٪
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
        <aside className="h-fit space-y-4">
          <section
            id="listing-actions"
            className="scroll-mt-28 rounded-2xl border border-ink-100 bg-white p-5 shadow-soft"
          >
            <h2 className="mb-4 text-sm font-black">اقدام امن</h2>
            <KindnessActions
              slug={listing.slug}
              contactAvailable={listing.contact_available}
            />
          </section>
          <div className="grid grid-cols-2 gap-3">
            <MiniMetric
              icon={<UserRound />}
              label="بازدید"
              value={formatPersianNumber(listing.view_count)}
            />
            <MiniMetric
              icon={<HeartHandshake />}
              label="نوع"
              value={isNeed ? "نیاز" : "کمک"}
            />
          </div>
          <p className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-xs font-bold leading-7 text-amber-900">
            پیش از هرگونه همکاری، از صحت اطلاعات اطمینان پیدا کنید و اطلاعات
            حساس را خارج از مسیرهای امن به اشتراک نگذارید.
          </p>
        </aside>
      </div>
    </main>
  );
}

function MiniMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-soft">
      <span className="text-brand-700 [&>svg]:h-5 [&>svg]:w-5">{icon}</span>
      <span className="mt-3 block text-[11px] text-ink-400">{label}</span>
      <strong className="mt-1 block text-sm">{value}</strong>
    </div>
  );
}
