'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/use-auth';

const TABS = [
  { href: '/me/participations', label: 'مشارکت‌ها',  glyph: 'wallet' },
  { href: '/me/receipts',       label: 'رسیدها',     glyph: 'receipt' },
  { href: '/me/enrollments',    label: 'دوره‌های من', glyph: 'book' },
  { href: '/me/bounties',       label: 'جوایز',       glyph: 'trophy' },
  { href: '/me/reports',        label: 'گزارش‌ها',   glyph: 'doc' },
  { href: '/me/listings',       label: 'آگهی‌ها',    glyph: 'hand' },
  { href: '/me/profile',        label: 'پروفایل',    glyph: 'user' },
];

export default function MeLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname() ?? '/me';

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace(`/auth/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [loading, isAuthenticated, router, pathname]);

  if (loading || !isAuthenticated) {
    return (
      <div className="container-edge py-16 text-center">
        <div className="inline-flex items-center gap-2 text-ink-500 text-[13px] font-bold">
          <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3"/><path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
          در حال بررسی حساب کاربری…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] bg-ink-50">
      <div className="container-edge py-6 md:py-10 grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-6">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="bg-white rounded-2xl ring-1 ring-ink-100 p-3 shadow-[0_10px_28px_-16px_rgba(11,53,48,.20)]">
            <div className="flex items-center gap-3 p-3 mb-2 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white">
              <span className="w-11 h-11 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-[16px] font-extrabold">
                {(user?.full_name || user?.first_name || user?.primary_identifier || 'ک')[0]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-extrabold truncate">
                  {user?.full_name || [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'کاربر عزیز'}
                </p>
                <p className="text-[11px] text-white/75 truncate">{user?.primary_identifier || user?.email || user?.phone_number}</p>
              </div>
            </div>

            <nav className="space-y-0.5">
              {TABS.map((t) => {
                const active = pathname === t.href || pathname.startsWith(`${t.href}/`);
                return (
                  <Link
                    key={t.href}
                    href={t.href}
                    className={`flex items-center gap-2 px-3 h-11 rounded-xl text-[13px] font-extrabold transition-colors ${
                      active ? 'bg-brand-500 text-white shadow-[0_6px_14px_-6px_rgba(13,128,116,.55)]' : 'text-ink-700 hover:bg-ink-50'
                    }`}
                  >
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${active ? 'bg-white/20' : 'bg-ink-50'}`}>
                      <TabGlyph name={t.glyph} />
                    </span>
                    <span>{t.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}

function TabGlyph({ name }: { name: string }) {
  const p = { width: 13, height: 13, viewBox: '0 0 24 24', fill: 'none' as const, stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
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
