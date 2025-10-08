'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface TypingAnimationProps {
  lines: string[];
  className?: string;
  typingSpeed?: number;
  deletingSpeed?: number;
  delayBetweenLines?: number;
}

export function TypingAnimation({
  lines,
  className,
  typingSpeed = 100,
  deletingSpeed = 50,
  delayBetweenLines = 2000,
}: TypingAnimationProps) {
  const [lineIndex, setLineIndex] = useState(0);
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let typingTimeout: NodeJS.Timeout;

    const handleTyping = () => {
      const currentLine = lines[lineIndex];
      if (isDeleting) {
        if (text.length > 0) {
          setText(currentLine.substring(0, text.length - 1));
          typingTimeout = setTimeout(handleTyping, deletingSpeed);
        } else {
          setIsDeleting(false);
          setLineIndex((prev) => (prev + 1) % lines.length);
        }
      } else {
        if (text.length < currentLine.length) {
          setText(currentLine.substring(0, text.length + 1));
          typingTimeout = setTimeout(handleTyping, typingSpeed);
        } else {
          typingTimeout = setTimeout(() => setIsDeleting(true), delayBetweenLines);
        }
      }
    };

    typingTimeout = setTimeout(handleTyping, isDeleting ? deletingSpeed : typingSpeed);

    return () => clearTimeout(typingTimeout);
  }, [text, isDeleting, lineIndex, lines, typingSpeed, deletingSpeed, delayBetweenLines]);

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <p className="text-lg md:text-xl relative">
        {text}
        <span className="animate-pulse">|</span>
      </p>
    </div>
  );
}
