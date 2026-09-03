import React, { useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView,
  ActivityIndicator, Image, Alert, StatusBar, TextInput
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '../../../utils/supabase';
import { colors, radius, spacing, type, shadows } from '../../styles/welcome.styles';
import SheetField from '../../../components/SheetField';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

const COLORS = [
  { key: 'marigold', color: colors.marigold, bg: colors.marigoldSoft },
  { key: 'periwinkle', color: colors.periwinkle, bg: colors.periwinkleSoft },
  { key: 'sage', color: colors.sage, bg: colors.sageSoft },
  { key: 'purple', color: '#A855F7', bg: '#F3E8FF' },
  { key: 'red', color: colors.error, bg: colors.errorSoft },
  { key: 'blue', color: '#3B82F6', bg: '#DBEAFE' },
];

type ExtractedFlashcard = {
  term: string;
  definition: string;
  selected: boolean;
};

export default function ScanNotesScreen() {
  const insets = useSafeAreaInsets();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [flashcards, setFlashcards] = useState<ExtractedFlashcard[]>([]);
  const [deckTitle, setDeckTitle] = useState('');
  const [selectedColor, setSelectedColor] = useState('marigold');
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<'pick' | 'review' | 'done'>('pick');

  const checkLimit = async (): Promise<boolean> => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const usage = await AsyncStorage.getItem(`scan_notes_usage_${today}`);
      const count = usage ? parseInt(usage, 10) : 0;
      if (count >= 5) {
        Alert.alert('Daily Limit Reached', 'You can only use the AI Notes Scanner 5 times a day to prevent spam. Please try again tomorrow!');
        return false;
      }
      return true;
    } catch (e) {
      return true;
    }
  };

  const incrementLimit = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const usage = await AsyncStorage.getItem(`scan_notes_usage_${today}`);
      const count = usage ? parseInt(usage, 10) : 0;
      await AsyncStorage.setItem(`scan_notes_usage_${today}`, (count + 1).toString());
    } catch (e) {
      console.log('Error saving limit', e);
    }
  };

  const pickFromGallery = async () => {
    const canProceed = await checkLimit();
    if (!canProceed) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      base64: true,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      analyzeImage(result.assets[0].uri, result.assets[0].base64 ?? '');
    }
  };

  const takePhoto = async () => {
    const canProceed = await checkLimit();
    if (!canProceed) return;

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.85,
      base64: true,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      analyzeImage(result.assets[0].uri, result.assets[0].base64 ?? '');
    }
  };

  const analyzeImage = async (uri: string, base64: string) => {
    setLoading(true);
    setSummary('');
    setFlashcards([]);
    setDeckTitle('');

    try {
      if (!GEMINI_API_KEY) {
        throw new Error('Gemini API key is missing. Check EXPO_PUBLIC_GEMINI_API_KEY.');
      }

      const mimeType = uri.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

      const response = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/interactions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': GEMINI_API_KEY,
          },
          body: JSON.stringify({
            model: 'gemini-3.6-flash',
            input: [
              {
                type: 'image',
                data: base64,
                mime_type: mimeType,
              },
              {
                type: 'text',
                text: `
You are an AI study assistant. Look at the provided notes image (handwritten or typed).
1. Provide a short, structured summary of the notes.
2. Generate flashcards from the key concepts.
3. Suggest a short title for these notes.

Return ONLY a valid JSON object matching exactly this format:
{
  "title": "Suggested Short Title",
  "summary": "Your structured summary here...",
  "flashcards": [
    { "term": "Concept 1", "definition": "Definition 1" },
    { "term": "Concept 2", "definition": "Definition 2" }
  ]
}

Rules:
- Return ONLY the JSON object.
- Do not use markdown fences (like \`\`\`json).
- Do not include explanations.
- Ensure valid JSON format.
                `,
              },
            ],
          }),
        }
      );

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.error?.message || 'Gemini API request failed');
      }
      if (json?.error) {
        throw new Error(json.error.message);
      }

      const modelOutputStep = json?.steps?.find((step: any) => step.type === 'model_output');
      const rawText = modelOutputStep?.content?.[0]?.text || json?.output_text || json?.output?.[0]?.content?.[0]?.text || '';

      if (!rawText) {
        throw new Error('No text returned from Gemini API.');
      }

      const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      let parsed: any;
      try {
        parsed = JSON.parse(cleaned);
      } catch (e) {
        throw new Error('AI returned invalid data format.');
      }

      if (!parsed.flashcards || !Array.isArray(parsed.flashcards)) {
        throw new Error('Could not generate flashcards from notes.');
      }

      await incrementLimit();

      setDeckTitle(parsed.title || 'Study Notes');
      setSummary(parsed.summary || 'No summary provided.');
      setFlashcards(
        parsed.flashcards.map((f: any) => ({
          term: f.term || '',
          definition: f.definition || '',
          selected: true,
        }))
      );
      setStep('review');
    } catch (e: any) {
      Alert.alert('Could not process notes', e?.message ?? 'Please try a clearer image.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (i: number) => {
    setFlashcards((prev) =>
      prev.map((f, idx) => idx === i ? { ...f, selected: !f.selected } : f)
    );
  };

  const handleSave = async () => {
    const toSave = flashcards.filter((f) => f.selected && f.term && f.definition);
    if (!deckTitle.trim()) {
      Alert.alert('Missing Title', 'Please provide a title for your deck.');
      return;
    }
    if (toSave.length === 0) {
      Alert.alert('Nothing selected', 'Select at least one flashcard to save.');
      return;
    }

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Create Deck
    const { data: deckData, error: deckError } = await supabase
      .from('decks')
      .insert({
        title: deckTitle.trim(),
        color: selectedColor,
        total: toSave.length,
        reviewed: 0,
        user_id: user?.id,
      })
      .select()
      .single();

    if (deckError || !deckData) {
      setSaving(false);
      Alert.alert('Error creating deck', deckError?.message);
      return;
    }

    // 2. Add Cards
    const { error: cardsError } = await supabase.from('cards').insert(
      toSave.map((f) => ({
        deck_id: deckData.id,
        term: f.term,
        definition: f.definition,
      }))
    );

    setSaving(false);
    if (cardsError) {
      Alert.alert('Error saving cards', cardsError.message);
    } else {
      setStep('done');
    }
  };

  // ── DONE ────────────────────────────────────────
  if (step === 'done') {
    const count = flashcards.filter((f) => f.selected).length;
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.doneScreen}>
          <View style={[styles.doneIconWrap, { backgroundColor: COLORS.find(c => c.key === selectedColor)?.bg }]}>
            <Ionicons name="layers" size={48} color={COLORS.find(c => c.key === selectedColor)?.color} />
          </View>
          <Text style={styles.doneTitle}>Deck Created! 🎉</Text>
          <Text style={styles.doneSub}>"{deckTitle}" with {count} card{count !== 1 ? 's' : ''}.</Text>
          <Pressable
            style={[styles.donePrimaryBtn, { backgroundColor: COLORS.find(c => c.key === selectedColor)?.color }]}
            onPress={() => router.replace('/pages/decks' as any)}
          >
            <Ionicons name="play" size={18} color="#fff" />
            <Text style={styles.donePrimaryText}>Go to Decks</Text>
          </Pressable>
          <Pressable style={styles.doneSecondaryBtn} onPress={() => { setStep('pick'); setImageUri(null); setFlashcards([]); }}>
            <Text style={styles.doneSecondaryText}>Scan More Notes</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── REVIEW ──────────────────────────────────────
  if (step === 'review') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.header}>
          <Pressable onPress={() => { setStep('pick'); setImageUri(null); setFlashcards([]); }} hitSlop={10}>
            <Ionicons name="arrow-back" size={24} color={colors.ink} />
          </Pressable>
          <Text style={styles.headerTitle}>Review Notes</Text>
          <Text style={styles.headerSub}>{flashcards.filter((f) => f.selected).length} cards</Text>
        </View>

        <ScrollView contentContainerStyle={styles.reviewList} showsVerticalScrollIndicator={false}>
          {imageUri && (
            <Image source={{ uri: imageUri }} style={styles.previewThumb} resizeMode="cover" />
          )}

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>AI SUMMARY</Text>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryText}>{summary}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <SheetField
              label="DECK TITLE"
              placeholder="e.g. Science Chapter 1 Notes"
              value={deckTitle}
              onChangeText={setDeckTitle}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>DECK COLOR</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
              {COLORS.map((c) => (
                <Pressable
                  key={c.key}
                  style={[styles.colorDot, { backgroundColor: c.color }, selectedColor === c.key && styles.colorDotSelected]}
                  onPress={() => setSelectedColor(c.key)}
                >
                  {selectedColor === c.key && <Ionicons name="checkmark" size={16} color="#fff" />}
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>FLASHCARDS TO GENERATE</Text>
            <Text style={styles.reviewHint}>Tap to deselect cards you don't want to include.</Text>
            {flashcards.map((f, i) => (
              <Pressable
                key={i}
                style={[styles.reviewCard, !f.selected && styles.reviewCardDeselected]}
                onPress={() => toggleSelect(i)}
              >
                <View style={styles.reviewCheckbox}>
                  {f.selected
                    ? <Ionicons name="checkmark-circle" size={22} color={COLORS.find(c => c.key === selectedColor)?.color || colors.periwinkle} />
                    : <Ionicons name="ellipse-outline" size={22} color={colors.inkFaint} />
                  }
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.reviewTerm, !f.selected && { opacity: 0.4 }]}>{f.term}</Text>
                  <Text style={[styles.reviewDef, !f.selected && { opacity: 0.4 }]}>{f.definition}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <Pressable
            style={[styles.saveBtn, { backgroundColor: COLORS.find(c => c.key === selectedColor)?.color }, saving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator size="small" color="#fff" />
              : <>
                <Ionicons name="layers-outline" size={18} color="#fff" />
                <Text style={styles.saveBtnText}>Create Deck</Text>
              </>
            }
          </Pressable>
        </View>
      </View>
    );
  }

  // ── PICK ────────────────────────────────────────
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>Scan Notes</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.pickContent}>
        <View style={styles.illustrationBox}>
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={colors.periwinkle} />
              <Text style={styles.loadingText}>AI is reading your notes…</Text>
              <Text style={styles.loadingSubText}>Extracting summary & flashcards</Text>
            </View>
          ) : imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
          ) : (
            <>
              <Ionicons name="document-text-outline" size={64} color={colors.inkFaint} />
              <Text style={styles.illustrationTitle}>Snap a photo of your notes</Text>
              <Text style={styles.illustrationBody}>
                AI will summarize the content and instantly generate a flashcard deck for you to study.
              </Text>
            </>
          )}
        </View>

        {!loading && (
          <View style={styles.pickActions}>
            <Pressable style={styles.cameraBtn} onPress={takePhoto}>
              <Ionicons name="camera" size={22} color="#fff" />
              <Text style={styles.cameraBtnText}>Take Photo</Text>
            </Pressable>
            <Pressable style={styles.galleryBtn} onPress={pickFromGallery}>
              <Ionicons name="image-outline" size={22} color={colors.ink} />
              <Text style={styles.galleryBtnText}>Choose from Gallery</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitle: { ...type.h2, color: colors.ink },
  headerSub: { ...type.caption, color: colors.inkSoft },

  pickContent: { flex: 1, paddingHorizontal: spacing.lg, justifyContent: 'center', gap: spacing.lg },
  illustrationBox: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.paperRaised, borderRadius: radius.xl,
    borderWidth: 1.5, borderColor: colors.border, borderStyle: 'dashed',
    paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg,
    gap: spacing.md, minHeight: 220,
  },
  illustrationTitle: { ...type.h2, color: colors.ink, textAlign: 'center' },
  illustrationBody: { ...type.body, color: colors.inkSoft, textAlign: 'center', lineHeight: 20 },
  loadingBox: { alignItems: 'center', gap: spacing.md },
  loadingText: { ...type.label, color: colors.ink, fontSize: 15 },
  loadingSubText: { ...type.caption, color: colors.inkSoft },
  previewImage: { width: '100%', height: 200, borderRadius: radius.md },

  pickActions: { gap: spacing.sm },
  cameraBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: colors.periwinkle,
    borderRadius: radius.md, paddingVertical: 14, ...shadows.soft,
  },
  cameraBtnText: { ...type.label, color: '#fff', fontSize: 15 },
  galleryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: colors.paperRaised,
    borderRadius: radius.md, paddingVertical: 14,
    borderWidth: 1.5, borderColor: colors.border,
  },
  galleryBtnText: { ...type.label, color: colors.ink, fontSize: 15 },

  previewThumb: {
    height: 120, borderRadius: radius.md, marginBottom: spacing.md,
  },
  reviewList: { padding: spacing.lg, gap: spacing.md, paddingBottom: 120 },
  section: { gap: spacing.sm },
  sectionLabel: { ...type.caption, color: colors.inkSoft, fontWeight: '600' },

  summaryBox: {
    backgroundColor: colors.paperRaised, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md,
  },
  summaryText: { ...type.body, color: colors.ink, lineHeight: 22 },

  colorDot: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  colorDotSelected: { borderWidth: 2.5, borderColor: colors.ink },

  reviewHint: { ...type.caption, color: colors.inkSoft, marginBottom: 4 },
  reviewCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    backgroundColor: colors.paperRaised, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md, ...shadows.soft,
  },
  reviewCardDeselected: { opacity: 0.5 },
  reviewCheckbox: { paddingTop: 2 },
  reviewTerm: { ...type.label, fontSize: 15, color: colors.ink, marginBottom: 4 },
  reviewDef: { ...type.caption, color: colors.inkSoft },

  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: radius.md, paddingVertical: 14, ...shadows.soft,
  },
  saveBtnText: { ...type.label, color: '#fff', fontSize: 15 },

  doneScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.lg },
  doneIconWrap: {
    width: 96, height: 96, borderRadius: 48,
    alignItems: 'center', justifyContent: 'center',
  },
  doneTitle: { ...type.h1, color: colors.ink, textAlign: 'center' },
  doneSub: { ...type.body, color: colors.inkSoft, textAlign: 'center' },
  donePrimaryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: radius.md,
    paddingVertical: 13, paddingHorizontal: spacing.xl, ...shadows.soft,
    alignSelf: 'stretch', justifyContent: 'center',
  },
  donePrimaryText: { ...type.label, color: '#fff', fontSize: 15 },
  doneSecondaryBtn: { paddingVertical: spacing.sm },
  doneSecondaryText: { ...type.label, color: colors.inkSoft, fontSize: 14 },
});
