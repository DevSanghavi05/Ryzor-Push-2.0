
'use client';

import { useState, useEffect, memo } from "react";
import { MarkdownContent } from "./markdown-content";

export const TypingAnimation = memo(({ text, speed = 20, className }: { text: string, speed?: number, className?: string}) => {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    if (!text) return;
    let i = 0;
    setDisplayedText(''); // Reset on new text
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(prev => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <div className={`text-sm leading-relaxed whitespace-pre-wrap ${className}`}>
        <MarkdownContent content={displayedText} />
    </div>
  );
});

TypingAnimation.displayName = 'TypingAnimation';
