import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { criminalFullName, fetchCriminalDetail } from '@/lib/r4j';
import { CaseShell } from '../CaseShell';
import { ReportPanel } from './ReportPanel';

/**
 * r4j/[slug]/report — مسیرِ «گزارش اطلاعات»
 * قرارداد: POST /r4j/criminals/<id>/reports/ — IsAuthenticated؛
 * حداقل یکی از: یادداشت / اصلاح فیلد / نام مستعار / شماره / شبکه؛
 * ضمیمه تا ۵ فایل (کلید multipart: attachments).
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
    title: `گزارش اطلاعات — ${criminalFullName(d) || d.slug}`,
    description: 'ارسال سرنخ و گزارش تکمیلی برای این پرونده؛ هر گزارش پیش از انتشار بررسی می‌شود.',
    robots: { index: false },
  };
}

export default async function ReportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const d = await fetchCriminalDetail(slug);
  if (!d) notFound();

  const name = criminalFullName(d) || d.slug;
  return (
    <CaseShell
      d={d}
      eyebrow="مشارکتِ مردمی در پرونده"
      title="گزارش اطلاعات و سرنخ"
      lead={`اگر درباره‌ی «${name}» اطلاعات موثقی دارید — نام مستعار، شماره تماس، حساب اجتماعی، اصلاحِ مشخصات یا سند — همین‌جا ارسال کنید. گزارشِ شما محرمانه می‌ماند و تنها پس از بررسی، روی پرونده اعمال می‌شود.`}
    >
      <ReportPanel criminalId={d.id} slug={d.slug} name={name} />
    </CaseShell>
  );
}
