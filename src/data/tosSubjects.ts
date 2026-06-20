import { TosSubject } from '../types';

/**
 * LLE Table of Specifications based on PRC Board for Librarians
 * Resolution No. 07, Series of 2006 (syllabi) and Resolution No. 02, Series of 2009 (TOS).
 */
export const TOS_SUBJECTS: TosSubject[] = [
  {
    id: 'lom',
    title: 'Library Organization and Management',
    weight: 20,
    examDay: 1,
    description:
      'Administration, management principles, library types, major administrative concerns, laws, related practices, and trends.',
    topics: [
      {
        id: 'lom-1',
        code: '1',
        title: 'Introduction to Administration/Management',
        children: [
          { id: 'lom-1-1', code: '1.1', title: 'Definition of terms' },
          { id: 'lom-1-2', code: '1.2', title: 'Management Development' },
          { id: 'lom-1-3', code: '1.3', title: 'Principles of Administration / Management' },
          { id: 'lom-1-4', code: '1.4', title: 'Management Styles' },
        ],
      },
      {
        id: 'lom-2',
        code: '2',
        title: 'The Administration of the Library',
        children: [
          { id: 'lom-2-1', code: '2.1', title: 'Cultural and Social Influences' },
          { id: 'lom-2-2', code: '2.2', title: 'Types of Library' },
          { id: 'lom-2-3', code: '2.3', title: 'Library Board/Committee' },
        ],
      },
      {
        id: 'lom-3',
        code: '3',
        title: 'Major Administrative Concerns',
        children: [
          { id: 'lom-3-1', code: '3.1', title: 'Personnel Management' },
          { id: 'lom-3-2', code: '3.2', title: 'Finance' },
          { id: 'lom-3-3', code: '3.3', title: 'Library Services' },
          { id: 'lom-3-4', code: '3.4', title: 'Physical Facilities' },
          { id: 'lom-3-5', code: '3.5', title: 'Material Resources' },
          { id: 'lom-3-6', code: '3.6', title: 'Promotional Activities' },
          { id: 'lom-3-7', code: '3.7', title: 'Evaluation of library services' },
        ],
      },
      {
        id: 'lom-4',
        code: '4',
        title: 'Laws, Related Practices, and Trends',
        children: [
          { id: 'lom-4-1', code: '4.1', title: 'Legislations Affecting Librarianship' },
          { id: 'lom-4-2', code: '4.2', title: 'Related Practices and Trends' },
        ],
      },
    ],
  },
  {
    id: 'rbus',
    title: 'Reference, Bibliography and User Services',
    weight: 20,
    examDay: 1,
    description:
      'Reference sources, reference process, information services, computer-assisted search, and bibliographic networks.',
    topics: [
      {
        id: 'rbus-1',
        code: '1',
        title: 'Introduction',
        children: [
          { id: 'rbus-1-1', code: '1.1', title: 'Nature and Development of Reference and Information Services' },
          { id: 'rbus-1-2', code: '1.2', title: 'The Reference Department' },
          { id: 'rbus-1-3', code: '1.3', title: 'Relation of Reference Service to Other Library Services' },
        ],
      },
      {
        id: 'rbus-2',
        code: '2',
        title: 'Reference and Information Sources',
        children: [
          { id: 'rbus-2-1', code: '2.1', title: 'Nature of Reference and Information Sources' },
          { id: 'rbus-2-2', code: '2.2', title: 'General Reference and Information Sources' },
          { id: 'rbus-2-3', code: '2.3', title: 'Reference Sources in Various Subject Fields' },
        ],
      },
      {
        id: 'rbus-3',
        code: '3',
        title: 'Reference and Information Services',
        children: [
          { id: 'rbus-3-1', code: '3.1', title: 'The Reference Process' },
          { id: 'rbus-3-2', code: '3.2', title: 'Reference Services in the Library' },
          { id: 'rbus-3-3', code: '3.3', title: 'Information Services' },
          { id: 'rbus-3-4', code: '3.4', title: 'Computer-Assisted Reference Service' },
          { id: 'rbus-3-5', code: '3.5', title: 'Bibliographic Networks' },
        ],
      },
    ],
  },
  {
    id: 'ia',
    title: 'Indexing and Abstracting',
    weight: 15,
    examDay: 1,
    description:
      'Principles of abstracting and indexing, thesaurus design, production of abstracts and indexes, and current trends.',
    topics: [
      {
        id: 'ia-1',
        code: '1',
        title: 'Abstracting',
        children: [
          { id: 'ia-1-1', code: '1.1', title: 'Definition of terms' },
          { id: 'ia-1-2', code: '1.2', title: 'Development of abstracts and abstracting process' },
          { id: 'ia-1-3', code: '1.3', title: 'Types of abstracts' },
          { id: 'ia-1-4', code: '1.4', title: 'Principles and concepts of abstracting' },
          { id: 'ia-1-5', code: '1.5', title: 'The abstracting process' },
          { id: 'ia-1-6', code: '1.6', title: 'Production of abstracts' },
        ],
      },
      {
        id: 'ia-2',
        code: '2',
        title: 'Indexing',
        children: [
          { id: 'ia-2-1', code: '2.1', title: 'Definition of terms' },
          { id: 'ia-2-2', code: '2.2', title: 'Development of indexes and indexing' },
          { id: 'ia-2-3', code: '2.3', title: 'Role of indexing in information retrieval' },
          { id: 'ia-2-4', code: '2.4', title: 'Types of indexes' },
          { id: 'ia-2-5', code: '2.5', title: 'Principles and concepts of indexing' },
          { id: 'ia-2-6', code: '2.6', title: 'Indexing languages and systems' },
          { id: 'ia-2-7', code: '2.7', title: 'The Thesaurus' },
          { id: 'ia-2-8', code: '2.8', title: 'Production of index entries' },
        ],
      },
      {
        id: 'ia-3',
        code: '3',
        title: 'Application of Abstracting and Indexing Data',
      },
      {
        id: 'ia-4',
        code: '4',
        title: 'Trends in Abstracting and Indexing',
      },
    ],
  },
  {
    id: 'cc',
    title: 'Cataloging and Classification',
    weight: 20,
    examDay: 2,
    description:
      'Descriptive and subject cataloging, DDC, LCC, shelf-listing, filing, and trends including MARC, RDA, and metadata.',
    topics: [
      {
        id: 'cc-1',
        code: '1',
        title: 'Introduction',
      },
      {
        id: 'cc-2',
        code: '2',
        title: 'Descriptive Cataloging',
        children: [
          { id: 'cc-2-1', code: '2.1', title: 'Basic concepts and principles' },
          { id: 'cc-2-2', code: '2.2', title: 'The AACR2 / RDA' },
          { id: 'cc-2-3', code: '2.3', title: 'Description of all types of materials' },
          { id: 'cc-2-4', code: '2.4', title: 'Access points' },
        ],
      },
      {
        id: 'cc-3',
        code: '3',
        title: 'Subject Cataloging',
        children: [
          { id: 'cc-3-1', code: '3.1', title: 'Principles of subject cataloging' },
          { id: 'cc-3-2', code: '3.2', title: 'Standard lists of subject headings' },
          { id: 'cc-3-3', code: '3.3', title: 'Assigning subject headings' },
        ],
      },
      {
        id: 'cc-4',
        code: '4',
        title: 'Classification',
        children: [
          { id: 'cc-4-1', code: '4.1', title: 'Historical background and principles' },
          { id: 'cc-4-2', code: '4.2', title: 'Dewey Decimal Classification (DDC)' },
          { id: 'cc-4-3', code: '4.3', title: 'Library of Congress Classification (LCC)' },
        ],
      },
      {
        id: 'cc-5',
        code: '5',
        title: 'Shelf-listing and filing catalog entries',
      },
      {
        id: 'cc-6',
        code: '6',
        title: 'Other catalog files and records',
      },
      {
        id: 'cc-7',
        code: '7',
        title: 'Trends in cataloguing',
        children: [
          { id: 'cc-7-1', code: '7.1', title: 'Computer assisted cataloguing' },
          { id: 'cc-7-2', code: '7.2', title: 'MARC records' },
          { id: 'cc-7-3', code: '7.3', title: 'Dublin Core and Metadata' },
        ],
      },
    ],
  },
  {
    id: 'sa',
    title: 'Selection and Acquisition',
    weight: 15,
    examDay: 2,
    description:
      'Collection development, selection criteria, acquisition methods, evaluation, weeding, and preservation.',
    topics: [
      {
        id: 'sa-1',
        code: '1',
        title: 'Introduction',
      },
      {
        id: 'sa-2',
        code: '2',
        title: 'Selection of multi-media information sources',
        children: [
          { id: 'sa-2-1', code: '2.1', title: 'General principles' },
          { id: 'sa-2-2', code: '2.2', title: 'Bases of selection' },
          { id: 'sa-2-3', code: '2.3', title: 'The Librarian as selector' },
        ],
      },
      {
        id: 'sa-3',
        code: '3',
        title: 'Acquisition Process',
      },
      {
        id: 'sa-4',
        code: '4',
        title: 'Evaluation of collections',
      },
      {
        id: 'sa-5',
        code: '5',
        title: 'Formulation of collection development policies',
      },
      {
        id: 'sa-6',
        code: '6',
        title: 'Preservation and conservation of collections',
      },
      {
        id: 'sa-7',
        code: '7',
        title: 'Problems, issues and trends in collection development',
      },
    ],
  },
  {
    id: 'it',
    title: 'Information Technology',
    weight: 10,
    examDay: 2,
    description:
      'Computer applications in libraries, information storage and retrieval, networks, multimedia, and emerging IT trends.',
    topics: [
      { id: 'it-1', code: '1', title: 'Introduction' },
      { id: 'it-2', code: '2', title: 'Information storage and retrieval systems' },
      { id: 'it-3', code: '3', title: 'Technologies for information handling' },
      { id: 'it-4', code: '4', title: 'Information systems and databases' },
      {
        id: 'it-5',
        code: '5',
        title: 'Computer applications in library operations',
        children: [
          { id: 'it-5-1', code: '5.1', title: 'Acquisitions' },
          { id: 'it-5-2', code: '5.2', title: 'Cataloging' },
          { id: 'it-5-3', code: '5.3', title: 'Circulation' },
          { id: 'it-5-4', code: '5.4', title: 'Serials' },
        ],
      },
      { id: 'it-6', code: '6', title: 'Computer systems' },
      { id: 'it-7', code: '7', title: 'Communication technologies' },
      { id: 'it-8', code: '8', title: 'Multimedia technologies' },
      { id: 'it-9', code: '9', title: 'Issues in information technology' },
    ],
  },
];

export function findSubject(subjectId: string): TosSubject | undefined {
  return TOS_SUBJECTS.find((s) => s.id === subjectId);
}

export function findTopic(subjectId: string, topicId: string) {
  const subject = findSubject(subjectId);
  if (!subject) return undefined;

  for (const topic of subject.topics) {
    if (topic.id === topicId) return { subject, topic };
    if (topic.children) {
      const child = topic.children.find((c) => c.id === topicId);
      if (child) return { subject, topic: child, parent: topic };
    }
  }
  return undefined;
}

export function getAllTopics(subject: TosSubject): { id: string; code: string; title: string }[] {
  const result: { id: string; code: string; title: string }[] = [];
  for (const topic of subject.topics) {
    result.push({ id: topic.id, code: topic.code, title: topic.title });
    if (topic.children) {
      for (const child of topic.children) {
        result.push({ id: child.id, code: child.code, title: child.title });
      }
    }
  }
  return result;
}
