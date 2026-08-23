'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { cn } from '@/lib/utils';

type Props = {
  title: string;
  description?: string;
  className?: string;
};

/**
 * Reusable section title block:
 * brand-coloured title centered with a small "+" sparkle pattern next to it,
 * followed by a max-w-prose description.
 * Matches the recurring section header style in the designer's mockup.
 */
export function SectionTitle({ title, description, className }: Props) {
  return (
    <div className={cn('mx-auto mb-8 max-w-3xl text-center md:mb-10', className)}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.45 }}
        className="inline-flex flex-row-reverse items-center justify-center gap-4"
      >
        <h2 className="text-xl font-extrabold text-brand-600 md:text-[26px]">{title}</h2>
        <Image
          src="/brand/pattern-plus.png"
          alt=""
          width={79}
          height={80}
          aria-hidden="true"
          className="h-11 w-11 object-contain opacity-85 md:h-14 md:w-14"
        />
      </motion.div>
      {description && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="mx-auto mt-4 max-w-2xl text-[14.5px] leading-8 text-ink-600 md:mt-5 md:text-[15px]"
        >
          {description}
        </motion.p>
      )}
    </div>
  );
}
