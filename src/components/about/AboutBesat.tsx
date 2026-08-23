import Link from 'next/link';
import { siteConfig } from '@/lib/site';

/**
 * AboutBesat — the "درباره بعثت" editorial + FAQ block, promoted to a
 * dedicated route at `/about-besat`.
 *
 *  HISTORY
 *  ───────
 *  This component originally lived at the bottom of the homepage as a
 *  keyword-rich SEO section. The client asked to keep the homepage
 *  pristine, so the block was extracted into its own standalone page.
 *  That's actually the schema-correct home for an AboutPage / FAQPage
 *  rich-result markup anyway — Google prefers editorial content at a
 *  discoverable URL with a real title, not stuffed onto the root.
 *
 *  WHAT IT DELIVERS
 *  ────────────────
 *   • Editorial prose introducing the brand «بعثت مردم».
 *   • Bold-marked brand tokens («بعثت», «بعثت مردم», besat.me) —
 *     hitting a natural keyword density (~1.5 %) without stuffing.
 *   • Internal-linking grid to every domain area (crawler follow-through).
 *   • 6-question FAQ block that unlocks the FAQPage rich accordion in
 *     the SERP.
 *   • FAQPage + AboutPage + Article JSON-LD graph, cross-linked to the
 *     root #organization / #website entities from RootLayout.
 *
 *  VISUAL DESIGN
 *  ─────────────
 *  Reads as premium editorial content — column-widths capped for
 *  readability, brand-tinted rules for hierarchy, subtle mint tint on
 *  the FAQ card. Zero animations — crawlers need static text.
 */

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: 'بعثت مردم چیست؟',
    a: 'بعثت مردم یک سامانه‌ی مردمی و غیرانتفاعی به آدرس besat.me است که شش حوزه‌ی کلیدی جهاد تبیین، مددکاری، آموزش جهادی، دیوار مهربانی، پشتیبانی مالی جبهه و پیگیری مجازات مجرمان جهانی را در یک پلتفرم واحد و شفاف کنار هم آورده است.',
  },
  {
    q: 'چطور می‌توانم در بعثت مردم مشارکت کنم؟',
    a: 'مشارکت در بعثت بسیار ساده است — می‌توانید یک گزارش مردمی ثبت کنید، در کمپین‌های پشتیبانی مالی جبهه شریک شوید، در دیوار مهربانی به هم‌وطنانتان یاری برسانید، در دوره‌های قرارگاه آموزشی ثبت‌نام کنید، یا در جهاد تبیین محتوای رسانه‌ای منتشر کنید. همه‌ی این‌ها از طریق همین سایت besat.me در دسترس است.',
  },
  {
    q: 'آیا بعثت مردم یک نهاد دولتی است؟',
    a: 'خیر. بعثت یک ابتکار کاملاً مردمی و غیرانتفاعی است که به‌دست فعالان فرهنگی، رسانه‌ای و جهادی راه‌اندازی شده و همه‌ی فعالیت‌های آن با شفافیت مالی کامل روی سایت besat.me گزارش می‌شود.',
  },
  {
    q: 'گزارش‌های مردمی در بعثت چگونه پیگیری می‌شوند؟',
    a: 'هر گزارشی که از طریق فرم «گزارش‌های مردمی» در سایت بعثت ثبت شود، به دبیرخانه‌ی تخصصی مربوطه ارجاع می‌شود و روند بررسی آن در همان پرونده برای گزارش‌دهنده قابل رهگیری خواهد بود.',
  },
  {
    q: 'جهاد تبیین در بعثت مردم چه معنایی دارد؟',
    a: 'جهاد تبیین در بعثت به معنای تولید و انتشار محتوای رسانه‌ای مردمی برای روشنگری در برابر جنگ روایت‌ها و روایت‌سازی رسانه‌های معاند علیه ملت ایران است. بخش تبیین سایت بعثت میزبان تصاویر، ویدئوها و متون تحلیلی است که کاربران در قالب آن‌ها به این جهاد فرهنگی می‌پیوندند.',
  },
  {
    q: 'دیوار مهربانی بعثت چگونه کار می‌کند؟',
    a: 'دیوار مهربانی بعثت یک بستر دو-سویه است که در آن نیازمندان و کمک‌کنندگان به‌صورت داوطلبانه و بدون واسطه به یکدیگر متصل می‌شوند. هر آگهی شامل نوع نیاز، محل جغرافیایی و اطلاعات تماس مالک آگهی است و همه‌ی این‌ها روی سایت بعثت به آدرس besat.me در دسترس عموم قرار دارد.',
  },
];

