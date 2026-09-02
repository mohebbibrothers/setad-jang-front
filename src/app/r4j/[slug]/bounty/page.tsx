import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { criminalFullName, fetchCriminalDetail } from '@/lib/r4j';
import { CaseShell } from '../CaseShell';
import { BountyPanel } from './BountyPanel';

/**
 * r4j/[slug]/bounty — مسیرِ «افزایش جایزه»
 * پوسته‌ی SSR (هویتِ پرونده + آمارِ جایزه) + جزیره‌ی کلاینتِ فرم.
 * قرارداد: POST /r4j/criminals/<id>/bounty/ — IsFullyVerifiedUser،
 * حداقل ۵۰٬۰۰۰ تومان، set_or_update روی همان رکورد.
 */

export const revalidate = 180;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const d = await fetchCriminalDetail(slug);
  if (!d) return { title: 'پرونده یافت نشد' };
  return {
    title: `افزایش جایزه — ${criminalFullName(d) || d.slug}`,
    description: 'ثبت یا ویرایش تعهدِ جایزه برای اجرای عدالت روی این پرونده.',
    robots: { index: false }, // صفحه‌ی اقدام — ارزشِ ایندکس ندارد
  };
}

export default async function BountyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const d = await fetchCriminalDetail(slug);
  if (!d) notFound();

  const name = criminalFullName(d) || d.slug;
  return (
    <CaseShell
      d={d}
      activeTab="bounty"
      eyebrow="صندوقِ عدالتِ مردمی"
      title="ثبت یا افزایش جایزه"
      lead={`با ثبت یک تعهدِ اعلامی، جایزه‌ی اجرای عدالت برای پرونده‌ی «${name}» را افزایش می‌دهید. این تعهد هر زمان قابل ویرایش است و لغوِ آن پس از درخواست شما و تأیید مدیریت انجام می‌شود.`}
    >
      <BountyPanel
        criminalId={d.id}
        slug={d.slug}
        name={name}
        initialTotal={d.total_bounty_toman}
        initialCount={d.bounties_count}
      />
    </CaseShell>
  );
}
