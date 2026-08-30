'use client';

import { BadgeCheck, Clock3, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { submissionStatusMeta, type SubmissionStatusValue } from '@/lib/studio';

/**
 * چیپِ وضعیتِ بررسی برای روایت‌های مردمی — منبعِ واحدِ ظاهر که پنلِ
 * استودیو (MySubmissions) و داشبوردِ «روایت‌های من» (/tabyin/mine)
 * هر دو از آن استفاده می‌کنند تا تفسیرِ سه وضعیتِ حلقه‌ی اعتماد
 * (درانتظار/تأیید/رد) در همه‌جا یک‌دست بماند.
 */

const TONE_CLASSES: Record<string, string> = {
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  rose: 'bg-rose-50 text-rose-700 ring-rose-200',
  ink: 'bg-ink-50 text-ink-500 ring-ink-100',
};

const STATUS_ICONS: Record<string, typeof Clock3> = {
  pending_review: Clock3,
  approved: BadgeCheck,
  rejected: XCircle,
};

export function StatusChip({ status }: { status: SubmissionStatusValue }) {
  const meta = submissionStatusMeta(status);
  const ChipIcon = STATUS_ICONS[status] ?? Clock3;
  return (
    <span
      className={cn(
        'inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2 text-[10.5px] font-extrabold ring-1 ring-inset',
        TONE_CLASSES[meta.tone],
      )}
    >
      <ChipIcon className="h-3 w-3" />
      {meta.label}
    </span>
  );
}
