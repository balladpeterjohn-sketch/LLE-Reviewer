import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
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
import { v4 as uuidv4 } from 'uuid';
import { TOS_SUBJECTS } from '../../src/data/tosSubjects';
import {
  getBook,
  getCitations,
  getMaterials,
  saveBook,
} from '../../src/services/storage';
import { Button, Card, EmptyState } from '../../src/components/ui';
import { colors, spacing } from '../../src/theme';
import { BookProject, ReadingMaterial } from '../../src/types';
import { exportBookToPdf, getSubjectLabel, sharePdf } from '../../src/utils/bookExport';

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [book, setBook] = useState<BookProject | null>(null);
  const [allMaterials, setAllMaterials] = useState<ReadingMaterial[]>([]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [exporting, setExporting] = useState(false);

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
      sections: [
        ...book.sections,
        { id: uuidv4(), materialId, order: book.sections.length },
      ],
    };
    await saveBook(updated);
    setBook(updated);
    setPickerVisible(false);
  };

  const removeSection = async (sectionId: string) => {
    if (!book) return;
    const sections = book.sections
      .filter((s) => s.id !== sectionId)
      .map((s, i) => ({ ...s, order: i }));
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
    const updated = { ...book, includeBibliography: value };
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
    } catch (e) {
      Alert.alert('Export failed', 'Could not generate PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  if (!book) {
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.headerCard}>
          <Text style={styles.bookTitle}>{book.title}</Text>
          {book.subtitle && <Text style={styles.subtitle}>{book.subtitle}</Text>}
          <Text style={styles.author}>Compiled by {book.author}</Text>
        </Card>

        <View style={styles.bibRow}>
          <Text style={styles.bibLabel}>Include Bibliography</Text>
          <Switch
            value={book.includeBibliography}
            onValueChange={toggleBibliography}
            trackColor={{ true: colors.primary }}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Book Sections ({book.sections.length})</Text>
          <Button
            title="Add"
            icon="add"
            onPress={() => {
              if (availableMaterials.length === 0) {
                Alert.alert(
                  'No materials',
                  'Create reading materials in the TOS tab first.'
                );
                return;
              }
              setPickerVisible(true);
            }}
          />
        </View>

        {book.sections.length === 0 ? (
          <EmptyState
            icon="documents-outline"
            title="No sections added"
            message="Add reading materials to compile your reviewer book."
          />
        ) : (
          book.sections
            .sort((a, b) => a.order - b.order)
            .map((section, index) => {
              const material = materialMap.get(section.materialId);
              if (!material) return null;
              const subject = getSubjectLabel(material.subjectId);
              return (
                <Card key={section.id} style={styles.sectionCard}>
                  <View style={styles.sectionTop}>
                    <Text style={styles.sectionNum}>{index + 1}</Text>
                    <View style={styles.sectionInfo}>
                      <Text style={styles.sectionMatTitle}>{material.title}</Text>
                      <Text style={styles.sectionSubject}>{subject}</Text>
                    </View>
                    <View style={styles.sectionActions}>
                      <Pressable onPress={() => moveSection(index, -1)} disabled={index === 0}>
                        <Ionicons
                          name="chevron-up"
                          size={20}
                          color={index === 0 ? colors.border : colors.primary}
                        />
                      </Pressable>
                      <Pressable
                        onPress={() => moveSection(index, 1)}
                        disabled={index === book.sections.length - 1}
                      >
                        <Ionicons
                          name="chevron-down"
                          size={20}
                          color={
                            index === book.sections.length - 1
                              ? colors.border
                              : colors.primary
                          }
                        />
                      </Pressable>
                      <Pressable onPress={() => removeSection(section.id)}>
                        <Ionicons name="close-circle" size={20} color={colors.danger} />
                      </Pressable>
                    </View>
                  </View>
                </Card>
              );
            })
        )}

        {book.sections.length > 0 && (
          <Button
            title={exporting ? 'Generating PDF...' : 'Export Book as PDF'}
            icon="download"
            onPress={handleExport}
            disabled={exporting}
            style={styles.exportBtn}
          />
        )}
      </ScrollView>

      <Modal visible={pickerVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Material to Book</Text>
            <ScrollView style={styles.pickerList}>
              {TOS_SUBJECTS.map((subject) => {
                const subjectMaterials = availableMaterials.filter(
                  (m) => m.subjectId === subject.id
                );
                if (subjectMaterials.length === 0) return null;
                return (
                  <View key={subject.id}>
                    <Text style={styles.pickerSubject}>{subject.title}</Text>
                    {subjectMaterials.map((m) => (
                      <Pressable
                        key={m.id}
                        style={styles.pickerItem}
                        onPress={() => addSection(m.id)}
                      >
                        <Text style={styles.pickerItemTitle}>{m.title}</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerCard: { marginBottom: spacing.md },
  bookTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  author: { fontSize: 13, color: colors.accent, marginTop: spacing.sm },
  bibRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 10,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bibLabel: { fontSize: 15, fontWeight: '500', color: colors.text },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  sectionCard: { marginBottom: spacing.sm },
  sectionTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 28,
    fontSize: 13,
    fontWeight: '700',
    overflow: 'hidden',
  },
  sectionInfo: { flex: 1 },
  sectionMatTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  sectionSubject: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  sectionActions: { flexDirection: 'row', gap: spacing.sm },
  exportBtn: { marginTop: spacing.lg },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    maxHeight: '75%',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  pickerList: { marginBottom: spacing.md },
  pickerSubject: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
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
  },
  pickerItemTitle: { fontSize: 14, color: colors.text, flex: 1 },
});
