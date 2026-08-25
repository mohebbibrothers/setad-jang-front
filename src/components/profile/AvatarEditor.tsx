'use client';

/**
 * ═══════════════════════════════════════════════════════════════════
 * AvatarEditor — عکس پروفایل با آپلودِ مستقیم به PATCH /auth/profile/
 *
 * قراردادِ دقیقِ بک‌اند (UpdateProfileSerializer):
 *   • avatar یک ImageField است → آپلود فقط با multipart/form-data؛
 *   • حذفِ عکس در بک‌اند پشتیبانی نمی‌شود (null در سرویس نادیده گرفته
 *     می‌شود) → UI فقط «آپلود/جایگزینی» دارد، نه حذف (راستگوییِ قرارداد)؛
 *   • پاسخِ موفق = ProfileSerializer کامل با مسیر avatar جدید (نسبی
 *     /media/… که با absoluteMediaUrl حل می‌شود).
 *
 * تجربه: انتخاب فایل → پیش‌نمایشِ لحظه‌ای (objectURL) + لایه‌ی busy →
 * موفقیت = URL سرور جایگزین می‌شود؛ خطا = بازگشت به عکس قبلی + پیام.
 * ═══════════════════════════════════════════════════════════════════
 */

import { useEffect, useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { updateProfile, type AuthProfile } from '@/lib/auth';
import { applyUserPatch } from '@/lib/use-auth';
import { firstErrorMessage } from '@/lib/api';
import { absoluteMediaUrl, cn } from '@/lib/utils';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // ۵ مگابایت — سقفِ محتاطانه‌ی کلاینت

export function AvatarEditor({
  avatar,
  fallbackText,
  size = 96,
  onError,
  onUploaded,
}: {
  /** مسیر avatar از ProfileSerializer (نسبی یا مطلق) */
  avatar: string | null | undefined;
  /** حرفِ اولِ نام برای وقتی عکس نیست */
  fallbackText: string;
  size?: number;
  onError?: (message: string) => void;
  onUploaded?: (profile: AuthProfile) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  // آزادسازیِ objectURL هنگام تعویض/آن‌مونت — بدون نشتِ حافظه
  useEffect(
    () => () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    },
    [],
  );

  const resolved = preview ?? absoluteMediaUrl(avatar);

  const pick = () => {
    if (!busy) inputRef.current?.click();
  };

  const handleFile = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      onError?.('فقط فایل تصویری قابل آپلود است.');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      onError?.('حجم عکس نباید بیشتر از ۵ مگابایت باشد.');
      return;
    }

    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const objectUrl = URL.createObjectURL(file);
    objectUrlRef.current = objectUrl;
    setPreview(objectUrl);
    setBusy(true);

    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const fresh = await updateProfile(fd);
      // سینکِ سراسری: عکس جدید بلافاصله در هدر و همه‌جا دیده شود
      applyUserPatch({ profile: fresh });
      onUploaded?.(fresh);
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
      setPreview(null);
    } catch (err) {
      setPreview(null);
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      onError?.(firstErrorMessage(err) ?? 'آپلود عکس انجام نشد. دوباره تلاش کنید.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="relative inline-block">
      <span
        aria-hidden={resolved ? undefined : true}
        className={cn(
          'flex items-center justify-center overflow-hidden rounded-full bg-white/20 font-extrabold text-white ring-4 ring-white/85',
          busy && 'opacity-80',
        )}
        style={{ width: size, height: size, fontSize: size * 0.36 }}
      >
        {resolved ? (
          // eslint-disable-next-line @next/next/no-img-element -- آواتار از بک‌اند رسانه‌ای با URL پویا؛ next/image برای آن ریموت‌پترن ثابت ندارد
          <img
            src={resolved}
            alt="عکس پروفایل"
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          fallbackText.trim().charAt(0) || 'ب'
        )}
      </span>

      {busy ? (
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-ink-900/35">
          <Loader2 className="h-6 w-6 animate-spin text-white" strokeWidth={2.4} />
        </span>
      ) : null}

      <button
        type="button"
        onClick={pick}
        disabled={busy}
        aria-label="تغییر عکس پروفایل"
        className="absolute bottom-0 left-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-brand-500 text-white shadow-md transition-all duration-200 hover:bg-brand-600 active:scale-95 disabled:opacity-70"
      >
        <Camera className="h-4 w-4" strokeWidth={2.2} />
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}
