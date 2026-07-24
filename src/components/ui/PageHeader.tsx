import Link from 'next/link';

/**
 * Reusable breadcrumb + page title header for detail pages.
 * ─ RTL-aware · brand-tinted · lightweight (server component-safe).
 */

export type Crumb = { label: string; href?: string };

export function PageHeader({
  crumbs,
  title,
  eyebrow,
  actions,
  description,
}: {
  crumbs: Crumb[];
  title: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  description?: string;
}) {
  return (
    <header className="border-b border-ink-100 bg-white">
      <div className="container-edge py-5 md:py-6">
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="mb-3 text-[12px] text-ink-500">
          <ol className="flex items-center flex-wrap gap-x-1.5 gap-y-1">
            {crumbs.map((c, i) => {
              const isLast = i === crumbs.length - 1;
              return (
                <li key={`${c.label}-${i}`} className="inline-flex items-center gap-1.5">
                  {c.href && !isLast ? (
                    <Link href={c.href} className="hover:text-brand-700 font-bold transition-colors">
                      {c.label}
                    </Link>
                  ) : (
                    <span className={`font-bold ${isLast ? 'text-ink-800' : 'text-ink-500'}`}>
                      {c.label}
                    </span>
                  )}
                  {!isLast && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-ink-300">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            {eyebrow && (
              <p className="text-[12px] font-extrabold text-brand-600 uppercase tracking-wider mb-1.5">
                {eyebrow}
              </p>
            )}
            <h1 className="text-[20px] md:text-[26px] font-extrabold text-ink-900 leading-tight break-words">
              {title}
            </h1>
            {description && (
              <p className="mt-2 text-[13.5px] md:text-[14.5px] text-ink-600 leading-7 max-w-3xl">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="shrink-0 flex items-center gap-2 flex-wrap">{actions}</div>}
        </div>
      </div>
    </header>
  );
}
