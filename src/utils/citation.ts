import { Citation } from '../types';

export function formatCitation(citation: Citation): string {
  const authors = citation.authors.trim();
  const year = citation.year ? ` (${citation.year})` : '';

  switch (citation.type) {
    case 'book':
      return formatBook(authors, citation, year);
    case 'journal':
      return formatJournal(authors, citation, year);
    case 'website':
      return formatWebsite(authors, citation, year);
    case 'thesis':
      return formatThesis(authors, citation, year);
    case 'report':
      return formatReport(authors, citation, year);
    default:
      return `${authors}${year}. ${citation.title}.`;
  }
}

function formatBook(authors: string, c: Citation, year: string): string {
  const parts = [`${authors}${year}.`, c.title];
  if (c.edition) parts.push(`(${c.edition} ed.)`);
  const pub = [c.place, c.publisher].filter(Boolean).join(': ');
  if (pub) parts.push(pub);
  return parts.join(' ').replace(/\s+/g, ' ').trim() + '.';
}

function formatJournal(authors: string, c: Citation, year: string): string {
  const parts = [`${authors}${year}.`, c.title];
  if (c.journal) parts.push(c.journal);
  const volIssue = [c.volume && `Vol. ${c.volume}`, c.issue && `No. ${c.issue}`]
    .filter(Boolean)
    .join(', ');
  if (volIssue) parts.push(`(${volIssue})`);
  if (c.pages) parts.push(`pp. ${c.pages}`);
  return parts.join('. ').replace(/\s+/g, ' ').trim() + '.';
}

function formatWebsite(authors: string, c: Citation, year: string): string {
  const parts = [`${authors}${year}.`, c.title];
  if (c.url) parts.push(`Retrieved from ${c.url}`);
  if (c.accessDate) parts.push(`(accessed ${c.accessDate})`);
  return parts.join('. ').replace(/\s+/g, ' ').trim() + '.';
}

function formatThesis(authors: string, c: Citation, year: string): string {
  const parts = [`${authors}${year}.`, c.title, '[Thesis]'];
  if (c.publisher) parts.push(c.publisher);
  return parts.join('. ').replace(/\s+/g, ' ').trim() + '.';
}

function formatReport(authors: string, c: Citation, year: string): string {
  const parts = [`${authors}${year}.`, c.title, '[Report]'];
  if (c.publisher) parts.push(c.publisher);
  return parts.join('. ').replace(/\s+/g, ' ').trim() + '.';
}

export function formatInTextCitation(citation: Citation): string {
  const authorParts = citation.authors.split(/[,;&]/).map((a) => a.trim()).filter(Boolean);
  const surname = authorParts[0]?.split(' ').pop() ?? 'Unknown';
  const year = citation.year || 'n.d.';
  return `(${surname}, ${year})`;
}
