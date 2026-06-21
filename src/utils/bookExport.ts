import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { TOS_SUBJECTS, findSubject, findTopic } from '../data/tosSubjects';
import { BookProject, Citation, ContentBlock, ReadingMaterial } from '../types';
import { normalizeBook } from './bookDefaults';
import { formatCitation } from './citation';
import {
  getImageLayout,
  getImageSize,
  getLayoutClass,
  getPdfImageCellWidth,
  getPdfImageMaxHeight,
  getPdfImageMaxWidth,
  isStackedLayout,
} from './imageLayout';

const PAGE_DIMENSIONS = {
  a4: { width: 595, height: 842, cssSize: 'A4' },
  letter: { width: 612, height: 792, cssSize: 'letter' },
} as const;

const MARGIN_PRESETS = {
  narrow: { top: '1.8cm', right: '1.5cm', bottom: '2.2cm', left: '1.8cm', header: '1.2cm', footer: '1.2cm' },
  standard: { top: '2.2cm', right: '2cm', bottom: '2.6cm', left: '2.5cm', header: '1.4cm', footer: '1.4cm' },
  wide: { top: '2.6cm', right: '2.5cm', bottom: '3cm', left: '3cm', header: '1.6cm', footer: '1.6cm' },
} as const;

function getPageDimensions(book: BookProject) {
  return PAGE_DIMENSIONS[book.settings.pageSize ?? 'a4'];
}

function getMargins(book: BookProject) {
  return MARGIN_PRESETS[book.settings.marginPreset ?? 'standard'];
}

