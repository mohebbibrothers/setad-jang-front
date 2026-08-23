import type { MetadataRoute } from "next";
import { safeApiFetch, type Paginated } from "@/lib/api";
import { siteConfig } from "@/lib/site";

type SlugRow = {
  slug: string;
  published_at?: string | null;
  updated_at?: string | null;
};
type TabyinRow = {
  external_id: string;
  source_updated_at?: string | null;
  source_created_at?: string | null;
};

function rows<T>(value: Paginated<T> | T[] | null): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : value.results || [];
}

function asDate(value: string | null | undefined, fallback: Date): Date {
  return value ? new Date(value) : fallback;
}

/**
 * A bounded dynamic sitemap for every public route currently implemented.
 * The first 100 newest resources per domain cover all live R4J records and the
 * active homepage corpus without bringing the former full-Tabyin fan-out into
 * crawler traffic. Once the backend exposes sitemap cursors, this can become a
 * proper sitemap index without changing page URLs.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url.replace(/\/+$/, "");
  const now = new Date();
  const [r4j, campaigns, courses, kindness, tabyin] = await Promise.all([
    safeApiFetch<Paginated<SlugRow>>("/r4j/criminals/?page_size=100", {
      revalidate: 3600,
      tags: ["sitemap", "r4j"],
    }),
    safeApiFetch<Paginated<SlugRow>>("/madadkar/campaigns/?page_size=100", {
      revalidate: 3600,
      tags: ["sitemap", "madadkar"],
    }),
    safeApiFetch<Paginated<SlugRow>>("/lms/courses/?page_size=100", {
      revalidate: 3600,
      tags: ["sitemap", "lms"],
    }),
    safeApiFetch<Paginated<SlugRow>>("/kindness-wall/listings/?page_size=100", {
      revalidate: 3600,
      tags: ["sitemap", "kindness"],
    }),
    safeApiFetch<Paginated<TabyinRow>>(
      "/tabyin/contents/?page_size=100&ordering=-source_created_at",
      { revalidate: 1800, tags: ["sitemap", "tabyin"] },
    ),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${base}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${base}/about-besat`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${base}/tabyin`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    },
  ];

  const resourceRoutes: MetadataRoute.Sitemap = [
    ...rows(r4j).map((item) => ({
      url: `${base}/r4j/${encodeURIComponent(item.slug)}`,
      lastModified: item.updated_at ? new Date(item.updated_at) : now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...rows(campaigns).map((item) => ({
      url: `${base}/madadkar/${encodeURIComponent(item.slug)}`,
      lastModified: item.updated_at ? new Date(item.updated_at) : now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...rows(courses).map((item) => ({
      url: `${base}/lms/courses/${encodeURIComponent(item.slug)}`,
      lastModified: item.updated_at ? new Date(item.updated_at) : now,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    })),
    ...rows(kindness).map((item) => ({
      url: `${base}/kindness-wall/${encodeURIComponent(item.slug)}`,
      lastModified: item.updated_at ? new Date(item.updated_at) : now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...rows(tabyin).map((item) => ({
      url: `${base}/tabyin/${encodeURIComponent(item.external_id)}`,
      lastModified: asDate(
        item.source_updated_at || item.source_created_at,
        now,
      ),
      changeFrequency: "monthly" as const,
      priority: 0.65,
    })),
  ];

  return [...staticRoutes, ...resourceRoutes];
}
