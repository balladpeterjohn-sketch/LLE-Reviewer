import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TOS_SUBJECTS } from '../../src/data/tosSubjects';
import { Card } from '../../src/components/ui';
import { colors, spacing } from '../../src/theme';

export default function TosScreen() {
  const router = useRouter();

  const day1 = TOS_SUBJECTS.filter((s) => s.examDay === 1);
  const day2 = TOS_SUBJECTS.filter((s) => s.examDay === 2);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.intro}>
        Organize your reviewer materials by subject and topic according to the official
        Table of Specifications.
      </Text>

      <Text style={styles.dayLabel}>Day 1 — September 10</Text>
      {day1.map((subject) => (
        <SubjectCard
          key={subject.id}
          subject={subject}
          onPress={() => router.push(`/tos/${subject.id}`)}
        />
      ))}

      <Text style={styles.dayLabel}>Day 2 — September 11</Text>
      {day2.map((subject) => (
        <SubjectCard
          key={subject.id}
          subject={subject}
          onPress={() => router.push(`/tos/${subject.id}`)}
        />
      ))}
    </ScrollView>
  );
}

function SubjectCard({
  subject,
  onPress,
}: {
  subject: (typeof TOS_SUBJECTS)[0];
  onPress: () => void;
}) {
  const topicCount = subject.topics.reduce(
    (acc, t) => acc + 1 + (t.children?.length ?? 0),
    0
  );

  return (
    <Pressable onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.weightBadge}>
            <Text style={styles.weightText}>{subject.weight}%</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </View>
        <Text style={styles.cardTitle}>{subject.title}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>
          {subject.description}
        </Text>
        <Text style={styles.topicCount}>{topicCount} topics</Text>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xl },
  intro: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  dayLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  card: { marginBottom: spacing.sm },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  weightBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  weightText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 },
  cardDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  topicCount: { fontSize: 12, color: colors.accent, marginTop: spacing.sm, fontWeight: '500' },
});
