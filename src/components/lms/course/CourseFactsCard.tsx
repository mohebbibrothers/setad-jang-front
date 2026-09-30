import {
  Award,
  Clock3,
  GraduationCap,
  Infinity as InfinityIcon,
  ListVideo,
  MessagesSquare,
  Users,
} from 'lucide-react';
import { formatLmsDuration, type LmsCourseDetail } from '@/lib/lms-shared';

/**
 * کارتِ «مشخصات کلاس» — زیرِ کارتِ وضعیت در ریل می‌نشیند؛ مشخصاتِ کلیدی
 * را در یک نگاه می‌دهد و وعده‌های اطمینان (آزمون، گواهی، پرسش‌وپاسخ،
 * بدونِ محدودیتِ زمان) را همیشه کنارِ دکمه‌ی تصمیم نگه می‌دارد.
 * سرورکامپوننتِ خالص — داده از SSR می‌آید و وابستگی به auth ندارد.
 */

const fa = (n: number) => n.toLocaleString('fa-IR');

export function CourseFactsCard({ course }: { course: LmsCourseDetail }) {
  const duration = formatLmsDuration(course.durationSeconds);
  const facts: Array<{ icon: typeof ListVideo; value: string; label: string }> = [
    { icon: ListVideo, value: fa(course.lessonsCount), label: 'جلسه‌ی ساخت‌یافته' },
    ...(duration ? [{ icon: Clock3, value: duration, label: 'مدتِ یادگیری' }] : []),
    { icon: Users, value: fa(course.enrollmentsCount), label: 'یادگیرنده' },
    { icon: GraduationCap, value: fa(course.graduatesCount), label: 'فارغ‌التحصیل' },
  ];
  const assurances: Array<{ icon: typeof Award; text: string }> = [
    { icon: Award, text: 'گواهی پایان دوره با کدِ راستی‌آزما' },
    { icon: MessagesSquare, text: 'پرسش‌وپاسخِ زنده زیر هر جلسه' },
    { icon: InfinityIcon, text: 'یادگیری بدون محدودیتِ زمان' },
  ];

  return (
    <section
      aria-label="مشخصات کلاس"
      className="overflow-hidden rounded-[22px] border border-ink-100 bg-white p-4 shadow-[0_16px_40px_-34px_rgba(11,53,48,.45)]"
    >
      <h2 className="sr-only">مشخصات کلاس</h2>
      <dl className="grid grid-cols-2 gap-2">
        {facts.map((f) => (
          <div
            key={f.label}
            className="flex items-center gap-2.5 rounded-xl bg-ink-50/70 px-3 py-2.5 ring-1 ring-ink-100/60"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-brand-700 shadow-sm ring-1 ring-ink-100">
              <f.icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <dd className="truncate text-[12.5px] font-black tabular-nums text-ink-900">
                {f.value}
              </dd>
              <dt className="text-[10px] font-bold text-ink-400">{f.label}</dt>
            </span>
          </div>
        ))}
      </dl>
      <ul className="mt-3 list-none space-y-2 border-t border-dashed border-ink-100 pt-3">
        {assurances.map((a) => (
          <li key={a.text} className="flex items-center gap-2.5">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-mint-50 text-mint-700 ring-1 ring-mint-100">
              <a.icon className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <span className="text-[11.5px] font-bold text-ink-600">{a.text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
