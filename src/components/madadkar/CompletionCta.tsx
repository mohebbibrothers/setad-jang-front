'use client';

import { motion } from 'framer-motion';

/**
 * خانواده‌ی یکپارچه‌ی CTA حرکت ─ «بدنه‌ی مشترک، حالت‌های متفاوت»
 * ─────────────────────────────────────────────────────────────────────────
 * چرا وجود دارد؟
 *   سه حالتِ چرخه‌عمر حرکت (فعال / تأمین‌شده / بسته‌شده) باید فوراً از یک
 *   خانواده‌ی طراحی به نظر برسند — یک قاب (ارتفاع، گردی، گرادیان زمردی،
 *   خط شیشه‌ای، سایه) و حال‌وهوای متفاوت:
 *
 *   - ActiveCta      → دعوت: تیکِ سبز برند، دیسک دست با هاله‌ی سفید، sheen ملایم
 *   - CompletionCta  → funded: جشن (مُهر طلایی + ستاره‌چین + خط تشکر)
 *                      closed: سوگِ آرام (قفل + خنثی)
 *
 *   هر جفت کارتِ هوم (WarFundSection) و هاب (CampaignCardView) از همین
 *   خانواده تغذیه می‌کنند تا زبان CTA در کل سایت یک‌دست بماند و دیگر کسی
 *   فکر نکند «اینها جدا طراحی شده‌اند».
 *
 * قرارداد:
 *   - ActiveCta یک <button> واقعی است (تعاملی، کلیک‌پذیر).
 *   - CompletionCta صرفاً status است؛ عنصرِ تعاملی نمی‌سازد.
 *   - همه‌ی انیمیشن‌ها زیر prefers-reduced-motion غیرفعال می‌شوند (globals.css).
 */

/** قاب مشترک همه‌ی حالت‌ها — هم‌عرض (w-full)، هم‌ضخامت (56)، هم‌گردی */
const FRAME =
  'relative flex h-[56px] w-full items-center justify-center gap-3 overflow-hidden rounded-[14px] select-none';

/** ورودِ فنریِ مشترک — همان حس «زاده می‌شود» برای هر سه حالت */
const ENTRY_TRANSITION = { type: 'spring', stiffness: 320, damping: 24 } as const;

function HandGlyph() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.1}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 11V6a2 2 0 0 0-4 0v5" />
      <path d="M14 10V4a2 2 0 0 0-4 0v6" />
      <path d="M10 10.5V6a2 2 0 0 0-4 0v8" />
      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-5.7-2.5L1.5 14a2 2 0 0 1 3-2.6L7 13" />
    </svg>
  );
}

function SealCheck() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function Sparkle({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 1.8 14.1 9.9 22.2 12 14.1 14.1 12 22.2 9.9 14.1 1.8 12 9.9 9.9Z" />
    </svg>
  );
}

function LockGlyph() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

