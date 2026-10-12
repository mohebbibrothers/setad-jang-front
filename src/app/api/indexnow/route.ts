import { NextRequest, NextResponse } from 'next/server';
import { submitToIndexNow } from '@/lib/indexnow';

export const dynamic = 'force-dynamic';

/**
 * IndexNow submission endpoint (سرپوشِ راحتی روی src/lib/indexnow).
 *
 * کاربرد:
 *   GET  /api/indexnow            ← صفحه‌ی اصلی + ایندکس تبیین (یک‌بار پس از دیپلوی)
 *   POST /api/indexnow { urls }   ← لیست دلخواه؛ در صورت تنظیمِ
 *                                   INDEXNOW_SECRET با Bearer محافظت می‌شود.
 *
 * جزئیاتِ پروتکل و فایلِ کلید: src/lib/indexnow.ts
 */

export async function GET() {
  const result = await submitToIndexNow(['/', '/tabyin', '/tabyin/new']);
  return NextResponse.json({ success: result.ok, ...result });
}

export async function POST(request: NextRequest) {
  const requiredSecret = process.env.INDEXNOW_SECRET || '';
  if (requiredSecret) {
    const auth = request.headers.get('authorization') || '';
    const bearer = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7) : '';
    if (bearer !== requiredSecret) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
  }

  let payload: { urls?: string[] } = {};
  try {
    payload = (await request.json()) as { urls?: string[] };
  } catch {
    /* بدنهٔ خالی مشکلی نیست — پیش‌فرض‌ها می‌آیند */
  }

  const urls =
    Array.isArray(payload.urls) && payload.urls.length
      ? payload.urls
      : ['/', '/tabyin', '/tabyin/new'];

  const result = await submitToIndexNow(urls);
  return NextResponse.json({ success: result.ok, ...result });
}
