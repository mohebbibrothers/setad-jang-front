import Link from 'next/link';
import { safeApiFetch, type Paginated } from '@/lib/api';

type TabyinAttachment = {
  id?: number;
  url: string;
  media_type?: 'image' | 'video' | 'audio' | 'other';
  duration?: number;
  title?: string;
};

type TabyinContent = {
  external_id: string;
  title?: string;
  description?: string;
  author_username?: string;
  source_created_at?: string;
  primary_media_type?: 'image' | 'video' | 'audio' | 'other';
  attachments?: TabyinAttachment[];
};

function thumbnailUrl(url?: string, isVideo = false): string | undefined {
  if (!url) return undefined;
  if (isVideo) return url.replace('/org/uploads/', '/thumbnail/uploads/').replace(/\.[a-z0-9]+$/i, '.gif');
  return url;
}

export const metadata = { title: 'جهاد تبیین', description: 'آرشیو محتوای جهاد تبیین' };
export const revalidate = 180;

export default async function TabyinIndexPage() {
  const data = await safeApiFetch<Paginated<TabyinContent>>(
    '/tabyin/contents/?page_size=24&ordering=-source_created_at',
    { revalidate: 180, tags: ['tabyin'] },
  );
  const items = data?.results ?? [];

  return (
    <main className="bg-white">
      <section className="container-edge py-12 md:py-16">
        <div className="max-w-3xl">
          <p className="text-sm font-extrabold text-brand-700">جهاد تبیین</p>
          <h1 className="mt-3 text-2xl md:text-4xl font-black text-ink-900">آرشیو روایت‌ها</h1>
          <p className="mt-4 text-ink-600 leading-8">روایت‌های تصویری، ویدئویی و متنی گردآوری‌شده از محتوانگار.</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const first = item.attachments?.[0];
            const isVideo = first?.media_type === 'video';
            const thumb = thumbnailUrl(first?.url, isVideo);
            return (
              <Link key={item.external_id} href={'/tabyin/' + item.external_id} className="group block overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                <div className="relative aspect-[16/10] bg-brand-50">
                  {first?.media_type === 'image' && first.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={first.url} alt={item.title || 'محتوای تبیین'} className="h-full w-full object-cover" />
                  ) : isVideo && thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb} alt={item.title || 'ویدئوی تبیین'} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-brand-500 to-brand-800 text-white font-black">جهاد تبیین</div>
                  )}
                </div>
                <div className="p-4">
                  <h2 className="line-clamp-2 text-sm font-extrabold leading-7 text-ink-900">{item.title || 'بدون عنوان'}</h2>
                  {item.author_username && <p className="mt-2 text-xs font-bold text-ink-500">{item.author_username}</p>}
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
