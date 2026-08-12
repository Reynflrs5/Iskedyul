import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Easing, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SheetField from '../../../components/SheetField';
import PressScale from '../../../components/PressScale';
import { colors, radius, spacing, type, shadows } from '../../styles/welcome.styles';
import { supabase } from '../../../utils/supabase';

const COLORS = [
  { key: 'marigold', color: colors.marigold, bg: colors.marigoldSoft },
  { key: 'periwinkle', color: colors.periwinkle, bg: colors.periwinkleSoft },
  { key: 'sage', color: colors.sage, bg: colors.sageSoft },
  { key: 'purple', color: '#A855F7', bg: '#F3E8FF' },
  { key: 'red', color: colors.error, bg: colors.errorSoft },
  { key: 'blue', color: '#3B82F6', bg: '#DBEAFE' },
];

// One color swatch — its own selection animation (scale + checkmark fade),
// so picking a color feels responsive rather than an instant style swap.
function ColorDot({
  option,
  isSelected,
  onPress,
}: {
  option: (typeof COLORS)[number];
  isSelected: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(isSelected ? 1 : 0.86)).current;
  const checkOpacity = useRef(new Animated.Value(isSelected ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(scale, { toValue: isSelected ? 1.12 : 0.86, useNativeDriver: true, speed: 20, bounciness: 8 }).start();
    Animated.timing(checkOpacity, { toValue: isSelected ? 1 : 0, duration: 140, useNativeDriver: true }).start();
  }, [isSelected]);

  return (
    <Pressable onPress={onPress} hitSlop={6}>
      <Animated.View
        style={[
          styles.colorDot,
          { backgroundColor: option.color, transform: [{ scale }] },
          isSelected && styles.colorDotSelected,
        ]}
      >
        <Animated.View style={{ opacity: checkOpacity }}>
          <Ionicons name="checkmark" size={16} color={colors.paper} />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

export default function NewDeckScreen() {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [selectedColor, setSelectedColor] = useState('marigold');
  const [loading, setLoading] = useState(false);
  const [titleError, setTitleError] = useState(false);

  const contentAnim = useRef(new Animated.Value(0)).current;
  const titleShake = useRef(new Animated.Value(0)).current;
  const previewBounce = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(contentAnim, {
      toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    // Small bounce on the preview card whenever the color changes, so the
    // swap reads as a deliberate update rather than a silent re-render.
    previewBounce.setValue(0.97);
    Animated.spring(previewBounce, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 10 }).start();
  }, [selectedColor]);

  const shakeTitleField = () => {
    titleShake.setValue(0);
    Animated.sequence([
      Animated.timing(titleShake, { toValue: 1, duration: 55, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(titleShake, { toValue: -1, duration: 55, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(titleShake, { toValue: 1, duration: 55, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(titleShake, { toValue: 0, duration: 55, easing: Easing.linear, useNativeDriver: true }),
    ]).start();
  };

  const handleAdd = async () => {
    if (!title.trim()) {
      setTitleError(true);
      shakeTitleField();
      return;
    }
    setTitleError(false);
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
      setTitleError(true);
      shakeTitleField();
    } else {
      router.back();
    }
  };

  const activeSwatch = COLORS.find((c) => c.key === selectedColor)!;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>New Deck</Text>
        <View style={{ width: 36 }} />
      </View>

      <Animated.View
        style={[
          styles.content,
          {
            opacity: contentAnim,
            transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
          },
        ]}
      >
        <Animated.View style={{ transform: [{ translateX: titleShake.interpolate({ inputRange: [-1, 0, 1], outputRange: [-6, 0, 6] }) }] }}>
          <SheetField
            label="DECK NAME"
            placeholder="e.g. World History Chapter 6"
            value={title}
            onChangeText={(t: string) => { setTitle(t); if (titleError && t.trim()) setTitleError(false); }}
            autoFocus
          />
        </Animated.View>
        {titleError && (
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle" size={12} color={colors.error} />
            <Text style={styles.errorText}>Give your deck a name first</Text>
          </View>
        )}

        <Text style={styles.sectionLabel}>COLOR TAG</Text>
        <View style={styles.colorRow}>
          {COLORS.map((c) => (
            <ColorDot
              key={c.key}
              option={c}
              isSelected={selectedColor === c.key}
              onPress={() => setSelectedColor(c.key)}
            />
          ))}
        </View>

        <Animated.View style={[styles.preview, { backgroundColor: activeSwatch.bg, transform: [{ scale: previewBounce }] }]}>
          <View style={[styles.previewIcon, { backgroundColor: activeSwatch.color }]}>
            <Ionicons name="layers" size={16} color={colors.paper} />
          </View>
          <Text style={[styles.previewTitle, { color: activeSwatch.color }]} numberOfLines={1}>
            {title || 'Deck name preview'}
          </Text>
        </Animated.View>
      </Animated.View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <PressScale
          style={[styles.submitBtn, { backgroundColor: activeSwatch.color }, loading && { opacity: 0.7 }]}
          onPress={handleAdd}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.paper} />
          ) : (
            <>
              <Ionicons name="add-circle" size={18} color={colors.paper} />
              <Text style={styles.submitText}>Create Deck</Text>
            </>
          )}
        </PressScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  backBtn: {
    width: 36, height: 36, borderRadius: radius.pill,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.paperRaised, borderWidth: 1, borderColor: colors.border,
  },
  headerTitle: { ...type.h2, color: colors.ink },
  content: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },

  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: -spacing.xs, marginBottom: spacing.sm },
  errorText: { ...type.caption, color: colors.error },

  sectionLabel: { ...type.caption, color: colors.inkSoft, fontWeight: '600', marginBottom: spacing.sm, marginTop: spacing.sm },
  colorRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  colorDot: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  colorDotSelected: { borderWidth: 2.5, borderColor: colors.ink },
  preview: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, marginBottom: spacing.lg },
  previewIcon: { width: 34, height: 34, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  previewTitle: { ...type.label, fontSize: 15, flex: 1 },
  submitBtn: { borderRadius: radius.md, paddingVertical: 14, ...shadows.soft },
  submitText: { ...type.label, color: colors.paper, fontSize: 15 },
});