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
import { Button, StatCard } from '../../src/components/ui';
import { useTheme } from '../../src/contexts/ThemeContext';
import { radius, shadow, spacing, typography } from '../../src/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { colors, isDark, toggleTheme } = useTheme();
  const [stats, setStats] = useState({ materials: 0, citations: 0, books: 0 });
  const [recentMaterials, setRecentMaterials] = useState<{ id: string; title: string; subjectId: string }[]>([]);
  const [coverage, setCoverage] = useState<Map<string, Set<string>>>(new Map());
  const [backingUp, setBackingUp] = useState(false);

  useFocusEffect(useCallback(() => {
    getStats().then(setStats);
    getMaterials().then((m) => setRecentMaterials(m.slice(0, 4).map(({ id, title, subjectId }) => ({ id, title, subjectId }))));
    getMaterialsBySubject().then(setCoverage);
  }, []));

  const totalTopics   = TOS_SUBJECTS.reduce((a, s) => a + s.topics.reduce((b, t) => b + 1 + (t.children?.length ?? 0), 0), 0);
  const coveredTopics = Array.from(coverage.values()).reduce((a, s) => a + s.size, 0);
  const coveragePct   = totalTopics > 0 ? Math.round((coveredTopics / totalTopics) * 100) : 0;

  const handleExport = async () => {
    setBackingUp(true);
    try {
      const json = await exportBackup();
      const path = `${FileSystem.documentDirectory}lle-backup-${Date.now()}.json`;
      await FileSystem.writeAsStringAsync(path, json, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(path, { mimeType: 'application/json', dialogTitle: 'Export LLE Backup' });
    } catch { Alert.alert('Export failed', 'Could not export backup.'); }
    finally { setBackingUp(false); }
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
      if (result.canceled || !result.assets?.[0]) return;
      const json = await FileSystem.readAsStringAsync(result.assets[0].uri);
      const counts = await importBackup(json);
      Alert.alert('Import successful', `Imported ${counts.materials} materials, ${counts.citations} citations, ${counts.books} books.`);
      getStats().then(setStats);
    } catch { Alert.alert('Import failed', 'Invalid backup file.'); }
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll:    { padding: spacing.md, gap: spacing.md, paddingBottom: 80 },

    /* Hero */
    hero: { backgroundColor: colors.primary, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.sm, overflow: 'hidden', ...shadow.md },
    heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    heroIcon: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    heroTheme: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
    heroTitle: { ...typography.hero, color: '#fff', marginTop: spacing.sm },
    heroSub:   { fontSize: 14, color: 'rgba(255,255,255,0.72)', lineHeight: 21 },
    heroDeco1: { position: 'absolute', top: -24, right: -24, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.05)' },
    heroDeco2: { position: 'absolute', bottom: -40, right: 16, width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(201,162,39,0.08)' },

    /* Stats */
    statsRow: { flexDirection: 'row', gap: spacing.sm },

    /* Section card */
    card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: spacing.sm, ...shadow.sm },
    cardLabel: { ...typography.micro, color: colors.textTertiary, textTransform: 'uppercase', marginBottom: 2 },

    /* Coverage */
    covHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    covTitle:   { ...typography.label, color: colors.text, fontWeight: '700' },
    covPct:     { fontSize: 20, fontWeight: '800' },
    covTrack:   { height: 7, backgroundColor: colors.border, borderRadius: radius.full, overflow: 'hidden' },
    covFill:    { height: 7, borderRadius: radius.full },
    covSubRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: 4 },
    covSubChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.surfaceSubtle, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border },
    covSubText: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },

    /* Recent */
    recentRow:  { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
    recentIcon: { width: 34, height: 34, borderRadius: radius.sm, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' },
    recentInfo: { flex: 1 },
    recentName: { ...typography.label, color: colors.text, fontWeight: '600' },
    recentSub:  { ...typography.caption, color: colors.textSecondary, marginTop: 1 },

    /* Backup */
    backupRow: { flexDirection: 'row', gap: spacing.sm },

    version: { ...typography.caption, color: colors.textTertiary, textAlign: 'center', marginTop: spacing.sm },
  });

  const coverageColor = coveragePct >= 80 ? colors.success : coveragePct >= 40 ? colors.accent : colors.danger;

  return (
    <ScrollView style={s.container} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <View style={s.hero}>
        <View style={s.heroDeco1} /><View style={s.heroDeco2} />
        <View style={s.heroTop}>
          <View style={s.heroIcon}><Ionicons name="school" size={26} color={colors.accent} /></View>
          <Pressable style={s.heroTheme} onPress={toggleTheme} hitSlop={8}>
            <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={17} color="rgba(255,255,255,0.85)" />
          </Pressable>
        </View>
        <Text style={s.heroTitle}>LLE Reviewer</Text>
        <Text style={s.heroSub}>Compile materials aligned with the PRC Table of Specifications</Text>
      </View>

      {/* Stats */}
      <View style={s.statsRow}>
        <StatCard icon="document-text-outline" value={stats.materials} label="Materials" accent={colors.primary} />
        <StatCard icon="library-outline"       value={stats.citations} label="Citations" accent={colors.accent} />
        <StatCard icon="book-outline"          value={stats.books}     label="Books"     accent={colors.primaryLight} />
      </View>

      {/* TOS Coverage */}
      <View style={s.card}>
        <Text style={s.cardLabel}>TOS Coverage</Text>
        <View style={s.covHeader}>
          <Text style={s.covTitle}>{coveredTopics} of {totalTopics} topics covered</Text>
          <Text style={[s.covPct, { color: coverageColor }]}>{coveragePct}%</Text>
        </View>
        <View style={s.covTrack}>
          <View style={[s.covFill, { width: `${coveragePct}%` as any, backgroundColor: coverageColor }]} />
        </View>
        <View style={s.covSubRow}>
          {TOS_SUBJECTS.map((sub) => {
            const covered = coverage.get(sub.id)?.size ?? 0;
            const total   = sub.topics.reduce((a, t) => a + 1 + (t.children?.length ?? 0), 0);
            const pct     = total > 0 ? Math.round((covered / total) * 100) : 0;
            return (
              <Pressable key={sub.id} style={s.covSubChip} onPress={() => router.push(`/tos/${sub.id}`)}>
                <Ionicons
                  name={pct === 100 ? 'checkmark-circle' : pct > 0 ? 'ellipse-outline' : 'radio-button-off-outline'}
                  size={11} color={pct === 100 ? colors.success : pct > 0 ? colors.accent : colors.textTertiary}
                />
                <Text style={s.covSubText}>{pct}%</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Quick actions */}
      <View style={s.card}>
        <Text style={s.cardLabel}>Quick Actions</Text>
        <Button title="Browse TOS"    icon="list"         onPress={() => router.push('/(tabs)/tos')} />
        <Button title="New Citation"  icon="add-circle"   onPress={() => router.push('/citation/new')}  variant="outline" />
        <Button title="Create Book"   icon="book"         onPress={() => router.push('/book/new')}       variant="secondary" />
      </View>

      {/* Recent materials */}
      {recentMaterials.length > 0 && (
        <View style={s.card}>
          <Text style={s.cardLabel}>Recent Materials</Text>
          {recentMaterials.map((m) => {
            const sub = TOS_SUBJECTS.find((s) => s.id === m.subjectId);
            return (
              <Pressable key={m.id} onPress={() => router.push(`/material/${m.id}`)}>
                <View style={s.recentRow}>
                  <View style={s.recentIcon}><Ionicons name="document-text" size={16} color={colors.primary} /></View>
                  <View style={s.recentInfo}>
                    <Text style={s.recentName} numberOfLines={1}>{m.title}</Text>
                    <Text style={s.recentSub}  numberOfLines={1}>{sub?.title ?? '—'}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={15} color={colors.textTertiary} />
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Backup */}
      <View style={s.card}>
        <Text style={s.cardLabel}>Data Backup</Text>
        <View style={s.backupRow}>
          <Button title={backingUp ? 'Exporting…' : 'Export'} icon="cloud-upload-outline" variant="outline" onPress={handleExport} disabled={backingUp} style={{ flex: 1 }} />
          <Button title="Import"  icon="cloud-download-outline" variant="ghost"   onPress={handleImport} style={{ flex: 1 }} />
        </View>
      </View>

      <Text style={s.version}>v{Constants.expoConfig?.version ?? '1.3.0'}</Text>
    </ScrollView>
  );
}
