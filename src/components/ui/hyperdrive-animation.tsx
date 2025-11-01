
'use client';

import { Check, File, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

const Star = ({
  delay,
  isDarkMode,
}: {
  delay: number;
  isDarkMode: boolean;
}) => {
  const randomY = Math.random() * 100;
  const randomX = Math.random() * 100;
  const duration = 0.5 + Math.random() * 0.5;

  // Use a simplified gradient for the streaks
  const gradient = isDarkMode
    ? 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))'
    : 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))';

  return (
    <motion.div
      className="absolute h-0.5 rounded-full"
      initial={{ width: 0, opacity: 0, x: `${randomX}%`, y: `${randomY}%` }}
      animate={{
        width: ['0%', '100%', '0%'],
        opacity: [0, 1, 0],
        x: [`${randomX}%`, `${randomX - 20 + Math.random() * 40}%`, `${randomX}%`],
        y: [`${randomY}%`, `${randomY - 20 + Math.random() * 40}%`, `${randomY}%`],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'linear',
      }}
      style={{
        background: gradient,
      }}
    />
  );
};

interface HyperdriveAnimationProps {
  isImporting: boolean;
  isSuccess: boolean;
}

export function HyperdriveAnimation({
  isImporting,
  isSuccess,
}: HyperdriveAnimationProps) {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  const stars = Array.from({ length: 50 }, (_, i) => (
    <Star key={i} delay={Math.random() * 2} isDarkMode={isDarkMode} />
  ));

  return (
    <AnimatePresence>
      {isImporting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          {/* Main Animation Container */}
          <div className="relative h-48 w-48 overflow-hidden rounded-full border shadow-lg">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-radial from-primary/10 via-transparent to-transparent"></div>

            {/* Stars/Streaks */}
            <div className="h-full w-full motion-safe:animate-hyperdrive">
              {stars}
            </div>

            {/* Central Icon Transition */}
            <div className="absolute inset-0 flex items-center justify-center">
              <AnimatePresence>
                {!isSuccess ? (
                  <motion.div
                    key="loading"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    className="flex flex-col items-center gap-2 text-center"
                  >
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="font-semibold text-primary">Importing...</p>
                    <p className="text-xs text-muted-foreground">
                      Analyzing content...
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="success"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                    className="relative"
                  >
                    <File className="h-16 w-16 text-muted-foreground/50" />
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: 'spring' }}
                      className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-green-500"
                    >
                      <Check className="h-5 w-5 text-white" />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

    