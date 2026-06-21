import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { findTopic } from '../../../src/data/tosSubjects';
import { getMaterialsByTopic } from '../../../src/services/storage';
import { Button, EmptyState } from '../../../src/components/ui';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { spacing } from '../../../src/theme';
import { ReadingMaterial } from '../../../src/types';
import { getMaterialPreview } from '../../../src/utils/bookExport';

export default function TopicScreen() {
  const { subjectId, topicId } = useLocalSearchParams<{ subjectId: string; topicId: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const [materials, setMaterials] = useState<ReadingMaterial[]>([]);
  const [search, setSearch] = useState('');

  const topicInfo = findTopic(subjectId ?? '', topicId ?? '');

  const load = useCallback(() => {
    if (subjectId && topicId) getMaterialsByTopic(subjectId, topicId).then(setMaterials);
  }, [subjectId, topicId]);

  useFocusEffect(load);

  const filtered = materials.filter(
    (m) => !search.trim() || m.title.toLowerCase().includes(search.toLowerCase())
  );

  if (!topicInfo) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <Text style={{ color: colors.danger, fontSize: 16 }}>Topic not found</Text>
      </View>
    );
  }

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      padding: spacing.md, gap: spacing.sm,
      borderBottomWidth: 1, borderBottomColor: colors.border,
      backgroundColor: colors.surfaceGlass,
    },
    topicCode: { fontSize: 12, fontWeight: '700', color: colors.primary, letterSpacing: 0.5 },
    topicTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
    subjectName: { fontSize: 13, color: colors.textSecondary },
    searchBox: {
      flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
      backgroundColor: colors.surface, borderRadius: 10,
      paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
      borderWidth: 1, borderColor: colors.border,
    },
    searchInput: { flex: 1, fontSize: 14, color: colors.text },
    list: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xl },
    card: {
      backgroundColor: colors.surfaceGlass, borderRadius: 14,
      padding: spacing.md,
      borderWidth: 1, borderColor: colors.borderGlass,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
    },
    cardRow: { flexDirection: 'row', alignItems: 'center' },
    cardContent: { flex: 1 },
    cardTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
    preview: { fontSize: 13, color: colors.textSecondary, marginTop: 3, lineHeight: 18 },
    blockCount: { fontSize: 11, color: colors.accent, marginTop: spacing.sm, fontWeight: '600' },
  });

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.topicCode}>{topicInfo.topic.code}</Text>
        <Text style={s.topicTitle}>{topicInfo.topic.title}</Text>
        <Text style={s.subjectName}>{topicInfo.subject.title}</Text>
        <Button
          title="Add Reading Material"
          icon="add"
          onPress={() => router.push({ pathname: '/material/new', params: { subjectId, topicId } })}
        />
        <View style={s.searchBox}>
          <Ionicons name="search-outline" size={15} color={colors.textSecondary} />
          <TextInput
            style={s.searchInput}
            placeholder="Search materials…"
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={15} color={colors.textSecondary} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {filtered.length === 0 ? (
        <EmptyState
          icon="document-text-outline"
          title={search ? 'No matches' : 'No materials yet'}
          message={search ? `No materials matching "${search}"` : 'Add reading materials aligned with this TOS topic.'}
        />
      ) : (
        <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
          {filtered.map((m) => (
            <Pressable key={m.id} onPress={() => router.push(`/material/${m.id}`)}>
              <View style={s.card}>
                <View style={s.cardRow}>
                  <View style={s.cardContent}>
                    <Text style={s.cardTitle}>{m.title}</Text>
                    <Text style={s.preview} numberOfLines={2}>{getMaterialPreview(m)}</Text>
                    <Text style={s.blockCount}>
                      {m.blocks.length} block{m.blocks.length !== 1 ? 's' : ''}
                      {m.citationIds.length > 0 && ` · ${m.citationIds.length} citation${m.citationIds.length !== 1 ? 's' : ''}`}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
