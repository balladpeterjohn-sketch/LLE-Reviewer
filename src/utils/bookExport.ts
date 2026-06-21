import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { TOS_SUBJECTS, findSubject, findTopic } from '../data/tosSubjects';
import { BookFont, BookProject, Citation, CitationStyle, ContentBlock, ReadingMaterial } from '../types';
import { TosTopic } from '../types';
import { normalizeBook } from './bookDefaults';
import { formatCitation } from './citation';
import { richTextToHtml } from './richText';
import {
  getImageLayout,
  getImageSize,
  getLayoutClass,
  getPdfImageCellWidth,
  getPdfImageMaxHeight,
  getPdfImageMaxWidth,
  getPdfMagazineWidth,
  isStackedLayout,
  isMagazineLayout,
  isInsetLayout,
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

function getBookFont(book: BookProject): string {
  const fonts: Record<BookFont, string> = {
    georgia: "Georgia, 'Times New Roman', Times, serif",
    palatino: "'Palatino Linotype', Palatino, 'Book Antiqua', serif",
    times: "'Times New Roman', Times, serif",
    helvetica: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  };
  return fonts[book.settings.fontFamily ?? 'georgia'];
}

function cssQuote(text: string): string {
  return `"${text.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function buildPageMarginCss(book: BookProject, margins: ReturnType<typeof getMargins>): string {
  const s = book.settings;
  const showHeader = s.includeRunningHeader !== false;
  const showPages = s.includePageNumbers !== false;
  const placement = s.pageNumberPlacement ?? 'outer';

  const headerTitle = cssQuote(s.headerText?.trim() || book.title);
  const editionLine = cssQuote([s.edition, s.year].filter(Boolean).join(' · ') || '');

  const headerLeft = showHeader
    ? `
  @top-left {
    content: ${headerTitle};
    font-size: 8pt;
    font-weight: 600;
    color: #1B4D3E;
    vertical-align: bottom;
    padding-bottom: 5px;
    font-style: italic;
  }`
    : '';

  const headerRight = showHeader && editionLine !== '""'
    ? `
  @top-right {
    content: ${editionLine};
    font-size: 7.5pt;
    color: #888;
    vertical-align: bottom;
    padding-bottom: 5px;
  }`
    : '';

  const pageNumOuter = showPages && placement === 'outer'
    ? `
  @page :left {
    @bottom-left {
      content: counter(page);
      font-size: 9pt;
      color: #1B4D3E;
      vertical-align: top;
      padding-top: 6px;
    }
  }

  @page :right {
    @bottom-right {
      content: counter(page);
      font-size: 9pt;
      color: #1B4D3E;
      vertical-align: top;
      padding-top: 6px;
    }
  }`
    : '';

  const pageNumCenter = showPages && placement === 'center'
    ? `
  @bottom-center {
    content: counter(page);
    font-size: 9pt;
    color: #1B4D3E;
    vertical-align: top;
    padding-top: 6px;
  }`
    : '';

  const coverReset = `
  @page cover {
    margin: 0;
    @top-left { content: none; }
    @top-center { content: none; }
    @top-right { content: none; }
    @bottom-left { content: none; }
    @bottom-center { content: none; }
    @bottom-right { content: none; }
  }`;

  return `
  @page {
    size: ${getPageDimensions(book).cssSize};
    margin: ${showHeader ? '2.4cm' : margins.top} ${margins.right} ${showPages ? '2.0cm' : margins.bottom} ${margins.left};
    ${headerLeft}
    ${headerRight}
    ${pageNumCenter}
  }
  ${pageNumOuter}
  ${coverReset}`;
}

function buildPdfStyles(book: BookProject): string {
  const margins = getMargins(book);
  const bodyFont = getBookFont(book);

  return `
  ${buildPageMarginCss(book, margins)}

  *, *::before, *::after {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  html, body {
    margin: 0; padding: 0; width: 100%;
    font-family: ${bodyFont};
    color: #1a1a1a;
    line-height: 1.68;
    font-size: 11pt;
  }

  img { max-width: 100%; height: auto; border: 0; }
  .book-content { display: block; width: 100%; }
  .content-start { page-break-before: always; }

  .cover-pages .cover-page {
    page: cover;
    page-break-after: always;
  }

  .page-break { page-break-before: always; }

  /* ── TITLE PAGE ─────────────────────────────────────────── */
  .title-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 72pt 48pt 56pt;
    min-height: 560pt;
  }

  .title-page-rule {
    width: 72%;
    height: 2px;
    background: linear-gradient(to right, transparent, #C9A227, transparent);
    margin: 20pt auto;
    border: 0;
  }

  .cover-label {
    font-size: 8.5pt;
    letter-spacing: 3.5px;
    text-transform: uppercase;
    color: #C9A227;
    margin-bottom: 20pt;
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  }

  .cover-title {
    font-size: 30pt;
    color: #1B4D3E;
    margin: 0 0 10pt;
    line-height: 1.15;
    font-weight: bold;
    border: 0;
    letter-spacing: -0.5px;
  }

  .cover-subtitle {
    font-size: 14pt;
    color: #555;
    margin-bottom: 8pt;
    font-style: italic;
    font-weight: normal;
  }

  .cover-edition {
    font-size: 10pt;
    color: #888;
    margin-bottom: 0;
    letter-spacing: 1px;
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  }

  .cover-author-section { margin-top: 32pt; margin-bottom: 6pt; }

  .cover-author-label {
    font-size: 7.5pt;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    color: #aaa;
    margin-bottom: 5pt;
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  }

  .cover-author {
    font-size: 14pt;
    font-weight: 600;
    color: #1B4D3E;
    margin-bottom: 6pt;
  }

  .cover-publisher {
    font-size: 10pt;
    color: #777;
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  }

  .cover-tos {
    font-size: 8pt;
    color: #bbb;
    margin-top: 18pt;
    font-style: italic;
    letter-spacing: 0.3px;
  }

  /* ── COPYRIGHT PAGE ──────────────────────────────────────── */
  .copyright-page { padding: 80pt 20pt 40pt; }
  .copyright-meta { font-size: 10pt; color: #777; margin-top: 8pt; line-height: 1.6; }

  /* ── HEADINGS ────────────────────────────────────────────── */
  h2 {
    color: #1B4D3E;
    font-size: 17pt;
    margin: 0 0 14pt;
    padding: 0 0 7pt;
    border-bottom: 2.5px solid #C9A227;
    line-height: 1.2;
    page-break-after: avoid;
    letter-spacing: -0.3px;
  }

  h3 {
    color: #2D6A4F;
    font-size: 13pt;
    margin: 16pt 0 7pt;
    page-break-after: avoid;
    border-left: 3px solid #C9A227;
    padding-left: 8pt;
  }

  h4 {
    color: #2D6A4F;
    font-size: 11.5pt;
    margin: 12pt 0 5pt;
    page-break-after: avoid;
    font-style: italic;
  }

  h5 {
    color: #555;
    font-size: 10.5pt;
    margin: 10pt 0 4pt;
    page-break-after: avoid;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-size: 9.5pt;
  }

  p {
    margin: 0 0 9pt;
    text-align: justify;
    orphans: 3;
    widows: 3;
    hyphens: auto;
  }

  /* ── TABLE OF CONTENTS ───────────────────────────────────── */
  .toc-list { list-style: none; padding: 0; margin: 0; }

  .toc-list li {
    display: flex;
    align-items: baseline;
    padding: 3pt 0;
    border-bottom: 1px dotted #ddd;
    font-size: 10.5pt;
    gap: 4px;
  }

  .toc-entry-label { flex: 0 0 auto; max-width: 74%; }
  .toc-entry-dots {
    flex: 1 1 auto;
    border-bottom: 1px dotted #bbb;
    min-width: 12px;
    margin: 0 6px;
    position: relative;
    top: -3px;
  }
  .toc-page { flex: 0 0 auto; font-size: 9pt; color: #888; }
  .toc-page a { color: #888; text-decoration: none; }
  /* PDF page number via CSS target-counter */
  .toc-page .toc-page-num { display: none; }
  .toc-page::after { content: target-counter(attr(data-target url), page); font-size: 9pt; color: #1B4D3E; }

  .toc-level-2 { padding-left: 20px; font-size: 10pt; }
  .toc-level-3 { padding-left: 36px; font-size: 9.5pt; color: #666; }
  .toc-list a { color: #1B4D3E; text-decoration: none; }

  /* ── PART DIVIDERS ───────────────────────────────────────── */
  .part-divider {
    text-align: center;
    padding: 64pt 32pt 56pt;
    margin: 0;
    background: linear-gradient(155deg, #1B4D3E 0%, #0d2419 100%);
    page-break-inside: avoid;
  }

  .part-label {
    display: block;
    font-size: 8.5pt;
    text-transform: uppercase;
    letter-spacing: 4px;
    color: #C9A227;
    margin-bottom: 10pt;
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  }

  .part-ornament {
    display: block;
    font-size: 16pt;
    color: rgba(201, 162, 39, 0.5);
    margin: 6pt 0;
    letter-spacing: 6px;
  }

  .part-title {
    font-size: 22pt;
    color: #FEFDF7;
    border: 0;
    margin: 8pt 0 10pt;
    text-shadow: 0 2px 8px rgba(0,0,0,0.3);
    line-height: 1.2;
  }

  .part-rule {
    width: 56%;
    height: 1px;
    background: linear-gradient(to right, transparent, rgba(201,162,39,0.5), transparent);
    margin: 10pt auto;
    border: 0;
  }

  .part-weight {
    font-size: 9.5pt;
    color: rgba(255,255,255,0.55);
    letter-spacing: 1px;
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  }

  .part-desc {
    font-size: 10pt;
    color: rgba(255,255,255,0.45);
    margin: 10pt auto 0;
    max-width: 80%;
    text-align: center;
    font-style: italic;
  }

  /* ── CHAPTER OPENER ──────────────────────────────────────── */
  .chapter { position: relative; }

  .chapter-num-decoration {
    font-size: 88pt;
    font-weight: 900;
    color: rgba(27, 77, 62, 0.055);
    line-height: 1;
    text-align: right;
    margin-bottom: -56pt;
    position: relative;
    z-index: 0;
    font-family: Georgia, serif;
    letter-spacing: -4px;
    padding-right: 2pt;
    page-break-after: avoid;
  }

  .chapter-title {
    font-size: 17pt;
    position: relative;
    z-index: 1;
    page-break-after: avoid;
  }

  .topic-label {
    font-size: 8.5pt;
    color: #999;
    font-style: italic;
    margin-bottom: 14pt;
    text-align: left;
    letter-spacing: 0.3px;
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    page-break-after: avoid;
  }

  .chapter-body > p:first-child::first-letter {
    float: left;
    font-size: 3.5em;
    line-height: 0.82;
    margin: 0.05em 0.08em 0 0;
    color: #1B4D3E;
    font-weight: bold;
    font-family: Georgia, serif;
  }

  /* ── SUBTOPIC SECTIONS (children of a parent topic) ─────────── */
  .subtopic-section {
    margin-top: 18pt;
    padding-top: 14pt;
    border-top: 1px solid #E8E5E0;
  }

  .subtopic-section:first-child { margin-top: 10pt; padding-top: 0; border-top: 0; }

  .subtopic-title {
    font-size: 13pt;
    color: #2D6A4F;
    margin: 0 0 5pt;
    page-break-after: avoid;
    border-left: 3px solid #C9A227;
    padding-left: 8pt;
    border-bottom: 0;
  }

  .subtopic-body > p:first-child::first-letter {
    float: none;
    font-size: inherit;
    line-height: inherit;
    margin: 0;
    color: inherit;
    font-weight: inherit;
  }

  /* ── BLOCKQUOTES ─────────────────────────────────────────── */
  blockquote {
    border-left: 4px solid #C9A227;
    margin: 14pt 0;
    padding: 10pt 16pt 10pt 22pt;
    background: linear-gradient(to right, #f9f7f0, #fefdf9);
    page-break-inside: avoid;
    position: relative;
  }

  blockquote::before {
    content: '\\201C';
    position: absolute;
    top: -4pt;
    left: 6pt;
    font-size: 34pt;
    color: #C9A227;
    opacity: 0.35;
    line-height: 1;
    font-family: Georgia, serif;
  }

  blockquote p {
    margin: 0;
    font-style: italic;
    color: #333;
    padding-left: 4pt;
  }

  /* ── CALLOUTS ────────────────────────────────────────────── */
  .callout {
    padding: 10pt 14pt 10pt 12pt;
    margin: 14pt 0;
    border-left: 4px solid;
    page-break-inside: avoid;
    border-radius: 0 3px 3px 0;
  }

  .callout-note     { background: #EBF3EE; border-color: #1B4D3E; }
  .callout-tip      { background: #FFF8E7; border-color: #C9A227; }
  .callout-important { background: #E8EEF8; border-color: #2D6A4F; }
  .callout-warning  { background: #FDEEEE; border-color: #C0392B; }

  .callout-header {
    display: flex;
    align-items: center;
    gap: 6pt;
    margin-bottom: 4pt;
  }

  .callout-badge {
    display: inline-block;
    font-size: 8pt;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    padding: 1pt 5pt;
    border-radius: 3px;
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  }

  .callout-note .callout-badge     { background: #1B4D3E; color: #fff; }
  .callout-tip .callout-badge      { background: #C9A227; color: #fff; }
  .callout-important .callout-badge { background: #2D6A4F; color: #fff; }
  .callout-warning .callout-badge  { background: #C0392B; color: #fff; }

  .callout-body { font-size: 10.5pt; color: #333; line-height: 1.55; }

  /* ── FOOTNOTE / DIVIDER ──────────────────────────────────── */
  .footnote {
    font-size: 8.5pt;
    color: #777;
    border-top: 1px solid #E0DDD5;
    padding-top: 7pt;
    margin-top: 16pt;
    font-style: italic;
  }

  .divider { border: 0; border-top: 1px solid rgba(201,162,39,0.4); margin: 18pt 0; }

  /* ── FIGURES ─────────────────────────────────────────────── */
  figure {
    margin: 14pt 0;
    text-align: center;
    page-break-inside: avoid;
    background: #FAFAF8;
    padding: 10pt;
    border: 1px solid #E8E5E0;
  }

  figcaption {
    font-size: 8.5pt;
    color: #777;
    margin-top: 7pt;
    font-style: italic;
    text-align: center;
    border-top: 1px solid #EEE;
    padding-top: 5pt;
  }

  /* ── TABLES ──────────────────────────────────────────────── */
  table { width: 100%; border-collapse: collapse; margin: 12pt 0; font-size: 10pt; page-break-inside: avoid; }

  thead { background: #1B4D3E; }

  th {
    background: #1B4D3E;
    color: #fff;
    padding: 8pt 10pt;
    text-align: left;
    font-weight: 600;
    letter-spacing: 0.3px;
    font-size: 9.5pt;
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  }

  td { border: 1px solid #E0DDD5; padding: 6pt 10pt; vertical-align: top; line-height: 1.5; }

  tr:nth-child(even) td { background: #F7F5F0; }

  /* ── CITATIONS / BIBLIOGRAPHY ────────────────────────────── */
  .citation-ref {
    font-size: 10pt;
    color: #555;
    padding: 7pt 14pt;
    border-left: 3px solid #ddd;
    text-align: left;
    background: #FAFAF8;
    margin: 10pt 0;
    page-break-inside: avoid;
    font-style: italic;
  }

  .bib-entry {
    font-size: 9.5pt;
    text-indent: -20pt;
    padding-left: 20pt;
    margin: 7pt 0;
    text-align: left;
    line-height: 1.55;
    color: #333;
  }

  /* ── IMAGE–TEXT LAYOUTS ──────────────────────────────────── */
  .imgtext-table { width: 100%; border-collapse: collapse; margin: 14pt 0; table-layout: fixed; page-break-inside: avoid; }
  .imgtext-table td { vertical-align: top; border: 0; padding: 0; }
  .imgtext-table td.img-cell { padding-right: 12px; }
  .imgtext-table td.text-cell { padding-left: 4px; }
  .imgtext-table.layout-right td.img-cell { padding-right: 0; padding-left: 12px; }
  .imgtext-table.layout-right td.text-cell { padding-left: 0; padding-right: 4px; }

  /* Magazine layouts — large half-page image */
  .magazine-table { width: 100%; border-collapse: collapse; margin: 16pt 0; table-layout: fixed; page-break-inside: avoid; }
  .magazine-table td { vertical-align: top; border: 0; padding: 0; }
  .magazine-table td.mag-img-cell { padding-right: 14px; }
  .magazine-table td.mag-text-cell { padding-left: 4px; }
  .magazine-table.layout-magazine-right td.mag-img-cell { padding-right: 0; padding-left: 14px; }
  .magazine-table.layout-magazine-right td.mag-text-cell { padding-left: 0; padding-right: 4px; }

  /* Inset layouts — tiny image inside text */
  .inset-block { margin: 12pt 0; page-break-inside: avoid; }
  .inset-block::after { content: ""; display: block; clear: both; }
  .inset-block .inset-img-left { float: left; margin: 0 10px 6px 0; max-width: 22%; }
  .inset-block .inset-img-right { float: right; margin: 0 0 6px 10px; max-width: 22%; }
  .inset-block .inset-text { text-align: justify; }

  /* Banner layout — full width image */
  .banner-block { margin: 16pt 0; page-break-inside: avoid; text-align: center; }
  .banner-block .banner-img { width: 100%; max-height: 220px; object-fit: cover; }
  .banner-block .banner-text { margin-top: 10pt; text-align: justify; }

  .stacked-block { margin: 14pt 0; page-break-inside: avoid; }
  .stacked-block .stacked-img { margin: 8pt 0; text-align: center; }
  .stacked-block .stacked-text { text-align: justify; }
  .stacked-block.layout-center .stacked-text { text-align: center; }

  .wrap-block { margin: 14pt 0; page-break-inside: avoid; }
  .wrap-block::after { content: ""; display: block; clear: both; }
  .wrap-block .side-text { text-align: justify; }

  .side-caption { font-size: 8.5pt; color: #777; font-style: italic; margin-top: 5pt; }

  .collage-table { width: 100%; border-collapse: collapse; }
  .collage-table td { padding: 4px; border: 0; text-align: center; vertical-align: middle; }

  /* ── MISC ────────────────────────────────────────────────── */
  .lof-list { list-style: none; padding: 0; margin: 0; }
  .lof-list li { margin: 5pt 0; font-size: 10pt; }

  .abbr-table td { padding: 5pt 10pt; border: 1px solid #E8E5E0; font-size: 10pt; }
  .abbr-table tr:nth-child(even) td { background: #F7F5F0; }

  /* ── PRINT OVERRIDES ─────────────────────────────────────── */
  @media print {
    .chapter, .front-section, .back-section { page-break-inside: auto; }
    table, blockquote, .callout, figure, .imgtext-table, .stacked-block, .wrap-block { page-break-inside: avoid; }
    .screen-only { display: none !important; }
  }
`;
}

/* ── PREVIEW SCREEN STYLES ─────────────────────────────────────────────── */

function buildPreviewStyles(): string {
  return `
  *, *::before, *::after { box-sizing: border-box; }

  html, body {
    margin: 0; padding: 0;
    height: 100%;
    overflow: hidden;
    font-family: Georgia, 'Times New Roman', Times, serif;
    color: #1a1a1a;
    font-size: 11pt;
    background: linear-gradient(160deg, #1e2b24 0%, #18181c 55%, #1c1820 100%);
  }

  img { max-width: 100%; height: auto; border: 0; }

  /* ── BOOK STAGE ────────────────────────────────────────── */
  #book-stage {
    position: fixed;
    inset: 0;
    overflow: hidden;
    background: linear-gradient(160deg, #1e2b24 0%, #18181c 55%, #1c1820 100%);
  }

  /* Book spine on the left */
  #book-stage::before {
    content: '';
    position: fixed;
    left: 0; top: 0; bottom: 60px;
    width: 14px;
    background: linear-gradient(to right, #0a1a11, #1B4D3E 45%, #2D6A4F 70%, #1B4D3E);
    z-index: 50;
    box-shadow: 3px 0 10px rgba(0,0,0,0.4), inset 2px 0 4px rgba(255,255,255,0.08);
  }

  /* ── BOOK PAGES ────────────────────────────────────────── */
  .book-page {
    position: absolute;
    top: 0; left: 14px; right: 0; bottom: 60px;
    background: #FDFCF7;
    padding: 44px 52px 68px 46px;
    overflow-y: auto;
    opacity: 0;
    transform: translateX(100%) perspective(900px) rotateY(6deg);
    z-index: 1;
    box-shadow:
      -6px 0 20px rgba(0,0,0,0.35),
      inset 6px 0 12px rgba(0,0,0,0.06);
  }

  .book-page.active {
    opacity: 1;
    transform: translateX(0) perspective(900px) rotateY(0deg);
    z-index: 10;
    transition: transform 0.48s cubic-bezier(0.4,0,0.2,1), opacity 0.36s ease;
  }

  /* Page fold corner */
  .book-page::after {
    content: '';
    position: sticky;
    bottom: -68px;
    float: right;
    margin-right: -52px;
    display: block;
    width: 32px; height: 32px;
    background: linear-gradient(225deg, #d5d2cb 50%, transparent 50%);
    pointer-events: none;
    z-index: 5;
  }

  /* Binding gutter shadow */
  .book-page::before {
    content: '';
    position: absolute;
    top: 0; left: 0; bottom: 0;
    width: 20px;
    background: linear-gradient(to right, rgba(0,0,0,0.07), transparent);
    pointer-events: none;
    z-index: 5;
  }

  /* ── PAGE FLIP ANIMATIONS ──────────────────────────────── */
  @keyframes flipInFromRight {
    from { opacity: 0; transform: translateX(55%) perspective(900px) rotateY(12deg); }
    to   { opacity: 1; transform: translateX(0)   perspective(900px) rotateY(0deg); }
  }
  @keyframes flipOutToLeft {
    from { opacity: 1; transform: translateX(0)    perspective(900px) rotateY(0deg); }
    to   { opacity: 0; transform: translateX(-45%) perspective(900px) rotateY(-12deg); }
  }
  @keyframes flipInFromLeft {
    from { opacity: 0; transform: translateX(-55%) perspective(900px) rotateY(-12deg); }
    to   { opacity: 1; transform: translateX(0)    perspective(900px) rotateY(0deg); }
  }
  @keyframes flipOutToRight {
    from { opacity: 1; transform: translateX(0)   perspective(900px) rotateY(0deg); }
    to   { opacity: 0; transform: translateX(45%) perspective(900px) rotateY(12deg); }
  }

  .flip-in-right  { animation: flipInFromRight 0.48s cubic-bezier(0.4,0,0.2,1) forwards; z-index: 15 !important; }
  .flip-out-left  { animation: flipOutToLeft   0.48s cubic-bezier(0.4,0,0.2,1) forwards; z-index: 8  !important; }
  .flip-in-left   { animation: flipInFromLeft  0.48s cubic-bezier(0.4,0,0.2,1) forwards; z-index: 15 !important; }
  .flip-out-right { animation: flipOutToRight  0.48s cubic-bezier(0.4,0,0.2,1) forwards; z-index: 8  !important; }

  /* ── COVER PAGE ────────────────────────────────────────── */
  .book-page.cover-book-page {
    background: linear-gradient(155deg, #1B4D3E 0%, #0d2219 100%);
    box-shadow: -6px 0 20px rgba(0,0,0,0.5);
    left: 14px;
  }
  .cover-book-page .cover-title { color: #F0E8CC; text-shadow: 0 2px 12px rgba(0,0,0,0.4); }
  .cover-book-page .cover-label { color: #C9A227; }
  .cover-book-page .cover-subtitle { color: rgba(255,255,255,0.7); font-style: italic; }
  .cover-book-page .cover-edition { color: rgba(255,255,255,0.5); }
  .cover-book-page .cover-author { color: #E8D5A0; }
  .cover-book-page .cover-author-label { color: rgba(255,255,255,0.4); }
  .cover-book-page .cover-publisher { color: rgba(255,255,255,0.5); }
  .cover-book-page .cover-tos { color: rgba(255,255,255,0.3); }
  .cover-book-page .title-page-rule { border: 0; height: 1px; background: linear-gradient(to right, transparent, rgba(201,162,39,0.5), transparent); }
  .cover-book-page p, .cover-book-page h2 { color: rgba(255,255,255,0.8); }
  .cover-book-page h2 { border-bottom-color: rgba(201,162,39,0.3); }

  /* ── PAGE NUMBER ───────────────────────────────────────── */
  .book-page-num {
    position: absolute;
    bottom: 14px; left: 0; right: 0;
    text-align: center;
    font-size: 9pt;
    color: #aaa;
    font-style: italic;
    font-family: Georgia, serif;
    pointer-events: none;
    z-index: 3;
  }
  .cover-book-page .book-page-num { color: rgba(255,255,255,0.25); }

  /* ── NAVIGATION BAR ────────────────────────────────────── */
  #book-nav {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(14,18,14,0.94);
    border-top: 1px solid rgba(201,162,39,0.18);
    z-index: 100;
    padding: 0 6px;
  }

  .nav-btn {
    width: 52px; height: 52px;
    background: none;
    border: none;
    color: rgba(255,255,255,0.85);
    font-size: 36px;
    line-height: 1;
    display: flex; align-items: center; justify-content: center;
    border-radius: 10px;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: background 0.15s, opacity 0.2s;
    font-family: Georgia, serif;
  }
  .nav-btn:active { background: rgba(255,255,255,0.1); }

  #page-counter {
    flex: 1;
    text-align: center;
    color: rgba(255,255,255,0.55);
    font-size: 11px;
    font-family: Georgia, serif;
    font-style: italic;
    pointer-events: none;
  }
  #page-chapter-title {
    position: absolute;
    top: 0; left: 60px; right: 60px;
    height: 24px;
    line-height: 24px;
    text-align: center;
    font-size: 9px;
    color: rgba(255,255,255,0.35);
    font-family: Georgia, serif;
    font-style: italic;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    pointer-events: none;
  }

  /* ── READING PROGRESS BAR ──────────────────────────────── */
  #reading-progress {
    position: fixed;
    bottom: 60px; left: 14px; right: 0;
    height: 2px;
    background: linear-gradient(to right, #1B4D3E, #C9A227);
    z-index: 99;
    transform-origin: left;
    transition: transform 0.2s ease;
    box-shadow: 0 0 6px rgba(201,162,39,0.4);
  }

  /* ── TYPOGRAPHY (same as PDF base) ────────────────────── */
  h2 { color: #1B4D3E; font-size: 17pt; margin: 0 0 14pt; padding: 0 0 7pt; border-bottom: 2.5px solid #C9A227; line-height: 1.2; letter-spacing: -0.3px; }
  h3 { color: #2D6A4F; font-size: 13pt; margin: 16pt 0 7pt; border-left: 3px solid #C9A227; padding-left: 8pt; }
  h4 { color: #2D6A4F; font-size: 11.5pt; margin: 12pt 0 5pt; font-style: italic; }
  h5 { color: #555; font-size: 9.5pt; margin: 10pt 0 4pt; text-transform: uppercase; letter-spacing: 0.5px; }
  p { margin: 0 0 9pt; text-align: justify; line-height: 1.68; }

  blockquote {
    border-left: 4px solid #C9A227; margin: 14pt 0;
    padding: 10pt 16pt 10pt 22pt;
    background: linear-gradient(to right, #f9f7f0, #fefdf9);
    position: relative;
  }
  blockquote::before {
    content: '\\201C'; position: absolute; top: -4pt; left: 6pt;
    font-size: 34pt; color: #C9A227; opacity: 0.35; line-height: 1; font-family: Georgia, serif;
  }
  blockquote p { margin: 0; font-style: italic; color: #333; padding-left: 4pt; }

  .callout { padding: 10pt 14pt 10pt 12pt; margin: 14pt 0; border-left: 4px solid; border-radius: 0 3px 3px 0; }
  .callout-note     { background: #EBF3EE; border-color: #1B4D3E; }
  .callout-tip      { background: #FFF8E7; border-color: #C9A227; }
  .callout-important { background: #E8EEF8; border-color: #2D6A4F; }
  .callout-warning  { background: #FDEEEE; border-color: #C0392B; }
  .callout-header { display: flex; align-items: center; gap: 6pt; margin-bottom: 4pt; }
  .callout-badge { display: inline-block; font-size: 8pt; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; padding: 1pt 5pt; border-radius: 3px; }
  .callout-note .callout-badge     { background: #1B4D3E; color: #fff; }
  .callout-tip .callout-badge      { background: #C9A227; color: #fff; }
  .callout-important .callout-badge { background: #2D6A4F; color: #fff; }
  .callout-warning .callout-badge  { background: #C0392B; color: #fff; }
  .callout-body { font-size: 10.5pt; color: #333; line-height: 1.55; }

  .footnote { font-size: 8.5pt; color: #777; border-top: 1px solid #E0DDD5; padding-top: 7pt; margin-top: 16pt; font-style: italic; }
  .divider { border: 0; border-top: 1px solid rgba(201,162,39,0.4); margin: 18pt 0; }

  figure { margin: 14pt 0; text-align: center; background: #FAFAF8; padding: 10pt; border: 1px solid #E8E5E0; }
  figcaption { font-size: 8.5pt; color: #777; margin-top: 7pt; font-style: italic; text-align: center; border-top: 1px solid #EEE; padding-top: 5pt; }

  table { width: 100%; border-collapse: collapse; margin: 12pt 0; font-size: 10pt; }
  thead { background: #1B4D3E; }
  th { background: #1B4D3E; color: #fff; padding: 8pt 10pt; text-align: left; font-weight: 600; font-size: 9.5pt; }
  td { border: 1px solid #E0DDD5; padding: 6pt 10pt; vertical-align: top; line-height: 1.5; }
  tr:nth-child(even) td { background: #F7F5F0; }

  .citation-ref { font-size: 10pt; color: #555; padding: 7pt 14pt; border-left: 3px solid #ddd; background: #FAFAF8; margin: 10pt 0; font-style: italic; }
  .bib-entry { font-size: 9.5pt; text-indent: -20pt; padding-left: 20pt; margin: 7pt 0; line-height: 1.55; color: #333; }

  .toc-list { list-style: none; padding: 0; margin: 0; }
  .toc-list li { display: flex; align-items: baseline; padding: 4pt 0; border-bottom: 1px dotted #ddd; font-size: 10.5pt; gap: 4px; }
  .toc-entry-label { flex: 0 0 auto; max-width: 72%; }
  .toc-entry-dots { flex: 1 1 auto; border-bottom: 1px dotted #bbb; min-width: 12px; margin: 0 6px; position: relative; top: -3px; }
  .toc-page { flex: 0 0 auto; font-size: 9pt; color: #888; }
  .toc-page .toc-page-num { display: none; }
  .toc-level-2 { padding-left: 20px; font-size: 10pt; }
  .toc-level-3 { padding-left: 36px; font-size: 9.5pt; color: #666; }
  .toc-list a { color: #1B4D3E; text-decoration: none; }

  .part-divider { text-align: center; padding: 56pt 32pt 48pt; background: linear-gradient(155deg, #1B4D3E 0%, #0d2419 100%); }
  .part-label { display: block; font-size: 8.5pt; text-transform: uppercase; letter-spacing: 4px; color: #C9A227; margin-bottom: 10pt; }
  .part-ornament { display: block; font-size: 16pt; color: rgba(201,162,39,0.5); margin: 6pt 0; letter-spacing: 6px; }
  .part-title { font-size: 22pt; color: #FEFDF7; border: 0; margin: 8pt 0 10pt; }
  .part-rule { width: 56%; height: 1px; background: linear-gradient(to right, transparent, rgba(201,162,39,0.5), transparent); margin: 10pt auto; border: 0; }
  .part-weight { font-size: 9.5pt; color: rgba(255,255,255,0.55); letter-spacing: 1px; }
  .part-desc { font-size: 10pt; color: rgba(255,255,255,0.45); margin: 10pt auto 0; max-width: 80%; text-align: center; font-style: italic; }

  .chapter { position: relative; }
  .chapter-num-decoration { font-size: 88pt; font-weight: 900; color: rgba(27,77,62,0.055); line-height: 1; text-align: right; margin-bottom: -56pt; position: relative; z-index: 0; font-family: Georgia, serif; letter-spacing: -4px; }
  .chapter-title { font-size: 17pt; position: relative; z-index: 1; }
  .topic-label { font-size: 8.5pt; color: #999; font-style: italic; margin-bottom: 14pt; letter-spacing: 0.3px; }
  .chapter-body > p:first-child::first-letter { float: left; font-size: 3.5em; line-height: 0.82; margin: 0.05em 0.08em 0 0; color: #1B4D3E; font-weight: bold; font-family: Georgia, serif; }

  .subtopic-section { margin-top: 18pt; padding-top: 14pt; border-top: 1px solid rgba(0,0,0,0.06); }
  .subtopic-section:first-child { margin-top: 8pt; padding-top: 0; border-top: 0; }
  .subtopic-title { font-size: 13pt; color: #2D6A4F; margin: 0 0 5pt; border-left: 3px solid #C9A227; padding-left: 8pt; }
  .subtopic-body > p:first-child::first-letter { float: none; font-size: inherit; line-height: inherit; margin: 0; color: inherit; font-weight: inherit; }

  .title-page { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 60px 40px 50px; min-height: 300px; }
  .title-page-rule { width: 72%; height: 2px; border: 0; margin: 16pt auto; background: linear-gradient(to right, transparent, #C9A227, transparent); }
  .cover-label { font-size: 8.5pt; letter-spacing: 3.5px; text-transform: uppercase; color: #C9A227; margin-bottom: 18pt; }
  .cover-title { font-size: 26pt; color: #1B4D3E; margin: 0 0 10pt; line-height: 1.15; font-weight: bold; border: 0; }
  .cover-subtitle { font-size: 13pt; color: #555; margin-bottom: 8pt; font-style: italic; }
  .cover-edition { font-size: 10pt; color: #888; margin-bottom: 0; letter-spacing: 1px; }
  .cover-author-section { margin-top: 28pt; margin-bottom: 6pt; }
  .cover-author-label { font-size: 7.5pt; letter-spacing: 2.5px; text-transform: uppercase; color: #aaa; margin-bottom: 5pt; }
  .cover-author { font-size: 13pt; font-weight: 600; color: #1B4D3E; margin-bottom: 6pt; }
  .cover-publisher { font-size: 10pt; color: #777; }
  .cover-tos { font-size: 8pt; color: #bbb; margin-top: 16pt; font-style: italic; }

  .copyright-page { padding: 40px 0 40px; }
  .copyright-meta { font-size: 10pt; color: #777; margin-top: 8pt; line-height: 1.6; }

  .lof-list { list-style: none; padding: 0; margin: 0; }
  .lof-list li { margin: 5pt 0; font-size: 10pt; }

  .abbr-table td { padding: 5pt 10pt; border: 1px solid #E8E5E0; font-size: 10pt; }
  .abbr-table tr:nth-child(even) td { background: #F7F5F0; }

  .imgtext-table { width: 100%; border-collapse: collapse; margin: 14pt 0; table-layout: fixed; }
  .imgtext-table td { vertical-align: top; border: 0; padding: 0; }
  .imgtext-table td.img-cell { padding-right: 12px; }
  .imgtext-table td.text-cell { padding-left: 4px; }
  .imgtext-table.layout-right td.img-cell { padding-right: 0; padding-left: 12px; }
  .imgtext-table.layout-right td.text-cell { padding-left: 0; padding-right: 4px; }

  .magazine-table { width: 100%; border-collapse: collapse; margin: 16pt 0; table-layout: fixed; }
  .magazine-table td { vertical-align: top; border: 0; padding: 0; }
  .magazine-table td.mag-img-cell { padding-right: 14px; }
  .magazine-table td.mag-text-cell { padding-left: 4px; }
  .magazine-table.layout-magazine-right td.mag-img-cell { padding-right: 0; padding-left: 14px; }
  .magazine-table.layout-magazine-right td.mag-text-cell { padding-left: 0; padding-right: 4px; }

  .inset-block { margin: 12pt 0; }
  .inset-block::after { content: ""; display: block; clear: both; }
  .inset-block .inset-img-left { float: left; margin: 0 10px 6px 0; max-width: 22%; }
  .inset-block .inset-img-right { float: right; margin: 0 0 6px 10px; max-width: 22%; }

  .banner-block { margin: 16pt 0; text-align: center; }
  .banner-block .banner-text { margin-top: 10pt; text-align: justify; }

  .stacked-block { margin: 14pt 0; }
  .stacked-block .stacked-img { margin: 8pt 0; text-align: center; }
  .stacked-block .stacked-text { text-align: justify; }
  .stacked-block.layout-center .stacked-text { text-align: center; }

  .wrap-block { margin: 14pt 0; }
  .wrap-block::after { content: ""; display: block; clear: both; }
  .wrap-block .side-text { text-align: justify; }
  .side-caption { font-size: 8.5pt; color: #777; font-style: italic; margin-top: 5pt; }

  .collage-table { width: 100%; border-collapse: collapse; }
  .collage-table td { padding: 4px; border: 0; text-align: center; vertical-align: middle; }

  .screen-page-hint { display: none; }

  @media (max-width: 480px) {
    .book-page { padding: 32px 24px 56px 22px; }
  }
`;
}

/* ── JAVASCRIPT FOR BOOK PAGE FLIP ─────────────────────────────────────── */

function buildPreviewScript(): string {
  return `
(function () {
  'use strict';
  var pages = [];
  var currentPage = 0;
  var isAnimating = false;

  function init() {
    buildPages();
    createStage();
    createNav();
    setupSwipe();
    createProgressBar();
    goTo(0, 'none');
  }

  function buildPages() {
    var sels = ['.cover-page', '.front-section', '.toc', '.part-divider', '.chapter', '.back-section', '.bibliography'];
    var sections = document.querySelectorAll(sels.join(','));
    var stage = document.createElement('div');
    stage.id = 'book-stage';
    document.body.insertBefore(stage, document.body.firstChild);
    var coverPages = document.querySelector('.cover-pages');
    var main = document.querySelector('.book-content');
    if (coverPages) stage.appendChild(coverPages);
    if (main) stage.appendChild(main);
    sections.forEach(function (sec, i) {
      var pg = document.createElement('div');
      pg.className = 'book-page';
      if (sec.classList.contains('cover-page')) pg.classList.add('cover-book-page');
      sec.parentNode.insertBefore(pg, sec);
      pg.appendChild(sec);
      var num = document.createElement('div');
      num.className = 'book-page-num'; num.textContent = String(i + 1);
      pg.appendChild(num);
      pages.push(pg);
    });
  }

  function createStage() {
    pages.forEach(function (pg) { pg.style.visibility = 'hidden'; });
  }

  function goTo(index, dir) {
    if (isAnimating && dir !== 'none') return;
    if (index < 0 || index >= pages.length) return;
    var prev = currentPage;
    currentPage = index;

    if (dir === 'none') {
      pages.forEach(function (p, i) {
        p.style.visibility = i === index ? 'visible' : 'hidden';
        p.classList.remove('active', 'flip-in-right', 'flip-out-left', 'flip-in-left', 'flip-out-right');
        if (i === index) p.classList.add('active');
      });
      updateNav();
      notify();
      return;
    }

    isAnimating = true;
    var outClass = dir === 'next' ? 'flip-out-left' : 'flip-out-right';
    var inClass  = dir === 'next' ? 'flip-in-right' : 'flip-in-left';

    pages[prev].style.visibility = 'visible';
    pages[index].style.visibility = 'visible';
    pages[prev].classList.remove('active');
    pages[prev].classList.add(outClass);
    pages[index].classList.remove('flip-in-right','flip-out-left','flip-in-left','flip-out-right','active');
    pages[index].classList.add(inClass);

    setTimeout(function () {
      pages.forEach(function (p, i) {
        p.classList.remove('active','flip-in-right','flip-out-left','flip-in-left','flip-out-right');
        p.style.visibility = i === currentPage ? 'visible' : 'hidden';
        if (i === currentPage) p.classList.add('active');
      });
      isAnimating = false;
      updateNav();
      notify();
    }, 500);
  }

  function notify() {
    var heading = pages[currentPage] ? pages[currentPage].querySelector('h1,h2') : null;
    var titleEl = document.getElementById('page-chapter-title');
    if (titleEl && heading) titleEl.textContent = heading.textContent || '';
    updateProgress();
    if (window.ReactNativeWebView) {
      try {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'pageChange',
          page: currentPage + 1,
          total: pages.length,
          title: heading ? (heading.textContent || '') : ''
        }));
      } catch(e) {}
    }
  }

  function updateNav() {
    var pi = document.getElementById('page-counter');
    var pb = document.getElementById('nav-prev');
    var nb = document.getElementById('nav-next');
    if (pi) pi.textContent = (currentPage + 1) + ' / ' + pages.length;
    if (pb) pb.style.opacity = currentPage === 0 ? '0.25' : '1';
    if (nb) nb.style.opacity = currentPage === pages.length - 1 ? '0.25' : '1';
  }

  function updateProgress() {
    var bar = document.getElementById('reading-progress');
    if (!bar || !pages.length) return;
    var pct = pages.length > 1 ? (currentPage / (pages.length - 1)) * 100 : 100;
    bar.style.transform = 'scaleX(' + (pct / 100) + ')';
  }

  function createNav() {
    var nav = document.createElement('div'); nav.id = 'book-nav';
    var pb = document.createElement('button'); pb.id = 'nav-prev'; pb.className = 'nav-btn';
    pb.innerHTML = '&#8249;';
    pb.addEventListener('click', function () { if (currentPage > 0) goTo(currentPage - 1, 'prev'); });
    var pc = document.createElement('div'); pc.id = 'page-counter';
    var ct = document.createElement('div'); ct.id = 'page-chapter-title';
    var nb = document.createElement('button'); nb.id = 'nav-next'; nb.className = 'nav-btn';
    nb.innerHTML = '&#8250;';
    nb.addEventListener('click', function () { if (currentPage < pages.length - 1) goTo(currentPage + 1, 'next'); });
    nav.appendChild(pb); nav.appendChild(ct); nav.appendChild(pc); nav.appendChild(nb);
    document.body.appendChild(nav);
  }

  function createProgressBar() {
    var bar = document.createElement('div'); bar.id = 'reading-progress';
    bar.style.transform = 'scaleX(0)';
    document.body.appendChild(bar);
  }

  function setupSwipe() {
    var sx = 0, sy = 0;
    document.addEventListener('touchstart', function(e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    document.addEventListener('touchend', function(e) {
      var dx = sx - e.changedTouches[0].clientX;
      var dy = Math.abs(sy - e.changedTouches[0].clientY);
      if (Math.abs(dx) > 48 && dy < 100) {
        if (dx > 0 && currentPage < pages.length - 1) goTo(currentPage + 1, 'next');
        else if (dx < 0 && currentPage > 0) goTo(currentPage - 1, 'prev');
      }
    }, { passive: true });
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); }
  else { init(); }
}());
`;
}

/* ── SHARED RENDERING HELPERS ──────────────────────────────────────────── */

function renderWrapImageBlock(
  block: ContentBlock,
  layout: 'wrap-left' | 'wrap-right'
): string {
  const size = getImageSize(block);
  const layoutClass = getLayoutClass(layout);
  const floatStyle =
    layout === 'wrap-left'
      ? `float:left;margin:0 14px 10px 0;max-width:${getPdfImageCellWidth(size)};`
      : `float:right;margin:0 0 10px 14px;max-width:${getPdfImageCellWidth(size)};`;
  const floatedImg = block.imageUri
    ? `<img src="${block.imageUri}" alt="${escapeHtml(block.caption ?? 'Figure')}" style="display:block;${floatStyle}max-height:${getPdfImageMaxHeight(size)};height:auto;" />`
    : '';
  const caption = block.caption
    ? `<p class="side-caption">${escapeHtml(block.caption)}</p>`
    : '';
  const text = `<div class="side-text"><p>${escapeHtml(block.text ?? '').replace(/\n/g, '<br/>')}</p>${caption}</div>`;
  return `<div class="wrap-block ${layoutClass}">${floatedImg}${text}</div>`;
}

function renderImageBlock(block: ContentBlock): string {
  if (!block.imageUri) return '';
  const wrap = block.imageWrap ?? 'none';
  if ((wrap === 'wrap-left' || wrap === 'wrap-right') && block.text?.trim()) {
    return renderWrapImageBlock(block, wrap);
  }
  const size = getImageSize(block);
  const cap = block.caption ? `<figcaption>${escapeHtml(block.caption)}</figcaption>` : '';
  return `<figure class="figure-item">${renderPdfImage(block.imageUri, size, block.caption ?? 'Figure')}${cap}</figure>`;
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

  // Banner layout
  if (layout === 'banner') {
    const bannerImg = block.imageUri
      ? `<img src="${block.imageUri}" alt="${escapeHtml(block.caption ?? 'Figure')}" class="banner-img" style="display:block;width:100%;max-height:${getPdfImageMaxHeight(size)};object-fit:cover;" />`
      : '';
    return `<div class="banner-block"><div>${bannerImg}</div><div class="banner-text">${text}</div></div>`;
  }

  // Inset layouts
  if (isInsetLayout(layout)) {
    const floatClass = layout === 'inset-left' ? 'inset-img-left' : 'inset-img-right';
    const insetImg = block.imageUri
      ? `<img src="${block.imageUri}" alt="${escapeHtml(block.caption ?? 'Figure')}" class="${floatClass}" style="display:block;max-height:80px;height:auto;border-radius:4px;" />`
      : '';
    return `<div class="inset-block ${layoutClass}">${insetImg}<div class="inset-text">${text}</div></div>`;
  }

  // Magazine layouts — large 48% image
  if (isMagazineLayout(layout)) {
    const magWidth = getPdfMagazineWidth(size);
    const magImg = block.imageUri
      ? `<img src="${block.imageUri}" alt="${escapeHtml(block.caption ?? 'Figure')}" style="display:block;width:100%;max-height:${getPdfImageMaxHeight(size)};height:auto;" />`
      : '';
    const imgCell = `<td class="mag-img-cell" width="${magWidth}" valign="top">${magImg}${caption}</td>`;
    const textCell = `<td class="mag-text-cell" valign="top">${text}</td>`;
    return `<table class="magazine-table ${layoutClass}" cellpadding="0" cellspacing="0" border="0">
      <tr>${layout === 'magazine-right' ? textCell + imgCell : imgCell + textCell}</tr>
    </table>`;
  }

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

function renderBlock(block: ContentBlock, citations: Map<string, Citation>, citationStyle?: CitationStyle): string {
  switch (block.type) {
    case 'heading': {
      const level = block.level ?? 2;
      // Inside chapter body: H1→h3, H2→h4, H3→h5 (h2 is reserved for chapter titles)
      const tag = `h${Math.min(level + 2, 5)}`;
      return `<${tag}>${escapeHtml(block.text ?? '')}</${tag}>`;
    }
    case 'paragraph':
      return `<p>${richTextToHtml(block.text ?? '').replace(/\n/g, '<br/>')}</p>`;
    case 'quote':
      return `<blockquote><p>${richTextToHtml(block.text ?? '')}</p></blockquote>`;
    case 'callout': {
      const variant = block.calloutVariant ?? 'note';
      const label = variant.charAt(0).toUpperCase() + variant.slice(1);
      const body = richTextToHtml(block.text ?? '').replace(/\n/g, '<br/>');
      return `<div class="callout callout-${variant}"><div class="callout-header"><span class="callout-badge">${label}</span></div><div class="callout-body">${body}</div></div>`;
    }
    case 'footnote':
      return `<p class="footnote"><sup>*</sup> ${escapeHtml(block.text ?? '')}</p>`;
    case 'divider':
      return '<hr class="divider"/>';
    case 'image':
      return renderImageBlock(block);
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
      return `<p class="citation-ref"><em>${escapeHtml(formatCitation(citation, citationStyle))}</em></p>`;
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
  const groups = buildMaterialGroups(book, materials);

  for (const group of groups) {
    const firstMaterial = group.kind === 'single' ? group.material : group.materials[0];

    if (s.groupBySubject && firstMaterial.subjectId !== lastSubject) {
      const subject = findSubject(firstMaterial.subjectId);
      if (subject) {
        entries.push({ id: `part-${firstMaterial.subjectId}`, label: `Part: ${subject.title}`, level: 1 });
        lastSubject = firstMaterial.subjectId;
      }
    }

    chapter++;

    if (group.kind === 'single') {
      const prefix = s.numberChapters ? `Chapter ${chapter}: ` : '';
      entries.push({ id: `ch-${group.material.id}`, label: `${prefix}${group.material.title}`, level: 2 });
    } else {
      // Grouped subtopics: chapter entry for parent + sub-entries for each subtopic
      const prefix = s.numberChapters ? `Chapter ${chapter}: ` : '';
      entries.push({ id: `ch-group-${group.materials[0].id}`, label: `${prefix}${group.parentTopic.title}`, level: 2 });
      for (const material of group.materials) {
        const topicInfo = findTopic(material.subjectId, material.topicId);
        const code = topicInfo?.topic.code ?? '';
        entries.push({ id: `ch-${material.id}`, label: `${code} ${material.title}`.trim(), level: 3 });
      }
    }
  }

  if (bm.appendices.length > 0) entries.push({ id: 'appendices', label: 'Appendices', level: 1 });
  if (s.includeGlossary && bm.glossary.length > 0) entries.push({ id: 'glossary', label: 'Glossary', level: 1 });
  if (s.includeBibliography) entries.push({ id: 'references', label: 'References', level: 1 });
  if (s.includeAboutAuthor && bm.aboutAuthor?.trim()) entries.push({ id: 'about-author', label: 'About the Author', level: 1 });

  return entries;
}

function renderToc(entries: TocEntry[]): string {
  const items = entries
    .map((e) => {
      const label = escapeHtml(e.label);
      // target-counter is supported in WebKit-based PDF (expo-print)
      const pageRef = `<span class="toc-page-num" style="font-style:italic;color:#888;">target-counter(attr(href), page)</span>`;
      return `<li class="toc-level-${e.level}"><a href="#${e.id}" class="toc-link"><span class="toc-entry-label">${label}</span><span class="toc-entry-dots"></span><span class="toc-page">${pageRef}</span></a></li>`;
    })
    .join('');
  return `<div class="toc page-break" id="toc"><h2>Table of Contents</h2><ul class="toc-list">${items}</ul></div>`;
}

function renderTitlePage(book: BookProject): string {
  const s = book.settings;
  const editionParts = [s.edition, s.year].filter(Boolean).join(' \u00B7 ');
  const coverImg = s.coverImageUri
    ? `<div style="text-align:center;margin:16pt 0;"><img src="${s.coverImageUri}" alt="Book Cover" style="max-width:240px;max-height:180px;border-radius:8px;margin:0 auto;" /></div>`
    : '';
  return `
    <div class="title-page cover-page" id="title-page">
      <hr class="title-page-rule"/>
      <p class="cover-label">Librarians Licensure Examination Reviewer</p>
      ${coverImg}
      <h1 class="cover-title">${escapeHtml(book.title)}</h1>
      ${book.subtitle ? `<p class="cover-subtitle">${escapeHtml(book.subtitle)}</p>` : ''}
      ${editionParts ? `<p class="cover-edition">${escapeHtml(editionParts)}</p>` : ''}
      <hr class="title-page-rule"/>
      <div class="cover-author-section">
        <p class="cover-author-label">Compiled by</p>
        <p class="cover-author">${escapeHtml(book.author)}</p>
      </div>
      ${s.publisher ? `<p class="cover-publisher">${escapeHtml(s.publisher)}</p>` : ''}
      <p class="cover-tos">Based on PRC Board for Librarians Table of Specifications</p>
    </div>`;
}

function renderCopyrightPage(book: BookProject): string {
  const year = book.settings.year ?? new Date().getFullYear().toString();
  const notice =
    book.settings.copyrightNotice?.trim() ||
    `\u00A9 ${year} ${book.author}. All rights reserved.`;
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
        items.push(`<li>Figure ${fig}: ${escapeHtml(cap)} &mdash; ${escapeHtml(m.title)}</li>`);
      }
    }
  }
  if (items.length === 0) return '';
  return `<section class="front-section page-break" id="list-of-figures"><h2>List of Figures</h2><ul class="lof-list">${items.join('')}</ul></section>`;
}

/* ── MATERIAL GROUPING ─────────────────────────────────────────────────── */

type MaterialGroup =
  | { kind: 'single'; material: ReadingMaterial }
  | { kind: 'grouped'; parentTopic: TosTopic; subjectId: string; materials: ReadingMaterial[] };

function buildMaterialGroups(book: BookProject, materials: ReadingMaterial[]): MaterialGroup[] {
  const ordered = book.sections
    .sort((a, b) => a.order - b.order)
    .map((sec) => materials.find((m) => m.id === sec.materialId))
    .filter((m): m is ReadingMaterial => !!m);

  const groups: MaterialGroup[] = [];

  for (const material of ordered) {
    const topicInfo = findTopic(material.subjectId, material.topicId);

    if (topicInfo?.parent) {
      // This material belongs to a subtopic — try to append to an existing group
      const last = groups[groups.length - 1];
      if (
        last?.kind === 'grouped' &&
        last.parentTopic.id === topicInfo.parent.id &&
        last.subjectId === material.subjectId
      ) {
        last.materials.push(material);
      } else {
        groups.push({
          kind: 'grouped',
          parentTopic: topicInfo.parent,
          subjectId: material.subjectId,
          materials: [material],
        });
      }
    } else {
      groups.push({ kind: 'single', material });
    }
  }

  return groups;
}

function renderMaterial(
  material: ReadingMaterial,
  citations: Map<string, Citation>,
  chapterNum: number,
  settings: BookProject['settings']
): string {
  const topicInfo = findTopic(material.subjectId, material.topicId);
  const topicLabel = topicInfo ? `${topicInfo.topic.code} \u2014 ${topicInfo.topic.title}` : '';
  const chapterTitle = settings.numberChapters
    ? `Chapter ${chapterNum}: ${material.title}`
    : material.title;
  const blocksHtml = material.blocks.map((b) => renderBlock(b, citations, settings.citationStyle)).join('\n');
  const chapNumDecoration = settings.numberChapters
    ? `<div class="chapter-num-decoration">${chapterNum}</div>`
    : '';

  return `
    <section class="chapter page-break" id="ch-${material.id}">
      ${chapNumDecoration}
      <h2 class="chapter-title">${escapeHtml(chapterTitle)}</h2>
      ${topicLabel ? `<p class="topic-label">${escapeHtml(topicLabel)}</p>` : ''}
      <div class="chapter-body">${blocksHtml}</div>
    </section>`;
}

function renderGroupedChapter(
  parentTopic: TosTopic,
  materials: ReadingMaterial[],
  citations: Map<string, Citation>,
  chapterNum: number,
  settings: BookProject['settings']
): string {
  const chapterTitle = settings.numberChapters
    ? `Chapter ${chapterNum}: ${parentTopic.title}`
    : parentTopic.title;
  const chapNumDecoration = settings.numberChapters
    ? `<div class="chapter-num-decoration">${chapterNum}</div>`
    : '';

  const sections = materials.map((material) => {
    const topicInfo = findTopic(material.subjectId, material.topicId);
    const subtopicLabel = topicInfo
      ? `${topicInfo.topic.code} \u2014 ${topicInfo.topic.title}`
      : '';
    const blocksHtml = material.blocks.map((b) => renderBlock(b, citations, settings.citationStyle)).join('\n');

    return `
      <div class="subtopic-section" id="ch-${material.id}">
        <h3 class="subtopic-title">${escapeHtml(material.title)}</h3>
        ${subtopicLabel ? `<p class="topic-label">${escapeHtml(subtopicLabel)}</p>` : ''}
        <div class="subtopic-body">${blocksHtml}</div>
      </div>`;
  }).join('\n');

  return `
    <section class="chapter page-break" id="ch-group-${materials[0].id}">
      ${chapNumDecoration}
      <h2 class="chapter-title">${escapeHtml(chapterTitle)}</h2>
      ${sections}
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
  const groups = buildMaterialGroups(book, materials);

  for (const group of groups) {
    const firstMaterial = group.kind === 'single' ? group.material : group.materials[0];

    if (book.settings.groupBySubject && firstMaterial.subjectId !== lastSubject) {
      const subject = findSubject(firstMaterial.subjectId);
      if (subject) {
        const partNum = TOS_SUBJECTS.findIndex((s) => s.id === firstMaterial.subjectId) + 1;
        parts.push(`
          <div class="part-divider page-break" id="part-${firstMaterial.subjectId}">
            <span class="part-label">Part ${partNum}</span>
            <span class="part-ornament">\u2736 \u2736 \u2736</span>
            <h2 class="part-title">${escapeHtml(subject.title)}</h2>
            <hr class="part-rule"/>
            <p class="part-weight">Exam Weight: ${subject.weight}% &nbsp;\u00B7&nbsp; Day ${subject.examDay}</p>
            <p class="part-desc">${escapeHtml(subject.description)}</p>
          </div>`);
        lastSubject = firstMaterial.subjectId;
      }
    }

    chapter++;
    if (group.kind === 'single') {
      parts.push(renderMaterial(group.material, citations, chapter, book.settings));
    } else {
      parts.push(renderGroupedChapter(group.parentTopic, group.materials, citations, chapter, book.settings));
    }
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
    m.blocks.forEach((b) => { if (b.citationId) usedIds.add(b.citationId); });
  }
  const style = book.settings.citationStyle;
  const entries = Array.from(usedIds)
    .map((id) => citationMap.get(id))
    .filter((c): c is Citation => !!c)
    .sort((a, b) => a.authors.localeCompare(b.authors))
    .map((c, i) => `<p class="bib-entry">${i + 1}. ${escapeHtml(formatCitation(c, style))}</p>`)
    .join('');
  if (!entries) return '';
  const styleLabel = style === 'mla' ? 'Works Cited' : style === 'chicago' ? 'Bibliography' : 'References';
  return `<div class="back-section page-break bibliography" id="references"><h2>${styleLabel}</h2>${entries}</div>`;
}

/* ── SHARED CONTENT ASSEMBLY ───────────────────────────────────────────── */

function assembleContentParts(
  book: BookProject,
  materials: ReadingMaterial[],
  allCitations: Citation[]
): { coverParts: string[]; contentParts: string[] } {
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

  return { coverParts, contentParts };
}

/* ── PUBLIC HTML BUILDERS ──────────────────────────────────────────────── */

export function buildBookHtml(
  rawBook: BookProject,
  materials: ReadingMaterial[],
  allCitations: Citation[]
): string {
  const book = normalizeBook(rawBook);
  const { coverParts, contentParts } = assembleContentParts(book, materials, allCitations);
  const pageWidth = getPageDimensions(book).width;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=${pageWidth}, initial-scale=1.0, maximum-scale=1.0"/>
  <title>${escapeHtml(book.title)}</title>
  <style>${buildPdfStyles(book)}</style>
</head>
<body>
  <div class="cover-pages">${coverParts.join('\n')}</div>
  <main class="book-content content-start">${contentParts.join('\n')}</main>
</body>
</html>`;
}

export function buildBookPreviewHtml(
  rawBook: BookProject,
  materials: ReadingMaterial[],
  allCitations: Citation[]
): string {
  const book = normalizeBook(rawBook);
  const { coverParts, contentParts } = assembleContentParts(book, materials, allCitations);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=0.5, maximum-scale=3.0, user-scalable=yes"/>
  <title>${escapeHtml(book.title)}</title>
  <style>${buildPreviewStyles()}</style>
</head>
<body>
  <div class="cover-pages">${coverParts.join('\n')}</div>
  <p class="screen-page-hint">Scroll to read &bull; Headers and page numbers appear in the exported PDF</p>
  <main class="book-content">${contentParts.join('\n')}</main>
  <script>${buildPreviewScript()}</script>
</body>
</html>`;
}

/* ── PDF EXPORT ────────────────────────────────────────────────────────── */

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

export function getBookStats(materials: ReadingMaterial[]): {
  words: number;
  readingMinutes: number;
  blocks: number;
} {
  let words = 0;
  let blocks = 0;
  for (const m of materials) {
    for (const b of m.blocks) {
      blocks++;
      if (b.text) {
        words += b.text.trim().split(/\s+/).filter(Boolean).length;
      }
      if (b.rows) {
        for (const row of b.rows) {
          for (const cell of row) {
            if (cell.value) words += cell.value.trim().split(/\s+/).filter(Boolean).length;
          }
        }
      }
    }
  }
  const readingMinutes = Math.max(1, Math.round(words / 200));
  return { words, readingMinutes, blocks };
}

/* ── EPUB EXPORT (self-contained HTML) ──────────────────────────────────── */

export async function exportBookToEpubHtml(
  book: BookProject,
  materials: ReadingMaterial[],
  citations: Citation[]
): Promise<string> {
  const normalized = normalizeBook(book);
  const html = buildBookHtml(normalized, materials, citations);
  const path = `${FileSystem.documentDirectory}${normalized.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.html`;
  await FileSystem.writeAsStringAsync(path, html, { encoding: FileSystem.EncodingType.UTF8 });
  return path;
}

export async function shareEpubHtml(uri: string, title: string): Promise<void> {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'text/html',
      dialogTitle: `Share ${title}`,
    });
  }
}
