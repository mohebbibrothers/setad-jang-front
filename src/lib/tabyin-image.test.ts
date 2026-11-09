import { describe, expect, it } from 'vitest';
import { isDirectTabyinImage } from './tabyin-image';

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
