import { Instagram, Twitter, Linkedin } from 'lucide-react';
import Link from 'next/link';

/**
 * ─────────────────────────────────────────────────────────────────
 *  TopBar — thin brand-teal utility bar above the primary header.
 *
 *  Right side (RTL start): partner-organisation links. These are
 *  the officially-endorsed external destinations agreed with the
 *  content team, so they open in a new tab with the standard
 *  security-hardening rel attributes.
 *
 *  Left side (RTL end): social presences (currently placeholders
 *  until the client publishes the final handles — the anchors are
 *  scoped to `#` so they don't ship as accidental redirects).
 * ─────────────────────────────────────────────────────────────────
 */

type Partner = { label: string; href: string };

const PARTNERS: Partner[] = [
  { label: 'رسانه‌ی رهبر انقلاب', href: 'https://rahbar.ir/' },
  { label: 'رسانه‌ی رهبر شهید', href: 'https://khamenei.ir/' },
  { label: 'جانفدا', href: 'https://janfadaa.ir/' },
];

export function TopBar() {
  return (
    <div className="hidden bg-brand-600 text-[12.5px] text-white md:block">
      <div className="container-edge flex h-9 items-center gap-4">
        {/* Partner links — visually RIGHT in RTL, open in a new tab. */}
        <nav aria-label="پیوندهای شریکان" className="flex items-center gap-8">
          {PARTNERS.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-90 transition-opacity hover:opacity-100"
            >
              {p.label}
            </Link>
          ))}
        </nav>

        {/* Social icons — visually LEFT */}
        <div className="mr-auto flex items-center gap-3">
          <Link
            href="#"
            aria-label="اینستاگرام"
            className="opacity-90 transition-opacity hover:opacity-100"
          >
            <Instagram className="h-4 w-4" />
          </Link>
          <Link
            href="#"
            aria-label="توییتر"
            className="opacity-90 transition-opacity hover:opacity-100"
          >
            <Twitter className="h-4 w-4" />
          </Link>
          <Link
            href="#"
            aria-label="لینکدین"
            className="opacity-90 transition-opacity hover:opacity-100"
          >
            <Linkedin className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
