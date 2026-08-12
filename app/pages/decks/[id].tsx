/**
 * Deck Detail Screen — shows all cards in the deck, lets you add cards
 * and launch Study Mode.
 */
import React, { useCallback, useRef, useState } from 'react';
import {
  View, Text, Pressable, ScrollView, StatusBar,
  StyleSheet, Animated, Easing, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { supabase } from '../../../utils/supabase';
import { colors, radius, spacing, type, shadows } from '../../styles/welcome.styles';

// A press-scale wrapper shared by every button on this screen — the Study
// screen has an identical component; worth lifting both into
// components/PressScale.tsx once you touch a third screen that needs it.
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
    !disabled && Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, speed: 40 }).start();
  const pressOut = () =>
    !disabled && Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 4 }).start();

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
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

export default function DeckDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const [deck, setDeck] = useState<any>(null);
  const [cards, setCards] = useState<any[]>([]);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }).start();

      loadDeck();
    }, [id])
  );

  const loadDeck = async () => {
    const { data: deckData } = await supabase.from('decks').select('*').eq('id', id).single();
    if (deckData) setDeck(deckData);

    const { data: cardData } = await supabase
      .from('cards')
      .select('*')
      .eq('deck_id', id)
      .order('created_at', { ascending: true });
    if (cardData) {
      setCards(cardData);
      // Keep total count in sync
      await supabase.from('decks').update({ total: cardData.length }).eq('id', id);
    }
  };

  const confirmDeleteCard = (cardId: string, term: string) => {
    Alert.alert('Delete Card', `Delete "${term}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          setCards((prev) => prev.filter((c) => c.id !== cardId));
          await supabase.from('cards').delete().eq('id', cardId);
          await supabase.from('decks').update({ total: cards.length - 1 }).eq('id', id);
        },
      },
    ]);
  };

  const deckColor = deck?.color === 'sage' ? colors.sage
    : deck?.color === 'periwinkle' ? colors.periwinkle
      : deck?.color === 'purple' ? '#A855F7'
        : deck?.color === 'red' ? colors.error
          : deck?.color === 'blue' ? '#3B82F6'
            : colors.marigold;

  const goToStudy = () => cards.length > 0 && router.push(`/pages/decks/${id}/study` as any);
  const goToAddCard = () => router.push(`/pages/decks/${id}/add-card` as any);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.paper} />

      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }],
          },
        ]}
      >
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.ink} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <View style={styles.headerTitleRow}>
            <View style={[styles.headerDot, { backgroundColor: deckColor }]} />
            <Text style={styles.headerTitle} numberOfLines={1}>{deck?.title ?? '...'}</Text>
          </View>
          <Text style={styles.headerSub}>{cards.length} card{cards.length !== 1 ? 's' : ''}</Text>
        </View>
        <PressScale
          style={[styles.studyBtn, { backgroundColor: deckColor, opacity: cards.length === 0 ? 0.4 : 1 }]}
          onPress={goToStudy}
          disabled={cards.length === 0}
        >
          <Ionicons name="play" size={14} color={colors.paper} />
          <Text style={styles.studyBtnText}>Study</Text>
        </PressScale>
      </Animated.View>

      <Animated.ScrollView
        style={{
          flex: 1,
          opacity: fadeAnim,
          transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
        }}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {cards.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={[styles.emptyIconWrap, { backgroundColor: deckColor + '18' }]}>
              <Ionicons name="card-outline" size={32} color={deckColor} />
            </View>
            <Text style={styles.emptyTitle}>No cards yet</Text>
            <Text style={styles.emptyBody}>Add your first term to start building this deck.</Text>
            <PressScale
              style={[styles.emptyAddBtn, { backgroundColor: deckColor }]}
              onPress={goToAddCard}
            >
              <Ionicons name="add" size={18} color={colors.paper} />
              <Text style={styles.emptyAddBtnText}>Add First Card</Text>
            </PressScale>
          </View>
        ) : (
          cards.map((card, i) => (
            <Pressable
              key={card.id}
              style={styles.cardRow}
              onLongPress={() => confirmDeleteCard(card.id, card.term)}
              delayLongPress={400}
            >
              <View style={[styles.cardAccentBar, { backgroundColor: deckColor }]} />
              <View style={[styles.cardIndex, { backgroundColor: deckColor + '18' }]}>
                <Text style={[styles.cardIndexText, { color: deckColor }]}>{i + 1}</Text>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTerm}>{card.term}</Text>
                <Text style={styles.cardDef} numberOfLines={2}>{card.definition}</Text>
              </View>
              <Ionicons name="ellipsis-vertical" size={16} color={colors.inkFaint} />
            </Pressable>
          ))
        )}
      </Animated.ScrollView>

      {/* Add card FAB */}
      <View style={[styles.fabWrap, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <PressScale style={[styles.addCardBtn, { backgroundColor: deckColor }]} onPress={goToAddCard}>
          <Ionicons name="add" size={20} color={colors.paper} />
          <Text style={styles.addCardText}>Add Card</Text>
        </PressScale>
      </View>
    </View>
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
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerDot: { width: 7, height: 7, borderRadius: 3.5 },
  headerTitle: { ...type.h2, color: colors.ink, flexShrink: 1 },
  headerSub: { ...type.caption, color: colors.inkSoft, marginTop: 1 },
  studyBtn: {
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: radius.pill, ...shadows.soft,
  },
  studyBtnText: { ...type.label, color: colors.paper, fontSize: 13 },

  content: { padding: spacing.lg, gap: spacing.sm },

  emptyBox: {
    alignItems: 'center', paddingVertical: spacing.xxl,
    gap: spacing.xs,
  },
  emptyIconWrap: {
    width: 64, height: 64, borderRadius: radius.lg,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyTitle: { ...type.h2, color: colors.ink },
  emptyBody: { ...type.body, color: colors.inkSoft, textAlign: 'center', marginBottom: spacing.md },
  emptyAddBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: spacing.lg, paddingVertical: 12,
    borderRadius: radius.pill, ...shadows.soft,
  },
  emptyAddBtnText: { ...type.label, color: colors.paper, fontSize: 14 },

  cardRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.paperRaised,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    paddingVertical: spacing.md, paddingRight: spacing.md, paddingLeft: spacing.sm,
    gap: spacing.sm, overflow: 'hidden', ...shadows.soft,
  },
  cardAccentBar: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
  },
  cardIndex: {
    width: 32, height: 32, borderRadius: radius.sm,
    alignItems: 'center', justifyContent: 'center', marginLeft: spacing.xs,
  },
  cardIndexText: { ...type.label, fontSize: 13 },
  cardContent: { flex: 1 },
  cardTerm: { ...type.label, fontSize: 14, color: colors.ink },
  cardDef: { ...type.caption, color: colors.inkSoft, marginTop: 2 },

  fabWrap: {
    paddingHorizontal: spacing.lg, paddingTop: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  addCardBtn: {
    borderRadius: radius.md, paddingVertical: 14, ...shadows.soft,
  },
  addCardText: { ...type.label, color: colors.paper, fontSize: 15 },
});