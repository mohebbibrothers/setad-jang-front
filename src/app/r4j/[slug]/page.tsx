import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  AlertTriangle,
  CalendarDays,
  Download,
  FileText,
  Fingerprint,
  Flag,
  Info,
  Lock,
  MapPin,
  Phone,
  ShieldAlert,
  StickyNote,
  Trophy,
  UserRound,
} from 'lucide-react';
import { siteConfig } from '@/lib/site';
import {
  ATTACHMENT_KIND_META,
  GENDER_LABELS,
  bountyFa,
  criminalFullName,
  fetchCriminalDetail,
  fetchCriminalsPage,
  isFullyRedacted,
  jalaliDateFa,
  locationLine,
  mediaSrc,
  normalizeGallery,
  socialMeta,
  socialUrl,
  type CriminalListItem,
} from '@/lib/r4j';
import { SmartImage } from '@/components/ui/SmartImage';
import { absoluteMediaUrl, toPersianDigits } from '@/lib/utils';
import { CasefileGallery } from './CasefileGallery';
import { JusticeActionBar, ShareCaseButton } from './JusticeActionBar';

/**
 * ═══════════════════════════════════════════════════════════════════
 * r4j/[slug] — پرونده‌ی عمومیِ یک مجرم («Casefile»)
 *
 * اصولِ طراحی:
 *   ۱) همه‌ی قراردادِ R4JPublicCriminalDetailSerializer مصرف می‌شود:
 *      هویت (با احترام به visibility map)، گالری+کپشن، نام‌های مستعار،
 *      شماره‌های منتسب، شبکه‌های اجتماعیِ admin-curated (target=_blank
 *      rel=nofollow)، اسنادِ عمومی (دانلود از /media)، شمارنده‌ی جایزه.
 *   ۲) محتوا کاملاً SSR است (SEO + اشتراک‌گذاری) — لایه‌ی کلاینت فقط
 *      گالری، نوارِ عملیاتِ موبایل و دکمه‌ی اشتراک است.
 *   ۳) فیلدِ null یعنی «در این پرونده منتشر نمی‌شود» → رندر نمی‌شود
 *      (نه «—» و نه کلیدِ خالی). پرونده‌ی کاملاً محدود → اطلاعیه‌ی
 *      محرمانگی با مسیرِ مشارکت.
 *   ۴) JSON-LDِ Person + OG تصویر برای قدرتِ اشتراک/جستجو.
 * ═══════════════════════════════════════════════════════════════════
 */

export const revalidate = 180;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const d = await fetchCriminalDetail(slug);
  if (!d) return { title: 'پرونده یافت نشد' };
  const name = criminalFullName(d) || d.slug;
  const bounty =
    d.total_bounty_toman > 0
      ? `جایزهٔ فعلی: ${bountyFa(d.total_bounty_toman)}`
      : 'هنوز جایزه‌ای ثبت نشده است';
  const loc = locationLine(d);
  const photo = d.photos.find((p) => p.is_primary) ?? d.photos[0];
  const image = photo ? absoluteMediaUrl(photo.image) : undefined;
  const title = `${name} — پروندهٔ جایزه‌ای برای عدالت`;
  const description = `پروندهٔ عمومیِ ${name}؛ ${bounty}${loc ? `؛ محلِ اعلام‌شده: ${loc}` : ''}. با ثبت تعهد یا ارسال سرنخ، در اجرای عدالت سهیم شوید.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      images: image ? [{ url: image }] : undefined,
    },
  };
}

/* ────────────────────────────────────────────────────────────
 * بلوک‌های کوچکِ سرور-رندر
 * ──────────────────────────────────────────────────────────── */

function SectionCard({
  id,
  title,
  icon: Icon,
  tone = 'default',
  children,
}: {
  id: string;
  title: string;
  icon: typeof FileText;
  tone?: 'default' | 'crimes';
  children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby={`h-${id}`}
      className={
        tone === 'crimes'
          ? 'rounded-3xl border border-rose-200 bg-rose-50/60 p-5 md:p-6'
          : 'rounded-3xl border border-ink-100 bg-white p-5 shadow-[0_1px_2px_rgba(15,20,32,.04)] md:p-6'
      }
    >
      <h2
        id={`h-${id}`}
        className={`flex items-center gap-2 text-[15px] font-extrabold ${
          tone === 'crimes' ? 'text-rose-800' : 'text-ink-900'
        }`}
      >
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-xl ${
            tone === 'crimes' ? 'bg-rose-500/15 text-rose-600' : 'bg-brand-500/10 text-brand-600'
          }`}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function FactRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof FileText;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-ink-50/70 px-4 py-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
      <div className="min-w-0">
        <dt className="text-[11px] font-bold text-ink-400">{label}</dt>
        <dd className="mt-0.5 break-words text-[13px] font-extrabold text-ink-800">{children}</dd>
      </div>
    </div>
  );
}

