'use client';

import { useMemo, useState } from 'react';
import { Expand, Images } from 'lucide-react';
import type { GalleryItem } from '@/lib/r4j';
import { SmartImage } from '@/components/ui/SmartImage';
import { CampaignAlbum, type AlbumImage } from '@/components/home/CampaignAlbum';
import { cn, toPersianDigits } from '@/lib/utils';

/**
 * ═══════════════════════════════════════════════════════════════════
 * CasefileGallery — نگارخانه‌ی پرونده با «آلبومِ سینمایی»
 *
 *   • همان آلبومِ Cinema-Cylinder صفحه‌ی اول (CampaignAlbum) — همان‌که
 *     «مدد به حرکت» و «جایزه‌ای برای عدالت» استفاده می‌کنند — این‌جا هم
 *     نقطه‌ی مرکزیِ تجربه‌ی تماشای تصاویر پرونده است: کاورفلو سه‌بُعدی،
 *     زوم+پن، اسلایدشوی Ken-Burns با نوارِ پیشرفت، نوارِ فیلمِ بندانگشتی،
 *     فول‌اسکرین با پشتیبانیِ کاملِ وندورپریفیکس‌ها، کپی/دانلودِ تصویر،
 *     میان‌برهای صفحه‌کلیدِ آگاه‌از-RTL و راهنمای کلیدها. هیچ «لایت‌باکسِ
 *     ساده + عکس بزرگ‌شده»‌ای دیگر در کار نیست.
 *   • هسته‌ی SSR: عکسِ فعال و بندانگشتی‌ها در HTMLِ اولیه‌اند؛ آلبوم
 *     فقط روی کلیک (بدون هزینه‌ی رندرِ اولیه) مونت می‌شود.
 *   • بندانگشتی‌ها فقط «عکسِ فعالِ صحنه» را عوض می‌کنند؛ کلیک روی صحنه
 *     آلبوم را دقیقاً از همان فریم باز می‌کند (startIndex = active).
 *   • موقعیتِ مکانیِ پرونده (مراجعه به visibility map بک‌اند) به‌عنوان
 *     subtitle آلبوم می‌رود — هم‌خانواده با رفتارِ کارت‌های صفحه‌ی اول.
 * ═══════════════════════════════════════════════════════════════════
 */

