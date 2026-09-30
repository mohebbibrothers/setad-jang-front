'use client';

import Link from 'next/link';
import {
  Award,
  BadgeCheck,
  ClipboardList,
  Loader2,
  LogIn,
  MessageCircleQuestion,
  Play,
  TrendingUp,
  UserRound,
} from 'lucide-react';

const fa = (n: number) => n.toLocaleString('fa-IR');

type Props = {
  lessonTitle: string;
  typeLabel: string;
  isPreview: boolean;
  state: 'guest' | 'restricted';
  busy: boolean;
  error: string | null;
  courseTitle: string;
  totalLessons: number;
  onLogin: () => void;
  onEnroll: () => void;
};

const PERKS = [
  { icon: TrendingUp, label: 'پیشرفتِ لحظه‌ای' },
  { icon: MessageCircleQuestion, label: 'پرسش از استاد' },
  { icon: ClipboardList, label: 'آزمون پایانی' },
  { icon: Award, label: 'گواهی رسمی' },
];

/**
 * پنلِ بازکردنِ قفل — تجربه‌ی «شروعِ مسیر»، نه صرفاً یک دیوارِ لاگین.
 * زبانِ سینماییِ هیروی سایت (کانواسِ ink + بافت + چیپ‌های شیشه‌ای) اینجا هم حاکم است.
 */
