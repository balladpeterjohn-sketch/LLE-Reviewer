import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getBook, saveBook } from '../../../src/services/storage';
import { Button, Input } from '../../../src/components/ui';
import { colors, spacing } from '../../../src/theme';
import { BookFont, BookProject, CitationStyle } from '../../../src/types';
import { generateId } from '../../../src/utils/id';
import { CITATION_STYLE_LABELS } from '../../../src/utils/citation';

export default function BookSettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [book, setBook] = useState<BookProject | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    if (id) getBook(id).then((b) => setBook(b ?? null));
  }, [id]);

  useFocusEffect(load);

  const update = (patch: Partial<BookProject>) => {
    if (book) setBook({ ...book, ...patch });
  };

  const updateSettings = (patch: Partial<BookProject['settings']>) => {
    if (!book) return;
    setBook({ ...book, settings: { ...book.settings, ...patch } });
  };

  const updateFront = (patch: Partial<BookProject['frontMatter']>) => {
    if (!book) return;
    setBook({ ...book, frontMatter: { ...book.frontMatter, ...patch } });
  };

  const updateBack = (patch: Partial<BookProject['backMatter']>) => {
    if (!book) return;
    setBook({ ...book, backMatter: { ...book.backMatter, ...patch } });
  };

  const handleSave = async () => {
    if (!book) return;
    setSaving(true);
    try {
      await saveBook(book);
      Alert.alert('Saved', 'Book structure updated.');
    } finally {
      setSaving(false);
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
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <SectionTitle title="Publication Info" />
        <Field label="Edition" value={book.settings.edition ?? ''} onChange={(v) => updateSettings({ edition: v })} />
        <Field label="Year" value={book.settings.year ?? ''} onChange={(v) => updateSettings({ year: v })} />
        <Field label="Publisher" value={book.settings.publisher ?? ''} onChange={(v) => updateSettings({ publisher: v })} />
        <MultilineField
          label="Copyright Notice"
          value={book.settings.copyrightNotice ?? ''}
          onChange={(v) => updateSettings({ copyrightNotice: v })}
          placeholder="© 2026 Your Name. All rights reserved."
        />

        <SectionTitle title="Typography" />
        <Text style={styles.subLabel}>Body Font</Text>
        <OptionRow
          options={[
            { value: 'georgia', label: 'Georgia' },
            { value: 'palatino', label: 'Palatino' },
            { value: 'times', label: 'Times' },
            { value: 'helvetica', label: 'Helvetica' },
          ]}
          selected={book.settings.fontFamily ?? 'georgia'}
          onSelect={(v) => updateSettings({ fontFamily: v as BookFont })}
        />
        <Text style={styles.subLabel}>Citation Style</Text>
        <OptionRow
          options={(Object.keys(CITATION_STYLE_LABELS) as CitationStyle[]).map((k) => ({ value: k, label: CITATION_STYLE_LABELS[k] }))}
          selected={book.settings.citationStyle ?? 'apa'}
          onSelect={(v) => updateSettings({ citationStyle: v as CitationStyle })}
        />

        <SectionTitle title="Cover Image" />
        <CoverImagePicker
          uri={book.settings.coverImageUri}
          onPick={async () => {
            const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85, base64: true });
            if (!r.canceled && r.assets[0]) {
              const a = r.assets[0];
              updateSettings({ coverImageUri: a.base64 ? `data:image/jpeg;base64,${a.base64}` : a.uri });
            }
          }}
          onRemove={() => updateSettings({ coverImageUri: undefined })}
        />

        <SectionTitle title="Page Layout" />
        <Text style={styles.subLabel}>Paper Size</Text>
        <OptionRow
          options={[
            { value: 'a4', label: 'A4' },
            { value: 'letter', label: 'US Letter' },
          ]}
          selected={book.settings.pageSize ?? 'a4'}
          onSelect={(v) => updateSettings({ pageSize: v as 'a4' | 'letter' })}
        />
        <Text style={styles.subLabel}>Margins</Text>
        <OptionRow
          options={[
            { value: 'narrow', label: 'Narrow' },
            { value: 'standard', label: 'Standard' },
            { value: 'wide', label: 'Wide' },
          ]}
          selected={book.settings.marginPreset ?? 'standard'}
          onSelect={(v) => updateSettings({ marginPreset: v as 'narrow' | 'standard' | 'wide' })}
        />
        <Toggle
          label="Running Header"
          value={book.settings.includeRunningHeader !== false}
          onChange={(v) => updateSettings({ includeRunningHeader: v })}
        />
        <Toggle
          label="Page Numbers (footer)"
          value={book.settings.includePageNumbers !== false}
          onChange={(v) => updateSettings({ includePageNumbers: v })}
        />
        <Text style={styles.subLabel}>Page Number Position</Text>
        <OptionRow
          options={[
            { value: 'outer', label: 'Outer (book style)' },
            { value: 'center', label: 'Center' },
          ]}
          selected={book.settings.pageNumberPlacement ?? 'outer'}
          onSelect={(v) => updateSettings({ pageNumberPlacement: v as 'outer' | 'center' })}
        />
        <Text style={styles.hintText}>
          Outer places numbers on the left for verso (even) pages and right for recto (odd) pages.
        </Text>
        <Field
          label="Header Title (optional override)"
          value={book.settings.headerText ?? ''}
          onChange={(v) => updateSettings({ headerText: v })}
        />

        <SectionTitle title="Front Matter" />
        <Toggle label="Title Page" value={book.settings.includeTitlePage} onChange={(v) => updateSettings({ includeTitlePage: v })} />
        <Toggle label="Copyright Page" value={book.settings.includeCopyrightPage} onChange={(v) => updateSettings({ includeCopyrightPage: v })} />
        <Toggle label="Table of Contents" value={book.settings.includeTableOfContents} onChange={(v) => updateSettings({ includeTableOfContents: v })} />
        <Toggle label="TOS Overview" value={book.settings.includeTosOverview} onChange={(v) => updateSettings({ includeTosOverview: v })} />
        <Toggle label="List of Figures" value={book.settings.includeListOfFigures} onChange={(v) => updateSettings({ includeListOfFigures: v })} />
        <MultilineField label="Dedication" value={book.frontMatter.dedication ?? ''} onChange={(v) => updateFront({ dedication: v })} />
        <MultilineField label="Foreword" value={book.frontMatter.foreword ?? ''} onChange={(v) => updateFront({ foreword: v })} />
        <MultilineField label="Preface" value={book.frontMatter.preface ?? ''} onChange={(v) => updateFront({ preface: v })} />
        <MultilineField label="Acknowledgments" value={book.frontMatter.acknowledgments ?? ''} onChange={(v) => updateFront({ acknowledgments: v })} />
        <MultilineField label="Introduction" value={book.frontMatter.introduction ?? ''} onChange={(v) => updateFront({ introduction: v })} />

        <Text style={styles.subLabel}>List of Abbreviations</Text>
        <KeyValueList
          entries={book.frontMatter.abbreviations}
          keyPlaceholder="e.g. DDC"
          valuePlaceholder="Dewey Decimal Classification"
          onChange={(entries) => updateFront({ abbreviations: entries })}
          keyField="abbr"
          valueField="meaning"
        />

        <SectionTitle title="Body & Chapters" />
        <Toggle label="Group by TOS Subject (Parts)" value={book.settings.groupBySubject} onChange={(v) => updateSettings({ groupBySubject: v })} />
        <Toggle label="Number Chapters" value={book.settings.numberChapters} onChange={(v) => updateSettings({ numberChapters: v })} />

        <SectionTitle title="Back Matter" />
        <Toggle label="References / Bibliography" value={book.settings.includeBibliography} onChange={(v) => updateSettings({ includeBibliography: v })} />
        <Toggle label="Glossary" value={book.settings.includeGlossary} onChange={(v) => updateSettings({ includeGlossary: v })} />
        <Toggle label="About the Author" value={book.settings.includeAboutAuthor} onChange={(v) => updateSettings({ includeAboutAuthor: v })} />

        <Text style={styles.subLabel}>Appendices</Text>
        {book.backMatter.appendices.map((app, i) => (
          <View key={app.id} style={styles.appendixCard}>
            <Field
              label={`Appendix ${String.fromCharCode(65 + i)} Title`}
              value={app.title}
              onChange={(v) => {
                const appendices = [...book.backMatter.appendices];
                appendices[i] = { ...app, title: v };
                updateBack({ appendices });
              }}
            />
            <MultilineField
              label="Content"
              value={app.content}
              onChange={(v) => {
                const appendices = [...book.backMatter.appendices];
                appendices[i] = { ...app, content: v };
                updateBack({ appendices });
              }}
            />
            <Button
              title="Remove Appendix"
              variant="danger"
              onPress={() =>
                updateBack({ appendices: book.backMatter.appendices.filter((a) => a.id !== app.id) })
              }
            />
          </View>
        ))}
        <Button
          title="Add Appendix"
          icon="add"
          variant="outline"
          onPress={() =>
            updateBack({
              appendices: [
                ...book.backMatter.appendices,
                { id: generateId(), title: '', content: '' },
              ],
            })
          }
        />

        <Text style={styles.subLabel}>Glossary Terms</Text>
        <KeyValueList
          entries={book.backMatter.glossary}
          keyPlaceholder="Term"
          valuePlaceholder="Definition"
          onChange={(entries) => updateBack({ glossary: entries })}
          keyField="term"
          valueField="definition"
        />

        <MultilineField
          label="About the Author"
          value={book.backMatter.aboutAuthor ?? ''}
          onChange={(v) => updateBack({ aboutAuthor: v })}
        />

        <Button
          title={saving ? 'Saving...' : 'Save Book Structure'}
          icon="save"
          onPress={handleSave}
          disabled={saving}
          style={styles.saveBtn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Input value={value} onChangeText={onChange} />
    </View>
  );
}

