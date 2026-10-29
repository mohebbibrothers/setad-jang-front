'use client';

import { useCallback, useEffect, useState } from 'react';
import { CampaignAlbum, type AlbumImage } from './CampaignAlbum';
import { KindnessContactSheet } from './KindnessContactSheet';
import { apiFetch } from '@/lib/api';
import { absoluteMediaUrl, formatPersianNumber as fa } from '@/lib/utils';
import type { KindListing, KindListingDetail } from './KindnessSection';

/**
 * ───────────────────────────────────────────────────────────────────────────
 * useKindnessOverlays — هوک مشترکِ «رویه‌های شناور» دیوار مهربانی
 *
 * هم سکشنِ صفحهٔ اصلی (KindnessSection) و هم هابِ /kindness-wall
 * (KindnessBoard) دو کارِ یکسان می‌خواهند:
 *
 *   ۱) شیتِ «راه‌های ارتباط» — lazy fetch از DETAIL (تنها جایی که
 *      کانال‌های تماس را می‌دهد؛ سیاست ضد اسکرپینگِ بک‌اند) + کش per-slug
 *      + retry پس از خطا (کلیدِ خطا پاک می‌شود و افکت دوباره fetch می‌کند).
 *   ۲) آلبومِ تصاویر (CampaignAlbum) — کاورِ لیست اول می‌آید، تصاویرِ
 *      جزئیات به‌محض رسیدن «زنده» جایگزین می‌شوند اگر آلبوم باز باشد.
 *
 * این منطق پیش‌تر داخلِ KindnessSection زندگی می‌کرد و برای هاب کپی می‌شد؛
 * حالا منبعِ یکتاست — هر دو سطح دقیقاً همان رفتارِ تست‌شده را دارند.
 *
 * ورودی: listingsِ قابل‌نمایش (برای پیدا کردن آیتمِ باز هنگام تازه‌سازی آلبوم).
 * خروجی: openContact/openAlbum + overlays (JSXِ آمادهٔ رندر — هردو portal‌اند).
 * ───────────────────────────────────────────────────────────────────────────
 */

export function useKindnessOverlays(listings: KindListing[]) {
  /* ── شیت راه‌های ارتباط + کش جزئیات (یک fetch برای شیت و آلبوم) ─────── */
  const [sheet, setSheet] = useState<{ open: boolean; listing: KindListing | null }>({
    open: false,
    listing: null,
  });
  const [details, setDetails] = useState<Record<string, KindListingDetail | null>>({});

  const ensureDetail = useCallback(
    (l: KindListing) => {
      if (details[l.slug] !== undefined) return;
      apiFetch<KindListingDetail>(`/kindness-wall/listings/${encodeURIComponent(l.slug)}/`, {
        revalidate: 600,
        tags: [`kindness:${l.slug}`, 'kindness'],
        skipAuth: true,
      })
        .then((d) => setDetails((prev) => ({ ...prev, [l.slug]: d })))
        .catch(() => setDetails((prev) => ({ ...prev, [l.slug]: null })));
    },
    [details],
  );

  const retryDetail = useCallback((l: KindListing) => {
    setDetails((prev) => {
      const next = { ...prev };
      delete next[l.slug];
      return next;
    });
  }, []);

  useEffect(() => {
    /* بعد از پاک‌کردن کشِ خطا، دوباره بگیر */
    if (sheet.open && sheet.listing && details[sheet.listing.slug] === undefined) {
      ensureDetail(sheet.listing);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [details]);

  const openContact = useCallback(
    (l: KindListing) => {
      setSheet({ open: true, listing: l });
      ensureDetail(l);
    },
    [ensureDetail],
  );
  const closeSheet = useCallback(() => setSheet((s) => ({ ...s, open: false })), []);

  /* ── آلبوم تصاویر ───────────────────────────────────────────────────── */
  const [album, setAlbum] = useState<{
    open: boolean;
    title: string;
    subtitle?: { label: string; value: string };
    images: AlbumImage[];
    loading: boolean;
  }>({ open: false, title: '', images: [], loading: false });
  const [albumSlug, setAlbumSlug] = useState<string | null>(null);
  const closeAlbum = useCallback(() => setAlbum((a) => ({ ...a, open: false })), []);

  const buildAlbumImages = useCallback(
    (l: KindListing, detail: KindListingDetail | null | undefined): AlbumImage[] => {
      const out: AlbumImage[] = [];
      if (l.coverImage) out.push({ url: l.coverImage, alt: l.title });
      for (const im of detail?.images?.slice().sort((a, b) => {
        if (Boolean(b.is_cover) !== Boolean(a.is_cover)) return b.is_cover ? 1 : -1;
        return (a.order ?? 0) - (b.order ?? 0);
      }) ?? []) {
        const url = absoluteMediaUrl(im.image) ?? im.image;
        if (url && !out.some((o) => o.url === url)) out.push({ url, alt: im.alt_text || l.title });
      }
      return out;
    },
    [],
  );

  const openAlbum = useCallback(
    (l: KindListing) => {
      setAlbumSlug(l.slug);
      const cached = details[l.slug];
      setAlbum({
        open: true,
        title: l.title,
        subtitle: {
          label: 'دسته',
          value: l.categoryTitle ? `${l.categoryTitle} · ${fa(l.quantity)} ${l.unit}` : l.title,
        },
        images: buildAlbumImages(l, cached === null ? undefined : cached),
        loading: cached === undefined,
      });
      if (cached === undefined) ensureDetail(l);
    },
    [details, buildAlbumImages, ensureDetail],
  );

  /* وقتی جزئیات تازه رسید و آلبوم باز است، تصاویر را زنده به‌روز کن */
  useEffect(() => {
    if (!album.open || !albumSlug) return;
    const listing = listings.find((l) => l.slug === albumSlug);
    const detail = details[albumSlug];
    if (!listing || detail === undefined) return;
    setAlbum((a) =>
      a.open
        ? {
            ...a,
            images: buildAlbumImages(listing, detail === null ? undefined : detail),
            loading: false,
          }
        : a,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [details, album.open, albumSlug, listings]);

  /* ── خروجی ────────────────────────────────────────────────────────── */
  const sheetListing = sheet.listing;
  const sheetDetail = sheetListing ? details[sheetListing.slug] : undefined;

  const overlays = (
    <>
      {/* شیت راه‌های ارتباط (portal به body) */}
      {sheetListing && (
        <KindnessContactSheet
          open={sheet.open}
          title={sheetListing.title}
          subtitle={
            sheetDetail?.beneficiary_name ? `به‌نیاب: ${sheetDetail.beneficiary_name}` : undefined
          }
          contactNote={sheetDetail?.contact_note || undefined}
          channels={sheetDetail?.contact_channels ?? []}
          loading={sheetDetail === undefined}
          error={sheetDetail === null}
          onRetry={() => retryDetail(sheetListing)}
          onClose={closeSheet}
        />
      )}

      {/* آلبوم تصاویر (portal به body — الگوی موجود) */}
      <CampaignAlbum
        open={album.open}
        onClose={closeAlbum}
        title={album.title}
        subtitle={album.subtitle}
        images={album.images}
        loading={album.loading}
      />
    </>
  );

  return { openContact, openAlbum, overlays };
}
