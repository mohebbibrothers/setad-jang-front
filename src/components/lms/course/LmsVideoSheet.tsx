'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { lockBodyScroll } from '@/lib/scroll-lock';
import type { LmsVideoSource } from '@/lib/lms-shared';

/**
 * شیتِ تماشای ویدئو — برای «ویدئوی معرفی» در هیرو و «پیش‌نمایشِ رایگان»‌ی
 * جلسات. سیاستِ رندرِ منبع (native vs embed) در classifyVideoUrl است؛
 * این شیت فقط نمایشگر است و هیچ URL خامِ جدیدی نمی‌پذیرد.
 * قابلیت‌ها: پورتال به body (پشت هیچ stacking context نمی‌ماند)، قفلِ
 * اسکرولِ بدنه، بستن با Esc و بک‌دراپ، فوکوسِ اولیه روی دکمه‌ی بستن.
 */
export function LmsVideoSheet({
  open,
  onClose,
  title,
  description,
  source,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  source: LmsVideoSource | null;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const unlock = lockBodyScroll();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const t = window.setTimeout(() => closeRef.current?.focus(), 40);
    return () => {
      unlock();
      document.removeEventListener('keydown', onKey);
      window.clearTimeout(t);
    };
  }, [open, onClose]);

  if (!open || !source || typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[95] flex items-center justify-center p-4 sm:p-6"
    >
      <button
        type="button"
        aria-label="بستن پخش‌کننده"
        onClick={onClose}
        className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-3xl overflow-hidden rounded-[20px] border border-white/10 bg-ink-900 shadow-[0_40px_90px_-30px_rgba(0,0,0,.9)]">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <p className="truncate text-[13px] font-extrabold text-white">{title}</p>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-300"
          >
            <X className="h-[18px] w-[18px]" aria-hidden="true" />
          </button>
        </div>
        <div className="aspect-video bg-black">
          {source.kind === 'native' ? (
            <video
              key={source.src}
              src={source.src}
              controls
              autoPlay
              playsInline
              className="h-full w-full"
            />
          ) : (
            <iframe
              key={source.src}
              src={source.src}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full border-0"
            />
          )}
        </div>
        {description && (
          <p className="border-t border-white/10 px-4 py-3 text-[12px] leading-6 text-white/70">
            {description}
          </p>
        )}
      </div>
    </div>,
    document.body,
  );
}