function MultilineField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.multiline}
        multiline
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        textAlignVertical="top"
      />
    </View>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.primary }} />
    </View>
  );
}

function OptionRow({
  options,
  selected,
  onSelect,
}: {
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <View style={styles.optionRow}>
      {options.map((opt) => (
        <Pressable
          key={opt.value}
          style={[styles.optionChip, selected === opt.value && styles.optionChipActive]}
          onPress={() => onSelect(opt.value)}
        >
          <Text
            style={[
              styles.optionChipText,
              selected === opt.value && styles.optionChipTextActive,
            ]}
          >
            {opt.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function KeyValueList<T extends object>({
  entries,
  keyPlaceholder,
  valuePlaceholder,
  onChange,
  keyField,
  valueField,
}: {
  entries: T[];
  keyPlaceholder: string;
  valuePlaceholder: string;
  onChange: (entries: T[]) => void;
  keyField: keyof T;
  valueField: keyof T;
}) {
  const getValue = (entry: T, field: keyof T) => String(entry[field] ?? '');

  return (
    <View style={styles.kvList}>
      {entries.map((entry, i) => (
        <View key={i} style={styles.kvRow}>
          <TextInput
            style={[styles.kvInput, styles.kvKey]}
            value={getValue(entry, keyField)}
            onChangeText={(t) => {
              const next = [...entries];
              next[i] = { ...entry, [keyField]: t } as T;
              onChange(next);
            }}
            placeholder={keyPlaceholder}
            placeholderTextColor={colors.textSecondary}
          />
          <TextInput
            style={[styles.kvInput, styles.kvValue]}
            value={getValue(entry, valueField)}
            onChangeText={(t) => {
              const next = [...entries];
              next[i] = { ...entry, [valueField]: t } as T;
              onChange(next);
            }}
            placeholder={valuePlaceholder}
            placeholderTextColor={colors.textSecondary}
          />
          <Pressable
            onPress={() => onChange(entries.filter((_, idx) => idx !== i))}
            hitSlop={8}
          >
            <Text style={styles.removeText}>✕</Text>
          </Pressable>
        </View>
      ))}
      <Button
        title="Add Entry"
        variant="outline"
        onPress={() =>
          onChange([...entries, { [keyField]: '', [valueField]: '' } as T])
        }
      />
    </View>
  );
}

function CoverImagePicker({ uri, onPick, onRemove }: { uri?: string; onPick: () => void; onRemove: () => void }) {
  return (
    <View style={styles.coverPicker}>
      {uri ? (
        <View style={styles.coverPreview}>
          <Image source={{ uri }} style={styles.coverImage} resizeMode="cover" />
          <View style={styles.coverBtns}>
            <Button title="Change" onPress={onPick} variant="outline" size="sm" />
            <Button title="Remove" onPress={onRemove} variant="danger" size="sm" />
          </View>
        </View>
      ) : (
        <Pressable style={styles.coverPlaceholder} onPress={onPick}>
          <Text style={styles.coverPlaceholderText}>Tap to add a cover image</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl * 3 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: colors.accent,
    paddingBottom: 4,
  },
  subLabel: { fontSize: 14, fontWeight: '600', color: colors.text, marginTop: spacing.md, marginBottom: spacing.sm },
  hintText: { fontSize: 12, color: colors.textSecondary, marginBottom: spacing.md, lineHeight: 18 },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  optionChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  optionChipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  optionChipTextActive: { color: '#fff' },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  field: { marginBottom: spacing.md },
  multiline: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.md,
    minHeight: 100,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  toggleLabel: { fontSize: 14, color: colors.text, flex: 1 },
  appendixCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  kvList: { gap: spacing.sm, marginBottom: spacing.md },
  kvRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  kvInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    fontSize: 13,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  kvKey: { width: 80 },
  kvValue: { flex: 1 },
  removeText: { color: colors.danger, fontSize: 18, padding: spacing.sm },
  saveBtn: { marginTop: spacing.xl },
  coverPicker: { marginBottom: spacing.md },
  coverPreview: { gap: spacing.sm },
  coverImage: { width: '100%', height: 180, borderRadius: 12 },
  coverBtns: { flexDirection: 'row', gap: spacing.sm },
  coverPlaceholder: {
    height: 120, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.border,
    borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  coverPlaceholderText: { color: colors.textSecondary, fontSize: 14 },
});
