'use client';

import { KindnessCard } from '@/components/home/KindnessCard';
import { useKindnessOverlays } from '@/components/home/useKindnessOverlays';
import type { KindListing } from '@/components/home/KindnessSection';

/**
 * ───────────────────────────────────────────────────────────────────────────
 * KindnessBoard — گرید تعاملی تختهٔ نیازها در هابِ /kindness-wall
 *
 * سرور آیتم‌های صفحهٔ فعلی را می‌آورد (URL = سندِ فیلتر/صفحه)؛ این جزیرهٔ
 * کلاینتی فقط «تعامل» را مالک است:
 *
 *   • هر کارت لنگرِ پایدار دارد: id="kw-{slug}" → دیپ‌لینک (#kw-…) از
 *     جست‌وجوی سراسری و آیتم‌های ItemListِ JSON-LD روی کارت فرود می‌آید
 *     (scroll-mt-28 داخلِ خودِ کارت حلش می‌کند).
 *   • «راه‌های ارتباط» → شیتِ پورتالی + lazy fetch از DETAIL (تنها جایی که
 *     کانال‌های تماس را می‌دهد) — منطقِ کش/retry/تazaه‌سازی زندهٔ آلبوم از
 *     هوکِ مشترکِ useKindnessOverlays می‌آید؛ دقیقاً همان رفتارِ صفحهٔ اصلی.
 *   • کاور → آلبومِ تصاویر (CampaignAlbum پورتالی).
 *
 * چیدمان = خانوادهٔ کارت‌های سایت: flex-wrap + وسط‌چین + ۱/۲/۳ ستونه
 * (کلاس‌های عرض روی خودِ KindnessCard است تا یتیم‌های آخرین ردیف هم
 * خوش‌بنشینند).
 * ───────────────────────────────────────────────────────────────────────────
 */

export function KindnessBoard({ listings }: { listings: KindListing[] }) {
  const { openContact, openAlbum, overlays } = useKindnessOverlays(listings);

  return (
    <>
      <div className="flex flex-wrap justify-center gap-4 md:gap-5" data-testid="kw-board-grid">
        {listings.map((l, i) => (
          <KindnessCard
            key={l.slug}
            l={l}
            id={`kw-${l.slug}`}
            delay={Math.min(i, 10) * 0.05}
            onContact={openContact}
            onAlbum={openAlbum}
          />
        ))}
      </div>
      {overlays}
    </>
  );
}
