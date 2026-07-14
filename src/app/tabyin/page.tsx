import Link from 'next/link';
import Image from 'next/image';
import { safeApiFetch, type Paginated } from '@/lib/api';

export const revalidate = 180;

type Attachment = {
  id: number;
  url: string;
  media_type: 'image' | 'video' | 'audio' | 'other';
  title?: string;
  duration?: number;
};

type TabyinContent = {
  external_id: string;
  title?: string;
  description?: string;
  author_username?: string;
  source_created_at?: string;
  primary_media_type?: 'image' | 'video' | 'audio' | 'other';
  attachments?: Attachment[];
};

function coverOf(item: TabyinContent): Attachment | undefined {
  return (item.attachments ?? []).find((a) => a.media_type === 'image' && a.url)
    ?? (item.attachments ?? []).find((a) => a.url);
}

export default async function TabyinIndexPage({ searchParams }: { searchParams?: Promise<{ page?: string; search?: string }> }) {
  const params = await searchParams;
  const page = Number(params?.page || 1) || 1;
  const search = params?.search?.trim() || '';
  const query = new URLSearchParams({ page: String(page), page_size: '24', ordering: '-source_created_at' });
  if (search) query.set('search', search);
  const data = await safeApiFetch<Paginated<TabyinContent>>(`/tabyin/contents/?${query.toString()}`, {
    absolute: true,
    revalidate: 180,
    tags: ['tabyin'],
  });
  const items = data?.results ?? [];

  return (
    <main className="container-edge py-10 md:py-14">
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-bold text-brand-600">جهاد تبیین</p>
          <h1 className="mt-2 text-2xl md:text-4xl font-extrabold text-ink-900">همه محتواهای تبیینی</h1>
          <p className="mt-3 max-w-2xl text-ink-600 leading-8">آرشیو محتوای همگام‌شده از محتوانگار؛ شامل تصویر، ویدئو، صوت و محتوای متنی.</p>
        </div>
        <Link href="/" className="btn-outline btn-md">بازگشت به خانه</Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-ink-100 bg-white p-10 text-center text-ink-600">محتوایی برای نمایش یافت نشد.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => {
            const cover = coverOf(item);
            return (
              <Link key={item.external_id} href={`/tabyin/${item.external_id}`} className="group overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-ink-100 transition hover:-translate-y-1 hover:shadow-float">
                <div className="relative aspect-[4/3] bg-gradient-to-br from-brand-50 to-mint-50">
                  {cover?.media_type === 'image' ? (
                    <Image src={cover.url} alt={item.title || 'محتوای تبیینی'} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover transition duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-brand-600 font-extrabold">{item.primary_media_type === 'video' ? 'ویدئو' : item.primary_media_type === 'audio' ? 'صوت' : 'محتوا'}</div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
                    <h2 className="line-clamp-2 text-sm font-extrabold leading-6">{item.title || 'محتوای تبیینی'}</h2>
                  </div>
                </div>
                <div className="p-4">
                  <p className="line-clamp-2 text-sm leading-7 text-ink-600">{item.description || 'برای مشاهده جزئیات کلیک کنید.'}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
