import type { Metadata } from 'next';
import {
  BadgeCheck,
  ChevronLeft,
  HandHeart,
  HeartHandshake,
  Landmark,
  ReceiptText,
  Scale,
  ShieldCheck,
  Sparkles,
  Timer,
  Users,
} from 'lucide-react';
import { fetchCampaignsList, fetchSponsors } from '@/lib/madadkar';
import { HubGrid } from '@/components/madadkar/HubGrid';
import { SponsorLogo } from '@/components/madadkar/SponsorLogo';
import { EmptyState } from '@/components/home/EmptyState';
import { absoluteMediaUrl, formatPersianNumber } from '@/lib/utils';

/**
 * ═══════════════════════════════════════════════════════════════════
 * madadkar/ — هابِ اپِ «مدد به حرکت»
 *
 *   • SSR کامل + ISR (revalidate=300 روی fetchها) — گرید حرکت‌ها،
 *     آمارِ زندهٔ جمعی و نوارِ مددکاران بدون هیچ فچِ کلاینتی رندر می‌شود.
 *   • گرید کارت‌ها (HubGrid → CampaignCardView) تعاملِ داخلِ خود را
 *     مالک است: دکمهٔ «مدد به حرکت» بلافاصله شیتِ پرداختِ سه‌ایستگاهی
 *     را باز می‌کند — بدونِ ترکِ صفحه.
 *   • کارت‌ها + جزئیات (لینک) هر دو به /madadkar/{slug} می‌رسند.
 * ═══════════════════════════════════════════════════════════════════
 */

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'مدد به حرکت',
  description:
    'حمایتِ مالیِ جمعی از حرکت‌های مردمیِ جنگ؛ سهم بخرید، پرداخت امن از درگاه رسمی انجام دهید و مسیرِ خرجِ هر تومان را در دفتر شفافیت دنبال کنید.',
};