function buildBookStyles(book: BookProject): string {
  const s = book.settings;
  const page = getPageDimensions(book);
  const margins = getMargins(book);
  const showRunning = s.includeRunningHeader !== false;
  const showPages = s.includePageNumbers !== false;
  const pageTop = showRunning ? '2.7cm' : margins.top;
  const pageBottom = showPages ? '2.0cm' : margins.bottom;

  return `
  @page {
    size: ${page.cssSize};
    margin: ${pageTop} ${margins.right} ${pageBottom} ${margins.left};
  }

  @page cover {
    margin: 1.2cm;
  }

  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

  html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    font-family: Georgia, 'Times New Roman', Times, serif;
    color: #1a1a1a;
    line-height: 1.6;
    font-size: 11pt;
  }

  img { max-width: 100%; height: auto; border: 0; }

  .book-content { display: block; width: 100%; }

  .print-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 1.55cm;
    padding: 0.28cm ${margins.right} 0 ${margins.left};
    background: #fff;
  }

  .print-header table,
  .print-footer table {
    width: 100%;
    border-collapse: collapse;
    border: 0;
  }

  .print-header .header-main {
    vertical-align: bottom;
    width: 72%;
    padding-bottom: 3px;
  }

  .print-header .header-label {
    display: block;
    font-size: 6.5pt;
    letter-spacing: 1.8px;
    text-transform: uppercase;
    color: #C9A227;
    margin-bottom: 2px;
    font-family: 'Helvetica Neue', Arial, sans-serif;
  }

  .print-header .header-title {
    display: block;
    font-size: 9.5pt;
    font-weight: 600;
    color: #1B4D3E;
    line-height: 1.25;
  }

  .print-header .header-meta {
    font-size: 8pt;
    color: #666;
    text-align: right;
    vertical-align: bottom;
    width: 28%;
    padding-bottom: 3px;
    line-height: 1.35;
  }

  .print-header .header-rule {
    border: 0;
    border-bottom: 1pt solid #C9A227;
    margin: 0;
    height: 0;
  }

  .print-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1.1cm;
    padding: 0.18cm ${margins.right} 0.22cm ${margins.left};
    background: #fff;
  }

  .print-footer .footer-page {
    text-align: center;
    font-size: 9pt;
    color: #1B4D3E;
    font-weight: 500;
    vertical-align: middle;
    font-family: 'Helvetica Neue', Arial, sans-serif;
  }

  .page-number-only::after {
    content: counter(page);
  }

  .cover-pages .cover-page {
    page: cover;
    page-break-after: always;
  }

  .page-break { page-break-before: always; }

  .title-page {
    text-align: center;
    padding: 120pt 20pt 60pt;
  }

  .cover-label {
    font-size: 10pt;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #C9A227;
    margin-bottom: 36pt;
  }

  .cover-title {
    font-size: 26pt;
    color: #1B4D3E;
    margin: 12pt 0;
    line-height: 1.2;
    border: 0;
  }

  .cover-subtitle { font-size: 14pt; color: #555; margin-bottom: 10pt; }
  .cover-edition { font-size: 11pt; color: #777; margin-bottom: 36pt; }
  .cover-author { font-size: 13pt; font-weight: 600; margin-bottom: 6pt; }
  .cover-publisher { font-size: 10pt; color: #666; }
  .cover-tos { font-size: 9pt; color: #999; margin-top: 48pt; }

  .copyright-page { padding: 80pt 20pt 40pt; }

  h2 {
    color: #1B4D3E;
    border-bottom: 2px solid #C9A227;
    padding-bottom: 5px;
    margin: 16px 0 10px;
    font-size: 16pt;
    page-break-after: avoid;
  }

  h3 { color: #2D6A4F; font-size: 13pt; margin: 14px 0 8px; page-break-after: avoid; }
  h4 { color: #2D6A4F; font-size: 12pt; margin: 12px 0 6px; page-break-after: avoid; }

  p {
    margin: 0 0 9px;
    text-align: justify;
    orphans: 3;
    widows: 3;
  }

  .toc-list { list-style: none; padding: 0; margin: 0; }
  .toc-list li {
    margin: 6px 0;
    padding: 2px 0 5px;
    border-bottom: 1px dotted #ccc;
    font-size: 10.5pt;
  }

  .toc-level-2 { padding-left: 16px; font-size: 10pt; }
  .toc-list a { color: #1B4D3E; text-decoration: none; }

  .part-divider {
    text-align: center;
    padding: 40pt 16pt;
    margin: 12px 0;
    background: #F7F5F0;
    page-break-inside: avoid;
  }

  .part-label {
    font-size: 10pt;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: #C9A227;
  }

  .part-title { font-size: 18pt; color: #1B4D3E; border: 0; margin: 10px 0; }
  .part-weight { font-size: 10pt; color: #666; }
  .part-desc { font-size: 10pt; color: #555; margin: 10px auto 0; max-width: 90%; text-align: center; }

  .chapter-title { font-size: 16pt; }
  .topic-label { font-size: 9pt; color: #888; font-style: italic; margin-bottom: 12px; text-align: left; }

  blockquote {
    border-left: 4px solid #C9A227;
    margin: 12px 0;
    padding: 8px 14px;
    background: #f9f7f2;
    page-break-inside: avoid;
  }

  .callout {
    padding: 10px 14px;
    margin: 12px 0;
    border-left: 4px solid;
    page-break-inside: avoid;
  }

  .callout-note { background: #E8F0EC; border-color: #1B4D3E; }
  .callout-tip { background: #FFF8E7; border-color: #C9A227; }
  .callout-important { background: #E8EEF8; border-color: #2D6A4F; }
  .callout-warning { background: #FDEEEE; border-color: #C0392B; }

  .footnote { font-size: 9pt; color: #666; border-top: 1px solid #eee; padding-top: 6px; }
  .divider { border: 0; border-top: 1px solid #C9A227; margin: 16px 0; }

  figure { margin: 14px 0; text-align: center; page-break-inside: avoid; }
  figcaption { font-size: 9pt; color: #666; margin-top: 6px; font-style: italic; }

  table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 10pt; }
  th { background: #1B4D3E; color: #fff; padding: 7px; text-align: left; }
  td { border: 1px solid #ddd; padding: 7px; vertical-align: top; }
  tr:nth-child(even) { background: #f9f9f9; }

  .citation-ref {
    font-size: 10pt;
    color: #444;
    padding-left: 14px;
    border-left: 3px solid #ddd;
    text-align: left;
  }

  .bib-entry {
    font-size: 10pt;
    text-indent: -18px;
    padding-left: 18px;
    margin: 6px 0;
    text-align: left;
  }

  .imgtext-table {
    width: 100%;
    border-collapse: collapse;
    margin: 14px 0;
    table-layout: fixed;
    page-break-inside: avoid;
  }

  .imgtext-table td { vertical-align: top; border: 0; padding: 0; }
  .imgtext-table td.img-cell { padding-right: 12px; }
  .imgtext-table td.text-cell { padding-left: 4px; }
  .imgtext-table.layout-right td.img-cell { padding-right: 0; padding-left: 12px; }
  .imgtext-table.layout-right td.text-cell { padding-left: 0; padding-right: 4px; }

  .stacked-block { margin: 14px 0; page-break-inside: avoid; }
  .stacked-block .stacked-img { margin: 8px 0; text-align: center; }
  .stacked-block .stacked-text { text-align: justify; }
  .stacked-block.layout-center .stacked-text { text-align: center; }

  .wrap-block { margin: 14px 0; page-break-inside: avoid; }
  .wrap-block::after { content: ""; display: block; clear: both; }
  .wrap-block .side-text { text-align: justify; }

  .side-caption { font-size: 9pt; color: #666; font-style: italic; margin-top: 6px; }

  .collage-table { width: 100%; border-collapse: collapse; }
  .collage-table td { padding: 4px; border: 0; text-align: center; vertical-align: middle; }

  .lof-list { list-style: none; padding: 0; margin: 0; }
  .lof-list li { margin: 5px 0; font-size: 10pt; }

  .copyright-meta { font-size: 10pt; color: #666; margin-top: 10px; }

  @media print {
    ${!showRunning ? '.print-header { display: none !important; }' : ''}
    ${!showPages ? '.print-footer { display: none !important; }' : ''}
    .chapter, .front-section, .back-section { page-break-inside: auto; }
    table, blockquote, .callout, figure, .imgtext-table, .stacked-block { page-break-inside: avoid; }
  }

  @media screen {
    body {
      max-width: 780px;
      margin: 0 auto;
      padding: 16px;
      background: #f0ede8;
    }

    .book-content {
      background: #fff;
      padding: 32px 36px;
      box-shadow: 0 1px 10px rgba(0, 0, 0, 0.08);
    }

    .print-header,
    .print-footer {
      position: relative;
      margin-bottom: 14px;
    }

    .print-footer { margin-top: 18px; }
  }
`;
}

