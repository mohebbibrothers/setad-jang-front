import Link from 'next/link';
import { notFound } from 'next/navigation';
import { safeApiFetch } from '@/lib/api';

type TabyinAttachment = {
  id?: number;
  url: string;
  media_type?: 'image' | 'video' | 'audio' | 'other';
  media_type_display?: string;
  duration?: number;
  title?: string;
};

type TabyinContent = {
  external_id: string;
  title?: string;
  description?: string;
  author_username?: string;
  source_created_at?: string;
  source_url?: string;
  primary_media_type?: 'image' | 'video' | 'audio' | 'other';
  attachments?: TabyinAttachment[];
};

function videoThumb(url?: string): string | undefined {
  if (!url) return undefined;
  return url.replace('/org/uploads/', '/thumbnail/uploads/').replace(/\.[a-z0-9]+$/i, '.gif');
}

export const revalidate = 180;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await safeApiFetch<TabyinContent>('/tabyin/contents/' + encodeURIComponent(slug) + '/', { revalidate: 180, tags: ['tabyin'] });
  return {
    title: item?.title ? item.title + ' | جهاد تبیین' : 'جهاد تبیین',
    description: item?.description || 'محتوای جهاد تبیین',
  };
}

export default async function TabyinDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await safeApiFetch<TabyinContent>('/tabyin/contents/' + encodeURIComponent(slug) + '/', { revalidate: 180, tags: ['tabyin'] });
  if (!item) notFound();

  const attachments = item.attachments ?? [];
  const firstVideo = attachments.find((a) => a.media_type === 'video' && a.url);
  const firstImage = attachments.find((a) => a.media_type === 'image' && a.url);
  const hero = firstVideo || firstImage || attachments[0];

  return (
    <main className="bg-white">
      <section className="container-edge py-10 md:py-14">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link href="/#tabyin" className="btn-outline btn-sm">بازگشت به خانه</Link>
          <Link href="/tabyin" className="btn-outline btn-sm">آرشیو تبیین</Link>
        </div>
        <article className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-black/5 bg-white shadow-[0_20px_70px_-45px_rgba(0,0,0,.35)]">
          <div className="bg-ink-950">
            {hero?.media_type === 'video' && hero.url ? (
              <video src={hero.url} poster={videoThumb(hero.url)} controls playsInline preload="metadata" className="mx-auto max-h-[72vh] w-full bg-black object-contain" />
            ) : hero?.media_type === 'image' && hero.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={hero.url} alt={item.title || 'محتوای تبیین'} className="mx-auto max-h-[72vh] w-full object-contain" />
            ) : (
              <div className="flex min-h-[280px] items-center justify-center bg-gradient-to-br from-brand-600 to-brand-900 text-white"><span className="text-2xl font-black">جهاد تبیین</span></div>
            )}
          </div>
          <div className="p-5 md:p-8">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-brand-700">
              <span className="rounded-full bg-brand-50 px-3 py-1">جهاد تبیین</span>
              {item.primary_media_type && <span className="rounded-full bg-mint-50 px-3 py-1">{item.primary_media_type}</span>}
              {item.author_username && <span className="rounded-full bg-ink-50 px-3 py-1">{item.author_username}</span>}
            </div>
            <h1 className="mt-5 text-2xl font-black leading-10 text-ink-900 md:text-4xl md:leading-[1.5]">{item.title || 'بدون عنوان'}</h1>
            {item.description && <p className="mt-5 whitespace-pre-line text-[15px] leading-9 text-ink-700">{item.description}</p>}
            {attachments.length > 1 && (
              <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {attachments.map((att, index) => (
                  <a key={(att.id ?? index) + '-' + att.url} href={att.url} target="_blank" rel="noreferrer" className="rounded-2xl border border-black/5 p-3 text-sm font-bold text-ink-700 hover:bg-ink-50">پیوست {index + 1} — {att.media_type_display || att.media_type || 'فایل'}</a>
                ))}
              </div>
            )}
            {item.source_url && <div className="mt-8"><a href={item.source_url} target="_blank" rel="noreferrer" className="btn-primary btn-md">مشاهده در محتوانگار</a></div>}
          </div>
        </article>
      </section>
    </main>
  );
}
