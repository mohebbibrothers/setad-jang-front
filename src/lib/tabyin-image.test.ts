import { describe, expect, it } from 'vitest';
import { isDirectTabyinImage, tabyinImageThumbnailUrl } from './tabyin-image';

describe('Tabyin public image transport', () => {
  it('requests the Mohtavanegar media host directly, without the remote optimizer', () => {
    expect(isDirectTabyinImage('https://app-media.armansky.ir/org/uploads/image.png')).toBe(true);
    expect(isDirectTabyinImage('https://APP-MEDIA.ARMANSKY.IR/org/uploads/image.png')).toBe(true);
  });

  it.each([
    'https://app-media.armansky.ir.evil.test/image.png',
    'http://app-media.armansky.ir/org/uploads/image.png',
    'https://besat.me/media/image.png',
    '/media/public/image.png',
    'not a url',
    '',
    null,
    undefined,
  ])('keeps normal image handling for %s', (src) => {
    expect(isDirectTabyinImage(src)).toBe(false);
  });
});

describe('source image thumbnails', () => {
  it('maps only known public image paths and retains the query string', () => {
    expect(tabyinImageThumbnailUrl('https://app-media.armansky.ir/org/uploads/a.jpg?v=2')).toBe(
      'https://app-media.armansky.ir/thumbnail/uploads/a.jpg?v=2',
    );
  });
  it.each([
    'https://evil.test/org/uploads/a.png',
    'https://app-media.armansky.ir/private/a.jpg',
    'https://app-media.armansky.ir/org/uploads/a.mp4',
    '/media/a.png',
  ])('does not construct a thumbnail for %s', (src) => {
    expect(tabyinImageThumbnailUrl(src)).toBeUndefined();
  });
});
