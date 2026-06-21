import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ContentEditor } from '../../src/components/ContentEditor';
import { findTopic } from '../../src/data/tosSubjects';
import { deleteMaterial, duplicateMaterial, getMaterial, saveMaterial } from '../../src/services/storage';
import { Button, Input } from '../../src/components/ui';
import { useTheme } from '../../src/contexts/ThemeContext';
import { spacing } from '../../src/theme';
import { ContentBlock, ReadingMaterial } from '../../src/types';

export default function EditMaterialScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const [material, setMaterial] = useState<ReadingMaterial | null>(null);
  const [title, setTitle] = useState('');
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [saving, setSaving] = useState(false);
  const [duplicating, setDuplicating] = useState(false);

  const load = useCallback(() => {
    if (id) {
      getMaterial(id).then((m) => {
        if (m) { setMaterial(m); setTitle(m.title); setBlocks(m.blocks); }
      });
    }
  }, [id]);

  useFocusEffect(load);

  const topicInfo = material ? findTopic(material.subjectId, material.topicId) : undefined;

  const collectCitationIds = (blockList: ContentBlock[]): string[] => {
    const ids = new Set<string>();
    blockList.forEach((b) => { if (b.citationId) ids.add(b.citationId); });
    return Array.from(ids);
  };

  const handleSave = async () => {
    if (!material || !title.trim()) {
      Alert.alert('Title required', 'Please enter a title.');
      return;
    }
    setSaving(true);
    try {
      await saveMaterial({ ...material, title: title.trim(), blocks, citationIds: collectCitationIds(blocks) });
      Alert.alert('Saved', 'Reading material saved.');
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async () => {
    if (!material) return;
    setDuplicating(true);
    try {
      const copy = await duplicateMaterial(material.id);
      if (copy) {
        Alert.alert('Duplicated', `"${copy.title}" created.`, [
          { text: 'Edit copy', onPress: () => router.replace(`/material/${copy.id}`) },
          { text: 'Stay here', style: 'cancel' },
        ]);
      }
    } finally {
      setDuplicating(false);
    }
  };

  const handleDelete = () => {
    if (!material) return;
    Alert.alert('Delete Material', `Remove "${material.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteMaterial(material.id); router.back(); } },
    ]);
  };

  if (!material) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <Text style={{ color: colors.textSecondary }}>Loading…</Text>
      </View>
    );
  }

  const styles = StyleSheet.create({
    flex: { flex: 1 },
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md, paddingBottom: 120, gap: spacing.sm },
    topicBadge: {
      fontSize: 12, color: colors.primary, backgroundColor: colors.backgroundDeep,
      padding: spacing.sm, borderRadius: 8,
      borderWidth: 1, borderColor: colors.borderLight,
    },
    label: { fontSize: 13, fontWeight: '700', color: colors.text },
    hint: { fontSize: 11, color: colors.textSecondary, marginTop: 2, lineHeight: 16 },
    actions: { gap: spacing.sm, marginTop: spacing.sm },
    actionRow: { flexDirection: 'row', gap: spacing.sm },
  });

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {topicInfo && (
          <Text style={styles.topicBadge}>
            {topicInfo.subject.title} › {topicInfo.topic.code} {topicInfo.topic.title}
          </Text>
        )}

        <Text style={styles.label}>Title</Text>
        <Input
          value={title}
          onChangeText={setTitle}
          placeholder="Material title"
          style={{ backgroundColor: colors.surfaceGlass, borderColor: colors.border, color: colors.text }}
        />

        <Text style={[styles.label, { marginTop: spacing.md }]}>Content</Text>
        <Text style={styles.hint}>
          Tip: Use **bold**, *italic*, __underline__, ==highlight==, ~~strikethrough~~ in text blocks.
        </Text>
        <ContentEditor blocks={blocks} onChange={setBlocks} />

        <View style={styles.actions}>
          <View style={styles.actionRow}>
            <Button
              title="Preview"
              icon="eye-outline"
              variant="outline"
              onPress={() => router.push(`/material/${material.id}/preview`)}
              style={{ flex: 1 }}
            />
            <Button
              title={duplicating ? 'Copying…' : 'Duplicate'}
              icon="copy-outline"
              variant="ghost"
              onPress={handleDuplicate}
              disabled={duplicating}
              style={{ flex: 1 }}
            />
          </View>
          <Button
            title={saving ? 'Saving…' : 'Save Material'}
            icon="save-outline"
            onPress={handleSave}
            disabled={saving}
          />
          <Button title="Delete" icon="trash-outline" variant="danger" onPress={handleDelete} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
