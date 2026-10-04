'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

/**
 * متنِ «این کلاس برای چیست؟» با کلمپِ هوشمندِ اندازه‌گیری‌شده.
 *
 * مشکل: توضیحاتِ بعضی کلاس‌ها آن‌قدر بلند است که قبل از رسیدن به «نقشه‌ی
 * مسیر» صفحه را بی‌نهایت می‌کشد — مخصوصاً روی موبایل. راه‌حل: متن روی
 * موبایل بعد از ۶ خط و روی دسکتاپ بعد از ۷ خط با یک محوشدگیِ نرم و
 * دکمه‌ی «بیشتر بخوانید» کلمپ می‌شود؛ با یک لمس متنِ کامل در همان کارت
 * باز و با «کمتر بخوانید» دوباره جمع می‌شود. اندازه‌گیریِ واقعیِ سرریز انجام
 * می‌شود، پس برای متن‌های کوتاه دقیقاً همان رندرِ سابق را می‌بینیم —
 * نه دکمه‌ی اضافه، نه فضای مرده. ResizeObserver کلمپ را به چرخشِ
 * دستگاه و تغییرِ عرض هم واکنش‌گرا نگه می‌دارد.
 */
export function CourseAboutText({ text }: { text: string }) {
  const textId = useId();
  const pRef = useRef<HTMLParagraphElement | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    if (expanded) return; // در حالتِ باز، سقفی برای سنجش وجود ندارد.
    const el = pRef.current;
    if (!el) return;
    const measure = () => setOverflows(el.scrollHeight - el.clientHeight > 6);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text, expanded]);

  return (
    <div
      className="relative mt-3 overflow-hidden rounded-2xl border border-ink-100 bg-white px-5 py-4 shadow-[0_10px_28px_-24px_rgba(11,53,48,.35)]"
      data-testid="course-about-card"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-1 bg-gradient-to-b from-brand-400 via-mint-400 to-brand-500"
      />
      <div className="relative">
        <p
          ref={pRef}
          id={textId}
          className={`whitespace-pre-line text-[13px] leading-7 text-ink-700 md:text-[13.5px] md:leading-8 ${
            expanded ? '' : 'md:line-clamp-7 line-clamp-6'
          }`}
        >
          {text}
        </p>
        {!expanded && overflows && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white via-white/90 to-transparent"
          />
        )}
      </div>
      {overflows && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={textId}
          onClick={() => setExpanded((v) => !v)}
          data-testid="course-about-toggle"
          className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-full bg-mint-50 px-4 text-[12px] font-extrabold text-mint-800 ring-1 ring-mint-200 transition hover:bg-mint-100 hover:ring-mint-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-500"
        >
          {expanded ? (
            <>
              کمتر بخوانید
              <ChevronUp className="h-4 w-4" aria-hidden="true" />
            </>
          ) : (
            <>
              بیشتر بخوانید
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </>
          )}
        </button>
      )}
    </div>
  );
}
