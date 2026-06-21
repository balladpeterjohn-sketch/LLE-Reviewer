import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TOS_SUBJECTS } from '../../src/data/tosSubjects';
import { getMaterialsBySubject } from '../../src/services/storage';
import { useTheme } from '../../src/contexts/ThemeContext';
import { radius, shadow, spacing, typography } from '../../src/theme';

export default function TosScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [coverage, setCoverage] = useState<Map<string, Set<string>>>(new Map());

  useFocusEffect(useCallback(() => {
    getMaterialsBySubject().then(setCoverage);
  }, []));

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content:   { padding: spacing.md, gap: spacing.sm, paddingBottom: 80 },
    intro:     { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xs },
    dayLabel:  { ...typography.micro, color: colors.accent, textTransform: 'uppercase', marginTop: spacing.md, marginBottom: spacing.xs },

    card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: spacing.sm, ...shadow.sm },
    cardTop:  { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    weightChip: { backgroundColor: colors.primary, paddingHorizontal: spacing.sm + 2, paddingVertical: 4, borderRadius: radius.full },
    weightText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    cardTitle:  { ...typography.label, color: colors.text, fontWeight: '700', flex: 1 },
    cardDesc:   { ...typography.caption, color: colors.textSecondary, lineHeight: 18 },
    covRow:     { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    covTrack:   { flex: 1, height: 5, backgroundColor: colors.border, borderRadius: radius.full, overflow: 'hidden' },
    covFill:    { height: 5, borderRadius: radius.full },
    covLabel:   { fontSize: 12, fontWeight: '700', minWidth: 36, textAlign: 'right' },
    covCount:   { ...typography.caption, color: colors.textSecondary },
  });

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <Text style={s.intro}>
        Organize reading materials by subject and topic per the official PRC Table of Specifications.
      </Text>

      {[{ label: 'Day 1', subjects: TOS_SUBJECTS.filter((s) => s.examDay === 1) },
        { label: 'Day 2', subjects: TOS_SUBJECTS.filter((s) => s.examDay === 2) }].map(({ label, subjects }) => (
        <View key={label}>
          <Text style={s.dayLabel}>{label}</Text>
          {subjects.map((sub) => {
            const covered   = coverage.get(sub.id)?.size ?? 0;
            const total     = sub.topics.reduce((a, t) => a + 1 + (t.children?.length ?? 0), 0);
            const pct       = total > 0 ? Math.round((covered / total) * 100) : 0;
            const fillColor = pct === 100 ? colors.success : pct > 0 ? colors.accent : colors.border;

            return (
              <Pressable key={sub.id} onPress={() => router.push(`/tos/${sub.id}`)}>
                <View style={s.card}>
                  <View style={s.cardTop}>
                    <View style={s.weightChip}><Text style={s.weightText}>{sub.weight}%</Text></View>
                    <Text style={s.cardTitle} numberOfLines={2}>{sub.title}</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                  </View>
                  <Text style={s.cardDesc} numberOfLines={2}>{sub.description}</Text>
                  <View style={s.covRow}>
                    <View style={s.covTrack}>
                      <View style={[s.covFill, { width: `${pct}%` as any, backgroundColor: fillColor }]} />
                    </View>
                    <Text style={[s.covLabel, { color: fillColor }]}>{pct}%</Text>
                    <Text style={s.covCount}>{covered}/{total}</Text>
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
