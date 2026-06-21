import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { generateId } from '../utils/id';
import { getCitations } from '../services/storage';
import { colors, spacing } from '../theme';
import { Citation, ContentBlock, ImageLayout, ImageSize, ImageWrap } from '../types';
import { formatCitation } from '../utils/citation';
import {
  IMAGE_LAYOUT_DESCRIPTIONS,
  IMAGE_LAYOUT_LABELS,
  IMAGE_LAYOUTS,
  IMAGE_SIZE_LABELS,
  IMAGE_SIZES,
  IMAGE_WRAP_LABELS,
  IMAGE_WRAP_OPTIONS,
  getImageLayout,
  getImageSize,
  getImageWrap,
  getNativeFullImageStyle,
  getNativeSideImageSize,
  getNativeStackedImageStyle,
  isMagazineLayout,
  isStackedLayout,
} from '../utils/imageLayout';
import { Button } from './ui';

interface ContentEditorProps {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
}

function countWords(blocks: ContentBlock[]): number {
  let count = 0;
  for (const b of blocks) {
    if (b.text) count += b.text.trim().split(/\s+/).filter(Boolean).length;
    if (b.rows) {
      for (const row of b.rows) {
        for (const cell of row) {
          if (cell.value) count += cell.value.trim().split(/\s+/).filter(Boolean).length;
        }
      }
    }
  }
  return count;
}