function renderRunningHead(book: BookProject): string {
  const s = book.settings;
  const showHeader = s.includeRunningHeader !== false;
  const showPages = s.includePageNumbers !== false;
  if (!showHeader && !showPages) return '';

  const headerTitle = escapeHtml(s.headerText?.trim() || book.title);
  const edition = escapeHtml(s.edition?.trim() || '');
  const year = escapeHtml(s.year?.trim() || '');
  const editionLine = [edition, year].filter(Boolean).join(' · ');

  const header = showHeader
    ? `<div class="print-header">
        <table cellpadding="0" cellspacing="0" border="0"><tr>
          <td class="header-main">
            <span class="header-label">Librarians Licensure Examination Reviewer</span>
            <span class="header-title">${headerTitle}</span>
          </td>
          <td class="header-meta">${editionLine || '&nbsp;'}</td>
        </tr></table>
        <hr class="header-rule" />
      </div>`
    : '';

  const footer = showPages
    ? `<div class="print-footer"><table cellpadding="0" cellspacing="0" border="0"><tr>
        <td class="footer-page"><span class="page-number-only"></span></td>
      </tr></table></div>`
    : '';

  return header + footer;
}

function renderPdfImage(
  uri: string,
  size: ReturnType<typeof getImageSize>,
  alt: string
): string {
  const maxW = getPdfImageMaxWidth(size);
  const maxH = getPdfImageMaxHeight(size);
  return `<img src="${uri}" alt="${escapeHtml(alt)}" style="display:block;max-width:${maxW};max-height:${maxH};width:auto;height:auto;margin:0 auto;" />`;
}

