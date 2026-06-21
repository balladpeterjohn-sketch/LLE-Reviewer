import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { findTopic } from '../../../src/data/tosSubjects';
import { getMaterialsByTopic } from '../../../src/services/storage';
import { Button, EmptyState } from '../../../src/components/ui';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { radius, shadow, spacing, typography } from '../../../src/theme';
import { ReadingMaterial } from '../../../src/types';
import { getMaterialPreview } from '../../../src/utils/bookExport';

export default function TopicScreen() {
  const { subjectId, topicId } = useLocalSearchParams<{ subjectId: string; topicId: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const [materials, setMaterials] = useState<ReadingMaterial[]>([]);
  const [search, setSearch]       = useState('');

  const topicInfo = findTopic(subjectId ?? '', topicId ?? '');
  const load = useCallback(() => {
    if (subjectId && topicId) getMaterialsByTopic(subjectId, topicId).then(setMaterials);
  }, [subjectId, topicId]);
  useFocusEffect(load);

  const filtered = search.trim()
    ? materials.filter((m) => m.title.toLowerCase().includes(search.toLowerCase()))
    : materials;

  if (!topicInfo) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <Text style={{ color: colors.danger }}>Topic not found</Text>
    </View>
  );

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header:    { padding: spacing.md, gap: spacing.sm, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
    code:      { ...typography.micro, color: colors.primary, textTransform: 'uppercase' },
    topicT:    { ...typography.heading, color: colors.text },
    subjectT:  { ...typography.caption, color: colors.textSecondary },

    searchBox: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surfaceSubtle, borderRadius: radius.md, paddingHorizontal: spacing.md, height: 42, borderWidth: 1, borderColor: colors.border },
    searchIn:  { flex: 1, fontSize: 14, color: colors.text },

    list: { padding: spacing.md, gap: spacing.sm, paddingBottom: 80 },
    card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, ...shadow.sm },
    cardRow:   { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    cardInfo:  { flex: 1 },
    cardTitle: { ...typography.label, color: colors.text, fontWeight: '600' },
    cardPrev:  { ...typography.caption, color: colors.textSecondary, marginTop: 3, lineHeight: 18 },
    cardMeta:  { ...typography.micro, color: colors.accent, marginTop: spacing.xs, textTransform: 'uppercase' },
  });

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.code}>{topicInfo.topic.code}</Text>
        <Text style={s.topicT}>{topicInfo.topic.title}</Text>
        <Text style={s.subjectT}>{topicInfo.subject.title}</Text>
        <Button title="Add Reading Material" icon="add" onPress={() => router.push({ pathname: '/material/new', params: { subjectId, topicId } })} />
        <View style={s.searchBox}>
          <Ionicons name="search-outline" size={15} color={colors.textTertiary} />
          <TextInput style={s.searchIn} placeholder="Search materials…" placeholderTextColor={colors.textTertiary} value={search} onChangeText={setSearch} />
          {search ? <Pressable onPress={() => setSearch('')}><Ionicons name="close-circle" size={15} color={colors.textTertiary} /></Pressable> : null}
        </View>
      </View>

      {filtered.length === 0 ? (
        <EmptyState icon="document-text-outline" title={search ? 'No matches' : 'No materials yet'} message={search ? `No materials matching "${search}"` : 'Start compiling reading materials for this TOS topic.'} />
      ) : (
        <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
          {filtered.map((m) => (
            <Pressable key={m.id} onPress={() => router.push(`/material/${m.id}`)}>
              <View style={s.card}>
                <View style={s.cardRow}>
                  <View style={s.cardInfo}>
                    <Text style={s.cardTitle}>{m.title}</Text>
                    <Text style={s.cardPrev} numberOfLines={2}>{getMaterialPreview(m)}</Text>
                    <Text style={s.cardMeta}>
                      {m.blocks.length} block{m.blocks.length !== 1 ? 's' : ''}
                      {m.citationIds.length > 0 ? ` · ${m.citationIds.length} citation${m.citationIds.length !== 1 ? 's' : ''}` : ''}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
