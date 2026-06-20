import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { findSubject, findTopic } from '../data/tosSubjects';
import { BookProject, Citation, ContentBlock, ReadingMaterial } from '../types';
import { formatCitation } from './citation';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderBlock(
  block: ContentBlock,
  citations: Map<string, Citation>
): string {
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
    case 'image':
      return block.imageUri
        ? `<figure><img src="${block.imageUri}" style="max-width:100%;height:auto;" alt="${escapeHtml(block.caption ?? 'Figure')}"/><figcaption>${escapeHtml(block.caption ?? '')}</figcaption></figure>`
        : '';
    case 'image-text': {
      if (!block.imageUri && !block.text) return '';
      const imageLeft = (block.imagePosition ?? 'left') === 'left';
      const img = block.imageUri
        ? `<img src="${block.imageUri}" class="side-img" alt="${escapeHtml(block.caption ?? 'Figure')}"/>`
        : '';
      const text = `<div class="side-text"><p>${escapeHtml(block.text ?? '').replace(/\n/g, '<br/>')}</p>${block.caption ? `<p class="side-caption">${escapeHtml(block.caption)}</p>` : ''}</div>`;
      const inner = imageLeft ? `${img}${text}` : `${text}${img}`;
      return `<div class="image-text-layout">${inner}</div>`;
    }
    case 'image-collage': {
      const uris = block.imageUris ?? [];
      if (uris.length === 0) return '';
      const cols = block.collageColumns ?? 2;
      const imgs = uris
        .map((uri) => `<img src="${uri}" class="collage-img cols-${cols}" alt="Collage image"/>`)
        .join('');
      const cap = block.caption
        ? `<figcaption>${escapeHtml(block.caption)}</figcaption>`
        : '';
      return `<figure class="collage"><div class="collage-grid cols-${cols}">${imgs}</div>${cap}</figure>`;
    }
    case 'table': {
      const rows = block.rows ?? [];
      if (rows.length === 0) return '';
      const header = rows[0];
      const body = rows.slice(1);
      const headerHtml = header.map((c) => `<th>${escapeHtml(c.value)}</th>`).join('');
      const bodyHtml = body
        .map(
          (row) =>
            `<tr>${row.map((c) => `<td>${escapeHtml(c.value)}</td>`).join('')}</tr>`
        )
        .join('');
      return `<table border="1" cellpadding="8" cellspacing="0" style="width:100%;border-collapse:collapse;margin:12px 0;"><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table>`;
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

function renderMaterial(
  material: ReadingMaterial,
  citations: Map<string, Citation>
): string {
  const topicInfo = findTopic(material.subjectId, material.topicId);
  const topicLabel = topicInfo
    ? `${topicInfo.topic.code} ${topicInfo.topic.title}`
    : '';

  const blocksHtml = material.blocks.map((b) => renderBlock(b, citations)).join('\n');

  return `
    <section class="material">
      <h2>${escapeHtml(material.title)}</h2>
      <p class="topic-label">${escapeHtml(topicLabel)}</p>
      ${blocksHtml}
    </section>
  `;
}

export function buildBookHtml(
  book: BookProject,
  materials: ReadingMaterial[],
  allCitations: Citation[]
): string {
  const citationMap = new Map(allCitations.map((c) => [c.id, c]));
  const materialMap = new Map(materials.map((m) => [m.id, m]));

  const sectionsHtml = book.sections
    .sort((a, b) => a.order - b.order)
    .map((section) => {
      const material = materialMap.get(section.materialId);
      if (!material) return '';
      return renderMaterial(material, citationMap);
    })
    .join('\n');

  const usedCitationIds = new Set<string>();
  for (const section of book.sections) {
    const material = materialMap.get(section.materialId);
    if (!material) continue;
    material.citationIds.forEach((id) => usedCitationIds.add(id));
    material.blocks.forEach((b) => {
      if (b.citationId) usedCitationIds.add(b.citationId);
    });
  }

  const bibliography = book.includeBibliography
    ? Array.from(usedCitationIds)
        .map((id) => citationMap.get(id))
        .filter((c): c is Citation => !!c)
        .sort((a, b) => a.authors.localeCompare(b.authors))
        .map((c, i) => `<p class="bib-entry">${i + 1}. ${escapeHtml(formatCitation(c))}</p>`)
        .join('\n')
    : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${escapeHtml(book.title)}</title>
  <style>
    body { font-family: Georgia, 'Times New Roman', serif; margin: 40px; color: #1a1a1a; line-height: 1.6; }
    h1 { text-align: center; color: #1B4D3E; font-size: 28px; margin-bottom: 8px; }
    .subtitle { text-align: center; color: #555; font-size: 16px; margin-bottom: 4px; }
    .author { text-align: center; color: #333; font-size: 14px; margin-bottom: 40px; }
    h2 { color: #1B4D3E; border-bottom: 2px solid #C9A227; padding-bottom: 4px; margin-top: 32px; }
    h3, h4 { color: #2D6A4F; }
    .topic-label { font-size: 12px; color: #888; font-style: italic; }
    blockquote { border-left: 4px solid #C9A227; margin: 16px 0; padding: 8px 16px; background: #f9f7f2; }
    figure { text-align: center; margin: 20px 0; }
    figcaption { font-size: 12px; color: #666; margin-top: 8px; }
    table { font-size: 13px; }
    th { background: #1B4D3E; color: white; }
    tr:nth-child(even) { background: #f5f5f5; }
    .citation-ref { font-size: 13px; color: #444; padding-left: 16px; border-left: 3px solid #ddd; }
    .bibliography h2 { page-break-before: always; }
    .bib-entry { font-size: 13px; text-indent: -20px; padding-left: 20px; margin: 8px 0; }
    .cover-note { text-align: center; font-size: 11px; color: #999; margin-top: 60px; }
    .image-text-layout { display: flex; flex-direction: row; gap: 16px; align-items: flex-start; margin: 20px 0; }
    .side-img { width: 180px; max-height: 200px; object-fit: cover; border-radius: 8px; flex-shrink: 0; }
    .side-text { flex: 1; }
    .side-caption { font-size: 12px; color: #666; font-style: italic; margin-top: 8px; }
    .collage { margin: 20px 0; }
    .collage-grid { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
    .collage-img { border-radius: 8px; object-fit: cover; height: 140px; }
    .collage-img.cols-2 { width: calc(50% - 4px); }
    .collage-img.cols-3 { width: calc(33.33% - 6px); }
  </style>
</head>
<body>
  <h1>${escapeHtml(book.title)}</h1>
  ${book.subtitle ? `<p class="subtitle">${escapeHtml(book.subtitle)}</p>` : ''}
  <p class="author">Compiled by ${escapeHtml(book.author)}</p>
  <p class="cover-note">Librarians Licensure Examination Reviewer — Based on PRC TOS</p>
  ${sectionsHtml}
  ${bibliography ? `<div class="bibliography"><h2>References</h2>${bibliography}</div>` : ''}
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
