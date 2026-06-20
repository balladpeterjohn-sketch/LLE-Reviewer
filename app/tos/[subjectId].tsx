import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { findSubject } from '../../src/data/tosSubjects';
import { Card } from '../../src/components/ui';
import { colors, spacing } from '../../src/theme';

export default function SubjectScreen() {
  const { subjectId } = useLocalSearchParams<{ subjectId: string }>();
  const router = useRouter();
  const subject = findSubject(subjectId ?? '');

  if (!subject) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Subject not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.weightBadge}>
          <Text style={styles.weightText}>{subject.weight}%</Text>
        </View>
        <Text style={styles.description}>{subject.description}</Text>
        <Text style={styles.examDay}>Exam Day {subject.examDay}</Text>
      </View>

      <Text style={styles.sectionTitle}>Course Outline</Text>
      {subject.topics.map((topic) => (
        <View key={topic.id}>
          <Pressable
            onPress={() => router.push(`/tos/${subject.id}/${topic.id}`)}
          >
            <Card style={styles.topicCard}>
              <View style={styles.topicRow}>
                <Text style={styles.topicCode}>{topic.code}</Text>
                <Text style={styles.topicTitle}>{topic.title}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </View>
            </Card>
          </Pressable>
          {topic.children?.map((child) => (
            <Pressable
              key={child.id}
              onPress={() => router.push(`/tos/${subject.id}/${child.id}`)}
            >
              <Card style={styles.childCard}>
                <View style={styles.topicRow}>
                  <Text style={styles.childCode}>{child.code}</Text>
                  <Text style={styles.childTitle}>{child.title}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                </View>
              </Card>
            </Pressable>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error: { color: colors.danger, fontSize: 16 },
  header: { marginBottom: spacing.lg },
  weightBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  weightText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  description: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  examDay: { fontSize: 12, color: colors.accent, fontWeight: '600', marginTop: spacing.sm },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  topicCard: { marginBottom: spacing.xs },
  childCard: { marginBottom: spacing.xs, marginLeft: spacing.lg },
  topicRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  topicCode: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    minWidth: 28,
  },
  topicTitle: { flex: 1, fontSize: 15, fontWeight: '500', color: colors.text },
  childCode: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryLight,
    minWidth: 36,
  },
  childTitle: { flex: 1, fontSize: 14, color: colors.text },
});
