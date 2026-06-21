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

export async function duplicateMaterial(id: string): Promise<ReadingMaterial | undefined> {
  const original = await getMaterial(id);
  if (!original) return undefined;
  const now = new Date().toISOString();
  const copy: ReadingMaterial = {
    ...original,
    id: generateId(),
    title: `${original.title} (copy)`,
    blocks: original.blocks.map((b) => ({ ...b, id: generateId() })),
    createdAt: now,
    updatedAt: now,
  };
  return saveMaterial(copy);
}

export async function exportBackup(): Promise<string> {
  const data = await loadData();
  return JSON.stringify({ version: 2, exportedAt: new Date().toISOString(), ...data }, null, 2);
}

export async function importBackup(jsonString: string): Promise<{ materials: number; citations: number; books: number }> {
  const parsed = JSON.parse(jsonString);
  const incoming: AppData = {
    materials: Array.isArray(parsed.materials) ? parsed.materials : [],
    citations: Array.isArray(parsed.citations) ? parsed.citations : [],
    books: Array.isArray(parsed.books) ? parsed.books : [],
  };
  const current = await loadData();
  const merged: AppData = {
    materials: mergeById(current.materials, incoming.materials),
    citations: mergeById(current.citations, incoming.citations),
    books: mergeById(current.books, incoming.books),
  };
  await saveData(merged);
  return {
    materials: incoming.materials.length,
    citations: incoming.citations.length,
    books: incoming.books.length,
  };
}

function mergeById<T extends { id: string }>(existing: T[], incoming: T[]): T[] {
  const map = new Map(existing.map((x) => [x.id, x]));
  for (const item of incoming) map.set(item.id, item);
  return Array.from(map.values());
}

export async function getMaterialCount(): Promise<number> {
  const data = await loadData();
  return data.materials.length;
}

export async function getMaterialsBySubject(): Promise<Map<string, Set<string>>> {
  const materials = await getMaterials();
  const map = new Map<string, Set<string>>();
  for (const m of materials) {
    if (!map.has(m.subjectId)) map.set(m.subjectId, new Set());
    map.get(m.subjectId)!.add(m.topicId);
  }
  return map;
}
