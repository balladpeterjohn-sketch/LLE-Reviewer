import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { findTopic } from '../../src/data/tosSubjects';
import { createMaterial } from '../../src/services/storage';
import { Button, Input } from '../../src/components/ui';
import { colors, spacing } from '../../src/theme';

export default function NewMaterialScreen() {
  const { subjectId, topicId } = useLocalSearchParams<{
    subjectId: string;
    topicId: string;
  }>();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const topicInfo = findTopic(subjectId ?? '', topicId ?? '');

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Title required', 'Please enter a title for this reading material.');
      return;
    }
    if (!subjectId || !topicId) return;

    setSaving(true);
    try {
      const material = await createMaterial({
        title: title.trim(),
        subjectId,
        topicId,
      });
      router.replace(`/material/${material.id}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {topicInfo && (
        <View style={styles.topicInfo}>
          <Text style={styles.topicLabel}>TOS Topic</Text>
          <Text style={styles.topicText}>
            {topicInfo.topic.code} — {topicInfo.topic.title}
          </Text>
          <Text style={styles.subjectText}>{topicInfo.subject.title}</Text>
        </View>
      )}

      <Text style={styles.label}>Material Title</Text>
      <Input
        placeholder="e.g., Principles of Library Management"
        value={title}
        onChangeText={setTitle}
        autoFocus
      />

      <Button
        title={saving ? 'Creating...' : 'Create & Start Writing'}
        icon="create"
        onPress={handleCreate}
        disabled={saving}
        style={styles.createBtn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  topicInfo: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  topicLabel: { fontSize: 11, fontWeight: '700', color: colors.accent, letterSpacing: 1 },
  topicText: { fontSize: 15, fontWeight: '600', color: colors.text, marginTop: 4 },
  subjectText: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  createBtn: { marginTop: spacing.lg },
});
