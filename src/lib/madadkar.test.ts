import { describe, expect, it } from 'vitest';
import {
  campaignCtaLabel,
  campaignLifecycle,
  clampPercent,
  classifyParticipateError,
  finalStateFromVerify,
  formatTomanFull,
  gatewayDisplayName,
  jalaliDateShort,
  normalizeCampaignAlbum,
  parsePaydoneResultParam,
  tomanToRial,
  type MadadkarVerifyResult,
} from './madadkar';

/**
 * madadkar lib — قراردادِ منطقِ نمایشی «مدد به حرکت»
 * (بدونِ شبکه؛ فقط pure helperها و مپ‌های دامنه).
 */

describe('conversion و format پول', () => {
  it('تومان → ریال هرگز گردِ منفی نمی‌سازد', () => {
    expect(tomanToRial(1)).toBe(10);
    expect(tomanToRial(999_950)).toBe(9_999_500);
    expect(tomanToRial(0)).toBe(0);
  });

  it('formatTomanFull آمارِ فارسی با واحد برمی‌گرداند', () => {
    expect(formatTomanFull(123456)).toContain('تومان');
    expect(formatTomanFull(123456)).toContain('۱۲۳٬۴۵۶');
    expect(formatTomanFull(null)).toBe('—');
    expect(formatTomanFull(Number.NaN)).toBe('—');
  });

  it('gatewayDisplayName نام‌های فارسی درگاه را می‌فهمد', () => {
    expect(gatewayDisplayName('zarinpal')).toBe('زرین‌پال');
    expect(gatewayDisplayName('ZarinPal'.toLowerCase())).toBe('زرین‌پال');
    expect(gatewayDisplayName('sandbox')).toBe('درگاه آزمایشی');
    expect(gatewayDisplayName(null)).toBe('درگاه پرداخت');
    expect(gatewayDisplayName('idpay')).toBe('idpay');
  });
});

describe('percent و چرخهٔ عمر', () => {
  it('clampPercent خروجی همیشه بازه‌ی [۰، ۱۰۰] دارد', () => {
    expect(clampPercent(-3)).toBe(0);
    expect(clampPercent(102.6)).toBe(100);
    expect(clampPercent(49.6)).toBe(50);
    expect(clampPercent(null)).toBe(0);
  });

  it('campaignLifecycle از status/سهم/fully-funded درست نتیجه می‌گیرد', () => {
    expect(
      campaignLifecycle({ status: 'published', is_fully_funded: false, remaining_shares: 5 }),
    ).toBe('active');
    expect(
      campaignLifecycle({ status: 'published', is_fully_funded: true, remaining_shares: 5 }),
    ).toBe('completed');
    expect(
      campaignLifecycle({ status: 'published', is_fully_funded: false, remaining_shares: 0 }),
    ).toBe('completed');
    expect(
      campaignLifecycle({ status: 'closed', is_fully_funded: false, remaining_shares: 3 }),
    ).toBe('closed');
    expect(
      campaignLifecycle({ status: 'completed', is_fully_funded: false, remaining_shares: 3 }),
    ).toBe('completed');
  });

  it('campaignCtaLabel متن دکمه را یک‌منبعی نگه می‌دارد', () => {
    expect(campaignCtaLabel('active')).toBe('مدد به حرکت');
    expect(campaignCtaLabel('completed')).toBe('حرکت کامل شد');
    expect(campaignCtaLabel('closed')).toBe('حرکت بسته شد');
  });
});

