export type CitationType = 'book' | 'journal' | 'website' | 'thesis' | 'report' | 'other';

export interface Citation {
  id: string;
  type: CitationType;
  authors: string;
  title: string;
  year: string;
  publisher?: string;
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  url?: string;
  accessDate?: string;
  edition?: string;
  place?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type ContentBlockType =
  | 'heading'
  | 'paragraph'
  | 'image'
  | 'image-text'
  | 'image-collage'
  | 'table'
  | 'quote'
  | 'citation'
  | 'callout'
  | 'footnote'
  | 'divider';

export type CalloutVariant = 'note' | 'tip' | 'important' | 'warning';

export interface AbbreviationEntry {
  abbr: string;
  meaning: string;
}

export interface GlossaryEntry {
  term: string;
  definition: string;
}

export interface AppendixEntry {
  id: string;
  title: string;
  content: string;
}

export type ImagePosition = 'left' | 'right';
export type CollageColumns = 2 | 3;

export interface TableCell {
  value: string;
}

export interface ContentBlock {
  id: string;
  type: ContentBlockType;
  text?: string;
  level?: 1 | 2 | 3;
  imageUri?: string;
  imageUris?: string[];
  imagePosition?: ImagePosition;
  collageColumns?: CollageColumns;
  caption?: string;
  rows?: TableCell[][];
  citationId?: string;
  calloutVariant?: CalloutVariant;
}

export interface ReadingMaterial {
  id: string;
  title: string;
  subjectId: string;
  topicId: string;
  blocks: ContentBlock[];
  citationIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BookSection {
  id: string;
  materialId: string;
  order: number;
}

export interface BookFrontMatter {
  dedication?: string;
  foreword?: string;
  preface?: string;
  acknowledgments?: string;
  introduction?: string;
  abbreviations: AbbreviationEntry[];
}

export interface BookBackMatter {
  appendices: AppendixEntry[];
  glossary: GlossaryEntry[];
  aboutAuthor?: string;
}

export interface BookSettings {
  edition?: string;
  year?: string;
  publisher?: string;
  copyrightNotice?: string;
  includeTitlePage: boolean;
  includeCopyrightPage: boolean;
  includeTableOfContents: boolean;
  includeTosOverview: boolean;
  includeListOfFigures: boolean;
  groupBySubject: boolean;
  numberChapters: boolean;
  includeBibliography: boolean;
  includeGlossary: boolean;
  includeAboutAuthor: boolean;
}

export interface BookProject {
  id: string;
  title: string;
  subtitle?: string;
  author: string;
  sections: BookSection[];
  /** @deprecated use settings.includeBibliography */
  includeBibliography: boolean;
  frontMatter: BookFrontMatter;
  backMatter: BookBackMatter;
  settings: BookSettings;
  createdAt: string;
  updatedAt: string;
}

export interface TosTopic {
  id: string;
  code: string;
  title: string;
  children?: TosTopic[];
}

export interface TosSubject {
  id: string;
  title: string;
  weight: number;
  examDay: 1 | 2;
  description: string;
  topics: TosTopic[];
}

export interface AppData {
  materials: ReadingMaterial[];
  citations: Citation[];
  books: BookProject[];
}