function renderImageTextContent(block: ContentBlock): string {
  if (!block.imageUri && !block.text) return '';

  const layout = getImageLayout(block);
  const size = getImageSize(block);
  const layoutClass = getLayoutClass(layout);
  const caption = block.caption
    ? `<p class="side-caption">${escapeHtml(block.caption)}</p>`
    : '';
  const text = `<div class="side-text"><p>${escapeHtml(block.text ?? '').replace(/\n/g, '<br/>')}</p>${caption}</div>`;
  const img = block.imageUri ? renderPdfImage(block.imageUri, size, block.caption ?? 'Figure') : '';

  if (isStackedLayout(layout)) {
    const imageFirst = layout !== 'bottom';
    return `<div class="stacked-block ${layoutClass}">
      ${imageFirst && img ? `<div class="stacked-img">${img}</div>` : ''}
      ${text}
      ${!imageFirst && img ? `<div class="stacked-img">${img}</div>` : ''}
    </div>`;
  }

  if (layout === 'wrap-left' || layout === 'wrap-right') {
    const floatStyle =
      layout === 'wrap-left'
        ? `float:left;margin:0 12px 8px 0;max-width:${getPdfImageCellWidth(size)};`
        : `float:right;margin:0 0 8px 12px;max-width:${getPdfImageCellWidth(size)};`;
    const floatedImg = block.imageUri
      ? `<img src="${block.imageUri}" alt="${escapeHtml(block.caption ?? 'Figure')}" style="display:block;${floatStyle}max-height:${getPdfImageMaxHeight(size)};height:auto;" />`
      : '';
    return `<div class="wrap-block ${layoutClass}">${floatedImg}${text}</div>`;
  }

  const cellWidth = getPdfImageCellWidth(size);
  const imgCell = `<td class="img-cell" width="${cellWidth}" valign="top">${img}</td>`;
  const textCell = `<td class="text-cell" valign="top">${text}</td>`;

  return `<table class="imgtext-table ${layoutClass}" cellpadding="0" cellspacing="0" border="0">
    <tr>${layout === 'right' ? textCell + imgCell : imgCell + textCell}</tr>
  </table>`;
}

