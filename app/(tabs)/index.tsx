import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TOS_SUBJECTS } from '../../src/data/tosSubjects';
import { getMaterials, getStats } from '../../src/services/storage';
import { Button, Card } from '../../src/components/ui';
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
        setRecentMaterials(m.slice(0, 3).map(({ id, title, subjectId }) => ({ id, title, subjectId })))
      );
    }, [])
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Ionicons name="school" size={40} color={colors.accent} />
        <Text style={styles.heroTitle}>LLE Reviewer Builder</Text>
        <Text style={styles.heroSubtitle}>
          Compile reading materials aligned with the PRC Table of Specifications
        </Text>
      </View>

      <View style={styles.statsRow}>
        <StatCard icon="document-text" label="Materials" value={stats.materials} />
        <StatCard icon="library" label="Citations" value={stats.citations} />
        <StatCard icon="book" label="Books" value={stats.books} />
      </View>

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actions}>
        <Button
          title="Browse TOS"
          icon="list"
          onPress={() => router.push('/(tabs)/tos')}
        />
        <Button
          title="Add Citation"
          icon="add-circle"
          variant="outline"
          onPress={() => router.push('/citation/new')}
        />
        <Button
          title="Create Book"
          icon="book"
          variant="secondary"
          onPress={() => router.push('/book/new')}
        />
      </View>

      {recentMaterials.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Recent Materials</Text>
          {recentMaterials.map((m) => {
            const subject = TOS_SUBJECTS.find((s) => s.id === m.subjectId);
            return (
              <Pressable key={m.id} onPress={() => router.push(`/material/${m.id}`)}>
                <Card style={styles.recentCard}>
                  <Text style={styles.recentTitle}>{m.title}</Text>
                  <Text style={styles.recentSubject}>{subject?.title}</Text>
                </Card>
              </Pressable>
            );
          })}
        </>
      )}

      <Card style={styles.infoCard}>
        <Text style={styles.infoTitle}>About the TOS</Text>
        <Text style={styles.infoText}>
          Based on PRC Board for Librarians Resolution No. 02, Series of 2009 and
          Resolution No. 07, Series of 2006. The exam covers 6 subjects across 2 days
          with a passing average of 75%.
        </Text>
      </Card>
    </ScrollView>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
}) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={22} color={colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  hero: {
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: 16,
    gap: spacing.sm,
  },
  heroTitle: { fontSize: 22, fontWeight: '700', color: '#fff' },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 20,
  },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  statValue: { fontSize: 22, fontWeight: '700', color: colors.text },
  statLabel: { fontSize: 11, color: colors.textSecondary },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  actions: { gap: spacing.sm },
  recentCard: { marginBottom: spacing.sm },
  recentTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  recentSubject: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  infoCard: { marginTop: spacing.sm },
  infoTitle: { fontSize: 15, fontWeight: '600', color: colors.primary, marginBottom: spacing.sm },
  infoText: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
});
