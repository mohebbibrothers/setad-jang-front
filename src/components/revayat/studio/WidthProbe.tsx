'use client';

import { Bug, ClipboardCopy, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * ═══════════════════════════════════════════════════════════════════
 * WidthProbe — پروبِ تشخیصِ بیرون‌زدگیِ افقی (فقطِ ابزارِ توسعه)
 *
 * چرا: باگ‌های overflowِ افقی گاهی فقط روی دستگاهِ خاصِ کاربر (مرورگر/
 * فونت/مقیاس) بازتولید می‌شوند و در آزمایشگاه دیده نمی‌شوند. این پروب
 * به کاربر اجازه می‌دهد با افزودنِ `?debugwidth=1` به نشانی (یا
 * localStorage: besat.width-probe = 1) گزارشِ زنده‌ی «کدام المان از
 * viewport پهن‌تر است» را روی همان گوشی بگیرد و با یک دکمه کپی کند تا
 * برای توسعه بفرستد.
 *
 * مصونیت: به‌صورت پیش‌فرض هیچ‌چیز رندر نمی‌کند (خروجی null) و فقط با
 * فلگ فعال می‌شود؛ روی SSR+کلاینتِ معمولی صفر اثر دارد و هیدراتیشن را
 * نمی‌شکند چون گزارش فقط داخل effect ساخته می‌شود.
 * ═══════════════════════════════════════════════════════════════════
 */

const STORAGE_KEY = 'besat.width-probe';

interface Offender {
  tag: string;
  cls: string;
  over: number;
  side: 'L' | 'R';
}

function isEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const qs = new URLSearchParams(window.location.search);
    if (qs.get('debugwidth') === '1') {
      window.localStorage.setItem(STORAGE_KEY, '1');
      return true;
    }
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function scan(): { inner: number; scroll: number; offenders: Offender[] } {
  const inner = window.innerWidth;
  const scroll = document.documentElement.scrollWidth;
  const offenders: Offender[] = [];
  const all = document.querySelectorAll('body *');
  for (const el of all) {
    if ((el as HTMLElement).dataset?.widthProbe === 'self') continue;
    const r = el.getBoundingClientRect();
    if (r.width <= 4) continue;
    const overR = r.right - inner;
    const overL = -r.left;
    // کشورِ drawerهای آف‌کانوسِ عمدی (منوی موبایل) نادیده گرفته می‌شود؟ خیر —
    // فقط گزارش می‌کنیم؛ انسان/توسعه‌دهنده تصمیم می‌گیرد. بدترین‌ها اول.
    if (overR > 2 || overL > 2) {
      offenders.push({
        tag: el.tagName.toLowerCase(),
        cls: (typeof el.className === 'string' ? el.className : '').slice(0, 80),
        over: Math.round(Math.max(overR, overL)),
        side: overL > 2 ? 'L' : 'R',
      });
    }
  }
  offenders.sort((a, b) => b.over - a.over);
  return { inner, scroll, offenders: offenders.slice(0, 5) };
}

/** toast شناورِ گزارش — default off، فقط با فلگِ دیباگ فعال می‌شود */
export function WidthProbe() {
  const [enabled, setEnabled] = useState(false);
  const [report, setReport] = useState<ReturnType<typeof scan> | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isEnabled()) return;
    setEnabled(true);
    const run = () => setReport(scan());
    run();
    const t = window.setInterval(run, 2000);
    window.addEventListener('resize', run);
    return () => {
      window.clearInterval(t);
      window.removeEventListener('resize', run);
    };
  }, []);

  if (!enabled || !report) return null;

  const overflowing = report.scroll > report.inner;
  const text = [
    `width-probe | viewport=${report.inner} scrollWidth=${report.scroll} ${overflowing ? 'OVERFLOW+' + (report.scroll - report.inner) : 'OK'}`,
    ...report.offenders.map((o) => `${o.side}+${o.over} <${o.tag}> ${o.cls}`),
  ].join('\n');

  return (
    <div
      data-width-probe="self"
      role="status"
      className={cn(
        'fixed inset-x-3 bottom-20 z-[90] rounded-2xl border px-3.5 py-3 text-left shadow-xl backdrop-blur-xl',
        overflowing ? 'border-rose-300 bg-rose-50/95' : 'border-emerald-300 bg-emerald-50/95',
      )}
      dir="ltr"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-ink-800">
          <Bug className="h-3.5 w-3.5" />
          width-probe: {report.inner} → {report.scroll}{' '}
          {overflowing ? `(+${report.scroll - report.inner})` : 'OK'}
        </span>
        <span className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard
                ?.writeText(text)
                .then(() => {
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 1500);
                })
                .catch(() => {});
            }}
            className="inline-flex h-7 items-center gap-1 rounded-lg bg-white px-2 text-[10px] font-extrabold text-ink-700 ring-1 ring-inset ring-ink-200"
          >
            <ClipboardCopy className="h-3 w-3" />
            {copied ? 'کپی شد' : 'کپی گزارش'}
          </button>
          <button
            type="button"
            onClick={() => setEnabled(false)}
            aria-label="بستن پروب عرض"
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-ink-500 ring-1 ring-inset ring-ink-200"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </span>
      </div>
      {report.offenders.length > 0 ? (
        <ul className="mt-1.5 space-y-0.5 font-mono text-[9.5px] leading-4 text-ink-600">
          {report.offenders.map((o, i) => (
            <li key={i} className="truncate">
              {o.side}+{o.over} &lt;{o.tag}&gt; {o.cls}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-[10px] font-bold text-emerald-700">no element exceeds viewport</p>
      )}
    </div>
  );
}
