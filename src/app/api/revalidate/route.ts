import { revalidatePath, revalidateTag } from 'next/cache';
import { after, NextRequest, NextResponse } from 'next/server';
import { indexNowUrlsFor, submitToIndexNow } from '@/lib/indexnow';

export const dynamic = 'force-dynamic';

type RevalidatePayload = {
  tags?: string[];
  paths?: string[];
};

const MAX_ITEMS = 50;
const SAFE_TAG = /^[a-zA-Z0-9:_-]{1,80}$/;

function configuredSecret(): string {
  return process.env.REVALIDATE_SECRET || process.env.NEXT_REVALIDATE_SECRET || '';
}

function unauthorized() {
  return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
}

function cleanTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  return [...new Set(tags.filter((x): x is string => typeof x === 'string').map((x) => x.trim()))]
    .filter((x) => SAFE_TAG.test(x))
    .slice(0, MAX_ITEMS);
}

function cleanPaths(paths: unknown): string[] {
  if (!Array.isArray(paths)) return [];
  return [...new Set(paths.filter((x): x is string => typeof x === 'string').map((x) => x.trim()))]
    .filter((x) => x.startsWith('/') && !x.startsWith('//') && x.length <= 300)
    .slice(0, MAX_ITEMS);
}

export async function POST(request: NextRequest) {
  const secret = configuredSecret();
  if (!secret) {
    return NextResponse.json(
      { success: false, message: 'Revalidation is not configured.' },
      { status: 503 },
    );
  }

  const auth = request.headers.get('authorization') || '';
  const headerSecret = request.headers.get('x-revalidate-secret') || '';
  const bearer = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7) : '';

  if (bearer !== secret && headerSecret !== secret) {
    return unauthorized();
  }

  let payload: RevalidatePayload;
  try {
    payload = (await request.json()) as RevalidatePayload;
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON payload.' }, { status: 400 });
  }

  const tags = cleanTags(payload.tags);
  const paths = cleanPaths(payload.paths);

  if (!tags.length && !paths.length) {
    return NextResponse.json(
      { success: false, message: 'At least one valid tag or path is required.' },
      { status: 400 },
    );
  }

  for (const tag of tags) revalidateTag(tag);
  for (const path of paths) revalidatePath(path);

  // ─── IndexNow خودکار پس از هر انتشار ──────────────────────────────
  // پس از ارسالِ پاسخ، URLهای بروزشده را به موتورهای IndexNow اعلام
  // می‌کنیم (Bing/Yandex/…) تا نمایهٔ جستجو در همان لحظه تازه شود.
  // این اعلان کاملاً fire-and-forget است: خطای آن هرگز نباید جریانِ
  // اصلیِ revalidation را شکست دهد.
  after(async () => {
    try {
      await submitToIndexNow(indexNowUrlsFor(tags, paths));
    } catch {
      /* سکوتِ عمدی — این لبه هرگز روی مسیر اصلی اثر نمی‌گذارد */
    }
  });

  return NextResponse.json({ success: true, revalidated: { tags, paths } });
}
