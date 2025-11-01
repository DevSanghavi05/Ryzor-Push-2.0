
import { FC, memo } from 'react';

// A simple markdown to HTML converter
const toHtml = (markdown: string): string => {
  if (!markdown) return '';
  
  // Escape HTML to prevent injection, but keep the cursor
  let html = markdown.replace(/&/g, '&amp;')
                     .replace(/</g, '&lt;')
                     .replace(/>/g, '&gt;')
                     .replace(/"/g, '&quot;')
                     .replace(/'/g, '&#039;')
                     .replace(/▋/g, '<span class="animate-blink">▋</span>');

  // Bold **text**
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Italics *text*
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Unordered list items * item or - item
  html = html.replace(/^\s*[-*]\s+(.+)/gm, '<li>$1</li>');
  // Wrap consecutive <li>'s in <ul>
  html = html.replace(/(<li>(?:.|\n)*?<\/li>)/g, '<ul>$1</ul>');
  // Clean up multiple <ul> tags
  html = html.replace(/<\/ul>\s*<ul>/g, '');
   // Handle newlines -> <br>
  html = html.replace(/\n/g, '<br />');
  // Clean up extra <br>s around lists
  html = html.replace(/<br \/>\s*<ul>/g, '<ul>');
  html = html.replace(/<\/ul>\s*<br \/>/g, '</ul>');
  // Clean up <br> inside li
  html = html.replace(/<li>\s*<br \/>/g, '<li>');

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

    