export function LessonUnlockPanel({
  lessonTitle,
  typeLabel,
  isPreview,
  state,
  busy,
  error,
  courseTitle,
  totalLessons,
  onLogin,
  onEnroll,
}: Props) {
  const isGuest = state === 'guest';
  return (
    <div className="relative overflow-hidden rounded-[22px] bg-ink-900 shadow-[0_36px_80px_-40px_rgba(0,0,0,.8)] ring-1 ring-ink-800/60">
      {/* بافتِ سینمایی */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 [background:radial-gradient(70%_90%_at_75%_10%,rgba(16,185,129,.18),transparent_60%),radial-gradient(50%_60%_at_10%_90%,rgba(14,159,138,.12),transparent_60%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[.35] [background-size:44px_44px] [background:linear-gradient(to_left,rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.03)_1px,transparent_1px)]"
      />

      <div className="relative px-5 py-7 text-center sm:px-10 sm:py-10">
        {/* چیپ‌های وضعیت */}
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-black/45 px-3 py-1 text-[10px] font-extrabold text-white/75 ring-1 ring-white/15 backdrop-blur-sm">
            {typeLabel}
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-extrabold ring-1 backdrop-blur-sm ${
              isPreview
                ? 'bg-mint-500/15 text-mint-200 ring-mint-300/25'
                : 'bg-black/45 text-white/75 ring-white/15'
            }`}
          >
            {isPreview ? 'جلسه‌ی رایگان' : 'ویژه‌ی اعضای کلاس'}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-black/45 px-3 py-1 text-[10px] font-extrabold text-white/75 ring-1 ring-white/15 backdrop-blur-sm">
            {fa(totalLessons)} جلسه در این مسیر
          </span>
        </div>

        {/* آیکونِ مرکزی */}
        <span className="bg-white/8 mx-auto mt-5 grid h-16 w-16 place-items-center rounded-[20px] ring-1 ring-white/15 backdrop-blur-sm">
          {isGuest ? (
            <UserRound className="h-7 w-7 text-mint-300" aria-hidden="true" />
          ) : (
            <Play className="h-7 w-7 text-mint-300" aria-hidden="true" />
          )}
        </span>

        <p className="mx-auto mt-4 max-w-md text-[19px] font-black leading-8 text-white sm:text-[22px] sm:leading-9">
          {isGuest
            ? isPreview
              ? 'این جلسه رایگان است — فقط یک قدم تا تماشا'
              : 'مسیر یادگیری از همین‌جا شروع می‌شود'
            : 'یک قدم تا بازشدنِ کلِ مسیر'}
        </p>
        <p className="mx-auto mt-2 max-w-md text-[12.5px] font-bold leading-7 text-white/55">
          {isGuest
            ? 'با ورود به حساب، این جلسه فوراً پخش می‌شود و پیشرفتت هم ذخیره می‌ماند.'
            : `با ثبت‌نام رایگان در «${courseTitle}»، همه‌ی جلسات، پرسش‌وپاسخ و آزمون پایانی — و در انتها گواهی رسمی — برایت باز می‌شود.`}
        </p>

        {/* مزیت‌ها */}
        <div className="mx-auto mt-5 grid max-w-lg grid-cols-2 gap-2 sm:grid-cols-4">
          {PERKS.map((p) => (
            <div
              key={p.label}
              className="ring-white/12 flex items-center justify-center gap-1.5 rounded-xl bg-black/40 px-2.5 py-2.5 ring-1 backdrop-blur-sm transition hover:bg-black/55"
            >
              <p.icon className="h-3.5 w-3.5 shrink-0 text-mint-300" aria-hidden="true" />
              <span className="text-[10.5px] font-extrabold text-white/80">{p.label}</span>
            </div>
          ))}
        </div>

        {/* مسیرِ سه‌قدمی (فقط برای ثبت‌نام) */}
        {!isGuest && (
          <ol className="mx-auto mt-6 flex max-w-md items-center justify-center gap-2 text-center">
            {['ثبت‌نام رایگان', 'تماشا و تمرین', 'گواهی پایان‌دوره'].map((step, i) => (
              <li key={step} className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10.5px] font-extrabold ${
                    i === 0
                      ? 'bg-mint-500 text-ink-950 shadow-[0_8px_20px_-8px_rgba(20,184,166,.7)]'
                      : 'ring-white/12 bg-black/40 text-white/60 ring-1'
                  }`}
                >
                  <span
                    className={`grid h-4 w-4 place-items-center rounded-full text-[9px] font-black ${
                      i === 0 ? 'bg-ink-950/20 text-ink-950' : 'bg-white/10 text-white/60'
                    }`}
                  >
                    {fa(i + 1)}
                  </span>
                  {step}
                </span>
                {i < 2 && <span className="h-px w-4 bg-white/20" aria-hidden="true" />}
              </li>
            ))}
          </ol>
        )}

        {/* CTA */}
        <div className="mt-7">
          {isGuest ? (
            <button
              type="button"
              onClick={onLogin}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-mint-500 px-9 text-[14px] font-black text-ink-950 shadow-[0_14px_32px_-10px_rgba(20,184,166,.7)] transition hover:-translate-y-0.5 hover:bg-mint-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-300"
            >
              <LogIn className="h-4 w-4" aria-hidden="true" />
              ورود | ثبت‌نام
            </button>
          ) : (
            <button
              type="button"
              onClick={onEnroll}
              disabled={busy}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-mint-500 px-9 text-[14px] font-black text-ink-950 shadow-[0_14px_32px_-10px_rgba(20,184,166,.7)] transition hover:-translate-y-0.5 hover:bg-mint-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-300 disabled:opacity-60"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <BadgeCheck className="h-4 w-4" aria-hidden="true" />
              )}
              {busy ? 'در حال ثبت‌نام…' : 'ثبت‌نام رایگان و شروع مسیر'}
            </button>
          )}
          {isGuest && (
            <p className="mt-3 text-[10.5px] font-bold text-white/40">
              «{lessonTitle}» و {fa(totalLessons - 1)} جلسه‌ی دیگر، یک‌ثبت‌نامه‌اند.
            </p>
          )}
          {error && (
            <p className="mx-auto mt-4 max-w-md rounded-xl bg-gold-400/15 px-4 py-2.5 text-[12px] font-bold leading-6 text-gold-200 ring-1 ring-gold-300/25">
              {error}{' '}
              {error.includes('پروفایل') && (
                <Link href="/profile" className="underline underline-offset-4 hover:text-gold-100">
                  تکمیل پروفایل ←
                </Link>
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
