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
import { getBook, getCitations, getMaterials, saveBook } from '../../src/services/storage';
import { Button, EmptyState, StatCard } from '../../src/components/ui';
import { useTheme } from '../../src/contexts/ThemeContext';
import { radius, shadow, spacing, typography } from '../../src/theme';
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
  const router  = useRouter();
  const { colors } = useTheme();
  const [book, setBook]             = useState<BookProject | null>(null);
  const [allMaterials, setAll]      = useState<ReadingMaterial[]>([]);
  const [pickerVisible, setPicker]  = useState(false);
  const [exporting, setExporting]   = useState(false);
  const [exportingHtml, setHtml]    = useState(false);

  const load = useCallback(() => {
    if (id) { getBook(id).then((b) => setBook(b ?? null)); getMaterials().then(setAll); }
  }, [id]);
  useFocusEffect(load);

  const materialMap       = new Map(allMaterials.map((m) => [m.id, m]));
  const availableMaterials = allMaterials.filter((m) => !book?.sections.some((s) => s.materialId === m.id));

  const addSection = async (materialId: string) => {
    if (!book) return;
    const updated = { ...book, sections: [...book.sections, { id: generateId(), materialId, order: book.sections.length }] };
    await saveBook(updated); setBook(updated); setPicker(false);
  };
  const removeSection = async (sectionId: string) => {
    if (!book) return;
    const sections = book.sections.filter((s) => s.id !== sectionId).map((s, i) => ({ ...s, order: i }));
    const updated  = { ...book, sections }; await saveBook(updated); setBook(updated);
  };
  const moveSection = async (index: number, dir: -1 | 1) => {
    if (!book) return;
    const target = index + dir;
    if (target < 0 || target >= book.sections.length) return;
    const secs = [...book.sections]; [secs[index], secs[target]] = [secs[target], secs[index]];
    const updated = { ...book, sections: secs.map((s, i) => ({ ...s, order: i })) };
    await saveBook(updated); setBook(updated);
  };
  const toggleBib = async (v: boolean) => {
    if (!book) return;
    const updated = { ...book, includeBibliography: v, settings: { ...book.settings, includeBibliography: v } };
    await saveBook(updated); setBook(updated);
  };

  const handleExportPdf = async () => {
    if (!book || book.sections.length === 0) { Alert.alert('No sections', 'Add reading materials first.'); return; }
    setExporting(true);
    try {
      const citations = await getCitations();
      const materials = book.sections.map((s) => materialMap.get(s.materialId)).filter((m): m is ReadingMaterial => !!m);
      const uri = await exportBookToPdf(book, materials, citations); await sharePdf(uri);
    } catch { Alert.alert('Export failed', 'Could not generate PDF.'); }
    finally { setExporting(false); }
  };

  const handleExportHtml = async () => {
    if (!book || book.sections.length === 0) { Alert.alert('No sections', 'Add reading materials first.'); return; }
    setHtml(true);
    try {
      const citations = await getCitations();
      const materials = book.sections.map((s) => materialMap.get(s.materialId)).filter((m): m is ReadingMaterial => !!m);
      const uri = await exportBookToEpubHtml(book, materials, citations); await shareEpubHtml(uri, book.title);
    } catch { Alert.alert('Export failed', 'Could not generate HTML.'); }
    finally { setHtml(false); }
  };

  if (!book) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}><Text style={{ color: colors.textSecondary }}>Loading…</Text></View>;

  const orderedMaterials = book.sections.sort((a, b) => a.order - b.order).map((s) => materialMap.get(s.materialId)).filter((m): m is ReadingMaterial => !!m);
  const stats    = getBookStats(orderedMaterials);
  const parts    = getBookPartSummary(book);

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content:   { padding: spacing.md, gap: spacing.md, paddingBottom: 100 },

    /* Book header card */
    headerCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, ...shadow.md },
    headerTop:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
    bookCover:  { width: 52, height: 52, borderRadius: radius.md, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' },
    settBtn:    { width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.surfaceSubtle, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
    bookTitle:  { ...typography.title, color: colors.text },
    bookSub:    { ...typography.caption, color: colors.textSecondary, marginTop: 3 },
    bookAuthor: { ...typography.label, color: colors.accent, fontWeight: '600', marginTop: 6 },
    edition:    { ...typography.caption, color: colors.textTertiary },

    /* Stats */
    statsRow: { flexDirection: 'row', gap: spacing.sm },

    /* Section card */
    sCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, ...shadow.sm },
    sCardLabel: { ...typography.micro, color: colors.textTertiary, textTransform: 'uppercase', marginBottom: spacing.xs },
    structSummary: { ...typography.caption, color: colors.textSecondary, lineHeight: 18, marginBottom: spacing.sm },
    tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
    tag:  { backgroundColor: colors.primaryMuted, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.full },
    tagT: { ...typography.micro, color: colors.primary, textTransform: 'uppercase' },

    /* Toggle row */
    toggleRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
    toggleIcon: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    toggleLabel:{ ...typography.label, color: colors.text },

    /* Chapters */
    chapHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    chapTitle:  { ...typography.heading, color: colors.text },

    chapCard: { backgroundColor: colors.surface, borderRadius: radius.lg, paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border, ...shadow.sm },
    chapRow:  { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    chapNum:  { width: 28, height: 28, borderRadius: radius.full, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    chapNumT: { fontSize: 12, fontWeight: '700', color: '#fff' },
    chapInfo: { flex: 1 },
    chapMat:  { ...typography.label, color: colors.text, fontWeight: '600' },
    chapSub:  { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
    chapActs: { flexDirection: 'row', gap: spacing.sm },

    /* Export */
    exportRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },

    /* Modal */
    overlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    modal:    { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg, paddingTop: spacing.md, maxHeight: '78%', ...shadow.lg },
    handle:   { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.md },
    modalT:   { ...typography.heading, color: colors.text, marginBottom: spacing.md },
    pickerList: { marginBottom: spacing.md },
    pickerSub:  { ...typography.micro, color: colors.primary, textTransform: 'uppercase', marginTop: spacing.md, marginBottom: spacing.xs },
    pickerItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm + 2, borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.sm },
    pickerName: { ...typography.label, color: colors.text, flex: 1 },
  });

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.headerCard}>
          <View style={s.headerTop}>
            <View style={s.bookCover}><Ionicons name="book" size={26} color={colors.primary} /></View>
            <Pressable style={s.settBtn} onPress={() => router.push(`/book/${book.id}/settings`)}>
              <Ionicons name="settings-outline" size={18} color={colors.textSecondary} />
            </Pressable>
          </View>
          <Text style={s.bookTitle}>{book.title}</Text>
          {book.subtitle ? <Text style={s.bookSub}>{book.subtitle}</Text> : null}
          <Text style={s.bookAuthor}>Compiled by {book.author}</Text>
          {(book.settings.edition || book.settings.year) ? <Text style={s.edition}>{[book.settings.edition, book.settings.year].filter(Boolean).join(' · ')}</Text> : null}
        </View>

        {/* Stats */}
        {book.sections.length > 0 && (
          <View style={s.statsRow}>
            <StatCard icon="layers-outline"   value={book.sections.length} label="Chapters" />
            <StatCard icon="text-outline"     value={stats.words.toLocaleString()} label="Words" />
            <StatCard icon="time-outline"     value={`${stats.readingMinutes}m`} label="Read time" />
          </View>
        )}

        {/* Structure */}
        <View style={s.sCard}>
          <Text style={s.sCardLabel}>Book Structure</Text>
          <Text style={s.structSummary}>{parts.join(' · ')}</Text>
          <View style={s.tags}>
            {book.settings.includeTitlePage && <View style={s.tag}><Text style={s.tagT}>Title</Text></View>}
            {book.settings.includeCopyrightPage && <View style={s.tag}><Text style={s.tagT}>Copyright</Text></View>}
            {book.settings.includeTableOfContents && <View style={s.tag}><Text style={s.tagT}>TOC</Text></View>}
            {book.settings.includeTosOverview && <View style={s.tag}><Text style={s.tagT}>TOS</Text></View>}
            {book.settings.groupBySubject && <View style={s.tag}><Text style={s.tagT}>Parts</Text></View>}
            {book.settings.numberChapters && <View style={s.tag}><Text style={s.tagT}>Ch. Nums</Text></View>}
            {book.settings.includeBibliography && <View style={s.tag}><Text style={s.tagT}>Refs</Text></View>}
          </View>
          <Button title="Edit Settings" icon="settings-outline" variant="ghost" size="sm" onPress={() => router.push(`/book/${book.id}/settings`)} style={{ marginTop: spacing.sm }} />
        </View>

        {/* Bibliography toggle */}
        <View style={s.toggleRow}>
          <View style={s.toggleIcon}>
            <Ionicons name="library-outline" size={18} color={colors.primary} />
            <Text style={s.toggleLabel}>Include Bibliography</Text>
          </View>
          <Switch value={book.settings.includeBibliography} onValueChange={toggleBib} trackColor={{ true: colors.primary, false: colors.border }} thumbColor="#fff" />
        </View>

        {/* Chapters */}
        <View style={s.chapHeader}>
          <Text style={s.chapTitle}>Chapters ({book.sections.length})</Text>
          <Button
            title="Add" icon="add" size="sm"
            onPress={() => {
              if (availableMaterials.length === 0) { Alert.alert('No materials', 'Create materials in the TOS tab first.'); return; }
              setPicker(true);
            }}
          />
        </View>

        {book.sections.length === 0 ? (
          <EmptyState icon="documents-outline" title="No chapters added" message="Add reading materials to compile your book." />
        ) : (
          book.sections.sort((a, b) => a.order - b.order).map((section, index) => {
            const material = materialMap.get(section.materialId);
            if (!material) return null;
            return (
              <View key={section.id} style={s.chapCard}>
                <View style={s.chapRow}>
                  <View style={s.chapNum}><Text style={s.chapNumT}>{index + 1}</Text></View>
                  <View style={s.chapInfo}>
                    <Text style={s.chapMat} numberOfLines={1}>{material.title}</Text>
                    <Text style={s.chapSub}>{getSubjectLabel(material.subjectId)}</Text>
                  </View>
                  <View style={s.chapActs}>
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
              </View>
            );
          })
        )}

        {/* Export */}
        {book.sections.length > 0 && (
          <View style={s.exportRow}>
            <Button title="Preview"       icon="eye-outline"       variant="outline" onPress={() => router.push(`/book/${book.id}/preview`)} style={{ flex: 1 }} />
            <Button title={exporting ? 'Generating…' : 'PDF'} icon="document"  variant="primary" onPress={handleExportPdf} disabled={exporting} style={{ flex: 1 }} />
            <Button title={exportingHtml ? 'Exporting…' : 'HTML'} icon="code-slash" variant="ghost" onPress={handleExportHtml} disabled={exportingHtml} style={{ flex: 1 }} />
          </View>
        )}
      </ScrollView>

      {/* Add chapter modal */}
      <Modal visible={pickerVisible} animationType="slide" transparent>
        <View style={s.overlay}>
          <View style={s.modal}>
            <View style={s.handle} />
            <Text style={s.modalT}>Add Chapter</Text>
            <ScrollView style={s.pickerList}>
              {TOS_SUBJECTS.map((subject) => {
                const mats = availableMaterials.filter((m) => m.subjectId === subject.id);
                if (mats.length === 0) return null;
                return (
                  <View key={subject.id}>
                    <Text style={s.pickerSub}>{subject.title}</Text>
                    {mats.map((m) => (
                      <Pressable key={m.id} style={s.pickerItem} onPress={() => addSection(m.id)}>
                        <Text style={s.pickerName} numberOfLines={2}>{m.title}</Text>
                        <Ionicons name="add-circle" size={22} color={colors.primary} />
                      </Pressable>
                    ))}
                  </View>
                );
              })}
            </ScrollView>
            <Button title="Cancel" onPress={() => setPicker(false)} variant="outline" />
          </View>
        </View>
      </Modal>
    </View>
  );
}
