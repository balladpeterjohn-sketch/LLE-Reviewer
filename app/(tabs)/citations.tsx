import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { deleteCitation, getCitations } from '../../src/services/storage';
import { Button, EmptyState } from '../../src/components/ui';
import { useTheme } from '../../src/contexts/ThemeContext';
import { radius, shadow, spacing, typography } from '../../src/theme';
import { Citation, CitationStyle } from '../../src/types';
import { CITATION_STYLE_LABELS, formatCitation } from '../../src/utils/citation';

const STYLES = Object.keys(CITATION_STYLE_LABELS) as CitationStyle[];

export default function CitationsScreen() {
  const router   = useRouter();
  const { colors } = useTheme();
  const [citations, setCitations] = useState<Citation[]>([]);
  const [search, setSearch]       = useState('');
  const [style, setStyle]         = useState<CitationStyle>('apa');

  const load = useCallback(() => { getCitations().then(setCitations); }, []);
  useFocusEffect(load);

  const filtered = search.trim()
    ? citations.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()) || c.authors.toLowerCase().includes(search.toLowerCase()))
    : citations;

  const handleDelete = (c: Citation) => {
    Alert.alert('Delete Citation', `Remove "${c.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteCitation(c.id); load(); } },
    ]);
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header:    { padding: spacing.md, gap: spacing.sm, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },

    styleRow:     { flexDirection: 'row', gap: spacing.sm },
    styleChip:    { flex: 1, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface },
    styleChipOn:  { backgroundColor: colors.primary, borderColor: colors.primary },
    styleText:    { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
    styleTextOn:  { color: '#fff' },

    searchBox:    { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surfaceSubtle, borderRadius: radius.md, paddingHorizontal: spacing.md, height: 44, borderWidth: 1, borderColor: colors.border },
    searchInput:  { flex: 1, fontSize: 15, color: colors.text },

    list:  { padding: spacing.md, gap: spacing.sm, paddingBottom: 80 },
    card:  { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: spacing.xs, ...shadow.sm },
    cardHead:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    typePill:   { backgroundColor: colors.primaryMuted, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
    typeText:   { ...typography.micro, color: colors.primary, textTransform: 'uppercase' },
    deleteBtn:  { padding: 6, borderRadius: radius.sm, backgroundColor: colors.dangerMuted },
    authors:    { ...typography.label, color: colors.text, fontWeight: '700' },
    title:      { ...typography.caption, color: colors.textSecondary },
    formatted:  { fontSize: 12, color: colors.textSecondary, fontStyle: 'italic', lineHeight: 17, backgroundColor: colors.surfaceSubtle, padding: spacing.sm, borderRadius: radius.sm, marginTop: 4, borderLeftWidth: 3, borderLeftColor: colors.accent },
  });

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Button title="Add Citation" icon="add" onPress={() => router.push('/citation/new')} />
        <View style={s.styleRow}>
          {STYLES.map((st) => (
            <Pressable key={st} style={[s.styleChip, style === st && s.styleChipOn]} onPress={() => setStyle(st)}>
              <Text style={[s.styleText, style === st && s.styleTextOn]}>{CITATION_STYLE_LABELS[st]}</Text>
            </Pressable>
          ))}
        </View>
        <View style={s.searchBox}>
          <Ionicons name="search-outline" size={16} color={colors.textTertiary} />
          <TextInput style={s.searchInput} placeholder="Search citations…" placeholderTextColor={colors.textTertiary} value={search} onChangeText={setSearch} />
          {search ? <Pressable onPress={() => setSearch('')}><Ionicons name="close-circle" size={16} color={colors.textTertiary} /></Pressable> : null}
        </View>
      </View>

      {filtered.length === 0 ? (
        <EmptyState icon="library-outline" title={search ? 'No matches' : 'No citations yet'} message={search ? `No citations matching "${search}"` : 'Add reading resources to credit authors when compiling materials.'} />
      ) : (
        <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
          {filtered.map((c) => (
            <Pressable key={c.id} onPress={() => router.push(`/citation/${c.id}`)}>
              <View style={s.card}>
                <View style={s.cardHead}>
                  <View style={s.typePill}><Text style={s.typeText}>{c.type}</Text></View>
                  <Pressable style={s.deleteBtn} onPress={() => handleDelete(c)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={14} color={colors.danger} />
                  </Pressable>
                </View>
                <Text style={s.authors}>{c.authors}</Text>
                <Text style={s.title} numberOfLines={2}>{c.title} ({c.year})</Text>
                <Text style={s.formatted} numberOfLines={4}>{formatCitation(c, style)}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
