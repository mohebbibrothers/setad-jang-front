'use client';

import { Landmark } from 'lucide-react';
import { useState } from 'react';

/**
 * لوگوی مددکار — کوچک (پیش‌فرض: چیپ‌های فشرده) و بزرگ (کارت‌های سالن اعتماد).
 *
 * چرا کامپوننتِ کلاینت؟ صفحهٔ حب یک Server Component است و پراپ‌های تابعی
 * (مثل onError) در پیلودِ RSC سریالایز نمی‌شوند — پرеренدرِ بیلد در CI
 * (که به API واقعی می‌زند و اسپانسر دارد) با خطای
 * «Event handlers cannot be passed to Client Component props» می‌افتاد.
 * مدیریتِ خطا این‌جا داخلی است: اگر تصویر لود نشد، آیکونِ فالبک جایگزین می‌شود
 * (به‌جای حلقهٔ خالیِ نامفهوم).
 */
const SIZES = {
  sm: {
    box: 'h-7 w-7 rounded-full',
    icon: 'h-3.5 w-3.5',
  },
  lg: {
    box: 'h-11 w-11 rounded-xl',
    icon: 'h-5 w-5',
  },
} as const;

export function SponsorLogo({
  src,
  size = 'sm',
}: {
  src: string | null | undefined;
  size?: keyof typeof SIZES;
}) {
  const [failed, setFailed] = useState(false);
  const s = SIZES[size] ?? SIZES.sm;
  return (
    <span
      className={`relative flex items-center justify-center overflow-hidden bg-ink-50 ring-1 ring-ink-100 ${s.box}`}
    >
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <Landmark className={`${s.icon} text-ink-400`} aria-hidden="true" />
      )}
    </span>
  );
}
