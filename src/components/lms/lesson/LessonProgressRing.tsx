'use client';

const fa = (n: number) => n.toLocaleString('fa-IR');

type Props = {
  percent: number; // ۰ تا ۱۰۰
  size?: number;
  stroke?: number;
  label?: string;
};

/**
 * حلقه‌ی پیشرفت — قرائت یک‌نگاهه‌ی «کجای مسیرم».
 * گرادیانِ برند→مینت روی کمان؛ عددِ فارسی در مرکز؛ کاملاً SVG (بدون وابستگی).
 */
export function LessonProgressRing({ percent, size = 84, stroke = 8, label }: Props) {
  const p = Math.max(0, Math.min(100, percent));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const done = (p / 100) * c;
  const gid = `lpg-${size}-${stroke}`;
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-brand-500, #0e9f8a)" />
            <stop offset="100%" stopColor="var(--color-mint-400, #34d399)" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-ink-100"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${done} ${c - done}`}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="text-[17px] font-black tabular-nums leading-none text-ink-900">
            {fa(Math.round(p))}
            <span className="text-[10px] font-extrabold text-ink-400">٪</span>
          </p>
          {label && (
            <p className="mt-1 text-[8.5px] font-bold leading-none text-ink-400">{label}</p>
          )}
        </div>
      </div>
    </div>
  );
}
