/**
 * Scan Schedule Screen
 * - User picks a photo from gallery or takes a new one
 * - Image is sent to Google Gemini Vision API as base64
 * - AI extracts classes (subject, room, time, day)
 * - User reviews the result and confirms to save to Supabase
 *
 * To use this feature, replace GEMINI_API_KEY below with your own key.
 * Get a free key at: https://aistudio.google.com/app/apikey
 */
import React, { useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView,
  ActivityIndicator, Image, Alert, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '../../../utils/supabase';
import { colors, radius, spacing, type, shadows } from '../../styles/welcome.styles';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const PROMPT = `You are a class schedule parser.
Look at this image and extract all class/subject schedule entries you can see.
Return ONLY a valid JSON array (no markdown, no explanation) with objects like:
[{"subject":"Calculus II","location":"Room 204","time":"9:00 AM","time_end":"10:30 AM","day":0}]
Rules:
- day is 0=Monday, 1=Tuesday, 2=Wednesday, 3=Thursday, 4=Friday, 5=Saturday, 6=Sunday
- If day is not visible, use null
- time and time_end should be in 12-hour format if possible
- location can be empty string if not visible
- Omit any entry that doesn't have at least a subject and a time
Return only the JSON array.`;

type ExtractedClass = {
  subject: string;
  location: string;
  time: string;
  time_end: string;
  day: number | null;
  selected: boolean;
};

export default function ScanScheduleScreen() {
  const insets = useSafeAreaInsets();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedClass[]>([]);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<'pick' | 'review' | 'done'>('pick');

  const checkLimit = async (): Promise<boolean> => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const usage = await AsyncStorage.getItem(`scan_usage_${today}`);
      const count = usage ? parseInt(usage, 10) : 0;
      if (count >= 3) {
        Alert.alert('Daily Limit Reached', 'You can only use the AI scanner 3 times a day to prevent spam. Please try again tomorrow or enter classes manually!');
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
      const usage = await AsyncStorage.getItem(`scan_usage_${today}`);
      const count = usage ? parseInt(usage, 10) : 0;
      await AsyncStorage.setItem(`scan_usage_${today}`, (count + 1).toString());
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
    setExtracted([]);

    try {
      if (!GEMINI_API_KEY) {
        throw new Error(
          'Gemini API key is missing. Check EXPO_PUBLIC_GEMINI_API_KEY in your .env file.'
        );
      }

      if (!base64) {
        throw new Error('Could not read the selected image.');
      }

      const mimeType = uri.toLowerCase().endsWith('.png')
        ? 'image/png'
        : 'image/jpeg';

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
You are a class schedule parser.

Look at the provided schedule image and extract every class/subject schedule entry that you can clearly identify.

Return ONLY a valid JSON array.

Each object MUST have:

{
  "subject": "string",
  "location": "string",
  "time": "string",
  "time_end": "string",
  "day": number | null
}

Rules:

- day 0 = Monday
- day 1 = Tuesday
- day 2 = Wednesday
- day 3 = Thursday
- day 4 = Friday
- day 5 = Saturday
- day 6 = Sunday
- If the day cannot be determined, use null.
- time should use 12-hour format when possible.
- location should be an empty string if no room/location is visible.
- Ignore entries that do not contain at least a subject and a start time.
- Do not invent information.
- Return ONLY the JSON array.
- Do not use markdown.
- Do not include \`\`\`json.
- Do not include explanations.
                `,
              },
            ],
          }),
        }
      );

      const json = await response.json();

      console.log(
        'Gemini API Response:',
        JSON.stringify(json, null, 2)
      );

      if (!response.ok) {
        throw new Error(
          json?.error?.message ||
          `Gemini API request failed with status ${response.status}`
        );
      }

      if (json?.error) {
        throw new Error(json.error.message);
      }

      // Interactions API returns output_text for text responses, or an array of steps.
      const modelOutputStep = json?.steps?.find((step: any) => step.type === 'model_output');
      
      const rawText =
        modelOutputStep?.content?.[0]?.text ||
        json?.output_text ||
        json?.output?.[0]?.content?.[0]?.text ||
        '';

      if (!rawText) {
        console.log('Unexpected Gemini response:', json);
        throw new Error('No text returned from Gemini API.');
      }

      console.log('Gemini raw output:', rawText);

      // Remove markdown fences if Gemini happens to return them.
      const cleaned = rawText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      let parsed: any[];

      try {
        parsed = JSON.parse(cleaned);
      } catch (parseError) {
        console.error(
          'Failed to parse Gemini JSON:',
          rawText
        );

        throw new Error(
          'AI returned invalid schedule data. Please try a clearer image.'
        );
      }

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('No classes found in image.');
      }

      // If we got this far successfully, increment their daily usage limit!
      await incrementLimit();

      setExtracted(
        parsed.map((c: any) => ({
          subject: c.subject ?? '',
          location: c.location ?? '',
          time: c.time ?? '',
          time_end: c.time_end ?? '',
          day: c.day ?? null,
          selected: true,
        }))
      );

      setStep('review');

    } catch (e: any) {
      console.error('Scan Error:', e);

      Alert.alert(
        'Could not parse schedule',
        e?.message ?? 'Please try a clearer image.'
      );

    } finally {
      setLoading(false);
    }
  };


  const toggleSelect = (i: number) => {
    setExtracted((prev) =>
      prev.map((c, idx) => idx === i ? { ...c, selected: !c.selected } : c)
    );
  };

  const handleSave = async () => {
    const toSave = extracted.filter((c) => c.selected && c.subject && c.time);
    if (toSave.length === 0) {
      Alert.alert('Nothing selected', 'Select at least one class to save.');
      return;
    }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('classes').insert(
      toSave.map((c) => ({
        subject: c.subject,
        location: c.location || 'TBA',
        time: c.time,
        time_end: c.time_end,
        day: c.day,
        user_id: user?.id,
      }))
    );
    setSaving(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setStep('done');
    }
  };

  // ── DONE ────────────────────────────────────────
  if (step === 'done') {
    const count = extracted.filter((c) => c.selected).length;
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.doneScreen}>
          <View style={styles.doneIconWrap}>
            <Ionicons name="calendar-number" size={48} color={colors.periwinkle} />
          </View>
          <Text style={styles.doneTitle}>Schedule Saved! 🎉</Text>
          <Text style={styles.doneSub}>{count} class{count !== 1 ? 'es' : ''} added to your schedule.</Text>
          <Pressable style={styles.donePrimaryBtn} onPress={() => router.replace('/pages/schedule' as any)}>
            <Ionicons name="calendar" size={18} color="#fff" />
            <Text style={styles.donePrimaryText}>View Schedule</Text>
          </Pressable>
          <Pressable style={styles.doneSecondaryBtn} onPress={() => { setStep('pick'); setImageUri(null); setExtracted([]); }}>
            <Text style={styles.doneSecondaryText}>Scan Another</Text>
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
          <Pressable onPress={() => { setStep('pick'); setImageUri(null); setExtracted([]); }} hitSlop={10}>
            <Ionicons name="arrow-back" size={24} color={colors.ink} />
          </Pressable>
          <Text style={styles.headerTitle}>Review Classes</Text>
          <Text style={styles.headerSub}>{extracted.filter((c) => c.selected).length} selected</Text>
        </View>

        {imageUri && (
          <Image source={{ uri: imageUri }} style={styles.previewThumb} resizeMode="cover" />
        )}

        <ScrollView contentContainerStyle={styles.reviewList} showsVerticalScrollIndicator={false}>
          <Text style={styles.reviewHint}>Tap to deselect classes you don't want to add.</Text>
          {extracted.map((c, i) => (
            <Pressable
              key={i}
              style={[styles.reviewCard, !c.selected && styles.reviewCardDeselected]}
              onPress={() => toggleSelect(i)}
            >
              <View style={styles.reviewCheckbox}>
                {c.selected
                  ? <Ionicons name="checkmark-circle" size={22} color={colors.periwinkle} />
                  : <Ionicons name="ellipse-outline" size={22} color={colors.inkFaint} />
                }
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.reviewSubject, !c.selected && { opacity: 0.4 }]}>{c.subject}</Text>
                <View style={styles.reviewMeta}>
                  {c.day !== null && (
                    <View style={styles.reviewTag}>
                      <Text style={styles.reviewTagText}>{DAYS[c.day ?? 0]}</Text>
                    </View>
                  )}
                  <Text style={styles.reviewMetaText}>
                    {c.time}{c.time_end ? ` – ${c.time_end}` : ''}
                  </Text>
                  {c.location ? <Text style={styles.reviewMetaText}>· {c.location}</Text> : null}
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <Pressable
            style={[styles.saveBtn, saving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator size="small" color="#fff" />
              : <>
                <Ionicons name="save-outline" size={18} color="#fff" />
                <Text style={styles.saveBtnText}>Save to Schedule</Text>
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
        <Text style={styles.headerTitle}>Scan Schedule</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.pickContent}>
        {/* Illustration box */}
        <View style={styles.illustrationBox}>
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={colors.periwinkle} />
              <Text style={styles.loadingText}>AI is reading your schedule…</Text>
              <Text style={styles.loadingSubText}>This may take a few seconds</Text>
            </View>
          ) : imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
          ) : (
            <>
              <Ionicons name="scan-outline" size={64} color={colors.inkFaint} />
              <Text style={styles.illustrationTitle}>Take a photo of your schedule</Text>
              <Text style={styles.illustrationBody}>
                AI will automatically detect subjects, rooms, and time slots — even from a hand-written or printed timetable.
              </Text>
            </>
          )}
        </View>

        {/* Buttons */}
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

        <Text style={styles.disclaimer}>
          🔒 Your photo is sent directly to Google Gemini and is not stored on any server.
        </Text>
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

  // PICK step
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
  disclaimer: { ...type.caption, color: colors.inkFaint, textAlign: 'center' },

  // REVIEW step
  previewThumb: {
    height: 80, marginHorizontal: spacing.lg, marginTop: spacing.sm,
    borderRadius: radius.md,
  },
  reviewList: { padding: spacing.lg, gap: spacing.sm, paddingBottom: 120 },
  reviewHint: { ...type.caption, color: colors.inkSoft, marginBottom: spacing.xs },
  reviewCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    backgroundColor: colors.paperRaised, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md, ...shadows.soft,
  },
  reviewCardDeselected: { opacity: 0.5 },
  reviewCheckbox: { paddingTop: 1 },
  reviewSubject: { ...type.label, fontSize: 15, color: colors.ink },
  reviewMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4, alignItems: 'center' },
  reviewTag: {
    backgroundColor: colors.periwinkleSoft, borderRadius: radius.pill,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  reviewTagText: { ...type.caption, color: colors.periwinkle, fontWeight: '700', fontSize: 11 },
  reviewMetaText: { ...type.caption, color: colors.inkSoft },
  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: colors.periwinkle,
    borderRadius: radius.md, paddingVertical: 14, ...shadows.soft,
  },
  saveBtnText: { ...type.label, color: '#fff', fontSize: 15 },

  // DONE step
  doneScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.lg },
  doneIconWrap: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: colors.periwinkleSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  doneTitle: { ...type.h1, color: colors.ink, textAlign: 'center' },
  doneSub: { ...type.body, color: colors.inkSoft, textAlign: 'center' },
  donePrimaryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.periwinkle, borderRadius: radius.md,
    paddingVertical: 13, paddingHorizontal: spacing.xl, ...shadows.soft,
    alignSelf: 'stretch', justifyContent: 'center',
  },
  donePrimaryText: { ...type.label, color: '#fff', fontSize: 15 },
  doneSecondaryBtn: { paddingVertical: spacing.sm },
  doneSecondaryText: { ...type.label, color: colors.inkSoft, fontSize: 14 },
});
