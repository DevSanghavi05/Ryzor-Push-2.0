
'use client';

import { useState, useEffect } from "react";

export function TypingAnimation({ text, speed = 30 }: { text: string, speed?: number}) {
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

  // A simple markdown to HTML converter for the typewriter
  const toHtml = (markdown: string): string => {
    let html = markdown
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^\s*\*[ \t]+(.+)/gm, '<li>$1</li>')
        .replace(/(<li>(?:.|\n)*?<\/li>)/g, '<ul>$1</ul>')
        .replace(/\n/g, '<br />')
        .replace(/<br \/><ul>/g, '<ul>')
        .replace(/<\/ul><br \/>/g, '</ul>')
        .replace(/<li><br \/>/g, '<li>');
    return html;
  };

  const htmlContent = toHtml(displayedText);

  return (
    <p className="text-lg leading-relaxed whitespace-pre-line">
        <span dangerouslySetInnerHTML={{ __html: htmlContent }} />
        <span className="border-r-2 border-primary animate-pulse"></span>
    </p>
  );
}

    