export function CasefileGallery({
  items,
  name,
  location,
}: {
  items: GalleryItem[];
  name: string;
  /** خطِ مکانِ قابل‌انتشار (city/province/country join) — برای سابتایتلِ آلبوم */
  location?: string | null;
}) {
  const [active, setActive] = useState(0);
  const [albumOpen, setAlbumOpen] = useState(false);

  const item = items[Math.min(active, Math.max(items.length - 1, 0))];

  const albumImages: AlbumImage[] = useMemo(
    () => items.map((p) => ({ url: p.src, alt: p.caption || name })),
    [items, name],
  );
  const albumSubtitle = location?.trim() ? { label: 'موقعیت', value: location.trim() } : undefined;

  if (items.length === 0) {
    // بدون عکس: پوسترِ حروف آغازین — هم‌خانواده با فالبکِ SmartImage
    return (
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[28px] border border-ink-100 bg-gradient-to-br from-ink-100 to-ink-200 shadow-soft">
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
      {/* ── صحنه‌ی اصلی — کلیک → آلبومِ سینمایی ─────────────────── */}
      <button
        type="button"
        onClick={() => setAlbumOpen(true)}
        aria-label={`گشودن آلبومِ سینماییِ تصاویرِ ${name}`}
        className="group relative block aspect-[4/5] w-full cursor-zoom-in overflow-hidden rounded-[28px] border border-ink-100 bg-ink-100 shadow-[0_1px_2px_rgba(15,20,32,.05),0_24px_48px_-28px_rgba(15,20,32,.35)] transition-shadow duration-300 hover:shadow-[0_1px_2px_rgba(15,20,32,.05),0_32px_64px_-28px_rgba(15,20,32,.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2"
      >
        <SmartImage
          src={item.src}
          alt={item.caption || name}
          variant="criminal"
          fill
          priority
          sizes="(min-width:1024px) 40vw, 100vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />

        {/* گرادیانتِ خوانایی برای لایه‌های شناور */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-ink-900/60 to-transparent"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-ink-900/70 to-transparent"
        />

        {/* برچسبِ آلبوم — بالا، شروع (راست در RTL) */}
        <span className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-ink-900/60 px-3 py-1.5 text-[11px] font-extrabold text-white ring-1 ring-white/15 backdrop-blur-sm">
          <Images className="h-3.5 w-3.5 text-gold-400" aria-hidden="true" />
          آلبومِ تصاویر
          {items.length > 1 && (
            <span className="tabular-nums text-white/70">
              · {toPersianDigits(items.length)} فریم
            </span>
          )}
        </span>

        {/* آیکنِ بزرگ‌نمایی — فقط در هاور (دسکتاپ) */}
        <span className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-ink-900/60 text-white opacity-0 ring-1 ring-white/15 backdrop-blur-sm transition-all duration-300 group-hover:opacity-100">
          <Expand className="h-4 w-4" aria-hidden="true" />
        </span>

        {/* خواب‌افزای CTA آلبوم — همیشه دیده می‌شود تا قابلیت تبلیغ شود */}
        <span className="pointer-events-none absolute bottom-3.5 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-white/95 px-4 py-2 text-[12px] font-black text-ink-900 shadow-[0_10px_24px_-8px_rgba(0,0,0,.5)] ring-1 ring-ink-900/10 backdrop-blur-sm transition-all duration-300 group-hover:-translate-y-0.5 group-hover:bg-white group-hover:shadow-[0_14px_30px_-8px_rgba(0,0,0,.55)]">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-accent-400 to-accent-600 text-white">
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-3 w-3"
              aria-hidden="true"
              style={{ marginInlineStart: 1 }}
            >
              <polygon points="6,4 20,12 6,20" />
            </svg>
          </span>
          تماشا در آلبومِ سینمایی
          {items.length > 1 && (
            <span className="rounded-full bg-ink-900/[.06] px-2 py-0.5 text-[10.5px] font-extrabold tabular-nums text-ink-500">
              {toPersianDigits(active + 1)} / {toPersianDigits(items.length)}
            </span>
          )}
        </span>
      </button>

      {/* کپشنِ فریمِ فعال */}
      {item.caption && (
        <p className="mt-3 rounded-2xl bg-ink-50 px-4 py-2.5 text-center text-[12px] font-bold text-ink-600">
          {item.caption}
        </p>
      )}

      {/* ریلِ بندانگشتی — انتخابِ فریمِ صحنه (نه بازکردنِ آلبوم) */}
      {items.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2" role="group" aria-label="فریم‌های آلبوم">
          {items.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`عکس ${toPersianDigits(i + 1)}`}
              aria-current={i === active}
              className={cn(
                'relative aspect-square overflow-hidden rounded-2xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-1',
                i === active
                  ? 'shadow-[0_10px_22px_-8px_rgba(229,82,20,.55)] ring-2 ring-accent-500'
                  : 'opacity-70 ring-1 ring-ink-200 hover:scale-[1.04] hover:opacity-100 hover:ring-accent-300',
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
              {i === active && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-l from-accent-400 to-accent-600"
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── آلبومِ سینمایی — همان CampaignAlbum صفحه‌ی اول ────────── */}
      <CampaignAlbum
        open={albumOpen}
        onClose={() => setAlbumOpen(false)}
        title={name}
        subtitle={albumSubtitle}
        images={albumImages}
        startIndex={Math.min(active, Math.max(items.length - 1, 0))}
      />
    </div>
  );
}
