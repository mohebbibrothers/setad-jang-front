import { NextRequest, NextResponse } from 'next/server';
import { feedFiltersFromSearchParams } from '@/lib/revayat';
import { countVisibleFeedTotal } from '@/lib/tabyin-data';

/** One display-page response supplies the full verified count; no corpus scan. */

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
      { success: false, status_code: 503, message: 'Verified display count unavailable' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
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
