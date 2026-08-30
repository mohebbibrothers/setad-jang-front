'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, FileText, MessageSquareText, Paperclip, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch, type Paginated } from '@/lib/api';
import { formatRelativeFa } from '@/lib/persian-time';
import { toPersianDigits, truncate } from '@/lib/utils';
import { type MySubmissionItem } from '@/lib/studio';
import { StatusChip } from './StatusChip';

/**
 * ═══════════════════════════════════════════════════════════════════
 * MySubmissions — «روایت‌های من»: ردیابِ زنده‌ی وضعیتِ بررسی
 *
 * GET /tabyin/me/submissions/ (صفحه‌ی اول، ۵۰ تای اخیر) — چرا اینجا
 * مهمه؟ چون بک‌اند مدلِ کاری‌اش «انتشار پس از تأیید مدیر»ست و کاربر
 * باید بداند روایتش کجاست: در انتظار بررسی / تأیید و منتشر شده /
 * بررسی شد — منتشر نشد (با یادداشتِ مدیر، admin_note). همین سه وضعیت
 * کل حلقه‌ی اعتمادِ سامانه است و بدون نمایشِ آن، تجربه‌ی ارسال ناقص
 * می‌ماند. این پنل همان حلقه را کامل می‌کند.
 * ═══════════════════════════════════════════════════════════════════
 */

/* چیپِ وضعیت از منبعِ واحدِ StatusChip — یک‌دست با داشبورد /tabyin/mine */

function RowSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex items-center gap-3 rounded-2xl border border-ink-100 bg-white p-4"
    >
      <div className="h-9 w-9 animate-pulse rounded-xl bg-ink-100" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-2/5 animate-pulse rounded-full bg-ink-100" />
        <div className="h-2.5 w-1/4 animate-pulse rounded-full bg-ink-100/80" />
      </div>
      <div className="h-6 w-20 animate-pulse rounded-full bg-ink-100" />
    </div>
  );
}

/** کلیدِ ذخیره‌ی وضعیتِ باز/جمع‌بودنِ فهرست — نسخه‌بندی‌شده برای مهاجرتِ آینده */
const COLLAPSE_KEY = 'besat.tabyin.mysubs.collapsed.v1';

