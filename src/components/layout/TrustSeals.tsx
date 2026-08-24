import { EnamadSeal } from './EnamadSeal';

/**
 * TrustSeals — سلول «نمادهای اعتماد» در ردیف ستون‌های فوتر.
 *
 * جایگاه: راست‌ترین سلولِ ردیف سه‌تاییِ فوتر. در DOM اول آمده تا در
 * چیدمان RTL راست‌ترین بنشیند و مارجینِ کناریِ اضافه‌ی آن (`me` از
 * سمت فوتر) آن را اندکی دورتر از دو ستون لینک نگه می‌دارد — عضوی از
 * ردیف، اما با هویتِ بصریِ مستقل.
 *
 * در موبایل (گرید تک‌ستونه) فوتر آن را `order-last` می‌کند تا ستون‌های
 * لینک‌دهی اول خوانده شوند و نماد — که محتوای تصویری است — آخر بنشیند.
 *
 * زبان بصری آگاهانه همان زبان ستون‌های فوتر است (عنوان + خط زیرین
 * گرادیانی برند) تا سلول به‌جای «چسبیده‌شدن»، بخشی از همان سیستم طراحی
 * خوانده شود. className از بیرون تزریق می‌شود تا تصمیم‌های چیدمانیِ
 * ردیف (ترتیب، مارجین) مالکیتش دست فوتر بماند.
 */
export function TrustSeals({ className = '' }: { className?: string }) {
  return (
    <section
      aria-labelledby="trust-seals-title"
      className={`flex flex-col items-center ${className}`}
    >
      <h4 id="trust-seals-title" className="mb-1 text-[14.5px] font-extrabold text-ink-900">
        نمادهای اعتماد
      </h4>
      <span
        aria-hidden="true"
        className="mb-5 block h-[3px] w-9 rounded-full bg-gradient-to-l from-brand-500 to-mint-500"
      />
      <EnamadSeal />
      <p className="mt-3 max-w-[150px] text-[11.5px] font-medium leading-5 text-ink-500">
        برای مشاهده وضعیت اعتبار، روی نماد کلیک کنید.
      </p>
    </section>
  );
}
