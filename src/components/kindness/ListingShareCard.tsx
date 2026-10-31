'use client';

import { useCallback, useRef, useState } from 'react';
import { Check, Copy, Link2, Send, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * ───────────────────────────────────────────────────────────────────────────
 * ListingShareCard — «این نیاز را پخش کن» (سایدبار دسکتاپ)
 *
 * اشتراک‌گذاری در این دامنه فقط «قشنگ» نیست؛ **کارکردِ اصلی** است: هر چه
 * لینکِ یک نیاز بیشتر پخش شود، احتمالِ برآورده‌شدنش بیشتر است. پس سه مسیرِ
 * کم‌اصطکاک داده می‌شود:
 *   ۱) اشتراکِ بومیِ دستگاه (Web Share) — روی موبایل همهٔ اپ‌ها را باز می‌کند.
 *   ۲) کپیِ لینک با بازخوردِ سبزِ درجا (fallback برای بسترِ ناامن هم دارد).
 *   ۳) ارسالِ مستقیم به تلگرام (پرکاربردترین کانالِ فارسی) با متن و لینک.
 * ───────────────────────────────────────────────────────────────────────────
 */
export function ListingShareCard({
  title,
  text,
  url,
}: {
  title: string;
  text: string;
  url: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = useCallback(async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const el = document.createElement('textarea');
        el.value = url;
        el.setAttribute('readonly', '');
        el.style.position = 'fixed';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      /* سکوتِ مؤدب */
    }
  }, [url]);

  const nativeShare = useCallback(async () => {
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({ title, text, url });
      } else {
        await copy();
      }
    } catch {
      /* لغوِ کاربر */
    }
  }, [title, text, url, copy]);

  const telegramHref = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(
    `${title} — ${text}`,
  )}`;

  return (
    <div className="overflow-hidden rounded-[22px] border border-ink-100 bg-white p-4">
      <p className="inline-flex items-center gap-1.5 text-[12.5px] font-black text-ink-900">
        <Share2 className="h-4 w-4 text-brand-600" aria-hidden="true" />
        این نیاز را پخش کن
      </p>
      <p className="mt-1 text-[10.5px] font-medium leading-5 text-ink-500">
        هر بازنشر، شانسِ رسیدنِ این نیاز به دستِ درست را بالا می‌برد.
      </p>

      <div className="mt-3 space-y-2">
        <button
          type="button"
          onClick={() => void nativeShare()}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#0D8074,#0A6E64_50%,#085C54)] text-[12px] font-extrabold text-white transition-all hover:brightness-[1.08] active:scale-[.99]"
        >
          <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
          اشتراک‌گذاری
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => void copy()}
            aria-label={copied ? 'لینک کپی شد' : 'کپی لینک'}
            className={cn(
              'inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border text-[11.5px] font-extrabold transition-colors',
              copied
                ? 'border-mint-500 bg-mint-50 text-mint-700'
                : 'border-ink-200 bg-white text-ink-600 hover:border-brand-300 hover:text-brand-700',
            )}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'کپی شد' : 'کپیِ لینک'}
          </button>

          <a
            href={telegramHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-ink-200 bg-white text-[11.5px] font-extrabold text-ink-600 transition-colors hover:border-[#2AABEE] hover:text-[#1c8fca]"
          >
            <Send className="h-3.5 w-3.5" aria-hidden="true" />
            تلگرام
          </a>
        </div>

        <p
          dir="ltr"
          className="flex items-center gap-1.5 overflow-hidden rounded-lg bg-ink-50 px-2.5 py-1.5 text-[10px] font-bold text-ink-400"
          title={url}
        >
          <Link2 className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span className="truncate">{url.replace(/^https?:\/\//, '')}</span>
        </p>
      </div>
    </div>
  );
}
