import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { createBook } from '../../src/services/storage';
import { Button, Input } from '../../src/components/ui';
import { colors, spacing } from '../../src/theme';

export default function NewBookScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [author, setAuthor] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!title.trim() || !author.trim()) {
      Alert.alert('Required fields', 'Book title and compiler name are required.');
      return;
    }
    setSaving(true);
    try {
      const book = await createBook({
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        author: author.trim(),
      });
      router.replace(`/book/${book.id}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.intro}>
        Create a book project to compile your reading materials into a complete LLE reviewer
        with bibliography and PDF export.
      </Text>

      <Text style={styles.label}>Book Title *</Text>
      <Input
        placeholder="e.g., Comprehensive LLE Reviewer 2026"
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>Subtitle</Text>
      <Input
        placeholder="e.g., Based on PRC Table of Specifications"
        value={subtitle}
        onChangeText={setSubtitle}
        style={styles.field}
      />

      <Text style={styles.label}>Compiled By *</Text>
      <Input placeholder="Your name" value={author} onChangeText={setAuthor} style={styles.field} />

      <Button
        title={saving ? 'Creating...' : 'Create Book Project'}
        icon="book"
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
  intro: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: spacing.lg },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: spacing.sm, marginTop: spacing.sm },
  field: { marginBottom: spacing.sm },
  createBtn: { marginTop: spacing.lg },
});