export function MySubmissions({ refreshKey }: { refreshKey: number }) {
  const [items, setItems] = useState<MySubmissionItem[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(false);
  const seqRef = useRef(0);
  /* جمع‌شدگی — ترجیحِ کاربر در localStorage می‌ماند */
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(COLLAPSE_KEY) === '1') setCollapsed(true);
    } catch {
      /* حافظه در دسترس نیست — پیش‌فرضِ باز کافی است */
    }
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const load = useCallback(async () => {
    const seq = ++seqRef.current;
    setError(false);
    try {
      const data = await apiFetch<Paginated<MySubmissionItem>>(
        '/tabyin/me/submissions/?page_size=50&page=1',
      );
      if (seq !== seqRef.current) return;
      setItems(Array.isArray(data?.results) ? data.results : []);
      setTotal(data?.count ?? 0);
    } catch {
      if (seq !== seqRef.current) return;
      setItems([]);
      setError(true);
    }
  }, []);

  useEffect(() => {
    setItems(null);
    void load();
  }, [load, refreshKey]);

  // فاصله‌ی بالایی را گریدِ والد (gap) می‌دهد — خودمان mt نمی‌گذاریم تا در
  // چیدمانِ موبایلِ استودیو (فرم → پیش‌نمایش → روایت‌های من) و چیدمانِ
  // دسکتاپ (ردیفِ دومِ ستونِ فرم) یک‌ریتمِ ۲۰px حفظ شود.
  return (
    <section aria-label="روایت‌های ارسالی من" className="mb-12">
      <div className="mb-3.5 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-expanded={!collapsed}
          aria-controls="my-subs-body"
          className="group flex min-w-0 items-center gap-2 rounded-xl text-right focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-mint-50 text-mint-600 ring-1 ring-inset ring-mint-400/40">
            <FileText className="h-4 w-4" />
          </span>
          <h2 className="flex items-center gap-1.5 text-[15px] font-black text-ink-900">
            روایت‌های من
            {total > 0 ? (
              <span className="inline-flex items-center rounded-full bg-mint-50 px-2 py-0.5 text-[11px] font-extrabold tabular-nums text-mint-700 ring-1 ring-inset ring-mint-400/40">
                ({toPersianDigits(total)})
              </span>
            ) : null}
          </h2>
          <motion.span
            animate={{ rotate: collapsed ? -90 : 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="rounded-full p-1 text-ink-300 transition-colors group-hover:bg-ink-50 group-hover:text-ink-600"
            aria-hidden
          >
            <ChevronDown className="h-4 w-4" />
          </motion.span>
        </button>
        {total > 0 ? (
          <span className="flex items-center gap-2">
            <span className="text-[11px] font-bold tabular-nums text-ink-400" aria-live="polite">
              {items && total > items.length
                ? `${toPersianDigits(items.length)} از ${toPersianDigits(total)} روایت`
                : `${toPersianDigits(total)} روایت`}
            </span>
            <Link
              href="/tabyin/mine"
              className="rounded-full bg-white px-2.5 py-1 text-[10.5px] font-extrabold text-brand-700 ring-1 ring-inset ring-brand-600/20 transition-colors hover:bg-brand-50"
            >
              مدیریت کامل ←
            </Link>
          </span>
        ) : null}
      </div>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            id="my-subs-body"
            key="my-subs-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="pb-2">
              {items === null ? (
                <div className="space-y-2.5" role="status" aria-label="در حال دریافت روایت‌های من">
                  <RowSkeleton />
                  <RowSkeleton />
                </div>
              ) : error ? (
                <div className="rounded-3xl border border-rose-100 bg-rose-50/50 px-5 py-8 text-center">
                  <p className="text-[13px] font-black text-ink-900">فهرست روایت‌ها نیامد</p>
                  <p className="mt-1 text-[12px] font-semibold text-ink-500">
                    ارتباط با سرور برقرار نشد؛ معمولاً با یک تلاشِ دوباره درست می‌شود.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setItems(null);
                      void load();
                    }}
                    className="mt-4 inline-flex h-9 items-center gap-2 rounded-full bg-brand-600 px-4 text-[12px] font-extrabold text-white transition-colors hover:bg-brand-700"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    تلاش دوباره
                  </button>
                </div>
              ) : items.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-ink-200 bg-ink-50/40 px-5 py-8 text-center">
                  <p className="text-[13px] font-black text-ink-900">هنوز روایتی نفرستاده‌ای</p>
                  <p className="mt-1 text-[12px] font-semibold leading-6 text-ink-500">
                    اولین روایتت را از فرمِ بالا بنویس؛ اینجا وضعیتِ بررسی‌اش را می‌بینی.
                  </p>
                </div>
              ) : (
                <ol className="space-y-2.5">
                  {items.map((s) => (
                    <li
                      key={s.id}
                      className="group rounded-2xl border border-ink-100 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,.04)] transition-shadow hover:shadow-[0_8px_24px_-12px_rgba(16,24,40,.18)]"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-600/15">
                          <FileText className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-black text-ink-900">
                            {s.title?.trim() || '(بدون عنوان)'}
                          </p>
                          <p className="mt-0.5 flex items-center gap-2 text-[11px] font-bold text-ink-400">
                            {s.created_at ? <span>{formatRelativeFa(s.created_at)}</span> : null}
                            {typeof s.attachments_count === 'number' && s.attachments_count > 0 ? (
                              <span className="inline-flex items-center gap-0.5">
                                <Paperclip className="h-3 w-3" />
                                {toPersianDigits(s.attachments_count)} پیوست
                              </span>
                            ) : null}
                          </p>
                        </div>
                        <StatusChip status={s.submission_status} />
                      </div>

                      {s.submission_status === 'rejected' && s.admin_note?.trim() ? (
                        <div className="mt-3 flex items-start gap-2 rounded-xl bg-rose-50/70 px-3 py-2.5 text-[11.5px] font-semibold leading-6 text-rose-800 ring-1 ring-inset ring-rose-100">
                          <MessageSquareText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" />
                          <p>
                            <span className="font-black">یادداشت بررسی: </span>
                            {truncate(s.admin_note.trim(), 400)}
                          </p>
                        </div>
                      ) : null}

                      {s.submission_status === 'approved' ? (
                        <p className="mt-2.5 text-[11px] font-bold text-emerald-700">
                          روایتت منتشر شده و در فیدِ روایت‌ها و دیوارِ جهاد تبیین دیده می‌شود. مرسی
                          که روایت کردی. ✨
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
