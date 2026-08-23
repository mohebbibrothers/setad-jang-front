import Link from 'next/link';
import { Home, Search } from 'lucide-react';

export const metadata = { title: 'صفحه یافت نشد' };

export default function NotFound() {
  return (
    <section className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <p className="text-gradient-brand text-[120px] font-extrabold leading-none">۴۰۴</p>
        <h1 className="mt-2 text-2xl font-bold text-ink-900 md:text-3xl">
          صفحه‌ای که دنبالش بودید پیدا نشد
        </h1>
        <p className="mt-3 leading-8 text-ink-600">
          ممکن است آدرس را اشتباه وارد کرده باشید یا این صفحه جابه‌جا شده باشد.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-primary btn-md">
            <Home className="h-4 w-4" /> بازگشت به خانه
          </Link>
          <Link href="/search" className="btn-outline btn-md">
            <Search className="h-4 w-4" /> جست‌وجو در سایت
          </Link>
        </div>
      </div>
    </section>
  );
}
