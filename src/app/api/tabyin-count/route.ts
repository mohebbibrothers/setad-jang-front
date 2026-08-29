import { NextRequest, NextResponse } from 'next/server';
import { feedFiltersFromSearchParams } from '@/lib/revayat';
import { countVisibleFeedTotal } from '@/lib/home-data';

/**
 * ═══════════════════════════════════════════════════════════════════
 * GET /api/tabyin-count — سرویسِ سبکِ «شمارِ واقعیِ روایت‌ها»
 *
 * چرا وجود دارد؟ شمارنده‌ی فیدِ روایت‌ها باید همیشه «تعدادِ محتوای
 * قابل‌مشاهده برای کاربر» را نشان بدهد — نه شمارِ خامِ پاکتِ
 * صفحه‌بندی (که سطرهای پوچ و نسخه‌های تکراری را هم حساب می‌کند).
 * محاسبه‌ی این عدد یعنی خواندنِ کلِ کرپوسِ فیلترشده از بک‌اند؛ آن بار
 * سنگین را نباید به گوشیِ کاربر منتقل کرد، پس اسکن اینجا سمتِ سرور
 * انجام می‌شود و فقط یک عددِ کوچک JSON به کلاینت می‌رسد.
 *
 * قرارداد:
 *   • پارامترها همان واژگانِ عمومیِ صفحه‌اند (q/type/author) و از
 *     دروازه‌ی پاک‌سازیِ feedFiltersFromSearchParams رد می‌شوند (type
 *     به whitelist محدود است؛ طولِ متن‌ها سقف دارد)؛
 *   • خروجیِ موفق: { success: true, status_code: 200, count } — همان
 *     دو گِیتِ فید (جهانِ قابل‌نمایش + یکتاسازیِ keep-first) با همان
 *     ترتیب؛ معادلِ دقیقِ «کارت‌هایی که کاربر می‌بیند»؛
 *   • خروجیِ شکست: 503 — یعنی بک‌اند در دسترس نبود؛ کلاینت در این حالت
 *     امانت‌دارانه به شمارِ خامِ پاکت فرو می‌افتد، نه صفر؛
 *   • کش: واکشی‌های upstream با revalidate=120 و tags:['tabyin']
 *     کش می‌شوند (منبعِ مشترک با صفحه‌ی /tabyin)؛ خودِ پاسخ هم ۳۰
 *     ثانیه قابلِ کش‌کردن است تا پیمایشِ رفت‌وبرگشتیِ فیلترها سبک
 *     بماند.
 * ═══════════════════════════════════════════════════════════════════
 */

export const dynamic = 'force-dynamic';

const MAX_PARAM_LEN = 200;

export async function GET(request: NextRequest) {
  const raw = Object.fromEntries(request.nextUrl.searchParams);
  const filters = feedFiltersFromSearchParams({
    q: typeof raw.q === 'string' ? raw.q.slice(0, MAX_PARAM_LEN) : undefined,
    type: raw.type,
    author: typeof raw.author === 'string' ? raw.author.slice(0, MAX_PARAM_LEN) : undefined,
  });

  const count = await countVisibleFeedTotal(filters);
  if (count === undefined) {
    return NextResponse.json(
      { success: false, status_code: 503, message: 'Content backend unreachable' },
      { status: 503 },
    );
  }

  return NextResponse.json(
    { success: true, status_code: 200, count },
    {
      headers: {
        'Cache-Control': 'public, max-age=30, stale-while-revalidate=90',
      },
    },
  );
}
