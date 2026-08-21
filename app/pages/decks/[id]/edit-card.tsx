/**
 * Edit Card Screen — edit an existing card's term + definition.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet,
  TextInput, KeyboardAvoidingView, Platform, ScrollView,
  Animated, Easing, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../../utils/supabase';
import { colors, radius, spacing, type, shadows } from '../../../styles/welcome.styles';

function PressScale({
  onPress,
  disabled,
  style,
  children,
}: {
  onPress?: () => void;
  disabled?: boolean;
  style?: any;
  children: React.ReactNode;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () =>
    !disabled && Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 40 }).start();
  const pressOut = () =>
    !disabled && Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 4 }).start();

  return (
    <Animated.View style={[{ transform: [{ scale }], minHeight: 48 }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={disabled}
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

export default function EditCardScreen() {
  const { id, cardId, cardTerm, cardDefinition } = useLocalSearchParams<{
    id: string;
    cardId: string;
    cardTerm: string;
    cardDefinition: string;
  }>();
  const insets = useSafeAreaInsets();

  const [deckColor, setDeckColor] = useState(colors.marigold);
  const [term, setTerm] = useState(cardTerm || '');
  const [definition, setDefinition] = useState(cardDefinition || '');
  const [loading, setLoading] = useState(false);
  const [termError, setTermError] = useState(false);
  const [defError, setDefError] = useState(false);

  const contentAnim = useRef(new Animated.Value(0)).current;
  const termShake = useRef(new Animated.Value(0)).current;
  const defShake = useRef(new Animated.Value(0)).current;
  const termFocusAnim = useRef(new Animated.Value(0)).current;
  const defFocusAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(contentAnim, {
      toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start();

    async function loadDeckMeta() {
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
    loadDeckMeta();
  }, [id]);

  const shakeField = (anim: Animated.Value) => {
    anim.setValue(0);
    Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 55, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(anim, { toValue: -1, duration: 55, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 1, duration: 55, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0, duration: 55, easing: Easing.linear, useNativeDriver: true }),
    ]).start();
  };

  const handleSave = async () => {
    const missingTerm = !term.trim();
    const missingDef = !definition.trim();
    if (missingTerm || missingDef) {
      setTermError(missingTerm);
      setDefError(missingDef);
      if (missingTerm) shakeField(termShake);
      if (missingDef) shakeField(defShake);
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('cards').update({
      term: term.trim(),
      definition: definition.trim(),
    }).eq('id', cardId);
    setLoading(false);

    if (error) {
      setTermError(true);
      shakeField(termShake);
    } else {
      router.back();
    }
  };

  const animateFocus = (anim: Animated.Value, toValue: number) =>
    Animated.timing(anim, { toValue, duration: 160, easing: Easing.out(Easing.quad), useNativeDriver: false }).start();

  const termBorderColor = termFocusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [termError ? colors.error : colors.border, deckColor],
  });
  const defBorderColor = defFocusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [defError ? colors.error : colors.border, deckColor],
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: contentAnim,
              transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }],
            },
          ]}
        >
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.ink} />
          </Pressable>
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <Text style={styles.headerTitle}>Edit Card</Text>
          </View>
        </Animated.View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={{ opacity: contentAnim }}>
            {/* Term */}
            <Text style={styles.label}>TERM</Text>
            <Animated.View style={{ transform: [{ translateX: termShake.interpolate({ inputRange: [-1, 0, 1], outputRange: [-6, 0, 6] }) }] }}>
              <Animated.View style={[styles.termInputWrap, { borderBottomColor: termBorderColor }]}>
                <TextInput
                  style={styles.termInput}
                  placeholder="e.g. Mitochondria"
                  placeholderTextColor={colors.inkFaint}
                  value={term}
                  onChangeText={(t) => { setTerm(t); if (termError && t.trim()) setTermError(false); }}
                  onFocus={() => animateFocus(termFocusAnim, 1)}
                  onBlur={() => animateFocus(termFocusAnim, 0)}
                  autoFocus
                  returnKeyType="next"
                  multiline={false}
                />
              </Animated.View>
            </Animated.View>
            {termError && (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={12} color={colors.error} />
                <Text style={styles.errorText}>Term can't be empty</Text>
              </View>
            )}

            {/* Definition */}
            <Text style={[styles.label, { marginTop: spacing.lg }]}>DEFINITION</Text>
            <Animated.View style={{ transform: [{ translateX: defShake.interpolate({ inputRange: [-1, 0, 1], outputRange: [-6, 0, 6] }) }] }}>
              <Animated.View style={[styles.defInputWrap, { borderColor: defBorderColor }]}>
                <TextInput
                  style={styles.defInput}
                  placeholder="e.g. The powerhouse of the cell"
                  placeholderTextColor={colors.inkFaint}
                  value={definition}
                  onChangeText={(t) => { setDefinition(t); if (defError && t.trim()) setDefError(false); }}
                  onFocus={() => animateFocus(defFocusAnim, 1)}
                  onBlur={() => animateFocus(defFocusAnim, 0)}
                  multiline
                  textAlignVertical="top"
                />
              </Animated.View>
            </Animated.View>
            {defError && (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={12} color={colors.error} />
                <Text style={styles.errorText}>Definition can't be empty</Text>
              </View>
            )}
          </Animated.View>
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <PressScale
            style={[styles.cancelBtn]}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </PressScale>
          <PressScale
            style={[styles.saveBtn, { backgroundColor: deckColor }, loading && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.paper} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={18} color={colors.paper} />
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </>
            )}
          </PressScale>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  header: {
    flexDirection: 'row', alignItems: 'center',
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
  label: { ...type.overline, color: colors.inkSoft, marginBottom: spacing.xs },
  termInputWrap: { borderBottomWidth: 2 },
  termInput: {
    ...type.h2, fontSize: 20, color: colors.ink,
    paddingVertical: spacing.sm, paddingHorizontal: 0,
  },
  defInputWrap: {
    backgroundColor: colors.paperRaised, borderRadius: radius.md,
    borderWidth: 1.5,
  },
  defInput: {
    ...type.body, fontSize: 16, color: colors.ink,
    padding: spacing.md, minHeight: 120,
  },
  errorRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: spacing.xs,
  },
  errorText: { ...type.caption, color: colors.error },
  footer: {
    flexDirection: 'row', gap: spacing.sm,
    paddingHorizontal: spacing.lg, paddingTop: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  cancelBtn: {
    flex: 1, borderRadius: radius.md, paddingVertical: 13,
    borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.paperRaised,
  },
  cancelBtnText: { ...type.label, color: colors.ink, fontSize: 14 },
  saveBtn: {
    flex: 1, borderRadius: radius.md, paddingVertical: 13,
    ...shadows.soft,
  },
  saveBtnText: { ...type.label, color: colors.paper, fontSize: 14 },
});
