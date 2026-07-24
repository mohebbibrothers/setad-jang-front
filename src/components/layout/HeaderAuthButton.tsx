'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, User, LogOut, ChevronDown } from 'lucide-react';

import { useAuth } from '@/lib/use-auth';

/**
 * Header slot: shows either a "sign in" pill (anon) or a compact
 * avatar dropdown (logged in) with quick links to the user dashboard.
 */
export function HeaderAuthButton() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const pathname = usePathname() ?? '/';

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  if (loading && !user) {
    // subtle skeleton while we resolve the session
    return (
      <span aria-hidden className="hidden sm:inline-block w-[136px] h-10 lg:h-11 rounded-full bg-ink-100 animate-pulse" />
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <Link
        href={`/auth/login?next=${encodeURIComponent(pathname)}`}
        className="hidden sm:inline-flex items-center gap-2 h-10 lg:h-11 px-5 lg:px-6 rounded-full bg-mint-500 hover:bg-mint-600 text-white font-semibold shadow-soft transition-all"
      >
        <LogIn className="w-4 h-4" />
        ورود / ثبت‌نام
      </Link>
    );
  }

  const displayName =
    user.full_name?.trim() ||
    [user.first_name, user.last_name].filter(Boolean).join(' ').trim() ||
    user.primary_identifier ||
    user.email ||
    user.phone_number ||
    'کاربر';
  const initial = displayName.trim()[0] || 'ک';

  async function doLogout() {
    setOpen(false);
    await logout();
    router.replace('/');
    router.refresh();
  }

  return (
    <div ref={wrapRef} className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-2 h-10 lg:h-11 pr-1 pl-3 rounded-full ring-1 ring-ink-100 hover:ring-brand-200 hover:bg-brand-50/60 transition-colors"
      >
        <span className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white text-[13px] font-extrabold flex items-center justify-center shrink-0">
          {initial}
        </span>
        <span className="text-[12.5px] font-extrabold text-ink-800 truncate max-w-[120px]">{displayName}</span>
        <ChevronDown className={`w-4 h-4 text-ink-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 mt-2 min-w-[220px] rounded-2xl bg-white ring-1 ring-ink-100 shadow-[0_24px_60px_-12px_rgba(11,53,48,.28)] overflow-hidden p-1 z-40"
          >
            <MenuItem href="/me/participations" label="مشارکت‌های من" glyph="wallet" onNav={() => setOpen(false)} />
            <MenuItem href="/me/receipts"       label="رسیدهای من"   glyph="receipt" onNav={() => setOpen(false)} />
            <MenuItem href="/me/enrollments"    label="دوره‌های من"    glyph="book" onNav={() => setOpen(false)} />
            <MenuItem href="/me/bounties"       label="جوایز من"      glyph="trophy" onNav={() => setOpen(false)} />
            <MenuItem href="/me/reports"        label="گزارش‌های من"   glyph="doc" onNav={() => setOpen(false)} />
            <MenuItem href="/me/listings"       label="آگهی‌های من"    glyph="hand" onNav={() => setOpen(false)} />
            <div className="mx-2 my-1 h-px bg-ink-100" />
            <MenuItem href="/me/profile"        label="پروفایل"       glyph="user" onNav={() => setOpen(false)} />
            <button
              type="button"
              onClick={doLogout}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-right hover:bg-rose-50 text-rose-600 text-[12.5px] font-extrabold transition-colors"
            >
              <LogOut className="w-4 h-4" />
              خروج از حساب
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuItem({ href, label, glyph, onNav }: { href: string; label: string; glyph: string; onNav?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onNav}
      className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-ink-50 text-ink-800 text-[12.5px] font-extrabold transition-colors"
    >
      <span className="w-8 h-8 rounded-lg bg-ink-50 text-brand-600 flex items-center justify-center">
        <Glyph name={glyph} />
      </span>
      <span className="flex-1 min-w-0 truncate">{label}</span>
    </Link>
  );
}

function Glyph({ name }: { name: string }) {
  const p = { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none' as const, stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
  switch (name) {
    case 'wallet':  return <svg {...p}><path d="M20 12v10H4V12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/></svg>;
    case 'receipt': return <svg {...p}><path d="M20 21V3H4v18l4-2 4 2 4-2 4 2z"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="14" y2="14"/></svg>;
    case 'book':    return <svg {...p}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
    case 'trophy':  return <svg {...p}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>;
    case 'doc':     return <svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
    case 'hand':    return <svg {...p}><path d="M18 11V6a2 2 0 0 0-4 0v5M14 10V4a2 2 0 0 0-4 0v6M10 10.5V6a2 2 0 0 0-4 0v8M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-5.7-2.5L1.5 14a2 2 0 0 1 3-2.6L7 13"/></svg>;
    case 'user':    return <svg {...p}><circle cx="12" cy="8" r="5"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>;
    default:        return null;
  }
}
