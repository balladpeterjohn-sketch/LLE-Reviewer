import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ContentRenderer } from '../../../src/components/ContentRenderer';
import { findTopic } from '../../../src/data/tosSubjects';
import { getMaterial } from '../../../src/services/storage';
import { colors, spacing } from '../../../src/theme';
import { ReadingMaterial } from '../../../src/types';

export default function MaterialPreviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [material, setMaterial] = useState<ReadingMaterial | null>(null);

  const load = useCallback(() => {
    if (id) getMaterial(id).then((m) => setMaterial(m ?? null));
  }, [id]);

  useFocusEffect(load);

  const topicInfo = material ? findTopic(material.subjectId, material.topicId) : undefined;

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.toolbarTitle}>Material Preview</Text>
        <View style={styles.spacer} />
      </View>
      {!material ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>{material.title}</Text>
          {topicInfo && (
            <Text style={styles.topic}>
              {topicInfo.subject.title} › {topicInfo.topic.code} {topicInfo.topic.title}
            </Text>
          )}
          <ContentRenderer blocks={material.blocks} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, width: 80 },
  backText: { color: '#fff', fontSize: 15 },
  toolbarTitle: { color: '#fff', fontSize: 16, fontWeight: '600', flex: 1, textAlign: 'center' },
  spacer: { width: 80 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  title: { fontSize: 22, fontWeight: '700', color: colors.primary, marginBottom: spacing.sm },
  topic: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.lg, fontStyle: 'italic' },
});
