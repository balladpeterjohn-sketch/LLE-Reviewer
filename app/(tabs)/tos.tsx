import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TOS_SUBJECTS } from '../../src/data/tosSubjects';
import { getMaterialsBySubject } from '../../src/services/storage';
import { useTheme } from '../../src/contexts/ThemeContext';
import { spacing } from '../../src/theme';

export default function TosScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [coverage, setCoverage] = useState<Map<string, Set<string>>>(new Map());

  useFocusEffect(useCallback(() => {
    getMaterialsBySubject().then(setCoverage);
  }, []));

  const day1 = TOS_SUBJECTS.filter((s) => s.examDay === 1);
  const day2 = TOS_SUBJECTS.filter((s) => s.examDay === 2);

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xl },
    intro: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: spacing.sm },
    dayLabel: {
      fontSize: 12, fontWeight: '700', color: colors.accent,
      textTransform: 'uppercase', letterSpacing: 1.2,
      marginTop: spacing.md, marginBottom: spacing.xs,
    },
    card: {
      backgroundColor: colors.surfaceGlass, borderRadius: 16,
      padding: spacing.md,
      borderWidth: 1, borderColor: colors.borderGlass,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
      marginBottom: spacing.xs,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
    cardLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
    weightBadge: {
      backgroundColor: colors.primary, paddingHorizontal: spacing.sm + 2,
      paddingVertical: spacing.xs, borderRadius: 10,
    },
    weightText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text, flex: 1 },
    cardDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 18, marginBottom: spacing.sm },
    cardMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    topicCount: { fontSize: 12, color: colors.textSecondary },
    coverageRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    progressTrack: { flex: 1, height: 5, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: 5, borderRadius: 3 },
    coverageLabel: { fontSize: 12, fontWeight: '700', minWidth: 32, textAlign: 'right' },
  });

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <Text style={s.intro}>
        Organize reading materials by subject and topic per the official Table of Specifications.
      </Text>

      {[
        { label: 'Day 1 — Examination', subjects: day1 },
        { label: 'Day 2 — Examination', subjects: day2 },
      ].map(({ label, subjects }) => (
        <View key={label}>
          <Text style={s.dayLabel}>{label}</Text>
          {subjects.map((subject) => {
            const topicIds = coverage.get(subject.id);
            const totalTopics = subject.topics.reduce((a, t) => a + 1 + (t.children?.length ?? 0), 0);
            const covered = topicIds?.size ?? 0;
            const pct = totalTopics > 0 ? Math.round((covered / totalTopics) * 100) : 0;
            const coverageColor = pct === 100 ? colors.success : pct > 0 ? colors.accent : colors.border;

            return (
              <Pressable key={subject.id} onPress={() => router.push(`/tos/${subject.id}`)}>
                <View style={s.card}>
                  <View style={s.cardHeader}>
                    <View style={s.cardLeft}>
                      <View style={s.weightBadge}>
                        <Text style={s.weightText}>{subject.weight}%</Text>
                      </View>
                      <Text style={s.cardTitle} numberOfLines={2}>{subject.title}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                  </View>
                  <Text style={s.cardDesc} numberOfLines={2}>{subject.description}</Text>
                  <View style={s.coverageRow}>
                    <View style={s.progressTrack}>
                      <View style={[s.progressFill, { width: `${pct}%` as any, backgroundColor: coverageColor }]} />
                    </View>
                    <Text style={[s.coverageLabel, { color: coverageColor }]}>{pct}%</Text>
                    <Text style={s.topicCount}>{covered}/{totalTopics} topics</Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}
