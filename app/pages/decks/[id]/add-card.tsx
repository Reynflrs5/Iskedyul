/**
 * Add Card Screen — add a term + definition to a deck.
 */
import React, { useState } from 'react';
import {
  View, Text, Pressable, StyleSheet,
  TextInput, KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../../utils/supabase';
import { colors, radius, spacing, type, shadows } from '../../../styles/welcome.styles';

export default function AddCardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const [term, setTerm] = useState('');
  const [definition, setDefinition] = useState('');
  const [loading, setLoading] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  const handleSave = async (andClose = false) => {
    if (!term.trim() || !definition.trim()) {
      Alert.alert('Missing Fields', 'Please fill in both the term and definition.');
      return;
    }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('cards').insert({
      deck_id: id,
      term: term.trim(),
      definition: definition.trim(),
      user_id: user?.id,
    });
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setSavedCount((n) => n + 1);
      setTerm('');
      setDefinition('');
      if (andClose) router.back();
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={24} color={colors.ink} />
          </Pressable>
          <Text style={styles.headerTitle}>Add Card</Text>
          {savedCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{savedCount} saved</Text>
            </View>
          )}
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Term */}
          <Text style={styles.label}>TERM</Text>
          <TextInput
            style={styles.termInput}
            placeholder="e.g. Mitochondria"
            placeholderTextColor={colors.inkFaint}
            value={term}
            onChangeText={setTerm}
            autoFocus
            returnKeyType="next"
            multiline={false}
          />

          {/* Definition */}
          <Text style={[styles.label, { marginTop: spacing.lg }]}>DEFINITION</Text>
          <TextInput
            style={styles.defInput}
            placeholder="e.g. The powerhouse of the cell"
            placeholderTextColor={colors.inkFaint}
            value={definition}
            onChangeText={setDefinition}
            multiline
            textAlignVertical="top"
          />
        </ScrollView>

        {/* Footer actions */}
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <Pressable
            style={[styles.addMoreBtn, loading && { opacity: 0.6 }]}
            onPress={() => handleSave(false)}
            disabled={loading}
          >
            <Ionicons name="add-circle-outline" size={18} color={colors.ink} />
            <Text style={styles.addMoreText}>Save & Add Another</Text>
          </Pressable>
          <Pressable
            style={[styles.doneBtn, loading && { opacity: 0.6 }]}
            onPress={() => handleSave(true)}
            disabled={loading}
          >
            <Text style={styles.doneBtnText}>{loading ? 'Saving...' : 'Save & Done'}</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitle: { ...type.h2, color: colors.ink, flex: 1 },
  badge: {
    backgroundColor: colors.sageSoft, borderRadius: radius.pill,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  badgeText: { ...type.caption, color: colors.sage, fontWeight: '700' },

  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  label: { ...type.overline, color: colors.inkSoft, marginBottom: spacing.xs },
  termInput: {
    ...type.h2, fontSize: 20, color: colors.ink,
    borderBottomWidth: 2, borderBottomColor: colors.border,
    paddingVertical: spacing.sm, paddingHorizontal: 0,
  },
  defInput: {
    ...type.body, fontSize: 16, color: colors.ink,
    backgroundColor: colors.paperRaised, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.border,
    padding: spacing.md, minHeight: 120,
  },

  footer: {
    flexDirection: 'row', gap: spacing.sm,
    paddingHorizontal: spacing.lg, paddingTop: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  addMoreBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderRadius: radius.md, paddingVertical: 13,
    borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.paperRaised,
  },
  addMoreText: { ...type.label, color: colors.ink, fontSize: 14 },
  doneBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    borderRadius: radius.md, paddingVertical: 13,
    backgroundColor: colors.ink, ...shadows.soft,
  },
  doneBtnText: { ...type.label, color: colors.paper, fontSize: 14 },
});
