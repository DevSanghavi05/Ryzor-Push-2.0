
import { FC, memo } from 'react';

// A simple markdown to HTML converter
const toHtml = (markdown: string): string => {
  if (!markdown) return '';
  
  // First, handle the blinking cursor special character
  let html = markdown.replace(/▋/g, '<span class="animate-blink inline-block">▋</span>');

  // Convert markdown to HTML without affecting the cursor span
  html = html
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
    .replace(/\*(.*?)\*/g, '<em>$1</em>'); // Italics

  // Handle lists
  html = html.replace(/^\s*[-*]\s+(.+)/gm, '<li>$1</li>');
  html = html.replace(/((<li>.*<\/li>\s*)+)/g, '<ul>$1</ul>');
  html = html.replace(/<\/ul>\s*<ul>/g, '');

  // Handle newlines, but be careful not to add <br> inside list structure or after the cursor
  html = html.split('\n').map(line => {
    if (line.trim().startsWith('<li') || line.trim().startsWith('<ul') || line.trim().startsWith('</ul')) {
      return line;
    }
    // Don't add a <br> if the line is just the cursor
    if (line.includes('<span class="animate-blink') && line.trim().length < 50) {
        return line;
    }
    return line === '' ? '<br />' : line;
  }).join('<br />').replace(/<br \/>\s*<br \/>/g, '<br />');

  // Cleanup extra breaks around lists
  html = html.replace(/<br \/>\s*<ul>/g, '<ul>');
  html = html.replace(/<\/ul>\s*<br \/>/g, '</ul>');
  
  return html;
};

interface MarkdownContentProps {
  content: string;
}

export const MarkdownContent: FC<MarkdownContentProps> = memo(({ content }) => {
  const htmlContent = toHtml(content);

  return (
    <div
      className="prose prose-sm dark:prose-invert max-w-none text-left leading-relaxed"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
});

MarkdownContent.displayName = 'MarkdownContent';
