import { Award, Flag, LineChart, MonitorPlay } from 'lucide-react';

/**
 * نوارِ اطمینان — سیگنالِ «این یک سکوی یادگیریِ واقعی است، نه صفحه‌ی لینک»،
 * هر کدام آینه‌ی مستقیمِ یک توانمندیِ مدرک‌دار در بک‌اند:
 *  • Lesson.content_type → چهار رسانه
 *  • Quiz + Certificate.verification_slug → آزمون و گواهیِ راستی‌آزما
 *  • Course.level → چهار سطحِ شفاف
 *  • course-completion: ۹۰٪ تماشا + علامتِ «خواندم» → پیشرفتِ قابل‌پیگیری
 */
const ITEMS = [
  {
    icon: MonitorPlay,
    title: 'چهار گونه‌ی رسانه',
    text: 'ویدئو، صوت، سند PDF و متنِ غنی — هر جلسه به شیوه‌ای که به محتوایش می‌آید.',
  },
  {
    icon: Award,
    title: 'آزمون + گواهی راستی‌آزما',
    text: 'آزمونِ پایانِ دوره با آستانه‌ی قبولیِ شفاف؛ اعتبارِ هر گواهی برای همه قابل استعلام است.',
  },
  {
    icon: Flag,
    title: 'سطح‌بندیِ شفاف',
    text: 'از مقدماتی تا حرفه‌ای — مسیرِ رشد روشن است و هر کلاس سطحش را از همان نگاه اول می‌گوید.',
  },
  {
    icon: LineChart,
    title: 'پیشرفتِ قابل‌پیگیری',
    text: 'تماشای ویدئو و صوت با ۹۰٪ و مطالعه‌ی سند و متن با علامتِ «خواندم» ثبت می‌شود.',
  },
];

export function LmsAssuranceStrip() {
  return (
    <section className="container-edge relative z-10 -mt-8">
      <div className="grid gap-3 rounded-3xl border border-ink-100 bg-white p-4 shadow-[0_12px_32px_-20px_rgba(15,20,32,.25)] sm:grid-cols-2 md:p-5 xl:grid-cols-4">
        {ITEMS.map((it) => (
          <div key={it.title} className="flex items-start gap-3 rounded-2xl bg-ink-50/60 p-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-500/10 text-brand-700">
              <it.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-extrabold text-ink-900">{it.title}</p>
              <p className="mt-1 text-[11px] leading-6 text-ink-500">{it.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
