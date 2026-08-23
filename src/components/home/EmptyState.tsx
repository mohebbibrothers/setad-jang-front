/**
 * EmptyState — used by every paginated section when the backend
 * returns zero items. Renders a quiet, dignified placeholder with a
 * brand-tinted icon disc and a one-line description.
 *
 * The wrapper takes full row width (`w-full` + `basis-full`) so when it
 * lives inside a flex/grid parent it always centres on its own line
 * instead of clinging to the RTL-right edge.
 */
export function EmptyState({
  title,
  description,
  iconPath,
}: {
  title: string;
  description?: string;
  /** Single SVG path 'd' attribute. Keeps the component dep-free.
   *  Use ' M …' multi-subpath strings when you need multiple strokes. */
  iconPath: string;
}) {
  return (
    <div className="flex w-full basis-full flex-col items-center px-4 py-12 text-center md:py-16">
      <div
        className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600 shadow-[inset_0_0_0_1px_rgba(13,128,116,.08)]"
        aria-hidden="true"
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={iconPath} />
        </svg>
      </div>
      <h3 className="max-w-md text-[15px] font-extrabold text-ink-900 md:text-[16px]">{title}</h3>
      {description && (
        <p className="mt-2 max-w-md text-[12.5px] font-medium leading-7 text-ink-500 md:text-[13px]">
          {description}
        </p>
      )}
    </div>
  );
}
