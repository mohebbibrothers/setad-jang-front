'use client';

import { motion } from 'framer-motion';

/**
 * CompletionCta — «مُهرِ جشنِ تأمین» برای حرکت‌های کامل‌شده.
 *
 * چرا وجود دارد؟
 *   وقتی حرکتی کامل می‌شود خبرِ خوب است، نه دکمه‌ی خاکستریِ «غیرفعال»: کاربر
 *   باید لحظه‌ی پیروزیِ جمعی را ببیند (مهر + برق طلایی)، نه دکمه‌ای زخمی.
 *   هر دو جای CTA (کارتِ هوم + کارتِ هابِ مددکار) این مهر را مصرف می‌کنند تا
 *   زبان بصری تکمیل در کل سایت یک‌دست بماند.
 *
 * قرارداد:
 *   - state='funded' → جشن: گرادیان زمردی + sheen طلایی + مهر پالس + ستاره‌چین‌ها
 *   - state='closed' → سوگِ آرام: تیره‌ی خنثی با قفل (پایان بدون تأمین — عمداً
 *     جشن نمی‌گیرد چون پیام عاطفی‌شان فرق است)
 *   - ورودی تعاملی ندارد (role=status) — نه link، نه button: کاملاً ایمن و بی‌ابهام.
 *   - همه‌ی انیمیشن‌ها زیر prefers-reduced-motion غیرفعال می‌شوند (globals.css).
 */

type CompletionCtaProps = {
  state: 'funded' | 'closed';
  /** متن اصلی — همان لیبل چرخه‌عمرِ فعلی («تأمین شد» / «حرکت کامل شد» …) */
  label: string;
  /** خط تشکریِ زیر لیبل — فقط برای حالت جشن معنا دارد */
  sublabel?: string;
  /** کلاسِ فاصله‌گذاریِ بیرونی توسط مصرف‌کننده (مثلاً mt-3 / mt-3.5) */
  className?: string;
};

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
      width="13"
      height="13"
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

export function CompletionCta({ state, label, sublabel, className = '' }: CompletionCtaProps) {
  /* ── سوگِ آرام: حرکت بسته‌شده بدون تأمین کامل ────────────────────────── */
  if (state === 'closed') {
    return (
      <div
        role="status"
        className={`flex h-[46px] w-full cursor-default select-none items-center justify-center gap-2 rounded-[12px] bg-ink-100 text-[14px] font-extrabold text-ink-400 ${className}`}
      >
        <LockGlyph />
        <span>{label}</span>
      </div>
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
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      className={`relative flex h-[56px] w-full cursor-default select-none items-center justify-center gap-3 overflow-hidden rounded-[14px] bg-[linear-gradient(135deg,#085C54_0%,#0A6E64_45%,#0F6F67_75%,#178C84_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,.22),0_12px_26px_-12px_rgba(8,92,84,.6)] ${className}`}
    >
      {/* خط نورِ شیشه‌ای بالای بدنه */}
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/30"
        aria-hidden="true"
      />

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
