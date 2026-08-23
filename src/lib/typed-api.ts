/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  typed-api — لایه‌ی تایپ‌شده روی `apiFetch`
 *
 *  چرا این فایل وجود دارد
 *  ───────────────────────
 *  `src/types/api.ts` مستقیماً از OpenAPI بک‌اند تولید می‌شود و کاملاً دقیق
 *  است، ولی مصرف مستقیمش زشت و پرجزئیات است:
 *
 *      type R = paths['/api/v1/madadkar/campaigns/']['get']
 *                    ['responses'][200]['content']['application/json']['data']
 *
 *  این ماژول همان دقت را با ارگونومی خوب ارائه می‌دهد:
 *
 *      const campaigns = await apiGet('/api/v1/madadkar/campaigns/', {
 *        query: { page_size: 8 },          // ✅ کلیدها و نوع‌ها بررسی می‌شوند
 *      });                                  // ✅ نوع خروجی خودکار استنتاج می‌شود
 *
 *      const campaign = await apiGet('/api/v1/madadkar/campaigns/{slug}/', {
 *        params: { slug },                  // ✅ اجباری، چون مسیر پارامتر دارد
 *      });
 *
 *      await apiPost('/api/v1/auth/login/password/', {
 *        body: { identifier, password },    // ✅ فیلدهای الزامی چک می‌شوند
 *      });
 *
 *  چهار تضمین کلیدی
 *  ─────────────────
 *   1. مسیر باید در اسکیما وجود داشته باشد، وگرنه خطای کامپایل.
 *   2. متد باید روی آن مسیر تعریف شده باشد (نمی‌شود روی مسیر فقط-GET پست زد).
 *   3. پارامترهای مسیر (`{slug}`) در سطح تایپ اجباری‌اند و درون‌ریزی می‌شوند.
 *   4. نوع پاسخ **بعد از باز شدن پاکت** استنتاج می‌شود — یعنی همان چیزی که
 *      `apiFetch` واقعاً برمی‌گرداند (`data`)، نه کل envelope.
 *
 *  اگر روزی بک‌اند فیلدی را عوض کند، `npm run api:types` آن را وارد می‌کند و
 *  `npm run typecheck` دقیقاً جایی را نشان می‌دهد که باید اصلاح شود.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { apiFetch, safeApiFetch, type FetchOptions } from './api';
import type { paths } from '@/types/api';

/* ───────────────────────────────────────────────────────────────────────── */
/*  ابزارهای سطح تایپ                                                        */
/* ───────────────────────────────────────────────────────────────────────── */

/** همه‌ی مسیرهای موجود در اسکیما. */
export type ApiPath = keyof paths;

/** متدهای HTTP که در اسکیما مدل شده‌اند. */
export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

/** مسیرهایی که متد `M` را پشتیبانی می‌کنند. */
export type PathsWith<M extends HttpMethod> = {
  [P in ApiPath]: paths[P] extends { [K in M]: object } ? P : never;
}[ApiPath];

type Operation<P extends ApiPath, M extends HttpMethod> = paths[P] extends {
  [K in M]: infer O;
}
  ? O
  : never;

/** بدنه‌ی JSON پاسخ موفق (اولین کد ۲xx موجود). */
type SuccessBody<O> = O extends { responses: infer R }
  ? R extends { 200: { content: { 'application/json': infer C } } }
    ? C
    : R extends { 201: { content: { 'application/json': infer C } } }
      ? C
      : R extends { 202: { content: { 'application/json': infer C } } }
        ? C
        : R extends { 204: unknown }
          ? void
          : unknown
  : unknown;

/**
 * باز کردن پاکت استاندارد بک‌اند.
 * `apiFetch` خودش `data` را برمی‌گرداند، پس تایپ هم باید همان را نشان دهد.
 */
type Unwrap<T> = T extends { data?: infer D } ? Exclude<D, undefined> : T;

/** نوع نهایی‌ای که فراخوانی برمی‌گرداند. */
export type ApiResult<P extends ApiPath, M extends HttpMethod> = Unwrap<
  SuccessBody<Operation<P, M>>
>;

/** پارامترهای مسیر (`{slug}`، `{id}`، …) اگر وجود داشته باشند. */
type PathParams<P extends ApiPath, M extends HttpMethod> =
  Operation<P, M> extends { parameters: { path: infer PP } }
    ? PP extends undefined | never
      ? never
      : PP
    : never;

/** پارامترهای کوئری، اگر تعریف شده باشند. */
type QueryParams<P extends ApiPath, M extends HttpMethod> =
  Operation<P, M> extends { parameters: { query?: infer Q } }
    ? Q extends undefined | never
      ? never
      : NonNullable<Q>
    : never;

/** بدنه‌ی درخواست JSON، اگر تعریف شده باشد. */
type RequestBody<P extends ApiPath, M extends HttpMethod> =
  Operation<P, M> extends { requestBody?: infer B }
    ? NonNullable<B> extends { content: { 'application/json': infer C } }
      ? C
      : never
    : never;

/** کلیدهای اجباری فقط وقتی اضافه می‌شوند که واقعاً معنی داشته باشند. */
type MaybeRequired<K extends string, T> = [T] extends [never] ? object : { [Key in K]: T };
type MaybeOptional<K extends string, T> = [T] extends [never] ? object : { [Key in K]?: T };

/** گزینه‌های فراخوانی — پارامتر مسیر اجباری، کوئری و بدنه اختیاری. */
export type CallOptions<P extends ApiPath, M extends HttpMethod> = Omit<
  FetchOptions,
  'method' | 'body'
