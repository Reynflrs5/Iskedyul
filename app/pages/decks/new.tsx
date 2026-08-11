import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SheetField from '../../../components/SheetField';
import { colors, radius, spacing, type, shadows } from '../../styles/welcome.styles';
import { supabase } from '../../../utils/supabase';

const COLORS = [
  { key: 'marigold', color: colors.marigold, bg: colors.marigoldSoft },
  { key: 'periwinkle', color: colors.periwinkle, bg: colors.periwinkleSoft },
  { key: 'sage', color: colors.sage, bg: colors.sageSoft },
  { key: 'purple', color: '#A855F7', bg: '#F3E8FF' },
  { key: 'red', color: '#EF4444', bg: '#FEE2E2' },
  { key: 'blue', color: '#3B82F6', bg: '#DBEAFE' },
];

export default function NewDeckScreen() {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [selectedColor, setSelectedColor] = useState('marigold');
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Field', 'Please enter a deck name.');
      return;
    }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('decks').insert({
      title: title.trim(),
      color: selectedColor,
      total: 0,
      reviewed: 0,
      user_id: user?.id,
    });
    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      router.back();
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>New Deck</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <SheetField
          label="DECK NAME"
          placeholder="e.g. World History Chapter 6"
          value={title}
          onChangeText={setTitle}
          autoFocus
        />

        <Text style={styles.sectionLabel}>COLOR TAG</Text>
        <View style={styles.colorRow}>
          {COLORS.map((c) => (
            <Pressable
              key={c.key}
              style={[
                styles.colorDot,
                { backgroundColor: c.color },
                selectedColor === c.key && styles.colorDotSelected,
              ]}
              onPress={() => setSelectedColor(c.key)}
            />
          ))}
        </View>

        <View style={[styles.preview, { backgroundColor: COLORS.find(c => c.key === selectedColor)?.bg }]}>
          <View style={[styles.previewIcon, { backgroundColor: COLORS.find(c => c.key === selectedColor)?.color }]} />
          <Text style={[styles.previewTitle, { color: COLORS.find(c => c.key === selectedColor)?.color }]}>
            {title || 'Deck name preview'}
          </Text>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <Pressable
          style={[styles.submitBtn, loading && { opacity: 0.7 }, { backgroundColor: COLORS.find(c => c.key === selectedColor)?.color }]}
          onPress={handleAdd}
          disabled={loading}
        >
          <Text style={styles.submitText}>{loading ? 'Creating...' : 'Create Deck'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  headerTitle: { ...type.h2, color: colors.ink },
  content: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  
  sectionLabel: { ...type.caption, color: colors.inkSoft, fontWeight: '600', marginBottom: spacing.sm },
  colorRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorDotSelected: { borderWidth: 3, borderColor: colors.ink, transform: [{ scale: 1.15 }] },
  preview: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, marginBottom: spacing.lg },
  previewIcon: { width: 32, height: 32, borderRadius: radius.sm, opacity: 0.7 },
  previewTitle: { ...type.label, fontSize: 15, flex: 1 },
  submitBtn: { borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', ...shadows.soft },
  submitText: { ...type.label, color: colors.paper, fontSize: 15 },
});
