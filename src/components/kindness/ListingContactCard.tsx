'use client';

import { useCallback, useRef, useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  Info,
  Instagram,
  MessageCircle,
  MessageSquareText,
  MessagesSquare,
  Phone,
  Send,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { channelIsLinkable, orderChannels } from '@/lib/kindness-listing';
import type { KindContactChannel } from '@/components/home/KindnessContactSheet';

/**
 * ───────────────────────────────────────────────────────────────────────────
 * ListingContactCard — «راه‌های ارتباط» درونِ صفحهٔ اسلاگ (نه شیت)
 *
 * چرا درون‌صفحه و نه فقط شیت؟ در صفحهٔ جزئیات، کاربر با یک تصمیم آمده است:
 * «آیا می‌توانم این نیاز را برآورده کنم؟». پنهان‌کردنِ راهِ تماس پشتِ یک
 * دکمه، اصطکاکِ بی‌دلیل است. اینجا کانال‌ها صریح و کامل روی میز هستند و
 * شیت (در کارت‌های تخته) فقط میان‌بُرِ همان تجربه است.
 *
 * طراحی:
 *   • هر کانال یک ردیفِ منسجم: دیسکِ رنگیِ برندِ همان پیام‌رسان + برچسب +
 *     مقدار (dir=ltr برای آیدی/شماره) + دو اکشن: کپی و «بازکردن».
 *   • تلفن: دکمهٔ اصلیِ سبزِ برند با tel: — چون ۹۰٪ کاربران با موبایل
 *     می‌آیند و شماره‌گیری، سریع‌ترین مسیرِ برآورده‌کردنِ نیاز است.
 *   • کپیِ هوشمند: در بسترِ ناامن (http) navigator.clipboard وجود ندارد →
 *     fallback با textarea + execCommand؛ پیامِ «کپی شد» روی همان دکمه.
 *   • یادداشتِ هماهنگیِ ادمین («تماس ۱۰ تا ۲۰») به‌صورتِ نوارِ برند نمایش
 *     داده می‌شود؛ یادداشتِ خالی هیچ فضایی نمی‌گیرد.
 *   • سربرگِ اعتماد: «تماس خارج از سایت انجام می‌شود؛ شماره‌ها همان‌هایی
 *     است که صاحبِ نیاز گذاشته» — صداقتِ محصولی، نه تزئین.
 * ───────────────────────────────────────────────────────────────────────────
 */

type ChannelStyle = { disc: string; Glyph: LucideIcon; linkable: boolean };

/** آینهٔ بصریِ CONTACT_CHANNEL_REGISTRY بک‌اند (همان رنگ‌های برندِ پیام‌رسان‌ها). */
const CHANNEL_STYLE: Record<string, ChannelStyle> = {
  phone: { disc: 'bg-[linear-gradient(135deg,#0D8074,#085C54)]', Glyph: Phone, linkable: true },
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

/** کپیِ مقاوم: Clipboard API → fallbackِ textarea (بسترِ ناامن/مرورگرِ قدیمی). */
async function copyText(value: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    /* ادامه با fallback */
  }
  try {
    const el = document.createElement('textarea');
    el.value = value;
    el.setAttribute('readonly', '');
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

export function ListingContactCard({
  channels,
  contactNote,
  beneficiary,
}: {
  channels: KindContactChannel[];
  contactNote?: string;
  beneficiary?: string;
}) {
  const ordered = orderChannels(channels);
  const [copiedKind, setCopiedKind] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onCopy = useCallback(async (channel: KindContactChannel) => {
    const ok = await copyText(channel.value);
    if (!ok) return;
    setCopiedKind(channel.kind);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopiedKind(null), 1800);
  }, []);

  if (ordered.length === 0) {
    return (
      <div className="rounded-[22px] border border-dashed border-ink-200 bg-white p-6 text-center">
        <Info className="mx-auto h-6 w-6 text-ink-300" aria-hidden="true" />
        <p className="mt-2 text-[13px] font-extrabold text-ink-700">
          برای این آگهی راهِ ارتباطی ثبت نشده است
        </p>
        <p className="mt-1 text-[11.5px] font-medium leading-6 text-ink-500">
          اگر نیازِ روی دیوار را می‌توانی برآورده کنی، از دکمهٔ «اعلام آمادگی» استفاده کن تا تیمِ
          بعثت هماهنگ کند.
        </p>
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden rounded-[24px] border border-ink-100 bg-white shadow-[0_2px_14px_-8px_rgba(15,20,32,.14)]"
      data-testid="kw-contact-card"
    >
      {/* سربرگ */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 bg-[linear-gradient(180deg,#f7fbfa,#ffffff)] px-4 py-3.5 sm:px-5">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 text-[13px] font-black text-ink-900">
            <ShieldCheck className="h-4 w-4 text-brand-600" aria-hidden="true" />
            راه‌های ارتباطِ مستقیم
          </p>
          <p className="mt-1 text-[11px] font-medium leading-5 text-ink-500">
            {beneficiary
              ? `به‌نیابت از ${beneficiary} — تماس بیرون از سایت و مستقیم با صاحبِ نیاز انجام می‌شود.`
              : 'تماس بیرون از سایت و مستقیم با صاحبِ نیاز انجام می‌شود.'}
          </p>
        </div>
        <span className="inline-flex h-7 items-center rounded-full bg-brand-50 px-2.5 text-[10.5px] font-extrabold text-brand-700 ring-1 ring-brand-100">
          {ordered.length === 1
            ? '۱ راهِ ارتباط'
            : `${ordered.length.toLocaleString('fa-IR')} راهِ ارتباط`}
        </span>
      </div>

      {/* یادداشتِ هماهنگیِ ادمین */}
      {contactNote?.trim() && (
        <div className="mx-4 mt-4 flex items-start gap-2 rounded-2xl bg-amber-50/80 px-3.5 py-2.5 ring-1 ring-amber-100 sm:mx-5">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden="true" />
          <p className="text-[11.5px] font-bold leading-6 text-amber-800">{contactNote.trim()}</p>
        </div>
      )}

      {/* کانال‌ها */}
      <ul className="divide-y divide-ink-100 px-1 py-1.5 sm:px-1.5">
        {ordered.map((channel) => {
          const style = CHANNEL_STYLE[channel.kind] ?? FALLBACK_STYLE;
          const canLink = channelIsLinkable(channel) && style.linkable;
          const isPhone = channel.kind === 'phone';
          const copied = copiedKind === channel.kind;
          return (
            <li
              key={channel.kind}
              className="flex items-center gap-3 rounded-2xl px-2.5 py-3 transition-colors hover:bg-ink-50/60 sm:px-3"
            >
              <span
                aria-hidden="true"
                className={cn(
                  'grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white shadow-[0_6px_14px_-8px_rgba(15,20,32,.5)]',
                  style.disc,
                )}
              >
                <style.Glyph className="h-[18px] w-[18px]" />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-bold text-ink-500">{channel.label}</span>
                <span
                  dir={isPhone ? 'ltr' : 'ltr'}
                  className="block truncate text-[13.5px] font-extrabold tabular-nums text-ink-900"
                  title={channel.value}
                >
                  {channel.value}
                </span>
              </span>

              <span className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => void onCopy(channel)}
                  aria-label={copied ? 'کپی شد' : `کپی ${channel.label}`}
                  title={copied ? 'کپی شد' : 'کپی'}
                  className={cn(
                    'grid h-9 w-9 place-items-center rounded-xl border transition-colors',
                    copied
                      ? 'border-mint-500 bg-mint-50 text-mint-600'
                      : 'border-ink-200 bg-white text-ink-500 hover:border-brand-300 hover:text-brand-700',
                  )}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>

                {canLink ? (
                  <a
                    href={channel.link}
                    target={isPhone ? undefined : '_blank'}
                    rel={isPhone ? undefined : 'noopener noreferrer'}
                    aria-label={`باز کردن ${channel.label}`}
                    className={cn(
                      'inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-[12px] font-extrabold transition-all',
                      isPhone
                        ? 'bg-[linear-gradient(135deg,#0D8074,#0A6E64_50%,#085C54)] text-white shadow-[0_6px_14px_-6px_rgba(13,128,116,.55)] hover:brightness-[1.08] active:scale-[.98]'
                        : 'border border-ink-200 bg-white text-ink-700 hover:border-brand-300 hover:text-brand-700',
                    )}
                  >
                    {isPhone ? (
                      <Phone className="h-3.5 w-3.5" />
                    ) : (
                      <ExternalLink className="h-3.5 w-3.5" />
                    )}
                    {isPhone ? 'تماس' : 'بازکردن'}
                  </a>
                ) : (
                  <span className="inline-flex h-9 items-center rounded-xl border border-dashed border-ink-200 px-2.5 text-[10.5px] font-bold text-ink-400">
                    کپی و جست‌وجو
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="border-t border-ink-100 bg-ink-50/50 px-4 py-2.5 text-[10.5px] font-medium leading-5 text-ink-500 sm:px-5">
        برای امنیتِ خودت: مبلغ یا اطلاعاتِ بانکی را فقط پس از هماهنگیِ کامل و ترجیحاً حضوری تحویل
        بده.
      </p>
    </div>
  );
}
