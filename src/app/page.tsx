import type { Metadata } from 'next';
import Script from 'next/script';
import { Hero } from '@/components/home/Hero';
import { ActivitiesPanel } from '@/components/home/ActivitiesPanel';
import { WarFundSection } from '@/components/home/WarFundSection';
import { JusticeSection } from '@/components/home/JusticeSection';
import { EducationSection } from '@/components/home/EducationSection';
import { KindnessSection } from '@/components/home/KindnessSection';
import { TabyinSection } from '@/components/home/TabyinSection';
import { PublicReportSection } from '@/components/home/PublicReportSection';
import {
  loadCampaigns,
  loadCriminals,
  loadCourses,
  loadLmsCategories,
  loadKindnessListings,
  loadTabyinItems,
  loadTabyinCounts,
  loadReportSubjects,
} from '@/lib/home-data';
import { siteConfig } from '@/lib/site';

/**
 * Homepage metadata — carefully tuned for the brand-query «بعثت».
 *
 *   • `title` starts with «بعثت» so it's the leftmost token in the SERP
 *     entry — Google weights leading tokens heaviest, and the tab title
 *     shows it clearly to returning users too.
 *   • `description` is 155 chars, opens with «بعثت مردم» so the SERP
 *     snippet BOLDs the query word.
 *   • `alternates.canonical` = '/' → collapses tracking-param dupes
 *     (?utm_source=..., ?fbclid=...) into one indexed URL.
 *   • OpenGraph is repeated with page-specific overrides so Facebook /
 *     Telegram / WhatsApp / X show a rich preview linking to '/' (not
 *     the root of `metadataBase` — which some crawlers mis-resolve).
 */
export const metadata: Metadata = {
  title: `بعثت | ${siteConfig.name} — ${siteConfig.slogan}`,
  description: siteConfig.description,
  alternates: {
    canonical: '/',
    languages: { 'fa-IR': '/', 'x-default': '/' },
  },
  openGraph: {
    type: 'website',
    url: '/',
    locale: siteConfig.locale,
    siteName: siteConfig.name,
    title: `بعثت | ${siteConfig.name} — ${siteConfig.slogan}`,
    description: siteConfig.description,
    images: [
      {
        url: siteConfig.ogImage,
        secureUrl: `${siteConfig.url}${siteConfig.ogImage}`,
        width: 1200,
        height: 630,
        alt: siteConfig.ogImageAlt,
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `بعثت | ${siteConfig.name}`,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
  },
};

// SSR with backend revalidation every 5 minutes
export const revalidate = 300;

/**
 * Homepage-scoped JSON-LD: ItemList that enumerates the six pillars of
 * the platform (Public Reports, War Fund, Justice/R4J, Education,
 * Kindness Wall, Tabyin) as ONE typed collection. Google uses ItemList
 * to build carousel-style rich results and sitelinks under the brand
 * SERP.
 *
 * Each item is a proper `WebPage` reference — even though the current
 * milestone only ships in-page anchors (not standalone routes). Once
 * the sub-pages ship, replace the anchor `#warfund` → `/madadkar`
 * etc. and Google will follow.
 */
function buildHomeItemList() {
  const base = siteConfig.url;
  const pillars = [
    { name: 'گزارش‌های مردمی',           href: '/#reports',   pos: 1,
      description: 'ارسال گزارش‌های مردمی به بعثت مردم برای پیگیری موضوعات اجتماعی و ملی.' },
    { name: 'ستاد جنگ اقتصادی و رسانه‌ای', href: '/#warfund',   pos: 2,
      description: 'کمپین‌های مالی و رسانه‌ای مردمی در چارچوب جهاد تبیین.' },
    { name: 'مجازات مجرمان جهانی (R4J)',  href: '/#justice',   pos: 3,
      description: 'حمایت مردمی از پرونده‌های مجازات مجرمان بین‌المللی.' },
    { name: 'مدرسه جهادی',                href: '/#education', pos: 4,
      description: 'آموزش‌های تخصصی و جهادی برای فعالان فرهنگی و رسانه‌ای.' },
    { name: 'دیوار مهربانی',              href: '/#kindness',  pos: 5,
      description: 'اتصال داوطلبانه نیازمندان و کمک‌کنندگان در سراسر کشور.' },
    { name: 'جهاد تبیین',                 href: '/tabyin',     pos: 6,
      description: 'محتوای رسانه‌ای مردمی برای تبیین حقایق روز.' },
  ];

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${base}/#pillars`,
    name: 'حوزه‌های فعالیت بعثت مردم',
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    numberOfItems: pillars.length,
    itemListElement: pillars.map((p) => ({
      '@type': 'ListItem',
      position: p.pos,
      url: `${base}${p.href}`,
      name: p.name,
      description: p.description,
    })),
  };
}

export default async function HomePage() {
  const [
    campaigns, criminals, lmsCategories, courses,
    kindness, tabyin, tabyinCounts, reportSubjects,
  ] = await Promise.all([
    loadCampaigns(),
    loadCriminals(),
    loadLmsCategories(),
    loadCourses(),
    loadKindnessListings(),
    loadTabyinItems(),
    loadTabyinCounts(),
    loadReportSubjects(),
  ]);

  const itemListLd = buildHomeItemList();

  return (
    <>
      {/*
        Page-scoped JSON-LD. Rendered with `beforeInteractive` so the
        graph is present in the initial HTML — critical for Googlebot
        which does NOT execute JS-injected scripts as reliably.
      */}
      <Script
        id="ld-json-home-itemlist"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
      />

      {/*
        Invisible SEO H1. The visible hero uses a photograph (not text),
        so we need at least one semantic H1 to establish the page topic
        for crawlers. `sr-only` keeps it accessible to screen readers
        AND indexers while remaining invisible to sighted users.
      */}
      <h1 className="sr-only">
        بعثت مردم — سامانه مردمی جهاد تبیین، مددکاری، آموزش و همبستگی
      </h1>

      <Hero />
      <ActivitiesPanel />
      <WarFundSection campaigns={campaigns} />
      <JusticeSection criminals={criminals} />
      <EducationSection categories={lmsCategories} courses={courses} />
      <KindnessSection listings={kindness} />
      <TabyinSection items={tabyin} counts={tabyinCounts} />
      <PublicReportSection subjects={reportSubjects} />
    </>
  );
}
