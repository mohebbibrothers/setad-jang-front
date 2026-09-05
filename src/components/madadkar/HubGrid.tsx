'use client';

import { useCallback, useState } from 'react';
import { CampaignCardView, toSheetCampaign } from './CampaignCardView';
import { PaymentSheet, type PaymentSheetCampaign } from './PaymentSheet';
import type { MadadkarCampaignListItem } from '@/lib/madadkar';

/**
 * HubGrid — گریدِ کارت‌های حرکت‌ها در هاب + مالکیت شیتِ پرداخت.
 *
 * هاب یک سطحِ اپ دارد: کاربر بدون ترکِ صفحه می‌تواند سهم بگیرد؛
 * شیت روی همان گرید باز می‌شود و پس از بستن، گرید به‌خاطر فلاشِ ISR
 * خودش هیچ وضعیتِ تازه‌ای لازم ندارد (front detail در شیت تازه می‌شود).
 */
export function HubGrid({ campaigns }: { campaigns: MadadkarCampaignListItem[] }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetCampaign, setSheetCampaign] = useState<PaymentSheetCampaign | null>(null);

  const openSheet = useCallback((c: MadadkarCampaignListItem) => {
    setSheetCampaign(toSheetCampaign(c));
    setSheetOpen(true);
  }, []);
  const closeSheet = useCallback(() => setSheetOpen(false), []);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        {campaigns.map((c, i) => (
          <CampaignCardView key={c.slug} c={c} index={i} onParticipate={openSheet} />
        ))}
      </div>
      <PaymentSheet open={sheetOpen} onClose={closeSheet} campaign={sheetCampaign} />
    </>
  );
}
