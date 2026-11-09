/**
 * Public Mohtavanegar media may be reachable in the user's browser while the
 * geographically remote Next image optimizer cannot fetch it. In that case
 * use the source directly, as the Tabyin feed already does.
 * Other hosts keep the normal optimizer and its existing allowlist.
 */
export function isDirectTabyinImage(src: string | null | undefined): boolean {
  if (!src) return false;
  try {
    return new URL(src).origin === 'https://app-media.armansky.ir';
  } catch {
    return false;
  }
}

/** Build the image thumbnail URL only for the verified public media path. */
export function tabyinImageThumbnailUrl(src: string | null | undefined): string | undefined {
  if (!src || !isDirectTabyinImage(src)) return undefined;
  try {
    const url = new URL(src);
    if (!url.pathname.startsWith('/org/uploads/')) return undefined;
    if (!/\.(png|jpe?g|webp|gif)$/i.test(url.pathname)) return undefined;
    url.pathname = url.pathname.replace(/^\/org\/uploads\//, '/thumbnail/uploads/');
    return url.toString();
  } catch {
    return undefined;
  }
}