function RelatedCard({ c }: { c: CriminalListItem }) {
  const name = criminalFullName(c) || c.slug;
  return (
    <Link
      href={`/r4j/${encodeURIComponent(c.slug)}`}
      className="group relative block overflow-hidden rounded-2xl border border-ink-100 bg-white transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-14px_rgba(15,20,32,.3)]"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-ink-100">
        <SmartImage
          src={mediaSrc(c.primary_photo?.image) ?? null}
          alt={name}
          variant="criminal"
          fill
          sizes="(min-width:1024px) 25vw, 50vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink-900/85 to-transparent"
        />
        <div className="absolute inset-x-0 bottom-0 p-3 text-white">
          <h3 dir="auto" className="truncate text-[13px] font-extrabold text-white">
            {name}
          </h3>
          <p className="mt-0.5 text-[11px] font-bold text-accent-300">
            {c.total_bounty_toman > 0 ? bountyFa(c.total_bounty_toman) : 'بدون جایزهٔ فعال'}
          </p>
        </div>
      </div>
    </Link>
  );
}

export default async function CriminalCasefilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const d = await fetchCriminalDetail(slug);
  if (!d) notFound();

  const name = criminalFullName(d) || d.slug;
  const loc = locationLine(d);
  const gallery = normalizeGallery(d.photos);
  const publishedFa = jalaliDateFa(d.published_at);
  const birthFa = jalaliDateFa(d.birth_date);
  const redacted = isFullyRedacted(d);
  const pageUrl = `${siteConfig.url.replace(/\/+$/, '')}/r4j/${encodeURIComponent(d.slug)}`;

  // پرونده‌های مرتبط: همان شهر (ترجیحاً) یا همان استان، بدون خودِ پرونده
  const relatedScope = d.city ? { city: d.city } : d.province ? { province: d.province } : null;
  const relatedPage = relatedScope
    ? await fetchCriminalsPage({ ...relatedScope, pageSize: 5, ordering: '-total_bounty_toman' })
    : null;
  const related = (relatedPage?.results ?? []).filter((c) => c.id !== d.id).slice(0, 4);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    givenName: d.first_name || undefined,
    familyName: d.last_name || undefined,
    alternateName: d.aliases.length ? d.aliases.map((a) => a.alias) : undefined,
    birthDate: d.birth_date ?? undefined,
    gender: d.gender === 'male' ? 'Male' : d.gender === 'female' ? 'Female' : undefined,
    nationality: d.country ?? undefined,
    image: gallery.length ? gallery.map((g) => g.src) : undefined,
    url: pageUrl,
  };

  return (
    <main className="pb-24 lg:pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ══════════ سربرگِ پرونده ══════════ */}
      <header className="relative overflow-hidden bg-ink-900 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(-45deg, rgba(255,255,255,.03) 0 2px, transparent 2px 14px)',
          }}
        />
        <div className="container-edge relative py-8 md:py-12">
          {/* مسیرِ راهنما + اشتراک */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <nav aria-label="مسیر صفحه" className="text-[12px] font-bold text-white/60">
              <ol className="flex items-center gap-1.5">
                <li>
                  <Link href="/r4j" className="transition-colors hover:text-white">
                    جایزه‌ای برای عدالت
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li className="text-white/90" aria-current="page">
                  پروندهٔ {name}
                </li>
              </ol>
            </nav>
            <ShareCaseButton name={name} />
          </div>

          <div className="mt-8 flex flex-wrap items-start justify-between gap-6">
            <div className="min-w-0 max-w-2xl">
              <span className="inline-block rotate-[-1.5deg] rounded-lg border-2 border-accent-300/80 px-3 py-1 text-[11px] font-black tracking-[0.2em] text-accent-200">
                پروندهٔ عمومی
              </span>
              <h1
                dir="auto"
                className="mt-4 break-words text-3xl font-black leading-tight text-white md:text-5xl"
              >
                {name}
              </h1>
              {d.aliases.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold text-white/50">نام‌های مستعار:</span>
                  {d.aliases.map((a) => (
                    <span
                      key={a.id}
                      dir="auto"
                      className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[12px] font-bold text-white/80"
                    >
                      {a.alias}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] font-bold text-white/65">
                {loc && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-accent-300" aria-hidden="true" />
                    {loc}
                  </span>
                )}
                {publishedFa && (
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4" aria-hidden="true" />
                    انتشار: {publishedFa}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Fingerprint className="h-4 w-4" aria-hidden="true" />
                  شناسهٔ پرونده: {/* dir=auto تا اسلاگ‌های فارسی هم راست‌به‌چپ خوانا بمانند */}
                  <bdi dir="auto" className="font-mono text-white/50">
                    {d.slug}
                  </bdi>
                </span>
              </div>
            </div>

            {/* پانلِ جایزه */}
            <div className="w-full max-w-sm shrink-0 rounded-3xl border border-accent-400/30 bg-gradient-to-b from-accent-500/15 to-transparent p-5 backdrop-blur-sm md:w-auto">
              <p className="text-[11px] font-bold text-accent-200/90">
                جایزهٔ فعلی برای این پرونده
              </p>
              <p className="mt-1.5 text-2xl font-black tabular-nums text-accent-300 md:text-[32px] md:leading-tight">
                {d.total_bounty_toman > 0 ? bountyFa(d.total_bounty_toman) : 'بدون جایزهٔ فعال'}
              </p>
              <p className="mt-1 text-[11px] font-bold text-white/55">
                {d.bounties_count > 0
                  ? `${toPersianDigits(d.bounties_count)} نفر تا این‌جا تعهد کرده‌اند`
                  : 'نخستین تعهد را شما ثبت کنید'}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Link
                  href={`/r4j/${encodeURIComponent(d.slug)}/bounty`}
                  className="flex items-center justify-center gap-1.5 rounded-2xl bg-accent-500 px-3 py-2.5 text-[12px] font-extrabold text-white shadow-md shadow-accent-900/30 transition-all hover:bg-accent-400 active:scale-[.98]"
                >
                  <Trophy className="h-4 w-4" aria-hidden="true" />
                  افزایش جایزه
                </Link>
                <Link
                  href={`/r4j/${encodeURIComponent(d.slug)}/report`}
                  className="flex items-center justify-center gap-1.5 rounded-2xl border border-white/20 bg-white/10 px-3 py-2.5 text-[12px] font-extrabold text-white transition-colors hover:bg-white/20"
                >
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  گزارش اطلاعات
                </Link>
              </div>
              <p className="mt-3 text-[10.5px] leading-5 text-white/45">
                جایزه‌ها تعهدِ اعلامیِ مردمی‌اند؛ هر زمان قابل ویرایش یا درخواست لغو است.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ══════════ بدنهٔ پرونده ══════════ */}
      <div className="container-edge mt-8 grid gap-8 lg:grid-cols-12">
        {/* گالری */}
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-24">
            <CasefileGallery items={gallery} name={name} location={loc} />
          </div>
        </div>

        {/* محتوا */}
        <div className="flex min-w-0 flex-col gap-5 lg:col-span-7">
          {/* برگهٔ مشخصات — visibility-aware */}
          <SectionCard id="identity" title="برگهٔ مشخصات" icon={UserRound}>
            {redacted ? (
              <div className="flex items-start gap-3 rounded-2xl border border-ink-200 bg-white p-4">
                <Lock className="mt-0.5 h-5 w-5 shrink-0 text-ink-400" aria-hidden="true" />
                <p className="text-[12.5px] leading-7 text-ink-600">
                  جزئیاتِ هویتیِ این پرونده در حال حاضر در وضعیتِ محدودیتِ انتشار قرار دارد. اگر
                  اطلاعات موثقی در اختیار دارید، از مسیرِ «گزارش اطلاعات» در تکمیلِ پرونده سهیم
                  شوید؛ هر گزارش پیش از انتشار، بررسی می‌شود.
                </p>
              </div>
            ) : (
              <dl className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {d.national_code && (
                  <FactRow icon={Fingerprint} label="کد ملی">
                    <bdi dir="ltr" className="font-mono tracking-wider">
                      {d.national_code}
                    </bdi>
                  </FactRow>
                )}
                {birthFa && (
                  <FactRow icon={CalendarDays} label="تاریخ تولد">
                    {birthFa}
                  </FactRow>
                )}
                {d.gender && GENDER_LABELS[d.gender] && (
                  <FactRow icon={UserRound} label="جنسیت">
                    {GENDER_LABELS[d.gender]}
                  </FactRow>
                )}
                {d.country && (
                  <FactRow icon={Flag} label="کشور">
                    {d.country}
                  </FactRow>
                )}
                {d.province && (
                  <FactRow icon={MapPin} label="استان">
                    {d.province}
                  </FactRow>
                )}
                {d.city && (
                  <FactRow icon={MapPin} label="شهر">
                    {d.city}
                  </FactRow>
                )}
              </dl>
            )}
            {!redacted &&
              !d.national_code &&
              !birthFa &&
              !d.gender &&
              !d.country &&
              !d.province &&
              !d.city && (
                <p className="text-[12.5px] text-ink-400">
                  مشخصاتِ تکمیلی برای این پرونده منتشر نشده است.
                </p>
              )}
          </SectionCard>

          {/* خلاصهٔ جرائم */}
          {d.crimes_summary && (
            <SectionCard
              id="crimes"
              title="خلاصهٔ جرائم اعلام‌شده"
              icon={ShieldAlert}
              tone="crimes"
            >
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="mt-1 h-4 w-4 shrink-0 text-rose-500" aria-hidden="true" />
                <p className="whitespace-pre-line text-[13.5px] leading-8 text-rose-950/90">
                  {d.crimes_summary}
                </p>
              </div>
            </SectionCard>
          )}

          {/* شرح پرونده */}
          {d.description && (
            <SectionCard id="description" title="شرح پرونده" icon={FileText}>
              <p className="whitespace-pre-line text-[13.5px] leading-8 text-ink-700">
                {d.description}
              </p>
            </SectionCard>
          )}

          {/* سایر اطلاعات */}
          {d.other_info && (
            <SectionCard id="other" title="سایر اطلاعات" icon={Info}>
              <p className="whitespace-pre-line text-[13px] leading-8 text-ink-600">
                {d.other_info}
              </p>
            </SectionCard>
          )}

          {/* راه‌های ارتباط منتسب */}
          {(d.phones.length > 0 || d.socials.length > 0) && (
            <SectionCard id="contacts" title="راه‌های ارتباطِ منتسب" icon={Phone}>
              {d.phones.length > 0 && (
                <div>
                  <h3 className="text-[12px] font-extrabold text-ink-500">شماره‌های ثبت‌شده</h3>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {d.phones.map((p) => (
                      <li
                        key={p.id}
                        className="flex items-center gap-2 rounded-full border border-ink-100 bg-ink-50/70 px-3.5 py-2 text-[12px]"
                      >
                        <Phone className="h-3.5 w-3.5 text-ink-400" aria-hidden="true" />
                        {p.label && <span className="font-bold text-ink-400">{p.label}:</span>}
                        <bdi dir="ltr" className="font-mono font-extrabold text-ink-800">
                          {p.number}
                        </bdi>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {d.socials.length > 0 && (
                <div className={d.phones.length > 0 ? 'mt-5' : ''}>
                  <h3 className="text-[12px] font-extrabold text-ink-500">
                    حساب‌های منتسب در شبکه‌های اجتماعی
                  </h3>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {d.socials.map((s) => {
                      const meta = socialMeta(s.platform);
                      return (
                        <li key={s.id}>
                          <a
                            href={socialUrl(s.platform, s.handle_or_url)}
                            target="_blank"
                            rel="nofollow noopener noreferrer"
                            className="group flex items-center gap-2 rounded-full border border-ink-100 bg-white px-3 py-2 text-[12px] transition-colors hover:border-ink-300"
                          >
                            <span
                              aria-hidden="true"
                              className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black ${meta.bubble}`}
                            >
                              {meta.glyph}
                            </span>
                            <span className="font-bold text-ink-500">{meta.label}</span>
                            <bdi
                              dir="auto"
                              className="max-w-[10rem] truncate font-mono font-extrabold text-ink-800 group-hover:underline"
                            >
                              {s.handle_or_url}
                            </bdi>
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="mt-3 text-[10.5px] leading-5 text-ink-400">
                    این نشانی‌ها حساب‌های منتسب به فردِ پرونده هستند که توسط سردبیر منتشر شده‌اند؛
                    محتوای آن‌ها متعلق به بعثت مردم نیست.
                  </p>
                </div>
              )}
            </SectionCard>
          )}

          {/* اسناد و مدارک */}
          {d.attachments.length > 0 && (
            <SectionCard id="docs" title="اسناد و مدارکِ عمومی" icon={StickyNote}>
              <ul className="grid gap-2.5 sm:grid-cols-2">
                {d.attachments.map((a) => {
                  const kind = ATTACHMENT_KIND_META[a.kind] ?? ATTACHMENT_KIND_META.other;
                  const href = absoluteMediaUrl(a.file);
                  return (
                    <li
                      key={a.id}
                      className="flex items-start gap-3 rounded-2xl border border-ink-100 bg-ink-50/50 p-4"
                    >
                      <span
                        aria-hidden="true"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-lg shadow-sm"
                      >
                        {kind.glyph}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="truncate text-[13px] font-extrabold text-ink-900">
                            {a.title}
                          </h3>
                          {href && (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              download
                              aria-label={`دریافت ${a.title}`}
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-brand-600 transition-colors hover:bg-brand-500/20"
                            >
                              <Download className="h-4 w-4" aria-hidden="true" />
                            </a>
                          )}
                        </div>
                        <p className="mt-0.5 text-[11px] font-bold text-ink-400">{kind.label}</p>
                        {a.description && (
                          <p className="mt-1 text-[12px] leading-6 text-ink-500">{a.description}</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </SectionCard>
          )}
        </div>
      </div>

      {/* ══════════ پرونده‌های مرتبط ══════════ */}
      {related.length > 0 && (
        <section aria-labelledby="h-related" className="container-edge mt-12">
          <div className="flex items-center justify-between">
            <h2 id="h-related" className="text-[17px] font-black text-ink-900">
              پرونده‌های مرتبط
            </h2>
            <Link
              href="/r4j"
              className="text-[12px] font-extrabold text-brand-600 transition-colors hover:text-brand-700"
            >
              همهٔ پرونده‌ها
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {related.map((c) => (
              <RelatedCard key={c.id} c={c} />
            ))}
          </div>
        </section>
      )}

      {/* نوارِ عملیاتِ موبایل */}
      <JusticeActionBar slug={d.slug} />
    </main>
  );
}
