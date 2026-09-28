'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Search, X } from 'lucide-react';

/**
 * جعبه‌ی جست‌وجوی هاب — تک‌نمونه. (بازطراحی: دو باکسِ جست‌وجو در یک
 * صفحه دیگر وجود ندارد؛ هیرو فقط مسیرهای آماده‌ی معتبر می‌دهد.)
 *
 * قرارداد:
 *  • خروجی به URL می‌رود، نه به استیت — هر عبارت قابل‌اشتراک،
 *    قابل‌بک-زدن و سازگار با کشِ سرور است؛
 *  • تایپ با مکثِ ۳۵۰ms نتیجه را زنده باریک می‌کند (بدون ناوبریِ
 *    اسکرول‌دار) و Enter/دکمه بلافاصله اعمال می‌کند؛
 *  • دسته/سطح/ویژه‌ی فعال از مسیرِ preserveQuery حفظ می‌شوند و هر
 *    جست‌وجوی تازه به صفحه‌ی ۱ برمی‌گردد.
 */
export function LmsSearchBox({
  initial = '',
  preserveQuery,
  placeholder = 'نام کلاس، مدرس یا موضوع…',
}: {
  initial?: string;
  /** کوئریِ فعلی (دسته/سطح/ویژه) که هنگام جست‌وجو حفظ می‌شود. */
  preserveQuery?: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [pending, startTransition] = useTransition();
  const firstRun = useRef(true);
  /* آخرین عبارتی که «خودمان» به URL فرستاده‌ایم — محافظِ مسابقه: پاسخِ
     RSCِ همان ناوبری (echo) نباید چیزی را که کاربر «حینِ لود» تایپ کرده
     بازنویسی کند. فقط تغییرِ خار‌جیِ URL (Back/Forward، چیپ، پاک‌سازی)
     مجاز به همگام‌سازیِ فیلد است. */
  const lastSubmitted = useRef(initial.trim());

  /* همگام‌سازی فقط با URLهای بیرونی؛ echo خودمان از صف رد می‌شود. */
  useEffect(() => {
    const incoming = initial.trim();
    if (incoming === lastSubmitted.current) return;
    lastSubmitted.current = incoming;
    setValue(incoming);
  }, [initial]);

  /* دیبانسِ زنده: تایپ می‌کنی، نتیجه همان‌جا باریک می‌شود. */
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const q = value.trim();
    if (q === lastSubmitted.current) return;
    const t = setTimeout(() => {
      lastSubmitted.current = q;
      startTransition(() => {
        router.replace(buildHref(q, preserveQuery), { scroll: false });
      });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const submit = () => {
    const q = value.trim();
    lastSubmitted.current = q;
    startTransition(() => {
      // بدون پرش: دک و نتایج همان‌جا زیرِ دستِ کاربر می‌مانند
      router.push(buildHref(q, preserveQuery), { scroll: false });
    });
  };

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex h-12 w-full items-center gap-2 rounded-xl bg-ink-50/80 p-1.5 ps-3.5 ring-1 ring-ink-200/80 transition-all duration-200 focus-within:bg-white focus-within:shadow-[0_10px_28px_-16px_rgba(13,128,116,.45)] focus-within:ring-2 focus-within:ring-brand-500"
    >
      <Search
        className={`h-[18px] w-[18px] shrink-0 transition-colors ${pending ? 'animate-pulse text-brand-500' : 'text-ink-400'}`}
        aria-hidden="true"
      />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={placeholder}
        aria-label="جست‌وجو در آموزش‌ها"
        autoComplete="off"
        inputMode="search"
        maxLength={120}
        className="lms-search-input h-full w-full min-w-0 bg-transparent text-[13.5px] font-bold text-ink-900 placeholder:font-medium placeholder:text-ink-400 focus:outline-none"
      />
      {value.trim() !== '' && (
        <button
          type="button"
          aria-label="پاک کردن عبارت جست‌وجو"
          onClick={() => {
            setValue('');
            lastSubmitted.current = '';
            startTransition(() => router.replace(buildHref('', preserveQuery), { scroll: false }));
          }}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-l from-brand-500 to-brand-700 px-5 text-[12.5px] font-extrabold text-white shadow-[0_8px_20px_-8px_rgba(13,128,116,.75)] transition-all hover:from-brand-600 hover:to-brand-800 active:scale-[.98] disabled:opacity-60"
      >
        {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
        جست‌وجو
      </button>
    </form>
  );
}

function buildHref(q: string, preserveQuery?: string): string {
  const p = new URLSearchParams(preserveQuery);
  if (q) p.set('q', q);
  else p.delete('q');
  p.delete('page'); // هر تغییرِ فیلتر/متن → صفحه‌ی اولِ مجموعه‌ی جدید
  const s = p.toString();
  return s ? `/lms?${s}` : '/lms';
}
