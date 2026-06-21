import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { deleteCitation, getCitations } from '../../src/services/storage';
import { Button, EmptyState } from '../../src/components/ui';
import { useTheme } from '../../src/contexts/ThemeContext';
import { spacing } from '../../src/theme';
import { Citation, CitationStyle } from '../../src/types';
import { CITATION_STYLE_LABELS, formatCitation } from '../../src/utils/citation';

export default function CitationsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [citations, setCitations] = useState<Citation[]>([]);
  const [search, setSearch] = useState('');
  const [style, setStyle] = useState<CitationStyle>('apa');

  const load = useCallback(() => { getCitations().then(setCitations); }, []);
  useFocusEffect(load);

  const filtered = citations.filter((c) =>
    !search.trim() ||
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.authors.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (citation: Citation) => {
    Alert.alert('Delete Citation', `Remove "${citation.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteCitation(citation.id); load(); } },
    ]);
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { padding: spacing.md, gap: spacing.sm },
    styleRow: { flexDirection: 'row', gap: spacing.sm },
    styleChip: {
      flex: 1, paddingVertical: spacing.sm, alignItems: 'center',
      borderRadius: 10, borderWidth: 1.5, borderColor: colors.border,
      backgroundColor: colors.surfaceGlass,
    },
    styleChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    styleChipText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
    styleChipTextActive: { color: '#fff' },
    searchBox: {
      flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
      backgroundColor: colors.surfaceGlass, borderRadius: 12,
      paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2,
      borderWidth: 1, borderColor: colors.border,
    },
    searchInput: { flex: 1, fontSize: 14, color: colors.text },
    list: { padding: spacing.md, paddingTop: 0, gap: spacing.sm, paddingBottom: 80 },
    card: {
      backgroundColor: colors.surfaceGlass, borderRadius: 16,
      padding: spacing.md, gap: spacing.xs,
      borderWidth: 1, borderColor: colors.borderGlass,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
    typeBadge: {
      backgroundColor: colors.backgroundDeep, paddingHorizontal: spacing.sm,
      paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: colors.borderLight,
    },
    typeText: { fontSize: 10, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
    deleteBtn: { padding: 4, borderRadius: 8, backgroundColor: 'rgba(200,50,40,0.08)' },
    authors: { fontSize: 14, fontWeight: '700', color: colors.text },
    title: { fontSize: 13, color: colors.textSecondary, marginTop: 1 },
    formatted: {
      fontSize: 11.5, color: colors.textSecondary, marginTop: spacing.sm,
      fontStyle: 'italic', lineHeight: 17,
      backgroundColor: colors.backgroundDeep, padding: spacing.sm,
      borderRadius: 8, borderLeftWidth: 3, borderLeftColor: colors.accent,
    },
  });

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Button title="Add Citation" icon="add" onPress={() => router.push('/citation/new')} />

        {/* Citation style selector */}
        <View style={s.styleRow}>
          {(Object.keys(CITATION_STYLE_LABELS) as CitationStyle[]).map((st) => (
            <Pressable key={st} style={[s.styleChip, style === st && s.styleChipActive]} onPress={() => setStyle(st)}>
              <Text style={[s.styleChipText, style === st && s.styleChipTextActive]}>
                {CITATION_STYLE_LABELS[st]}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Search */}
        <View style={s.searchBox}>
          <Ionicons name="search-outline" size={16} color={colors.textSecondary} />
          <TextInput
            style={s.searchInput}
            placeholder="Search citations…"
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {filtered.length === 0 ? (
        <EmptyState
          icon="library-outline"
          title={search ? 'No matches' : 'No citations yet'}
          message={search ? `No citations matching "${search}"` : 'Add reading resources to credit authors when compiling materials.'}
        />
      ) : (
        <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
          {filtered.map((c) => (
            <Pressable key={c.id} onPress={() => router.push(`/citation/${c.id}`)}>
              <View style={s.card}>
                <View style={s.cardTop}>
                  <View style={s.typeBadge}>
                    <Text style={s.typeText}>{c.type}</Text>
                  </View>
                  <Pressable style={s.deleteBtn} onPress={() => handleDelete(c)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={15} color={colors.danger} />
                  </Pressable>
                </View>
                <Text style={s.authors}>{c.authors}</Text>
                <Text style={s.title} numberOfLines={2}>{c.title} ({c.year})</Text>
                <Text style={s.formatted} numberOfLines={4}>
                  {formatCitation(c, style)}
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
