import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { findTopic } from '../../../src/data/tosSubjects';
import { getMaterialsByTopic } from '../../../src/services/storage';
import { Button, Card, EmptyState } from '../../../src/components/ui';
import { colors, spacing } from '../../../src/theme';
import { ReadingMaterial } from '../../../src/types';
import { getMaterialPreview } from '../../../src/utils/bookExport';

export default function TopicScreen() {
  const { subjectId, topicId } = useLocalSearchParams<{
    subjectId: string;
    topicId: string;
  }>();
  const router = useRouter();
  const [materials, setMaterials] = useState<ReadingMaterial[]>([]);

  const topicInfo = findTopic(subjectId ?? '', topicId ?? '');

  const load = useCallback(() => {
    if (subjectId && topicId) {
      getMaterialsByTopic(subjectId, topicId).then(setMaterials);
    }
  }, [subjectId, topicId]);

  useFocusEffect(load);

  if (!topicInfo) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Topic not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.topicCode}>{topicInfo.topic.code}</Text>
        <Text style={styles.topicTitle}>{topicInfo.topic.title}</Text>
        <Text style={styles.subjectName}>{topicInfo.subject.title}</Text>
        <Button
          title="Add Reading Material"
          icon="add"
          onPress={() =>
            router.push({
              pathname: '/material/new',
              params: { subjectId, topicId },
            })
          }
        />
      </View>

      {materials.length === 0 ? (
        <EmptyState
          icon="document-text-outline"
          title="No materials for this topic"
          message="Start compiling reading materials aligned with this TOS topic."
        />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {materials.map((m) => (
            <Pressable key={m.id} onPress={() => router.push(`/material/${m.id}`)}>
              <Card style={styles.card}>
                <View style={styles.cardRow}>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>{m.title}</Text>
                    <Text style={styles.preview} numberOfLines={2}>
                      {getMaterialPreview(m)}
                    </Text>
                    <Text style={styles.blockCount}>
                      {m.blocks.length} block{m.blocks.length !== 1 ? 's' : ''}
                      {m.citationIds.length > 0 &&
                        ` · ${m.citationIds.length} citation${m.citationIds.length !== 1 ? 's' : ''}`}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </View>
              </Card>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error: { color: colors.danger, fontSize: 16 },
  header: {
    padding: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  topicCode: { fontSize: 14, fontWeight: '700', color: colors.primary },
  topicTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  subjectName: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.sm },
  list: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xl },
  card: { marginBottom: spacing.xs },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  preview: { fontSize: 13, color: colors.textSecondary, marginTop: 4, lineHeight: 18 },
  blockCount: { fontSize: 11, color: colors.accent, marginTop: spacing.sm },
});
