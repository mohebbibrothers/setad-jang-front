'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react';
import type { GalleryItem } from '@/lib/r4j';
import { SmartImage } from '@/components/ui/SmartImage';
import { cn, toPersianDigits } from '@/lib/utils';

/**
 * ═══════════════════════════════════════════════════════════════════
 * CasefileGallery — جزیره‌ی کلاینتِ گالریِ پرونده
 *
 *   • هسته‌ی SSR: عکسِ اصلی و بندانگشتی‌ها در HTMLِ اولیه‌اند (بدون
 *     فچِ کلاینت)؛ تعامل (تعویض عکس + لایت‌باکس) فقط لایه‌ی دوم است.
 *   • لایت‌باکس: ESC و پیکان‌های کیبورد (آگاه‌از-RTL: قبلی=راست،
 *     بعدی=چپ)، قفلِ اسکرولِ بدنه، شمارنده‌ی فارسی، بستن با کلیک روی
 *     پس‌زمینه.
 * ═══════════════════════════════════════════════════════════════════
 */

export function CasefileGallery({ items, name }: { items: GalleryItem[]; name: string }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const item = items[Math.min(active, Math.max(items.length - 1, 0))];

  const go = useCallback(
    (dir: 1 | -1) => {
      setActive((i) => (i + dir + items.length) % items.length);
    },
    [items.length],
  );

  // قفلِ اسکرول + کیبورد در لایت‌باکس
  useEffect(() => {
    if (!lightbox) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(false);
      // RTL: «بعدی» بصری در چپ است
      if (e.key === 'ArrowLeft') go(1);
      if (e.key === 'ArrowRight') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [lightbox, go]);

  if (items.length === 0) {
    // بدون عکس: پوسترِ حروف آغازین — هم‌خانواده با فالبکِ SmartImage
    return (
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl border border-ink-100 bg-gradient-to-br from-ink-100 to-ink-200 shadow-sm">
        <SmartImage
          src={null}
          alt={name}
          variant="criminal"
          fill
          sizes="(min-width:1024px) 40vw, 100vw"
        />
      </div>
    );
  }

  return (
    <div>
      {/* عکسِ اصلی — کلیک → لایت‌باکس */}
      <button
        type="button"
        onClick={() => setLightbox(true)}
        aria-label={`نمایش تمام‌صفحه‌ی عکس ${name}`}
        className="group relative block aspect-[4/5] w-full overflow-hidden rounded-3xl border border-ink-100 bg-ink-100 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2"
      >
        <SmartImage
          src={item.src}
          alt={item.caption || name}
          variant="criminal"
          fill
          priority
          sizes="(min-width:1024px) 40vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <span className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-ink-900/60 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
          <Expand className="h-4 w-4" aria-hidden="true" />
        </span>
        {items.length > 1 && (
          <span className="absolute bottom-3 left-3 rounded-full bg-ink-900/60 px-2.5 py-1 text-[11px] font-bold tabular-nums text-white backdrop-blur-sm">
            {toPersianDigits(active + 1)} از {toPersianDigits(items.length)}
          </span>
        )}
      </button>

      {/* کپشن */}
      {item.caption && (
        <p className="mt-3 rounded-2xl bg-ink-50 px-4 py-2.5 text-center text-[12px] font-bold text-ink-600">
          {item.caption}
        </p>
      )}

      {/* بندانگشتی‌ها */}
      {items.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {items.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`عکس ${toPersianDigits(i + 1)}`}
              aria-current={i === active}
              className={cn(
                'relative aspect-square overflow-hidden rounded-xl border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-1',
                i === active
                  ? 'border-accent-500 shadow-md'
                  : 'border-transparent opacity-70 hover:opacity-100',
              )}
            >
              <SmartImage
                src={p.src}
                alt=""
                variant="criminal"
                fill
                sizes="20vw"
                quietSkeleton
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* لایت‌باکس */}
      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`نگارخانه‌ی ${name}`}
          className="bg-ink-950/95 fixed inset-0 z-[70] flex flex-col backdrop-blur-sm"
          onClick={() => setLightbox(false)}
        >
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <span className="text-[12px] font-bold tabular-nums text-white/70">
              {toPersianDigits(active + 1)} از {toPersianDigits(items.length)}
            </span>
            <button
              type="button"
              onClick={() => setLightbox(false)}
              aria-label="بستن"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <div
            className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- لایت‌باکس: نسخه‌ی تمام‌اندازه با object-contain؛ بهینه‌سازیِ next/image این‌جا سودی ندارد */}
            <img
              src={item.src}
              alt={item.caption || name}
              className="max-h-full max-w-full rounded-2xl object-contain shadow-2xl"
            />
            {items.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label="عکس قبلی"
                  className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25 md:right-6"
                >
                  <ChevronRight className="h-6 w-6" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label="عکس بعدی"
                  className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25 md:left-6"
                >
                  <ChevronLeft className="h-6 w-6" aria-hidden="true" />
                </button>
              </>
            )}
          </div>
          {item.caption && (
            <p className="px-6 pb-6 text-center text-[13px] font-bold text-white/80">
              {item.caption}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
