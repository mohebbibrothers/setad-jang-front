import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { AVAILABLE_PSEUDONYM_AVATARS, PseudonymAvatar } from './PseudonymAvatar';

afterEach(cleanup);

describe('uniform pseudonym avatar preview', () => {
  it.each([...AVAILABLE_PSEUDONYM_AVATARS])(
    '%s uses the same circular frame and local optimized image',
    (avatarId) => {
      const { container } = render(<PseudonymAvatar avatarId={avatarId} />);
      const frame = container.querySelector('[data-avatar-frame="uniform-v1"]');
      const img = container.querySelector('img');
      expect(frame?.className).toContain('rounded-full');
      expect(frame?.className).toContain('overflow-hidden');
      expect(img?.getAttribute('src')).toBe(`/tabyin-avatars/${avatarId}.webp`);
      expect(img?.getAttribute('width')).toBe('40');
      expect(img?.getAttribute('height')).toBe('40');
    },
  );
  it('never interpolates arbitrary source URLs', () => {
    const { container } = render(<PseudonymAvatar avatarId="../../evil" />);
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('ر')).toBeTruthy();
  });
  it('falls back to the same frame on a missing image', () => {
    const { container } = render(<PseudonymAvatar avatarId="f-001" />);
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    fireEvent.error(img!);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('[data-avatar-frame="uniform-v1"]')).not.toBeNull();
    expect(screen.getByText('ر')).toBeTruthy();
  });
});
