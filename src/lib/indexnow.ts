import { siteConfig } from '@/lib/site';

/**
 * IndexNow — اطلاع فوریِ تغییرِ محتوا به موتورهای جستجو.
 *
 * IndexNow پروتکلی باز است که Bing، Yandex، Naver، Seznam و Yep آن را
 * مصرف می‌کنند (و سیگنال‌هایش — غیرمستقیم — به خزنده‌ی گوگل هم می‌رسد).
 * به‌جای انتظارِ چرخه‌ی خزشِ هفته‌ها، موتورها در چند دقیقه از تغییر
 * باخبر می‌شوند.
 *
 * PROTOCOL
 * ────────
 *   POST https://api.indexnow.org/IndexNow
 *   { host, key, keyLocation, urlList }
 *
 * VERIFICATION
 *   موتورها `https://besat.me/<key>.txt` را می‌خوانند و انتظار دارند
 *   بدنه دقیقاً برابر خودِ کلید باشد. فایل در public/ قرار دارد —
 *   نامِ فایل و مقدارِ کلید باید همین مقدارِ ثابت بماند.
 */

export const INDEXNOW_KEY = 'ff3bdd090c13ad9f12a916c874a67d37';

const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/IndexNow';
const MAX_URLS_PER_CALL = 10_000; // per IndexNow spec

function hostFromSiteUrl(): string {
  try {
    return new URL(siteConfig.url).host;
  } catch {
    return 'besat.me';
  }
}

export type IndexNowSubmitResult = {
  ok: boolean;
  status: number;
  submitted: string[];
};

export async function submitToIndexNow(urls: string[]): Promise<IndexNowSubmitResult> {
  const base = siteConfig.url.replace(/\/+$/, '');
  const absoluteUrls = urls
    .filter((u): u is string => typeof u === 'string' && u.length > 0)
    .map((u) => (u.startsWith('http') ? u : `${base}${u.startsWith('/') ? '' : '/'}${u}`))
    .slice(0, MAX_URLS_PER_CALL);

  const res = await fetch(INDEXNOW_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: hostFromSiteUrl(),
      key: INDEXNOW_KEY,
      keyLocation: `${base}/${INDEXNOW_KEY}.txt`,
      urlList: absoluteUrls,
    }),
    cache: 'no-store',
  });

  return { status: res.status, ok: res.ok, submitted: absoluteUrls };
}

// ─── نگاشتِ رویدادهای revalidate به URLهای قابل‌فهرست ───────────────────
// وقتی بک‌اند پس از انتشار به /api/revalidate می‌کوبد، بلافاصله همان
// صفحات را به IndexNow هم معرفی می‌کنیم تا نمایهٔ موتورها همان لحظه
// تازه شود. تگ‌های مقصدِ کش به «بخشِ عمومیِ سایت» نگاشت می‌شوند و
// pathهای صریح هم — فقط اگر مسیرِ عمومیِ قابل‌نمایه باشند — اضافه می‌شوند.
const TAG_TO_SECTION: Record<string, string> = {
  homepage: '/',
  tabyin: '/tabyin',
  lms: '/lms',
  courses: '/lms',
  r4j: '/r4j',
  criminals: '/r4j',
  madadkar: '/madadkar',
  campaigns: '/madadkar',
};

// بخش‌هایی که صفحه‌ی واقعیِ قابل‌نمایه دارند (نه API، نه ادمین، نه پنل).
const PUBLIC_SECTIONS = ['/tabyin', '/r4j', '/lms', '/madadkar', '/about-besat'];

const SAFE_PATH_RE = /^\/(?!\/)[^\s]{1,299}$/;

function isIndexablePath(path: string): boolean {
  if (!SAFE_PATH_RE.test(path)) return false;
  if (path === '/') return true;
  return PUBLIC_SECTIONS.some((s) => path === s || path.startsWith(`${s}/`));
}

/**
 * URLهایی که باید در IndexNow ثبت شوند، بر پایه‌ی payloadِ revalidation.
 * همیشه ریشه و sitemap همراه می‌آیند تا خزنده‌ها نقشه‌ی تازه را هم بگیرند.
 * خروجی: دِدِیوپ‌شده، ایمن (فقط مسیرهای عمومی)، و سقف‌دار.
 */
export function indexNowUrlsFor(
  tags: readonly string[],
  paths: readonly string[],
  hardCap = 50,
): string[] {
  const out = new Set<string>(['/', '/sitemap.xml']);
  for (const rawTag of tags) {
    const section = TAG_TO_SECTION[String(rawTag).trim()];
    if (section) out.add(section);
  }
  for (const rawPath of paths) {
    const p = String(rawPath).trim();
    if (isIndexablePath(p)) out.add(p);
    if (out.size >= hardCap) break;
  }
  return [...out].slice(0, hardCap);
}
