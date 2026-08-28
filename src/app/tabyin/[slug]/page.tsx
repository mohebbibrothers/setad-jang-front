import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  ArrowRight,
  AudioLines,
  CalendarDays,
  Captions,
  Image as ImageIcon,
  PenLine,
  Send,
  Sparkles,
  UserRound,
  Video as VideoIcon,
} from 'lucide-react';
import { safeApiFetch } from '@/lib/api';
import { formatJalaliDate } from '@/lib/persian-time';
import {
  contentKindFa,
  contentKindTagFa,
  formatClockFa,
  formatFileSizeFa,
  resolveContentKind,
  videoThumbnailGifUrl,
} from '@/lib/media-meta';
import { cn, formatPersianNumber } from '@/lib/utils';
import { asText, normalizeTabyinAttachments } from '@/lib/tabyin-attachments';
import { TabyinStage, type TabyinStageAttachment } from '@/components/tabyin/TabyinStage';

/**
 * ═══════════════════════════════════════════════════════════════════
 * tabyin/[slug] — صفحه‌ی جزئیاتِ محتوای جهاد تبیین
 *
 * اصولِ طراحی (قراردادِ کارفرما):
 *   ۱) هر آنچه در دیتابیس داریم نمایش داده می‌شود: عنوان، کپشن،
 *      پدیدآورنده، نوع رسانه، تاریخ انتشار، مدت، ابعاد، حجم، تعداد
 *      رسانه و منشأ (مردمی/همگام‌شده) — در یک «برگه‌ی مشخصات»ی تمیز.
 *   ۲) تجربه‌ی رسانه مبتنی بر نوع است (سینما/گالری/پادکست/نقل‌قول) —
 *      در TabyinStage.
 *   ۳) هیچ لینک/دکمه‌ای به سایتِ منبع (محتوانگار) رندر نمی‌شود:
 *      کاربر به آن دسترسی ندارد. فیلد source_url حتی به لایه‌ی UI
 *      نگاشت نمی‌شود.
 * ═══════════════════════════════════════════════════════════════════
 */

type TabyinContent = {
  external_id: string;
  title?: string;
  description?: string;
  author_username?: string;
  origin?: 'external' | 'user_submitted';
  source_created_at?: string;
  primary_media_type?: 'image' | 'video' | 'audio' | 'other';
  attachments?: TabyinStageAttachment[];
};

export const revalidate = 180;

async function fetchContent(slug: string) {
  return safeApiFetch<TabyinContent>('/tabyin/contents/' + encodeURIComponent(slug) + '/', {
    revalidate: 180,
    tags: ['tabyin'],
  });
}

/* قهرمانِ مشترکِ تجربه (قراردادِ کارفرما): صوت > ویدئو > تصویر —
   همان اولویتی که استیج برای انتخابِ اولیه دارد، تا تگ/مشخصات و
   استیج هیچ‌وقت ناسازگار نشوند. heroMedia/ogImage روی لیستِ
   «نرمالایزشده» کار می‌کنند — هرگز روی payload خامِ API. */
function heroMedia(list: TabyinStageAttachment[]): TabyinStageAttachment | undefined {
  return (
    list.find((a) => a.media_type === 'audio' && a.url) ||
    list.find((a) => a.media_type === 'video' && a.url) ||
    list.find((a) => a.media_type === 'image' && a.url) ||
    list.find((a) => a.url)
  );
}

