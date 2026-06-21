import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { generateId } from '../../src/utils/id';
import { TOS_SUBJECTS } from '../../src/data/tosSubjects';
import {
  getBook,
  getCitations,
  getMaterials,
  saveBook,
} from '../../src/services/storage';
import { Button, GlassCard, SectionHeader } from '../../src/components/ui';
import { colors, spacing } from '../../src/theme';
import { BookProject, ReadingMaterial } from '../../src/types';
import {
  exportBookToPdf,
  exportBookToEpubHtml,
  getBookPartSummary,
  getBookStats,
  getSubjectLabel,
  sharePdf,
  shareEpubHtml,
} from '../../src/utils/bookExport';

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [book, setBook] = useState<BookProject | null>(null);
  const [allMaterials, setAllMaterials] = useState<ReadingMaterial[]>([]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingHtml, setExportingHtml] = useState(false);

  const load = useCallback(() => {
    if (id) {
      getBook(id).then((b) => setBook(b ?? null));
      getMaterials().then(setAllMaterials);
    }
  }, [id]);

  useFocusEffect(load);

  const materialMap = new Map(allMaterials.map((m) => [m.id, m]));
  const availableMaterials = allMaterials.filter(
    (m) => !book?.sections.some((s) => s.materialId === m.id)
  );

  const addSection = async (materialId: string) => {
    if (!book) return;
    const updated: BookProject = {
      ...book,
      sections: [...book.sections, { id: generateId(), materialId, order: book.sections.length }],
    };
    await saveBook(updated);
    setBook(updated);
    setPickerVisible(false);
  };

  const removeSection = async (sectionId: string) => {
    if (!book) return;
    const sections = book.sections.filter((s) => s.id !== sectionId).map((s, i) => ({ ...s, order: i }));
    const updated = { ...book, sections };
    await saveBook(updated);
    setBook(updated);
  };

  const moveSection = async (index: number, direction: -1 | 1) => {
    if (!book) return;
    const target = index + direction;
    if (target < 0 || target >= book.sections.length) return;
    const sections = [...book.sections];
    [sections[index], sections[target]] = [sections[target], sections[index]];
    const reordered = sections.map((s, i) => ({ ...s, order: i }));
    const updated = { ...book, sections: reordered };
    await saveBook(updated);
    setBook(updated);
  };

  const toggleBibliography = async (value: boolean) => {
    if (!book) return;
    const updated = {
      ...book,
      includeBibliography: value,
      settings: { ...book.settings, includeBibliography: value },
    };
    await saveBook(updated);
    setBook(updated);
  };

  const handleExport = async () => {
    if (!book || book.sections.length === 0) {
      Alert.alert('No sections', 'Add reading materials to the book before exporting.');
      return;
    }
    setExporting(true);
    try {
      const citations = await getCitations();
      const materials = book.sections
        .map((s) => materialMap.get(s.materialId))
        .filter((m): m is ReadingMaterial => !!m);
      const uri = await exportBookToPdf(book, materials, citations);
      await sharePdf(uri);
    } catch {
      Alert.alert('Export failed', 'Could not generate PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleExportHtml = async () => {
    if (!book || book.sections.length === 0) {
      Alert.alert('No sections', 'Add reading materials before exporting.');
      return;
    }
    setExportingHtml(true);
    try {
      const citations = await getCitations();
      const materials = book.sections
        .map((s) => materialMap.get(s.materialId))
        .filter((m): m is ReadingMaterial => !!m);
      const uri = await exportBookToEpubHtml(book, materials, citations);
      await shareEpubHtml(uri, book.title);
    } catch {
      Alert.alert('Export failed', 'Could not generate HTML export.');
    } finally {
      setExportingHtml(false);
    }
  };

  if (!book) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Loading book…</Text>
      </View>
    );
  }

  const bookParts = getBookPartSummary(book);
  const orderedMaterials = book.sections
    .sort((a, b) => a.order - b.order)
    .map((s) => materialMap.get(s.materialId))
    .filter((m): m is ReadingMaterial => !!m);
  const stats = getBookStats(orderedMaterials);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Book header */}
        <GlassCard style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={styles.bookCover}>
              <Ionicons name="book" size={28} color={colors.primary} />
            </View>
            <Pressable
              onPress={() => router.push(`/book/${book.id}/settings`)}
              style={styles.settingsBtn}
            >
              <Ionicons name="settings-outline" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>
          <Text style={styles.bookTitle}>{book.title}</Text>
          {book.subtitle ? <Text style={styles.subtitle}>{book.subtitle}</Text> : null}
          <Text style={styles.author}>Compiled by {book.author}</Text>
          {book.settings.edition || book.settings.year ? (
            <Text style={styles.edition}>
              {[book.settings.edition, book.settings.year].filter(Boolean).join(' · ')}
            </Text>
          ) : null}
        </GlassCard>

        {/* Stats */}
        {book.sections.length > 0 && (
          <View style={styles.statsRow}>
            <StatCard icon="documents-outline" value={book.sections.length} label="Chapters" />
            <StatCard icon="text-outline" value={stats.words} label="Words" />
            <StatCard icon="time-outline" value={`${stats.readingMinutes}m`} label="Read time" />
          </View>
        )}

        {/* Structure */}
        <GlassCard>
          <SectionHeader title="Book Structure" />
          <Text style={styles.structureSummary}>{bookParts.join(' · ')}</Text>
          <View style={styles.structureTags}>
            {book.settings.includeTitlePage && <Tag label="Title Page" />}
            {book.settings.includeCopyrightPage && <Tag label="Copyright" />}
            {book.settings.includeTableOfContents && <Tag label="TOC" />}
            {book.settings.includeTosOverview && <Tag label="TOS" />}
            {book.settings.groupBySubject && <Tag label="Parts" />}
            {book.settings.numberChapters && <Tag label="Chapters #" />}
            {book.settings.includeBibliography && <Tag label="References" />}
            {(book.settings.includeRunningHeader !== false) && <Tag label="Header" />}
            {(book.settings.includePageNumbers !== false) && <Tag label="Pages" />}
          </View>
          <Button
            title="Edit Book Settings"
            icon="settings"
            variant="ghost"
            small
            onPress={() => router.push(`/book/${book.id}/settings`)}
            style={{ marginTop: spacing.sm }}
          />
        </GlassCard>

        {/* Bibliography toggle */}
        <GlassCard style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Ionicons name="library-outline" size={18} color={colors.primary} />
            <Text style={styles.toggleLabel}>Include Bibliography</Text>
          </View>
          <Switch
            value={book.settings.includeBibliography}
            onValueChange={toggleBibliography}
            trackColor={{ true: colors.primary, false: colors.border }}
            thumbColor="#fff"
          />
        </GlassCard>

        {/* Sections */}
        <SectionHeader
          title={`Chapters (${book.sections.length})`}
          action={
            <Button
              title="Add"
              icon="add"
              small
              onPress={() => {
                if (availableMaterials.length === 0) {
                  Alert.alert('No materials', 'Create reading materials in the TOS tab first.');
                  return;
                }
                setPickerVisible(true);
              }}
            />
          }
        />

        {book.sections.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <Ionicons name="documents-outline" size={32} color={colors.border} />
            <Text style={styles.emptyText}>No chapters added yet</Text>
            <Text style={styles.emptyHint}>Add reading materials to compile your book.</Text>
          </GlassCard>
        ) : (
          book.sections
            .sort((a, b) => a.order - b.order)
            .map((section, index) => {
              const material = materialMap.get(section.materialId);
              if (!material) return null;
              const subject = getSubjectLabel(material.subjectId);
              return (
                <GlassCard key={section.id} style={styles.sectionCard}>
                  <View style={styles.sectionTop}>
                    <View style={styles.sectionNum}>
                      <Text style={styles.sectionNumText}>{index + 1}</Text>
                    </View>
                    <View style={styles.sectionInfo}>
                      <Text style={styles.sectionMatTitle} numberOfLines={1}>{material.title}</Text>
                      <Text style={styles.sectionSubject} numberOfLines={1}>{subject}</Text>
                    </View>
                    <View style={styles.sectionActions}>
                      <Pressable onPress={() => moveSection(index, -1)} disabled={index === 0} hitSlop={8}>
                        <Ionicons name="chevron-up" size={20} color={index === 0 ? colors.border : colors.primary} />
                      </Pressable>
                      <Pressable onPress={() => moveSection(index, 1)} disabled={index === book.sections.length - 1} hitSlop={8}>
                        <Ionicons name="chevron-down" size={20} color={index === book.sections.length - 1 ? colors.border : colors.primary} />
                      </Pressable>
                      <Pressable onPress={() => removeSection(section.id)} hitSlop={8}>
                        <Ionicons name="close-circle" size={20} color={colors.danger} />
                      </Pressable>
                    </View>
                  </View>
                </GlassCard>
              );
            })
        )}

        {/* Export actions */}
        {book.sections.length > 0 && (
          <View style={styles.exportActions}>
            <Button
              title="Preview Book"
              icon="eye"
              variant="outline"
              onPress={() => router.push(`/book/${book.id}/preview`)}
              style={styles.exportBtn}
            />
            <Button
              title={exporting ? 'Generating…' : 'Export PDF'}
              icon="download"
              onPress={handleExport}
              disabled={exporting}
              style={styles.exportBtn}
            />
            <Button
              title={exportingHtml ? 'Exporting…' : 'Export HTML'}
              icon="code-slash"
              variant="ghost"
              onPress={handleExportHtml}
              disabled={exportingHtml}
              style={styles.exportBtn}
            />
          </View>
        )}
      </ScrollView>

      {/* Material picker modal */}
      <Modal visible={pickerVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Add Chapter</Text>
            <ScrollView style={styles.pickerList}>
              {TOS_SUBJECTS.map((subject) => {
                const subjectMaterials = availableMaterials.filter((m) => m.subjectId === subject.id);
                if (subjectMaterials.length === 0) return null;
                return (
                  <View key={subject.id}>
                    <Text style={styles.pickerSubject}>{subject.title}</Text>
                    {subjectMaterials.map((m) => (
                      <Pressable key={m.id} style={styles.pickerItem} onPress={() => addSection(m.id)}>
                        <Text style={styles.pickerItemTitle} numberOfLines={2}>{m.title}</Text>
                        <Ionicons name="add-circle" size={22} color={colors.primary} />
                      </Pressable>
                    ))}
                  </View>
                );
              })}
            </ScrollView>
            <Button title="Cancel" onPress={() => setPickerVisible(false)} variant="outline" />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function StatCard({ icon, value, label }: { icon: keyof typeof Ionicons.glyphMap; value: string | number; label: string }) {
  return (
    <View style={statStyles.card}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <View style={tagStyles.tag}>
      <Text style={tagStyles.text}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 14,
    padding: spacing.sm + 2,
    alignItems: 'center',
    gap: 2,
    borderWidth: 1,
    borderColor: 'rgba(27,77,62,0.1)',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  value: { fontSize: 20, fontWeight: '800', color: colors.primary },
  label: { fontSize: 10, color: colors.textSecondary, fontWeight: '600', textTransform: 'uppercase' },
});

const tagStyles = StyleSheet.create({
  tag: {
    backgroundColor: 'rgba(27,77,62,0.08)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(27,77,62,0.15)',
  },
  text: { fontSize: 11, fontWeight: '600', color: colors.primary },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl * 2, gap: spacing.sm },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: colors.textSecondary, fontStyle: 'italic' },

  headerCard: { gap: spacing.xs },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  bookCover: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: 'rgba(27,77,62,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(27,77,62,0.15)',
  },
  settingsBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  bookTitle: { fontSize: 20, fontWeight: '800', color: colors.text, letterSpacing: 0.2 },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  author: { fontSize: 13, color: colors.accent, fontWeight: '600', marginTop: spacing.xs },
  edition: { fontSize: 12, color: colors.textSecondary },

  statsRow: { flexDirection: 'row', gap: spacing.sm },

  structureSummary: { fontSize: 12, color: colors.textSecondary, lineHeight: 18, marginBottom: spacing.sm },
  structureTags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.xs },

  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggleInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  toggleLabel: { fontSize: 15, fontWeight: '500', color: colors.text },

  emptyCard: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xl },
  emptyText: { fontSize: 15, fontWeight: '600', color: colors.text },
  emptyHint: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },

  sectionCard: { paddingVertical: spacing.sm + 2 },
  sectionTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionNum: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionNumText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  sectionInfo: { flex: 1 },
  sectionMatTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  sectionSubject: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  sectionActions: { flexDirection: 'row', gap: spacing.sm },

  exportActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  exportBtn: { flex: 1 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    paddingTop: spacing.md,
    maxHeight: '78%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  pickerList: { marginBottom: spacing.md },
  pickerSubject: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  pickerItemTitle: { fontSize: 14, color: colors.text, flex: 1, lineHeight: 20 },
});
