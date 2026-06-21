import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TOS_SUBJECTS } from '../../src/data/tosSubjects';
import { exportBackup, getMaterials, getMaterialsBySubject, getStats, importBackup } from '../../src/services/storage';
import { Button } from '../../src/components/ui';
import { useTheme } from '../../src/contexts/ThemeContext';
import { spacing } from '../../src/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { colors, isDark, toggleTheme } = useTheme();
  const [stats, setStats] = useState({ materials: 0, citations: 0, books: 0 });
  const [recentMaterials, setRecentMaterials] = useState<{ id: string; title: string; subjectId: string }[]>([]);
  const [coverage, setCoverage] = useState<Map<string, Set<string>>>(new Map());
  const [backingUp, setBackingUp] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getStats().then(setStats);
      getMaterials().then((m) =>
        setRecentMaterials(m.slice(0, 4).map(({ id, title, subjectId }) => ({ id, title, subjectId })))
      );
      getMaterialsBySubject().then(setCoverage);
    }, [])
  );

  const handleExportBackup = async () => {
    setBackingUp(true);
    try {
      const json = await exportBackup();
      const path = `${FileSystem.documentDirectory}lle-backup-${Date.now()}.json`;
      await FileSystem.writeAsStringAsync(path, json, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(path, { mimeType: 'application/json', dialogTitle: 'Export LLE Backup' });
    } catch {
      Alert.alert('Export failed', 'Could not export backup.');
    } finally {
      setBackingUp(false);
    }
  };

  const handleImportBackup = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
      if (result.canceled || !result.assets?.[0]) return;
      const json = await FileSystem.readAsStringAsync(result.assets[0].uri);
      const counts = await importBackup(json);
      Alert.alert(
        'Import successful',
        `Imported ${counts.materials} materials, ${counts.citations} citations, ${counts.books} books.`
      );
      getStats().then(setStats);
    } catch {
      Alert.alert('Import failed', 'Invalid backup file.');
    }
  };

  const totalTopics = TOS_SUBJECTS.reduce(
    (acc, s) => acc + s.topics.reduce((a, t) => a + 1 + (t.children?.length ?? 0), 0),
    0
  );
  const coveredTopics = Array.from(coverage.values()).reduce((acc, set) => acc + set.size, 0);
  const coveragePct = totalTopics > 0 ? Math.round((coveredTopics / totalTopics) * 100) : 0;

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md, gap: spacing.md, paddingBottom: 60 },

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
    heroTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
    heroBadge: {
      width: 52, height: 52, borderRadius: 14,
      backgroundColor: 'rgba(255,255,255,0.15)',
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    },
    themeBtn: {
      width: 36, height: 36, borderRadius: 10,
      backgroundColor: 'rgba(255,255,255,0.12)',
      alignItems: 'center', justifyContent: 'center',
    },
    heroTitle: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
    heroSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.78)', lineHeight: 21 },
    heroDecor1: { position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(201,162,39,0.12)' },
    heroDecor2: { position: 'absolute', bottom: -50, right: 20, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.05)' },

    statsRow: { flexDirection: 'row', gap: spacing.sm },
    statCard: {
      flex: 1,
      backgroundColor: colors.surfaceGlass,
      borderRadius: 14, padding: spacing.md,
      alignItems: 'center', gap: 3,
      borderWidth: 1, borderColor: colors.borderGlass,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
    },
    statValue: { fontSize: 24, fontWeight: '800' },
    statLabel: { fontSize: 10, color: colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },

    card: {
      backgroundColor: colors.surfaceGlass,
      borderRadius: 18, padding: spacing.md,
      borderWidth: 1, borderColor: colors.borderGlass,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1, shadowRadius: 16, elevation: 6,
      gap: spacing.sm,
    },
    cardLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 },

    coverageCard: {
      backgroundColor: colors.surfaceGlass,
      borderRadius: 18, padding: spacing.md,
      borderWidth: 1, borderColor: colors.borderGlass,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1, shadowRadius: 16, elevation: 6,
      gap: spacing.sm,
    },
    coverageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    coverageTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
    coveragePct: { fontSize: 18, fontWeight: '800', color: colors.primary },
    progressTrack: { height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' },
    progressFill: { height: 8, backgroundColor: colors.primary, borderRadius: 4 },
    coverageSubjects: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
    coverageSubject: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: colors.backgroundDeep,
      paddingHorizontal: spacing.sm, paddingVertical: 3,
      borderRadius: 20, borderWidth: 1, borderColor: colors.borderLight,
    },
    coverageSubjectText: { fontSize: 11, color: colors.textSecondary },

    recentItem: {
      flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    recentIconWrap: { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.backgroundDeep, alignItems: 'center', justifyContent: 'center' },
    recentInfo: { flex: 1 },
    recentTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
    recentSubject: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },

    backupRow: { flexDirection: 'row', gap: spacing.sm },

    version: { fontSize: 11, color: colors.textSecondary, textAlign: 'center', opacity: 0.6 },
  });

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <View style={s.hero}>
        <View style={s.heroDecor1} />
        <View style={s.heroDecor2} />
        <View style={s.heroTop}>
          <View style={s.heroBadge}>
            <Ionicons name="school" size={28} color={colors.accent} />
          </View>
          <Pressable style={s.themeBtn} onPress={toggleTheme} hitSlop={8}>
            <Ionicons name={isDark ? 'sunny' : 'moon'} size={18} color="rgba(255,255,255,0.85)" />
          </Pressable>
        </View>
        <Text style={s.heroTitle}>LLE Reviewer Builder</Text>
        <Text style={s.heroSubtitle}>Compile materials aligned with the PRC Table of Specifications</Text>
      </View>

      {/* Stats */}
      <View style={s.statsRow}>
        {[
          { icon: 'document-text-outline' as const, label: 'Materials', value: stats.materials, color: colors.primary },
          { icon: 'library-outline' as const, label: 'Citations', value: stats.citations, color: colors.accent },
          { icon: 'book-outline' as const, label: 'Books', value: stats.books, color: colors.primaryLight },
        ].map(({ icon, label, value, color }) => (
          <View key={label} style={[s.statCard, { borderTopWidth: 3, borderTopColor: color }]}>
            <Ionicons name={icon} size={20} color={color} />
            <Text style={[s.statValue, { color }]}>{value}</Text>
            <Text style={s.statLabel}>{label}</Text>
          </View>
        ))}
      </View>

      {/* TOS Coverage */}
      <View style={s.coverageCard}>
        <View style={s.coverageHeader}>
          <Text style={s.coverageTitle}>TOS Coverage</Text>
          <Text style={[s.coveragePct, { color: coveragePct >= 80 ? colors.success : coveragePct >= 40 ? colors.accent : colors.danger }]}>
            {coveragePct}%
          </Text>
        </View>
        <View style={s.progressTrack}>
          <View style={[s.progressFill, {
            width: `${coveragePct}%` as any,
            backgroundColor: coveragePct >= 80 ? colors.success : coveragePct >= 40 ? colors.accent : colors.primary,
          }]} />
        </View>
        <Text style={s.cardLabel}>{coveredTopics} of {totalTopics} topics covered</Text>
        <View style={s.coverageSubjects}>
          {TOS_SUBJECTS.map((sub) => {
            const topicIds = coverage.get(sub.id);
            const subTopics = sub.topics.reduce((a, t) => a + 1 + (t.children?.length ?? 0), 0);
            const covered = topicIds?.size ?? 0;
            const pct = subTopics > 0 ? Math.round((covered / subTopics) * 100) : 0;
            return (
              <Pressable key={sub.id} style={s.coverageSubject} onPress={() => router.push(`/tos/${sub.id}`)}>
                <Ionicons
                  name={pct === 100 ? 'checkmark-circle' : pct > 0 ? 'ellipse-outline' : 'radio-button-off-outline'}
                  size={11}
                  color={pct === 100 ? colors.success : pct > 0 ? colors.accent : colors.textSecondary}
                />
                <Text style={s.coverageSubjectText}>{pct}%</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Quick actions */}
      <View style={s.card}>
        <Text style={s.cardLabel}>Quick Actions</Text>
        <Button title="Browse TOS" icon="list" onPress={() => router.push('/(tabs)/tos')} />
        <Button title="New Citation" icon="add-circle" variant="outline" onPress={() => router.push('/citation/new')} />
        <Button title="Create Book" icon="book" variant="secondary" onPress={() => router.push('/book/new')} />
      </View>

      {/* Recent materials */}
      {recentMaterials.length > 0 && (
        <View style={s.card}>
          <Text style={s.cardLabel}>Recent Materials</Text>
          {recentMaterials.map((m) => {
            const subject = TOS_SUBJECTS.find((sub) => sub.id === m.subjectId);
            return (
              <Pressable key={m.id} onPress={() => router.push(`/material/${m.id}`)}>
                <View style={s.recentItem}>
                  <View style={s.recentIconWrap}>
                    <Ionicons name="document-text" size={16} color={colors.primary} />
                  </View>
                  <View style={s.recentInfo}>
                    <Text style={s.recentTitle} numberOfLines={1}>{m.title}</Text>
                    <Text style={s.recentSubject} numberOfLines={1}>{subject?.title ?? 'Unknown'}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.border} />
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Backup / Restore */}
      <View style={s.card}>
        <Text style={s.cardLabel}>Data Backup</Text>
        <View style={s.backupRow}>
          <Button
            title={backingUp ? 'Exporting…' : 'Export Backup'}
            icon="cloud-upload-outline"
            variant="outline"
            onPress={handleExportBackup}
            disabled={backingUp}
            style={{ flex: 1 }}
          />
          <Button
            title="Import Backup"
            icon="cloud-download-outline"
            variant="ghost"
            onPress={handleImportBackup}
            style={{ flex: 1 }}
          />
        </View>
      </View>

      <Text style={s.version}>v{Constants.expoConfig?.version ?? '1.3.0'} · LLE Reviewer Builder</Text>
    </ScrollView>
  );
}
