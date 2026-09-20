'use client';

/**
 * EnamadSeal — نماد اعتماد الکترونیکی (اینماد)
 *
 * ══ قرارداد دقیق اینماد (هر نقضی = رد شدن صحت‌سنجی خزنده) ═══════════
 *   ۱) لینک حتماً به trustseal.enamad.ir با id و Code یکتا اشاره کند؛
 *   ۲) روی لینک و تصویر `referrerpolicy='origin'` باشد — اینماد با
 *      خواندن Referer مبداً، مالکیت دامنه را راستی‌آزمایی می‌کند؛
 *      به همان دلیل «هرگز» `rel='noreferrer'` اضافه نمی‌کنیم
 *      (noreferrer مرجع را حذف و صحت‌سنجی را می‌شکند) — `noopener`
 *      به‌تنهایی برای امنیت target=_blank کافی است؛
 *   ۳) اتریبیوت سفارشی `code` روی <img> با مقدار Code یکتا حضور داشته
 *      باشد؛ خزنده‌ی اینماد HTML خام را برای همین مقدار می‌کاود.
 *
 * ══ مشکلِ قبلی: «جعبهٔ خالیِ دیررس» ═════════════════════════════════
 *   تصویر نماد از logo.aspx اینماد می‌آید که (به‌ویژه روی شبکه‌های
 *   کند) ثانیه‌ها طول می‌کشد و گاهی اصلاً نمی‌رسد؛ نتیجه: یک کادر
 *   سفیدِ خالی یا گلیفِ شکستهٔ مرورگر در فوتر که کل صفحه را «به‌هم‌ریخته»
 *   نشان می‌داد. راه‌حلِ سه‌لایه:
 *     ۱) <link rel=preconnect> در layout — handshake اینماد از قبل گرم؛
 *     ۲) «پلکهٔ برنددار» زیر تصویر — سپر + تیتر نماد + بارِ دریافت که
 *        بخشی از همان HTML خامِ سرور-رندر است (بدون JS هم دیده می‌شود)؛
 *        تصویر که برسد با پس‌زمینهٔ سفید دقیقاً رویش می‌نشیند و لحظه‌ای
 *        هم کادر خالی دیده نمی‌شود. Shift چیدمان صفر است چون ابعادِ
 *        قاب ثابت است؛
 *     ۳) listener کلاینتی روی خطای <img> — اگر دریافت نماد شکست خورد،
 *        نسخهٔ محلیِ خوش‌ساخت (سپرِ برند + لینکِ معتبر به اینماد) با
 *        دکمهٔ «تلاش دوباره» جایگزین می‌شود. خزندهٔ اینماد جاوااسکریپت
 *        اجرا نمی‌کند و همان HTML اولیهٔ سرور را می‌بیند، پس قراردادِ
 *        صحت‌سنجی دست‌نخورده می‌ماند.
 *
 * ══ چرا HTML خام (dangerouslySetInnerHTML)؟ ═════════════════════════
 *   سرور-رندر React اتریبیوت‌ها را با نام camelCase جاوااسکریپتی می‌نویسد
 *   (`referrerPolicy`)، درحالی‌که اسنیپت رسمی اینماد `referrerpolicy`
 *   تمام‌کوچک است؛ مرورگر هر دو را یکسان تفسیر می‌کند، اما برای قراردادی
 *   که مبنایش «تطبیق HTML خام» است، مارکاپ باید با سند رسمی یکی باشد.
 *   رشتهٔ زیر یک ثابت کامپایل‌تایم است (بدون هیچ ورودی کاربر) پس سطح
 *   XSS صفر است. کلاس‌های Tailwind داخل رشته همچنان توسط اسکنر Tailwind
 *   یافته و ساخته می‌شوند.
 */

import { useEffect, useRef, useState } from 'react';
import { RotateCcw, ShieldCheck } from 'lucide-react';

