'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CampaignAlbum } from '@/components/home/CampaignAlbum';
import { SmartImage } from '@/components/ui/SmartImage';

/**
 * Cinema-style hero for the campaign detail page.
 * Click any thumbnail → opens the CampaignAlbum lightbox at that index.
 */
export function CampaignHero({
  title, images,
}: { title: string; images: Array<{ image: string; alt_text?: string }> }) {
  const [open, setOpen] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const primary = images[0];
  const others = images.slice(1, 5); // up to 4 side-thumbs

  const openAt = (i: number) => { setStartIndex(i); setOpen(true); };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-3 md:gap-4">
        {/* Primary — big square-ish */}
        <button
          type="button"
          onClick={() => openAt(0)}
          className="relative aspect-[4/3] md:aspect-[16/10] w-full rounded-[28px] overflow-hidden bg-ink-100 cursor-zoom-in ring-1 ring-ink-100 group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          aria-label={`نمایش تصویر بزرگ ${title}`}
        >
          <SmartImage
            src={primary?.image}
            alt={primary?.alt_text || title}
            variant="campaign"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 66vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
          {images.length > 1 && (
            <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-black/55 text-white text-[11.5px] font-extrabold backdrop-blur-md ring-1 ring-white/15">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>
              نمایش گالری ({(images.length).toLocaleString('fa-IR')})
            </span>
          )}
        </button>

        {/* Side thumbs — grid of up to 4 */}
        {others.length > 0 && (
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <AnimatePresence>
              {others.map((im, i) => {
                const isLast = i === others.length - 1 && images.length > 5;
                const extra  = images.length - 5;
                return (
                  <motion.button
                    key={`${im.image}-${i}`}
                    type="button"
                    onClick={() => openAt(i + 1)}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}
                    className="relative aspect-[4/3] md:aspect-square rounded-2xl overflow-hidden bg-ink-100 ring-1 ring-ink-100 cursor-zoom-in group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                    aria-label={`نمایش تصویر شماره ${(i + 2).toLocaleString('fa-IR')}`}
                  >
                    <SmartImage
                      src={im.image}
                      alt={im.alt_text || title}
                      variant="campaign"
                      fill
                      sizes="(max-width: 768px) 45vw, 20vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                    />
                    {isLast && (
                      <span aria-hidden className="absolute inset-0 flex items-center justify-center bg-black/55 backdrop-blur-sm text-white text-[15px] font-extrabold">
                        +{extra.toLocaleString('fa-IR')}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <CampaignAlbum
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        images={images.map((i) => ({ url: i.image, alt: i.alt_text }))}
        startIndex={startIndex}
      />
    </>
  );
}