function renderCollageContent(block: ContentBlock): string {
  const uris = block.imageUris ?? [];
  if (uris.length === 0) return '';
  const cols = block.collageColumns ?? 2;
  const size = getImageSize(block);
  const maxH = size === 'small' ? '100px' : size === 'large' ? '180px' : size === 'full' ? '220px' : '140px';
  const cellWidth = cols === 2 ? '50%' : '33%';
  const rows: string[] = [];

  for (let i = 0; i < uris.length; i += cols) {
    const slice = uris.slice(i, i + cols);
    const cells = slice
      .map(
        (uri) =>
          `<td width="${cellWidth}" align="center" valign="middle"><img src="${uri}" alt="Collage" style="max-width:100%;max-height:${maxH};height:auto;display:block;margin:0 auto;" /></td>`
      )
      .join('');
    const padding = cols - slice.length;
    const emptyCells = Array.from({ length: padding }, () => `<td width="${cellWidth}"></td>`).join('');
    rows.push(`<tr>${cells}${emptyCells}</tr>`);
  }

  const cap = block.caption ? `<figcaption>${escapeHtml(block.caption)}</figcaption>` : '';
  return `<figure class="figure-item"><table class="collage-table" cellpadding="4" cellspacing="0" border="0">${rows.join('')}</table>${cap}</figure>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function paragraphsHtml(text: string): string {
  return escapeHtml(text)
    .split(/\n\n+/)
    .map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
    .join('');
}

function renderBlock(block: ContentBlock, citations: Map<string, Citation>): string {
  switch (block.type) {
    case 'heading': {
      const level = block.level ?? 2;
      const tag = `h${Math.min(level + 1, 4)}`;
      return `<${tag}>${escapeHtml(block.text ?? '')}</${tag}>`;
    }
    case 'paragraph':
      return `<p>${escapeHtml(block.text ?? '').replace(/\n/g, '<br/>')}</p>`;
    case 'quote':
      return `<blockquote><p>${escapeHtml(block.text ?? '')}</p></blockquote>`;
    case 'callout': {
      const variant = block.calloutVariant ?? 'note';
      const label = variant.charAt(0).toUpperCase() + variant.slice(1);
      return `<div class="callout callout-${variant}"><strong>${label}:</strong> ${escapeHtml(block.text ?? '').replace(/\n/g, '<br/>')}</div>`;
    }
    case 'footnote':
      return `<p class="footnote"><sup>*</sup> ${escapeHtml(block.text ?? '')}</p>`;
    case 'divider':
      return '<hr class="divider"/>';
    case 'image': {
      if (!block.imageUri) return '';
      const size = getImageSize(block);
      return `<figure class="figure-item">${renderPdfImage(block.imageUri, size, block.caption ?? 'Figure')}<figcaption>${escapeHtml(block.caption ?? '')}</figcaption></figure>`;
    }
    case 'image-text':
      return renderImageTextContent(block);
    case 'image-collage':
      return renderCollageContent(block);
    case 'table': {
      const rows = block.rows ?? [];
      if (rows.length === 0) return '';
      const header = rows[0];
      const body = rows.slice(1);
      const headerHtml = header.map((c) => `<th>${escapeHtml(c.value)}</th>`).join('');
      const bodyHtml = body
        .map((row) => `<tr>${row.map((c) => `<td>${escapeHtml(c.value)}</td>`).join('')}</tr>`)
        .join('');
      return `<table><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table>`;
    }
    case 'citation': {
      const citation = block.citationId ? citations.get(block.citationId) : undefined;
      if (!citation) return '';
      return `<p class="citation-ref"><em>${escapeHtml(formatCitation(citation))}</em></p>`;
    }
    default:
      return '';
  }
}

function countFigures(materials: ReadingMaterial[]): number {
  let n = 0;
  for (const m of materials) {
    for (const b of m.blocks) {
      if (b.type === 'image' || b.type === 'image-collage' || b.type === 'image-text') n++;
    }
  }
  return n;
}

interface TocEntry {
  id: string;
  label: string;
  level: number;
}

function buildTocEntries(book: BookProject, materials: ReadingMaterial[]): TocEntry[] {
  const entries: TocEntry[] = [];
  const fm = book.frontMatter;
  const bm = book.backMatter;
  const s = book.settings;

  if (fm.dedication?.trim()) entries.push({ id: 'dedication', label: 'Dedication', level: 1 });
  if (fm.foreword?.trim()) entries.push({ id: 'foreword', label: 'Foreword', level: 1 });
  if (fm.preface?.trim()) entries.push({ id: 'preface', label: 'Preface', level: 1 });
  if (fm.acknowledgments?.trim()) entries.push({ id: 'acknowledgments', label: 'Acknowledgments', level: 1 });
  if (fm.introduction?.trim()) entries.push({ id: 'introduction', label: 'Introduction', level: 1 });
  if (fm.abbreviations.length > 0) entries.push({ id: 'abbreviations', label: 'List of Abbreviations', level: 1 });
  if (s.includeTosOverview) entries.push({ id: 'tos-overview', label: 'TOS Overview', level: 1 });

  let chapter = 0;
  let lastSubject = '';
  const ordered = book.sections
    .sort((a, b) => a.order - b.order)
    .map((sec) => materials.find((m) => m.id === sec.materialId))
    .filter((m): m is ReadingMaterial => !!m);

  for (const material of ordered) {
    if (s.groupBySubject && material.subjectId !== lastSubject) {
      const subject = findSubject(material.subjectId);
      if (subject) {
        entries.push({ id: `part-${material.subjectId}`, label: `Part: ${subject.title}`, level: 1 });
        lastSubject = material.subjectId;
      }
    }
    chapter++;
    const prefix = s.numberChapters ? `Chapter ${chapter}: ` : '';
    entries.push({ id: `ch-${material.id}`, label: `${prefix}${material.title}`, level: 2 });
  }

  if (bm.appendices.length > 0) entries.push({ id: 'appendices', label: 'Appendices', level: 1 });
  if (s.includeGlossary && bm.glossary.length > 0) entries.push({ id: 'glossary', label: 'Glossary', level: 1 });
  if (s.includeBibliography) entries.push({ id: 'references', label: 'References', level: 1 });
  if (s.includeAboutAuthor && bm.aboutAuthor?.trim()) entries.push({ id: 'about-author', label: 'About the Author', level: 1 });

  return entries;
}

function renderToc(entries: TocEntry[]): string {
  const items = entries
    .map(
      (e) =>
        `<li class="toc-level-${e.level}"><a href="#${e.id}">${escapeHtml(e.label)}</a></li>`
    )
    .join('');
  return `<div class="toc page-break" id="toc"><h2>Table of Contents</h2><ul class="toc-list">${items}</ul></div>`;
}

function renderTitlePage(book: BookProject): string {
  const s = book.settings;
  return `
    <div class="title-page cover-page" id="title-page">
      <p class="cover-label">Librarians Licensure Examination Reviewer</p>
      <h1 class="cover-title">${escapeHtml(book.title)}</h1>
      ${book.subtitle ? `<p class="cover-subtitle">${escapeHtml(book.subtitle)}</p>` : ''}
      <p class="cover-edition">${escapeHtml(s.edition ?? '')}${s.year ? ` · ${escapeHtml(s.year)}` : ''}</p>
      <p class="cover-author">Compiled by ${escapeHtml(book.author)}</p>
      ${s.publisher ? `<p class="cover-publisher">${escapeHtml(s.publisher)}</p>` : ''}
      <p class="cover-tos">Based on PRC Board for Librarians Table of Specifications</p>
    </div>`;
}

function renderCopyrightPage(book: BookProject): string {
  const year = book.settings.year ?? new Date().getFullYear().toString();
  const notice =
    book.settings.copyrightNotice?.trim() ||
    `© ${year} ${book.author}. All rights reserved.`;
  return `
    <div class="copyright-page cover-page" id="copyright">
      <h2>Copyright</h2>
      <p>${escapeHtml(notice)}</p>
      <p class="copyright-meta">This reviewer was compiled for educational purposes aligned with the Philippine Librarians Licensure Examination syllabi and Table of Specifications.</p>
      <p class="copyright-meta">Compiled by: ${escapeHtml(book.author)}</p>
      ${book.settings.publisher ? `<p class="copyright-meta">Publisher: ${escapeHtml(book.settings.publisher)}</p>` : ''}
    </div>`;
}

function renderFrontSection(id: string, title: string, content?: string): string {
  if (!content?.trim()) return '';
  return `<section class="front-section page-break" id="${id}"><h2>${title}</h2>${paragraphsHtml(content)}</section>`;
}

function renderAbbreviations(entries: { abbr: string; meaning: string }[]): string {
  if (entries.length === 0) return '';
  const rows = entries
    .map((e) => `<tr><td><strong>${escapeHtml(e.abbr)}</strong></td><td>${escapeHtml(e.meaning)}</td></tr>`)
    .join('');
  return `<section class="front-section page-break" id="abbreviations"><h2>List of Abbreviations</h2><table class="abbr-table"><tbody>${rows}</tbody></table></section>`;
}

function renderTosOverview(): string {
  const rows = TOS_SUBJECTS.map(
    (s) =>
      `<tr><td>Day ${s.examDay}</td><td>${escapeHtml(s.title)}</td><td>${s.weight}%</td></tr>`
  ).join('');
  return `
    <section class="front-section page-break" id="tos-overview">
      <h2>TOS Overview</h2>
      <p>The Librarians Licensure Examination covers six subjects across two days, as prescribed by the PRC Board for Librarians.</p>
      <table><thead><tr><th>Day</th><th>Subject</th><th>Weight</th></tr></thead><tbody>${rows}</tbody></table>
    </section>`;
}

function renderListOfFigures(materials: ReadingMaterial[]): string {
  let fig = 0;
  const items: string[] = [];
  for (const m of materials) {
    for (const b of m.blocks) {
      if (b.type === 'image' || b.type === 'image-collage' || b.type === 'image-text') {
        fig++;
        const cap = b.caption || m.title;
        items.push(`<li>Figure ${fig}: ${escapeHtml(cap)} <span class="toc-dots"></span> ${escapeHtml(m.title)}</li>`);
      }
    }
  }
  if (items.length === 0) return '';
  return `<section class="front-section page-break" id="list-of-figures"><h2>List of Figures</h2><ul class="lof-list">${items.join('')}</ul></section>`;
}

function renderMaterial(
  material: ReadingMaterial,
  citations: Map<string, Citation>,
  chapterNum: number,
  settings: BookProject['settings']
): string {
  const topicInfo = findTopic(material.subjectId, material.topicId);
  const topicLabel = topicInfo ? `${topicInfo.topic.code} ${topicInfo.topic.title}` : '';
  const chapterTitle = settings.numberChapters
    ? `Chapter ${chapterNum}: ${material.title}`
    : material.title;
  const blocksHtml = material.blocks.map((b) => renderBlock(b, citations)).join('\n');

  return `
    <section class="chapter page-break" id="ch-${material.id}">
      <h2 class="chapter-title">${escapeHtml(chapterTitle)}</h2>
      <p class="topic-label">${escapeHtml(topicLabel)}</p>
      ${blocksHtml}
    </section>`;
}

function renderBody(
  book: BookProject,
  materials: ReadingMaterial[],
  citations: Map<string, Citation>
): string {
  let chapter = 0;
  let lastSubject = '';
  const parts: string[] = [];

  const ordered = book.sections
    .sort((a, b) => a.order - b.order)
    .map((sec) => materials.find((m) => m.id === sec.materialId))
    .filter((m): m is ReadingMaterial => !!m);

  for (const material of ordered) {
    if (book.settings.groupBySubject && material.subjectId !== lastSubject) {
      const subject = findSubject(material.subjectId);
      if (subject) {
        parts.push(`
          <div class="part-divider page-break" id="part-${material.subjectId}">
            <p class="part-label">Part ${TOS_SUBJECTS.findIndex((s) => s.id === material.subjectId) + 1}</p>
            <h2 class="part-title">${escapeHtml(subject.title)}</h2>
            <p class="part-weight">Exam Weight: ${subject.weight}% · Day ${subject.examDay}</p>
            <p class="part-desc">${escapeHtml(subject.description)}</p>
          </div>`);
        lastSubject = material.subjectId;
      }
    }
    chapter++;
    parts.push(renderMaterial(material, citations, chapter, book.settings));
  }
  return parts.join('\n');
}

function renderAppendices(appendices: BookProject['backMatter']['appendices']): string {
  if (appendices.length === 0) return '';
  const content = appendices
    .map(
      (a, i) =>
        `<section class="appendix" id="appendix-${a.id}"><h3>Appendix ${String.fromCharCode(65 + i)}: ${escapeHtml(a.title)}</h3>${paragraphsHtml(a.content)}</section>`
    )
    .join('');
  return `<div class="back-section page-break" id="appendices"><h2>Appendices</h2>${content}</div>`;
}

function renderGlossary(entries: { term: string; definition: string }[]): string {
  if (entries.length === 0) return '';
  const rows = entries
    .sort((a, b) => a.term.localeCompare(b.term))
    .map((e) => `<tr><td><strong>${escapeHtml(e.term)}</strong></td><td>${escapeHtml(e.definition)}</td></tr>`)
    .join('');
  return `<section class="back-section page-break" id="glossary"><h2>Glossary</h2><table><tbody>${rows}</tbody></table></section>`;
}

function renderBibliography(
  book: BookProject,
  materials: ReadingMaterial[],
  allCitations: Citation[]
): string {
  if (!book.settings.includeBibliography) return '';
  const citationMap = new Map(allCitations.map((c) => [c.id, c]));
  const usedIds = new Set<string>();
  for (const m of materials) {
    m.citationIds.forEach((id) => usedIds.add(id));
    m.blocks.forEach((b) => {
      if (b.citationId) usedIds.add(b.citationId);
    });
  }
  const entries = Array.from(usedIds)
    .map((id) => citationMap.get(id))
    .filter((c): c is Citation => !!c)
    .sort((a, b) => a.authors.localeCompare(b.authors))
    .map((c, i) => `<p class="bib-entry">${i + 1}. ${escapeHtml(formatCitation(c))}</p>`)
    .join('');
  if (!entries) return '';
  return `<div class="back-section page-break bibliography" id="references"><h2>References</h2>${entries}</div>`;
}

export function buildBookHtml(
  rawBook: BookProject,
  materials: ReadingMaterial[],
  allCitations: Citation[]
): string {
  const book = normalizeBook(rawBook);
  const citationMap = new Map(allCitations.map((c) => [c.id, c]));
  const s = book.settings;
  const fm = book.frontMatter;
  const bm = book.backMatter;

  const coverParts: string[] = [];
  const contentParts: string[] = [];

  if (s.includeTitlePage) coverParts.push(renderTitlePage(book));
  if (s.includeCopyrightPage) coverParts.push(renderCopyrightPage(book));

  if (fm.dedication?.trim()) contentParts.push(renderFrontSection('dedication', 'Dedication', fm.dedication));
  if (fm.foreword?.trim()) contentParts.push(renderFrontSection('foreword', 'Foreword', fm.foreword));
  if (fm.preface?.trim()) contentParts.push(renderFrontSection('preface', 'Preface', fm.preface));
  if (fm.acknowledgments?.trim()) contentParts.push(renderFrontSection('acknowledgments', 'Acknowledgments', fm.acknowledgments));
  if (fm.introduction?.trim()) contentParts.push(renderFrontSection('introduction', 'Introduction', fm.introduction));
  if (fm.abbreviations.length > 0) contentParts.push(renderAbbreviations(fm.abbreviations));
  if (s.includeTosOverview) contentParts.push(renderTosOverview());
  if (s.includeListOfFigures && countFigures(materials) > 0) contentParts.push(renderListOfFigures(materials));
  if (s.includeTableOfContents) contentParts.push(renderToc(buildTocEntries(book, materials)));

  contentParts.push(renderBody(book, materials, citationMap));

  if (bm.appendices.length > 0) contentParts.push(renderAppendices(bm.appendices));
  if (s.includeGlossary && bm.glossary.length > 0) contentParts.push(renderGlossary(bm.glossary));
  contentParts.push(renderBibliography(book, materials, allCitations));
  if (s.includeAboutAuthor && bm.aboutAuthor?.trim()) {
    contentParts.push(renderFrontSection('about-author', 'About the Author', bm.aboutAuthor));
  }

  const runningHead = renderRunningHead(book);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=${getPageDimensions(book).width}, initial-scale=1.0, maximum-scale=1.0"/>
  <title>${escapeHtml(book.title)}</title>
  <style>${buildBookStyles(book)}</style>
</head>
<body>
  <div class="cover-pages">${coverParts.join('\n')}</div>
  ${runningHead}
  <main class="book-content">${contentParts.join('\n')}</main>
</body>
</html>`;
}

