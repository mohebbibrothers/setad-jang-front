import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  FileText,
  MapPin,
  Phone,
  Scale,
  ShieldAlert,
  Trophy,
} from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { safeApiFetch } from "@/lib/api";
import { absoluteMediaUrl, formatPersianNumber } from "@/lib/utils";

type R4JPhoto = {
  id: number;
  image: string;
  caption?: string;
  is_primary?: boolean;
  order?: number;
};
type R4JDetail = {
  id: number;
  slug: string;
  first_name: string;
  last_name: string;
  birth_date?: string | null;
  gender?: string | null;
  country?: string | null;
  province?: string | null;
  city?: string | null;
  description?: string | null;
  crimes_summary?: string | null;
  other_info?: string | null;
  photos?: R4JPhoto[];
  aliases?: Array<{ id: number; alias: string }>;
  phones?: Array<{ id: number; label?: string; number: string }>;
  socials?: Array<{ id: number; platform: string; handle_or_url: string }>;
  attachments?: Array<{
    id: number;
    title: string;
    file: string;
    kind?: string;
    description?: string;
  }>;
  total_bounty_toman: number;
  bounties_count: number;
  published_at?: string | null;
};

async function loadCriminal(slug: string) {
  return safeApiFetch<R4JDetail>(
    `/r4j/criminals/${encodeURIComponent(slug)}/`,
    {
      revalidate: 300,
      tags: ["r4j", `criminal:${slug}`],
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
  const item = await loadCriminal(slug);
  const name = item
    ? `${item.first_name} ${item.last_name}`.trim()
    : "پرونده عدالت";
  return {
    title: `${name} — جایزه‌ای برای عدالت`,
    description:
      item?.crimes_summary ||
      item?.description ||
      `پرونده عمومی ${name} در بعثت مردم`,
    alternates: { canonical: `/r4j/${encodeURIComponent(slug)}` },
  };
}

export default async function R4JDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await loadCriminal(slug);
  if (!item) notFound();

  const fullName = `${item.first_name} ${item.last_name}`.trim();
  const photos = (item.photos || [])
    .slice()
    .sort(
      (a, b) =>
        Number(Boolean(b.is_primary)) - Number(Boolean(a.is_primary)) ||
        (a.order || 0) - (b.order || 0),
    );
  const primaryPhoto = absoluteMediaUrl(photos[0]?.image);
  const location = [item.city, item.province, item.country]
    .filter(Boolean)
    .join("، ");

  return (
    <main className="bg-ink-50 pb-16">
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-800 to-brand-600 py-10 text-white md:py-16">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-20 bg-grid-pattern"
        />
        <div className="container-edge relative">
          <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/#justice"
              className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-extrabold backdrop-blur hover:bg-white/20"
            >
              بازگشت به پرونده‌ها
            </Link>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-extrabold">
              <Scale className="h-4 w-4" /> جایزه‌ای برای عدالت
            </span>
          </div>

          <div className="grid items-center gap-8 md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
            <div className="relative mx-auto aspect-[4/5] w-full max-w-[280px] overflow-hidden rounded-[2rem] border border-white/20 bg-white/10 shadow-2xl">
              <SmartImage
                src={primaryPhoto}
                alt={fullName}
                variant="criminal"
                fill
                priority
                sizes="(max-width:768px) 75vw, 280px"
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-sm font-extrabold text-mint-100">
                پرونده عمومی
              </p>
              <h1 className="mt-3 text-3xl font-black leading-[1.5] text-white md:text-5xl">
                {fullName}
              </h1>
              {location && (
                <p className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-white/75">
                  <MapPin className="h-4 w-4" /> {location}
                </p>
              )}
              <div className="mt-7 flex flex-wrap gap-3">
                <Stat
                  icon={<Trophy />}
                  label="مجموع جوایز"
                  value={`${formatPersianNumber(item.total_bounty_toman || 0)} تومان`}
                />
                <Stat
                  icon={<ShieldAlert />}
                  label="تعداد تعهد"
                  value={formatPersianNumber(item.bounties_count || 0)}
                />
              </div>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href={`/r4j/${item.slug}/report`}
                  className="btn bg-white text-brand-800 btn-md hover:bg-brand-50"
                >
                  <FileText className="h-4 w-4" /> ارسال اطلاعات تکمیلی
                </Link>
                <Link
                  href={`/r4j/${item.slug}/bounty`}
                  className="btn bg-accent-500 text-white btn-md hover:bg-accent-600"
                >
                  <Trophy className="h-4 w-4" /> ثبت تعهد جایزه
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container-edge mt-8 grid gap-6 lg:grid-cols-[1fr_310px]">
        <div className="space-y-6">
          <ContentCard title="شرح پرونده">
            {item.description || "توضیح عمومی برای این پرونده ثبت نشده است."}
          </ContentCard>
          <ContentCard title="خلاصه موارد مطرح‌شده">
            {item.crimes_summary || "خلاصه‌ای ثبت نشده است."}
          </ContentCard>
          {item.other_info && (
            <ContentCard title="اطلاعات تکمیلی">{item.other_info}</ContentCard>
          )}

          {photos.length > 1 && (
            <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft">
              <h2 className="text-lg font-black">گالری تصاویر</h2>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {photos.map((photo) => (
                  <a
                    key={photo.id}
                    href={absoluteMediaUrl(photo.image)}
                    target="_blank"
                    rel="noreferrer"
                    className="relative aspect-square overflow-hidden rounded-xl bg-ink-100"
                  >
                    <SmartImage
                      src={absoluteMediaUrl(photo.image)}
                      alt={photo.caption || fullName}
                      variant="criminal"
                      fill
                      sizes="(max-width:640px) 50vw, 220px"
                      className="object-cover transition hover:scale-105"
                    />
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-5">
          <InfoCard title="مشخصات عمومی">
            {item.birth_date && (
              <InfoRow
                label="تاریخ تولد"
                value={new Date(item.birth_date).toLocaleDateString("fa-IR")}
              />
            )}
            {location && <InfoRow label="موقعیت" value={location} />}
            {item.aliases?.length ? (
              <InfoRow
                label="نام‌های دیگر"
                value={item.aliases.map((alias) => alias.alias).join("، ")}
              />
            ) : null}
          </InfoCard>

          {item.phones?.length ? (
            <InfoCard title="راه‌های ارتباطی عمومی">
              {item.phones.map((phone) => (
                <InfoRow
                  key={phone.id}
                  label={phone.label || "تلفن"}
                  value={phone.number}
                  icon={<Phone />}
                />
              ))}
            </InfoCard>
          ) : null}

          {item.attachments?.length ? (
            <InfoCard title="اسناد عمومی">
              {item.attachments.map((attachment) => (
                <a
                  key={attachment.id}
                  href={absoluteMediaUrl(attachment.file)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-lg bg-ink-50 p-3 text-xs font-extrabold text-brand-700 hover:bg-brand-50"
                >
                  <FileText className="h-4 w-4" /> {attachment.title}
                </a>
              ))}
            </InfoCard>
          ) : null}

          <p className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-xs font-bold leading-7 text-amber-900">
            اطلاعات این صفحه بر اساس داده‌های عمومیِ تأییدشده برای نمایش منتشر
            می‌شود. اطلاعات ارسالی کاربران پیش از انتشار بررسی خواهد شد.
          </p>
        </aside>
      </div>
    </main>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-40 items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
      <span className="[&>svg]:h-5 [&>svg]:w-5">{icon}</span>
      <div>
        <span className="block text-[11px] font-bold text-white/60">
          {label}
        </span>
        <strong className="mt-1 block text-sm text-white">{value}</strong>
      </div>
    </div>
  );
}

function ContentCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft sm:p-7">
      <h2 className="text-lg font-black text-ink-900">{title}</h2>
      <p className="mt-4 whitespace-pre-line text-sm font-medium leading-9 text-ink-700">
        {children}
      </p>
    </section>
  );
}

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft">
      <h2 className="mb-4 text-sm font-black text-ink-900">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function InfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-ink-50 pb-3 last:border-0 last:pb-0">
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-400">
        {icon}
        {label}
      </span>
      <span className="text-left text-xs font-extrabold leading-6 text-ink-700">
        {value}
      </span>
    </div>
  );
}
