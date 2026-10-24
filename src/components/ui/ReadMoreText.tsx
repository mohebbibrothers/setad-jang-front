'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';

/**
 * ReadMoreText — «دربارهٔ این حرکت» بدون درهم‌ریختنِ ساختار صفحه
 * ─────────────────────────────────────────────────────────────────────────
 * قراردادِ طراحی (متناسب با زبان بصریِ سایت):
 *   - متن کوتاه (≤ آستانه) → بی‌دست‌خوردگی رندر می‌شود؛ هیچ دکمه‌ای ظاهر نمی‌شود.
 *   - متن بلند → فقط ۴ خطِ اول دیده می‌شود (12۸px با leading-8 = استانداردِ
 *     کارت‌های سایت) + هاله‌ی محوِ پایانی که «ادامه دارد» را کنایه می‌کند.
 *   - «نمایش بیشتر/کمتر» با لمسِ فنری و بدون پرشِ ناگهانیِ صفحه باز و بسته
 *     می‌کند (انیمیشنِ ارتفاعِ «auto») و «…» همیشه داخلِ متن نیست — توسط
 *     لایه‌ی گرادیانی رندر می‌شود تا متنِ کامل در DOM/SEO سر جایش بماند.
 *   - aria-expanded/aria-controls برای اسکرین‌ریدرها.
 *   - reduced-motion: فنر به fade ساده تقلیل می‌یابد (framer یعنی همان).
 */

/** آستانه‌ی استاندارد: کمتر از این، متن «کوتاه» به حساب می‌آید و کامل نمایش داده می‌شود */
const SHORT_TEXT_THRESHOLD = 280;
/** ارتفاعِ حالتِ جمع‌شده — ۴ خط با leading-8 (32px) */
const COLLAPSED_HEIGHT = 128;

export function ReadMoreText({
  text,
  className = '',
  id = 'readmore-text',
}: {
  text: string;
  className?: string;
  id?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const normalized = useMemo(() => text.trim(), [text]);
  const isLong = normalized.length > SHORT_TEXT_THRESHOLD;

  if (!normalized) return null;

  if (!isLong) {
    return (
      <div id={id} className={`whitespace-pre-wrap ${className}`}>
        {normalized}
      </div>
    );
  }

  return (
    <div className={className}>
      <motion.div
        id={id}
        initial={false}
        animate={{ height: expanded ? 'auto' : COLLAPSED_HEIGHT }}
        transition={{ type: 'spring', stiffness: 260, damping: 30 }}
        className="relative overflow-hidden"
      >
        <div className="whitespace-pre-wrap pb-2">{normalized}</div>
        {/* هاله‌ی محوِ پایانی — نشانه‌ی «ادامه دارد» بدون دست‌کاریِ متن */}
        {!expanded && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-white via-white/85 to-transparent"
          />
        )}
      </motion.div>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-controls={id}
        className="mx-auto mt-2 inline-flex h-8 cursor-pointer items-center gap-1 rounded-full bg-ink-50 px-3 text-[11.5px] font-extrabold text-brand-700 ring-1 ring-ink-100 transition-colors hover:bg-brand-50 hover:ring-brand-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        {expanded ? 'نمایش کمتر' : 'نمایش بیشتر'}
        {expanded ? (
          <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