/** خط نورِ شیشه‌ایِ بالای قاب — امضای مشترک خانواده */
function GlassTopLine() {
  return (
    <span
      className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/30"
      aria-hidden="true"
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * ActiveCta — دعوتِ فعال: همان قاب، ولی «کلیک‌پذیر و امیدوارکننده»
 * ═════════════════════════════════════════════════════════════════════════ */
export function ActiveCta({
  label,
  onClick,
  className = '',
}: {
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.97, y: 8 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={ENTRY_TRANSITION}
      whileTap={{ scale: 0.985 }}
      className={`${FRAME} cursor-pointer bg-[linear-gradient(135deg,#0D8074_0%,#0A6E64_55%,#085C54_100%)] text-[15px] font-extrabold text-white shadow-[inset_0_1px_0_rgba(255,255,255,.22),0_12px_26px_-12px_rgba(13,128,116,.55)] transition-[filter,transform] duration-200 hover:brightness-[1.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 active:brightness-[.95] ${className}`}
    >
      <GlassTopLine />
      {/* برقِ سفیدِ دعوت — ملایم‌تر از برق طلاییِ جشن تا سلسله‌مراتب بصری حفظ شود */}
      <span className="cta-sheen cta-sheen--white" aria-hidden="true" />
      {/* دیسک دست با هاله‌ی پالس سفید — خواهرِ مهرِ طلاییِ حالت جشن */}
      <span className="cta-halo-white relative z-[1] flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/35 backdrop-blur-[2px]">
        <HandGlyph />
      </span>
      <span className="relative z-[1]">{label}</span>
    </motion.button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * CompletionCta — پایانِ چرخه‌عمر: جشنِ مهر (funded) / سوگِ آرام (closed)
 * ═════════════════════════════════════════════════════════════════════════ */
type CompletionCtaProps = {
  state: 'funded' | 'closed';
  /** متن اصلی — همان لیبل چرخه‌عمرِ فعلی («تأمین شد» / «حرکت کامل شد» …) */
  label: string;
  /** خط تشکریِ زیر لیبل — فقط برای حالت جشن معنا دارد */
  sublabel?: string;
  /** کلاسِ فاصله‌گذاریِ بیرونی توسط مصرف‌کننده (مثلاً mt-3 / mt-3.5) */
  className?: string;
};

export function CompletionCta({ state, label, sublabel, className = '' }: CompletionCtaProps) {
  /* ── سوگِ آرام: حرکت بسته‌شده بدون تأمین کامل ────────────────────────── */
  if (state === 'closed') {
    return (
      <motion.div
        role="status"
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true, margin: '-30px' }}
        transition={ENTRY_TRANSITION}
        className={`${FRAME} cursor-default bg-ink-100 text-[14px] font-extrabold text-ink-400 ${className}`}
      >
        <span className="relative z-[1] flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/60 text-ink-500 ring-1 ring-ink-200/80">
          <LockGlyph />
        </span>
        <span className="relative z-[1]">{label}</span>
      </motion.div>
    );
  }

  /* ── جشن: مُهرِ زمردیِ تأمین کامل ──────────────────────────────────────
     لایه‌ها: گرادیانِ زمردیِ عمیق → نورِ شیشه‌ایِ بالا → sheen طلاییِ
     پیماینده → ستاره‌چین‌های پلک‌زن → مُهر با هاله‌ی پالس → متن دوتایی. */
  return (
    <motion.div
      role="status"
      initial={{ opacity: 0, scale: 0.94, y: 8 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={ENTRY_TRANSITION}
      className={`${FRAME} cursor-default bg-[linear-gradient(135deg,#085C54_0%,#0A6E64_45%,#0F6F67_75%,#178C84_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,.22),0_12px_26px_-12px_rgba(8,92,84,.6)] ${className}`}
    >
      <GlassTopLine />
      {/* برقِ طلایی پیماینده (از راست به چپ — در جهت خواندن) */}
      <span className="cta-sheen" aria-hidden="true" />
      {/* ستاره‌چین‌های پلک‌زن */}
      <span
        className="cta-twinkle pointer-events-none absolute left-4 top-2 text-amber-200/90"
        aria-hidden="true"
      >
        <Sparkle size={11} />
      </span>
      <span
        className="cta-twinkle-b pointer-events-none absolute bottom-2 left-9 text-white/70"
        aria-hidden="true"
      >
        <Sparkle size={8} />
      </span>
      {/* مُهر با هاله‌ی پالس طلایی */}
      <span className="cta-seal-halo relative z-[1] flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/35 backdrop-blur-[2px]">
        <SealCheck />
      </span>
      {/* متن دوتایی: لیبل چرخه‌عمر + خط تشکر */}
      <span className="relative z-[1] flex min-w-0 flex-col items-center leading-tight">
        <span className="text-[15px] font-extrabold text-white">{label}</span>
        {sublabel ? (
          <span className="mt-0.5 text-[10.5px] font-bold text-white/80">{sublabel}</span>
        ) : null}
      </span>
    </motion.div>
  );
}
