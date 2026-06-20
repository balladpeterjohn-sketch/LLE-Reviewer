import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateId } from '../utils/id';
import { createEmptyBook, normalizeBook } from '../utils/bookDefaults';
import {
  AppData,
  BookProject,
  Citation,
  ReadingMaterial,
} from '../types';

const STORAGE_KEY = '@lle_reviewer_data';

const defaultData: AppData = {
  materials: [],
  citations: [],
  books: [],
};

async function loadData(): Promise<AppData> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return { ...defaultData };
  try {
    return JSON.parse(raw) as AppData;
  } catch {
    return { ...defaultData };
  }
}

async function saveData(data: AppData): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export async function getAppData(): Promise<AppData> {
  return loadData();
}

export async function getMaterials(): Promise<ReadingMaterial[]> {
  const data = await loadData();
  return data.materials.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export async function getMaterialsByTopic(
  subjectId: string,
  topicId: string
): Promise<ReadingMaterial[]> {
  const materials = await getMaterials();
  return materials.filter((m) => m.subjectId === subjectId && m.topicId === topicId);
}

export async function getMaterial(id: string): Promise<ReadingMaterial | undefined> {
  const data = await loadData();
  return data.materials.find((m) => m.id === id);
}

export async function saveMaterial(material: ReadingMaterial): Promise<ReadingMaterial> {
  const data = await loadData();
  const index = data.materials.findIndex((m) => m.id === material.id);
  const updated = { ...material, updatedAt: new Date().toISOString() };
  if (index >= 0) {
    data.materials[index] = updated;
  } else {
    data.materials.push(updated);
  }
  await saveData(data);
  return updated;
}

export async function createMaterial(
  partial: Pick<ReadingMaterial, 'title' | 'subjectId' | 'topicId'>
): Promise<ReadingMaterial> {
  const now = new Date().toISOString();
  const material: ReadingMaterial = {
    id: generateId(),
    title: partial.title,
    subjectId: partial.subjectId,
    topicId: partial.topicId,
    blocks: [
      {
        id: generateId(),
        type: 'paragraph',
        text: '',
      },
    ],
    citationIds: [],
    createdAt: now,
    updatedAt: now,
  };
  return saveMaterial(material);
}

export async function deleteMaterial(id: string): Promise<void> {
  const data = await loadData();
  data.materials = data.materials.filter((m) => m.id !== id);
  await saveData(data);
}

export async function getCitations(): Promise<Citation[]> {
  const data = await loadData();
  return data.citations.sort((a, b) => a.authors.localeCompare(b.authors));
}

export async function getCitation(id: string): Promise<Citation | undefined> {
  const data = await loadData();
  return data.citations.find((c) => c.id === id);
}

export async function saveCitation(citation: Citation): Promise<Citation> {
  const data = await loadData();
  const index = data.citations.findIndex((c) => c.id === citation.id);
  const updated = { ...citation, updatedAt: new Date().toISOString() };
  if (index >= 0) {
    data.citations[index] = updated;
  } else {
    data.citations.push(updated);
  }
  await saveData(data);
  return updated;
}

export async function createCitation(
  partial: Omit<Citation, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Citation> {
  const now = new Date().toISOString();
  const citation: Citation = {
    ...partial,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  return saveCitation(citation);
}

export async function deleteCitation(id: string): Promise<void> {
  const data = await loadData();
  data.citations = data.citations.filter((c) => c.id !== id);
  await saveData(data);
}

export async function getBooks(): Promise<BookProject[]> {
  const data = await loadData();
  return data.books.map(normalizeBook).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export async function getBook(id: string): Promise<BookProject | undefined> {
  const data = await loadData();
  const book = data.books.find((b) => b.id === id);
  return book ? normalizeBook(book) : undefined;
}

export async function saveBook(book: BookProject): Promise<BookProject> {
  const data = await loadData();
  const normalized = normalizeBook(book);
  const index = data.books.findIndex((b) => b.id === normalized.id);
  const updated = {
    ...normalized,
    includeBibliography: normalized.settings.includeBibliography,
    updatedAt: new Date().toISOString(),
  };
  if (index >= 0) {
    data.books[index] = updated;
  } else {
    data.books.push(updated);
  }
  await saveData(data);
  return updated;
}

export async function createBook(
  partial: Pick<BookProject, 'title' | 'subtitle' | 'author'>
): Promise<BookProject> {
  const now = new Date().toISOString();
  const book: BookProject = {
    ...createEmptyBook(partial),
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  return saveBook(book);
}

export async function deleteBook(id: string): Promise<void> {
  const data = await loadData();
  data.books = data.books.filter((b) => b.id !== id);
  await saveData(data);
}

export async function getStats() {
  const data = await loadData();
  return {
    materials: data.materials.length,
    citations: data.citations.length,
    books: data.books.length,
  };
}
