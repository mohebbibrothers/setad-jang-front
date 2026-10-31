import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, HeartHandshake, Search, SearchX } from 'lucide-react';
import { KINDNESS_BOARD_PATH } from '@/lib/kindness-wall';

/**
 * صفحهٔ «این نیاز روی تخته نیست» — ۴۰۴ واقعی (برای سئو) با تجربهٔ مهربان.
 *
 * چرا این‌جا و نه not-found سراسری؟ چون سه دلیلِ محتملِ نبودنِ آگهی، پیامِ
 * متفاوتی لازم دارد و کاربر باید یک قدمِ بعدیِ روشن داشته باشد:
 *   • برطرف شد → دعوت به «دیوارِ نتیجه‌ها» و بقیهٔ نیازها
 *   • منقضی/بایگانی شد → دعوت به تختهٔ تازه
 *   • لینک اشتباه/کهنه → جست‌وجو در تخته
 * هیچ‌کدام از این‌ها به «صفحهٔ پیدا نشد»ی سرد ختم نمی‌شود.
 */

export const metadata: Metadata = {
  title: 'این نیاز روی تخته نیست | دیوار مهربانی',
  robots: { index: false, follow: true },
};

export default function KindnessListingNotFound() {
  return (
    <main className="relative overflow-hidden bg-ink-950 text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.45]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(-45deg, rgba(255,255,255,.035) 0 2px, transparent 2px 15px)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl"
      />
      <div className="container-edge relative flex min-h-[70vh] items-center py-16">
        <div className="mx-auto max-w-lg text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-white/[.06] ring-1 ring-white/10">
            <SearchX className="h-7 w-7 text-brand-300" aria-hidden="true" />
          </span>
          <h1 className="fa-title mt-6 text-[22px] font-black sm:text-[27px]">
            این نیاز دیگر روی دیوار نیست
          </h1>
          <p className="mt-3 text-[12.5px] font-medium leading-7 text-white/65 sm:text-[13.5px]">
            شاید برآورده شده باشد و به «دیوارِ نتیجه‌ها» رفته، شاید مهلتش تمام شده یا آدرس کهنه است.
            تخته همیشه در حالِ تازه‌شدن است — یک بار دیگر بگرد.
          </p>

          <div className="mt-7 flex flex-col items-stretch justify-center gap-2.5 sm:flex-row">
            <Link
              href={`${KINDNESS_BOARD_PATH}#board`}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#0D8074,#0A6E64_50%,#085C54)] px-6 text-[13px] font-extrabold text-white shadow-[0_10px_24px_-10px_rgba(13,128,116,.75)] transition-all hover:brightness-[1.08] active:scale-[.99]"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              گشتن در تختهٔ نیازها
            </Link>
            <Link
              href="/#kindness"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/[.06] px-5 text-[12.5px] font-extrabold text-white transition-colors hover:border-brand-300/50 hover:bg-white/[.12]"
            >
              <HeartHandshake className="h-4 w-4" aria-hidden="true" />
              دیوار مهربانی در صفحهٔ اصلی
            </Link>
          </div>

          <p className="mt-6 inline-flex items-center gap-1.5 text-[10.5px] font-bold text-white/40">
            <BadgeCheck className="h-3.5 w-3.5 text-mint-300/70" aria-hidden="true" />
            نیازهای برآورده‌شده در «دیوارِ نتیجه‌ها» بایگانی می‌شوند تا اثرشان بماند.
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </p>
        </div>
      </div>
    </main>
  );
}
