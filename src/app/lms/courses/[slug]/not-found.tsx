import Link from 'next/link';
import { GraduationCap, Library } from 'lucide-react';

export const metadata = { title: 'کلاس یافت نشد — قرارگاه آموزشی' };

/**
 * ۴۰۴ِ سگمنتِ دوره — هم‌خانواده با ۴۰۴ِ ریشه ولی به زبانِ قرارگاه:
 * کلاس ممکن است با اسلاگِ دیگری زندگی کند یا هنوز منتشر نشده باشد؛
 * مسیرِ امن بازگشت، هابِ آموزش است (نه خانه‌ی تنها).
 */
export default function CourseNotFound() {
  return (
    <section className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600 shadow-[inset_0_0_0_1px_rgba(13,128,116,.08)]">
          <GraduationCap className="h-7 w-7" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-2xl font-bold text-ink-900 md:text-3xl">این کلاس پیدا نشد</h1>
        <p className="mt-3 leading-8 text-ink-600">
          شاید نشانی را اشتباه آمده باشی، شاید کلاس با نامِ دیگری منتشر شده یا هنوز آماده‌ی عرضه‌ی
          عمومی نیست. نگاهی به فهرستِ کاملِ کلاس‌ها بینداز.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/lms" className="btn-primary btn-md">
            <Library className="h-4 w-4" /> همه‌ی آموزش‌ها
          </Link>
          <Link href="/" className="btn-outline btn-md">
            بازگشت به خانه
          </Link>
        </div>
      </div>
    </section>
  );
}
