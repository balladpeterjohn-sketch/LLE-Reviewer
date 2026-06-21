export interface RichTextSpan {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  highlight?: boolean;
  strikethrough?: boolean;
}

type FormatMarker = {
  marker: string;
  key: keyof Omit<RichTextSpan, 'text'>;
};

const FORMATS: FormatMarker[] = [
  { marker: '**', key: 'bold' },
  { marker: '__', key: 'underline' },
  { marker: '~~', key: 'strikethrough' },
  { marker: '==', key: 'highlight' },
  { marker: '*',  key: 'italic' },  // single * LAST (after **)
];

/**
 * Parse a plain text string with markdown-style markers into spans.
 * Supported: **bold**, *italic*, __underline__, ==highlight==, ~~strikethrough~~
 */
export function parseRichText(text: string): RichTextSpan[] {
  if (!text) return [{ text: '' }];
  if (!text.includes('*') && !text.includes('_') && !text.includes('~') && !text.includes('=')) {
    return [{ text }];
  }

  const spans: RichTextSpan[] = [];
  let remaining = text;
  let safety = 0;

  while (remaining.length > 0 && safety++ < 2000) {
    let earliest = -1;
    let earliestFormat: FormatMarker | null = null;

    for (const fmt of FORMATS) {
      const idx = remaining.indexOf(fmt.marker);
      if (idx !== -1 && (earliest === -1 || idx < earliest)) {
        earliest = idx;
        earliestFormat = fmt;
      }
    }

    if (earliest === -1 || !earliestFormat) {
      spans.push({ text: remaining });
      break;
    }

    const fmt = earliestFormat;
    const closeIdx = remaining.indexOf(fmt.marker, earliest + fmt.marker.length);

    if (closeIdx === -1) {
      spans.push({ text: remaining });
      break;
    }

    if (earliest > 0) {
      spans.push({ text: remaining.slice(0, earliest) });
    }

    const inner = remaining.slice(earliest + fmt.marker.length, closeIdx);
    if (inner.length > 0) {
      const innerSpans = parseRichText(inner);
      for (const s of innerSpans) {
        spans.push({ ...s, [fmt.key]: true });
      }
    }

    remaining = remaining.slice(closeIdx + fmt.marker.length);
  }

  return spans.length > 0 ? spans : [{ text }];
}

/** Convert parsed spans to HTML for PDF/preview */
export function spansToHtml(spans: RichTextSpan[]): string {
  return spans.map((s) => {
    let html = escapeHtml(s.text);
    if (s.bold)          html = `<strong>${html}</strong>`;
    if (s.italic)        html = `<em>${html}</em>`;
    if (s.underline)     html = `<u>${html}</u>`;
    if (s.highlight)     html = `<mark style="background:#FFF3CD;padding:0 2px;">${html}</mark>`;
    if (s.strikethrough) html = `<s>${html}</s>`;
    return html;
  }).join('');
}

/** Convert a raw text string (with markers) to HTML */
export function richTextToHtml(text: string): string {
  return spansToHtml(parseRichText(text));
}

function escapeHtml(t: string): string {
  return t
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Check if a text string contains any formatting markers */
export function hasFormatting(text: string): boolean {
  return /\*\*|__|\*|==|~~/.test(text);
}

/** Wrap selected text in a format marker */
export function applyFormat(
  text: string,
  selection: { start: number; end: number },
  marker: string
): string {
  const before = text.slice(0, selection.start);
  const selected = text.slice(selection.start, selection.end);
  const after = text.slice(selection.end);

  if (selected.length > 0) {
    if (selected.startsWith(marker) && selected.endsWith(marker) && selected.length > marker.length * 2) {
      return before + selected.slice(marker.length, selected.length - marker.length) + after;
    }
    return `${before}${marker}${selected}${marker}${after}`;
  }

  return `${before}${marker}${marker}${after}`;
}
