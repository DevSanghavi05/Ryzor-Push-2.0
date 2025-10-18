
'use client';

import { useState, useEffect, memo, useMemo } from "react";
import { MarkdownContent } from "./markdown-content";

export const TypingAnimation = memo(({ text, speed = 20, className }: { text: string, speed?: number, className?: string}) => {
  const [displayedText, setDisplayedText] = useState("");

  const fullText = useMemo(() => text, [text]);

  useEffect(() => {
    if (!fullText) return;
    let i = 0;
    setDisplayedText(''); // Reset on new text
    
    const typingInterval = setInterval(() => {
      if (i < fullText.length) {
        setDisplayedText(prev => prev + fullText.charAt(i));
        i++;
      } else {
        clearInterval(typingInterval);
      }
    }, speed);

    return () => clearInterval(typingInterval);
  }, [fullText, speed]);

  // Use a blinking cursor for the typing effect
  const cursor = displayedText.length < fullText.length ? '▋' : '';

  return (
    <div className={`text-sm leading-relaxed whitespace-pre-wrap ${className}`}>
        <MarkdownContent content={displayedText + cursor} />
    </div>
  );
});

TypingAnimation.displayName = 'TypingAnimation';
