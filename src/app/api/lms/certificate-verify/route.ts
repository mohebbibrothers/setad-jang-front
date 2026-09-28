import { NextRequest, NextResponse } from 'next/server';
import { apiFetch, isApiError } from '@/lib/api';
import { mapCertificateVerify, sanitizeCertificateCode } from '@/lib/lms-certificate';

/**
 * ═══════════════════════════════════════════════════════════════════
 * GET /api/lms/certificate-verify?code=… — پروکسیِ راستی‌آزماییِ گواهی
 *
 * چرا پروکسی؟ endpointِ عمومیِ backend (AllowAny + throttle per-IP)
 * برای فراخوانیِ مستقیم از مرورگر ساخته شده، ولی عبورِ آن از سرورِ
 * Next سه چیز را تضمین می‌کند:
 *   ۱) آدرسِ upstream روی buildهای صیانت‌شده (env) قفل می‌ماند و
 *      کلاینت هرگز origin داخلی را حدس/جابه‌جا نمی‌کند؛
 *   ۲) ورودی با sanitizeCertificateCode به الفبای دقیقِ SlugField
 *      محدود می‌شود — حتی اگر ویجت دور زده شود، مسیرِ URL مهار است؛
 *   ۳) پاسخ به یک قراردادِ کوچکِ پایدار نگاشت می‌شود تا ویجت با
 *      re-shape شدنِ serializer به‌سادگی عقب‌ننشیند.
 *
 * قراردادِ پاسخ (همیشه JSON):
 *   200 { found: true,  certificate: … }   گواهی معتبر است
 *   200 { found: false }                   یافت نشد / باطل / غیرفعال
 *   400 { found: false, reason: 'invalid' } کد نامعتبر
 *   429 …                                  throttle — عبورِ شفاف
 *   503 { found: false, reason: 'unavailable' } بک‌اند در دسترس نیست
 *
 * نکته‌ی امنیتی: پاسخِ backend فیلد national_code_snapshot هم دارد که
 * عمداً به کلاینت نمی‌رسد — استعلامِ عمومی باید «اعتبار» را اثبات کند،
 * نه هویتِ ملی را افشا.
 * ═══════════════════════════════════════════════════════════════════
 */

export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' };

export async function GET(request: NextRequest) {
  const code = sanitizeCertificateCode(request.nextUrl.searchParams.get('code') ?? '');
  if (!code) {
    return NextResponse.json(
      { found: false, reason: 'invalid' },
      { status: 400, headers: NO_STORE },
    );
  }

  try {
    const data = await apiFetch<Record<string, unknown>>(
      `/lms/certificates/verify/${encodeURIComponent(code)}/`,
      { skipAuth: true, cache: 'no-store' },
    );
    return NextResponse.json(
      { found: true, certificate: mapCertificateVerify(data) },
      { headers: NO_STORE },
    );
  } catch (err) {
    if (isApiError(err) && err.status === 404) {
      return NextResponse.json({ found: false }, { headers: NO_STORE });
    }
    if (isApiError(err) && err.status === 429) {
      return NextResponse.json(
        { found: false, reason: 'rate_limited' },
        { status: 429, headers: NO_STORE },
      );
    }
    return NextResponse.json(
      { found: false, reason: 'unavailable' },
      { status: 503, headers: NO_STORE },
    );
  }
}
