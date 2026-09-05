import type { Metadata } from 'next';
import {
  BadgeCheck,
  ChevronLeft,
  HandHeart,
  HeartHandshake,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Timer,
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
            <h1 className="mt-5 text-3xl font-black leading-tight text-white md:text-5xl">
              کنارِ هر دستِ خالی،
              <span className="from-mint-300 block bg-gradient-to-l to-mint-500 bg-clip-text text-transparent">
                صدها دستِ یاری‌رسان
              </span>
            </h1>
            <p className="mt-4 max-w-2xl text-[14px] leading-8 text-white/75 md:text-[15px]">
              هر سهمی که می‌خری، یک قدمِ مستقیم به میدان است: پرداختِ امن از درگاهِ رسمی، رسیدِ
              دیجیتالِ قابلِ استعلام و دفتریِ شفاف که مسیرِ هر تومان را نشانت می‌دهد.
            </p>
            {/* آمارِ زنده */}
            <div className="mt-8 flex flex-wrap items-stretch gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-sm">
                <div className="text-mint-300 text-2xl font-black tabular-nums md:text-3xl">
                  {formatPersianNumber(activeCount)}
                </div>
                <div className="mt-1 text-[12px] font-bold text-white/70">
                  حرکتِ در حال جمع‌آوری
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-sm">
                <div className="text-mint-300 text-2xl font-black tabular-nums md:text-3xl">
                  {totalRaised > 0 ? `${formatPersianNumber(totalRaised)} تومان` : '—'}
                </div>
                <div className="mt-1 text-[12px] font-bold text-white/70">
                  تأمین‌شده تا این لحظه
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-sm">
                <div className="text-mint-300 text-2xl font-black tabular-nums md:text-3xl">
                  {formatPersianNumber(totalParticipants)}
                </div>
                <div className="mt-1 text-[12px] font-bold text-white/70">مشارکتِ ثبت‌شده</div>
              </div>
            </div>
            <div className="mt-8">
              <a
                href="#campaigns"
                className="text-ink-950 shadow-mint-900/40 inline-flex items-center gap-2 rounded-2xl bg-mint-500 px-6 py-3.5 text-[14px] font-extrabold shadow-lg transition-all hover:bg-mint-400 active:scale-[.98]"
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

      {/* ══════════ نوارِ مددکاران ══════════ */}
      {sponsors.length > 0 && (
        <section className="border-y border-ink-100 bg-ink-50/50 py-10">
          <div className="container-edge">
            <p className="mb-5 flex items-center gap-2 text-[12px] font-extrabold text-ink-500">
              <BadgeCheck className="h-4 w-4 text-mint-600" aria-hidden="true" />
              مددکارانِ رسمیِ مجموعه — حامیِ هر حرکت، یک نامِ مسئول
            </p>
            <div className="flex flex-wrap items-center gap-2.5">
              {sponsors.map((sp) => {
                const logo = absoluteMediaUrl(sp.logo);
                return (
                  <span
                    key={sp.id}
                    className="inline-flex items-center gap-2 rounded-full border border-ink-100 bg-white py-1.5 pl-4 pr-1.5 shadow-[0_2px_8px_-4px_rgba(15,20,32,.08)]"
                  >
                    <SponsorLogo src={logo} />
                    <span className="text-[12.5px] font-extrabold text-ink-800">{sp.name}</span>
                  </span>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ══════════ نوارِ اعتماد ══════════ */}
      <section className="section-y">
        <div className="container-edge grid gap-3 sm:grid-cols-3">
          {[
            {
              icon: ShieldCheck,
              tone: 'text-brand-600 bg-brand-500/10',
              title: 'پرداختِ امن',
              text: 'تراکنش‌ها فقط روی صفحهٔ رسمیِ درگاه ثبت می‌شوند؛ اطلاعاتِ کارت هرگز به ما نمی‌رسد.',
            },
            {
              icon: Timer,
              tone: 'text-amber-600 bg-amber-500/10',
              title: 'رزروِ منصفِ ۱۵ دقیقه‌ای',
              text: 'سهم شما تا پایانِ پرداخت محفوظ است؛ اگر پرداخت نشود خودکار و بی‌هزینه آزاد می‌گردد.',
            },
            {
              icon: ReceiptText,
              tone: 'text-mint-700 bg-mint-500/10',
              title: 'رسیدِ قابلِ استعلام',
              text: 'هر پرداختِ موفق رسیدِ دیجیتالِ رمزنگاری‌شده دارد که هویتش عموماً قابلِ بررسی است.',
            },
          ].map((t) => (
            <div
              key={t.title}
              className="rounded-3xl border border-ink-100 bg-white p-5 shadow-[0_2px_10px_-6px_rgba(15,20,32,.06)]"
            >
              <span
                className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${t.tone}`}
              >
                <t.icon className="h-[22px] w-[22px]" aria-hidden="true" />
              </span>
              <p className="mt-3 text-[14.5px] font-extrabold text-ink-900">{t.title}</p>
              <p className="mt-1.5 text-[12px] leading-7 text-ink-500">{t.text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
