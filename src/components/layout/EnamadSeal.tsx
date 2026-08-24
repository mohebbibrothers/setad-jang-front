/**
 * EnamadSeal — نماد اعتماد الکترونیکی (اینماد)
 *
 * قرارداد دقیق اینماد (هر نقضی = رد شدن صحت‌سنجی خزنده):
 *   ۱) لینک حتماً به trustseal.enamad.ir با id و Code یکتا اشاره کند؛
 *   ۲) روی لینک و تصویر `referrerpolicy='origin'` باشد — اینماد با
 *      خواندن Referer مبداً، مالکیت دامنه را راستی‌آزمایی می‌کند؛
 *      به همان دلیل «هرگز» `rel='noreferrer'` اضافه نمی‌کنیم
 *      (noreferrer مرجع را حذف و صحت‌سنجی را می‌شکند) — `noopener`
 *      به‌تنهایی برای امنیت target=_blank کافی است؛
 *   ۳) اتریبیوت سفارشی `code` روی <img> با مقدار Code یکتا حضور داشته
 *      باشد؛ خزنده‌ی اینماد HTML خام را برای همین مقدار می‌کاود.
 *
 * چرا HTML خام (dangerouslySetInnerHTML)؟ سرور-رندر React اتریبیوت‌ها را
 * با نام camelCase جاوااسکریپتی می‌نویسد (`referrerPolicy`)، درحالی‌که
 * اسنیپت رسمی اینماد `referrerpolicy` تمام‌کوچک است؛ مرورگر هر دو را
 * یکسان تفسیر می‌کند، اما برای قراردادی که مبنایش «تطبیق دقیق HTML
 * خام» است، مارکاپ باید بایت‌به‌بایت با سند رسمی یکی باشد. رشته‌ی زیر
 * یک ثابت کامپایل‌تایم است (بدون هیچ ورودی کاربر) پس سطح XSS صفر است.
 * کلاس‌های Tailwind داخل رشته همچنان توسط اسکنر Tailwind یافته و ساخته
 * می‌شوند.
 */

export const ENAMAD_ID = '7301940';
export const ENAMAD_CODE = 'MQ8Pd8Sa8h43BR2H7rwU9uGXcZDIRbXC';
export const ENAMAD_VERIFY_URL = `https://trustseal.enamad.ir/?id=${ENAMAD_ID}&Code=${ENAMAD_CODE}`;
export const ENAMAD_LOGO_URL = `https://trustseal.enamad.ir/logo.aspx?id=${ENAMAD_ID}&Code=${ENAMAD_CODE}`;

/**
 * مارکاپ نماد — نسخه‌ی استایل‌دارِ اسنیپت رسمی اینماد، با همان
 * اتریبیوت‌های قراردادی (حروف کوچک، نقل‌قول تکی) و دو بهبود آگاهانه:
 *   • alt فارسی به‌جای رشته‌ی خالی برای دسترس‌پذیری؛
 *   • کلاس‌های ظاهری به‌جای style درون‌خطی، هم‌سو با سیستم طراحی سایت.
 */
const SEAL_HTML = `<a referrerpolicy='origin' target='_blank' rel='noopener' href='${ENAMAD_VERIFY_URL}' title='نماد اعتماد الکترونیکی (اینماد)' aria-label='نماد اعتماد الکترونیکی — مشاهده وضعیت اعتبار بعثت مردم در اینماد' class='group relative flex h-[120px] w-[108px] cursor-pointer items-center justify-center rounded-2xl border border-ink-200 bg-white p-3 shadow-[0_2px_10px_-4px_rgba(15,20,32,.10)] transition-all duration-300 hover:-translate-y-1 hover:border-brand-100 hover:shadow-[0_16px_32px_-8px_rgba(13,128,116,.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 focus-visible:ring-offset-2'><span aria-hidden='true' class='pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-brand-500/[0.06] to-mint-500/[0.10] opacity-0 transition-opacity duration-300 group-hover:opacity-100'></span><img referrerpolicy='origin' src='${ENAMAD_LOGO_URL}' code='${ENAMAD_CODE}' alt='نماد اعتماد الکترونیکی (اینماد)' loading='lazy' decoding='async' class='relative h-full w-full object-contain'/></a>`;

export function EnamadSeal() {
  // پوسته‌ی بی‌جعبه (display: contents) تا لینکِ خام دقیقاً به‌عنوان
  // آیتمِ فلکس والد بنشیند و wrapper هیچ اثر چیدمانی نداشته باشد.
  // SEAL_HTML ثابت کامپایل‌تایم است و هیچ ورودی داینامیکی در کار نیست.
  return <span className="contents" dangerouslySetInnerHTML={{ __html: SEAL_HTML }} />;
}
