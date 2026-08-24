import { EnamadSeal } from './EnamadSeal';

/**
 * TrustSeals — بلوک «نمادهای اعتماد» در فوتر سراسری.
 *
 * جایگاه: میان ستون‌های فوتر و دیوایدر پایانی — نقطه‌ای که چشم کاربر
 * پیش از نوار کپی‌رایت به‌طور طبیعی از رویش عبور می‌کند و مرسوم‌ترین
 * محل نمایش نمادهای اعتماد در وب فارسی است.
 *
 * زبان بصری آگاهانه همان زبان ستون‌های فوتر است (عنوان + خط زیرین
 * گرادیانی برند) تا بلوک به‌جای «چسبیده‌شدن»، بخشی از همان سیستم طراحی
 * خوانده شود. ردیف انعطاف‌پذیر است تا نمادهای بعدی (ساماندهی و…)
 * بدون دست‌کاری چیدمان کنار اینماد بنشینند.
 */
export function TrustSeals() {
  return (
    <section aria-labelledby="trust-seals-title" className="relative mt-12 text-center md:mt-14">
      <h4 id="trust-seals-title" className="mb-1 text-[14.5px] font-extrabold text-ink-900">
        نمادهای اعتماد
      </h4>
      <span
        aria-hidden="true"
        className="mx-auto mb-4 block h-[3px] w-9 rounded-full bg-gradient-to-l from-brand-500 to-mint-500"
      />
      <p className="text-[12.5px] font-medium leading-7 text-ink-500">
        برای مشاهده وضعیت اعتبار، روی نماد کلیک کنید.
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-4">
        <EnamadSeal />
      </div>
    </section>
  );
}
