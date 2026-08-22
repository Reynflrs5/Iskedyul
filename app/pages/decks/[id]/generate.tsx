/**
 * Generate Cards with AI Screen
 * - User pastes notes or a topic
 * - Sent to Gemini API
 * - Returns JSON of flashcards
 * - Saves directly to the deck
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, Pressable, StyleSheet, TextInput, ScrollView,
  ActivityIndicator, Alert, StatusBar, KeyboardAvoidingView, Platform, Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../../../../utils/supabase';
import { colors, radius, spacing, type, shadows } from '../../../styles/welcome.styles';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

export default function AIGenerateScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const [input, setInput] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deckColor, setDeckColor] = useState(colors.marigold);

  useEffect(() => {
    async function fetchDeck() {
      const { data } = await supabase.from('decks').select('color').eq('id', id).single();
      if (data) {
        const c = data.color === 'sage' ? colors.sage
          : data.color === 'periwinkle' ? colors.periwinkle
            : data.color === 'purple' ? '#A855F7'
              : data.color === 'red' ? colors.error
                : data.color === 'blue' ? '#3B82F6'
                  : colors.marigold;
        setDeckColor(c);
      }
    }
    fetchDeck();
  }, [id]);

  const checkLimit = async (): Promise<boolean> => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const usage = await AsyncStorage.getItem(`gen_usage_${today}`);
      const count = usage ? parseInt(usage, 10) : 0;
      if (count >= 1) {
        Alert.alert('Daily Limit Reached', 'You can only use the AI Generator 1 time a day to prevent spam. Please try again tomorrow!');
        return false;
      }
      return true;
    } catch (e) {
      return true; // fail safe
    }
  };

  const incrementLimit = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const usage = await AsyncStorage.getItem(`gen_usage_${today}`);
      const count = usage ? parseInt(usage, 10) : 0;
      await AsyncStorage.setItem(`gen_usage_${today}`, (count + 1).toString());
    } catch (e) {
      console.log('Error saving limit', e);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not open image picker');
    }
  };

  const handleGenerate = async () => {
    if (!input.trim() && !imageUri) {
      Alert.alert('Empty Input', 'Please paste some notes, enter a topic, or upload an image.');
      return;
    }

    const canProceed = await checkLimit();
    if (!canProceed) return;

    setLoading(true);

    try {
      if (!GEMINI_API_KEY) {
        throw new Error('Gemini API key is missing.');
      }


      const parts: any[] = [
        {
          text: `You are a flashcard generator. Extract key facts from the following text or image and turn them into flashcards. 
If the text is just a short topic (e.g., "Mitochondria" or "World War 2"), generate 5-10 useful flashcards about that topic.
Return ONLY a valid JSON array of objects with "term" and "definition" properties.
Example: [{"term": "Photosynthesis", "definition": "Process by which plants use sunlight to synthesize foods"}]
Do not include \`\`\`json or any markdown. Return only the array.

Text/Topic:
${input || 'See attached image.'}
`
        }
      ];

      if (imageUri) {
        const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: 'base64' });
        parts.push({
          inlineData: {
            data: base64,
            mimeType: "image/jpeg"
          }
        });
      }

      const response = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=' + GEMINI_API_KEY,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: parts
              }
            ]
          }),
        }
      );

      const json = await response.json();
      if (!response.ok || json.error) throw new Error(json?.error?.message || 'API Error');

      const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!rawText) throw new Error('No text returned from Gemini API.');

      const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      let parsed: any[];

      try {
        parsed = JSON.parse(cleaned);
      } catch (e) {
        throw new Error('AI returned invalid data format. Please try again.');
      }

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('No flashcards could be generated from that text.');
      }

      // Save to Supabase
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('cards').insert(
        parsed.map((c: any) => ({
          deck_id: id,
          term: c.term || 'Unknown Term',
          definition: c.definition || '',
          user_id: user?.id,
        }))
      );

      if (error) throw new Error(error.message);

      await incrementLimit();

      Alert.alert('Success', `Generated and added ${parsed.length} cards!`);
      router.back();

    } catch (e: any) {
      Alert.alert('Error Generating Cards', e.message);
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
          <Text style={styles.headerTitle}>AI Auto-Generate</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.infoBox}>
            <Ionicons name="sparkles" size={24} color={deckColor} />
            <Text style={styles.infoText}>
              Paste your class notes, an article, or just type a broad topic (like "Cell Biology"), and our AI will automatically create flashcards for you!
            </Text>
          </View>

          <Text style={styles.label}>NOTES OR TOPIC</Text>
          <View style={[styles.inputWrap, { borderColor: deckColor }]}>
            <TextInput
              style={styles.input}
              placeholder="Paste notes or type a topic here..."
              placeholderTextColor={colors.inkFaint}
              value={input}
              onChangeText={setInput}
              multiline
              textAlignVertical="top"
            />
          </View>

          <View style={styles.imageSection}>
            <Text style={styles.label}>OR UPLOAD AN IMAGE</Text>
            {imageUri ? (
              <View style={styles.imagePreviewWrap}>
                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                <Pressable
                  style={styles.removeImageBtn}
                  onPress={() => setImageUri(null)}
                >
                  <Ionicons name="close" size={20} color="#fff" />
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={[styles.uploadBtn, { borderColor: deckColor }]}
                onPress={pickImage}
              >
                <Ionicons name="image-outline" size={24} color={deckColor} />
                <Text style={[styles.uploadBtnText, { color: deckColor }]}>Upload Notes / Textbook Image</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <Pressable
            style={[styles.generateBtn, { backgroundColor: deckColor }, loading && { opacity: 0.7 }]}
            onPress={handleGenerate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="sparkles" size={18} color="#fff" />
                <Text style={styles.generateText}>Generate Cards</Text>
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
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  infoBox: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.paperRaised, borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  infoText: { ...type.caption, color: colors.inkSoft, flex: 1, lineHeight: 20 },
  label: { ...type.overline, color: colors.inkSoft, marginBottom: spacing.xs },
  inputWrap: {
    backgroundColor: colors.paperRaised, borderRadius: radius.md,
    borderWidth: 1.5, minHeight: 200,
  },
  input: {
    ...type.body, fontSize: 16, color: colors.ink,
    padding: spacing.md, flex: 1,
  },
  footer: {
    paddingHorizontal: spacing.lg, paddingTop: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  generateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: radius.md, height: 52, ...shadows.soft,
  },
  generateText: { ...type.label, color: '#fff', fontSize: 15 },
  imageSection: {
    marginTop: spacing.xl,
  },
  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderWidth: 1.5, borderStyle: 'dashed', borderRadius: radius.md,
    paddingVertical: spacing.lg, backgroundColor: colors.paperRaised,
  },
  uploadBtnText: { ...type.label, fontSize: 14 },
  imagePreviewWrap: {
    position: 'relative',
    height: 200,
    width: '100%',
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
