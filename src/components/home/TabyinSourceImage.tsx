'use client';

import { useEffect, useRef, useState } from 'react';
import { SmartImagePlaceholder } from '@/components/ui/SmartImage';
import { tabyinImageThumbnailUrl } from '@/lib/tabyin-image';

type Props = { src: string; alt: string };

/**
 * A real thumbnail from the source is loaded first. Once it has settled, the
 * original is requested lazily and cross-faded in. If either resource fails,
 * the other remains usable; the source host is never fetched server-side.
 * Mount with a source-specific key so pending load events cannot cross images.
 */
export function TabyinSourceImage({ src, alt }: Props) {
  const thumbnail = tabyinImageThumbnailUrl(src);
  const [thumbSettled, setThumbSettled] = useState(!thumbnail);
  const [thumbLoaded, setThumbLoaded] = useState(false);
  const [fullLoaded, setFullLoaded] = useState(false);
  const [fullFailed, setFullFailed] = useState(false);
  const thumbnailRef = useRef<HTMLImageElement>(null);

  // The browser may finish loading the server-rendered thumbnail before React
  // hydrates its onLoad listener. Check the cached image after mount as well.
  useEffect(() => {
    const image = thumbnailRef.current;
    if (image?.complete) {
      setThumbLoaded(image.naturalWidth > 0);
      setThumbSettled(true);
    }
  }, [thumbnail]);

  return (
    <span className="absolute inset-0 overflow-hidden" role="img" aria-label={alt}>
      {!thumbLoaded && !fullLoaded && (
        <SmartImagePlaceholder variant="tabyin" ariaLabel={alt} className="absolute inset-0" />
      )}
      {thumbnail && !fullLoaded && (
        // eslint-disable-next-line @next/next/no-img-element -- same public source as the feed
        <img
          ref={thumbnailRef}
          src={thumbnail}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          onLoad={() => {
            setThumbLoaded(true);
            setThumbSettled(true);
          }}
          onError={() => setThumbSettled(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-[filter,opacity] duration-500 motion-reduce:transition-none ${thumbLoaded ? 'opacity-100' : 'opacity-0'} ${fullFailed ? 'blur-0' : 'scale-105 blur-sm'}`}
        />
      )}
      {thumbSettled && !fullFailed && (
        // eslint-disable-next-line @next/next/no-img-element -- optimizer cannot reach this source
        <img
          src={src}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          onLoad={() => setFullLoaded(true)}
          onError={() => setFullFailed(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 motion-reduce:transition-none ${fullLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </span>
  );
}
