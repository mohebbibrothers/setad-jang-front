'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, FileText, Share2, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * ═══════════════════════════════════════════════════════════════════
 * JusticeActionBar — نوارِ عملیاتِ چسبانِ موبایل + دکمه‌ی اشتراک‌گذاری
 *
 *   • الگوی آشنای استودیو: fixed bottom + lg:hidden + safe-area.
 *   • اشتراک‌گذاری: navigator.share (Web Share API) → فالبکِ
 *     کپی لینک با بازخوردِ «کپی شد».
 * ═══════════════════════════════════════════════════════════════════
 */

async function shareCase(title: string, text: string): Promise<'shared' | 'copied' | 'failed'> {
  const url = window.location.href;
  if (typeof navigator !== 'undefined' && 'share' in navigator) {
    try {
      await navigator.share({ title, text, url });
      return 'shared';
    } catch {
      // کاربر لغو کرد یا پشتیبانی نشد → فالبک
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    return 'copied';
  } catch {
    return 'failed';
  }
}

export function ShareCaseButton({ name, className }: { name: string; className?: string }) {
  const [state, setState] = useState<'idle' | 'copied'>('idle');
  return (
    <button
      type="button"
      onClick={async () => {
        const result = await shareCase(
          `پرونده‌ی ${name} — جایزه‌ای برای عدالت`,
          `پرونده‌ی عمومیِ ${name} در صندوقِ عدالتِ مردمی`,
        );
        if (result === 'copied') {
          setState('copied');
          window.setTimeout(() => setState('idle'), 2000);
        }
      }}
      className={cn(
        'inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-[12px] font-extrabold transition-colors',
        state === 'copied'
          ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
          : 'border-white/20 bg-white/10 text-white hover:bg-white/20',
        className,
      )}
    >
      {state === 'copied' ? (
        <Check className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Share2 className="h-4 w-4" aria-hidden="true" />
      )}
      {state === 'copied' ? 'لینک کپی شد' : 'اشتراک‌گذاری'}
    </button>
  );
}

export function JusticeActionBar({ slug }: { slug: string }) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-200/80 bg-white/95 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-[0_-8px_24px_-12px_rgba(15,20,32,.25)] backdrop-blur-md lg:hidden"
      role="region"
      aria-label="اقدامات پرونده"
    >
      <div className="mx-auto grid max-w-md grid-cols-2 gap-2 px-3">
        <Link
          href={`/r4j/${encodeURIComponent(slug)}/bounty`}
          className="flex items-center justify-center gap-2 rounded-2xl bg-accent-500 px-4 py-3 text-[13px] font-extrabold text-white shadow-md shadow-accent-500/30 transition-transform active:scale-[.98]"
        >
          <Trophy className="h-4 w-4" aria-hidden="true" />
          افزایش جایزه
        </Link>
        <Link
          href={`/r4j/${encodeURIComponent(slug)}/report`}
          className="flex items-center justify-center gap-2 rounded-2xl bg-brand-600 px-4 py-3 text-[13px] font-extrabold text-white shadow-md shadow-brand-900/20 transition-transform active:scale-[.98]"
        >
          <FileText className="h-4 w-4" aria-hidden="true" />
          گزارش اطلاعات
        </Link>
      </div>
    </div>
  );
}
