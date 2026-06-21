import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { getCitations } from '../services/storage';
import { colors, spacing } from '../theme';
import { CalloutVariant, Citation, ContentBlock } from '../types';
import { formatCitation } from '../utils/citation';
import { parseRichText, RichTextSpan } from '../utils/richText';
import {
  getImageLayout,
  getImageSize,
  getImageWrap,
  hasImageWrapText,
  getNativeFullImageStyle,
  getNativeSideImageSize,
  getNativeStackedImageStyle,
  getNativeMagazineImageSize,
  getNativeInsetImageSize,
  getNativeBannerImageSize,
  isStackedLayout,
  isMagazineLayout,
  isInsetLayout,
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

function RichText({ text, style }: { text: string; style?: object }) {
  const spans = parseRichText(text ?? '');
  const hasFmt = spans.some((s) => s.bold || s.italic || s.underline || s.highlight || s.strikethrough);
  if (!hasFmt) return <Text style={style}>{text}</Text>;
  return (
    <Text style={style}>
      {spans.map((span, i) => (
        <RichSpan key={i} span={span} />
      ))}
    </Text>
  );
}

function RichSpan({ span }: { span: RichTextSpan }) {
  const spanStyle: object[] = [];
  if (span.bold)          spanStyle.push({ fontWeight: '700' as const });
  if (span.italic)        spanStyle.push({ fontStyle: 'italic' as const });
  if (span.underline)     spanStyle.push({ textDecorationLine: 'underline' as const });
  if (span.strikethrough) spanStyle.push({ textDecorationLine: 'line-through' as const });
  if (span.highlight)     spanStyle.push({ backgroundColor: '#FFF3CD' });
  return <Text style={spanStyle.length > 0 ? spanStyle : undefined}>{span.text}</Text>;
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
      return <RichText text={block.text ?? ''} style={styles.paragraph} />;
    case 'bullet-list':
    case 'numbered-list': {
      const items = block.items ?? [];
      if (items.length === 0) return null;
      return (
        <View style={styles.listBlock}>
          {items.map((item, i) => (
            <View key={i} style={styles.listRow}>
              {block.type === 'numbered-list' ? (
                <View style={styles.listNumBadge}>
                  <Text style={styles.listNumText}>{i + 1}</Text>
                </View>
              ) : (
                <View style={styles.listBullet} />
              )}
              <RichText text={item} style={styles.listItemText} />
            </View>
          ))}
        </View>
      );
    }
    case 'checklist': {
      const items = block.items ?? [];
      const checked = block.checkedItems ?? items.map(() => false);
      if (items.length === 0) return null;
      return (
        <View style={styles.listBlock}>
          {items.map((item, i) => (
            <View key={i} style={styles.listRow}>
              <Ionicons
                name={checked[i] ? 'checkbox' : 'square-outline'}
                size={18}
                color={checked[i] ? colors.primary : colors.textTertiary}
                style={{ marginTop: 2 }}
              />
              <RichText
                text={item}
                style={[styles.listItemText, checked[i] && styles.listItemDone]}
              />
            </View>
          ))}
        </View>
      );
    }
    case 'code':
      return (
        <View style={styles.codeBlock}>
          {block.codeLanguage ? (
            <Text style={styles.codeLang}>{block.codeLanguage}</Text>
          ) : null}
          <Text style={styles.codeText} selectable>{block.text ?? ''}</Text>
        </View>
      );
    case 'quote':
      return (
        <View style={styles.quote}>
          <RichText text={block.text ?? ''} style={styles.quoteText} />
        </View>
      );
    case 'image':
      if (!block.imageUri) return null;
      if (hasImageWrapText(block)) {
        const wrap = getImageWrap(block) as 'wrap-left' | 'wrap-right';
        const imageLeft = wrap === 'wrap-left';
        const size = getImageSize(block);
        const imageStyle = getNativeSideImageSize(size);
        const image = (
          <Image
            source={{ uri: block.imageUri }}
            style={[styles.sideImage, imageStyle]}
            resizeMode="cover"
          />
        );
        const text = (
          <View style={styles.sideTextWrap}>
            <Text style={styles.paragraph}>{block.text || ''}</Text>
            {block.caption ? <Text style={styles.caption}>{block.caption}</Text> : null}
          </View>
        );
        return (
          <View style={styles.imageTextRow}>
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
      return (
        <View style={styles.figure}>
          <Image
            source={{ uri: block.imageUri }}
            style={[styles.fullImage, getNativeFullImageStyle(getImageSize(block))]}
            resizeMode="contain"
          />
          {block.caption ? <Text style={styles.caption}>{block.caption}</Text> : null}
        </View>
      );
    case 'image-text': {
      const layout = getImageLayout(block);
      const size = getImageSize(block);
      const stacked = isStackedLayout(layout);
      const magazine = isMagazineLayout(layout);
      const inset = isInsetLayout(layout);
      const banner = layout === 'banner';

      if (banner) {
        const bannerSize = getNativeBannerImageSize(size);
        return (
          <View style={styles.bannerBlock}>
            {block.imageUri ? (
              <Image source={{ uri: block.imageUri }} style={[styles.bannerImage, bannerSize]} resizeMode="cover" />
            ) : null}
            {block.text ? <Text style={styles.paragraph}>{block.text}</Text> : null}
            {block.caption ? <Text style={styles.caption}>{block.caption}</Text> : null}
          </View>
        );
      }

      if (inset) {
        const insetSize = getNativeInsetImageSize(size);
        const isLeft = layout === 'inset-left';
        return (
          <View style={styles.figure}>
            <View style={styles.imageTextRow}>
              {isLeft && block.imageUri ? (
                <Image source={{ uri: block.imageUri }} style={[styles.insetImage, insetSize]} resizeMode="cover" />
              ) : null}
              <View style={styles.sideTextWrap}>
                <Text style={styles.paragraph}>{block.text || ''}</Text>
                {block.caption ? <Text style={styles.caption}>{block.caption}</Text> : null}
              </View>
              {!isLeft && block.imageUri ? (
                <Image source={{ uri: block.imageUri }} style={[styles.insetImage, insetSize]} resizeMode="cover" />
              ) : null}
            </View>
          </View>
        );
      }

      if (magazine) {
        const magSize = getNativeMagazineImageSize(size);
        const isLeft = layout === 'magazine-left';
        const imageNode = block.imageUri ? (
          <Image source={{ uri: block.imageUri }} style={[styles.magazineImage, magSize]} resizeMode="cover" />
        ) : (
          <View style={[styles.magazineImage, magSize, styles.imagePlaceholder]}>
            <Text style={styles.placeholderLabel}>No image</Text>
          </View>
        );
        const textNode = (
          <View style={styles.sideTextWrap}>
            <Text style={styles.paragraph}>{block.text || ''}</Text>
            {block.caption ? <Text style={styles.caption}>{block.caption}</Text> : null}
          </View>
        );
        return (
          <View style={styles.magazineRow}>
            {isLeft ? <>{imageNode}{textNode}</> : <>{textNode}{imageNode}</>}
          </View>
        );
      }

      const imageStyle = stacked ? getNativeStackedImageStyle(size) : getNativeSideImageSize(size);
      const image = block.imageUri ? (
        <Image source={{ uri: block.imageUri }} style={[stacked ? styles.stackedImage : styles.sideImage, imageStyle]} resizeMode="cover" />
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

      const isRightLayout = layout === 'right' || layout === 'wrap-right';
      const content = isRightLayout ? <>{text}{image}</> : layout === 'bottom' ? <>{text}{image}</> : <>{image}{text}</>;

      return (
        <View style={[stacked ? styles.stackedLayout : styles.imageTextRow, compact && !stacked && styles.imageTextRowCompact, layout === 'center' && styles.centeredLayout]}>
          {content}
        </View>
      );
    }
    case 'image-collage': {
      const uris = block.imageUris ?? [];
      const cols = block.collageColumns ?? 2;
      const size = getImageSize(block);
      const thumbHeight = size === 'small' ? 80 : size === 'large' ? 150 : size === 'full' ? 180 : 110;
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
                  { height: thumbHeight },
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
  magazineRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  magazineImage: {
    borderRadius: 10,
    backgroundColor: '#EEE',
    width: '45%',
  },
  insetImage: {
    borderRadius: 8,
    backgroundColor: '#EEE',
  },
  bannerBlock: {
    gap: spacing.sm,
  },
  bannerImage: {
    width: '100%',
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

  /* Lists */
  listBlock: { gap: 6 },
  listRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  listBullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginTop: 8, flexShrink: 0 },
  listNumBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  listNumText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  listItemText: { flex: 1, fontSize: 15, lineHeight: 24, color: colors.text },
  listItemDone: { textDecorationLine: 'line-through', color: colors.textTertiary },

  /* Code */
  codeBlock: { backgroundColor: colors.surfaceSubtle, borderRadius: 8, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  codeLang: { fontSize: 10, fontWeight: '700', color: colors.primary, backgroundColor: colors.primaryMuted, paddingHorizontal: spacing.sm, paddingVertical: 3, textTransform: 'uppercase', letterSpacing: 0.5 },
  codeText: { fontFamily: 'monospace', fontSize: 13, color: colors.text, padding: spacing.sm, lineHeight: 20 },
});