export function AboutBesat() {
  return (
    <section
      id="about-besat"
      aria-labelledby="about-besat-title"
      className="relative bg-white pb-16 pt-14 md:pb-24 md:pt-20"
    >
      <div className="container-edge mx-auto max-w-4xl">
        {/* ── Editorial header ─────────────────────────────────────── */}
        <div className="mb-10 text-center md:mb-14">
          <span className="mb-4 inline-block rounded-full bg-brand-50 px-3 py-1 text-[11.5px] font-bold tracking-wide text-brand-700">
            درباره بعثت
          </span>
          <h2
            id="about-besat-title"
            className="text-2xl font-extrabold leading-tight text-ink-900 md:text-[32px]"
          >
            <strong>بعثت مردم</strong> — سامانه‌ی یکپارچه‌ی جهاد تبیین و همبستگی
          </h2>
          <span
            aria-hidden="true"
            className="mx-auto mt-4 block h-[3px] w-14 rounded-full bg-gradient-to-l from-brand-500 to-mint-500"
          />
        </div>

        {/* ── Body copy ────────────────────────────────────────────── */}
        <div className="prose prose-lg max-w-none space-y-6 text-justify text-[15.5px] leading-9 text-ink-700 md:text-[16.5px]">
          <p>
            <strong>بعثت مردم</strong> یک سامانه‌ی مردمی، غیرانتفاعی و کاملاً شفاف است که به نشانی{' '}
            <Link href="https://besat.me" className="font-bold text-brand-700 hover:underline">
              besat.me
            </Link>{' '}
            راه‌اندازی شده تا مردم ایران را در شش حوزه‌ی راهبردی به یکدیگر متصل کند: جهاد تبیین،
            مددکاری، آموزش جهادی، دیوار مهربانی، پشتیبانی مالی جبهه، و پیگیری پرونده‌های مجازات
            مجرمان جهانی. هدف <strong>بعثت</strong> ساختن یک بستر واحد است که در آن هر شهروند بتواند
            بدون واسطه، در نبردهای فرهنگی، اجتماعی و انسانی روزگار خودش نقش داشته باشد.
          </p>

          <p>
            آنچه <strong>بعثت مردم</strong> را از سایر سکوهای مشابه متمایز می‌کند، تلفیق شش خدمت
            کلیدی در یک تجربه‌ی کاربری واحد است. کاربر با یک بار ورود به سایت <strong>بعثت</strong>{' '}
            می‌تواند گزارش مردمی خود را ثبت کند، در یک کمپین پشتیبانی مالی جبهه شریک شود، در
            دوره‌های قرارگاه آموزشی نام‌نویسی کند، در دیوار مهربانی به هم‌وطن نیازمندش کمک برساند،
            محتوای جهاد تبیین منتشر کند و پرونده‌های مجرمان بین‌المللی را دنبال نماید — همه در یک
            نشانی: besat.me.
          </p>

          {/* ── Pillars grid — internal-linking gold ─────────────── */}
          <h3 className="mb-4 mt-10 text-xl font-extrabold text-ink-900">
            حوزه‌های فعالیت <strong>بعثت مردم</strong>
          </h3>

          <ul className="not-prose grid list-none grid-cols-1 gap-x-8 gap-y-3 pl-0 md:grid-cols-2">
            {[
              {
                href: '/#reports',
                label: 'گزارش‌های مردمی بعثت',
                desc: 'ثبت و پیگیری شفاف گزارش‌های شهروندی',
              },
              {
                href: '/#warfund',
                label: 'پشتیبانی مالی جبهه',
                desc: 'کمپین‌های مالی جهاد اقتصادی و رسانه‌ای',
              },
              {
                href: '/#justice',
                label: 'جایزه‌ای برای عدالت (R4J)',
                desc: 'پیگیری پرونده‌های مجرمان جهانی',
              },
              { href: '/#education', label: 'قرارگاه آموزشی بعثت', desc: 'دوره‌های تخصصی و جهادی' },
              {
                href: '/#kindness',
                label: 'دیوار مهربانی',
                desc: 'اتصال داوطلبانه نیازمندان و کمک‌کنندگان',
              },
              { href: '/tabyin', label: 'جهاد تبیین', desc: 'انتشار محتوای رسانه‌ای مردمی' },
            ].map((p) => (
              <li key={p.href} className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                <div>
                  <Link
                    href={p.href}
                    className="font-bold text-ink-900 transition-colors hover:text-brand-700"
                  >
                    {p.label}
                  </Link>
                  <p className="mt-0.5 text-sm leading-6 text-ink-500">{p.desc}</p>
                </div>
              </li>
            ))}
          </ul>

          <h3 className="mb-4 mt-10 text-xl font-extrabold text-ink-900">
            چرا <strong>بعثت</strong>؟
          </h3>
          <p>
            نام <strong>بعثت</strong> برای این سامانه انتخابی نمادین است: بعثت یادآور آغاز یک حرکت
            بزرگ مردمی است که با تکیه بر ایمان، آگاهی و همبستگی، توانست مسیر یک تمدن را دگرگون کند.{' '}
            <strong>بعثت مردم</strong> نیز با همین روحیه، تلاش می‌کند بستر یک حرکت مدنی نوین را برای
            نسل امروز ایران فراهم آورد؛ حرکتی که در آن مردم عادی — نه ساختارهای بوروکراتیک — هستند
            که کارها را پیش می‌برند، پرونده‌ها را باز می‌کنند، گزارش‌ها را ثبت می‌کنند و دست
            هم‌وطنشان را می‌گیرند.
          </p>
        </div>

        {/* ── FAQ card ─────────────────────────────────────────────── */}
        <div className="mt-14 md:mt-20">
          <div className="mb-8 text-center">
            <h3 className="text-xl font-extrabold text-ink-900 md:text-2xl">
              پرسش‌های پرتکرار درباره <strong>بعثت مردم</strong>
            </h3>
            <span
              aria-hidden="true"
              className="mx-auto mt-3 block h-[3px] w-10 rounded-full bg-gradient-to-l from-brand-500 to-mint-500"
            />
          </div>

          <div className="overflow-hidden rounded-2xl border border-brand-100/70 bg-gradient-to-br from-brand-50/60 to-mint-50/40">
            {FAQ_ITEMS.map((item, i) => (
              <details
                key={i}
                className="group border-b border-brand-100/60 last:border-b-0"
                {...(i === 0 ? { open: true } : {})}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[14.5px] font-bold text-ink-900 transition-colors hover:bg-white/60 md:px-7 md:py-5 md:text-[15.5px]">
                  <span className="flex items-start gap-3">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                    {item.q}
                  </span>
                  <span
                    aria-hidden="true"
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-brand-200 bg-white text-[13px] font-black text-brand-700 transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <div className="px-5 pb-5 pt-1 text-[14px] leading-8 text-ink-600 md:px-7 md:pb-6 md:text-[14.5px]">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>

      {/*
        FAQPage + AboutPage + Article JSON-LD — three schemas fused into
        one graph. Google uses FAQPage for the rich accordion snippet in
        the SERP, AboutPage to strengthen entity-topic association, and
        Article to signal editorial content (larger snippet + author byline).
      */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'FAQPage',
                '@id': `${siteConfig.url}/about-besat#faq`,
                url: `${siteConfig.url}/about-besat`,
                inLanguage: 'fa-IR',
                isPartOf: { '@id': `${siteConfig.url}#website` },
                about: { '@id': `${siteConfig.url}#organization` },
                mainEntity: FAQ_ITEMS.map((f) => ({
                  '@type': 'Question',
                  name: f.q,
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: f.a,
                  },
                })),
              },
              {
                '@type': 'AboutPage',
                '@id': `${siteConfig.url}/about-besat#aboutpage`,
                url: `${siteConfig.url}/about-besat`,
                name: 'درباره بعثت مردم',
                inLanguage: 'fa-IR',
                isPartOf: { '@id': `${siteConfig.url}#website` },
                mainEntity: { '@id': `${siteConfig.url}#organization` },
                about: { '@id': `${siteConfig.url}#organization` },
                primaryImageOfPage: { '@id': `${siteConfig.url}#logo` },
                breadcrumb: { '@id': `${siteConfig.url}/about-besat#breadcrumbs` },
              },
              {
                '@type': 'BreadcrumbList',
                '@id': `${siteConfig.url}/about-besat#breadcrumbs`,
                itemListElement: [
                  { '@type': 'ListItem', position: 1, name: 'خانه', item: siteConfig.url },
                  {
                    '@type': 'ListItem',
                    position: 2,
                    name: 'درباره بعثت',
                    item: `${siteConfig.url}/about-besat`,
                  },
                ],
              },
              {
                '@type': 'Article',
                '@id': `${siteConfig.url}/about-besat#brand-article`,
                headline: 'بعثت مردم — سامانه یکپارچه جهاد تبیین و همبستگی',
                description:
                  'بعثت مردم یک سامانه مردمی و غیرانتفاعی است که شش حوزه جهاد تبیین، مددکاری، آموزش، دیوار مهربانی، پشتیبانی مالی جبهه و پیگیری پرونده‌های مجرمان جهانی را در یک پلتفرم واحد کنار هم آورده است.',
                inLanguage: 'fa-IR',
                articleSection: [
                  'جهاد تبیین',
                  'مددکاری',
                  'دیوار مهربانی',
                  'آموزش جهادی',
                  'گزارش‌های مردمی',
                ],
                keywords: 'بعثت, بعثت مردم, besat, besat.me, جهاد تبیین, دیوار مهربانی',
                author: { '@id': `${siteConfig.url}#organization` },
                publisher: { '@id': `${siteConfig.url}#organization` },
                mainEntityOfPage: { '@id': `${siteConfig.url}/about-besat#aboutpage` },
                image: `${siteConfig.url}${siteConfig.ogImage}`,
                datePublished: '2025-01-01T00:00:00+03:30',
                dateModified: new Date().toISOString(),
              },
            ],
          }),
        }}
      />
    </section>
  );
}
