import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { createCitation } from '../../src/services/storage';
import { Button, Input } from '../../src/components/ui';
import { colors, spacing } from '../../src/theme';
import { CitationType } from '../../src/types';

const CITATION_TYPES: { value: CitationType; label: string }[] = [
  { value: 'book', label: 'Book' },
  { value: 'journal', label: 'Journal Article' },
  { value: 'website', label: 'Website' },
  { value: 'thesis', label: 'Thesis/Dissertation' },
  { value: 'report', label: 'Report' },
  { value: 'other', label: 'Other' },
];

export default function NewCitationScreen() {
  const router = useRouter();
  const [type, setType] = useState<CitationType>('book');
  const [authors, setAuthors] = useState('');
  const [title, setTitle] = useState('');
  const [year, setYear] = useState('');
  const [publisher, setPublisher] = useState('');
  const [place, setPlace] = useState('');
  const [edition, setEdition] = useState('');
  const [journal, setJournal] = useState('');
  const [volume, setVolume] = useState('');
  const [issue, setIssue] = useState('');
  const [pages, setPages] = useState('');
  const [url, setUrl] = useState('');
  const [accessDate, setAccessDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!authors.trim() || !title.trim()) {
      Alert.alert('Required fields', 'Authors and title are required.');
      return;
    }
    setSaving(true);
    try {
      await createCitation({
        type,
        authors: authors.trim(),
        title: title.trim(),
        year: year.trim(),
        publisher: publisher.trim() || undefined,
        place: place.trim() || undefined,
        edition: edition.trim() || undefined,
        journal: journal.trim() || undefined,
        volume: volume.trim() || undefined,
        issue: issue.trim() || undefined,
        pages: pages.trim() || undefined,
        url: url.trim() || undefined,
        accessDate: accessDate.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      router.back();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Source Type</Text>
      <View style={styles.typeRow}>
        {CITATION_TYPES.map((t) => (
          <Pressable
            key={t.value}
            style={[styles.typeChip, type === t.value && styles.typeChipActive]}
            onPress={() => setType(t.value)}
          >
            <Text style={[styles.typeChipText, type === t.value && styles.typeChipTextActive]}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Field label="Author(s) *" value={authors} onChangeText={setAuthors} placeholder="Surname, First Name" />
      <Field label="Title *" value={title} onChangeText={setTitle} placeholder="Title of the work" />
      <Field label="Year" value={year} onChangeText={setYear} placeholder="2024" />

      {(type === 'book' || type === 'thesis' || type === 'report') && (
        <>
          <Field label="Publisher" value={publisher} onChangeText={setPublisher} />
          <Field label="Place of Publication" value={place} onChangeText={setPlace} />
          {type === 'book' && (
            <Field label="Edition" value={edition} onChangeText={setEdition} placeholder="2nd" />
          )}
        </>
      )}

      {type === 'journal' && (
        <>
          <Field label="Journal Name" value={journal} onChangeText={setJournal} />
          <Field label="Volume" value={volume} onChangeText={setVolume} />
          <Field label="Issue" value={issue} onChangeText={setIssue} />
          <Field label="Pages" value={pages} onChangeText={setPages} placeholder="45-67" />
        </>
      )}

      {type === 'website' && (
        <>
          <Field label="URL" value={url} onChangeText={setUrl} placeholder="https://..." />
          <Field label="Access Date" value={accessDate} onChangeText={setAccessDate} placeholder="June 20, 2026" />
        </>
      )}

      <Field label="Notes" value={notes} onChangeText={setNotes} placeholder="Additional notes..." multiline />

      <Button
        title={saving ? 'Saving...' : 'Save Citation'}
        icon="save"
        onPress={handleSave}
        disabled={saving}
        style={styles.saveBtn}
      />
    </ScrollView>
  );
}

function Field({
  label,
  ...props
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Input {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  typeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  typeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeChipText: { fontSize: 13, color: colors.text },
  typeChipTextActive: { color: '#fff', fontWeight: '600' },
  field: { marginBottom: spacing.md },
  saveBtn: { marginTop: spacing.md },
});
