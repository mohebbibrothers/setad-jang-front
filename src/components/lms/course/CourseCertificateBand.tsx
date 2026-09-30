import Link from 'next/link';
import { Award, BadgeCheck, ClipboardList, ScanLine } from 'lucide-react';
import { QuizMetaPanel } from './QuizMetaPanel';

/**
 * کارتِ «آزمون و گواهی» — نسخه‌ی جمع‌وجورِ باندِ قدیمیِ تمام‌عرض؛ همان
 * قراردادها (پنلِ زنده‌ی کوئیز + مسیرِ سه‌قدمیِ صدورِ گواهی + لینکِ
 * استعلام) اما فشرده و هم‌قدِ کارتِ مدرس، تا طولِ صفحه نصف شود.
 */
export function CourseCertificateBand({ slug }: { slug: string }) {
  return (
    <article
      aria-label="آزمون و گواهی پایان دوره"
      className="flex h-full flex-col overflow-hidden rounded-[22px] border border-ink-100 bg-white shadow-[0_16px_40px_-28px_rgba(11,53,48,.3)]"
    >
      <div className="flex items-center gap-2.5 border-b border-ink-100 bg-gradient-to-l from-mint-50/70 to-white px-5 py-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-mint-500/10 text-mint-700">
          <Award className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-[15px] font-black text-ink-900">آزمون بده، گواهیِ راستی‌آزما بگیر</h2>
          <p className="mt-0.5 text-[11px] font-bold text-ink-400">
            سندِ پایانِ مسیر با کدِ یکتای قابل‌استعلام
          </p>
        </div>
      </div>

      <div className="flex-1 p-5">
        <QuizMetaPanel slug={slug} />

        <div className="mt-5 border-t border-dashed border-ink-100 pt-4">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-ink-500">
            <BadgeCheck className="h-3.5 w-3.5 text-mint-700" aria-hidden="true" />
            سه قدم تا گواهی
          </p>
          <ol className="mt-2.5 grid list-none grid-cols-3 gap-2 p-0">
            {['جلسات را کامل بگذران', 'در آزمون بالای نصاب بیا', 'گواهی خودکار صادر می‌شود'].map(
              (t, i) => (
                <li
                  key={i}
                  className="flex flex-col items-center gap-2 rounded-xl bg-ink-50/70 px-2 py-2 ring-1 ring-ink-100/60 sm:flex-row sm:items-center sm:px-3 sm:py-2.5"
                >
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-mint-100 text-[10px] font-black text-mint-800">
                    {(i + 1).toLocaleString('fa-IR')}
                  </span>
                  <span className="text-[9.5px] font-bold leading-4 text-ink-600 sm:text-[10.5px] sm:leading-5">
                    {t}
                  </span>
                </li>
              ),
            )}
          </ol>
          <div className="mt-3.5 flex items-center justify-between gap-3">
            <p className="inline-flex items-center gap-1.5 text-[10.5px] font-bold leading-5 text-ink-400">
              <ClipboardList className="h-3.5 w-3.5 shrink-0 text-brand-600" aria-hidden="true" />
              آزمون در جلسه‌ی پایانیِ کلاس میزبان توست
            </p>
            <Link
              href="/lms#certificate-verify"
              prefetch={false}
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-mint-500/10 px-3 text-[10.5px] font-extrabold text-mint-800 ring-1 ring-mint-200 transition-colors hover:bg-mint-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-600"
            >
              <ScanLine className="h-3.5 w-3.5" aria-hidden="true" />
              استعلام گواهی
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
