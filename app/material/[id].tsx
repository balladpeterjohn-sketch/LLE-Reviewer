import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform,
  Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { ContentEditor } from '../../src/components/ContentEditor';
import { findTopic } from '../../src/data/tosSubjects';
import { deleteMaterial, duplicateMaterial, getMaterial, saveMaterial } from '../../src/services/storage';
import { Button, Input } from '../../src/components/ui';
import { useTheme } from '../../src/contexts/ThemeContext';
import { radius, spacing, typography } from '../../src/theme';
import { ContentBlock, ReadingMaterial } from '../../src/types';

export default function EditMaterialScreen() {
  const { id }  = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();
  const { colors } = useTheme();
  const [material, setMaterial] = useState<ReadingMaterial | null>(null);
  const [title, setTitle]       = useState('');
  const [blocks, setBlocks]     = useState<ContentBlock[]>([]);
  const [saving, setSaving]     = useState(false);
  const [duping, setDuping]     = useState(false);

  const load = useCallback(() => {
    if (id) getMaterial(id).then((m) => { if (m) { setMaterial(m); setTitle(m.title); setBlocks(m.blocks); } });
  }, [id]);
  useFocusEffect(load);

  const topicInfo = material ? findTopic(material.subjectId, material.topicId) : undefined;
  const collectCitationIds = (list: ContentBlock[]) => Array.from(new Set(list.flatMap((b) => b.citationId ? [b.citationId] : [])));

  const handleSave = async () => {
    if (!material || !title.trim()) { Alert.alert('Title required', 'Please enter a title.'); return; }
    setSaving(true);
    try { await saveMaterial({ ...material, title: title.trim(), blocks, citationIds: collectCitationIds(blocks) }); Alert.alert('Saved', 'Material saved.'); }
    finally { setSaving(false); }
  };

  const handleDuplicate = async () => {
    if (!material) return;
    setDuping(true);
    try {
      const copy = await duplicateMaterial(material.id);
      if (copy) Alert.alert('Duplicated', `"${copy.title}" created.`, [
        { text: 'Edit copy', onPress: () => router.replace(`/material/${copy.id}`) },
        { text: 'Stay', style: 'cancel' },
      ]);
    } finally { setDuping(false); }
  };

  const handleDelete = () => {
    if (!material) return;
    Alert.alert('Delete', `Remove "${material.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteMaterial(material.id); router.back(); } },
    ]);
  };

  if (!material) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <Text style={{ color: colors.textSecondary }}>Loading…</Text>
    </View>
  );

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content:   { padding: spacing.md, gap: spacing.md, paddingBottom: 120 },

    breadcrumb: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primaryMuted, padding: spacing.sm, borderRadius: radius.md },
    breadText:  { ...typography.caption, color: colors.primary, flex: 1 },

    label:   { ...typography.micro, color: colors.textTertiary, textTransform: 'uppercase', marginBottom: spacing.xs },
    hint:    { ...typography.caption, color: colors.textTertiary, lineHeight: 18 },

    actions:  { gap: spacing.sm },
    row:      { flexDirection: 'row', gap: spacing.sm },
  });

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={s.container} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {topicInfo && (
          <View style={s.breadcrumb}>
            <Ionicons name="bookmark-outline" size={13} color={colors.primary} />
            <Text style={s.breadText} numberOfLines={1}>
              {topicInfo.subject.title} › {topicInfo.topic.code} {topicInfo.topic.title}
            </Text>
          </View>
        )}

        <Text style={s.label}>Title</Text>
        <Input
          value={title}
          onChangeText={setTitle}
          placeholder="Material title"
          style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }}
        />

        <Text style={s.label}>Content</Text>
        <Text style={s.hint}>
          Formatting: **bold** · *italic* · __underline__ · ==highlight== · ~~strikethrough~~
        </Text>
        <ContentEditor blocks={blocks} onChange={setBlocks} />

        <View style={s.actions}>
          <View style={s.row}>
            <Button title="Preview"                      icon="eye-outline"    variant="outline" onPress={() => router.push(`/material/${material.id}/preview`)} style={{ flex: 1 }} />
            <Button title={duping ? 'Copying…' : 'Copy'} icon="copy-outline"  variant="ghost"   onPress={handleDuplicate} disabled={duping} style={{ flex: 1 }} />
          </View>
          <Button title={saving ? 'Saving…' : 'Save Material'} icon="checkmark-circle-outline" onPress={handleSave} disabled={saving} />
          <Button title="Delete Material" icon="trash-outline" variant="danger" onPress={handleDelete} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
