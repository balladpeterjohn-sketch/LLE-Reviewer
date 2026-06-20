import { Image, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { getCitations } from '../services/storage';
import { colors, spacing } from '../theme';
import { Citation, ContentBlock } from '../types';
import { formatCitation } from '../utils/citation';

interface ContentRendererProps {
  blocks: ContentBlock[];
  compact?: boolean;
}

export function ContentRenderer({ blocks, compact }: ContentRendererProps) {
  const [citations, setCitations] = useState<Map<string, Citation>>(new Map());

  useEffect(() => {
    getCitations().then((list) => setCitations(new Map(list.map((c) => [c.id, c]))));
  }, []);

  return (
    <View style={styles.container}>
      {blocks.map((block) => (
        <BlockView key={block.id} block={block} citations={citations} compact={compact} />
      ))}
    </View>
  );
}

function BlockView({
  block,
  citations,
  compact,
}: {
  block: ContentBlock;
  citations: Map<string, Citation>;
  compact?: boolean;
}) {
  switch (block.type) {
    case 'heading': {
      const size = block.level === 1 ? 22 : block.level === 3 ? 16 : 18;
      return (
        <Text style={[styles.heading, { fontSize: size }]}>
          {block.text || ''}
        </Text>
      );
    }
    case 'paragraph':
      return <Text style={styles.paragraph}>{block.text || ''}</Text>;
    case 'quote':
      return (
        <View style={styles.quote}>
          <Text style={styles.quoteText}>{block.text || ''}</Text>
        </View>
      );
    case 'image':
      return block.imageUri ? (
        <View style={styles.figure}>
          <Image source={{ uri: block.imageUri }} style={styles.fullImage} resizeMode="contain" />
          {block.caption ? <Text style={styles.caption}>{block.caption}</Text> : null}
        </View>
      ) : null;
    case 'image-text': {
      const imageLeft = (block.imagePosition ?? 'left') === 'left';
      const image = block.imageUri ? (
        <Image source={{ uri: block.imageUri }} style={styles.sideImage} resizeMode="cover" />
      ) : (
        <View style={[styles.sideImage, styles.imagePlaceholder]}>
          <Text style={styles.placeholderLabel}>No image</Text>
        </View>
      );
      const text = (
        <View style={styles.sideTextWrap}>
          <Text style={styles.paragraph}>{block.text || ''}</Text>
          {block.caption ? <Text style={styles.caption}>{block.caption}</Text> : null}
        </View>
      );
      return (
        <View style={[styles.imageTextRow, compact && styles.imageTextRowCompact]}>
          {imageLeft ? (
            <>
              {image}
              {text}
            </>
          ) : (
            <>
              {text}
              {image}
            </>
          )}
        </View>
      );
    }
    case 'image-collage': {
      const uris = block.imageUris ?? [];
      const cols = block.collageColumns ?? 2;
      if (uris.length === 0) return null;
      return (
        <View style={styles.figure}>
          <View style={styles.collageGrid}>
            {uris.map((uri, i) => (
              <Image
                key={`${uri}-${i}`}
                source={{ uri }}
                style={[
                  styles.collageImage,
                  cols === 2 ? styles.collageTwo : styles.collageThree,
                ]}
                resizeMode="cover"
              />
            ))}
          </View>
          {block.caption ? <Text style={styles.caption}>{block.caption}</Text> : null}
        </View>
      );
    }
    case 'table':
      return <TableView rows={block.rows ?? []} />;
    case 'citation': {
      const citation = block.citationId ? citations.get(block.citationId) : undefined;
      if (!citation) return null;
      return <Text style={styles.citation}>{formatCitation(citation)}</Text>;
    }
    default:
      return null;
  }
}

function TableView({ rows }: { rows: { value: string }[][] }) {
  if (rows.length === 0) return null;
  const [header, ...body] = rows;
  return (
    <View style={styles.table}>
      <View style={[styles.tableRow, styles.tableHeaderRow]}>
        {header.map((cell, i) => (
          <Text key={i} style={[styles.tableCell, styles.tableHeaderCell]}>
            {cell.value}
          </Text>
        ))}
      </View>
      {body.map((row, ri) => (
        <View key={ri} style={styles.tableRow}>
          {row.map((cell, ci) => (
            <Text key={ci} style={styles.tableCell}>
              {cell.value}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  heading: { fontWeight: '700', color: colors.primary, marginTop: spacing.sm },
  paragraph: { fontSize: 15, lineHeight: 24, color: colors.text },
  quote: {
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
    backgroundColor: '#F9F7F2',
    padding: spacing.md,
    borderRadius: 8,
  },
  quoteText: { fontSize: 15, fontStyle: 'italic', lineHeight: 22, color: colors.text },
  figure: { gap: spacing.sm },
  fullImage: { width: '100%', height: 220, borderRadius: 10, backgroundColor: '#EEE' },
  imageTextRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  imageTextRowCompact: { flexDirection: 'column' },
  sideImage: {
    width: 140,
    height: 140,
    borderRadius: 10,
    backgroundColor: '#EEE',
  },
  sideTextWrap: { flex: 1, gap: spacing.sm },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  placeholderLabel: { fontSize: 12, color: colors.textSecondary },
  collageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  collageImage: { borderRadius: 10, backgroundColor: '#EEE', height: 120 },
  collageTwo: { width: '48%' },
  collageThree: { width: '31%' },
  caption: { fontSize: 12, color: colors.textSecondary, fontStyle: 'italic', textAlign: 'center' },
  table: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableRow: { flexDirection: 'row' },
  tableHeaderRow: { backgroundColor: '#E8F0EC' },
  tableCell: {
    flex: 1,
    padding: spacing.sm,
    fontSize: 13,
    color: colors.text,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  tableHeaderCell: { fontWeight: '700' },
  citation: {
    fontSize: 13,
    fontStyle: 'italic',
    color: colors.textSecondary,
    paddingLeft: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.border,
  },
});
