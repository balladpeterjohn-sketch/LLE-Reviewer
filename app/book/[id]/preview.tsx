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

interface WebViewMessage {
  type: 'pageVisible';
  title: string;
  id: string;
}

export default function BookPreviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [html, setHtml] = useState<string | null>(null);
  const [bookTitle, setBookTitle] = useState('Book Preview');
  const [currentSection, setCurrentSection] = useState('');
  const [sectionVisible, setSectionVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const showSection = useCallback(
    (title: string) => {
      if (!title) return;
      setCurrentSection(title);
      setSectionVisible(true);
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.delay(2200),
        Animated.timing(fadeAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]).start(() => setSectionVisible(false));
    },
    [fadeAnim]
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
    (event: WebViewMessageEvent) => {
      try {
        const msg: WebViewMessage = JSON.parse(event.nativeEvent.data);
        if (msg.type === 'pageVisible' && msg.title) {
          showSection(msg.title);
        }
      } catch {
        /* ignore non-JSON messages */
      }
    },
    [showSection]
  );

  return (
    <View style={styles.container}>
      {/* Toolbar */}
      <View style={styles.toolbar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={21} color="#fff" />
        </Pressable>
        <View style={styles.titleBlock}>
          <Text style={styles.toolbarTitle} numberOfLines={1}>{bookTitle}</Text>
          <Text style={styles.toolbarSubtitle}>Book Preview</Text>
        </View>
        <View style={styles.spacer} />
      </View>

      {/* Section toast */}
      {sectionVisible && (
        <Animated.View style={[styles.sectionToast, { opacity: fadeAnim }]}>
          <Text style={styles.sectionToastText} numberOfLines={1}>{currentSection}</Text>
        </Animated.View>
      )}

      {html ? (
        <WebView
          originWhitelist={['*']}
          source={{ html }}
          style={styles.webview}
          onMessage={handleMessage}
          allowsInlineMediaPlayback
          javaScriptEnabled
        />
      ) : (
        <View style={styles.loading}>
          <View style={styles.bookIconContainer}>
            <Ionicons name="book" size={48} color={colors.accent} />
          </View>
          <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 16 }} />
          <Text style={styles.loadingText}>Preparing your book…</Text>
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
    borderBottomColor: 'rgba(201,162,39,0.25)',
  },

  backBtn: {
    padding: 4,
    borderRadius: 6,
  },

  titleBlock: {
    flex: 1,
    alignItems: 'center',
  },

  toolbarTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  toolbarSubtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 1,
  },

  spacer: { width: 29 },

  sectionToast: {
    position: 'absolute',
    top: 58,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: 'rgba(27,77,62,0.92)',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 14,
    zIndex: 100,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(201,162,39,0.3)',
  },

  sectionToastText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  webview: { flex: 1, backgroundColor: '#18181c' },

  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#18181c',
    gap: 4,
  },

  bookIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 16,
    backgroundColor: 'rgba(27,77,62,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(201,162,39,0.2)',
  },

  loadingText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 8,
  },
});