export const ENAMAD_ID = '7301940';
export const ENAMAD_CODE = 'MQ8Pd8Sa8h43BR2H7rwU9uGXcZDIRbXC';
export const ENAMAD_VERIFY_URL = `https://trustseal.enamad.ir/?id=${ENAMAD_ID}&Code=${ENAMAD_CODE}`;
export const ENAMAD_LOGO_URL = `https://trustseal.enamad.ir/logo.aspx?id=${ENAMAD_ID}&Code=${ENAMAD_CODE}`;

/** کلاس‌های مشترکِ قابِ نماد — هم نسخهٔ خام، هم نسخهٔ fallback محلی. */
const FRAME_CLASSES =
  'group relative flex h-[150px] w-[118px] cursor-pointer items-center justify-center overflow-hidden rounded-[20px] border border-ink-200/80 bg-white shadow-[0_4px_16px_-8px_rgba(15,20,32,.16)] transition-all duration-300 hover:-translate-y-1 hover:border-mint-300 hover:shadow-[0_18px_38px_-12px_rgba(13,128,116,.34)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 focus-visible:ring-offset-2';

/**
 * پلکهٔ برنددار — همان چیزی که از ثانیهٔ صفر (حتی در شبکهٔ کند یا
 * قطعِ اینماد) به‌جای کادرِ خالی دیده می‌شود. تصویرِ واقعی نماد با
 * `bg-white` روی همین لایه می‌نشیند، پس هرگز «دم‌دستی» دیده نمی‌شود.
 */
const BRAND_ART_HTML = `<span aria-hidden='true' class='absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[linear-gradient(165deg,#f2faf8_0%,#ffffff_55%,#e9f6f1_100%)] p-3'>
  <svg width='34' height='34' viewBox='0 0 24 24' fill='none' stroke='#0d8074' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round' class='shrink-0'>
    <path d='M12 22s8-3.6 8-10V5.4L12 2 4 5.4V12c0 6.4 8 10 8 10Z' fill='rgba(13,128,116,.08)'/>
    <path d='m8.7 11.9 2.2 2.2 4.4-4.7'/>
  </svg>
  <span class='flex flex-col items-center gap-[5px]'>
    <span class='text-[9px] font-extrabold leading-none text-[#0d8074]'>نماد اعتماد الکترونیکی</span>
    <span class='text-[7.5px] font-bold leading-none text-ink-400'>در حال دریافت از اینماد…</span>
  </span>
  <span class='pointer-events-none absolute inset-x-4 bottom-2.5 h-1 overflow-hidden rounded-full bg-mint-100'>
    <span class='block h-full w-2/3 animate-pulse rounded-full bg-gradient-to-l from-mint-300 to-mint-500'></span>
  </span>
</span>`;

/**
 * مارکاپ نماد — نسخه‌ی استایل‌دارِ اسنیپت رسمی اینماد، با همان
 * اتریبیوت‌های قراردادی (حروف کوچک، نقل‌قول تکی) و سه بهبود آگاهانه:
 *   • alt فارسی برای دسترس‌پذیری؛
 *   • پلکهٔ برنددارِ زیر تصویر (BYE-BYE جعبهٔ خالی)؛
 *   • هالهٔ hover برندی روی قاب.
 */
const SEAL_HTML = `<a referrerpolicy='origin' target='_blank' rel='noopener' href='${ENAMAD_VERIFY_URL}' title='نماد اعتماد الکترونیکی (اینماد)' aria-label='نماد اعتماد الکترونیکی — مشاهده وضعیت اعتبار بعثت مردم در اینماد' class='${FRAME_CLASSES}'>${BRAND_ART_HTML}<img referrerpolicy='origin' src='${ENAMAD_LOGO_URL}' code='${ENAMAD_CODE}' alt='نماد اعتماد الکترونیکی (اینماد)' loading='lazy' decoding='async' class='absolute inset-0 z-10 h-full w-full bg-white object-contain p-2.5'/><span aria-hidden='true' class='pointer-events-none absolute inset-0 z-20 bg-gradient-to-br from-brand-500/[0.04] to-mint-500/[0.10] opacity-0 transition-opacity duration-300 group-hover:opacity-100'></span></a>`;

