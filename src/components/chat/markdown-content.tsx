
import { FC, memo, useEffect, useState } from 'react';
import { useUser } from '@/firebase';

// A simple markdown to HTML converter
const toHtml = (markdown: string, allDocs: any[]): string => {
  if (!markdown) return '';
  
  let html = markdown.replace(/▋/g, '<span class="animate-blink inline-block">▋</span>');

  // Convert markdown basics
  html = html
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Handle @file references
  html = html.replace(/@([^\s.,;!?]+)/g, (match, fileName) => {
    const doc = allDocs.find(d => d.name.trim().toLowerCase() === fileName.trim().toLowerCase());
    if (doc) {
      const url = doc.source === 'drive' && doc.webViewLink ? doc.webViewLink : `/documents/${doc.id}`;
      const target = doc.source === 'drive' && doc.webViewLink ? '_blank' : '_self';
      return `<a href="${url}" target="${target}" class="inline-block bg-primary/10 text-primary hover:bg-primary/20 rounded-md px-2 py-1 text-sm font-semibold transition-colors" data-doc-id="${doc.id}">@${fileName}</a>`;
    }
    return match; // Return original if no doc found
  });

  // Handle lists
  html = html.replace(/^\s*[-*]\s+(.+)/gm, '<li>$1</li>');
  html = html.replace(/((<li>.*<\/li>\s*)+)/g, '<ul>$1</ul>');
  html = html.replace(/<\/ul>\s*<ul>/g, '');

  // Handle newlines
  html = html.split('\n').map(line => {
    if (line.trim().startsWith('<li') || line.trim().startsWith('<ul') || line.trim().startsWith('</ul')) {
      return line;
    }
    if (line.includes('<span class="animate-blink') && line.trim().length < 50) {
        return line;
    }
    return line;
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
  const { user } = useUser();
  const [allDocs, setAllDocs] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
        const storedDocs = localStorage.getItem(`documents_${user.uid}`);
        if (storedDocs) {
            setAllDocs(JSON.parse(storedDocs));
        }
    }
  }, [user]);

  const htmlContent = toHtml(content, allDocs);

  return (
    <div
      className="prose prose-sm dark:prose-invert max-w-none text-left leading-relaxed"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
});

MarkdownContent.displayName = 'MarkdownContent';
