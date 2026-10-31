'use client';

import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Expand, Images } from 'lucide-react';
import { SmartImage } from '@/components/ui/SmartImage';
import { CampaignAlbum, type AlbumImage } from '@/components/home/CampaignAlbum';
import { cn, formatPersianNumber as fa } from '@/lib/utils';

/**
 * ───────────────────────────────────────────────────────────────────────────
 * ListingGallery — قابِ تصویریِ صفحهٔ اسلاگِ آگهی
 *
 *   • کاورِ اصلی با نسبتِ ثابت (۴/۳ در موبایل، ۱۶/۱۰ در دسکتاپ) تا هرگز
 *     صفحات بعدی جابه‌جا نشوند؛ ضربه = آلبومِ تمام‌صفحه.
 *   • روبانِ «N تصویر» بالای کاور: به کاربر بگو پیش از باز کردن چه چیزی
 *     منتظرش است (و اگر تک‌تصویری است، اصلاً نمایش نده).
 *   • نوارِ تامبنیل‌های افقی (اسکرولِ مخفیِ درون‌ریل، RTL-امن) با حالتِ فعال
 *     و حلقهٔ برند؛ انتخابِ تامبنیل هم کاور را عوض می‌کند و هم آلبوم را از
 *     همان تصویر باز می‌کند — دو کاربرد در یک تعامل.
 *   • آلبوم همان CampaignAlbumِ خانه است (portal به body، زوم/پن/کپی).
 *   • همه‌چیز با `loading` سفارشی: تصویرِ اول eager (LCP) و بقیه lazy.
 * ───────────────────────────────────────────────────────────────────────────
 */

export function ListingGallery({
  title,
  subtitle,
  images,
}: {
  title: string;
  /** خطِ دومِ آلبوم (دسته · مقدار) — از دیتای همان آگهی. */
  subtitle?: { label: string; value: string };
  images: AlbumImage[];
}) {
  const [active, setActive] = useState(0);
  const [albumOpen, setAlbumOpen] = useState(false);
  const [albumStart, setAlbumStart] = useState(0);

  const openAlbum = useCallback((index: number) => {
    setAlbumStart(index);
    setAlbumOpen(true);
  }, []);

  const list = images.length > 0 ? images : [{ url: '', alt: title }];
  const current = list[Math.min(active, list.length - 1)];

  /* نمایشِ حداکثر ۵ تامبنیل + شمارندهٔ بقیه در تامبنیلِ آخر */
  const MAX_THUMBS = 5;
  const thumbs = list.slice(0, MAX_THUMBS);
  const hiddenCount = Math.max(0, list.length - MAX_THUMBS);

  return (
    <div data-testid="kw-gallery">
      <motion.button
        type="button"
        initial={{ opacity: 0, scale: 0.99 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
        onClick={() => openAlbum(active)}
        aria-label={`بازکردنِ آلبوم تصاویر ${title}`}
        className="group relative block aspect-[3/2] w-full cursor-zoom-in overflow-hidden rounded-[20px] bg-ink-100 ring-1 ring-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950 sm:aspect-[16/10] sm:rounded-[24px]"
      >
        <SmartImage
          src={current?.url}
          alt={current?.alt || title}
          variant="kindness"
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 720px"
          priority
          className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 z-[1] h-1/3 bg-gradient-to-t from-black/45 to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-100"
        />

        {list.length > 1 && (
          <span className="absolute bottom-3 left-3 z-10 inline-flex h-8 items-center gap-1.5 rounded-full bg-black/45 px-3 text-[11.5px] font-extrabold text-white backdrop-blur-md">
            <Images className="h-3.5 w-3.5" aria-hidden="true" />
            {`${fa(list.length)} تصویر`}
          </span>
        )}

        <span className="pointer-events-none absolute bottom-2.5 right-2.5 z-10 inline-flex h-8 items-center gap-1.5 rounded-full bg-white/95 px-2.5 text-[11px] font-extrabold text-ink-800 opacity-0 shadow-soft backdrop-blur-md transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 sm:bottom-3 sm:right-3 sm:px-3 sm:text-[11.5px]">
          <Expand className="h-3.5 w-3.5" aria-hidden="true" />
          بزرگ‌نمایی
        </span>
      </motion.button>

      {thumbs.length > 1 && (
        <div
          className="no-scrollbar mt-3 flex gap-2 overflow-x-auto"
          role="group"
          aria-label="تصاویر این آگهی"
        >
          {thumbs.map((img, i) => {
            const isLast = i === thumbs.length - 1 && hiddenCount > 0;
            return (
              <button
                key={`${img.url}-${i}`}
                type="button"
                onClick={() => {
                  setActive(i);
                  openAlbum(i);
                }}
                aria-label={
                  isLast ? `نمایش همهٔ ${fa(list.length)} تصویر` : `نمایش تصویر ${fa(i + 1)}`
                }
                aria-current={i === active ? 'true' : undefined}
                className={cn(
                  'group relative h-[52px] w-[68px] shrink-0 overflow-hidden rounded-xl bg-ink-100 ring-1 transition-all duration-200 sm:h-[72px] sm:w-24',
                  i === active ? 'ring-2 ring-brand-400' : 'ring-white/15 hover:ring-brand-300/70',
                )}
              >
                <SmartImage
                  src={img.url}
                  alt={img.alt || title}
                  variant="kindness"
                  fill
                  sizes="96px"
                  className="object-cover"
                />
                {isLast && (
                  <span className="absolute inset-0 grid place-items-center bg-ink-950/65 text-[12px] font-extrabold text-white backdrop-blur-[1px]">
                    {`+${fa(hiddenCount)}`}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <CampaignAlbum
        open={albumOpen}
        onClose={() => setAlbumOpen(false)}
        title={title}
        subtitle={subtitle}
        images={images}
        startIndex={albumStart}
      />
    </div>
  );
}
