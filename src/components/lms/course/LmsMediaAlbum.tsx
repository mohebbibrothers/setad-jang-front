'use client';

/**
 * لانچرهای گالریِ رسانه‌ایِ کلاس — تعبیه‌ی تجربه‌ی «آلبومِ سینمایی» صفحه‌ی اصلی
 * (CampaignAlbum: کاورفلو + پینچ‌زوم + اسلایدشو + HUD) روی صفحه‌ی جزئیاتِ کلاس.
 *
 * دو لانچر، یک موتور:
 *   • CourseCoverAlbumButton — چیپِ شیشه‌ایِ «گالری» روی کاورِ هیرو. موتورِ
 *     آلبوم lazy است (next/dynamic ssr:false): چانکِ سنگینِ آلبوم فقط با اولین
 *     بازشدن فچ می‌شود و First Load صفحه را سنگین نمی‌کند.
 *   • CourseAvatarAlbumButton — خودِ آواتار به دکمه‌ی زوم تبدیل می‌شود
 *     (cursor-zoom-in + اورلیِ hover با آیکن) و آلبوم را دقیقاً روی اسلایدِ
 *     استاد باز می‌کند (startIndex از course-art).
 *
 * چرا dynamic? چانکِ آلبوم (~وابسته به هوم) جزو باندلِ اولیه‌ی صفحه نرود.
 * چرا isMounted مانع؟ CampaignAlbum پورتال به document.body می‌زند؛ با
 * رندرِ شرطی فقط-وقتی-open، هزینه‌ی mount فقط لحظه‌ی استفاده پرداخت می‌شود.
 */
import dynamic from 'next/dynamic';
import { useCallback, useState } from 'react';
import { Maximize2, ZoomIn } from 'lucide-react';

import { SmartImage } from '@/components/ui/SmartImage';
import type { CourseMediaSlide } from '@/lib/course-art';

const CampaignAlbumLazy = dynamic(
  () => import('@/components/home/CampaignAlbum').then((m) => m.CampaignAlbum),
  { ssr: false },
);

type AlbumShell = {
  slides: CourseMediaSlide[];
  title: string;
  subtitle?: { label: string; value: string };
};

function useAlbumShell({ slides, title, subtitle }: AlbumShell, startIndex?: number) {
  const [open, setOpen] = useState(false);
  const openAlbum = useCallback(() => setOpen(true), []);
  const closeAlbum = useCallback(() => setOpen(false), []);
  const album = open ? (
    <CampaignAlbumLazy
      open={open}
      onClose={closeAlbum}
      title={title}
      subtitle={subtitle}
      images={slides}
      startIndex={startIndex}
    />
  ) : null;
  return { openAlbum, album };
}

/** چیپِ شیشه‌ای روی کاورِ هیرو — همان DNA چیپ‌های کاور (مشکی/۵۵ + رینگِ شیشه‌ای). */
export function CourseCoverAlbumButton(shell: AlbumShell) {
  const { openAlbum, album } = useAlbumShell(shell);
  return (
    <>
      <button
        type="button"
        onClick={openAlbum}
        aria-label="نمایش گالری کلاس در تمام‌صفحه"
        className="absolute left-3 top-3 z-20 inline-flex h-8 items-center gap-1.5 rounded-full bg-black/55 px-3 text-[11px] font-extrabold text-white ring-1 ring-white/20 backdrop-blur-sm transition-colors hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-300"
      >
        <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">گالری</span>
      </button>
      {album}
    </>
  );
}

/** خودِ آواتار = دکمه‌ی زوم؛ آلبوم را روی اسلایدِ استاد باز می‌کند. */
export function CourseAvatarAlbumButton({
  avatarSrc,
  avatarAlt,
  size,
  startIndex,
  ...shell
}: AlbumShell & {
  avatarSrc?: string;
  avatarAlt: string;
  /** قطرِ ظرف (px) — برای sizes و تشخیصِ آیکنِ hover در اندازه‌های خیلی کوچک. */
  size: number;
  startIndex?: number;
}) {
  const { openAlbum, album } = useAlbumShell(shell, startIndex);
  return (
    <>
      <button
        type="button"
        onClick={openAlbum}
        aria-label={`بزرگ‌نمایی ${avatarAlt}`}
        className="group/zoom relative block h-full w-full cursor-zoom-in overflow-hidden rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-300"
      >
        <SmartImage
          src={avatarSrc}
          alt={avatarAlt}
          variant="avatar"
          fill
          sizes={`${size}px`}
          className="object-cover transition-transform duration-300 group-hover/zoom:scale-110"
        />
        {size >= 64 && (
          <span
            aria-hidden="true"
            className="absolute inset-0 grid place-items-center bg-ink-950/0 opacity-0 transition duration-300 group-hover/zoom:bg-ink-950/35 group-hover/zoom:opacity-100"
          >
            <ZoomIn className="h-7 w-7 text-white drop-shadow-[0_2px_6px_rgba(0,0,0,.6)]" />
          </span>
        )}
      </button>
      {album}
    </>
  );
}
