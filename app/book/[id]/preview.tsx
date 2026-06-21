import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { getBook, getCitations, getMaterials } from '../../../src/services/storage';
import { buildBookPreviewHtml } from '../../../src/utils/bookExport';
import { colors, spacing } from '../../../src/theme';
import { Citation, ReadingMaterial } from '../../../src/types';

interface WebViewMsg {
  type: 'pageChange';
  page: number;
  total: number;
  title: string;
}

export default function BookPreviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [html, setHtml] = useState<string | null>(null);
  const [bookTitle, setBookTitle] = useState('Book Preview');
  const [pageInfo, setPageInfo] = useState({ page: 1, total: 0 });
  const [chapterTitle, setChapterTitle] = useState('');
  const titleFade = useRef(new Animated.Value(0)).current;

  const showTitle = useCallback(
    (title: string) => {
      if (!title) return;
      setChapterTitle(title);
      Animated.sequence([
        Animated.timing(titleFade, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.delay(2000),
        Animated.timing(titleFade, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    },
    [titleFade]
  );

  const load = useCallback(() => {
    if (!id) return;
    Promise.all([getBook(id), getMaterials(), getCitations()]).then(([book, materials, citations]) => {
      if (!book) {
        setHtml('<html><body style="background:#18181c;color:#fff;padding:40px;font-family:Georgia,serif;"><p>Book not found.</p></body></html>');
        return;
      }
      setBookTitle(book.title);
      const ordered = book.sections
        .sort((a, b) => a.order - b.order)
        .map((s) => materials.find((m) => m.id === s.materialId))
        .filter((m): m is ReadingMaterial => !!m);
      setHtml(buildBookPreviewHtml(book, ordered, citations as Citation[]));
    });
  }, [id]);

  useFocusEffect(load);

  const handleMessage = useCallback(
    (e: WebViewMessageEvent) => {
      try {
        const msg: WebViewMsg = JSON.parse(e.nativeEvent.data);
        if (msg.type === 'pageChange') {
          setPageInfo({ page: msg.page, total: msg.total });
          if (msg.title) showTitle(msg.title);
        }
      } catch { /* ignore */ }
    },
    [showTitle]
  );

  return (
    <View style={styles.container}>
      {/* Toolbar */}
      <View style={styles.toolbar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </Pressable>

        <View style={styles.titleWrap}>
          <Text style={styles.toolbarTitle} numberOfLines={1}>{bookTitle}</Text>
          {pageInfo.total > 0 && (
            <Text style={styles.toolbarPageInfo}>
              Page {pageInfo.page} of {pageInfo.total}
            </Text>
          )}
        </View>

        <View style={styles.spacer} />
      </View>

      {/* Chapter toast */}
      <Animated.View style={[styles.chapterToast, { opacity: titleFade }]} pointerEvents="none">
        <Ionicons name="bookmark" size={11} color="rgba(201,162,39,0.8)" />
        <Text style={styles.chapterToastText} numberOfLines={1}>{chapterTitle}</Text>
      </Animated.View>

      {html ? (
        <WebView
          originWhitelist={['*']}
          source={{ html }}
          style={styles.webview}
          onMessage={handleMessage}
          javaScriptEnabled
          allowsInlineMediaPlayback
          scrollEnabled={false}
        />
      ) : (
        <View style={styles.loading}>
          <View style={styles.loadingBook}>
            <Ionicons name="book" size={44} color={colors.accent} />
          </View>
          <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 20 }} />
          <Text style={styles.loadingText}>Preparing your book…</Text>
          <Text style={styles.loadingHint}>Swipe left/right or tap ‹ › to flip pages</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#18181c' },

  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(201,162,39,0.2)',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },

  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  titleWrap: { flex: 1, alignItems: 'center' },

  toolbarTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  toolbarPageInfo: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 1,
  },

  spacer: { width: 34 },

  chapterToast: {
    position: 'absolute',
    top: 54,
    left: spacing.xl,
    right: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(20,40,28,0.92)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    zIndex: 50,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(201,162,39,0.2)',
  },
  chapterToastText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontStyle: 'italic',
    flexShrink: 1,
  },

  webview: { flex: 1, backgroundColor: '#18181c' },

  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#18181c',
    gap: 6,
    paddingHorizontal: spacing.xl,
  },

  loadingBook: {
    width: 90,
    height: 90,
    borderRadius: 18,
    backgroundColor: 'rgba(27,77,62,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(201,162,39,0.2)',
  },

  loadingText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 8,
  },

  loadingHint: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
});
