/**
 * Study Mode Screen
 * - Cards stacked in the center
 * - Tap to flip (3D rotateY animation)
 * - Swipe right → "Got it!" (card slides out green, reviewed++)
 * - Swipe left  → "Nope"   (card slides out red, goes to back of queue)
 * - Done screen when queue is empty
 */
import React, { useCallback, useRef, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, Animated,
  PanResponder, Dimensions, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { supabase } from '../../../../utils/supabase';
import { colors, radius, spacing, type, shadows } from '../../../styles/welcome.styles';

const { width: SCREEN_W } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_W * 0.3;

function FlashCard({
  card,
  deckColor,
  onSwipeRight,
  onSwipeLeft,
}: {
  card: any;
  deckColor: string;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
}) {
  const [flipped, setFlipped] = useState(false);

  // Flip animation
  const flipAnim = useRef(new Animated.Value(0)).current;
  const swipeAnim = useRef(new Animated.Value(0)).current;
  const swipeY = useRef(new Animated.Value(0)).current;

  const flipToBack = () => {
    Animated.spring(flipAnim, { toValue: 1, useNativeDriver: true, friction: 8 }).start();
    setFlipped(true);
  };
  const flipToFront = () => {
    Animated.spring(flipAnim, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
    setFlipped(false);
  };

  const frontRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

  const cardRotate = swipeAnim.interpolate({
    inputRange: [-SCREEN_W, 0, SCREEN_W],
    outputRange: ['-15deg', '0deg', '15deg'],
  });
  const cardOpacity = swipeAnim.interpolate({
    inputRange: [-SCREEN_W, -SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD, SCREEN_W],
    outputRange: [0, 1, 1, 1, 0],
  });

  // Label overlays
  const gotItOpacity = swipeAnim.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const nopeOpacity = swipeAnim.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8,
      onPanResponderMove: (_, g) => {
        swipeAnim.setValue(g.dx);
        swipeY.setValue(g.dy * 0.15);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx > SWIPE_THRESHOLD) {
          Animated.timing(swipeAnim, { toValue: SCREEN_W * 1.5, duration: 250, useNativeDriver: true }).start(onSwipeRight);
        } else if (g.dx < -SWIPE_THRESHOLD) {
          Animated.timing(swipeAnim, { toValue: -SCREEN_W * 1.5, duration: 250, useNativeDriver: true }).start(onSwipeLeft);
        } else {
          Animated.spring(swipeAnim, { toValue: 0, useNativeDriver: true, friction: 6 }).start();
          Animated.spring(swipeY, { toValue: 0, useNativeDriver: true, friction: 6 }).start();
        }
      },
    })
  ).current;

  const handleTap = () => {
    flipped ? flipToFront() : flipToBack();
  };

  const sharedCardStyle = {
    width: SCREEN_W - spacing.lg * 4,
    height: (SCREEN_W - spacing.lg * 4) * 1.35,
    borderRadius: radius.xl,
    position: 'absolute' as const,
    backfaceVisibility: 'hidden' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: spacing.xl,
    ...shadows.cta,
  };

  return (
    <Animated.View
      style={{
        transform: [
          { translateX: swipeAnim },
          { translateY: swipeY },
          { rotate: cardRotate },
        ],
        opacity: cardOpacity,
        width: SCREEN_W - spacing.lg * 4,
        height: (SCREEN_W - spacing.lg * 4) * 1.35,
      }}
      {...panResponder.panHandlers}
    >
      <Pressable onPress={handleTap} style={{ flex: 1, width: '100%' }}>
        {/* FRONT — Term */}
        <Animated.View style={[sharedCardStyle, styles.cardFront, { transform: [{ rotateY: frontRotate }] }]}>
          {/* Got It label */}
          <Animated.View style={[styles.swipeLabel, styles.swipeLabelRight, { opacity: gotItOpacity }]}>
            <Text style={styles.swipeLabelText}>GOT IT!</Text>
          </Animated.View>
          {/* Nope label */}
          <Animated.View style={[styles.swipeLabel, styles.swipeLabelLeft, { opacity: nopeOpacity }]}>
            <Text style={styles.swipeLabelText}>NOPE</Text>
          </Animated.View>

          <Text style={styles.sideLabel}>TERM</Text>
          <Text style={styles.cardTerm}>{card.term}</Text>
          <View style={[styles.tapHint, { backgroundColor: deckColor + '20' }]}>
            <Ionicons name="sync-outline" size={14} color={deckColor} />
            <Text style={[styles.tapHintText, { color: deckColor }]}>Tap to flip</Text>
          </View>
        </Animated.View>

        {/* BACK — Definition */}
        <Animated.View
          style={[sharedCardStyle, styles.cardBack, { backgroundColor: deckColor, transform: [{ rotateY: backRotate }] }]}
        >
          <Text style={styles.sideLabelLight}>DEFINITION</Text>
          <Text style={styles.cardDefinition}>{card.definition}</Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

export default function StudyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const [queue, setQueue] = useState<any[]>([]);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [deckTitle, setDeckTitle] = useState('');
  const [deckColor, setDeckColor] = useState(colors.marigold);
  const [finished, setFinished] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadCards();
    }, [id])
  );

  const loadCards = async () => {
    const { data: deckData } = await supabase.from('decks').select('*').eq('id', id).single();
    if (deckData) {
      setDeckTitle(deckData.title);
      const c = deckData.color === 'sage' ? colors.sage
        : deckData.color === 'periwinkle' ? colors.periwinkle
        : deckData.color === 'purple' ? '#A855F7'
        : deckData.color === 'red' ? '#EF4444'
        : deckData.color === 'blue' ? '#3B82F6'
        : colors.marigold;
      setDeckColor(c);
    }

    const { data } = await supabase.from('cards').select('*').eq('deck_id', id).order('created_at');
    if (data && data.length > 0) {
      // Shuffle for a fresh study session
      const shuffled = [...data].sort(() => Math.random() - 0.5);
      setQueue(shuffled);
      setTotalCount(shuffled.length);
      setReviewedCount(0);
      setFinished(false);
    }
  };

  const handleSwipeRight = async () => {
    const newQueue = queue.slice(1);
    const newReviewed = reviewedCount + 1;
    setReviewedCount(newReviewed);
    setQueue(newQueue);
    if (newQueue.length === 0) {
      setFinished(true);
      await supabase.from('decks').update({ reviewed: newReviewed }).eq('id', id);
    }
  };

  const handleSwipeLeft = () => {
    // Move card to back of queue
    setQueue((prev) => [...prev.slice(1), prev[0]]);
  };

  const progressPct = totalCount > 0 ? (reviewedCount / totalCount) * 100 : 0;

  if (finished) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.paper} />
        <View style={styles.doneScreen}>
          <View style={[styles.doneIcon, { backgroundColor: deckColor + '22' }]}>
            <Ionicons name="checkmark-circle" size={56} color={deckColor} />
          </View>
          <Text style={styles.doneTitle}>Session Complete! 🎉</Text>
          <Text style={styles.doneSub}>You studied {totalCount} card{totalCount !== 1 ? 's' : ''} in this deck.</Text>
          <View style={styles.doneActions}>
            <Pressable style={[styles.doneBtn, { borderColor: colors.border }]} onPress={loadCards}>
              <Ionicons name="refresh" size={16} color={colors.ink} />
              <Text style={[styles.doneBtnText, { color: colors.ink }]}>Study Again</Text>
            </Pressable>
            <Pressable style={[styles.doneBtn, { backgroundColor: deckColor, borderColor: deckColor }]} onPress={() => router.back()}>
              <Ionicons name="checkmark" size={16} color="#fff" />
              <Text style={[styles.doneBtnText, { color: '#fff' }]}>Done</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  const currentCard = queue[0];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.paper} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="close" size={24} color={colors.ink} />
        </Pressable>
        <View style={{ flex: 1, marginHorizontal: spacing.md }}>
          <Text style={styles.headerTitle} numberOfLines={1}>{deckTitle}</Text>
          <Text style={styles.headerSub}>{reviewedCount} / {totalCount} known</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <Animated.View
          style={[styles.progressFill, { width: `${progressPct}%`, backgroundColor: deckColor }]}
        />
      </View>

      {/* Card area */}
      <View style={styles.cardArea}>
        {/* Next card shadow peek */}
        {queue.length > 1 && (
          <View style={[styles.cardPeek, { backgroundColor: deckColor + '33' }]} />
        )}

        {currentCard && (
          <FlashCard
            key={currentCard.id}
            card={currentCard}
            deckColor={deckColor}
            onSwipeRight={handleSwipeRight}
            onSwipeLeft={handleSwipeLeft}
          />
        )}
      </View>

      {/* Swipe hint */}
      <View style={[styles.hintRow, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <View style={styles.hintChip}>
          <Ionicons name="arrow-back" size={14} color="#EF4444" />
          <Text style={[styles.hintText, { color: '#EF4444' }]}>Nope</Text>
        </View>
        <Text style={styles.hintCenter}>{queue.length} left</Text>
        <View style={styles.hintChip}>
          <Text style={[styles.hintText, { color: colors.sage }]}>Got it</Text>
          <Ionicons name="arrow-forward" size={14} color={colors.sage} />
        </View>
      </View>
    </View>
  );
}

