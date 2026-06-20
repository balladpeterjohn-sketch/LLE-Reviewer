import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { findTopic } from '../../src/data/tosSubjects';
import { createMaterial } from '../../src/services/storage';
import { Button, Input } from '../../src/components/ui';
import { colors, spacing } from '../../src/theme';
import { param } from '../../src/utils/id';

export default function NewMaterialScreen() {
  const { subjectId: rawSubjectId, topicId: rawTopicId } = useLocalSearchParams<{
    subjectId: string | string[];
    topicId: string | string[];
  }>();
  const subjectId = param(rawSubjectId);
  const topicId = param(rawTopicId);
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const topicInfo = findTopic(subjectId, topicId);

  const handleCreate = async () => {
    Keyboard.dismiss();

    if (!title.trim()) {
      Alert.alert('Title required', 'Please enter a title for this reading material.');
      return;
    }

    if (!subjectId || !topicId) {
      Alert.alert(
        'Topic not found',
        'Please go back to the TOS tab, pick a subject and topic, then add material from there.'
      );
      return;
    }

    setSaving(true);
    try {
      const material = await createMaterial({
        title: title.trim(),
        subjectId,
        topicId,
      });
      router.replace(`/material/${material.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not create material.';
      Alert.alert('Error', message);
    } finally {
      setSaving(false);
    }
  };

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
        {topicInfo ? (
          <View style={styles.topicInfo}>
            <Text style={styles.topicLabel}>TOS Topic</Text>
            <Text style={styles.topicText}>
              {topicInfo.topic.code} — {topicInfo.topic.title}
            </Text>
            <Text style={styles.subjectText}>{topicInfo.subject.title}</Text>
          </View>
        ) : (
          <View style={styles.topicInfo}>
            <Text style={styles.warning}>
              No TOS topic selected. Go to TOS → pick a subject → pick a topic → Add Reading
              Material.
            </Text>
          </View>
        )}

        <Text style={styles.label}>Material Title</Text>
        <Input
          placeholder="e.g., Principles of Library Management"
          value={title}
          onChangeText={setTitle}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleCreate}
        />

        <Button
          title={saving ? 'Creating...' : 'Create & Start Writing'}
          icon="create"
          onPress={handleCreate}
          disabled={saving}
          style={styles.createBtn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
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
  warning: { fontSize: 13, color: colors.danger, lineHeight: 20 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  createBtn: { marginTop: spacing.lg },
});
