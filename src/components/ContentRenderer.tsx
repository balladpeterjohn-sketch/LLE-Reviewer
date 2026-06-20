import { Image, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { getCitations } from '../services/storage';
import { colors, spacing } from '../theme';
import { CalloutVariant, Citation, ContentBlock } from '../types';
import { formatCitation } from '../utils/citation';
import {
  getImageLayout,
  getImageSize,
  getNativeFullImageStyle,
  getNativeSideImageSize,
  getNativeStackedImageStyle,
  isStackedLayout,
} from '../utils/imageLayout';

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
          <Image
            source={{ uri: block.imageUri }}
            style={[styles.fullImage, getNativeFullImageStyle(getImageSize(block))]}
            resizeMode="contain"
          />
          {block.caption ? <Text style={styles.caption}>{block.caption}</Text> : null}
        </View>
      ) : null;
    case 'image-text': {
      const layout = getImageLayout(block);
      const size = getImageSize(block);
      const stacked = isStackedLayout(layout);
      const imageStyle = stacked
        ? getNativeStackedImageStyle(size)
        : getNativeSideImageSize(size);

      const image = block.imageUri ? (
        <Image
          source={{ uri: block.imageUri }}
          style={[stacked ? styles.stackedImage : styles.sideImage, imageStyle]}
          resizeMode="cover"
        />
      ) : (
        <View style={[stacked ? styles.stackedImage : styles.sideImage, imageStyle, styles.imagePlaceholder]}>
          <Text style={styles.placeholderLabel}>No image</Text>
        </View>
      );
      const text = (
        <View style={[styles.sideTextWrap, layout === 'center' && styles.centerTextWrap]}>
          <Text style={styles.paragraph}>{block.text || ''}</Text>
          {block.caption ? <Text style={styles.caption}>{block.caption}</Text> : null}
        </View>
      );

      const content =
        layout === 'right' || layout === 'wrap-right' ? (
          <>
            {text}
            {image}
          </>
        ) : layout === 'bottom' ? (
          <>
            {text}
            {image}
          </>
        ) : (
          <>
            {image}
            {text}
          </>
        );

      return (
        <View
          style={[
            stacked ? styles.stackedLayout : styles.imageTextRow,
            compact && !stacked && styles.imageTextRowCompact,
            layout === 'center' && styles.centeredLayout,
          ]}
        >
          {content}
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
    case 'callout': {
      const variant = block.calloutVariant ?? 'note';
      const label = variant.charAt(0).toUpperCase() + variant.slice(1);
      return (
        <View style={[styles.callout, calloutStyles[variant]]}>
          <Text style={styles.calloutLabel}>{label}</Text>
          <Text style={styles.calloutText}>{block.text || ''}</Text>
        </View>
      );
    }
    case 'footnote':
      return (
        <View style={styles.footnote}>
          <Text style={styles.footnoteText}>
            <Text style={styles.footnoteMark}>* </Text>
            {block.text || ''}
          </Text>
        </View>
      );
    case 'divider':
      return (
        <View style={styles.dividerWrap}>
          <View style={styles.dividerLine} />
        </View>
      );
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

const calloutStyles: Record<CalloutVariant, { backgroundColor: string; borderLeftColor: string }> = {
  note: { backgroundColor: '#E8F0EC', borderLeftColor: colors.primary },
  tip: { backgroundColor: '#FFF8E7', borderLeftColor: colors.accent },
  important: { backgroundColor: '#E8EEF8', borderLeftColor: '#2D6A4F' },
  warning: { backgroundColor: '#FDEEEE', borderLeftColor: colors.danger },
};

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
  figure: { gap: spacing.sm, alignItems: 'center' },
  fullImage: { borderRadius: 10, backgroundColor: '#EEE' },
  imageTextRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  imageTextRowCompact: { flexDirection: 'column' },
  stackedLayout: { gap: spacing.md },
  centeredLayout: { alignItems: 'center' },
  sideImage: {
    borderRadius: 10,
    backgroundColor: '#EEE',
  },
  stackedImage: {
    borderRadius: 10,
    backgroundColor: '#EEE',
  },
  sideTextWrap: { flex: 1, gap: spacing.sm },
  centerTextWrap: { alignItems: 'center' },
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
  callout: {
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: spacing.md,
    gap: spacing.xs,
  },
  calloutLabel: { fontSize: 13, fontWeight: '700', color: colors.primary },
  calloutText: { fontSize: 14, lineHeight: 22, color: colors.text },
  footnote: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
  },
  footnoteMark: { fontSize: 12, fontWeight: '700', color: colors.accent },
  footnoteText: { fontSize: 12, lineHeight: 18, color: colors.textSecondary },
  dividerWrap: { paddingVertical: spacing.md },
  dividerLine: { height: 2, backgroundColor: colors.accent, borderRadius: 1 },
});
