import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ContentEditor } from '../../src/components/ContentEditor';
import { findTopic } from '../../src/data/tosSubjects';
import { deleteMaterial, getMaterial, saveMaterial } from '../../src/services/storage';
import { Button, Input } from '../../src/components/ui';
import { colors, spacing } from '../../src/theme';
import { ContentBlock, ReadingMaterial } from '../../src/types';

export default function EditMaterialScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [material, setMaterial] = useState<ReadingMaterial | null>(null);
  const [title, setTitle] = useState('');
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    if (id) {
      getMaterial(id).then((m) => {
        if (m) {
          setMaterial(m);
          setTitle(m.title);
          setBlocks(m.blocks);
        }
      });
    }
  }, [id]);

  useFocusEffect(load);

  const topicInfo = material
    ? findTopic(material.subjectId, material.topicId)
    : undefined;

  const collectCitationIds = (blockList: ContentBlock[]): string[] => {
    const ids = new Set<string>();
    blockList.forEach((b) => {
      if (b.citationId) ids.add(b.citationId);
    });
    return Array.from(ids);
  };

  const handleSave = async () => {
    if (!material || !title.trim()) {
      Alert.alert('Title required', 'Please enter a title.');
      return;
    }
    setSaving(true);
    try {
      await saveMaterial({
        ...material,
        title: title.trim(),
        blocks,
        citationIds: collectCitationIds(blocks),
      });
      Alert.alert('Saved', 'Reading material saved successfully.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!material) return;
    Alert.alert('Delete Material', `Remove "${material.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteMaterial(material.id);
          router.back();
        },
      },
    ]);
  };

  if (!material) {
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
        {topicInfo && (
          <Text style={styles.topicBadge}>
            {topicInfo.subject.title} › {topicInfo.topic.code} {topicInfo.topic.title}
          </Text>
        )}

        <Text style={styles.label}>Title</Text>
        <Input value={title} onChangeText={setTitle} placeholder="Material title" />

        <Text style={[styles.label, styles.editorLabel]}>Content</Text>
        <ContentEditor blocks={blocks} onChange={setBlocks} />

        <View style={styles.actions}>
          <Button
            title="Preview"
            icon="eye"
            variant="outline"
            onPress={() => router.push(`/material/${material.id}/preview`)}
          />
          <Button
            title={saving ? 'Saving...' : 'Save Material'}
            icon="save"
            onPress={handleSave}
            disabled={saving}
          />
          <Button title="Delete" icon="trash" variant="danger" onPress={handleDelete} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topicBadge: {
    fontSize: 12,
    color: colors.primary,
    backgroundColor: '#E8F0EC',
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: spacing.sm, marginTop: spacing.sm },
  editorLabel: { marginTop: spacing.lg },
  actions: { gap: spacing.sm, marginTop: spacing.lg },
});
