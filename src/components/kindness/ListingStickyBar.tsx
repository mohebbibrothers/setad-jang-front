'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, HandHeart, Phone, Share2 } from 'lucide-react';

/**
 * ───────────────────────────────────────────────────────────────────────────
 * ListingStickyBar — نوارِ چسبانِ پایین در موبایل (فقط <lg)
 *
 * چرا؟ در صفحهٔ جزئیات، کاربر تا پایین می‌خواند و «راه تماس» باید همیشه در
 * دستِ شست باشد. الگوی اتخاذشده از صفحهٔ حرکت (madadkar) که در همین سایت
 * جواب داده است.
 *
 * رفتارها:
 *   • بعد از عبور از هیرو ظاهر می‌شود (IntersectionObserver روی سنتینل) و با
 *     اسکرول به پایین/بالا هرگز «پرش» نمی‌کند — فقط fade/slide کوتاه.
 *   • «راه‌های ارتباط» تا بخشِ تماس اسکرول می‌کند (نه شیت) تا کاربر همان
 *     کانال‌ها را با متنِ کامل ببیند؛ اگر آگهی کانال نداشت، دکمه مخفی است.
 *   • «اعلام آمادگی» تا باکسِ اعلام می‌برد و فوکوس را روی اولین ورودی می‌گذارد.
 *   • «اشتراک‌گذاری»: Web Share API یا clipboard با بازخوردِ سبز.
 *   • respectِ safe-area (iPhone) + وقتی شیت/مودال باز است، توسطِ z-index
 *     زیرِ آن‌ها می‌ماند (z-40 در برابر z-95 پورتال‌ها).
 * ───────────────────────────────────────────────────────────────────────────
 */

export function ListingStickyBar({
  hasChannels,
  shareTitle,
  shareText,
  shareUrl,
}: {
  hasChannels: boolean;
  shareTitle: string;
  shareText: string;
  shareUrl: string;
}) {
  const [visible, setVisible] = useState(false);
  const [shared, setShared] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0, rootMargin: '-80px 0px 0px 0px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const scrollTo = useCallback((id: string, focusSelector?: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (focusSelector) {
      window.setTimeout(() => {
        document.querySelector<HTMLElement>(focusSelector)?.focus({ preventScroll: true });
      }, 550);
    }
  }, []);

  const share = useCallback(async () => {
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
        return;
      }
      await navigator.clipboard?.writeText(shareUrl);
      setShared(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setShared(false), 1800);
    } catch {
      /* کاربر دیالوگ را بست — سکوتِ مؤدب */
    }
  }, [shareTitle, shareText, shareUrl]);

  return (
    <>
      <div ref={sentinel} aria-hidden="true" className="h-px w-full" />
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-100 bg-white/95 px-3 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-10px_30px_-18px_rgba(15,20,32,.35)] backdrop-blur-lg lg:hidden"
            data-testid="kw-sticky-bar"
          >
            <div className="flex items-center gap-2">
              {hasChannels ? (
                <button
                  type="button"
                  onClick={() => scrollTo('contact')}
                  className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#0D8074,#0A6E64_50%,#085C54)] text-[13px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(13,128,116,.7)] transition-transform active:scale-[.985]"
                >
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  راه‌های ارتباط
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => scrollTo('offer', 'textarea')}
                  className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#0D8074,#0A6E64_50%,#085C54)] text-[13px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(13,128,116,.7)] transition-transform active:scale-[.985]"
                >
                  <HandHeart className="h-4 w-4" aria-hidden="true" />
                  اعلام آمادگی
                </button>
              )}

              <button
                type="button"
                onClick={() => scrollTo('offer', 'textarea')}
                aria-label="اعلام آمادگی"
                className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-ink-200 bg-white text-ink-700 transition-colors active:bg-ink-50"
              >
                <HandHeart className="h-5 w-5" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => void share()}
                aria-label={shared ? 'لینک کپی شد' : 'اشتراک‌گذاری آگهی'}
                className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl border transition-colors ${
                  shared
                    ? 'border-mint-500 bg-mint-50 text-mint-600'
                    : 'border-ink-200 bg-white text-ink-700 active:bg-ink-50'
                }`}
              >
                {shared ? <Check className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
