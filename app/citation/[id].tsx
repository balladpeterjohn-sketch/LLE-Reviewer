import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getCitation, saveCitation } from '../../src/services/storage';
import { Button, Input } from '../../src/components/ui';
import { colors, spacing } from '../../src/theme';
import { Citation, CitationType } from '../../src/types';
import { formatCitation } from '../../src/utils/citation';

const CITATION_TYPES: CitationType[] = ['book', 'journal', 'website', 'thesis', 'report', 'other'];

export default function EditCitationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [citation, setCitation] = useState<Citation | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    if (id) getCitation(id).then((c) => setCitation(c ?? null));
  }, [id]);

  useFocusEffect(load);

  const update = (patch: Partial<Citation>) => {
    if (citation) setCitation({ ...citation, ...patch });
  };

  const handleSave = async () => {
    if (!citation) return;
    if (!citation.authors.trim() || !citation.title.trim()) {
      Alert.alert('Required fields', 'Authors and title are required.');
      return;
    }
    setSaving(true);
    try {
      await saveCitation(citation);
      Alert.alert('Saved', 'Citation updated.');
    } finally {
      setSaving(false);
    }
  };

  if (!citation) {
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Source Type</Text>
      <View style={styles.typeRow}>
        {CITATION_TYPES.map((t) => (
          <Pressable
            key={t}
            style={[styles.typeChip, citation.type === t && styles.typeChipActive]}
            onPress={() => update({ type: t })}
          >
            <Text style={[styles.typeChipText, citation.type === t && styles.typeChipTextActive]}>
              {t}
            </Text>
          </Pressable>
        ))}
      </View>

      <Field label="Author(s)" value={citation.authors} onChange={(v) => update({ authors: v })} />
      <Field label="Title" value={citation.title} onChange={(v) => update({ title: v })} />
      <Field label="Year" value={citation.year} onChange={(v) => update({ year: v })} />
      <Field label="Publisher" value={citation.publisher ?? ''} onChange={(v) => update({ publisher: v })} />
      <Field label="Place" value={citation.place ?? ''} onChange={(v) => update({ place: v })} />
      <Field label="Journal" value={citation.journal ?? ''} onChange={(v) => update({ journal: v })} />
      <Field label="URL" value={citation.url ?? ''} onChange={(v) => update({ url: v })} />
      <Field label="Notes" value={citation.notes ?? ''} onChange={(v) => update({ notes: v })} />

      <View style={styles.preview}>
        <Text style={styles.previewLabel}>Formatted Citation</Text>
        <Text style={styles.previewText}>{formatCitation(citation)}</Text>
      </View>

      <Button
        title={saving ? 'Saving...' : 'Save Changes'}
        icon="save"
        onPress={handleSave}
        disabled={saving}
      />
    </ScrollView>
  );
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  typeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeChipText: { fontSize: 13, color: colors.text, textTransform: 'capitalize' },
  typeChipTextActive: { color: '#fff', fontWeight: '600' },
  field: { marginBottom: spacing.md },
  preview: {
    backgroundColor: '#E8F0EC',
    padding: spacing.md,
    borderRadius: 10,
    marginBottom: spacing.lg,
  },
  previewLabel: { fontSize: 12, fontWeight: '600', color: colors.primary, marginBottom: spacing.sm },
  previewText: { fontSize: 13, color: colors.text, fontStyle: 'italic', lineHeight: 20 },
});
