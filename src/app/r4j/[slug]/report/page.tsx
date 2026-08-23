import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { safeApiFetch } from "@/lib/api";
import { R4JReportForm } from "./R4JReportForm";

export const metadata: Metadata = {
  title: "ارسال اطلاعات تکمیلی",
  robots: { index: false, follow: false },
};

export default async function R4JReportPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const criminal = await safeApiFetch<{
    id: number;
    first_name: string;
    last_name: string;
    slug: string;
  }>(`/r4j/criminals/${encodeURIComponent(slug)}/`, { revalidate: 300 });
  if (!criminal) notFound();
  return <R4JReportForm criminal={criminal} />;
}
