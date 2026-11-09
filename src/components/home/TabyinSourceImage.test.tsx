import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { TabyinSourceImage } from './TabyinSourceImage';

const original = 'https://app-media.armansky.ir/org/uploads/a.png';
const thumbnail = 'https://app-media.armansky.ir/thumbnail/uploads/a.png';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('TabyinSourceImage', () => {
  it('requests the small thumbnail first and only then loads the original', () => {
    const { container } = render(<TabyinSourceImage src={original} alt="تصویر" />);
    const preview = container.querySelector(`img[src="${thumbnail}"]`);
    expect(preview).not.toBeNull();
    expect(container.querySelector(`img[src="${original}"]`)).toBeNull();
    fireEvent.load(preview!);
    const full = container.querySelector(`img[src="${original}"]`);
    expect(full).not.toBeNull();
    fireEvent.load(full!);
    expect(container.querySelector(`img[src="${thumbnail}"]`)).toBeNull();
    expect(full?.className).toContain('opacity-100');
  });

  it('handles a thumbnail already loaded before hydration', () => {
    vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true);
    vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(320);
    const { container } = render(<TabyinSourceImage src={original} alt="تصویر" />);
    expect(container.querySelector(`img[src="${original}"]`)).not.toBeNull();
  });

  it('falls back to the original if a thumbnail is missing', () => {
    const { container } = render(<TabyinSourceImage src={original} alt="تصویر" />);
    fireEvent.error(container.querySelector(`img[src="${thumbnail}"]`)!);
    expect(container.querySelector(`img[src="${original}"]`)).not.toBeNull();
  });

  it('keeps the thumbnail visible if the original fails', () => {
    const { container } = render(<TabyinSourceImage src={original} alt="تصویر" />);
    const preview = container.querySelector(`img[src="${thumbnail}"]`)!;
    fireEvent.load(preview);
    fireEvent.error(container.querySelector(`img[src="${original}"]`)!);
    expect(container.querySelector(`img[src="${thumbnail}"]`)?.className).toContain('blur-0');
  });
});
