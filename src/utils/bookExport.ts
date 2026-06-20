import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { TOS_SUBJECTS, findSubject, findTopic } from '../data/tosSubjects';
import { BookProject, Citation, ContentBlock, ReadingMaterial } from '../types';
import { normalizeBook } from './bookDefaults';
import { formatCitation } from './citation';

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
    case 'image':
      return block.imageUri
        ? `<figure class="figure-item"><img src="${block.imageUri}" alt="${escapeHtml(block.caption ?? 'Figure')}"/><figcaption>${escapeHtml(block.caption ?? '')}</figcaption></figure>`
        : '';
    case 'image-text': {
      if (!block.imageUri && !block.text) return '';
      const imageLeft = (block.imagePosition ?? 'left') === 'left';
      const img = block.imageUri
        ? `<img src="${block.imageUri}" class="side-img" alt="${escapeHtml(block.caption ?? 'Figure')}"/>`
        : '';
      const text = `<div class="side-text"><p>${escapeHtml(block.text ?? '').replace(/\n/g, '<br/>')}</p>${block.caption ? `<p class="side-caption">${escapeHtml(block.caption)}</p>` : ''}</div>`;
      return `<div class="image-text-layout">${imageLeft ? img + text : text + img}</div>`;
    }
    case 'image-collage': {
      const uris = block.imageUris ?? [];
      if (uris.length === 0) return '';
      const cols = block.collageColumns ?? 2;
      const imgs = uris
        .map((uri) => `<img src="${uri}" class="collage-img cols-${cols}" alt="Collage"/>`)
        .join('');
      const cap = block.caption ? `<figcaption>${escapeHtml(block.caption)}</figcaption>` : '';
      return `<figure class="collage figure-item"><div class="collage-grid cols-${cols}">${imgs}</div>${cap}</figure>`;
    }
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
    <div class="title-page page-break" id="title-page">
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
    <div class="copyright-page page-break" id="copyright">
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

