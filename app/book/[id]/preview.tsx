import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { getBook, getCitations, getMaterials } from '../../../src/services/storage';
import { buildBookHtml } from '../../../src/utils/bookExport';
import { colors, spacing } from '../../../src/theme';
import { Citation, ReadingMaterial } from '../../../src/types';

export default function BookPreviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [html, setHtml] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!id) return;
    Promise.all([getBook(id), getMaterials(), getCitations()]).then(([book, materials, citations]) => {
      if (!book) {
        setHtml('<html><body><p>Book not found</p></body></html>');
        return;
      }
      const ordered = book.sections
        .sort((a, b) => a.order - b.order)
        .map((s) => materials.find((m) => m.id === s.materialId))
        .filter((m): m is ReadingMaterial => !!m);
      setHtml(buildBookHtml(book, ordered, citations as Citation[]));
    });
  }, [id]);

  useFocusEffect(load);

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.toolbarTitle}>Book Preview</Text>
        <View style={styles.spacer} />
      </View>
      {html ? (
        <WebView
          originWhitelist={['*']}
          source={{ html }}
          style={styles.webview}
          scalesPageToFit
        />
      ) : (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading preview...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    gap: spacing.sm,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { color: '#fff', fontSize: 15 },
  toolbarTitle: { color: '#fff', fontSize: 16, fontWeight: '600', flex: 1, textAlign: 'center' },
  spacer: { width: 60 },
  webview: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  loadingText: { color: colors.textSecondary },
});
