'use client';

import { useState } from 'react';
import { CampaignAlbum } from '@/components/home/CampaignAlbum';
import { SmartImage } from '@/components/ui/SmartImage';

export function KindnessGallery({
  images, title,
}: { images: Array<{ image: string; alt_text?: string }>; title: string }) {
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(0);
  if (!images.length) return null;
  const primary = images[0];
  const others  = images.slice(1, 5);
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-3 md:gap-4">
        <button
          type="button"
          onClick={() => { setStart(0); setOpen(true); }}
          className="relative aspect-[16/10] w-full rounded-[28px] overflow-hidden bg-ink-100 cursor-zoom-in ring-1 ring-ink-100 group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          aria-label={`نمایش تصویر بزرگ ${title}`}
        >
          <SmartImage src={primary.image} alt={primary.alt_text || title} variant="kindness" fill priority sizes="(max-width: 768px) 100vw, 66vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
          {images.length > 1 && (
            <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-black/55 text-white text-[11.5px] font-extrabold backdrop-blur-md ring-1 ring-white/15">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>
              نمایش گالری ({images.length.toLocaleString('fa-IR')})
            </span>
          )}
        </button>
        {others.length > 0 && (
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {others.map((im, i) => {
              const isLast = i === others.length - 1 && images.length > 5;
              const extra  = images.length - 5;
              return (
                <button
                  key={`${im.image}-${i}`}
                  type="button"
                  onClick={() => { setStart(i + 1); setOpen(true); }}
                  className="relative aspect-square rounded-2xl overflow-hidden bg-ink-100 ring-1 ring-ink-100 cursor-zoom-in group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  <SmartImage src={im.image} alt={im.alt_text || title} variant="kindness" fill sizes="(max-width: 768px) 45vw, 20vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.05]" />
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
      <CampaignAlbum open={open} onClose={() => setOpen(false)} title={title} startIndex={start}
        images={images.map((i) => ({ url: i.image, alt: i.alt_text }))} />
    </>
  );
}
