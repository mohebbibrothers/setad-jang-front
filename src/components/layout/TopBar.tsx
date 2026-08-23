import { Send } from 'lucide-react';
import Link from 'next/link';
import { siteConfig } from '@/lib/site';

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
        <nav aria-label="پیوندهای شریکان" className="flex items-center gap-8">
          {PARTNERS.map((partner) => (
            <Link key={partner.href} href={partner.href} target="_blank" rel="noopener noreferrer" className="opacity-90 transition-opacity hover:opacity-100">
              {partner.label}
            </Link>
          ))}
        </nav>
        {siteConfig.social.eitaa && (
          <div className="mr-auto flex items-center">
            <Link href={siteConfig.social.eitaa} target="_blank" rel="noopener noreferrer" aria-label="بعثت مردم در ایتا" className="opacity-90 transition-opacity hover:opacity-100">
              <Send className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