export async function exportBookToPdf(
  book: BookProject,
  materials: ReadingMaterial[],
  citations: Citation[]
): Promise<string> {
  const normalized = normalizeBook(book);
  const html = buildBookHtml(normalized, materials, citations);
  const page = getPageDimensions(normalized);
  const { uri } = await Print.printToFileAsync({
    html,
    width: page.width,
    height: page.height,
    textZoom: 100,
    base64: false,
  });
  return uri;
}

export async function sharePdf(uri: string): Promise<void> {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Share LLE Reviewer Book',
    });
  }
}

export function getMaterialPreview(material: ReadingMaterial): string {
  const paragraph = material.blocks.find((b) => b.type === 'paragraph' && b.text?.trim());
  return paragraph?.text?.slice(0, 120) ?? 'No content yet';
}

export function getSubjectLabel(subjectId: string): string {
  return findSubject(subjectId)?.title ?? subjectId;
}

export function getBookPartSummary(book: BookProject): string[] {
  const normalized = normalizeBook(book);
  const parts: string[] = [];
  const s = normalized.settings;
  if (s.includeTitlePage) parts.push('Title Page');
  if (s.includeCopyrightPage) parts.push('Copyright');
  if (normalized.frontMatter.dedication?.trim()) parts.push('Dedication');
  if (normalized.frontMatter.foreword?.trim()) parts.push('Foreword');
  if (normalized.frontMatter.preface?.trim()) parts.push('Preface');
  if (normalized.frontMatter.acknowledgments?.trim()) parts.push('Acknowledgments');
  if (normalized.frontMatter.introduction?.trim()) parts.push('Introduction');
  if (normalized.frontMatter.abbreviations.length > 0) parts.push('Abbreviations');
  if (s.includeTosOverview) parts.push('TOS Overview');
  if (s.includeTableOfContents) parts.push('Table of Contents');
  parts.push(`${normalized.sections.length} chapter(s)`);
  if (normalized.backMatter.appendices.length > 0) parts.push('Appendices');
  if (s.includeGlossary && normalized.backMatter.glossary.length > 0) parts.push('Glossary');
  if (s.includeBibliography) parts.push('References');
  if (s.includeAboutAuthor && normalized.backMatter.aboutAuthor?.trim()) parts.push('About Author');
  return parts;
}