> &
  MaybeRequired<'params', PathParams<P, M>> &
  MaybeOptional<'query', QueryParams<P, M>> &
  MaybeOptional<'body', RequestBody<P, M>> & {
    /** ارسال به‌صورت multipart (آپلود فایل). با `body` هم‌زمان استفاده نشود. */
    formData?: FormData;
  };

/* ───────────────────────────────────────────────────────────────────────── */
/*  ابزارهای زمان اجرا                                                       */
/* ───────────────────────────────────────────────────────────────────────── */

/** پیشوندی که `apiFetch` خودش اضافه می‌کند و باید از کلید اسکیما جدا شود. */
const API_PREFIX = '/api/v1';

/**
 * جای‌گذاری پارامترهای مسیر و حذف پیشوند `/api/v1`.
 *
 *   buildPath('/api/v1/r4j/criminals/{lookup}/', { lookup: 'ali-x' })
 *     → '/r4j/criminals/ali-x/'
 *
 * هر مقدار با `encodeURIComponent` امن‌سازی می‌شود تا اسلاگ فارسی یا حاوی
 * کاراکتر ویژه، مسیر را نشکند.
 */
export function buildPath(template: string, params?: Record<string, unknown>): string {
  const withParams = template.replace(/\{([^}]+)\}/g, (_match, key: string) => {
    const value = params?.[key];
    if (value === undefined || value === null || value === '') {
      throw new Error(`پارامتر مسیر «${key}» برای ${template} داده نشده است`);
    }
    return encodeURIComponent(String(value));
  });

  return withParams.startsWith(API_PREFIX) ? withParams.slice(API_PREFIX.length) : withParams;
}

/**
 * ساخت رشته‌ی کوئری.
 *   • `undefined` و `null` حذف می‌شوند (نه اینکه به رشته‌ی "undefined" تبدیل شوند)
 *   • آرایه‌ها به کلیدهای تکراری باز می‌شوند: `?tag=a&tag=b` (قرارداد DRF)
 *   • بولین‌ها به `true`/`false` تبدیل می‌شوند
 *   • ترتیب کلیدها مرتب می‌شود تا URL برای کش Next پایدار بماند
 */
export function buildQuery(query?: Record<string, unknown>): string {
  if (!query) return '';
  const sp = new URLSearchParams();

  for (const key of Object.keys(query).sort()) {
    const value = query[key];
    if (value === undefined || value === null || value === '') continue;

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item === undefined || item === null || item === '') continue;
        sp.append(key, String(item));
      }
    } else {
      sp.append(key, String(value));
    }
  }

  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  هسته                                                                     */
/* ───────────────────────────────────────────────────────────────────────── */

function call<P extends ApiPath, M extends HttpMethod>(
  method: M,
  path: P,
  options?: CallOptions<P, M>,
): Promise<ApiResult<P, M>> {
  const { params, query, body, formData, ...rest } = (options ?? {}) as {
    params?: Record<string, unknown>;
    query?: Record<string, unknown>;
    body?: unknown;
    formData?: FormData;
  } & FetchOptions;

  const url = `${buildPath(path as string, params)}${buildQuery(query)}`;

  const init: FetchOptions = { ...rest, method: method.toUpperCase() };
  if (formData) init.body = formData;
  else if (body !== undefined) init.body = JSON.stringify(body);

  return apiFetch<ApiResult<P, M>>(url, init);
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  API عمومی                                                                */
/* ───────────────────────────────────────────────────────────────────────── */

export function apiGet<P extends PathsWith<'get'>>(
  path: P,
  options?: CallOptions<P, 'get'>,
): Promise<ApiResult<P, 'get'>> {
  return call('get', path, options);
}

export function apiPost<P extends PathsWith<'post'>>(
  path: P,
  options?: CallOptions<P, 'post'>,
): Promise<ApiResult<P, 'post'>> {
  return call('post', path, options);
}

export function apiPatch<P extends PathsWith<'patch'>>(
  path: P,
  options?: CallOptions<P, 'patch'>,
): Promise<ApiResult<P, 'patch'>> {
  return call('patch', path, options);
}

export function apiPut<P extends PathsWith<'put'>>(
  path: P,
  options?: CallOptions<P, 'put'>,
): Promise<ApiResult<P, 'put'>> {
  return call('put', path, options);
}

export function apiDelete<P extends PathsWith<'delete'>>(
  path: P,
  options?: CallOptions<P, 'delete'>,
): Promise<ApiResult<P, 'delete'>> {
  return call('delete', path, options);
}

/**
 * نسخه‌ی «هرگز throw نکن» برای لودرهای SSR.
 * اگر بک‌اند در دسترس نباشد `null` برمی‌گرداند تا صفحه به‌جای ۵۰۰ شدن،
 * حالت خالی را رندر کند.
 */
export function apiGetSafe<P extends PathsWith<'get'>>(
  path: P,
  options?: CallOptions<P, 'get'>,
): Promise<ApiResult<P, 'get'> | null> {
  const { params, query, ...rest } = (options ?? {}) as {
    params?: Record<string, unknown>;
    query?: Record<string, unknown>;
  } & FetchOptions;

  const url = `${buildPath(path as string, params)}${buildQuery(query)}`;
  return safeApiFetch<ApiResult<P, 'get'>>(url, { ...rest, method: 'GET' });
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  کمک‌تایپ‌های پرکاربرد                                                     */
/* ───────────────────────────────────────────────────────────────────────── */

/** نوع یک ردیف از پاسخ صفحه‌بندی‌شده. */
export type RowOf<T> = T extends { results?: readonly (infer R)[] } ? R : never;

/** نوع ردیف لیست یک مسیر GET — میان‌بر پرکاربرد. */
export type ListRow<P extends PathsWith<'get'>> = RowOf<ApiResult<P, 'get'>>;
