import {
  BookBackMatter,
  BookFrontMatter,
  BookProject,
  BookSettings,
} from '../types';

export const DEFAULT_BOOK_SETTINGS: BookSettings = {
  edition: '1st Edition',
  year: new Date().getFullYear().toString(),
  publisher: '',
  copyrightNotice: '',
  includeTitlePage: true,
  includeCopyrightPage: true,
  includeTableOfContents: true,
  includeTosOverview: true,
  includeListOfFigures: false,
  groupBySubject: true,
  numberChapters: true,
  includeBibliography: true,
  includeGlossary: true,
  includeAboutAuthor: true,
  pageSize: 'a4',
  marginPreset: 'standard',
  includeRunningHeader: true,
  includePageNumbers: true,
  pageNumberPlacement: 'outer',
};

export const DEFAULT_FRONT_MATTER: BookFrontMatter = {
  dedication: '',
  foreword: '',
  preface: '',
  acknowledgments: '',
  introduction: '',
  abbreviations: [],
};

export const DEFAULT_BACK_MATTER: BookBackMatter = {
  appendices: [],
  glossary: [],
  aboutAuthor: '',
};

export function normalizeBook(
  book: Partial<BookProject> & Pick<BookProject, 'id' | 'title' | 'author'>
): BookProject {
  const now = new Date().toISOString();
  return {
    id: book.id,
    title: book.title,
    subtitle: book.subtitle,
    author: book.author,
    sections: book.sections ?? [],
    includeBibliography: book.includeBibliography ?? true,
    frontMatter: {
      ...DEFAULT_FRONT_MATTER,
      ...book.frontMatter,
      abbreviations: book.frontMatter?.abbreviations ?? [],
    },
    backMatter: {
      ...DEFAULT_BACK_MATTER,
      ...book.backMatter,
      appendices: book.backMatter?.appendices ?? [],
      glossary: book.backMatter?.glossary ?? [],
    },
    settings: {
      ...DEFAULT_BOOK_SETTINGS,
      ...book.settings,
      includeBibliography:
        book.settings?.includeBibliography ?? book.includeBibliography ?? true,
    },
    createdAt: book.createdAt ?? now,
    updatedAt: book.updatedAt ?? now,
  };
}

export function createEmptyBook(
  partial: Pick<BookProject, 'title' | 'subtitle' | 'author'>
): Omit<BookProject, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    ...partial,
    sections: [],
    includeBibliography: true,
    frontMatter: { ...DEFAULT_FRONT_MATTER },
    backMatter: { ...DEFAULT_BACK_MATTER },
    settings: { ...DEFAULT_BOOK_SETTINGS },
  };
}
