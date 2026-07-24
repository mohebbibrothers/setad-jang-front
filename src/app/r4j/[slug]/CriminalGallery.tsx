'use client';

import { useState } from 'react';
import { CampaignAlbum } from '@/components/home/CampaignAlbum';
import { SmartImage } from '@/components/ui/SmartImage';

/**
 * Photo gallery for the R4J detail page.
 * Portrait aspect (3/4) for the primary shot + up to 4 side thumbs.
 * Click any → opens the shared CampaignAlbum lightbox at that index.
 */
export function CriminalGallery({
  photos, title,
}: { photos: Array<{ image: string; caption?: string | null }>; title: string }) {
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(0);
  if (!photos.length) return null;
  const primary = photos[0];
  const others  = photos.slice(1, 5);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-3 md:gap-4">
        <button
          type="button"
          onClick={() => { setStart(0); setOpen(true); }}
          className="relative aspect-[3/4] w-full rounded-[28px] overflow-hidden bg-ink-100 cursor-zoom-in ring-1 ring-ink-100 group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          aria-label={`نمایش تصویر بزرگ ${title}`}
        >
          <SmartImage
            src={primary.image}
            alt={title}
            variant="criminal"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 40vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          {primary.caption && (
            <p className="absolute bottom-3 inset-x-3 text-white text-[12px] font-extrabold drop-shadow-[0_2px_6px_rgba(0,0,0,.7)] line-clamp-2">
              {primary.caption}
            </p>
          )}
          {photos.length > 1 && (
            <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-black/55 text-white text-[11.5px] font-extrabold backdrop-blur-md ring-1 ring-white/15">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>
              {photos.length.toLocaleString('fa-IR')} تصویر
            </span>
          )}
        </button>

        {others.length > 0 && (
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {others.map((im, i) => {
              const isLast = i === others.length - 1 && photos.length > 5;
              const extra  = photos.length - 5;
              return (
                <button
                  key={`${im.image}-${i}`}
                  type="button"
                  onClick={() => { setStart(i + 1); setOpen(true); }}
                  className="relative aspect-square rounded-2xl overflow-hidden bg-ink-100 ring-1 ring-ink-100 cursor-zoom-in group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  aria-label={`تصویر شماره ${(i + 2).toLocaleString('fa-IR')}`}
                >
                  <SmartImage
                    src={im.image}
                    alt={title}
                    variant="criminal"
                    fill
                    sizes="(max-width: 768px) 45vw, 20vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                  />
                  {isLast && (
                    <span aria-hidden className="absolute inset-0 flex items-center justify-center bg-black/55 backdrop-blur-sm text-white text-[15px] font-extrabold">
                      +{extra.toLocaleString('fa-IR')}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <CampaignAlbum
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        images={photos.map((p) => ({ url: p.image, alt: p.caption ?? undefined }))}
        startIndex={start}
      />
    </>
  );
}
