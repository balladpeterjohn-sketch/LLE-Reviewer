import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { deleteBook, getBooks } from '../../src/services/storage';
import { Button, EmptyState, GlassCard } from '../../src/components/ui';
import { colors, spacing } from '../../src/theme';
import { BookProject } from '../../src/types';

export default function BooksScreen() {
  const router = useRouter();
  const [books, setBooks] = useState<BookProject[]>([]);

  const load = useCallback(() => { getBooks().then(setBooks); }, []);
  useFocusEffect(load);

  const handleDelete = (book: BookProject) => {
    Alert.alert('Delete Book', `Remove "${book.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => { await deleteBook(book.id); load(); },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button title="New Book Project" icon="add" onPress={() => router.push('/book/new')} />
      </View>

      {books.length === 0 ? (
        <EmptyState
          icon="book-outline"
          title="No books yet"
          message="Compile reading materials into a structured reviewer book and export as PDF."
        />
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {books.map((book) => (
            <Pressable key={book.id} onPress={() => router.push(`/book/${book.id}`)}>
              <GlassCard style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.bookIconWrap}>
                    <Ionicons name="book" size={22} color={colors.primary} />
                  </View>
                  <View style={styles.cardMeta}>
                    <Text style={styles.cardMetaSections}>
                      {book.sections.length} section{book.sections.length !== 1 ? 's' : ''}
                    </Text>
                    {book.settings.year ? (
                      <Text style={styles.cardMetaYear}>{book.settings.year}</Text>
                    ) : null}
                  </View>
                  <Pressable
                    onPress={() => handleDelete(book)}
                    hitSlop={10}
                    style={styles.deleteBtn}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                  </Pressable>
                </View>

                <Text style={styles.title} numberOfLines={2}>{book.title}</Text>
                {book.subtitle ? (
                  <Text style={styles.subtitle} numberOfLines={1}>{book.subtitle}</Text>
                ) : null}
                <Text style={styles.author} numberOfLines={1}>by {book.author}</Text>

                <View style={styles.cardFooter}>
                  {book.settings.includeTitlePage && <TagBadge label="Title Page" />}
                  {book.settings.includeTableOfContents && <TagBadge label="TOC" />}
                  {book.settings.includeBibliography && <TagBadge label="References" />}
                  {book.settings.groupBySubject && <TagBadge label="Parts" />}
                </View>

                <View style={styles.cardArrow}>
                  <Ionicons name="chevron-forward-circle" size={22} color={colors.primaryLight} />
                </View>
              </GlassCard>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function TagBadge({ label }: { label: string }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.md, paddingBottom: spacing.sm },
  list: { padding: spacing.md, paddingTop: 0, gap: spacing.sm, paddingBottom: spacing.xl },

  card: { gap: spacing.xs, position: 'relative' },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  bookIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(27,77,62,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(27,77,62,0.15)',
  },
  cardMeta: { flex: 1 },
  cardMetaSections: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  cardMetaYear: { fontSize: 11, color: colors.accent, fontWeight: '600' },
  deleteBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(192,57,43,0.08)',
  },

  title: { fontSize: 17, fontWeight: '700', color: colors.text, letterSpacing: 0.1 },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 1 },
  author: { fontSize: 12, color: colors.accent, fontWeight: '600', marginTop: 2 },

  cardFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  badge: {
    backgroundColor: 'rgba(27,77,62,0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(27,77,62,0.15)',
  },
  badgeText: { fontSize: 11, fontWeight: '600', color: colors.primary },

  cardArrow: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
  },
});
