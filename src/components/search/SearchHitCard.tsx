import Link from 'next/link';
import { SmartImage, type SmartImageVariant } from '@/components/ui/SmartImage';
import type { SearchHit } from '@/lib/global-search';

/**
 * ═══════════════════════════════════════════════════════════════════
 *  SearchHitCard — کارتِ یکتای رندرِ هر نتیجه در جست‌وجوی سراسری.
 *
 *  چرا جدا؟ قبلاً مارک‌آپِ کارت فقط داخل صفحه‌ی سرورِ /search بود و با
 *  آمدنِ «نمایش بیشتر» باید همان کارت را در کلاینت هم می‌ساختیم؛ تکثیرِ
 *  مارک‌آپ یعنی انحرافِ تدریجیِ دو نسخه. حالا یک منبعِ واحد هم برای
 *  رندرِ اولیه (SSR) هم برای آیتم‌های چسبیده‌شده در کلاینت استفاده
 *  می‌شود — بدون directive، پس هم در سرور هم در کلاینت قابل رندر است.
 *
 *  نشانِ کوچکِ ▶ / میکروفن روی تامنیلِ روایت‌های ویدئویی/صوتی می‌نشیند
 *  تا نوعِ رسانه بدون خواندنِ چیپ هم خوانا باشد (الگوی رایجِ YouTube…).
 * ═══════════════════════════════════════════════════════════════════
 */

function MediaKindOverlay({ kind }: { kind: SearchHit['kind'] }) {
  if (kind !== 'video' && kind !== 'audio') return null;
  return (
    <span
      aria-hidden="true"
      className="absolute bottom-1 end-1 inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-black/55 text-white ring-1 ring-white/40 backdrop-blur-[2px]"
    >
      {kind === 'video' ? (
        <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="currentColor">
          <path d="M8 5.14v13.72c0 .9.97 1.45 1.74.98l11-6.86a1.13 1.13 0 0 0 0-1.96l-11-6.86A1.13 1.13 0 0 0 8 5.14Z" />
        </svg>
      ) : (
        <svg
          viewBox="0 0 24 24"
          className="h-2.5 w-2.5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="9" y="3" width="6" height="11" rx="3" />
          <path d="M5 11a7 7 0 0 0 14 0" />
          <path d="M12 18v3" />
        </svg>
      )}
    </span>
  );
}

export function SearchHitCard({ hit, variant }: { hit: SearchHit; variant: SmartImageVariant }) {
  return (
    <Link
      href={hit.href}
      className="group flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-ink-100 transition-all duration-200 hover:shadow-[0_14px_30px_-18px_rgba(11,53,48,.25)] hover:ring-brand-200"
    >
      <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-ink-100">
        <SmartImage
          src={hit.thumb}
          alt={hit.title}
          variant={variant}
          fill
          sizes="56px"
          className="object-cover"
        />
        <MediaKindOverlay kind={hit.kind} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] font-extrabold text-ink-900">
          {hit.title}
        </span>
        {hit.subtitle && (
          <span className="mt-0.5 block truncate text-[11.5px] text-ink-500">{hit.subtitle}</span>
        )}
        {(hit.badge || hit.pill) && (
          <span className="mt-1.5 flex items-center gap-1.5 text-[11px] font-bold">
            {hit.pill && (
              <span className="inline-flex h-5 items-center rounded-full bg-brand-50 px-2 text-brand-700">
                {hit.pill}
              </span>
            )}
            {hit.badge && <span className="text-ink-600">{hit.badge}</span>}
          </span>
        )}
      </span>
    </Link>
  );
}
