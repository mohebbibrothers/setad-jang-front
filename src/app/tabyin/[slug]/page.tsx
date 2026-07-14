import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { safeApiFetch } from '@/lib/api';

export const revalidate = 180;

type Attachment = {
  id: number;
  url: string;
  media_type: 'image' | 'video' | 'audio' | 'other';
  media_type_display?: string;
  title?: string;
  size?: string;
  duration?: number;
  file_size?: number;
  order?: number;
};

type TabyinContentDetail = {
  external_id: string;
  title?: string;
  description?: string;
  author_username?: string;
  origin?: string;
  source_entity_id?: number;
  source_created_at?: string;
  source_updated_at?: string;
  source_url?: string;
  primary_media_type?: 'image' | 'video' | 'audio' | 'other';
  attachments?: Attachment[];
};

async function loadContent(slug: string) {
  return safeApiFetch<TabyinContentDetail>(`/tabyin/contents/${encodeURIComponent(slug)}/`, {
    absolute: true,
    revalidate: 180,
    tags: ['tabyin', `tabyin:${slug}`],
  });
}

function formatDate(value?: string) {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  } catch {
    return value;
  }
}

function MediaBlock({ attachment, title }: { attachment: Attachment; title: string }) {
  if (attachment.media_type === 'image') {
    return (
      <div className="relative aspect-video overflow-hidden rounded-3xl bg-ink-50 ring-1 ring-ink-100">
        <Image src={attachment.url} alt={attachment.title || title || 'محتوای تبیینی'} fill priority sizes="(max-width: 1024px) 100vw, 900px" className="object-cover" />
      </div>
    );
  }
  if (attachment.media_type === 'video') {
    return (
      <video controls preload="metadata" className="w-full overflow-hidden rounded-3xl bg-black ring-1 ring-ink-100" poster="">
        <source src={attachment.url} />
        مرورگر شما پخش ویدئو را پشتیبانی نمی‌کند.
      </video>
    );
  }
  if (attachment.media_type === 'audio') {
    return <audio controls src={attachment.url} className="w-full" />;
  }
  return (
    <a className="btn-outline btn-md" href={attachment.url} target="_blank" rel="noreferrer">
      دریافت فایل پیوست
    </a>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await loadContent(slug);
  return {
    title: item?.title ? `${item.title} | جهاد تبیین` : 'محتوای تبیینی',
    description: item?.description || 'جزئیات محتوای جهاد تبیین',
  };
}

export default async function TabyinDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await loadContent(slug);
  if (!item) notFound();

  const attachments = [...(item.attachments ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const primary = attachments[0];

  return (
    <main className="container-edge py-10 md:py-14">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link href="/tabyin" className="btn-outline btn-sm">همه محتواها</Link>
        {item.source_url && (
          <a href={item.source_url} target="_blank" rel="noreferrer" className="btn-primary btn-sm">منبع اصلی</a>
        )}
      </div>

      <article className="mx-auto max-w-5xl">
        <header className="mb-8 rounded-3xl bg-white p-6 md:p-8 shadow-soft ring-1 ring-ink-100">
          <p className="text-sm font-extrabold text-brand-600">جهاد تبیین</p>
          <h1 className="mt-3 text-2xl md:text-4xl font-black leading-[1.7] text-ink-900">{item.title || 'محتوای تبیینی'}</h1>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-ink-500">
            <span className="rounded-full bg-ink-50 px-3 py-1.5">شناسه: {item.external_id}</span>
            <span className="rounded-full bg-ink-50 px-3 py-1.5">نوع: {item.primary_media_type || 'other'}</span>
            <span className="rounded-full bg-ink-50 px-3 py-1.5">زمان: {formatDate(item.source_created_at)}</span>
            {item.author_username && <span className="rounded-full bg-ink-50 px-3 py-1.5">نویسنده: {item.author_username}</span>}
          </div>
        </header>

        {primary && <MediaBlock attachment={primary} title={item.title || ''} />}

        {item.description && (
          <section className="mt-8 rounded-3xl bg-white p-6 md:p-8 leading-9 text-ink-700 shadow-soft ring-1 ring-ink-100 whitespace-pre-line">
            {item.description}
          </section>
        )}

        {attachments.length > 1 && (
          <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {attachments.slice(1).map((attachment) => (
              <div key={attachment.id} className="rounded-2xl bg-white p-3 shadow-soft ring-1 ring-ink-100">
                <MediaBlock attachment={attachment} title={item.title || ''} />
                {attachment.title && <p className="mt-3 text-sm font-bold text-ink-700">{attachment.title}</p>}
              </div>
            ))}
          </section>
        )}
      </article>
    </main>
  );
}
