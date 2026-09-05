'use client';

import { useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { SmartImage } from '@/components/ui/SmartImage';
import { CampaignAlbum } from '@/components/home/CampaignAlbum';
import { formatPersianNumber } from '@/lib/utils';
import type { MadadkarAlbumImage } from '@/lib/madadkar';

/**
 * MadadkarGallery — گریدِ آلبومِ حرکت + لایت‌باکسِ سینماییِ مشترک.
 *
 * اولین خانهٔ گرید بزرگ‌تر است (featured) و بقیه در گریدِ ۳تایی می‌نشینند؛
 * روی هر کدام کلیک شود همان عکس به‌عنوان نقطهٔ شروعِ آلبوم باز می‌گردد.
 */
export function MadadkarGallery({
  images,
  title,
  subtitle,
}: {
  images: MadadkarAlbumImage[];
  title: string;
  subtitle?: { label: string; value: string };
}) {
  const [open, setOpen] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const onClose = useCallback(() => setOpen(false), []);

  const ordered = useMemo(() => {
    // لایت‌باکس از عکسِ انتخاب‌شده شروع می‌کند؛ ترتیبِ چرخه‌ای حفظ می‌شود
    if (!images.length) return images;
    return [...images.slice(startIndex), ...images.slice(0, startIndex)];
  }, [images, startIndex]);

  if (!images.length) return null;

  const [featured, ...rest] = images;

  const openAt = (i: number) => {
    setStartIndex(i);
    setOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {/* featured — دو ستون، دو ردیف */}
        <motion.button
          type="button"
          onClick={() => openAt(0)}
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          aria-label={`بزرگنمایی «${featured.alt || title}»`}
          className="group relative col-span-3 aspect-[16/8] cursor-zoom-in overflow-hidden rounded-2xl bg-ink-50 ring-1 ring-ink-100 focus:outline-none focus:ring-2 focus:ring-brand-500 sm:col-span-3"
        >
          <SmartImage
            src={featured.url}
            alt={featured.alt || title}
            variant="campaign"
            fill
            sizes="(min-width: 768px) 900px, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <span
            className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            aria-hidden="true"
          />
          {images.length > 1 && (
            <span className="absolute bottom-3 left-3 inline-flex h-7 items-center gap-1.5 rounded-lg bg-black/55 px-2.5 text-[11px] font-extrabold tabular-nums text-white ring-1 ring-white/20 backdrop-blur">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-5-5L5 21" />
              </svg>
              {formatPersianNumber(images.length)} تصویر — بازکردن آلبوم
            </span>
          )}
        </motion.button>

        {rest.slice(0, 5).map((im, i) => (
          <motion.button
            key={`${im.url}-${i}`}
            type="button"
            onClick={() => openAt(i + 1)}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            aria-label={`بزرگنمایی تصویر ${formatPersianNumber(i + 2)}`}
            className="group relative aspect-square cursor-zoom-in overflow-hidden rounded-xl bg-ink-50 ring-1 ring-ink-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <SmartImage
              src={im.url}
              alt={im.alt || title}
              variant="campaign"
              fill
              sizes="33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <span
              className="absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/20"
              aria-hidden="true"
            />
          </motion.button>
        ))}
      </div>

      <CampaignAlbum
        open={open}
        onClose={onClose}
        title={title}
        subtitle={subtitle}
        images={ordered}
        loading={false}
      />
    </>
  );
}
