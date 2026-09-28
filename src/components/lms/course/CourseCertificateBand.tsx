import Link from 'next/link';
import { Award, BadgeCheck, ClipboardList, ScanLine } from 'lucide-react';
import { QuizMetaPanel } from './QuizMetaPanel';

/**
 * باندِ «آزمون + گواهی» — ترجمانِ دو قابلیتِ backend در یک قاب:
 *  • کوئیزِ پایان دوره (metadataِ زنده و احرازشده در QuizMetaPanel)؛
 *  • گواهی با verification_slug — مسیرِ صدور + لینک به استعلامِ عمومی
 *    که موجِ دوم در هاب /lms راه افتاد.
 */
export function CourseCertificateBand({ slug }: { slug: string }) {
  return (
    <section aria-label="آزمون و گواهی پایان دوره">
      <div className="flex flex-col items-center text-center">
        <p className="inline-flex items-center gap-1.5 text-[12px] font-extrabold text-mint-700">
          <Award className="h-3.5 w-3.5" aria-hidden="true" />
          سند پایان مسیر
        </p>
        <h2 className="mt-1 text-[22px] font-black text-ink-900 md:text-[26px]">
          آزمون بده، گواهیِ راستی‌آزما بگیر
        </h2>
        <p className="mt-2 max-w-prose text-[12.5px] leading-7 text-ink-500">
          پایانِ هر کلاس در قرارگاه، یک آزمون و یک گواهی با کدِ یکتاست — مدرکی که هر کسی می‌تواند
          اصالتش را آنلاین استعلام کند.
        </p>
      </div>

      <div className="mx-auto mt-8 grid max-w-3xl gap-4 md:grid-cols-2">
        {/* آزمون */}
        <div className="overflow-hidden rounded-[20px] border border-ink-100 bg-white shadow-[0_14px_34px_-26px_rgba(11,53,48,.3)]">
          <div className="flex items-center gap-2.5 border-b border-ink-100 bg-gradient-to-l from-brand-50/70 to-white px-5 py-4">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500/10 text-brand-700">
              <ClipboardList className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-[14.5px] font-black text-ink-900">آزمون پایان دوره</h3>
              <p className="text-[11px] font-bold text-ink-400">
                خودارزیابیِ واقعی با snapshotِ امنِ سؤالات
              </p>
            </div>
          </div>
          <div className="p-5">
            <QuizMetaPanel slug={slug} />
          </div>
        </div>

        {/* گواهی */}
        <div className="overflow-hidden rounded-[20px] border border-ink-100 bg-white shadow-[0_14px_34px_-26px_rgba(11,53,48,.3)]">
          <div className="flex items-center gap-2.5 border-b border-ink-100 bg-gradient-to-l from-mint-50/70 to-white px-5 py-4">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-mint-500/10 text-mint-700">
              <BadgeCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-[14.5px] font-black text-ink-900">گواهی راستی‌آزما</h3>
              <p className="text-[11px] font-bold text-ink-400">با کدِ یکتای قابل‌استعلام</p>
            </div>
          </div>
          <div className="p-5">
            <ol className="list-none space-y-2.5 p-0">
              {[
                'جلسات کلاس را کامل بگذران',
                'در آزمونِ پایان دوره بالای آستانه‌ی قبولی بیا',
                'گواهی با کدِ یکتا خودکار برایت صادر می‌شود',
              ].map((t, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-[12.5px] font-bold text-ink-600"
                >
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-mint-100 text-[10px] font-black text-mint-800">
                    {(i + 1).toLocaleString('fa-IR')}
                  </span>
                  {t}
                </li>
              ))}
            </ol>
            <Link
              href="/lms#certificate-verify"
              prefetch={false}
              className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-full bg-mint-500/10 px-3.5 text-[11.5px] font-extrabold text-mint-800 ring-1 ring-mint-200 transition-colors hover:bg-mint-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-600"
            >
              <ScanLine className="h-3.5 w-3.5" aria-hidden="true" />
              استعلامِ یک گواهی ببین
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
