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
  | 'table'
  | 'quote'
  | 'citation';

export interface TableCell {
  value: string;
}

export interface ContentBlock {
  id: string;
  type: ContentBlockType;
  text?: string;
  level?: 1 | 2 | 3;
  imageUri?: string;
  caption?: string;
  rows?: TableCell[][];
  citationId?: string;
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

export interface BookProject {
  id: string;
  title: string;
  subtitle?: string;
  author: string;
  sections: BookSection[];
  includeBibliography: boolean;
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
