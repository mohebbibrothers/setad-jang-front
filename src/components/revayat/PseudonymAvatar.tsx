'use client';

import { useState } from 'react';

/**
 * Private-author avatar preview. The entire badge uses one identical frame;
 * individual illustrations never decide their own circle or border.
 * IDs are allowlisted, not interpolated as arbitrary user-controlled URLs.
 * The curated bank is incomplete and this component is not wired to production.
 */
export const AVAILABLE_PSEUDONYM_AVATARS = new Set([
  'm-001',
  'm-002',
  'm-003',
  'm-004',
  'm-005',
  'm-006',
  'm-007',
  'm-008',
  'm-009',
  'm-010',
  'm-011',
  'm-012',
  'm-013',
  'm-014',
  'm-015',
  'm-016',
  'm-017',
  'm-018',
  'f-001',
  'f-002',
  'f-003',
  'f-004',
  'f-005',
  'f-006',
  'f-007',
  'f-008',
  'f-009',
  'f-010',
  'f-011',
  'f-012',
  'f-013',
  'f-014',
  'f-015',
  'f-016',
  'f-017',
  'f-018',
  'f-019',
  'f-020',
  'f-021',
  'f-022',
]);

export function PseudonymAvatar({
  avatarId,
  size = 'feed',
}: {
  avatarId?: string | null;
  size?: 'feed' | 'detail';
}) {
  const [brokenId, setBrokenId] = useState<string | null>(null);
  const allowed = typeof avatarId === 'string' && AVAILABLE_PSEUDONYM_AVATARS.has(avatarId);
  const showImage = allowed && brokenId !== avatarId;
  return (
    <span
      aria-hidden="true"
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-50 shadow-[0_6px_16px_-6px_rgba(13,128,116,.35)] ring-2 ring-brand-600/30 ${size === 'detail' ? 'h-7 w-7' : 'h-10 w-10'}`}
      data-avatar-frame="uniform-v1"
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- local fixed-size, already optimized artwork
        <img
          src={`/tabyin-avatars/${avatarId}.webp`}
          alt=""
          width={40}
          height={40}
          loading="lazy"
          decoding="async"
          onError={() => setBrokenId(avatarId)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="text-base font-black text-brand-700">ر</span>
      )}
    </span>
  );
}
