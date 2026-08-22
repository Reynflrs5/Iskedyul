/**
 * Deck Detail Screen — shows all cards in the deck, lets you add/edit/star cards
 * and launch Study Mode (with shuffle & starred-only options).
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

function getTimeAgo(dateStr: string | null) {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function DeckDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const [deck, setDeck] = useState<any>(null);
  const [cards, setCards] = useState<any[]>([]);
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [showDueOnly, setShowDueOnly] = useState(false);
  const [shuffle, setShuffle] = useState(true);

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

  const toggleStar = async (cardId: string, currentStarred: boolean) => {
    // Optimistic update
    setCards((prev) => prev.map((c) => c.id === cardId ? { ...c, starred: !currentStarred } : c));
    await supabase.from('cards').update({ starred: !currentStarred }).eq('id', cardId);
  };

  const deckColor = deck?.color === 'sage' ? colors.sage
    : deck?.color === 'periwinkle' ? colors.periwinkle
      : deck?.color === 'purple' ? '#A855F7'
        : deck?.color === 'red' ? colors.error
          : deck?.color === 'blue' ? '#3B82F6'
            : colors.marigold;

  const exportDeck = () => {
    if (cards.length === 0) return;
    const exportData = {
      title: deck.title,
      cards: cards.map(c => ({ term: c.term, definition: c.definition }))
    };
    Alert.alert('Export Deck', JSON.stringify(exportData, null, 2));
  };

  const starredCount = cards.filter(c => c.starred).length;
  const dueCount = cards.filter(c => c.next_review_date && new Date(c.next_review_date) <= new Date()).length;

  let displayCards = cards;
  if (showStarredOnly) displayCards = displayCards.filter(c => c.starred);
  if (showDueOnly) displayCards = displayCards.filter(c => c.next_review_date && new Date(c.next_review_date) <= new Date());

  const goToStudy = () => {
    if (cards.length === 0) return;
    if (displayCards.length === 0) {
      Alert.alert('No Cards', 'No cards match your current filters (Starred/Due).');
      return;
    }
    router.push({
      pathname: `/pages/decks/${id}/study` as any,
      params: {
        shuffle: shuffle ? '1' : '0',
        starredOnly: showStarredOnly ? '1' : '0',
        dueOnly: showDueOnly ? '1' : '0',
      },
    });
  };

  const goToAddCard = () => router.push(`/pages/decks/${id}/add-card` as any);
  
  const goToEditCard = (card: any) => {
    router.push({
      pathname: `/pages/decks/${id}/edit-card` as any,
      params: {
        cardId: card.id,
        cardTerm: card.term,
        cardDefinition: card.definition,
      },
    });
  };

  const lastStudied = getTimeAgo(deck?.last_studied);
  const mastery = deck?.total > 0 ? Math.round(((deck?.reviewed || 0) / deck.total) * 100) : 0;

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
        {/* Study Stats Bar (Feature #3) */}
        {cards.length > 0 && (
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={14} color={colors.inkSoft} />
              <Text style={styles.statText}>{lastStudied || 'Not yet studied'}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="trending-up-outline" size={14} color={colors.sage} />
              <Text style={styles.statText}>{mastery}% mastery</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="star" size={14} color={colors.marigold} />
              <Text style={styles.statText}>{starredCount} starred</Text>
            </View>
          </View>
        )}

        {/* Study Options (Feature #1 & #2) */}
        {cards.length > 0 && (
          <View style={styles.optionsRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }}>
              <Pressable
                style={[styles.optionChip, shuffle && styles.optionChipActive]}
                onPress={() => setShuffle(!shuffle)}
              >
                <Ionicons name="shuffle" size={16} color={shuffle ? colors.paper : colors.inkSoft} />
                <Text style={[styles.optionText, shuffle && styles.optionTextActive]}>Shuffle</Text>
              </Pressable>
              <Pressable
                style={[styles.optionChip, showStarredOnly && { backgroundColor: colors.marigold, borderColor: colors.marigold }]}
                onPress={() => setShowStarredOnly(!showStarredOnly)}
              >
                <Ionicons name={showStarredOnly ? 'star' : 'star-outline'} size={16} color={showStarredOnly ? colors.paper : colors.inkSoft} />
                <Text style={[styles.optionText, showStarredOnly && styles.optionTextActive]}>
                  Starred Only{starredCount > 0 ? ` (${starredCount})` : ''}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.optionChip, showDueOnly && { backgroundColor: deckColor, borderColor: deckColor }]}
                onPress={() => setShowDueOnly(!showDueOnly)}
              >
                <Ionicons name="time" size={16} color={showDueOnly ? colors.paper : colors.inkSoft} />
                <Text style={[styles.optionText, showDueOnly && styles.optionTextActive]}>
                  Due Only{dueCount > 0 ? ` (${dueCount})` : ''}
                </Text>
              </Pressable>
              <Pressable
                style={styles.optionChip}
                onPress={() => router.push(`/pages/decks/${id}/generate` as any)}
              >
                <Ionicons name="sparkles" size={16} color={colors.inkSoft} />
                <Text style={styles.optionText}>AI Gen</Text>
              </Pressable>
              <Pressable
                style={styles.optionChip}
                onPress={exportDeck}
              >
                <Ionicons name="share-outline" size={16} color={colors.inkSoft} />
                <Text style={styles.optionText}>Export</Text>
              </Pressable>
            </ScrollView>
          </View>
        )}

        {displayCards.length === 0 && !showStarredOnly ? (
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
            <PressScale
              style={[styles.emptyAddBtn, { backgroundColor: colors.paperRaised, borderWidth: 1, borderColor: colors.border, marginTop: spacing.sm }]}
              onPress={() => router.push(`/pages/decks/${id}/generate` as any)}
            >
              <Ionicons name="sparkles" size={18} color={deckColor} />
              <Text style={[styles.emptyAddBtnText, { color: colors.ink }]}>Generate with AI</Text>
            </PressScale>
          </View>
        ) : displayCards.length === 0 && showStarredOnly ? (
          <View style={styles.emptyBox}>
            <Ionicons name="star-outline" size={36} color={colors.inkFaint} />
            <Text style={styles.emptyTitle}>No starred cards</Text>
            <Text style={styles.emptyBody}>Star cards you find difficult to filter them here.</Text>
          </View>
        ) : (
          displayCards.map((card, i) => (
            <Pressable
              key={card.id}
              style={styles.cardRow}
              onPress={() => goToEditCard(card)}
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
              {/* Star button (Feature #2) */}
              <Pressable
                onPress={() => toggleStar(card.id, !!card.starred)}
                hitSlop={8}
                style={{ padding: 4 }}
              >
                <Ionicons
                  name={card.starred ? 'star' : 'star-outline'}
                  size={20}
                  color={card.starred ? colors.marigold : colors.inkFaint}
                />
              </Pressable>
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
    minHeight: 36,
  },
  studyBtnText: { ...type.label, color: colors.paper, fontSize: 13 },

  content: { padding: spacing.lg, gap: spacing.sm },

  // Study Stats (Feature #3)
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paperRaised,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xs,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  statText: { ...type.caption, color: colors.inkSoft, fontSize: 11 },
  statDivider: { width: 1, height: 20, backgroundColor: colors.border },

  // Study options (Feature #1 & #2 toggles)
  optionsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.paperRaised,
  },
  optionChipActive: {
    backgroundColor: colors.periwinkle,
    borderColor: colors.periwinkle,
  },
  optionText: { ...type.caption, color: colors.inkSoft, fontWeight: '600', fontSize: 12 },
  optionTextActive: { color: colors.paper },

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
    borderRadius: radius.pill, ...shadows.soft, minHeight: 48,
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
    borderRadius: radius.md, paddingVertical: 14, ...shadows.soft, minHeight: 48,
  },
  addCardText: { ...type.label, color: colors.paper, fontSize: 15 },
});