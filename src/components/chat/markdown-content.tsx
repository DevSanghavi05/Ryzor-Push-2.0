
import { FC } from 'react';

// A very simple markdown to HTML converter
const toHtml = (markdown: string): string => {
  let html = markdown
    // Escape basic HTML to prevent injection
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  // Bold **text**
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Italics *text*
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Unordered list items * item
  html = html.replace(/^\s*\*[ \t]+(.+)/gm, '<li>$1</li>');
  // Wrap consecutive <li>'s in <ul>
  html = html.replace(/(<li>(?:.|\n)*?<\/li>)/g, '<ul>$1</ul>');
   // Handle newlines -> <br>
  html = html.replace(/\n/g, '<br />');
  // Clean up extra <br>s around lists
  html = html.replace(/<br \/><ul>/g, '<ul>');
  html = html.replace(/<\/ul><br \/>/g, '</ul>');
  // Clean up <br> inside li
  html = html.replace(/<li><br \/>/g, '<li>');


  return html;
};

interface MarkdownContentProps {
  content: string;
}

export const MarkdownContent: FC<MarkdownContentProps> = ({ content }) => {
  const htmlContent = toHtml(content);

  return (
    <div
      className="prose prose-sm text-sm max-w-none text-current"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};
