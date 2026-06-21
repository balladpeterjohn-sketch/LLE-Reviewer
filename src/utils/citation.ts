import { Citation, CitationStyle } from '../types';

/* ── APA 7th (default) ──────────────────────────────────────────────────── */

export function formatCitation(citation: Citation, style?: CitationStyle): string {
  const s = style ?? 'apa';
  if (s === 'mla') return formatMla(citation);
  if (s === 'chicago') return formatChicago(citation);
  return formatApa(citation);
}

function formatApa(citation: Citation): string {
  const authors = citation.authors.trim();
  const year = citation.year ? ` (${citation.year})` : '';
  switch (citation.type) {
    case 'book':    return apaBook(authors, citation, year);
    case 'journal': return apaJournal(authors, citation, year);
    case 'website': return apaWebsite(authors, citation, year);
    case 'thesis':  return apaThesis(authors, citation, year);
    case 'report':  return apaReport(authors, citation, year);
    default:        return `${authors}${year}. ${citation.title}.`;
  }
}

function apaBook(authors: string, c: Citation, year: string): string {
  const parts = [`${authors}${year}.`, italicize(c.title)];
  if (c.edition) parts.push(`(${c.edition} ed.)`);
  const pub = [c.place, c.publisher].filter(Boolean).join(': ');
  if (pub) parts.push(pub);
  return parts.join(' ').replace(/\s+/g, ' ').trim() + '.';
}

function apaJournal(authors: string, c: Citation, year: string): string {
  const parts = [`${authors}${year}.`, c.title];
  if (c.journal) parts.push(italicize(c.journal));
  const vol = c.volume ? italicize(c.volume) : '';
  const iss = c.issue ? `(${c.issue})` : '';
  if (vol || iss) parts.push(`${vol}${iss}`);
  if (c.pages) parts.push(c.pages);
  return parts.join(', ').replace(/\s+/g, ' ').trim() + '.';
}

function apaWebsite(authors: string, c: Citation, year: string): string {
  const parts = [`${authors}${year}.`, c.title];
  if (c.url) parts.push(`Retrieved from ${c.url}`);
  if (c.accessDate) parts.push(`(${c.accessDate})`);
  return parts.join('. ').replace(/\s+/g, ' ').trim() + '.';
}

function apaThesis(authors: string, c: Citation, year: string): string {
  const parts = [`${authors}${year}.`, italicize(c.title), '[Unpublished doctoral dissertation]'];
  if (c.publisher) parts.push(c.publisher);
  return parts.join('. ').replace(/\s+/g, ' ').trim() + '.';
}

function apaReport(authors: string, c: Citation, year: string): string {
  const parts = [`${authors}${year}.`, italicize(c.title)];
  if (c.publisher) parts.push(c.publisher);
  return parts.join('. ').replace(/\s+/g, ' ').trim() + '.';
}

/* ── MLA 9th ────────────────────────────────────────────────────────────── */

function formatMla(c: Citation): string {
  const authors = c.authors.trim();
  switch (c.type) {
    case 'book':
      return mlaBook(authors, c);
    case 'journal':
      return mlaJournal(authors, c);
    case 'website':
      return mlaWebsite(authors, c);
    default:
      return `${authors}. "${c.title}." ${c.year ?? ''}.`;
  }
}

function mlaBook(authors: string, c: Citation): string {
  const parts: string[] = [];
  parts.push(`${authors}.`);
  parts.push(italicize(c.title) + '.');
  if (c.edition) parts.push(`${c.edition} ed.,`);
  const pub = [c.publisher, c.year].filter(Boolean).join(', ');
  if (pub) parts.push(pub + '.');
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

function mlaJournal(authors: string, c: Citation): string {
  const parts: string[] = [];
  parts.push(`${authors}.`);
  parts.push(`"${c.title}."`);
  if (c.journal) parts.push(italicize(c.journal) + ',');
  if (c.volume) parts.push(`vol. ${c.volume},`);
  if (c.issue) parts.push(`no. ${c.issue},`);
  if (c.year) parts.push(`${c.year},`);
  if (c.pages) parts.push(`pp. ${c.pages}.`);
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

function mlaWebsite(authors: string, c: Citation): string {
  const parts: string[] = [];
  parts.push(`${authors}.`);
  parts.push(`"${c.title}."`);
  if (c.url) parts.push(c.url + '.');
  if (c.accessDate) parts.push(`Accessed ${c.accessDate}.`);
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

/* ── Chicago 17th (author-date) ─────────────────────────────────────────── */

function formatChicago(c: Citation): string {
  const authors = c.authors.trim();
  const year = c.year ? c.year : 'n.d.';
  switch (c.type) {
    case 'book':    return chicagoBook(authors, c, year);
    case 'journal': return chicagoJournal(authors, c, year);
    case 'website': return chicagoWebsite(authors, c, year);
    default:        return `${authors}. ${year}. "${c.title}."`;
  }
}

function chicagoBook(authors: string, c: Citation, year: string): string {
  const parts: string[] = [];
  parts.push(`${authors}. ${year}.`);
  parts.push(italicize(c.title) + '.');
  if (c.edition) parts.push(`${c.edition} ed.`);
  if (c.place && c.publisher) parts.push(`${c.place}: ${c.publisher}.`);
  else if (c.publisher) parts.push(c.publisher + '.');
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

function chicagoJournal(authors: string, c: Citation, year: string): string {
  const parts: string[] = [];
  parts.push(`${authors}. ${year}.`);
  parts.push(`"${c.title}."`);
  if (c.journal) parts.push(italicize(c.journal));
  if (c.volume && c.issue) parts.push(`${c.volume} (${c.issue}):`);
  else if (c.volume) parts.push(`${c.volume}:`);
  if (c.pages) parts.push(c.pages + '.');
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

function chicagoWebsite(authors: string, c: Citation, year: string): string {
  const parts: string[] = [];
  parts.push(`${authors}. ${year}.`);
  parts.push(`"${c.title}."`);
  if (c.url) parts.push(c.url + '.');
  if (c.accessDate) parts.push(`Accessed ${c.accessDate}.`);
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

/* ── Helpers ────────────────────────────────────────────────────────────── */

function italicize(text: string): string {
  return text;
}

export function formatInTextCitation(citation: Citation): string {
  const authorParts = citation.authors.split(/[,;&]/).map((a) => a.trim()).filter(Boolean);
  const surname = authorParts[0]?.split(' ').pop() ?? 'Unknown';
  const year = citation.year || 'n.d.';
  return `(${surname}, ${year})`;
}

export const CITATION_STYLE_LABELS: Record<CitationStyle, string> = {
  apa: 'APA 7th',
  mla: 'MLA 9th',
  chicago: 'Chicago 17th',
};
