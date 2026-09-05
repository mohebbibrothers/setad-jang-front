'use client';

import { Landmark } from 'lucide-react';
import { useState } from 'react';

/**
 * لوگوی دایره‌ایِ مددکار در نوارِ اسپانسرهای حبِ /madadkar.
 *
 * چرا کامپوننتِ کلاینت؟ صفحهٔ حب یک Server Component است و پراپ‌های تابعی
 * (مثل onError) در پیلودِ RSC سریالایز نمی‌شوند — پرеренدرِ بیلد در CI
 * (که به API واقعی می‌زند و اسپانسر دارد) با خطای
 * «Event handlers cannot be passed to Client Component props» می‌افتاد.
 * مدیریتِ خطا این‌جا داخلی است: اگر تصویر لود نشد، آیکونِ فالبک جایگزین می‌شود
 * (به‌جای حلقهٔ خالیِ نامفهوم).
 */
export function SponsorLogo({ src }: { src: string | null | undefined }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className="relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-ink-50 ring-1 ring-ink-100">
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
        <Landmark className="h-3.5 w-3.5 text-ink-400" aria-hidden="true" />
      )}
    </span>
  );
}
