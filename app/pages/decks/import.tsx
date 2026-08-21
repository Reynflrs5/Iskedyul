/**
 * Import Deck Screen
 * - Paste JSON from Export feature to create a new deck
 */
import React, { useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, TextInput,
  ActivityIndicator, Alert, StatusBar, KeyboardAvoidingView, Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../../../utils/supabase';
import { colors, radius, spacing, type, shadows } from '../../styles/welcome.styles';

export default function ImportDeckScreen() {
  const insets = useSafeAreaInsets();
  const [jsonText, setJsonText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    if (!jsonText.trim()) {
      Alert.alert('Empty Input', 'Please paste the deck JSON data first.');
      return;
    }

    setLoading(true);

    try {
      const parsed = JSON.parse(jsonText);
      
      if (!parsed.title || !Array.isArray(parsed.cards)) {
        throw new Error('Invalid deck data. Ensure it came from the Export feature.');
      }

      const { data: { user } } = await supabase.auth.getUser();

      // Create Deck
      const { data: deckData, error: deckError } = await supabase.from('decks').insert({
        title: parsed.title,
        color: 'marigold',
        total: parsed.cards.length,
        reviewed: 0,
        user_id: user?.id,
      }).select().single();

      if (deckError || !deckData) throw new Error(deckError?.message || 'Failed to create deck.');

      // Add Cards
      const cardsToInsert = parsed.cards.map((c: any) => ({
        deck_id: deckData.id,
        term: c.term || 'Unknown Term',
        definition: c.definition || '',
        user_id: user?.id,
      }));

      if (cardsToInsert.length > 0) {
        const { error: cardError } = await supabase.from('cards').insert(cardsToInsert);
        if (cardError) throw new Error(cardError.message);
      }

      Alert.alert('Success', `Imported deck "${parsed.title}" with ${parsed.cards.length} cards!`);
      router.back();

    } catch (e: any) {
      Alert.alert('Import Error', e.message || 'Invalid JSON format.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.ink} />
          </Pressable>
          <Text style={styles.headerTitle}>Import Deck</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.content}>
          <Text style={styles.label}>DECK JSON DATA</Text>
          <View style={[styles.inputWrap]}>
            <TextInput
              style={styles.input}
              placeholder='Paste exported JSON here...'
              placeholderTextColor={colors.inkFaint}
              value={jsonText}
              onChangeText={setJsonText}
              multiline
              textAlignVertical="top"
              autoFocus
            />
          </View>
        </View>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <Pressable
            style={[styles.importBtn, loading && { opacity: 0.7 }]}
            onPress={handleImport}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="download-outline" size={18} color="#fff" />
                <Text style={styles.importText}>Import Deck</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: radius.pill,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.paperRaised, borderWidth: 1, borderColor: colors.border,
  },
  headerTitle: { ...type.h2, color: colors.ink },
  content: { padding: spacing.lg, flex: 1 },
  label: { ...type.overline, color: colors.inkSoft, marginBottom: spacing.xs },
  inputWrap: {
    backgroundColor: colors.paperRaised, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.border, flex: 1, marginBottom: spacing.lg,
  },
  input: {
    ...type.body, fontSize: 14, color: colors.ink,
    padding: spacing.md, flex: 1, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  footer: {
    paddingHorizontal: spacing.lg, paddingTop: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  importBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.periwinkle, borderRadius: radius.md, height: 52, ...shadows.soft,
  },
  importText: { ...type.label, color: '#fff', fontSize: 15 },
});
