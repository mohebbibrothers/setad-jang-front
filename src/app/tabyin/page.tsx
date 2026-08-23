import type { Metadata } from "next";
import Link from "next/link";
import { SmartImage } from "@/components/ui/SmartImage";
import { safeApiFetch, type Paginated } from "@/lib/api";
import { absoluteMediaUrl } from "@/lib/utils";

type MediaType = "image" | "video" | "audio" | "other";
type TabyinAttachment = {
  id?: number;
  url: string;
  media_type?: MediaType;
  duration?: number;
  title?: string;
};
type TabyinContent = {
  external_id: string;
  title?: string;
  description?: string;
  author_username?: string;
  source_created_at?: string;
  primary_media_type?: MediaType;
  attachments?: TabyinAttachment[];
};
type SearchParams = { page?: string; type?: string };

const PAGE_SIZE = 24;
const TYPES: Array<{ key: "" | MediaType; label: string }> = [
  { key: "", label: "همه" },
  { key: "image", label: "تصویر" },
  { key: "video", label: "ویدئو" },
  { key: "audio", label: "صوت" },
  { key: "other", label: "سایر" },
];

function videoThumbnail(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "app-media.armansky.ir") return undefined;
    parsed.pathname = parsed.pathname
      .replace("/org/uploads/", "/thumbnail/uploads/")
      .replace(/\.[a-z0-9]+$/i, ".gif");
    return parsed.toString();
  } catch {
    return undefined;
  }
}

export const metadata: Metadata = {
  title: "جهاد تبیین",
  description: "آرشیو صفحه‌بندی‌شده محتوای جهاد تبیین بعثت مردم.",
  alternates: { canonical: "/tabyin" },
};
export const revalidate = 180;

export default async function TabyinIndexPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = Math.max(
    1,
    Math.min(10_000, Number.parseInt(params.page || "1", 10) || 1),
  );
  const mediaType = TYPES.some((item) => item.key === params.type)
    ? (params.type as MediaType | undefined)
    : undefined;
  const suffix = mediaType ? `&media_type=${mediaType}` : "";
  const data = await safeApiFetch<Paginated<TabyinContent>>(
    `/tabyin/contents/?page_size=${PAGE_SIZE}&page=${page}&ordering=-source_created_at${suffix}`,
    { revalidate: 180, tags: ["tabyin"], timeoutMs: 10_000 },
  );
  const items = data?.results ?? [];
  const total = data?.count ?? items.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageHref = (target: number) =>
    `/tabyin?page=${target}${mediaType ? `&type=${mediaType}` : ""}`;

  return (
    <main className="bg-white">
      <section className="container-edge py-12 md:py-16">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-3xl">
            <p className="text-sm font-extrabold text-brand-700">جهاد تبیین</p>
            <h1 className="mt-3 text-2xl font-black text-ink-900 md:text-4xl">
              آرشیو روایت‌ها
            </h1>
            <p className="mt-4 leading-8 text-ink-600">
              روایت‌های تصویری، ویدئویی، صوتی و متنی گردآوری‌شده از منابع
              تأییدشده و کاربران.
            </p>
          </div>
          <Link href="/tabyin/new" className="btn-primary btn-md">
            افزودن روایت
          </Link>
        </div>

        <nav
          className="mt-8 flex gap-2 overflow-x-auto pb-2 no-scrollbar"
          aria-label="نوع رسانه"
        >
          {TYPES.map((item) => (
            <Link
              key={item.key || "all"}
              href={item.key ? `/tabyin?type=${item.key}` : "/tabyin"}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-extrabold ${mediaType === (item.key || undefined) ? "bg-brand-600 text-white" : "bg-ink-50 text-ink-600 hover:bg-brand-50 hover:text-brand-700"}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-8 flex items-center justify-between gap-3 text-xs font-bold text-ink-400">
          <span>{total.toLocaleString("fa-IR")} روایت</span>
          <span>
            صفحه {page.toLocaleString("fa-IR")} از{" "}
            {totalPages.toLocaleString("fa-IR")}
          </span>
        </div>

        {items.length ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => {
              const image = item.attachments?.find(
                (attachment) =>
                  attachment.media_type === "image" && attachment.url,
              );
              const video = item.attachments?.find(
                (attachment) =>
                  attachment.media_type === "video" && attachment.url,
              );
              const thumb =
                absoluteMediaUrl(image?.url) || videoThumbnail(video?.url);
              return (
                <Link
                  key={item.external_id}
                  href={`/tabyin/${item.external_id}`}
                  className="group block overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative aspect-[16/10] bg-brand-50">
                    <SmartImage
                      src={thumb}
                      alt={item.title || "محتوای تبیین"}
                      variant="tabyin"
                      fill
                      sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 25vw"
                      className="object-cover transition duration-300 group-hover:scale-105"
                    />
                    {video && (
                      <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-extrabold text-white backdrop-blur">
                        ویدئو
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h2 className="line-clamp-2 text-sm font-extrabold leading-7 text-ink-900">
                      {item.title || "بدون عنوان"}
                    </h2>
                    {item.author_username && (
                      <p className="mt-2 truncate text-xs font-bold text-ink-500">
                        {item.author_username}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl bg-ink-50 p-12 text-center text-sm font-bold text-ink-500">
            محتوایی در این صفحه پیدا نشد.
          </div>
        )}

        <nav
          className="mt-10 flex items-center justify-center gap-3"
          aria-label="صفحه‌بندی آرشیو"
        >
          {page > 1 ? (
            <Link
              rel="prev"
              href={pageHref(page - 1)}
              className="btn-outline btn-sm"
            >
              صفحه قبل
            </Link>
          ) : (
            <span className="btn-outline btn-sm pointer-events-none opacity-40">
              صفحه قبل
            </span>
          )}
          {page < totalPages ? (
            <Link
              rel="next"
              href={pageHref(page + 1)}
              className="btn-primary btn-sm"
            >
              صفحه بعد
            </Link>
          ) : (
            <span className="btn-primary btn-sm pointer-events-none opacity-40">
              صفحه بعد
            </span>
          )}
        </nav>
      </section>
    </main>
  );
}