function ogImage(list: TabyinStageAttachment[]): string | undefined {
  const img = list.find((a) => a.media_type === 'image' && a.url)?.url;
  if (img) return img;
  const vid = list.find((a) => a.media_type === 'video' && a.url)?.url;
  return videoThumbnailGifUrl(vid);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = await fetchContent(slug);
  const safeTitle = asText(item?.title);
  const title = safeTitle ? `${safeTitle} | جهاد تبیین` : 'جهاد تبیین | بعثت مردم';
  const description = asText(item?.description).slice(0, 160) || 'محتوای جهاد تبیین — بعثت مردم';
  const image = item ? ogImage(normalizeTabyinAttachments(item.attachments)) : undefined;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

/* ── داده‌ی ساخت‌یافته (SEO) — بدون هیچ اشاره‌ای به سایتِ منبع ── */
function buildJsonLd(item: TabyinContent, hero: TabyinStageAttachment | undefined) {
  const author = asText(item.author_username);
  const base = {
    '@context': 'https://schema.org',
    name: asText(item.title) || 'محتوای جهاد تبیین',
    description: asText(item.description) || undefined,
    datePublished: asText(item.source_created_at) || undefined,
    author: author ? { '@type': 'Person', name: author } : undefined,
  };
  if (hero?.media_type === 'video') {
    return {
      ...base,
      '@type': 'VideoObject',
      contentUrl: hero.url,
      thumbnailUrl: videoThumbnailGifUrl(hero.url),
    };
  }
  if (hero?.media_type === 'audio') {
    return { ...base, '@type': 'AudioObject', contentUrl: hero.url };
  }
  if (hero?.media_type === 'image') {
    return { ...base, '@type': 'ImageObject', contentUrl: hero.url };
  }
  return { ...base, '@type': 'Article' };
}

export default async function TabyinDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await fetchContent(slug);
  if (!item) notFound();

  /* عادی‌سازیِ دفاعی: ورودیِ API هر شکلی داشته باشد، از اینجا به بعد
     فقط پیوست‌های تمیز و type-safe به لایه‌ی UI می‌رسند. */
  const attachments = normalizeTabyinAttachments(item.attachments);
  const hero = heroMedia(attachments);
  const isUser = item.origin === 'user_submitted';
  const title = asText(item.title).trim() || 'محتوای جهاد تبیین';
  const authorName = asText(item.author_username).trim();
  const caption = asText(item.description);
  const publishDate = formatJalaliDate(asText(item.source_created_at) || undefined);
  /* نوعِ مؤثر (قراردادِ کارفرما): فقط از روی سندِ واقعی، با اولویتِ
     «صوت همیشه می‌برد» — پادکستی که کاورِ ویدئویی هم دارد، صوت می‌ماند.
     دو برچسبِ مجزا: تگِ بیضیِ سربرگ (ویدئو/تصویر/صوت/متن) و نوعِ
     محتوا در برگه‌ی مشخصات (فیلم/عکس/پادکست/نوشته). */
  const kind = resolveContentKind(attachments.map((a) => a.media_type));
  const typeTag = contentKindTagFa(kind);
  const typeLabel = contentKindFa(kind);
  const KindGlyph =
    kind === 'image'
      ? ImageIcon
      : kind === 'video'
        ? VideoIcon
        : kind === 'audio'
          ? AudioLines
          : PenLine;

  /* برگه‌ی مشخصات — فقط ردیف‌های دارای مقدار رندر می‌شوند.
     قراردادِ کارفرما: ردیفِ «منشأ» در هیچ اسلاگی نمایش داده نمی‌شود
     (هویتِ مردمی‌بودن همان چیپِ «محتوای مردمی» در سربرگ است). */
  const specRows: { label: string; value: string }[] = [
    authorName ? { label: 'پدیدآورنده', value: authorName } : null,
    { label: 'نوع محتوا', value: typeLabel },
    publishDate ? { label: 'تاریخ انتشار', value: publishDate } : null,
    formatClockFa(hero?.duration) ? { label: 'مدت', value: formatClockFa(hero?.duration)! } : null,
    formatFileSizeFa(hero?.file_size)
      ? { label: 'حجم فایل', value: formatFileSizeFa(hero?.file_size)! }
      : null,
    attachments.length
      ? { label: 'تعداد رسانه', value: `${formatPersianNumber(attachments.length)} رسانه` }
      : null,
  ].filter((r): r is { label: string; value: string } => Boolean(r));

  const jsonLd = JSON.stringify(buildJsonLd(item, hero)).replace(/</g, '\\u003c');

  return (
    <main className="bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <section className="container-edge py-8 md:py-12">
        {/* ── راهنمای بالای صفحه ── */}
        <div className="mx-auto mb-6 flex max-w-4xl items-center justify-between gap-3">
          <Link
            href="/tabyin"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-ink-200 bg-white px-4 text-[13px] font-extrabold text-ink-700 transition-all hover:border-brand-500/50 hover:bg-brand-50/60 hover:text-brand-700"
          >
            <ArrowRight className="h-4 w-4" />
            بازگشت به آرشیو
          </Link>
          <Link
            href="/#tabyin"
            className="hidden text-[12.5px] font-bold text-ink-400 transition-colors hover:text-brand-700 sm:block"
          >
            جهاد تبیین در صفحه‌ی اصلی
          </Link>
        </div>

        <article className="mx-auto max-w-4xl">
          {/* ── چیپ‌ها + عنوان + متا ── */}
          <header>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-brand-50 px-3.5 text-[12.5px] font-extrabold text-brand-700 ring-1 ring-inset ring-brand-600/10">
                <KindGlyph className="h-3.5 w-3.5" />
                {typeTag}
              </span>
              {isUser ? (
                <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-mint-500/15 px-3.5 text-[12.5px] font-extrabold text-mint-700 ring-1 ring-inset ring-mint-500/25">
                  <Sparkles className="h-3.5 w-3.5" />
                  محتوای مردمی
                </span>
              ) : null}
              <span className="inline-flex h-8 items-center rounded-full bg-ink-50 px-3.5 text-[12.5px] font-bold text-ink-500">
                جهاد تبیین
              </span>
            </div>
            <h1 className="mt-4 text-[23px] font-black leading-[1.8] text-ink-900 sm:text-[27px] md:text-[32px] md:leading-[1.8]">
              {title}
            </h1>
            <div className="mt-3.5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] font-semibold text-ink-500">
              {authorName ? (
                <span className="inline-flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500/15 text-brand-700">
                    <UserRound className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-ink-700">{authorName}</span>
                  <span className="text-ink-400">پدیدآورنده</span>
                </span>
              ) : null}
              {publishDate ? (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-brand-600" />
                  {publishDate}
                </span>
              ) : null}
            </div>
          </header>

          {/* ── استیجِ رسانه ── */}
          <div className="mt-7">
            {attachments.length > 0 ? (
              <TabyinStage attachments={attachments} title={title} originLabel="جهاد تبیین" />
            ) : (
              /* محتوای بدون رسانه: پنلِ نقل‌قولِ برند (خوانشِ متن‌محور) */
              <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 p-8 text-white shadow-[0_30px_70px_-30px_rgba(13,128,116,.6)] sm:p-10">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -left-16 -top-24 h-64 w-64 rounded-full bg-white/10 blur-2xl"
                />
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                  className="relative h-9 w-9 text-white/50"
                >
                  <path d="M7.17 6C4.31 6 2 8.31 2 11.17v6.66h6.66v-6.66H5c0-1.84 1.49-3.33 3.33-3.33V6H7.17zm10 0c-2.86 0-5.17 2.31-5.17 5.17v6.66h6.66v-6.66H15c0-1.84 1.49-3.33 3.33-3.33V6h-1.16z" />
                </svg>
                {caption ? (
                  <p className="relative mt-5 whitespace-pre-line text-[16px] font-bold leading-8 text-white/95 md:text-[18px] md:leading-9">
                    {caption}
                  </p>
                ) : (
                  <p className="relative mt-5 text-[16px] font-bold text-white/90">جهاد تبیین</p>
                )}
              </div>
            )}
          </div>

          {/* ── کپشن (وقتی متن‌محور نیست یا متن اضافه‌ای دارد) ── */}
          {caption && attachments.length > 0 ? (
            <section className="mt-8 rounded-[24px] border border-ink-100 bg-gradient-to-l from-brand-50/50 via-white to-white p-6 ring-1 ring-black/[0.03] sm:p-8">
              <h2 className="flex items-center gap-2 text-[15px] font-extrabold text-ink-900">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500/15 text-brand-700">
                  <Captions className="h-4 w-4" />
                </span>
                کپشن
              </h2>
              <p className="mt-4 whitespace-pre-line text-[15px] leading-9 text-ink-700">
                {caption}
              </p>
            </section>
          ) : null}

          {/* ── برگه‌ی مشخصات: هرچه در دیتابیس داریم ── */}
          <section className="mt-6 overflow-hidden rounded-[24px] border border-ink-100 bg-white ring-1 ring-black/[0.03]">
            <h2 className="border-b border-ink-100 bg-ink-50/60 px-6 py-4 text-[13.5px] font-extrabold text-ink-800 sm:px-8">
              مشخصات محتوا
            </h2>
            <dl className="grid sm:grid-cols-2">
              {specRows.map((row, i) => {
                const isLast = i === specRows.length - 1;
                /* ردیفِ یتیمِ چیدمانِ دوستونه (وقتی تعداد ردیف‌ها فرد است):
                   تمام‌عرض و وسط‌چین می‌شود تا اصلاً «تکه‌ی خالی» شکل
                   نگیرد — باگِ گزارش‌شده‌ی کارفرما. */
                const isOrphanLast = isLast && specRows.length % 2 === 1;
                /* خطوطِ جداکننده، ریسپانسیو-آگاه:
                   موبایل (یک‌ستونه): هر ردیف جز آخری خطِ زیر دارد؛
                   دسکتاپ (دوستونه): جفتِ ردیفِ آخر بدون خطِ زیر است و
                   سلولِ ستونِ راست (اندیسِ زوج در چیدمانِ RTL) خطِ چپ دارد. */
                const isSecondLastOfEvenPair =
                  specRows.length % 2 === 0 && i === specRows.length - 2;
                return (
                  <div
                    key={row.label}
                    className={cn(
                      'flex items-center justify-between gap-4 px-6 py-3.5 sm:px-8',
                      !isLast && 'border-b border-ink-100/80',
                      isSecondLastOfEvenPair && 'sm:border-b-0',
                      i % 2 === 0 && !isOrphanLast && 'sm:border-l sm:border-ink-100',
                      isOrphanLast && 'sm:col-span-2 sm:justify-center sm:gap-8',
                    )}
                  >
                    <dt className="text-[12.5px] font-bold text-ink-400">{row.label}</dt>
                    <dd className="truncate text-[13px] font-extrabold text-ink-800">
                      {row.value}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>

          {/* ── مسیرهای بعدی ── */}
          <nav
            aria-label="مسیرهای بعدی"
            className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center"
          >
            <Link
              href="/tabyin"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border-2 border-brand-500 bg-white px-7 text-[14px] font-extrabold text-brand-700 transition-colors hover:bg-brand-50"
            >
              آرشیو جهاد تبیین
            </Link>
            <Link
              href="/tabyin/new"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-mint-500 px-7 text-[14px] font-extrabold text-white shadow-[0_8px_24px_-8px_rgba(37,197,186,.5)] transition-all hover:scale-[1.02] hover:bg-mint-600 active:scale-[.98]"
            >
              <Send className="h-4 w-4" />
              ارسال محتوا
            </Link>
          </nav>
        </article>
      </section>
    </main>
  );
}
