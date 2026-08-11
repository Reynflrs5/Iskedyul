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
    : deck?.color === 'red' ? '#EF4444'
    : deck?.color === 'blue' ? '#3B82F6'
    : colors.marigold;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.paper} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={styles.headerTitle} numberOfLines={1}>{deck?.title ?? '...'}</Text>
          <Text style={styles.headerSub}>{cards.length} card{cards.length !== 1 ? 's' : ''}</Text>
        </View>
        <Pressable
          style={[styles.studyBtn, { backgroundColor: deckColor, opacity: cards.length === 0 ? 0.4 : 1 }]}
          onPress={() => cards.length > 0 && router.push(`/pages/decks/${id}/study` as any)}
          disabled={cards.length === 0}
        >
          <Ionicons name="play" size={14} color="#fff" />
          <Text style={styles.studyBtnText}>Study</Text>
        </Pressable>
      </View>

      <Animated.ScrollView
        style={{ flex: 1, opacity: fadeAnim }}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {cards.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="card-outline" size={40} color={colors.inkFaint} />
            <Text style={styles.emptyTitle}>No cards yet</Text>
            <Text style={styles.emptyBody}>Tap the button below to add your first term!</Text>
          </View>
        ) : (
          cards.map((card, i) => (
            <Pressable
              key={card.id}
              style={styles.cardRow}
              onLongPress={() => confirmDeleteCard(card.id, card.term)}
              delayLongPress={400}
            >
              <View style={[styles.cardIndex, { backgroundColor: deckColor + '22' }]}>
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
        <Pressable
          style={[styles.addCardBtn, { backgroundColor: deckColor }]}
          onPress={() => router.push(`/pages/decks/${id}/add-card` as any)}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addCardText}>Add Card</Text>
        </Pressable>
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
  headerTitle: { ...type.h2, color: colors.ink },
  headerSub: { ...type.caption, color: colors.inkSoft, marginTop: 1 },
  studyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: radius.pill, ...shadows.soft,
  },
  studyBtnText: { ...type.label, color: '#fff', fontSize: 13 },

  content: { padding: spacing.lg, gap: spacing.sm },

  emptyBox: {
    alignItems: 'center', paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyTitle: { ...type.h2, color: colors.ink },
  emptyBody: { ...type.body, color: colors.inkSoft, textAlign: 'center' },

  cardRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.paperRaised,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, gap: spacing.sm, ...shadows.soft,
  },
  cardIndex: {
    width: 32, height: 32, borderRadius: radius.sm,
    alignItems: 'center', justifyContent: 'center',
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderRadius: radius.md, paddingVertical: 14, ...shadows.soft,
  },
  addCardText: { ...type.label, color: '#fff', fontSize: 15 },
});
