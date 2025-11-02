
'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

export function HyperdriveAnimation({ show, onComplete }: { show: boolean, onComplete: () => void }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0, rotate: 0 }}
            animate={{ scale: [0, 15, 12, 12], rotate: [0, 0, 0, 360], opacity: [1, 1, 1, 0] }}
            transition={{ duration: 1.5, ease: 'easeInOut', times: [0, 0.4, 0.7, 1] }}
            className="w-24 h-24 rounded-full border-4 border-primary"
            onAnimationComplete={onComplete}
          />
           <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1, 1], opacity: [0, 1, 1] }}
            transition={{ duration: 1.0, ease: 'easeOut', delay: 0.5 }}
            className="absolute"
          >
            <Check className="w-32 h-32 text-white" strokeWidth={3}/>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
