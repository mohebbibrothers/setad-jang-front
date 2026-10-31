'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  Copy,
  ExternalLink,
  Instagram,
  Lock,
  LogIn,
  MessageCircle,
  MessagesSquare,
  MessageSquareText,
  Phone,
  Send,
  X,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * ───────────────────────────────────────────────────────────────────────────
 * KindnessContactSheet — «دفترچهٔ راه‌های ارتباط» دیوار مهربانی (v2)
 *
 * سیاستِ بک‌اند (apps/kindness_wall/serializers.py):
 *   contact_channels فقط در DETAIL آگهی می‌آید، هرگز در لیست — پس این شیت
 *   lazy پر می‌شود و هر آگهی حداقل یک کانال دارد (الزامِ clean/model).
 *
 *   payload هر کانال: { kind, label, value, link }
 *     kind ∈ phone | bale | eitaa | telegram | rubika | instagram
 *     link: آماده از سرور (tel:+98…، https://t.me/…، …) یا '' (= فقط کپی)
 *
 * نکتهٔ معماری حیاتی: شیت با createPortal روی document.body سوار می‌شود —
 * دقیقاً مانند CampaignAlbum. بدون portal، اگر هر جدِ بالادست transform یا
 * filter داشته باشد، position:fixed نسبت به همان جد حساب می‌شود و شیت به‌جای
 * «لایهٔ شناور روی صفحه» به‌صورت این‌لاین داخل جریان سند رندر می‌شد.
 *
 * زبانِ بصری: دیسک رنگیِ برند هر شبکه، لینک آمادهٔ سرور + کپی با بازخورد،
 * هدر چسبان داخل اسکرول، اسکرول‌بار نازکِ هم‌خانواده با تم سایت، قفل اسکرول
 * بدنه، ESC/بک‌دراپ برای بستن، احترام به safe-area و reduced-motion.
 * ───────────────────────────────────────────────────────────────────────────
 */

export type KindContactChannel = {
  kind: string;
  label: string;
  value: string;
  link?: string;
};

type ChannelStyle = {
  disc: string; // رنگ دیسک آیکن
  Glyph: LucideIcon;
  linkable: boolean; // آیا لینک وبِ قابل‌بازکردن دارد؟ (بله آگاهانه ندارد)
};

/** رجیستری بصری کانال‌ها — آینهٔ CONTACT_CHANNEL_REGISTRY بک‌اند. */
const CHANNEL_STYLE: Record<string, ChannelStyle> = {
  phone: {
    disc: 'bg-gradient-to-br from-brand-500 to-brand-700',
    Glyph: Phone,
    linkable: true,
  },
  bale: { disc: 'bg-[#2E9EED]', Glyph: MessageCircle, linkable: false },
  eitaa: { disc: 'bg-[#f97316]', Glyph: MessagesSquare, linkable: true },
  telegram: { disc: 'bg-[#2AABEE]', Glyph: Send, linkable: true },
  rubika: { disc: 'bg-[#d9a400]', Glyph: MessageSquareText, linkable: true },
  instagram: {
    disc: 'bg-[linear-gradient(45deg,#f58529,#dd2a7b,#8134af)]',
    Glyph: Instagram,
    linkable: true,
  },
};

const FALLBACK_STYLE: ChannelStyle = {
  disc: 'bg-ink-400',
  Glyph: MessageCircle,
  linkable: true,
};

export function KindnessContactSheet({
  open,
  title,
  subtitle,
  contactNote,
  slug,
  channels,
  gated = false,
  loading,
  error,
  onRetry,
  onClose,
}: {
  open: boolean;
  title: string;
  /** مثلاً «به‌نیاب: خانواده‌ای در شوش» — beneficiary_name اختیاری است. */
  subtitle?: string;
  /** یادداشت هماهنگی ادمین: «تماس ۱۰ تا ۲۰»، «پیامکی بهتر است». */
  contactNote?: string;
  /** اسلاگِ آگهی — برای لینکِ «ورود و مشاهدهٔ کامل» در حالتِ درگاه. */
  slug: string;
  channels: KindContactChannel[];
  /** آیا سرور مقدارها را ماسک کرده است؟ (بینندهٔ بی‌نام) */
  gated?: boolean;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onClose: () => void;
}) {
  const [copiedKind, setCopiedKind] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ESC برای بستن + قفل اسکرول بدنه + فوکوس اولیه روی دکمهٔ بستن */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  useEffect(
    () => () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    },
    [],
  );

  const copyValue = useCallback((channel: KindContactChannel) => {
    const done = () => {
      setCopiedKind(channel.kind);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopiedKind(null), 1600);
    };
    const write = navigator.clipboard?.writeText(channel.value);
    if (write) {
      write.then(done).catch(() => {
        /* fallback برای مرورگرهای قدیمی/عدم دسترسی کلیپ‌بورد */
        const ta = document.createElement('textarea');
        ta.value = channel.value;
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand('copy');
          done();
        } catch {
          /* سکوت — دکمه در همان حالت اول می‌ماند */
        }
        ta.remove();
      });
    }
  }, []);

  /* SSR-guard: شیت فقط از تعامل کلاینت باز می‌شود؛ ولی برای اطمینان از
     سمت سرور هم هیچ‌گاه به document دست نزن. */
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="kw-contact-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-[95] flex items-end justify-center bg-ink-950/45 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={onClose}
          data-testid="kw-contact-backdrop"
        >
          <motion.div
            key="kw-contact-panel"
            role="dialog"
            aria-modal="true"
            aria-label={`راه‌های ارتباط ${title}`}
            initial={{ opacity: 0, y: 42, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.985 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="kw-sheet-scroll relative flex max-h-[86dvh] w-full max-w-lg flex-col overflow-y-auto overscroll-contain rounded-t-[28px] bg-white shadow-[0_-18px_60px_-24px_rgba(8,50,45,.45)] sm:rounded-[28px] sm:shadow-[0_28px_80px_-28px_rgba(8,50,45,.5)]"
          >
            {/* نوار برند بالای کارت — چسبان تا موقع اسکرول گم نشود */}
            <div className="sticky top-0 z-20 bg-white">
              <div
                aria-hidden="true"
                className="h-1.5 w-full bg-[linear-gradient(90deg,#0D8074,#25c5ba,#0D8074)]"
              />

              {/* هدر */}
              <div className="flex items-start justify-between gap-3 px-5 pt-5 md:px-6">
                <div className="min-w-0">
                  <p className="text-[11px] font-extrabold tracking-wide text-brand-600">
                    راه‌های ارتباط مستقیم
                  </p>
                  <h3 className="mt-1 inline-flex items-center gap-2">
                    <HeartGlyph />
                    <span className="line-clamp-2 text-[16px] font-extrabold leading-7 text-ink-900 md:text-[17px]">
                      {title}
                    </span>
                  </h3>
                  {subtitle && (
                    <p className="mt-1.5 inline-flex max-w-full items-center gap-1 truncate rounded-full bg-ink-50 px-2.5 py-1 text-[11.5px] font-bold text-ink-600 ring-1 ring-ink-100">
                      {subtitle}
                    </p>
                  )}
                </div>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={onClose}
                  aria-label="بستن"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-50 text-ink-500 ring-1 ring-ink-100 transition-colors hover:bg-ink-100 hover:text-ink-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* یادداشت هماهنگی */}
              {contactNote && !loading && !error && (
                <p className="mx-5 mt-3 rounded-2xl bg-brand-50/70 px-3.5 py-2.5 text-[12px] font-bold leading-6 text-brand-800 ring-1 ring-brand-100 md:mx-6">
                  {contactNote}
                </p>
              )}
            </div>

            {/* بدنه */}
            <div className="flex flex-col gap-2 px-5 pb-5 pt-4 md:px-6">
              {loading &&
                [0, 1].map((i) => (
                  <div
                    key={i}
                    aria-hidden="true"
                    className="flex h-[62px] animate-pulse items-center gap-3 rounded-2xl bg-ink-50 ring-1 ring-ink-100"
                  />
                ))}

              {error && !loading && (
                <div className="rounded-2xl bg-rose-50 px-4 py-5 text-center ring-1 ring-rose-100">
                  <p className="text-[13px] font-extrabold text-rose-700">
                    راه‌های ارتباط دریافت نشد
                  </p>
                  <p className="mt-1 text-[11.5px] font-bold text-rose-500">
                    اتصال را چک کن و دوباره تلاش کن.
                  </p>
                  <button
                    type="button"
                    onClick={onRetry}
                    className="mt-3 inline-flex h-9 items-center rounded-full bg-rose-600 px-4 text-[12px] font-extrabold text-white transition-colors hover:bg-rose-700"
                  >
                    تلاش دوباره
                  </button>
                </div>
              )}

              {/* درگاهِ ورود: بینندهٔ بی‌نام مقدارِ کامل را نمی‌بیند */}
              {!loading && !error && gated && channels.length > 0 && (
                <div
                  className="rounded-2xl border border-brand-200/70 bg-[linear-gradient(180deg,#f2faf8,#ffffff)] px-4 py-5 text-center"
                  data-testid="kw-sheet-gate"
                >
                  <span
                    aria-hidden="true"
                    className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-brand-500/10 text-brand-700 ring-1 ring-brand-200/70"
                  >
                    <Lock className="h-5 w-5" />
                  </span>
                  <p className="mt-2.5 text-[12.5px] font-black text-ink-900">
                    راه‌های ارتباط پس از ورود نمایش داده می‌شود
                  </p>
                  <p className="mx-auto mt-1.5 max-w-sm text-[11px] font-medium leading-6 text-ink-500">
                    برای امنیتِ صاحبِ نیاز، شماره و آیدی‌ها فقط برای کاربرانِ واردشده نمایش داده
                    می‌شود.
                  </p>
                  <ul className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
                    {channels.map((channel) => {
                      const style = CHANNEL_STYLE[channel.kind] ?? FALLBACK_STYLE;
                      return (
                        <li
                          key={channel.kind}
                          className="inline-flex items-center gap-1.5 rounded-full border border-ink-100 bg-white px-2.5 py-1 text-[10.5px] font-extrabold text-ink-600"
                        >
                          <span
                            aria-hidden="true"
                            className={cn('h-2 w-2 rounded-full', style.disc)}
                          />
                          {channel.label}
                        </li>
                      );
                    })}
                  </ul>
                  <Link
                    href={`/kindness-wall/${encodeURIComponent(slug)}`}
                    className="mt-3.5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#0D8074,#0A6E64_50%,#085C54)] px-5 text-[12.5px] font-extrabold text-white transition-all hover:brightness-[1.08]"
                  >
                    <LogIn className="h-4 w-4" aria-hidden="true" />
                    ورود و مشاهدهٔ کامل
                  </Link>
                </div>
              )}

              {!loading && !error && channels.length === 0 && (
                <p className="rounded-2xl bg-ink-50 px-4 py-5 text-center text-[12.5px] font-bold text-ink-500 ring-1 ring-ink-100">
                  برای این آگهی هنوز راه ارتباطی ثبت نشده است.
                </p>
              )}

              {!loading &&
                !error &&
                !gated &&
                channels.map((channel) => {
                  const style = CHANNEL_STYLE[channel.kind] ?? FALLBACK_STYLE;
                  const copied = copiedKind === channel.kind;
                  const href = style.linkable && channel.link ? channel.link : null;
                  return (
                    <div
                      key={channel.kind}
                      className="flex items-center gap-3 rounded-2xl bg-white py-2.5 pe-2.5 ps-3.5 ring-1 ring-ink-100 transition-shadow hover:shadow-[0_10px_26px_-18px_rgba(11,53,48,.35)] hover:ring-ink-200"
                      data-testid={`kw-channel-${channel.kind}`}
                    >
                      {/* دیسک رنگی شبکه */}
                      <span
                        aria-hidden="true"
                        className={cn(
                          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-[0_6px_14px_-6px_rgba(15,20,32,.35)]',
                          style.disc,
                        )}
                      >
                        <style.Glyph className="h-5 w-5" />
                      </span>

                      {/* برچسب + مقدار */}
                      <span className="min-w-0 flex-1">
                        <span className="block text-[11px] font-extrabold text-ink-500">
                          {channel.label}
                        </span>
                        <span
                          dir="ltr"
                          className="block truncate text-right text-[13.5px] font-extrabold tabular-nums text-ink-900"
                        >
                          {channel.value}
                        </span>
                      </span>

                      {/* اکشن‌ها: باز کردن لینک (اگر هست) + کپی همیشگی */}
                      {href && (
                        <a
                          href={href}
                          target={channel.kind === 'phone' ? undefined : '_blank'}
                          rel={channel.kind === 'phone' ? undefined : 'noopener noreferrer'}
                          aria-label={`باز کردن ${channel.label}`}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 ring-1 ring-brand-100 transition-colors hover:bg-brand-100 hover:text-brand-700"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => copyValue(channel)}
                        aria-label={`کپی ${channel.label}`}
                        className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-1 transition-colors',
                          copied
                            ? 'bg-mint-500 text-white ring-mint-500'
                            : 'bg-ink-50 text-ink-500 ring-ink-100 hover:bg-ink-100 hover:text-ink-800',
                        )}
                        title={copied ? 'کپی شد' : 'کپی'}
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  );
                })}
            </div>

            {/* پیام اعتماد ته کارت + احترام به safe-area موبایل */}
            <p className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-center text-[11px] font-bold leading-5 text-ink-400 md:px-6">
              ارتباط مستقیم و بی‌واسطه با صاحب نیاز است؛ بعثت مردم هیچ واسطه‌ای نیست.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** قلبِ کوچکِ کنار عنوان — امضای دیوار */
function HeartGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0 text-rose-500"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}
