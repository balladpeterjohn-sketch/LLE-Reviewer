import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { deleteCitation, getCitations } from '../../src/services/storage';
import { Button, Card, EmptyState } from '../../src/components/ui';
import { colors, spacing } from '../../src/theme';
import { Citation } from '../../src/types';
import { formatCitation } from '../../src/utils/citation';

export default function CitationsScreen() {
  const router = useRouter();
  const [citations, setCitations] = useState<Citation[]>([]);

  const load = useCallback(() => {
    getCitations().then(setCitations);
  }, []);

  useFocusEffect(load);

  const handleDelete = (citation: Citation) => {
    Alert.alert('Delete Citation', `Remove "${citation.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteCitation(citation.id);
          load();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button
          title="Add Citation"
          icon="add"
          onPress={() => router.push('/citation/new')}
        />
      </View>

      {citations.length === 0 ? (
        <EmptyState
          icon="library-outline"
          title="No citations yet"
          message="Add reading resources to credit authors when compiling your reviewer materials."
        />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {citations.map((c) => (
            <Pressable key={c.id} onPress={() => router.push(`/citation/${c.id}`)}>
              <Card style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeText}>{c.type}</Text>
                  </View>
                  <Pressable onPress={() => handleDelete(c)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={18} color={colors.danger} />
                  </Pressable>
                </View>
                <Text style={styles.authors}>{c.authors}</Text>
                <Text style={styles.title}>{c.title}</Text>
                <Text style={styles.formatted} numberOfLines={3}>
                  {formatCitation(c)}
                </Text>
              </Card>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.md },
  list: { padding: spacing.md, paddingTop: 0, gap: spacing.sm, paddingBottom: spacing.xl },
  card: { marginBottom: spacing.sm },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  typeBadge: {
    backgroundColor: '#E8F0EC',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeText: { fontSize: 11, fontWeight: '600', color: colors.primary, textTransform: 'uppercase' },
  authors: { fontSize: 15, fontWeight: '600', color: colors.text },
  title: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  formatted: { fontSize: 12, color: colors.textSecondary, marginTop: spacing.sm, fontStyle: 'italic', lineHeight: 18 },
});
