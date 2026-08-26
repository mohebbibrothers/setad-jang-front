'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { AuthControls } from '@/components/auth/AuthControls';
import { AuthModal } from '@/components/auth/AuthModal';
import { lockBodyScroll } from '@/lib/scroll-lock';
import { TopBar } from './TopBar';
import { cn } from '@/lib/utils';

type NavItem = { label: string; href: string };

/**
 * Primary navigation — final spec from the client.
 *
 * RTL reading order (right → left visually): خانه · پشتیبانی مالی جنگ ·
 * جایزه‌ای برای عدالت · قرارگاه آموزشی · دیوار مهربانی · جهاد تبیین ·
 * ارتباط با ما.
 *
 * Hrefs are in-page anchors for the five domain sections (so the header
 * smooth-scrolls instead of jumping to a separate route) plus '/' for
 * 'خانه'. The delegated anchor handler we already ship globally takes
 * care of the smooth-scroll.
 *
 * NOTE — 'ارتباط با ما' (/contact) was removed pending its dedicated
 * page. Add it back the moment src/app/contact/page.tsx exists.
 */
const NAV: NavItem[] = [
  { label: 'خانه', href: '/' },
  { label: 'پشتیبانی مالی جنگ', href: '/#warfund' },
  { label: 'جایزه‌ای برای عدالت', href: '/#justice' },
  { label: 'قرارگاه آموزشی', href: '/#education' },
  { label: 'دیوار مهربانی', href: '/#kindness' },
  { label: 'جهاد تبیین', href: '/#tabyin' },
  { label: 'گزارش‌های مردمی', href: '/#reports' },
];

/** Smooth-scroll to the anchor when the user is already on '/'. Falls
 *  back to default <a> behaviour (cross-page nav) otherwise. */
function onNavClick(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
  if (typeof window === 'undefined') return;
  if (!href.startsWith('/#')) return;
  if (window.location.pathname !== '/') return;
  const id = href.slice(2);
  const el = document.getElementById(id);
  if (!el) return;
  e.preventDefault();
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  window.history.replaceState(null, '', href);
}

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  /** بازکردن مودال احراز هویت — از هر جا (دسکتاپ/موبایل) که آمد،
   *  شیت موبایل را هم می‌بندد تا دو لایه روی هم نیفتند. */
  const openAuth = () => {
    setOpen(false);
    setAuthOpen(true);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // قفل اسکرولِ شیت موبایل از مالکِ متمرکز (scroll-lock): شمارش‌مرجعی و
  // تودرتو-امن — با قفلِ مودال احراز هویت برخورد نمی‌کند و هنگام
  // بازشدنِ مودال از دلِ شیت (openAuth) ترتیبِ آزادسازی تضمینی است.
  useEffect(() => {
    if (!open) return;
    return lockBodyScroll();
  }, [open]);

  return (
    <>
      <div className={cn('sticky top-0 z-50', scrolled && 'shadow-sm')}>
        <TopBar />
        <header
          className={cn(
            'border-b border-ink-100 bg-white transition-shadow',
            scrolled ? 'shadow-soft' : '',
          )}
          role="banner"
        >
          <div className="container-edge flex h-16 items-center gap-4 lg:h-20">
            {/* Logo (RTL: visually right) */}
            <Link
              href="/"
              className="flex shrink-0 items-center"
              aria-label="بعثت مردم — صفحه اصلی"
            >
              <Logo width={120} priority />
            </Link>

            {/* Desktop nav (centered) */}
            <nav className="mx-auto hidden items-center gap-1 lg:flex" aria-label="ناوبری اصلی">
              {NAV.map((item) => (
                <a
                  key={item.href + item.label}
                  href={item.href}
                  onClick={(e) => onNavClick(e, item.href)}
                  className="whitespace-nowrap rounded-lg px-3.5 py-2 text-[14.5px] font-medium text-ink-700 transition-colors hover:bg-brand-50/60 hover:text-brand-600"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            {/* Trailing slot — ناحیه‌ی حساب کاربری (پیل ورود | ثبت‌نام
             * برای مهمان، چیپ کاربر پس از ورود) + دکمه‌ی منوی موبایل. */}
            <div className="mr-auto flex items-center gap-2">
              <AuthControls onOpen={openAuth} />
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-ink-800 transition-colors hover:bg-ink-100 lg:hidden"
                aria-label={open ? 'بستن منو' : 'باز کردن منو'}
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
              >
                {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </header>
      </div>

      {/* Mobile sheet */}
      <div
        className={cn(
          'fixed inset-0 z-[60] transition-opacity duration-300 lg:hidden',
          open ? 'visible opacity-100' : 'invisible opacity-0',
        )}
        aria-hidden={!open}
      >
        {/* لایه‌ی تیره‌ی پشت شیت: touch-none یعنی ژستِ لمسی روی این ناحیه
            هرگز به اسکرولِ صفحه‌ی زیرین نشت نمی‌کند (scroll-chaining)؛
            قفلِ خود صفحه هم iOS-Safe در scroll-lock انجام می‌شود. */}
        <button
          className="absolute inset-0 touch-none bg-ink-900/45"
          onClick={() => setOpen(false)}
          aria-label="بستن منو"
        />
        <aside
          className={cn(
            'absolute right-0 top-0 h-full w-[88%] max-w-sm overscroll-contain bg-white shadow-float',
            'flex flex-col transition-transform duration-300 ease-out',
            open ? 'translate-x-0' : 'translate-x-full',
          )}
        >
          <div className="flex h-16 items-center justify-between border-b border-ink-100 px-4">
            <Link href="/" onClick={() => setOpen(false)} aria-label="بعثت مردم — صفحه اصلی">
              <Logo width={100} />
            </Link>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-ink-100"
              aria-label="بستن"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav
            className="flex flex-1 flex-col gap-1 overflow-y-auto overscroll-contain p-4"
            aria-label="ناوبری موبایل"
          >
            {NAV.map((item) => (
              <a
                key={item.href + item.label}
                href={item.href}
                onClick={(e) => {
                  onNavClick(e, item.href);
                  setOpen(false);
                }}
                className="rounded-xl px-4 py-3 font-medium text-ink-800 transition-colors hover:bg-brand-50 hover:text-brand-700"
              >
                {item.label}
              </a>
            ))}
          </nav>
          {/* ناحیه‌ی حساب در پایین شیت موبایل — پیل تمام‌عرض برای مهمان
              و چیپ کاربر (با منوی خروج) پس از ورود. */}
          <div className="border-t border-ink-100 p-4">
            <AuthControls variant="block" onOpen={openAuth} />
          </div>
        </aside>
      </div>

      {/* مودال ورود / ثبت‌نام — یک نمونه‌ی سراسری برای هر دو تریگر */}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