export function ContentEditor({ blocks, onChange }: ContentEditorProps) {
  const [citationPickerVisible, setCitationPickerVisible] = useState(false);
  const [citationTargetIndex, setCitationTargetIndex] = useState<number | null>(null);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [layoutPickerIndex, setLayoutPickerIndex] = useState<number | null>(null);

  const wordCount = useMemo(() => countWords(blocks), [blocks]);
  const readingMinutes = Math.max(1, Math.round(wordCount / 200));

  const updateBlock = (index: number, patch: Partial<ContentBlock>) => {
    const next = blocks.map((b, i) => (i === index ? { ...b, ...patch } : b));
    onChange(next);
  };

  const addBlock = (type: ContentBlock['type']) => {
    const block: ContentBlock = { id: generateId(), type };
    if (type === 'paragraph' || type === 'quote') block.text = '';
    if (type === 'heading') { block.text = ''; block.level = 2; }
    if (type === 'image') { block.imageSize = 'medium'; block.imageWrap = 'none'; }
    if (type === 'image-text') { block.text = ''; block.imageLayout = 'left'; block.imageSize = 'medium'; }
    if (type === 'image-collage') { block.imageUris = []; block.collageColumns = 2; block.imageSize = 'medium'; }
    if (type === 'callout') { block.text = ''; block.calloutVariant = 'note'; }
    if (type === 'footnote') block.text = '';
    if (type === 'bullet-list' || type === 'numbered-list') block.items = [''];
    if (type === 'checklist') { block.items = ['']; block.checkedItems = [false]; }
    if (type === 'code') block.text = '';
    if (type === 'table') {
      block.rows = [
        [{ value: 'Column 1' }, { value: 'Column 2' }],
        [{ value: '' }, { value: '' }],
      ];
    }
    onChange([...blocks, block]);
  };

  const removeBlock = (index: number) => onChange(blocks.filter((_, i) => i !== index));

  const moveBlock = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const pickImage = async (index: number, field: 'imageUri' | 'collage' = 'imageUri') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      base64: true,
      allowsMultipleSelection: field === 'collage',
    });
    if (result.canceled) return;
    if (field === 'collage') {
      const uris = result.assets.map((asset) =>
        asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri
      );
      const existing = blocks[index].imageUris ?? [];
      updateBlock(index, { imageUris: [...existing, ...uris] });
      return;
    }
    const asset = result.assets[0];
    if (asset) {
      const uri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
      updateBlock(index, { imageUri: uri });
    }
  };

  const removeCollageImage = (blockIndex: number, imageIndex: number) => {
    const uris = [...(blocks[blockIndex].imageUris ?? [])];
    uris.splice(imageIndex, 1);
    updateBlock(blockIndex, { imageUris: uris });
  };

  const openCitationPicker = async (index: number) => {
    const list = await getCitations();
    if (list.length === 0) {
      Alert.alert('No citations', 'Add citations in the Citations tab first.');
      return;
    }
    setCitations(list);
    setCitationTargetIndex(index);
    setCitationPickerVisible(true);
  };

  const selectCitation = (citationId: string) => {
    if (citationTargetIndex !== null) updateBlock(citationTargetIndex, { citationId });
    setCitationPickerVisible(false);
    setCitationTargetIndex(null);
  };

  const updateTableCell = (blockIndex: number, rowIndex: number, colIndex: number, value: string) => {
    const block = blocks[blockIndex];
    if (!block.rows) return;
    const rows = block.rows.map((row, ri) =>
      row.map((cell, ci) => ri === rowIndex && ci === colIndex ? { value } : cell)
    );
    updateBlock(blockIndex, { rows });
  };

  const addTableRow = (blockIndex: number) => {
    const block = blocks[blockIndex];
    if (!block.rows || block.rows.length === 0) return;
    const cols = block.rows[0].length;
    updateBlock(blockIndex, { rows: [...block.rows, Array.from({ length: cols }, () => ({ value: '' }))] });
  };

  const addTableColumn = (blockIndex: number) => {
    const block = blocks[blockIndex];
    if (!block.rows) return;
    updateBlock(blockIndex, { rows: block.rows.map((row) => [...row, { value: '' }]) });
  };

  return (
    <View style={styles.container}>
      {/* Word count bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Ionicons name="text-outline" size={13} color={colors.primary} />
          <Text style={styles.statText}>{wordCount.toLocaleString()} words</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons name="time-outline" size={13} color={colors.primary} />
          <Text style={styles.statText}>~{readingMinutes} min read</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons name="layers-outline" size={13} color={colors.primary} />
          <Text style={styles.statText}>{blocks.length} block{blocks.length !== 1 ? 's' : ''}</Text>
        </View>
      </View>

      {blocks.map((block, index) => (
        <View key={block.id} style={styles.block}>
          {/* Block toolbar */}
          <View style={styles.blockToolbar}>
            <View style={styles.blockTypeWrap}>
              <Text style={styles.blockType}>{block.type.replace('-', ' ').toUpperCase()}</Text>
            </View>
            <View style={styles.toolbarActions}>
              <Pressable onPress={() => moveBlock(index, -1)} disabled={index === 0} hitSlop={6}>
                <Ionicons name="chevron-up" size={19} color={index === 0 ? colors.border : colors.primary} />
              </Pressable>
              <Pressable onPress={() => moveBlock(index, 1)} disabled={index === blocks.length - 1} hitSlop={6}>
                <Ionicons name="chevron-down" size={19} color={index === blocks.length - 1 ? colors.border : colors.primary} />
              </Pressable>
              <Pressable onPress={() => removeBlock(index)} hitSlop={6}>
                <Ionicons name="trash-outline" size={19} color={colors.danger} />
              </Pressable>
            </View>
          </View>

          {/* Paragraph / Quote / Footnote */}
          {(block.type === 'paragraph' || block.type === 'quote' || block.type === 'footnote') && (
            <TextInput
              style={[
                styles.textArea,
                block.type === 'quote' && styles.quoteInput,
                block.type === 'footnote' && styles.footnoteInput,
              ]}
              multiline
              placeholder={
                block.type === 'quote' ? 'Enter quoted text…'
                  : block.type === 'footnote' ? 'Footnote text…'
                  : 'Write your reading material…'
              }
              value={block.text}
              onChangeText={(text) => updateBlock(index, { text })}
              textAlignVertical="top"
            />
          )}

          {/* Callout */}
          {block.type === 'callout' && (
            <View style={styles.calloutEditor}>
              <View style={styles.calloutTypeRow}>
                {(['note', 'tip', 'important', 'warning'] as const).map((variant) => {
                  const active = block.calloutVariant === variant;
                  const accentMap = { note: colors.primary, tip: colors.accent, important: '#2D6A4F', warning: colors.danger };
                  return (
                    <Pressable
                      key={variant}
                      style={[styles.calloutChip, active && { backgroundColor: accentMap[variant], borderColor: accentMap[variant] }]}
                      onPress={() => updateBlock(index, { calloutVariant: variant })}
                    >
                      <Text style={[styles.calloutChipText, active && styles.calloutChipTextActive]}>
                        {variant}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <TextInput
                style={styles.textArea}
                multiline
                placeholder="Callout content…"
                value={block.text}
                onChangeText={(text) => updateBlock(index, { text })}
                textAlignVertical="top"
              />
            </View>
          )}

          {/* Divider */}
          {block.type === 'divider' && (
            <View style={styles.dividerPreview}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerLabel}>Section divider</Text>
            </View>
          )}

          {/* Heading */}
          {block.type === 'heading' && (
            <View style={styles.headingEditor}>
              <View style={styles.levelRow}>
                {([1, 2, 3] as const).map((level) => (
                  <Pressable
                    key={level}
                    style={[styles.levelChip, block.level === level && styles.levelChipActive]}
                    onPress={() => updateBlock(index, { level })}
                  >
                    <Text style={[styles.levelChipText, block.level === level && styles.levelChipTextActive]}>
                      H{level}
                    </Text>
                  </Pressable>
                ))}
                <Text style={styles.headingHint}>
                  {block.level === 1 ? 'Section' : block.level === 2 ? 'Subsection' : 'Sub-subsection'}
                </Text>
              </View>
              <TextInput
                style={[styles.headingInput, { fontSize: block.level === 1 ? 18 : block.level === 2 ? 16 : 14 }]}
                placeholder="Heading text…"
                value={block.text}
                onChangeText={(text) => updateBlock(index, { text })}
              />
            </View>
          )}

          {/* Image */}
          {block.type === 'image' && (
            <View style={styles.mediaCard}>
              <View style={styles.mediaCardHeader}>
                <Ionicons name="image" size={16} color={colors.primary} />
                <Text style={styles.mediaCardTitle}>Image</Text>
              </View>

              <Text style={styles.controlLabel}>Size</Text>
              <View style={styles.chipRow}>
                {IMAGE_SIZES.map((s) => (
                  <Pressable
                    key={s}
                    style={[styles.chip, getImageSize(block) === s && styles.chipActive]}
                    onPress={() => updateBlock(index, { imageSize: s as ImageSize })}
                  >
                    <Text style={[styles.chipText, getImageSize(block) === s && styles.chipTextActive]}>
                      {IMAGE_SIZE_LABELS[s]}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.controlLabel}>Text Wrap</Text>
              <View style={styles.chipRow}>
                {IMAGE_WRAP_OPTIONS.map((w) => (
                  <Pressable
                    key={w}
                    style={[styles.chip, getImageWrap(block) === w && styles.chipActive]}
                    onPress={() => updateBlock(index, { imageWrap: w as ImageWrap })}
                  >
                    <Text style={[styles.chipText, getImageWrap(block) === w && styles.chipTextActive]}>
                      {IMAGE_WRAP_LABELS[w]}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {(getImageWrap(block) === 'wrap-left' || getImageWrap(block) === 'wrap-right') && (
                <TextInput
                  style={styles.textArea}
                  multiline
                  placeholder="Text that wraps around the image…"
                  value={block.text}
                  onChangeText={(text) => updateBlock(index, { text })}
                  textAlignVertical="top"
                />
              )}

              {block.imageUri ? (
                <Image
                  source={{ uri: block.imageUri }}
                  style={[styles.previewImage, getNativeFullImageStyle(getImageSize(block))]}
                  resizeMode="contain"
                />
              ) : (
                <Pressable style={styles.imagePlaceholder} onPress={() => pickImage(index)}>
                  <Ionicons name="cloud-upload-outline" size={28} color={colors.textSecondary} />
                  <Text style={styles.placeholderText}>Tap to add image</Text>
                </Pressable>
              )}

              <TextInput
                style={styles.captionInput}
                placeholder="Caption (optional)"
                value={block.caption}
                onChangeText={(caption) => updateBlock(index, { caption })}
              />
              {block.imageUri && (
                <Button title="Change Image" onPress={() => pickImage(index)} variant="ghost" size="sm" />
              )}
            </View>
          )}

          {/* Image + Text */}
          {block.type === 'image-text' && (
            <View style={styles.mediaCard}>
              <View style={styles.mediaCardHeader}>
                <Ionicons name="albums" size={16} color={colors.primary} />
                <Text style={styles.mediaCardTitle}>Image + Text</Text>
                <Pressable
                  style={styles.layoutPickerBtn}
                  onPress={() => setLayoutPickerIndex(index)}
                >
                  <Ionicons name="grid-outline" size={14} color={colors.primary} />
                  <Text style={styles.layoutPickerBtnText}>
                    {IMAGE_LAYOUT_LABELS[getImageLayout(block)]}
                  </Text>
                  <Ionicons name="chevron-down" size={12} color={colors.primary} />
                </Pressable>
              </View>

              <Text style={styles.layoutDescHint}>
                {IMAGE_LAYOUT_DESCRIPTIONS[getImageLayout(block)]}
              </Text>

              <Text style={styles.controlLabel}>Image Size</Text>
              <View style={styles.chipRow}>
                {IMAGE_SIZES.map((s) => (
                  <Pressable
                    key={s}
                    style={[styles.chip, getImageSize(block) === s && styles.chipActive]}
                    onPress={() => updateBlock(index, { imageSize: s as ImageSize })}
                  >
                    <Text style={[styles.chipText, getImageSize(block) === s && styles.chipTextActive]}>
                      {IMAGE_SIZE_LABELS[s]}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <ImageTextEditorPreview
                block={block}
                onPickImage={() => pickImage(index)}
                onChangeText={(text) => updateBlock(index, { text })}
              />

              <TextInput
                style={styles.captionInput}
                placeholder="Caption (optional)"
                value={block.caption}
                onChangeText={(caption) => updateBlock(index, { caption })}
              />
              {block.imageUri && (
                <Button title="Change Image" onPress={() => pickImage(index)} variant="ghost" size="sm" />
              )}
            </View>
          )}

          {/* Collage */}
          {block.type === 'image-collage' && (
            <View style={styles.mediaCard}>
              <View style={styles.mediaCardHeader}>
                <Ionicons name="grid" size={16} color={colors.primary} />
                <Text style={styles.mediaCardTitle}>Collage</Text>
              </View>

              <Text style={styles.controlLabel}>Columns</Text>
              <View style={styles.chipRow}>
                {([2, 3] as const).map((cols) => (
                  <Pressable
                    key={cols}
                    style={[styles.chip, block.collageColumns === cols && styles.chipActive]}
                    onPress={() => updateBlock(index, { collageColumns: cols })}
                  >
                    <Text style={[styles.chipText, block.collageColumns === cols && styles.chipTextActive]}>
                      {cols} cols
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.collageGrid}>
                {(block.imageUris ?? []).map((uri, imgIdx) => (
                  <View key={imgIdx} style={styles.collageCellWrap}>
                    <Image source={{ uri }} style={styles.collageCell} resizeMode="cover" />
                    <Pressable style={styles.collageRemove} onPress={() => removeCollageImage(index, imgIdx)}>
                      <Ionicons name="close-circle" size={20} color={colors.danger} />
                    </Pressable>
                  </View>
                ))}
                <Pressable style={styles.collageAdd} onPress={() => pickImage(index, 'collage')}>
                  <Ionicons name="add" size={26} color={colors.primary} />
                  <Text style={styles.collageAddText}>Add</Text>
                </Pressable>
              </View>

              <TextInput
                style={styles.captionInput}
                placeholder="Caption (optional)"
                value={block.caption}
                onChangeText={(caption) => updateBlock(index, { caption })}
              />
            </View>
          )}

          {/* Table */}
          {block.type === 'table' && (
            <View style={styles.tableEditor}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View>
                  {(block.rows ?? []).map((row, ri) => (
                    <View key={ri} style={styles.tableRow}>
                      {row.map((cell, ci) => (
                        <TextInput
                          key={ci}
                          style={[styles.tableCell, ri === 0 && styles.tableHeaderCell]}
                          value={cell.value}
                          onChangeText={(value) => updateTableCell(index, ri, ci, value)}
                          placeholder={ri === 0 ? `Col ${ci + 1}` : ''}
                        />
                      ))}
                    </View>
                  ))}
                </View>
              </ScrollView>
              <View style={styles.tableActions}>
                <Button title="+ Row" onPress={() => addTableRow(index)} variant="ghost" size="sm" />
                <Button title="+ Column" onPress={() => addTableColumn(index)} variant="ghost" size="sm" />
              </View>
            </View>
          )}

          {/* Bullet / Numbered / Checklist */}
          {(block.type === 'bullet-list' || block.type === 'numbered-list' || block.type === 'checklist') && (
            <ListEditor
              block={block}
              onUpdate={(patch) => updateBlock(index, patch)}
            />
          )}

          {/* Code block */}
          {block.type === 'code' && (
            <View style={styles.codeCard}>
              <TextInput
                style={styles.codeInput}
                placeholder="Enter code or preformatted text…"
                value={block.text ?? ''}
                onChangeText={(text) => updateBlock(index, { text })}
                multiline
                textAlignVertical="top"
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
              />
              <TextInput
                style={styles.codeLangInput}
                placeholder="Language (optional, e.g. python)"
                value={block.codeLanguage ?? ''}
                onChangeText={(v) => updateBlock(index, { codeLanguage: v })}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          )}

          {/* Citation */}
          {block.type === 'citation' && (
            <View style={styles.citationBlock}>
              {block.citationId ? (
                <CitationPreview citationId={block.citationId} />
              ) : (
                <Text style={styles.noCitation}>No citation selected</Text>
              )}
              <Button
                title={block.citationId ? 'Change Citation' : 'Select Citation'}
                onPress={() => openCitationPicker(index)}
                variant="outline"
                size="sm"
              />
            </View>
          )}
        </View>
      ))}

      {/* Add block bar */}
      <View style={styles.addSection}>
        <Text style={styles.addLabel}>Add Block</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.addBar} contentContainerStyle={styles.addBarContent}>
          <AddChip icon="text" label="Text" onPress={() => addBlock('paragraph')} />
          <AddChip icon="text-outline" label="Heading" onPress={() => addBlock('heading')} />
          <AddChip icon="list-outline" label="Bullets" onPress={() => addBlock('bullet-list')} />
          <AddChip icon="reorder-three-outline" label="Numbered" onPress={() => addBlock('numbered-list')} />
          <AddChip icon="checkbox-outline" label="Checklist" onPress={() => addBlock('checklist')} />
          <AddChip icon="code-slash-outline" label="Code" onPress={() => addBlock('code')} />
          <AddChip icon="image-outline" label="Image" onPress={() => addBlock('image')} />
          <AddChip icon="albums-outline" label="Img+Text" onPress={() => addBlock('image-text')} />
          <AddChip icon="grid-outline" label="Collage" onPress={() => addBlock('image-collage')} />
          <AddChip icon="grid" label="Table" onPress={() => addBlock('table')} />
          <AddChip icon="chatbox-ellipses-outline" label="Quote" onPress={() => addBlock('quote')} />
          <AddChip icon="information-circle-outline" label="Callout" onPress={() => addBlock('callout')} />
          <AddChip icon="receipt-outline" label="Footnote" onPress={() => addBlock('footnote')} />
          <AddChip icon="remove-outline" label="Divider" onPress={() => addBlock('divider')} />
          <AddChip icon="book-outline" label="Citation" onPress={() => addBlock('citation')} />
        </ScrollView>
      </View>

      {/* Citation picker modal */}
      <Modal visible={citationPickerVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select Citation</Text>
            <ScrollView style={styles.citationList}>
              {citations.map((c) => (
                <Pressable key={c.id} style={styles.citationItem} onPress={() => selectCitation(c.id)}>
                  <Text style={styles.citationAuthor}>{c.authors}</Text>
                  <Text style={styles.citationItemTitle} numberOfLines={2}>{c.title} ({c.year})</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Button title="Cancel" onPress={() => setCitationPickerVisible(false)} variant="outline" />
          </View>
        </View>
      </Modal>

      {/* Layout picker modal */}
      {layoutPickerIndex !== null && (
        <Modal visible animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Choose Layout</Text>
              <ScrollView style={styles.layoutList}>
                {IMAGE_LAYOUTS.map((layout) => {
                  const active = getImageLayout(blocks[layoutPickerIndex]) === layout;
                  return (
                    <Pressable
                      key={layout}
                      style={[styles.layoutItem, active && styles.layoutItemActive]}
                      onPress={() => {
                        updateBlock(layoutPickerIndex, { imageLayout: layout });
                        setLayoutPickerIndex(null);
                      }}
                    >
                      <View style={styles.layoutItemLeft}>
                        <Text style={[styles.layoutItemName, active && styles.layoutItemNameActive]}>
                          {IMAGE_LAYOUT_LABELS[layout]}
                        </Text>
                        <Text style={styles.layoutItemDesc}>{IMAGE_LAYOUT_DESCRIPTIONS[layout]}</Text>
                      </View>
                      {active && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                    </Pressable>
                  );
                })}
              </ScrollView>
              <Button title="Cancel" onPress={() => setLayoutPickerIndex(null)} variant="outline" />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

function AddChip({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.addChip} onPress={onPress}>
      <Ionicons name={icon} size={16} color={colors.primary} />
      <Text style={styles.addChipText}>{label}</Text>
    </Pressable>
  );
}

function ImageTextEditorPreview({
  block,
  onPickImage,
  onChangeText,
}: {
  block: ContentBlock;
  onPickImage: () => void;
  onChangeText: (text: string) => void;
}) {
  const layout = getImageLayout(block);
  const size = getImageSize(block);
  const stacked = isStackedLayout(layout);
  const magazine = isMagazineLayout(layout);
  const imageStyle = stacked
    ? getNativeStackedImageStyle(size)
    : magazine
    ? { width: '50%' as const, height: 140 as number }
    : getNativeSideImageSize(size);

  const imageNode = block.imageUri ? (
    <Image
      source={{ uri: block.imageUri }}
      style={[stacked || magazine ? styles.stackedPreviewImage : styles.sidePreviewImage, imageStyle]}
      resizeMode="cover"
    />
  ) : (
    <Pressable
      style={[stacked || magazine ? styles.stackedPreviewImage : styles.sidePreviewImage, imageStyle, styles.imagePlaceholder]}
      onPress={onPickImage}
    >
      <Ionicons name="image-outline" size={24} color={colors.textSecondary} />
      <Text style={styles.placeholderText}>Tap to add</Text>
    </Pressable>
  );

  const textNode = (
    <TextInput
      style={[styles.textArea, stacked ? styles.stackedTextArea : { flex: 1, minHeight: 100 }]}
      multiline
      placeholder="Text with the image…"
      value={block.text}
      onChangeText={onChangeText}
      textAlignVertical="top"
    />
  );

  const isRightLayout = layout === 'right' || layout === 'wrap-right' || layout === 'magazine-right' || layout === 'inset-right';

  return (
    <View style={stacked ? styles.stackedPreview : styles.imageTextPreview}>
      {isRightLayout ? <>{textNode}{imageNode}</> : <>{imageNode}{textNode}</>}
    </View>
  );
}

/* ── LIST EDITOR ─────────────────────────────────────────────────────── */

function ListEditor({
  block,
  onUpdate,
}: {
  block: ContentBlock;
  onUpdate: (patch: Partial<ContentBlock>) => void;
}) {
  const isChecklist  = block.type === 'checklist';
  const isNumbered   = block.type === 'numbered-list';
  const items        = block.items ?? [''];
  const checkedItems = block.checkedItems ?? items.map(() => false);

  const setItem = (i: number, val: string) => {
    const next = [...items];
    next[i] = val;
    onUpdate({ items: next });
  };

  const addItem = (afterIndex: number) => {
    const next = [...items];
    const nextChecked = [...checkedItems];
    next.splice(afterIndex + 1, 0, '');
    nextChecked.splice(afterIndex + 1, 0, false);
    onUpdate({ items: next, checkedItems: nextChecked });
  };

  const removeItem = (i: number) => {
    if (items.length <= 1) {
      onUpdate({ items: [''], checkedItems: [false] });
      return;
    }
    const next        = items.filter((_, idx) => idx !== i);
    const nextChecked = checkedItems.filter((_, idx) => idx !== i);
    onUpdate({ items: next, checkedItems: nextChecked });
  };

  const toggleCheck = (i: number) => {
    const next = [...checkedItems];
    next[i] = !next[i];
    onUpdate({ checkedItems: next });
  };

  return (
    <View style={styles.listEditor}>
      {items.map((item, i) => (
        <View key={i} style={styles.listRow}>
          {/* Bullet / Number / Checkbox */}
          {isChecklist ? (
            <Pressable onPress={() => toggleCheck(i)} style={styles.listCheck} hitSlop={6}>
              <Ionicons
                name={checkedItems[i] ? 'checkbox' : 'square-outline'}
                size={20}
                color={checkedItems[i] ? colors.primary : colors.textTertiary}
              />
            </Pressable>
          ) : isNumbered ? (
            <View style={styles.listNumBadge}>
              <Text style={styles.listNumText}>{i + 1}</Text>
            </View>
          ) : (
            <View style={styles.listBullet} />
          )}

          {/* Text input */}
          <TextInput
            style={[styles.listItemInput, isChecklist && checkedItems[i] && styles.listItemDone]}
            value={item}
            onChangeText={(v) => setItem(i, v)}
            placeholder="List item…"
            returnKeyType="next"
            onSubmitEditing={() => addItem(i)}
            blurOnSubmit={false}
            multiline={false}
          />

          {/* Remove */}
          <Pressable onPress={() => removeItem(i)} hitSlop={6}>
            <Ionicons name="close-circle-outline" size={18} color={colors.textTertiary} />
          </Pressable>
        </View>
      ))}

      {/* Add item */}
      <Pressable style={styles.listAddBtn} onPress={() => addItem(items.length - 1)}>
        <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
        <Text style={styles.listAddText}>Add item</Text>
      </Pressable>
    </View>
  );
}

function CitationPreview({ citationId }: { citationId: string }) {
  const [text, setText] = useState('Loading…');
  useEffect(() => {
    getCitations().then((list) => {
      const c = list.find((x) => x.id === citationId);
      setText(c ? formatCitation(c) : 'Citation not found');
    });
  }, [citationId]);
  return <Text style={styles.citationPreviewText}>{text}</Text>;
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },

  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(27,77,62,0.07)',
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(27,77,62,0.12)',
    gap: spacing.sm,
  },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  statDivider: { width: 1, height: 14, backgroundColor: 'rgba(27,77,62,0.2)' },

  block: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(27,77,62,0.1)',
    padding: spacing.sm + 2,
    gap: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  blockToolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  blockTypeWrap: {
    backgroundColor: 'rgba(27,77,62,0.08)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 6,
  },
  blockType: { fontSize: 10, fontWeight: '700', color: colors.primary, letterSpacing: 0.8 },
  toolbarActions: { flexDirection: 'row', gap: spacing.sm + 2 },

  textArea: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.sm + 2,
    fontSize: 15,
    color: colors.text,
    backgroundColor: 'rgba(255,255,255,0.95)',
    lineHeight: 22,
  },
  quoteInput: { borderLeftWidth: 3, borderLeftColor: colors.accent, fontStyle: 'italic', backgroundColor: '#FEFAF4' },
  footnoteInput: { fontSize: 13, backgroundColor: '#FAFAFA' },

  calloutEditor: { gap: spacing.sm },
  calloutTypeRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  calloutChip: {
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 1,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  calloutChipText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  calloutChipTextActive: { color: '#fff' },

  dividerPreview: { alignItems: 'center', paddingVertical: spacing.sm },
  dividerLine: { width: '100%', height: 2, backgroundColor: colors.accent, borderRadius: 1, marginBottom: 4 },
  dividerLabel: { fontSize: 11, color: colors.textSecondary, fontStyle: 'italic' },

  headingEditor: { gap: spacing.sm },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  levelChip: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.8)',
    minWidth: 36,
    alignItems: 'center',
  },
  levelChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  levelChipText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  levelChipTextActive: { color: '#fff' },
  headingHint: { fontSize: 11, color: colors.textSecondary, fontStyle: 'italic', flex: 1 },
  headingInput: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 10,
    padding: spacing.sm + 2, fontWeight: '700', color: colors.text,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },

  mediaCard: {  /* imageToolsCard */
    backgroundColor: 'rgba(27,77,62,0.04)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(27,77,62,0.12)',
    padding: spacing.sm,
    gap: spacing.sm,
  },
  mediaCardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  mediaCardTitle: { fontSize: 13, fontWeight: '700', color: colors.primary, flex: 1 },

  layoutPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(27,77,62,0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(27,77,62,0.2)',
  },
  layoutPickerBtnText: { fontSize: 11, color: colors.primary, fontWeight: '600' },
  layoutDescHint: { fontSize: 11, color: colors.textSecondary, fontStyle: 'italic' },

  controlLabel: { fontSize: 12, fontWeight: '700', color: colors.text, marginBottom: -spacing.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    paddingHorizontal: spacing.sm + 2, paddingVertical: spacing.xs,
    borderRadius: 20, borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  chipTextActive: { color: '#fff' },

  previewImage: { borderRadius: 8, backgroundColor: '#EEE', alignSelf: 'center' },
  imagePlaceholder: {
    height: 130, borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed',
    borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  placeholderText: { color: colors.textSecondary, fontSize: 13 },
  captionInput: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 8,
    padding: spacing.sm, fontSize: 13, color: colors.text,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },

  imageTextPreview: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  stackedPreview: { gap: spacing.sm },
  sidePreviewImage: {
    borderRadius: 8, backgroundColor: '#EEE', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  stackedPreviewImage: {
    borderRadius: 8, backgroundColor: '#EEE', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border, alignSelf: 'center',
  },
  stackedTextArea: { minHeight: 90, width: '100%' },

  collageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  collageCellWrap: { position: 'relative' },
  collageCell: { width: 86, height: 86, borderRadius: 8 },
  collageRemove: { position: 'absolute', top: -6, right: -6 },
  collageAdd: {
    width: 86, height: 86, borderRadius: 8, borderWidth: 2, borderColor: colors.primary,
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  collageAddText: { fontSize: 11, color: colors.primary, fontWeight: '600' },

  /* List editor */
  listEditor: { gap: 4 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  listBullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginHorizontal: 5, flexShrink: 0 },
  listCheck: { flexShrink: 0 },
  listNumBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  listNumText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  listItemInput: { flex: 1, fontSize: 14, color: colors.text, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: colors.border },
  listItemDone: { textDecorationLine: 'line-through', color: colors.textTertiary },
  listAddBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 8, paddingLeft: 2 },
  listAddText: { fontSize: 13, color: colors.primary, fontWeight: '600' },

  /* Code block */
  codeCard: { gap: spacing.sm },
  codeInput: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: colors.text,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm + 2,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  codeLangInput: {
    fontSize: 12,
    color: colors.textSecondary,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    fontFamily: 'monospace',
  },

  tableEditor: { gap: spacing.sm },
  tableRow: { flexDirection: 'row' },
  tableCell: {
    width: 112, borderWidth: 1, borderColor: colors.border,
    padding: spacing.sm, fontSize: 13, color: colors.text, minHeight: 38,
  },
  tableHeaderCell: { backgroundColor: 'rgba(27,77,62,0.08)', fontWeight: '700' },
  tableActions: { flexDirection: 'row', gap: spacing.sm },

  citationBlock: { gap: spacing.sm },
  noCitation: { color: colors.textSecondary, fontStyle: 'italic', fontSize: 13 },
  citationPreviewText: { fontSize: 13, color: colors.text, fontStyle: 'italic', lineHeight: 19 },

  addSection: { gap: spacing.xs, marginTop: spacing.xs },
  addLabel: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, paddingHorizontal: 2 },
  addBar: { flexGrow: 0 },
  addBarContent: { gap: spacing.xs, paddingBottom: spacing.xs },
  addChip: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: 20, borderWidth: 1.5, borderColor: 'rgba(27,77,62,0.2)',
    backgroundColor: 'rgba(255,255,255,0.85)',
    marginRight: spacing.xs,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  addChipText: { fontSize: 13, color: colors.primary, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: spacing.lg, paddingTop: spacing.md,
    maxHeight: '76%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.md },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  citationList: { marginBottom: spacing.md },
  citationItem: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  citationAuthor: { fontSize: 14, fontWeight: '700', color: colors.text },
  citationItemTitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2, lineHeight: 18 },

  layoutList: { marginBottom: spacing.md },
  layoutItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border, borderRadius: 8,
  },
  layoutItemActive: { backgroundColor: 'rgba(27,77,62,0.07)' },
  layoutItemLeft: { flex: 1, gap: 2 },
  layoutItemName: { fontSize: 14, fontWeight: '600', color: colors.text },
  layoutItemNameActive: { color: colors.primary },
  layoutItemDesc: { fontSize: 12, color: colors.textSecondary },
});
