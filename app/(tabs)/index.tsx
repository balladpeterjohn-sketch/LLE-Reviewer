import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TOS_SUBJECTS } from '../../src/data/tosSubjects';
import { getMaterials, getStats } from '../../src/services/storage';
import { Button, GlassCard } from '../../src/components/ui';
import { colors, spacing } from '../../src/theme';

export default function HomeScreen() {
  const router = useRouter();
  const [stats, setStats] = useState({ materials: 0, citations: 0, books: 0 });
  const [recentMaterials, setRecentMaterials] = useState<
    { id: string; title: string; subjectId: string }[]
  >([]);

  useFocusEffect(
    useCallback(() => {
      getStats().then(setStats);
      getMaterials().then((m) =>
        setRecentMaterials(m.slice(0, 4).map(({ id, title, subjectId }) => ({ id, title, subjectId })))
      );
    }, [])
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroBadge}>
          <Ionicons name="school" size={28} color={colors.accent} />
        </View>
        <Text style={styles.heroTitle}>LLE Reviewer Builder</Text>
        <Text style={styles.heroSubtitle}>
          Compile materials aligned with the PRC{'\n'}Table of Specifications
        </Text>
        <View style={styles.heroDecor1} />
        <View style={styles.heroDecor2} />
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatCard icon="document-text-outline" label="Materials" value={stats.materials} color={colors.primary} />
        <StatCard icon="library-outline" label="Citations" value={stats.citations} color={colors.accent} />
        <StatCard icon="book-outline" label="Books" value={stats.books} color={colors.primaryLight} />
      </View>

      {/* Quick actions */}
      <GlassCard style={styles.actionsCard}>
        <Text style={styles.cardLabel}>Quick Actions</Text>
        <View style={styles.actions}>
          <Button title="Browse TOS" icon="list" onPress={() => router.push('/(tabs)/tos')} style={styles.actionBtn} />
          <Button title="New Citation" icon="add-circle" variant="outline" onPress={() => router.push('/citation/new')} style={styles.actionBtn} />
          <Button title="Create Book" icon="book" variant="secondary" onPress={() => router.push('/book/new')} style={styles.actionBtn} />
        </View>
      </GlassCard>

      {/* Recent materials */}
      {recentMaterials.length > 0 && (
        <GlassCard style={styles.recentCard}>
          <Text style={styles.cardLabel}>Recent Materials</Text>
          {recentMaterials.map((m) => {
            const subject = TOS_SUBJECTS.find((s) => s.id === m.subjectId);
            return (
              <Pressable key={m.id} onPress={() => router.push(`/material/${m.id}`)}>
                <View style={styles.recentItem}>
                  <View style={styles.recentIconWrap}>
                    <Ionicons name="document-text" size={16} color={colors.primary} />
                  </View>
                  <View style={styles.recentInfo}>
                    <Text style={styles.recentTitle} numberOfLines={1}>{m.title}</Text>
                    <Text style={styles.recentSubject} numberOfLines={1}>{subject?.title ?? 'Unknown'}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.border} />
                </View>
              </Pressable>
            );
          })}
        </GlassCard>
      )}

      {/* About TOS */}
      <GlassCard style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <Ionicons name="information-circle" size={20} color={colors.accent} />
          <Text style={styles.infoTitle}>About the TOS</Text>
        </View>
        <Text style={styles.infoText}>
          Based on PRC Board for Librarians Resolution No. 02, Series of 2009. The exam covers
          6 subjects across 2 days with a passing average of 75%.
        </Text>
        <View style={styles.examDayRow}>
          {[1, 2].map((day) => {
            const count = TOS_SUBJECTS.filter((s) => s.examDay === day).length;
            const weight = TOS_SUBJECTS.filter((s) => s.examDay === day).reduce((a, s) => a + s.weight, 0);
            return (
              <View key={day} style={styles.examDayCard}>
                <Text style={styles.examDayLabel}>Day {day}</Text>
                <Text style={styles.examDayValue}>{count} subjects</Text>
                <Text style={styles.examDayWeight}>{weight}% weight</Text>
              </View>
            );
          })}
        </View>
      </GlassCard>

      <Text style={styles.version}>v{Constants.expoConfig?.version ?? '1.2.0'} · LLE Reviewer Builder</Text>
    </ScrollView>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View style={[styles.statCard, { borderTopColor: color, borderTopWidth: 3 }]}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },

  hero: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
    overflow: 'hidden',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  heroBadge: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: spacing.xs,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.78)',
    lineHeight: 21,
  },
  heroDecor1: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(201,162,39,0.12)',
  },
  heroDecor2: {
    position: 'absolute',
    bottom: -50,
    right: 20,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },

  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 14,
    padding: spacing.md,
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 10, color: colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },

  actionsCard: { gap: spacing.sm },
  cardLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  actions: { gap: spacing.sm },
  actionBtn: { width: '100%' },

  recentCard: { gap: spacing.xs },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  recentIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(27,77,62,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentInfo: { flex: 1 },
  recentTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  recentSubject: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },

  infoCard: { gap: spacing.sm },
  infoHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  infoTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  infoText: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
  examDayRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  examDayCard: {
    flex: 1,
    backgroundColor: 'rgba(27,77,62,0.06)',
    borderRadius: 10,
    padding: spacing.sm,
    alignItems: 'center',
    gap: 2,
    borderWidth: 1,
    borderColor: 'rgba(27,77,62,0.1)',
  },
  examDayLabel: { fontSize: 12, fontWeight: '700', color: colors.primary },
  examDayValue: { fontSize: 13, fontWeight: '600', color: colors.text },
  examDayWeight: { fontSize: 11, color: colors.accent, fontWeight: '600' },

  version: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    opacity: 0.6,
  },
});
