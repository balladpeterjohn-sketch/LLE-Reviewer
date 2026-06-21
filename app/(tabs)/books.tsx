import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { deleteBook, getBooks } from '../../src/services/storage';
import { Button, EmptyState } from '../../src/components/ui';
import { useTheme } from '../../src/contexts/ThemeContext';
import { radius, shadow, spacing, typography } from '../../src/theme';
import { BookProject } from '../../src/types';

export default function BooksScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [books, setBooks] = useState<BookProject[]>([]);

  const load = useCallback(() => { getBooks().then(setBooks); }, []);
  useFocusEffect(load);

  const handleDelete = (book: BookProject) => {
    Alert.alert('Delete Book', `Remove "${book.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteBook(book.id); load(); } },
    ]);
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header:    { padding: spacing.md, paddingBottom: spacing.sm },
    list:      { padding: spacing.md, paddingTop: 0, gap: spacing.sm, paddingBottom: 80 },

    card:    { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: spacing.sm, ...shadow.sm },
    cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
    iconBox: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    metaBox: { flex: 1 },
    sections:{ ...typography.micro, color: colors.textTertiary, textTransform: 'uppercase' },
    year:    { ...typography.caption, color: colors.accent, fontWeight: '600', marginTop: 2 },
    delBtn:  { padding: 6, borderRadius: radius.sm, backgroundColor: colors.dangerMuted },

    title:   { ...typography.heading, color: colors.text },
    sub:     { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
    author:  { ...typography.caption, color: colors.accent, fontWeight: '600', marginTop: 4 },

    tags:    { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, paddingTop: spacing.xs, borderTopWidth: 1, borderTopColor: colors.border },
    tag:     { backgroundColor: colors.primaryMuted, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.full },
    tagText: { ...typography.micro, color: colors.primary, textTransform: 'uppercase' },

    arrow:   { position: 'absolute', bottom: spacing.md, right: spacing.md },
  });

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Button title="New Book Project" icon="add" onPress={() => router.push('/book/new')} />
      </View>

      {books.length === 0 ? (
        <EmptyState icon="book-outline" title="No books yet" message="Compile reading materials into a structured reviewer book and export as PDF." />
      ) : (
        <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
          {books.map((book) => (
            <Pressable key={book.id} onPress={() => router.push(`/book/${book.id}`)}>
              <View style={s.card}>
                <View style={s.cardTop}>
                  <View style={s.iconBox}><Ionicons name="book" size={22} color={colors.primary} /></View>
                  <View style={s.metaBox}>
                    <Text style={s.sections}>{book.sections.length} section{book.sections.length !== 1 ? 's' : ''}</Text>
                    {book.settings.year ? <Text style={s.year}>{book.settings.year}</Text> : null}
                  </View>
                  <Pressable style={s.delBtn} onPress={() => handleDelete(book)} hitSlop={10}>
                    <Ionicons name="trash-outline" size={14} color={colors.danger} />
                  </Pressable>
                </View>

                <Text style={s.title} numberOfLines={2}>{book.title}</Text>
                {book.subtitle ? <Text style={s.sub} numberOfLines={1}>{book.subtitle}</Text> : null}
                <Text style={s.author}>by {book.author}</Text>

                <View style={s.tags}>
                  {book.settings.includeTitlePage && <View style={s.tag}><Text style={s.tagText}>Title</Text></View>}
                  {book.settings.includeTableOfContents && <View style={s.tag}><Text style={s.tagText}>TOC</Text></View>}
                  {book.settings.includeBibliography && <View style={s.tag}><Text style={s.tagText}>Refs</Text></View>}
                  {book.settings.groupBySubject && <View style={s.tag}><Text style={s.tagText}>Parts</Text></View>}
                </View>

                <View style={s.arrow}><Ionicons name="arrow-forward-circle" size={22} color={colors.primaryLight} /></View>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
