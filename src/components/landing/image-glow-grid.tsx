
'use client';

import { motion, useMotionValue, useTransform } from 'framer-motion';
import { placeholderImages } from '@/lib/placeholder-images';
import Image from 'next/image';

export function ImageGlowGrid() {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
  
    function handleMouseMove({
      currentTarget,
      clientX,
      clientY,
    }: React.MouseEvent<HTMLDivElement>) {
      if (!currentTarget) return;
      let { left, top } = currentTarget.getBoundingClientRect();
  
      mouseX.set(clientX - left);
      mouseY.set(clientY - top);
    }
  
    return (
      <div
        className="relative grid w-full grid-cols-2 md:grid-cols-3 gap-4"
        onMouseMove={handleMouseMove}
      >
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
          style={{
            background: useTransform(
              [mouseX, mouseY],
              ([x, y]) =>
                `radial-gradient(400px circle at ${x}px ${y}px, hsl(var(--primary)/0.2), transparent 80%)`
            ),
          }}
        />
        {placeholderImages.map((image) => (
          <div
            key={image.id}
            className="relative overflow-hidden rounded-xl border border-border/20 bg-card/50"
          >
            <Image
              src={image.imageUrl}
              alt={image.description}
              width={600}
              height={400}
              className="object-cover w-full h-full"
              data-ai-hint={image.imageHint}
            />
             <div className="pointer-events-none absolute -inset-px rounded-xl"
                style={{
                    background: useTransform(
                        [mouseX, mouseY],
                        ([x, y]) =>
                          `radial-gradient(500px circle at ${x}px ${y}px, hsl(var(--background)/0.1), transparent 80%)`
                      ),
                }}
             />
          </div>
        ))}
      </div>
    );
  }
  