import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { safeApiFetch } from "@/lib/api";
import { R4JBountyForm } from "./R4JBountyForm";

export const metadata: Metadata = {
  title: "ثبت تعهد جایزه",
  robots: { index: false, follow: false },
};

export default async function R4JBountyPage({
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
  return <R4JBountyForm criminal={criminal} />;
}