describe('پارامترِ paydone + حالت نهایی', () => {
  it('parsePaydoneResultParam فقط مقادیرِ شناخته‌شده را قبول می‌کند', () => {
    expect(parsePaydoneResultParam('success')).toBe('success');
    expect(parsePaydoneResultParam('CANCELED')).toBe('canceled');
    expect(parsePaydoneResultParam(' evil')).toBeNull();
    expect(parsePaydoneResultParam(null)).toBeNull();
    expect(parsePaydoneResultParam('')).toBeNull();
  });

  const baseVerify = {
    is_verified: false,
    payment_status: 'failed',
    payment_status_display: 'ناموفق',
    message: '',
    participation: {
      id: 1,
      campaign: {
        id: 1,
        title: 't',
        slug: 's',
        cover_image: null,
        sponsor: null,
        status: 'published',
        status_display: 'منتشرشده',
      },
      share_count: 2,
      share_price_snapshot: 1000,
      total_amount: 2000,
      status: 'failed',
      status_display: 'ناموفق',
      created_at: '',
      paid_at: null,
      payment: null,
    },
  } satisfies MadadkarVerifyResult;

  it('هیچ پارامتری روی نتیجهٔ SUCCESS اثر نمی‌گذارد (حق نباید محو شود)', () => {
    expect(
      finalStateFromVerify(
        { ...baseVerify, is_verified: true, payment_status: 'success' },
        'canceled',
      ),
    ).toBe('success');
  });

  it('FAILED + hint=canceled → canceled (نه failed)', () => {
    expect(finalStateFromVerify(baseVerify, 'canceled')).toBe('canceled');
    expect(finalStateFromVerify(baseVerify, 'failed')).toBe('failed');
    expect(finalStateFromVerify(baseVerify, null)).toBe('failed');
  });

  it('recordِ هنوز pending همان pending است', () => {
    expect(finalStateFromVerify({ ...baseVerify, payment_status: 'pending' }, 'success')).toBe(
      'pending',
    );
  });
});

describe('normalizeCampaignAlbum', () => {
  it('کاور اول + تکرارِ inline حذف + مرتب‌سازی روی display_order', () => {
    const album = normalizeCampaignAlbum({
      cover_image: 'https://cdn.example.com/cover.jpg',
      title: 'حرکت',
      gallery_images: [
        { id: 2, image: 'https://cdn.example.com/b.jpg', display_order: 2 },
        // تکرارِ کاور داخل گالری (back بعضی‌وقتها cover را دوباره می‌فرستد)
        { id: 9, image: 'https://cdn.example.com/cover.jpg', display_order: 1 },
        { id: 1, image: 'https://cdn.example.com/a.jpg', display_order: 0 },
      ],
    });
    expect(album.map((a) => a.url)).toEqual([
      'https://cdn.example.com/cover.jpg',
      'https://cdn.example.com/a.jpg',
      'https://cdn.example.com/b.jpg',
    ]);
    expect(album[1].alt).toBe('حرکت');
  });

  it('بدون کاور و گالریِ خالی خروجیِ خالی است', () => {
    expect(normalizeCampaignAlbum({ cover_image: null, title: 't', gallery_images: [] })).toEqual(
      [],
    );
  });
});

describe('jalaliDateShort', () => {
  it('ISO را به تاریخ شمسی کوتاه تبدیل می‌کند', () => {
    // جمعه ۱۴ تیر ۱۴۰۵ — مرز عادی؛ عبارت باید شامل تیر و ۱۴۰۵ باشد
    const s = jalaliDateShort('2026-07-04T12:00:00Z');
    expect(s).toBeTruthy();
    expect(s).toContain('تیر');
    expect(s).toContain('۱۴۰۵');
  });
  it('ورودیِ تهی null می‌دهد', () => {
    expect(jalaliDateShort(null)).toBeNull();
    expect(jalaliDateShort('')).toBeNull();
  });
});

describe('classifyParticipateError', () => {
  it('خطاهای ApiError واقعی به دسته‌های دامنه می‌رسند', async () => {
    const { ApiError } = await import('./api');
    expect(
      classifyParticipateError(new ApiError('سهام باقی‌مانده کمتر از تعداد درخواستی است.', 400))
        .kind,
    ).toBe('insufficient');
    expect(classifyParticipateError(new ApiError('خطا در ارتباط با درگاه پرداخت.', 502)).kind).toBe(
      'gateway',
    );
    expect(classifyParticipateError(new ApiError('حرکت تکمیل شده است.', 400)).kind).toBe('closed');
    expect(classifyParticipateError(new ApiError('احراز هویت نشده‌اید.', 401)).kind).toBe('auth');
    expect(classifyParticipateError(new ApiError('Server exploded', 500)).kind).toBe('generic');
    expect(classifyParticipateError(null).kind).toBe('generic');
    expect(classifyParticipateError(null).message.length).toBeGreaterThan(8);
  });
});
