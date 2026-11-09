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