export default async function MadadkarHubPage() {
  const [campaigns, sponsors] = await Promise.all([fetchCampaignsList(), fetchSponsors()]);

  /* آمارِ جمعی از فیلدهای لیست — همان چیزی که کاربر در کارت‌ها می‌بیند */
  const activeCount = campaigns.filter(
    (c) => !c.is_fully_funded && c.status === 'published',
  ).length;
  const fundedCount = campaigns.filter((c) => c.is_fully_funded || c.status === 'completed').length;
  const totalRaised = campaigns.reduce((s, c) => s + (c.purchased_amount ?? 0), 0);
  const totalParticipants = campaigns.reduce((s, c) => s + (c.participant_count ?? 0), 0);

  return (
    <main className="bg-white">
      {/* ══════════ هیرو ══════════ */}
      <section className="relative overflow-hidden bg-ink-900 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.55]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(-45deg, rgba(255,255,255,.035) 0 2px, transparent 2px 14px)',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-mint-500/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-brand-500/15 blur-3xl"
        />
        <div className="container-edge relative py-14 md:py-20">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[12px] font-bold text-white/80 backdrop-blur-sm">
              <HeartHandshake className="h-4 w-4 text-mint-400" aria-hidden="true" />
              اپِ «مدد به حرکت» — پشتیبانیِ مالیِ جمعی
            </p>
            <h1 className="mt-5 text-[28px] font-black leading-[1.35] text-white sm:text-4xl md:text-[46px] md:leading-[1.35]">
              هر سهمِ تو،
              <span className="block bg-gradient-to-l from-mint-200 via-mint-300 to-mint-500 bg-clip-text text-transparent">
                یک پیامِ امید به میدان
              </span>
            </h1>
            <p className="mt-4 max-w-2xl text-[13.5px] leading-8 text-white/75 md:text-[15px]">
              سهم بگیر، از درگاهِ رسمی و امن پرداخت کن، رسیدِ دیجیتالت را لحظه‌ای بگیر — و مسیرِ هر
              تومان را تا رسیدن به میدان، در دفترِ شفافیتِ عمومی دنبال کن.
            </p>
            {/* آمارِ زنده — قراردادِ تایپوگرافیِ یکسان: عددِ بزرگِ منت +
                واحدِ کوچکِ کم‌رنگ‌تر؛ هر سه باکس واحدِ دقیق دارند، نه فقط تومان */}
            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                {
                  value: formatPersianNumber(activeCount),
                  unit: 'حرکت',
                  label: 'در حال جمع‌آوری',
                  icon: Sparkles,
                },
                {
                  /* صداقتِ مالی: حتی وقتی هنوز چیزی تأمین نشده، عددِ صفرِ
                     واقعی را نشان می‌دهیم — خطِ تیره کاربر را به شک می‌اندازد. */
                  value: formatPersianNumber(totalRaised),
                  unit: 'تومان',
                  label: 'تأمین‌شده تا این لحظه',
                  icon: HeartHandshake,
                },
                {
                  value: formatPersianNumber(totalParticipants),
                  unit: 'مشارکت',
                  label: 'ثبت‌شده',
                  icon: Users,
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex items-center gap-3.5 rounded-2xl border border-white/10 bg-white/[.05] px-4 py-4 backdrop-blur-sm sm:flex-col sm:items-start sm:gap-0 sm:px-5"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mint-500/15 text-mint-300 ring-1 ring-mint-500/25 sm:hidden">
                    <s.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-[22px] font-black tabular-nums text-mint-300 md:text-[26px]">
                      {s.value}
                      <span className="ms-1 text-[12.5px] font-extrabold text-mint-200/70 md:text-[14px]">
                        {s.unit}
                      </span>
                    </div>
                    <div className="mt-0.5 text-[12px] font-bold text-white/70 sm:mt-1">
                      {s.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <a
                href="#campaigns"
                className="inline-flex items-center gap-2 rounded-2xl bg-mint-500 px-6 py-3.5 text-[14px] font-extrabold text-ink-950 shadow-lg shadow-mint-900/40 transition-all hover:bg-mint-400 active:scale-[.98]"
              >
                مشاهدهٔ حرکت‌ها
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ چطور کار می‌کند (سه گام) ══════════ */}
      <section className="container-edge relative z-10 -mt-8">
        <div className="grid gap-3 rounded-3xl border border-ink-100 bg-white p-4 shadow-[0_12px_32px_-20px_rgba(15,20,32,.25)] sm:grid-cols-3 md:p-5">
          {[
            {
              icon: HandHeart,
              title: 'حرکت را انتخاب کن',
              text: 'هر حرکت را با جزئیات، آلبوم و دفترِ شفافیتِ مالی بازش کن.',
            },
            {
              icon: ShieldCheck,
              title: 'سهم بگیر و پرداخت کن',
              text: 'سهم‌ها تا ۱۵ دقیقه رزرو می‌شوند؛ پرداختِ امن از درگاهِ رسمی انجام می‌گیرد.',
            },
            {
              icon: ReceiptText,
              title: 'رسید و مسیرِ پول را ببین',
              text: 'رسیدِ دیجیتال صادر می‌شود و دفترِ شفافیت نشان می‌دهد پولت کجا خرج شد.',
            },
          ].map((s) => (
            <div key={s.title} className="flex items-start gap-3 rounded-2xl bg-ink-50/60 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-700">
                <s.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-[13.5px] font-extrabold text-ink-900">{s.title}</p>
                <p className="mt-1 text-[11.5px] leading-6 text-ink-500">{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════ گرید حرکت‌ها ══════════ */}
      <section id="campaigns" className="section-y scroll-mt-20">
        <div className="container-edge">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="inline-flex items-center gap-1.5 text-[12px] font-extrabold text-mint-700">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                حرکت‌های فعال و نتیجه‌گرفته
              </p>
              <h2 className="mt-1 text-[22px] font-black text-ink-900 md:text-[26px]">
                حرکت‌های پشتیبانیِ مالی
              </h2>
              <p className="mt-2 max-w-prose text-[12.5px] leading-7 text-ink-500 md:text-[13px]">
                {fundedCount > 0
                  ? `تا اینجا ${formatPersianNumber(fundedCount)} حرکت به خطِ پایان رسیده؛ باقی حرکت‌ها هنوز به دستِ تو نیاز دارند.`
                  : 'سهمِ هر حرکت را انتخاب کن، پرداختِ امن انجام بده و اثرش را در همان لحظه روی مترِ پیشرفت ببین.'}
              </p>
            </div>
          </div>

          {campaigns.length === 0 ? (
            <EmptyState
              title="هنوز حرکتی منتشر نشده"
              description="به‌محض انتشار اولین حرکت‌های پشتیبانی مالی، اینجا برای مشارکت باز می‌شود."
              iconPath="M18 11V6a2 2 0 0 0-4 0v5 M14 10V4a2 2 0 0 0-4 0v6 M10 10.5V6a2 2 0 0 0-4 0v8 M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-5.7-2.5L1.5 14a2 2 0 0 1 3-2.6L7 13"
            />
          ) : (
            <HubGrid campaigns={campaigns} />
          )}
        </div>
      </section>

      {/* ══════════ سالنِ اعتماد — مددکاران + تضمین‌ها + دعوتِ پایانی ══════════ */}
      <section className="relative overflow-hidden bg-ink-950 pb-16 pt-14 text-white md:pb-20 md:pt-16">
        {/* بافت و هاله‌ها */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(-45deg, rgba(255,255,255,.03) 0 2px, transparent 2px 16px)',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 top-0 h-80 w-80 rounded-full bg-brand-500/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 bottom-10 h-72 w-72 rounded-full bg-mint-500/15 blur-3xl"
        />

        <div className="container-edge relative space-y-12 md:space-y-14">
          {/* تیترِ بخش */}
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[11.5px] font-bold text-white/80 backdrop-blur-sm">
              <Scale className="h-4 w-4 text-mint-400" aria-hidden="true" />
              اعتماد، پیش از هر تومان
            </p>
            <h2 className="mt-4 text-[22px] font-black leading-9 text-white md:text-[28px] md:leading-[1.6]">
              یاریِ تو این‌جا
              <span className="mx-1.5 bg-gradient-to-l from-mint-200 to-mint-400 bg-clip-text text-transparent">
                شفاف، امن و قابلِ استعلام
              </span>
              به میدان می‌رسد
            </h2>
            <p className="mt-3 text-[12.5px] leading-7 text-white/65 md:text-[13.5px] md:leading-8">
              سه قانونِ شکس‌ناپذیرِ این سالن: پولِ تو فقط روی صفحهٔ بانکی ثبت می‌شود، سهمت تا لحظهٔ
              پرداخت محفوظ است، و برای هر تومان یک ردِ دیجیتالِ عمومی هست.
            </p>
          </div>

          {/* تضمین‌های سه‌گانه */}
          <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
            {[
              {
                icon: ShieldCheck,
                ring: 'ring-mint-500/25 bg-mint-500/12 text-mint-300',
                title: 'پرداختِ امن',
                text: 'تراکنش‌ها فقط روی صفحهٔ رسمیِ درگاه ثبت می‌شوند؛ اطلاعاتِ کارت هرگز به ما نمی‌رسد.',
              },
              {
                icon: Timer,
                ring: 'ring-amber-400/25 bg-amber-400/12 text-amber-300',
                title: 'رزروِ منصفِ ۱۵ دقیقه‌ای',
                text: 'سهمت تا پایانِ پرداخت محفوظ است؛ اگر پرداخت تمام نشود، خودکار و بی‌هزینه آزاد می‌شود.',
              },
              {
                icon: ReceiptText,
                ring: 'ring-brand-300/25 bg-brand-400/12 text-brand-200',
                title: 'رسید و دفترِ شفافیت',
                text: 'هر پرداختِ موفق، رسیدِ دیجیتالِ قابلِ استعلام دارد و اثرش در دفترِ شفافیت ثبت می‌شود.',
              },
            ].map((t) => (
              <div
                key={t.title}
                className="group flex items-start gap-3.5 rounded-3xl border border-white/10 bg-white/[.05] p-4 backdrop-blur-sm transition-colors duration-300 hover:border-mint-500/25 hover:bg-white/[.08] sm:block sm:p-5"
              >
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 ${t.ring} transition-transform duration-300 group-hover:scale-105`}
                >
                  <t.icon className="h-[22px] w-[22px]" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-[14.5px] font-extrabold text-white">{t.title}</p>
                  <p className="mt-1.5 text-[11.5px] leading-6 text-white/65 sm:mt-2 sm:text-[12px] sm:leading-7">
                    {t.text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* مددکارانِ رسمی */}
          {sponsors.length > 0 && (
            <div>
              <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <p className="flex items-center gap-2 text-[13px] font-extrabold text-white/85">
                    <Landmark className="h-4 w-4 text-mint-400" aria-hidden="true" />
                    مددکارانِ رسمیِ مجموعه
                  </p>
                  <p className="mt-1.5 text-[11.5px] font-medium leading-6 text-white/55">
                    حامیِ هر حرکت، یک نامِ رسمی و مسئول است؛ نه یک صفحهٔ بی‌نام.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {sponsors.map((sp) => {
                  const logo = absoluteMediaUrl(sp.logo);
                  return (
                    <div
                      key={sp.id}
                      className="flex items-center gap-3.5 rounded-2xl border border-white/10 bg-white/[.05] p-3.5 backdrop-blur-sm transition-colors duration-300 hover:border-mint-500/25 hover:bg-white/[.08] sm:p-4"
                    >
                      <span className="relative flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-white/95 ring-1 ring-white/20">
                        <SponsorLogo src={logo} size="lg" />
                      </span>
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 text-[13.5px] font-extrabold text-white">
                          <span className="truncate">{sp.name}</span>
                          <BadgeCheck
                            className="h-4 w-4 shrink-0 text-mint-400"
                            aria-hidden="true"
                          />
                        </p>
                        <p className="mt-0.5 text-[10.5px] font-bold text-white/55">
                          حامیِ رسمی و مسئولِ حرکت‌ها
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* دعوتِ پایانی */}
          <div className="relative overflow-hidden rounded-[28px] border border-mint-500/25 bg-gradient-to-l from-mint-500/90 via-mint-600 to-brand-700 p-6 shadow-[0_30px_60px_-30px_rgba(13,128,116,.55)] sm:p-8">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-25"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(-45deg, rgba(255,255,255,.12) 0 2px, transparent 2px 14px)',
              }}
            />
            <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-[17px] font-black text-white sm:text-[20px]">
                  دستِ تو هنوز قصه را تمام نکرده
                </p>
                <p className="mt-1.5 max-w-xl text-[12px] font-medium leading-7 text-white/85 sm:text-[13px]">
                  اولین سهم را همین حالا ثبت کن؛ همین امروز صفرِ «تأمین‌شده» با دستِ تو جابه‌جا
                  می‌شود و رسیدت برای همیشه در دفترِ شفافیت می‌ماند.
                </p>
              </div>
              <a
                href="#campaigns"
                className="inline-flex h-12 shrink-0 items-center gap-2 rounded-2xl bg-white px-6 text-[13.5px] font-extrabold text-ink-900 shadow-[0_14px_30px_-12px_rgba(0,0,0,.45)] transition-all hover:bg-mint-50 active:scale-[.98]"
              >
                مشاهدهٔ حرکت‌ها
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
