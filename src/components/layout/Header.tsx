'use client';

import Link from 'next/link';
import { LogIn, Menu, UserRound, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Logo } from '@/components/brand/Logo';
import { useAuth } from '@/lib/use-auth';
import { cn } from '@/lib/utils';
import { TopBar } from './TopBar';

type NavItem = { label: string; href: string };

const NAV: NavItem[] = [
  { label: 'خانه', href: '/' },
  { label: 'پشتیبانی مالی جنگ', href: '/#warfund' },
  { label: 'جایزه‌ای برای عدالت', href: '/#justice' },
  { label: 'قرارگاه آموزشی', href: '/#education' },
  { label: 'دیوار مهربانی', href: '/#kindness' },
  { label: 'جهاد تبیین', href: '/#tabyin' },
  { label: 'گزارش‌های مردمی', href: '/#reports' },
];

function onNavClick(event: React.MouseEvent<HTMLAnchorElement>, href: string) {
  if (typeof window === 'undefined' || !href.startsWith('/#') || window.location.pathname !== '/') return;
  const element = document.getElementById(href.slice(2));
  if (!element) return;
  event.preventDefault();
  element.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    block: 'start',
  });
  window.history.replaceState(null, '', href);
}

export function Header() {
  const auth = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);

  const closeMenu = useCallback((restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) window.setTimeout(() => menuButtonRef.current?.focus(), 0);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const drawer = drawerRef.current;
    const focusable = () => Array.from(
      drawer?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])') || [],
    );
    window.setTimeout(() => focusable()[0]?.focus(), 0);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu(true);
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [closeMenu, open]);

  const accountLabel = auth.user?.first_name || auth.user?.full_name || 'حساب من';

  return (
    <>
      <div className={cn('sticky top-0 z-50', scrolled && 'shadow-sm')}>
        <TopBar />
        <header className={cn('border-b border-ink-100 bg-white transition-shadow', scrolled && 'shadow-soft')} role="banner">
          <div className="container-edge flex h-16 items-center gap-4 lg:h-20">
            <Link href="/" className="flex shrink-0 items-center" aria-label="بعثت مردم — صفحه اصلی">
              <Logo width={120} priority />
            </Link>

            <nav className="mx-auto hidden items-center gap-1 lg:flex" aria-label="ناوبری اصلی">
              {NAV.map((item) => (
                <a
                  key={item.href + item.label}
                  href={item.href}
                  onClick={(event) => onNavClick(event, item.href)}
                  className="whitespace-nowrap rounded-lg px-3.5 py-2 text-[14px] font-medium text-ink-700 transition-colors hover:bg-brand-50/60 hover:text-brand-600"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="mr-auto flex items-center gap-2">
              <div className="hidden lg:block">
                {auth.loading ? (
                  <span className="block h-10 w-28 animate-pulse rounded-full bg-ink-100" aria-label="در حال بررسی حساب" />
                ) : auth.isAuthenticated ? (
                  <Link href="/account" className="inline-flex h-10 max-w-40 items-center gap-2 rounded-full bg-brand-50 px-4 text-sm font-extrabold text-brand-700 hover:bg-brand-100">
                    <UserRound className="h-4 w-4 shrink-0" />
                    <span className="truncate">{accountLabel}</span>
                  </Link>
                ) : (
                  <Link href="/auth/login" className="inline-flex h-10 items-center gap-2 rounded-full bg-brand-600 px-5 text-sm font-extrabold text-white shadow-soft transition hover:bg-brand-700">
                    <LogIn className="h-4 w-4" /> ورود / ثبت‌نام
                  </Link>
                )}
              </div>
              <button
                ref={menuButtonRef}
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-ink-800 transition-colors hover:bg-ink-100 lg:hidden"
                aria-label={open ? 'بستن منو' : 'باز کردن منو'}
                aria-expanded={open}
                aria-controls="mobile-navigation"
                onClick={() => setOpen((current) => !current)}
              >
                {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </header>
      </div>

      <div
        className={cn(
          'fixed inset-0 z-[60] transition-opacity duration-300 lg:hidden',
          open ? 'visible opacity-100' : 'invisible opacity-0',
        )}
        aria-hidden={!open}
      >
        <button className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" onClick={() => closeMenu(true)} aria-label="بستن منو" tabIndex={open ? 0 : -1} />
        <aside
          ref={drawerRef}
          id="mobile-navigation"
          role="dialog"
          aria-modal="true"
          aria-label="منوی اصلی"
          className={cn(
            'absolute right-0 top-0 flex h-full w-[88%] max-w-sm flex-col bg-white shadow-float transition-transform duration-300 ease-out',
            open ? 'translate-x-0' : 'translate-x-full',
          )}
        >
          <div className="flex h-16 items-center justify-between border-b border-ink-100 px-4">
            <Link href="/" onClick={() => closeMenu()} aria-label="بعثت مردم — صفحه اصلی"><Logo width={100} /></Link>
            <button type="button" onClick={() => closeMenu(true)} className="inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-ink-100" aria-label="بستن">
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4" aria-label="ناوبری موبایل">
            {NAV.map((item) => (
              <a
                key={item.href + item.label}
                href={item.href}
                onClick={(event) => { onNavClick(event, item.href); closeMenu(); }}
                className="rounded-xl px-4 py-3 font-medium text-ink-800 transition-colors hover:bg-brand-50 hover:text-brand-700"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="border-t border-ink-100 p-4">
            {auth.isAuthenticated ? (
              <Link href="/account" onClick={() => closeMenu()} className="btn-primary btn-md w-full"><UserRound className="h-4 w-4" /> {accountLabel}</Link>
            ) : (
              <Link href="/auth/login" onClick={() => closeMenu()} className="btn-primary btn-md w-full"><LogIn className="h-4 w-4" /> ورود / ثبت‌نام</Link>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