export function EnamadSeal() {
  const [failed, setFailed] = useState(false);
  const [nonce, setNonce] = useState(0);
  const hostRef = useRef<HTMLSpanElement>(null);

  // خطای دریافتِ تصویر را بشکار و نسخهٔ محلی را سوار کن. اگر تصویر پیش
  // از اتصالِ listener خطا خورده باشد، complete+naturalWidth نشانش می‌دهد.
  useEffect(() => {
    if (failed) return;
    const img = hostRef.current?.querySelector('img');
    if (!img) return;
    const onError = () => setFailed(true);
    if (img.complete && img.naturalWidth === 0) {
      setFailed(true);
      return;
    }
    img.addEventListener('error', onError);
    return () => img.removeEventListener('error', onError);
  }, [failed, nonce]);

  if (failed) {
    // نسخهٔ محلی — لینکِ راستی‌آزمایی زنده می‌ماند؛ کاربر هر لحظه می‌تواند
    // وضعیت اعتبار را در خودِ اینماد ببیند. (قراردادِ خزنده همچنان با
    // HTML اولیهٔ سرور-رندر محفوظ است.)
    return (
      <span className="flex flex-col items-center gap-2">
        <a
          referrerPolicy="origin"
          target="_blank"
          rel="noopener"
          href={ENAMAD_VERIFY_URL}
          title="نماد اعتماد الکترونیکی (اینماد)"
          aria-label="نماد اعتماد الکترونیکی — مشاهده وضعیت اعتبار بعثت مردم در اینماد"
          className="flex h-[150px] w-[118px] cursor-pointer flex-col items-center justify-center gap-2.5 rounded-[20px] border border-mint-200 bg-[linear-gradient(165deg,#f2faf8_0%,#ffffff_55%,#e9f6f1_100%)] p-3 text-center shadow-[0_6px_18px_-8px_rgba(13,128,116,.24)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_38px_-12px_rgba(13,128,116,.34)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 focus-visible:ring-offset-2"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-[0_6px_16px_-8px_rgba(13,128,116,.35)] ring-1 ring-mint-100">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </span>
          <span className="flex flex-col items-center gap-1">
            <span className="text-[9.5px] font-extrabold leading-none text-brand-700">
              نماد اعتماد الکترونیکی
            </span>
            <span className="text-[8px] font-bold leading-snug text-ink-400">
              برای مشاهدهٔ وضعیت اعتبار کلیک کنید
            </span>
          </span>
        </a>
        <button
          type="button"
          onClick={() => {
            setFailed(false);
            setNonce((n) => n + 1);
          }}
          className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-extrabold text-ink-400 transition-colors hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
        >
          <RotateCcw className="h-3 w-3" aria-hidden="true" />
          تلاش دوباره برای دریافت نماد
        </button>
      </span>
    );
  }

  // key=nonce → پس از «تلاش دوباره» کل مارکاپ از نو سوار و درخواستِ
  // تصویر دوباره صادر می‌شود. چیپِ «اتصال زنده» فقط در همین شاخهٔ موفق
  // رندر می‌شود؛ در شاخهٔ خطا ادعای اتصالِ زنده صادقانه نیست و جاش
  // را دکمهٔ «تلاش دوباره» می‌گیرد.
  return (
    <span className="flex flex-col items-center gap-2.5">
      <span
        key={nonce}
        ref={hostRef}
        className="contents"
        dangerouslySetInnerHTML={{ __html: SEAL_HTML }}
      />
      <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-mint-700">
        <span aria-hidden="true" className="h-1.5 w-1.5 animate-pulse rounded-full bg-mint-500" />
        اتصالِ زنده به اینماد
      </span>
    </span>
  );
}
