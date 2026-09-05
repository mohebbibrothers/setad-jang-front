'use client';

/**
 * CampaignParticipateModal — alias پاسدارِ سازگاری.
 *
 * فلوی پرداخت مددکار در دورِ اتصال زرین‌پال بازطراحی شد و به
 * `@/components/madadkar/PaymentSheet` منتقل گردید (ایستگاه‌های
 * انتخاب → بازبینی → انتقال امن + بررسیِ وضعیت از تبِ برگشته).
 *
 * این فایل فقط exportِ سازگار را نگه می‌دارد تا مصرف‌کننده‌های موجود
 * (WarFundSection در صفحهٔ اصلی) بدون هیچ تغییری روی تجربهٔ جدید سوار شوند.
 * هر مصرف جدید باید مستقیم از PaymentSheet استفاده کند.
 */

export { PaymentSheet as CampaignParticipateModal } from '@/components/madadkar/PaymentSheet';
export type { PaymentSheetCampaign } from '@/components/madadkar/PaymentSheet';
