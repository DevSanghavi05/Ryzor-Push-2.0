
'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Header } from '@/components/layout/header';
import { ChatInterface } from '@/components/chat/chat-interface';
import { Features } from '@/components/landing/features';

export default function Home() {
  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ['start start', 'end start'],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroTranslateY = useTransform(scrollYProgress, [0, 0.5], [0, -20]);
  const featuresOpacity = useTransform(scrollYProgress, [0.5, 0.9], [0, 1]);
  const featuresTranslateY = useTransform(scrollYProgress, [0.5, 0.9], [20, 0]);

  return (
    <div className="flex flex-col min-h-[200dvh] bg-background">
      <Header />
      <main ref={targetRef} className="flex-1 flex flex-col pt-16">
        <div className="sticky top-16 h-dvh-minus-header">
          <motion.div
            className="flex flex-col items-center justify-center h-full p-4"
            style={{ opacity: heroOpacity, y: heroTranslateY }}
          >
            <ChatInterface />
          </motion.div>
          <motion.div
            className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center"
            style={{ opacity: featuresOpacity, y: featuresTranslateY, pointerEvents: featuresOpacity.get() > 0 ? 'auto' : 'none' }}
          >
            <Features />
          </motion.div>
        </div>
      </main>
    </div>
  );
}

declare module "react" {
  interface CSSProperties {
    "height-dvh-minus-header"?: string;
  }
}
