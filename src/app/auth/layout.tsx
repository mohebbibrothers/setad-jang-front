import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';

/**
 * Focused auth layout — full-bleed brand-tinted background with a
 * card-centered slot. No header/footer distractions so the user's
 * eyes stay on the form.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-[100vh] relative bg-gradient-to-br from-brand-700 via-brand-800 to-ink-900 text-white flex flex-col">
      {/* Dotted texture — barely visible, brand-tinted */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />
      {/* Aurora glow */}
      <div
        aria-hidden="true"
        className="absolute -top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full pointer-events-none opacity-30 blur-3xl"
        style={{ background: 'radial-gradient(circle, #25C5BA 0%, transparent 60%)' }}
      />

      <header className="relative z-10">
        <div className="container-edge h-16 flex items-center justify-between">
          <Link href="/" aria-label="بعثت مردم — صفحه اصلی" className="inline-flex">
            <Logo width={110} className="brightness-0 invert" />
          </Link>
          <Link href="/" className="text-[12.5px] text-white/75 hover:text-white font-bold transition-colors">
            بازگشت به سایت
          </Link>
        </div>
      </header>

      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[440px]">
          {children}
        </div>
      </div>
    </main>
  );
}