const CARD_W = SCREEN_W - spacing.lg * 4;
const CARD_H = CARD_W * 1.35;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  headerTitle: { ...type.label, fontSize: 15, color: colors.ink },
  headerSub: { ...type.caption, color: colors.inkSoft },

  progressTrack: {
    height: 4, backgroundColor: colors.border,
    marginHorizontal: spacing.lg, borderRadius: 2, overflow: 'hidden',
  },
  progressFill: { height: 4, borderRadius: 2 },

  cardArea: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
  },
  cardPeek: {
    position: 'absolute',
    width: CARD_W - 20,
    height: CARD_H - 20,
    borderRadius: radius.xl,
    bottom: -8,
  },

  // Shared card face styles
  cardFront: {
    backgroundColor: colors.paperRaised,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  cardBack: {
    // background set dynamically from deckColor
  },
  sideLabel: {
    ...type.overline,
    color: colors.inkFaint,
    position: 'absolute',
    top: spacing.lg,
  },
  sideLabelLight: {
    ...type.overline,
    color: 'rgba(255,255,255,0.65)',
    position: 'absolute',
    top: spacing.lg,
  },
  cardTerm: {
    ...type.h1, fontSize: 26, color: colors.ink,
    textAlign: 'center', lineHeight: 34,
  },
  cardDefinition: {
    ...type.body, fontSize: 18, color: '#fff',
    textAlign: 'center', lineHeight: 28,
  },
  tapHint: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: radius.pill,
    position: 'absolute', bottom: spacing.lg,
  },
  tapHintText: { ...type.caption, fontSize: 11, fontWeight: '600' },

  // Swipe label overlays
  swipeLabel: {
    position: 'absolute', top: spacing.xl,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: radius.sm, borderWidth: 2.5,
    transform: [{ rotate: '-15deg' }],
  },
  swipeLabelRight: {
    right: spacing.md,
    backgroundColor: colors.sageSoft, borderColor: colors.sage,
  },
  swipeLabelLeft: {
    left: spacing.md,
    backgroundColor: '#FEE2E2', borderColor: '#EF4444',
    transform: [{ rotate: '15deg' }],
  },
  swipeLabelText: { ...type.label, fontSize: 13 },

  hintRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xl, paddingTop: spacing.md,
  },
  hintChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  hintText: { ...type.label, fontSize: 13 },
  hintCenter: { ...type.caption, color: colors.inkSoft },

  // Done screen
  doneScreen: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: spacing.xl, gap: spacing.lg,
  },
  doneIcon: {
    width: 96, height: 96, borderRadius: 48,
    alignItems: 'center', justifyContent: 'center',
  },
  doneTitle: { ...type.h1, color: colors.ink, textAlign: 'center' },
  doneSub: { ...type.body, color: colors.inkSoft, textAlign: 'center' },
  doneActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  doneBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderRadius: radius.md, paddingVertical: 13,
    borderWidth: 1.5, ...shadows.soft,
  },
  doneBtnText: { ...type.label, fontSize: 14 },
});