const BOOK_STYLES = `
  body { font-family: Georgia, 'Times New Roman', serif; margin: 0; padding: 40px; color: #1a1a1a; line-height: 1.65; font-size: 14px; }
  .page-break { page-break-before: always; }
  .title-page { text-align: center; padding-top: 80px; min-height: 90vh; }
  .cover-label { font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #C9A227; margin-bottom: 40px; }
  .cover-title { font-size: 32px; color: #1B4D3E; margin: 16px 0; line-height: 1.2; }
  .cover-subtitle { font-size: 18px; color: #555; margin-bottom: 12px; }
  .cover-edition { font-size: 14px; color: #777; margin-bottom: 40px; }
  .cover-author { font-size: 16px; font-weight: 600; margin-bottom: 8px; }
  .cover-publisher { font-size: 13px; color: #666; }
  .cover-tos { font-size: 11px; color: #999; margin-top: 60px; }
  .copyright-page { padding-top: 40px; }
  .copyright-meta { font-size: 12px; color: #666; margin-top: 12px; }
  h2 { color: #1B4D3E; border-bottom: 2px solid #C9A227; padding-bottom: 6px; margin-top: 24px; }
  h3, h4 { color: #2D6A4F; }
  .toc-list { list-style: none; padding: 0; }
  .toc-list li { margin: 8px 0; border-bottom: 1px dotted #ddd; padding-bottom: 4px; }
  .toc-level-2 { padding-left: 20px; font-size: 13px; }
  .toc-list a { color: #1B4D3E; text-decoration: none; }
  .part-divider { text-align: center; padding: 60px 20px; background: #F7F5F0; border-radius: 8px; margin: 20px 0; }
  .part-label { font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #C9A227; }
  .part-title { font-size: 24px; color: #1B4D3E; border: none; margin: 12px 0; }
  .part-weight { font-size: 13px; color: #666; }
  .part-desc { font-size: 13px; color: #555; max-width: 500px; margin: 12px auto 0; }
  .chapter-title { font-size: 20px; }
  .topic-label { font-size: 12px; color: #888; font-style: italic; margin-bottom: 16px; }
  blockquote { border-left: 4px solid #C9A227; margin: 16px 0; padding: 8px 16px; background: #f9f7f2; }
  .callout { padding: 12px 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid; }
  .callout-note { background: #E8F0EC; border-color: #1B4D3E; }
  .callout-tip { background: #FFF8E7; border-color: #C9A227; }
  .callout-important { background: #E8EEF8; border-color: #2D6A4F; }
  .callout-warning { background: #FDEEEE; border-color: #C0392B; }
  .footnote { font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 8px; }
  .divider { border: none; border-top: 2px solid #C9A227; margin: 24px 0; }
  figure { text-align: center; margin: 20px 0; }
  figcaption { font-size: 12px; color: #666; margin-top: 8px; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
  th { background: #1B4D3E; color: white; padding: 8px; text-align: left; }
  td { border: 1px solid #ddd; padding: 8px; }
  tr:nth-child(even) { background: #f9f9f9; }
  .citation-ref { font-size: 13px; color: #444; padding-left: 16px; border-left: 3px solid #ddd; }
  .bib-entry { font-size: 13px; text-indent: -20px; padding-left: 20px; margin: 8px 0; }
  .image-text-layout { display: flex; gap: 16px; align-items: flex-start; margin: 20px 0; }
  .side-img { width: 180px; max-height: 200px; object-fit: cover; border-radius: 8px; flex-shrink: 0; }
  .side-text { flex: 1; }
  .side-caption { font-size: 12px; color: #666; font-style: italic; }
  .collage-grid { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
  .collage-img { border-radius: 8px; object-fit: cover; height: 140px; }
  .collage-img.cols-2 { width: calc(50% - 4px); }
  .collage-img.cols-3 { width: calc(33.33% - 6px); }
  .lof-list { list-style: none; padding: 0; }
  .lof-list li { margin: 6px 0; font-size: 13px; }
`;

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

  const parts: string[] = [];

  if (s.includeTitlePage) parts.push(renderTitlePage(book));
  if (s.includeCopyrightPage) parts.push(renderCopyrightPage(book));
  if (fm.dedication?.trim()) parts.push(renderFrontSection('dedication', 'Dedication', fm.dedication));
  if (fm.foreword?.trim()) parts.push(renderFrontSection('foreword', 'Foreword', fm.foreword));
  if (fm.preface?.trim()) parts.push(renderFrontSection('preface', 'Preface', fm.preface));
  if (fm.acknowledgments?.trim()) parts.push(renderFrontSection('acknowledgments', 'Acknowledgments', fm.acknowledgments));
  if (fm.introduction?.trim()) parts.push(renderFrontSection('introduction', 'Introduction', fm.introduction));
  if (fm.abbreviations.length > 0) parts.push(renderAbbreviations(fm.abbreviations));
  if (s.includeTosOverview) parts.push(renderTosOverview());
  if (s.includeListOfFigures && countFigures(materials) > 0) parts.push(renderListOfFigures(materials));
  if (s.includeTableOfContents) parts.push(renderToc(buildTocEntries(book, materials)));

  parts.push(renderBody(book, materials, citationMap));

  if (bm.appendices.length > 0) parts.push(renderAppendices(bm.appendices));
  if (s.includeGlossary && bm.glossary.length > 0) parts.push(renderGlossary(bm.glossary));
  parts.push(renderBibliography(book, materials, allCitations));
  if (s.includeAboutAuthor && bm.aboutAuthor?.trim()) {
    parts.push(renderFrontSection('about-author', 'About the Author', bm.aboutAuthor));
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${escapeHtml(book.title)}</title>
  <style>${BOOK_STYLES}</style>
</head>
<body>
  ${parts.join('\n')}
</body>
</html>`;
}

export async function exportBookToPdf(
  book: BookProject,
  materials: ReadingMaterial[],
  citations: Citation[]
): Promise<string> {
  const html = buildBookHtml(book, materials, citations);
  const { uri } = await Print.printToFileAsync({ html, base64: false });
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
