'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

/**
 * جعبه‌ی جست‌وجوی هاب — در هیرو (مشتاقانه) و در نوار ابزار (زنده و
 * دیبانس‌شده) هر دو استفاده می‌شود. خروجی به URL می‌رود، نه به استیت —
 * یعنی هر عبارت قابل‌اشتراک، قابل‌بک-زدن و سازگار با کشِ سرور است.
 */
export function LmsSearchBox({
  initial = '',
  preserveQuery,
  variant,
  placeholder = 'دنبال چه مهارتی می‌گردی؟',
}: {
  initial?: string;
  /** کوئریِ فعلی (دسته/سطح) که هنگام جست‌وجو حفظ می‌شود. */
  preserveQuery?: string;
  variant: 'hero' | 'toolbar';
  placeholder?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [pending, startTransition] = useTransition();
  const firstRun = useRef(true);

  /* همگام‌سازی با URL بعد از ناوبری‌های بیرونی (برگردانِ فیلتر، Back/Forward). */
  useEffect(() => setValue(initial), [initial]);

  /* حالتِ toolbar: با توقفِ تایپ، بعد از ۳۵۰ms کوئری عوض می‌شود — بدون
     Enter هم زندگی می‌کند؛ حالتِ hero فقط با Enter/دکمه. */
  useEffect(() => {
    if (variant !== 'toolbar') return;
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const q = value.trim();
    if (q === (initial ?? '').trim()) return;
    const t = setTimeout(() => {
      startTransition(() => {
        router.replace(buildHref(q, preserveQuery), { scroll: false });
      });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const submit = () => {
    const q = value.trim();
    startTransition(() => {
      router.push(buildHref(q, preserveQuery));
    });
  };

  const isHero = variant === 'hero';
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className={
        isHero
          ? 'flex w-full items-center gap-2 rounded-2xl bg-white/[.97] p-2 shadow-[0_18px_48px_-18px_rgba(0,0,0,.55)] ring-1 ring-white/15 focus-within:ring-2 focus-within:ring-mint-300'
          : 'flex w-full items-center gap-2 rounded-full bg-white p-1.5 ring-1 ring-ink-200 transition-shadow focus-within:ring-2 focus-within:ring-brand-400'
      }
    >
      <span
        className={`grid shrink-0 place-items-center rounded-xl ${
          isHero
            ? 'h-11 w-11 bg-gradient-to-br from-brand-500 to-brand-700 text-white'
            : 'h-9 w-9 text-brand-600'
        }`}
      >
        <Search className={isHero ? 'h-5 w-5' : 'h-4 w-4'} aria-hidden="true" />
      </span>
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
        className={`w-full bg-transparent font-bold text-ink-900 placeholder:font-medium placeholder:text-ink-400 focus:outline-none ${
          isHero ? 'min-h-11 text-[14.5px] md:text-[15px]' : 'min-h-9 text-[13px]'
        }`}
      />
      {value.trim() !== '' && (
        <button
          type="button"
          aria-label="پاک کردن عبارت جست‌وجو"
          onClick={() => {
            setValue('');
            if (variant === 'toolbar') {
              startTransition(() =>
                router.replace(buildHref('', preserveQuery), { scroll: false }),
              );
            }
          }}
          className={`grid shrink-0 place-items-center rounded-full text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700 ${
            isHero ? 'h-9 w-9' : 'h-8 w-8'
          }`}
        >
          ×
        </button>
      )}
      <button
        type="submit"
        disabled={pending}
        className={`shrink-0 transition-all disabled:opacity-60 ${
          isHero
            ? 'h-11 rounded-xl bg-gradient-to-l from-mint-500 to-mint-600 px-5 text-[13.5px] font-extrabold text-ink-950 shadow-[0_10px_26px_-10px_rgba(37,197,186,.9)] hover:from-mint-400 hover:to-mint-500 active:text-ink-900'
            : 'h-9 rounded-full bg-gradient-to-l from-brand-500 to-brand-700 px-4 text-[12px] font-extrabold text-white shadow-[0_8px_20px_-8px_rgba(13,128,116,.7)] hover:brightness-105'
        }`}
      >
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
