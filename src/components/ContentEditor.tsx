import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
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
import { Citation, ContentBlock } from '../types';
import { formatCitation } from '../utils/citation';
import { Button } from './ui';

interface ContentEditorProps {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
}

export function ContentEditor({ blocks, onChange }: ContentEditorProps) {
  const [citationPickerVisible, setCitationPickerVisible] = useState(false);
  const [citationTargetIndex, setCitationTargetIndex] = useState<number | null>(null);
  const [citations, setCitations] = useState<Citation[]>([]);

  const updateBlock = (index: number, patch: Partial<ContentBlock>) => {
    const next = blocks.map((b, i) => (i === index ? { ...b, ...patch } : b));
    onChange(next);
  };

  const addBlock = (type: ContentBlock['type']) => {
    const block: ContentBlock = { id: generateId(), type };
    if (type === 'paragraph' || type === 'quote') block.text = '';
    if (type === 'heading') {
      block.text = '';
      block.level = 2;
    }
    if (type === 'table') {
      block.rows = [
        [{ value: 'Column 1' }, { value: 'Column 2' }],
        [{ value: '' }, { value: '' }],
      ];
    }
    onChange([...blocks, block]);
  };

  const removeBlock = (index: number) => {
    onChange(blocks.filter((_, i) => i !== index));
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const pickImage = async (index: number) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const uri = asset.base64
        ? `data:image/jpeg;base64,${asset.base64}`
        : asset.uri;
      updateBlock(index, { imageUri: uri });
    }
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
    if (citationTargetIndex !== null) {
      updateBlock(citationTargetIndex, { citationId });
    }
    setCitationPickerVisible(false);
    setCitationTargetIndex(null);
  };

  const updateTableCell = (
    blockIndex: number,
    rowIndex: number,
    colIndex: number,
    value: string
  ) => {
    const block = blocks[blockIndex];
    if (!block.rows) return;
    const rows = block.rows.map((row, ri) =>
      row.map((cell, ci) =>
        ri === rowIndex && ci === colIndex ? { value } : cell
      )
    );
    updateBlock(blockIndex, { rows });
  };

  const addTableRow = (blockIndex: number) => {
    const block = blocks[blockIndex];
    if (!block.rows || block.rows.length === 0) return;
    const cols = block.rows[0].length;
    const newRow = Array.from({ length: cols }, () => ({ value: '' }));
    updateBlock(blockIndex, { rows: [...block.rows, newRow] });
  };

  const addTableColumn = (blockIndex: number) => {
    const block = blocks[blockIndex];
    if (!block.rows) return;
    const rows = block.rows.map((row) => [...row, { value: '' }]);
    updateBlock(blockIndex, { rows });
  };

  return (
    <View style={styles.container}>
      {blocks.map((block, index) => (
        <View key={block.id} style={styles.block}>
          <View style={styles.blockToolbar}>
            <Text style={styles.blockType}>{block.type.toUpperCase()}</Text>
            <View style={styles.toolbarActions}>
              <Pressable onPress={() => moveBlock(index, -1)} disabled={index === 0}>
                <Ionicons
                  name="chevron-up"
                  size={20}
                  color={index === 0 ? colors.border : colors.primary}
                />
              </Pressable>
              <Pressable
                onPress={() => moveBlock(index, 1)}
                disabled={index === blocks.length - 1}
              >
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={index === blocks.length - 1 ? colors.border : colors.primary}
                />
              </Pressable>
              <Pressable onPress={() => removeBlock(index)}>
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </Pressable>
            </View>
          </View>

          {(block.type === 'paragraph' || block.type === 'quote') && (
            <TextInput
              style={[styles.textArea, block.type === 'quote' && styles.quoteInput]}
              multiline
              placeholder={
                block.type === 'quote' ? 'Enter quoted text...' : 'Write your reading material...'
              }
              value={block.text}
              onChangeText={(text) => updateBlock(index, { text })}
              textAlignVertical="top"
            />
          )}

          {block.type === 'heading' && (
            <View>
              <View style={styles.headingLevels}>
                {([1, 2, 3] as const).map((level) => (
                  <Pressable
                    key={level}
                    style={[
                      styles.levelChip,
                      block.level === level && styles.levelChipActive,
                    ]}
                    onPress={() => updateBlock(index, { level })}
                  >
                    <Text
                      style={[
                        styles.levelChipText,
                        block.level === level && styles.levelChipTextActive,
                      ]}
                    >
                      H{level}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <TextInput
                style={styles.headingInput}
                placeholder="Section heading..."
                value={block.text}
                onChangeText={(text) => updateBlock(index, { text })}
              />
            </View>
          )}

          {block.type === 'image' && (
            <View>
              {block.imageUri ? (
                <Image source={{ uri: block.imageUri }} style={styles.image} resizeMode="contain" />
              ) : (
                <Pressable style={styles.imagePlaceholder} onPress={() => pickImage(index)}>
                  <Ionicons name="image-outline" size={32} color={colors.textSecondary} />
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
                <Button title="Change Image" onPress={() => pickImage(index)} variant="outline" />
              )}
            </View>
          )}

          {block.type === 'table' && (
            <View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View>
                  {(block.rows ?? []).map((row, ri) => (
                    <View key={ri} style={styles.tableRow}>
                      {row.map((cell, ci) => (
                        <TextInput
                          key={ci}
                          style={[
                            styles.tableCell,
                            ri === 0 && styles.tableHeaderCell,
                          ]}
                          value={cell.value}
                          onChangeText={(value) => updateTableCell(index, ri, ci, value)}
                        />
                      ))}
                    </View>
                  ))}
                </View>
              </ScrollView>
              <View style={styles.tableActions}>
                <Button title="+ Row" onPress={() => addTableRow(index)} variant="outline" />
                <Button title="+ Column" onPress={() => addTableColumn(index)} variant="outline" />
              </View>
            </View>
          )}

          {block.type === 'citation' && (
            <View>
              {block.citationId ? (
                <CitationPreview citationId={block.citationId} />
              ) : (
                <Text style={styles.noCitation}>No citation selected</Text>
              )}
              <Button
                title={block.citationId ? 'Change Citation' : 'Select Citation'}
                onPress={() => openCitationPicker(index)}
                variant="outline"
              />
            </View>
          )}
        </View>
      ))}

      <Text style={styles.addLabel}>Add content block:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.addBar}>
        <AddChip icon="text" label="Text" onPress={() => addBlock('paragraph')} />
        <AddChip icon="text-outline" label="Heading" onPress={() => addBlock('heading')} />
        <AddChip icon="image" label="Image" onPress={() => addBlock('image')} />
        <AddChip icon="grid" label="Table" onPress={() => addBlock('table')} />
        <AddChip icon="chatbox-ellipses" label="Quote" onPress={() => addBlock('quote')} />
        <AddChip icon="book" label="Citation" onPress={() => addBlock('citation')} />
      </ScrollView>

      <Modal visible={citationPickerVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Citation</Text>
            <ScrollView style={styles.citationList}>
              {citations.map((c) => (
                <Pressable
                  key={c.id}
                  style={styles.citationItem}
                  onPress={() => selectCitation(c.id)}
                >
                  <Text style={styles.citationAuthors}>{c.authors}</Text>
                  <Text style={styles.citationTitle} numberOfLines={2}>
                    {c.title} ({c.year})
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <Button
              title="Cancel"
              onPress={() => setCitationPickerVisible(false)}
              variant="outline"
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function AddChip({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.addChip} onPress={onPress}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={styles.addChipText}>{label}</Text>
    </Pressable>
  );
}

function CitationPreview({ citationId }: { citationId: string }) {
  const [text, setText] = useState('Loading...');

  useEffect(() => {
    getCitations().then((list) => {
      const c = list.find((x) => x.id === citationId);
      setText(c ? formatCitation(c) : 'Citation not found');
    });
  }, [citationId]);

  return <Text style={styles.citationPreview}>{text}</Text>;
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  block: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  blockToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  blockType: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 1,
  },
  toolbarActions: { flexDirection: 'row', gap: spacing.sm },
  textArea: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    fontSize: 15,
    color: colors.text,
    backgroundColor: '#FAFAF8',
  },
  quoteInput: {
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    fontStyle: 'italic',
  },
  headingLevels: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  levelChip: {
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  levelChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  levelChipText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  levelChipTextActive: { color: '#fff' },
  headingInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  image: { width: '100%', height: 200, borderRadius: 8 },
  imagePlaceholder: {
    height: 150,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  placeholderText: { color: colors.textSecondary, fontSize: 14 },
  captionInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    marginTop: spacing.sm,
    fontSize: 13,
    color: colors.text,
  },
  tableRow: { flexDirection: 'row' },
  tableCell: {
    width: 120,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    fontSize: 13,
    color: colors.text,
    minHeight: 40,
  },
  tableHeaderCell: { backgroundColor: '#E8F0EC', fontWeight: '600' },
  tableActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  noCitation: { color: colors.textSecondary, fontStyle: 'italic', marginBottom: spacing.sm },
  citationPreview: { fontSize: 13, color: colors.text, fontStyle: 'italic', marginBottom: spacing.sm },
  addLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginTop: spacing.sm },
  addBar: { flexGrow: 0 },
  addChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    marginRight: spacing.sm,
  },
  addChipText: { fontSize: 13, color: colors.primary, fontWeight: '500' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    maxHeight: '70%',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  citationList: { marginBottom: spacing.md },
  citationItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  citationAuthors: { fontSize: 14, fontWeight: '600', color: colors.text },
  citationTitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
});
