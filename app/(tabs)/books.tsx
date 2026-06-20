import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { deleteBook, getBooks } from '../../src/services/storage';
import { Button, Card, EmptyState } from '../../src/components/ui';
import { colors, spacing } from '../../src/theme';
import { BookProject } from '../../src/types';

export default function BooksScreen() {
  const router = useRouter();
  const [books, setBooks] = useState<BookProject[]>([]);

  const load = useCallback(() => {
    getBooks().then(setBooks);
  }, []);

  useFocusEffect(load);

  const handleDelete = (book: BookProject) => {
    Alert.alert('Delete Book', `Remove "${book.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteBook(book.id);
          load();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button
          title="New Book Project"
          icon="add"
          onPress={() => router.push('/book/new')}
        />
      </View>

      {books.length === 0 ? (
        <EmptyState
          icon="book-outline"
          title="No books yet"
          message="Compile your reading materials into a complete reviewer book with bibliography and export to PDF."
        />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {books.map((book) => (
            <Pressable key={book.id} onPress={() => router.push(`/book/${book.id}`)}>
              <Card style={styles.card}>
                <View style={styles.cardTop}>
                  <Ionicons name="book" size={28} color={colors.primary} />
                  <Pressable onPress={() => handleDelete(book)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={18} color={colors.danger} />
                  </Pressable>
                </View>
                <Text style={styles.title}>{book.title}</Text>
                {book.subtitle && <Text style={styles.subtitle}>{book.subtitle}</Text>}
                <Text style={styles.meta}>
                  by {book.author} · {book.sections.length} section
                  {book.sections.length !== 1 ? 's' : ''}
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
  title: { fontSize: 17, fontWeight: '600', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  meta: { fontSize: 12, color: colors.accent, marginTop: spacing.sm },
});
