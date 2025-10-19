
'use client';

import { memo } from "react";
import { MarkdownContent } from "./markdown-content";

// This component is now deprecated as the typewriter logic has been moved directly into the page.tsx
// to handle streaming responses more effectively. This file can be removed in the future.
export const TypingAnimation = memo(({ text }: { text: string }) => {
  return (
    <div className={`text-sm leading-relaxed whitespace-pre-wrap`}>
        <MarkdownContent content={text || '▋'} />
    </div>
  );
});

TypingAnimation.displayName = 'TypingAnimation';
