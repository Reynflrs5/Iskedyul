/**
 * Study Mode Screen
 * - Cards stacked in the center
 * - Tap to flip (3D rotateY animation)
 * - Swipe right → "Got it!" (card slides out green, reviewed++)
 * - Swipe left  → "Nope"   (card slides out red, goes to back of queue)
 * - Done screen when queue is empty
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, Animated, Image,
  PanResponder, Dimensions, StatusBar, Easing, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Markdown from 'react-native-markdown-display';
import { supabase } from '../../../../utils/supabase';
import { updateStreak, incrementCardsLearned, incrementSessions, checkAndAwardBadges, ALL_BADGES, type BadgeId } from '../../../../utils/gamification';
import { colors, radius, spacing, type, shadows } from '../../../styles/welcome.styles';

const { width: SCREEN_W } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_W * 0.3;

// A press-scale wrapper used by every button on this screen, so tapping
// "Start Studying," "Study Again," etc. all share the same tactile spring
// instead of the flat, no-feedback Pressables the screen had before.
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
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

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
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Animated.timing(swipeAnim, { toValue: SCREEN_W * 1.5, duration: 250, useNativeDriver: true }).start(onSwipeRight);
        } else if (g.dx < -SWIPE_THRESHOLD) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
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
        <Animated.View style={[sharedCardStyle, styles.cardFront, { borderColor: deckColor + '30', transform: [{ rotateY: frontRotate }] }]}>
          {/* Got It label */}
          <Animated.View style={[styles.swipeLabel, styles.swipeLabelRight, { opacity: gotItOpacity }]}>
            <Text style={styles.swipeLabelText}>GOT IT!</Text>
          </Animated.View>
          {/* Nope label */}
          <Animated.View style={[styles.swipeLabel, styles.swipeLabelLeft, { opacity: nopeOpacity }]}>
            <Text style={styles.swipeLabelText}>NOPE</Text>
          </Animated.View>

          <View style={[styles.sideLabelPill, { backgroundColor: deckColor + '18' }]}>
            <Text style={[styles.sideLabel, { color: deckColor }]}>TERM</Text>
          </View>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} style={{ width: '100%', marginVertical: 40 }} showsVerticalScrollIndicator={false}>
            <Markdown style={markdownFrontStyles}>
              {card.term}
            </Markdown>
          </ScrollView>
          <View style={[styles.tapHint, { backgroundColor: deckColor + '18' }]}>
            <Ionicons name="sync-outline" size={13} color={deckColor} />
            <Text style={[styles.tapHintText, { color: deckColor }]}>Tap to flip</Text>
          </View>
        </Animated.View>

        {/* BACK — Definition */}
        <Animated.View
          style={[sharedCardStyle, styles.cardBack, { backgroundColor: deckColor, transform: [{ rotateY: backRotate }] }]}
        >
          <View style={styles.sideLabelPillLight}>
            <Text style={styles.sideLabelLight}>DEFINITION</Text>
          </View>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} style={{ width: '100%', marginVertical: 40 }} showsVerticalScrollIndicator={false}>
            <Markdown style={markdownBackStyles}>
              {card.definition}
            </Markdown>
          </ScrollView>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

export default function StudyScreen() {
  const { id, shuffle: shuffleParam, starredOnly: starredParam, dueOnly: dueParam } = useLocalSearchParams<{ id: string; shuffle?: string; starredOnly?: string; dueOnly?: string }>();
  const insets = useSafeAreaInsets();
  const shouldShuffle = shuffleParam !== '0';
  const starredOnly = starredParam === '1';
  const dueOnly = dueParam === '1';

  const [queue, setQueue] = useState<any[]>([]);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [gotItCount, setGotItCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [deckTitle, setDeckTitle] = useState('');
  const [deckColor, setDeckColor] = useState(colors.marigold);
  const [finished, setFinished] = useState(false);
  const [ready, setReady] = useState(false); // true = show intro, false = show cards
  const [started, setStarted] = useState(false); // user pressed Start
  
  // Track cards missed in this session to calculate quality score for SRS
  const [missedCardIds, setMissedCardIds] = useState<Set<string>>(new Set());
  const [cardUpdates, setCardUpdates] = useState<any[]>([]);
  const [newBadges, setNewBadges] = useState<BadgeId[]>([]);

  // --- Entrance motion, shared across the intro / study / done states ---
  const introAnim = useRef(new Animated.Value(0)).current;
  const studyAnim = useRef(new Animated.Value(0)).current;
  const doneAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      loadCards();
    }, [id])
  );

  useEffect(() => {
    if (!started) {
      introAnim.setValue(0);
      Animated.timing(introAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    } else if (!finished) {
      studyAnim.setValue(0);
      Animated.timing(studyAnim, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    }
  }, [started, ready]);

  useEffect(() => {
    if (finished) {
      doneAnim.setValue(0);
      Animated.spring(doneAnim, { toValue: 1, useNativeDriver: true, friction: 7, tension: 60 }).start();
    }
  }, [finished]);

  const loadCards = async () => {
    setReady(false);
    setStarted(false);
    const { data: deckData } = await supabase.from('decks').select('*').eq('id', id).single();
    if (deckData) {
      setDeckTitle(deckData.title);
      const c = deckData.color === 'sage' ? colors.sage
        : deckData.color === 'periwinkle' ? colors.periwinkle
          : deckData.color === 'purple' ? '#A855F7'
            : deckData.color === 'red' ? colors.error
              : deckData.color === 'blue' ? '#3B82F6'
                : colors.marigold;
      setDeckColor(c);
    }

    const { data } = await supabase.from('cards').select('*').eq('deck_id', id).order('created_at');
    if (data && data.length > 0) {
      let cardPool = data;
      if (starredOnly) {
        cardPool = cardPool.filter(c => c.starred);
      }
      if (dueOnly) {
        cardPool = cardPool.filter(c => c.next_review_date && new Date(c.next_review_date) <= new Date());
      }
      if (cardPool.length === 0) cardPool = data; // fallback if no matching cards

      const ordered = shouldShuffle ? [...cardPool].sort(() => Math.random() - 0.5) : cardPool;
      setQueue(ordered);
      setTotalCount(ordered.length);
      setReviewedCount(0);
      setGotItCount(0);
      setFinished(false);
      setMissedCardIds(new Set());
      setCardUpdates([]);
    }
    setReady(true); // cards loaded → show intro screen
  };

  const handleSwipeRight = async () => {
    const current = queue[0];
    const newQueue = queue.slice(1);
    const newReviewed = reviewedCount + 1;
    const newGotIt = gotItCount + 1;
    setReviewedCount(newReviewed);
    setGotItCount(newGotIt);
    setQueue(newQueue);

    // Calculate SRS fields
    const quality = missedCardIds.has(current.id) ? 1 : 4; // 1 = incorrect, 4 = good
    let { repetition = 0, interval = 0, ease_factor = 2.5 } = current;

    if (quality >= 3) {
      if (repetition === 0) interval = 1;
      else if (repetition === 1) interval = 6;
      else interval = Math.round(interval * ease_factor);
      repetition += 1;
    } else {
      repetition = 0;
      interval = 1;
    }

    ease_factor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (ease_factor < 1.3) ease_factor = 1.3;

    const next_review_date = new Date();
    next_review_date.setDate(next_review_date.getDate() + interval);

    const updateData = {
      id: current.id,
      repetition,
      interval,
      ease_factor,
      next_review_date: next_review_date.toISOString(),
    };
    
    setCardUpdates(prev => [...prev, updateData]);

    if (newQueue.length === 0) {
      setFinished(true);
      await supabase.from('decks').update({ reviewed: newGotIt, last_studied: new Date().toISOString() }).eq('id', id);
      
      // Batch update all updated cards (SRS)
      const allUpdates = [...cardUpdates, updateData];
      for (const update of allUpdates) {
        await supabase.from('cards').update({
          repetition: update.repetition,
          interval: update.interval,
          ease_factor: update.ease_factor,
          next_review_date: update.next_review_date
        }).eq('id', update.id);
      }

      // ── Gamification ──────────────────────────────────────────────────────
      const streak     = await updateStreak();
      const totalCards = await incrementCardsLearned(newGotIt);
      const totalSessions = await incrementSessions();
      const isPerfect  = newGotIt === totalCount;
      const earned     = await checkAndAwardBadges({ totalCards, totalSessions, streak, perfectSession: isPerfect });
      setNewBadges(earned);
    }
  };

  const handleSwipeLeft = () => {
    const current = queue[0];
    setMissedCardIds(prev => new Set(prev).add(current.id));
    // Move card to back of queue
    setQueue((prev) => [...prev.slice(1), prev[0]]);
  };

  const progressPct = totalCount > 0 ? (reviewedCount / totalCount) * 100 : 0;

  // --- Intro / Splash Screen (shown until user taps Start) ---
  if (!started) {
    return (
      <View style={[styles.introWhiteContainer, { paddingTop: insets.top, paddingBottom: insets.bottom + 16 }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

        {/* ── Owl mascot + text — no opacity animation so text is always visible ── */}
        <View style={styles.introCenter}>
          <Image
            source={require('../../../../assets/images/IskedyulThink.png')}
            style={styles.thinkImageWhite}
            resizeMode="contain"
          />
          <Text style={{ fontSize: 24, fontWeight: '700', color: '#132A4C', textAlign: 'center', marginTop: 16 }}>
            {ready ? deckTitle : 'Loading deck…'}
          </Text>
          <Text style={{ fontSize: 14, color: '#4A5A76', textAlign: 'center', marginTop: 6 }}>
            {ready
              ? `${totalCount} card${totalCount !== 1 ? 's' : ''} ready`
              : 'Fetching your flashcards…'}
          </Text>
        </View>

        {/* ── Back & Continue buttons — plain Pressable, always visible ── */}
        <View style={{ paddingHorizontal: spacing.lg, flexDirection: 'row', gap: spacing.sm }}>
          <Pressable
            onPress={() => router.back()}
            style={{
              flex: 1,
              borderRadius: 14,
              paddingVertical: 16,
              borderWidth: 1.5,
              borderColor: '#E4DDCB',
              backgroundColor: '#FFFFFF',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 8,
            }}
          >
            <Ionicons name="arrow-back" size={18} color="#132A4C" />
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#132A4C' }}>Back</Text>
          </Pressable>
          <Pressable
            onPress={() => ready && setStarted(true)}
            style={{
              flex: 1.5,
              borderRadius: 14,
              paddingVertical: 16,
              backgroundColor: ready ? deckColor : '#AAAAAA',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 8,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}>
              {ready ? 'Continue' : 'Loading…'}
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    );
  }

  if (finished) {
    const nope = totalCount - gotItCount;
    const pct = totalCount > 0 ? Math.round((gotItCount / totalCount) * 100) : 0;
    const emoji = pct === 100 ? '🏆' : pct >= 70 ? '🎉' : pct >= 40 ? '💪' : '📖';
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.paper} />
        <Animated.View
          style={[
            styles.doneScreen,
            {
              opacity: doneAnim,
              transform: [{ scale: doneAnim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }],
            },
          ]}
        >
          {/* Icon */}
          <View style={[styles.doneIcon, { backgroundColor: deckColor + '1F' }]}>
            <Text style={{ fontSize: 48 }}>{emoji}</Text>
          </View>

          <Text style={styles.doneTitle}>Session Complete!</Text>
          <Text style={styles.doneSub}>
            You studied all {totalCount} card{totalCount !== 1 ? 's' : ''}
          </Text>

          {/* Score breakdown — icon-in-circle to match the app's stat-card language */}
          <View style={styles.scoreRow}>
            <View style={styles.scoreChip}>
              <View style={[styles.scoreIconWrap, { backgroundColor: colors.sageSoft }]}>
                <Ionicons name="checkmark" size={18} color={colors.sage} />
              </View>
              <Text style={[styles.scoreNumber, { color: colors.sage }]}>{gotItCount}</Text>
              <Text style={styles.scoreLabel}>Got it</Text>
            </View>
            <View style={styles.scoreDivider} />
            <View style={styles.scoreChip}>
              <View style={[styles.scoreIconWrap, { backgroundColor: colors.errorSoft }]}>
                <Ionicons name="close" size={18} color={colors.error} />
              </View>
              <Text style={[styles.scoreNumber, { color: colors.error }]}>{nope}</Text>
              <Text style={styles.scoreLabel}>Nope</Text>
            </View>
            <View style={styles.scoreDivider} />
            <View style={styles.scoreChip}>
              <View style={[styles.scoreIconWrap, { backgroundColor: deckColor + '1F' }]}>
                <Ionicons name="stats-chart" size={18} color={deckColor} />
              </View>
              <Text style={[styles.scoreNumber, { color: deckColor }]}>{pct}%</Text>
              <Text style={styles.scoreLabel}>Score</Text>
            </View>
          </View>

          <View style={styles.doneActions}>
            <PressScale style={[styles.doneBtn, { backgroundColor: colors.paperRaised, borderColor: colors.border }]} onPress={loadCards}>
              <Ionicons name="refresh" size={16} color={colors.ink} />
              <Text style={[styles.doneBtnText, { color: colors.ink }]}>Study Again</Text>
            </PressScale>
            <PressScale style={[styles.doneBtn, { backgroundColor: deckColor, borderColor: deckColor }]} onPress={() => router.back()}>
              <Ionicons name="checkmark" size={16} color={colors.paper} />
              <Text style={[styles.doneBtnText, { color: colors.paper }]}>Done</Text>
            </PressScale>
          </View>

          {/* Newly earned badges */}
          {newBadges.length > 0 && (
            <View style={styles.newBadgesWrap}>
              <Text style={styles.newBadgesTitle}>🎉 Badges Unlocked!</Text>
              {newBadges.map(id => {
                const b = ALL_BADGES.find(x => x.id === id)!;
                return (
                  <View key={id} style={styles.newBadgeChip}>
                    <Text style={{ fontSize: 22 }}>{b.emoji}</Text>
                    <View>
                      <Text style={styles.newBadgeChipTitle}>{b.title}</Text>
                      <Text style={styles.newBadgeChipDesc}>{b.desc}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </Animated.View>
      </View>
    );
  }

  const currentCard = queue[0];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.paper} />

      <Animated.View
        style={{
          opacity: studyAnim,
          transform: [{ translateY: studyAnim.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }],
        }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="close" size={24} color={colors.ink} />
          </Pressable>
          <View style={{ flex: 1, marginHorizontal: spacing.md }}>
            <View style={styles.headerTitleRow}>
              <View style={[styles.headerDot, { backgroundColor: deckColor }]} />
              <Text style={styles.headerTitle} numberOfLines={1}>{deckTitle}</Text>
            </View>
            <Text style={styles.headerSub}>{reviewedCount} / {totalCount} known</Text>
          </View>
          <Text style={[styles.headerPct, { color: deckColor }]}>{Math.round(progressPct)}%</Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <Animated.View
            style={[styles.progressFill, { width: `${progressPct}%`, backgroundColor: deckColor }]}
          />
        </View>
      </Animated.View>

      {/* Card area */}
      <View style={styles.cardArea}>
        {/* Layered stack peek — two offset cards behind the active one, so it
            reads as a deck rather than a single blurred rectangle. */}
        {queue.length > 2 && (
          <View style={[styles.cardPeekOuter, { backgroundColor: deckColor + '14' }]} />
        )}
        {queue.length > 1 && (
          <View style={[styles.cardPeekInner, { backgroundColor: deckColor + '28' }]} />
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
        <View style={[styles.hintChip, { backgroundColor: colors.errorSoft }]}>
          <Ionicons name="arrow-back" size={14} color={colors.error} />
          <Text style={[styles.hintText, { color: colors.error }]}>Nope</Text>
        </View>
        <Text style={styles.hintCenter}>{queue.length} left</Text>
        <View style={[styles.hintChip, { backgroundColor: colors.sageSoft }]}>
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

  // Intro — white full-screen layout
  introWhiteContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'space-between',
  },
  introCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  thinkImageWhite: {
    width: 180,
    height: 180,
  },
  introWhiteTitle: {
    ...type.h1,
    color: colors.ink,
    textAlign: 'center',
    fontSize: 26,
  },
  introWhiteSub: {
    ...type.body,
    color: colors.inkSoft,
    textAlign: 'center',
    fontSize: 14,
  },
  introNextBtn: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: 16,
    marginBottom: spacing.sm,
    ...shadows.soft,
  },
  introBackBtn: {
    backgroundColor: colors.paperRaised,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  introNextBtnText: { ...type.label, fontSize: 16, color: colors.paper },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerDot: { width: 7, height: 7, borderRadius: 3.5 },
  headerTitle: { ...type.label, fontSize: 15, color: colors.ink, flexShrink: 1 },
  headerSub: { ...type.caption, color: colors.inkSoft, marginTop: 2 },
  headerPct: { ...type.label, fontSize: 14, fontWeight: '700' },

  progressTrack: {
    height: 4, backgroundColor: colors.border,
    marginHorizontal: spacing.lg, borderRadius: 2, overflow: 'hidden',
  },
  progressFill: { height: 4, borderRadius: 2 },

  cardArea: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
  },
  cardPeekOuter: {
    position: 'absolute',
    width: CARD_W - 36,
    height: CARD_H - 36,
    borderRadius: radius.xl,
    bottom: -18,
    transform: [{ scale: 0.94 }],
  },
  cardPeekInner: {
    position: 'absolute',
    width: CARD_W - 18,
    height: CARD_H - 18,
    borderRadius: radius.xl,
    bottom: -9,
    transform: [{ scale: 0.97 }],
  },

  // Shared card face styles
  cardFront: {
    backgroundColor: colors.paperRaised,
    borderWidth: 1.5,
  },
  cardBack: {
    // background set dynamically from deckColor
  },
  sideLabelPill: {
    position: 'absolute',
    top: spacing.lg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  sideLabel: {
    ...type.overline,
    fontSize: 10.5,
  },
  sideLabelPillLight: {
    position: 'absolute',
    top: spacing.lg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  sideLabelLight: {
    ...type.overline,
    fontSize: 10.5,
    color: 'rgba(255,255,255,0.85)',
  },
  cardTerm: {
    ...type.h1, fontSize: 27, color: colors.ink,
    textAlign: 'center', lineHeight: 35, fontWeight: '700',
  },
  cardDefinition: {
    ...type.body, fontSize: 18, color: colors.paper,
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
    backgroundColor: colors.errorSoft, borderColor: colors.error,
    transform: [{ rotate: '15deg' }],
  },
  swipeLabelText: { ...type.label, fontSize: 13 },

  hintRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xl, paddingTop: spacing.md,
  },
  hintChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: radius.pill,
  },
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
  // Score breakdown
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paperRaised,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    width: '100%',
    ...shadows.soft,
  },
  scoreChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  scoreIconWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  scoreDivider: {
    width: 1,
    height: 44,
    backgroundColor: colors.border,
  },
  scoreNumber: { ...type.h1, fontSize: 22 },
  scoreLabel: { ...type.caption, fontSize: 11, color: colors.inkSoft },

  doneActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, width: '100%' },
  doneBtn: {
    flex: 1, borderRadius: radius.md, height: 52,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, ...shadows.soft,
  },
  doneBtnText: { ...type.label, fontSize: 14 },
  addCardBtn: {
    borderRadius: radius.md, paddingVertical: 14, ...shadows.soft, minHeight: 48,
  },
  addCardText: { ...type.label, color: colors.paper, fontSize: 15 },
  newBadgesWrap: {
    width: '100%',
    backgroundColor: colors.paperRaised,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.soft,
  },
  newBadgesTitle: {
    ...type.label,
    color: colors.ink,
    textAlign: 'center' as const,
    marginBottom: 2,
  },
  newBadgeChip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.sm,
    backgroundColor: colors.marigoldSoft,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  newBadgeChipTitle: { ...type.label, color: colors.ink, fontSize: 13 },
  newBadgeChipDesc: { ...type.caption, color: colors.inkSoft, fontSize: 11 },
});

const markdownFrontStyles = {
  body: { ...type.h1, fontSize: 24, color: colors.ink, textAlign: 'center' as const, lineHeight: 32, fontWeight: '700' as const },
  code_inline: { backgroundColor: colors.border, padding: 4, borderRadius: 4, fontFamily: 'monospace' },
  code_block: { backgroundColor: colors.border, padding: 8, borderRadius: 8, fontFamily: 'monospace' },
  strong: { fontWeight: 'bold' as const },
  em: { fontStyle: 'italic' as const },
  link: { color: colors.periwinkle },
};

const markdownBackStyles = {
  body: { ...type.body, fontSize: 18, color: colors.paper, textAlign: 'center' as const, lineHeight: 28 },
  code_inline: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 4, borderRadius: 4, fontFamily: 'monospace', color: colors.paper },
  code_block: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 8, fontFamily: 'monospace', color: colors.paper },
  strong: { fontWeight: 'bold' as const, color: colors.paper },
  em: { fontStyle: 'italic' as const, color: colors.paper },
  link: { color: colors.marigold, textDecorationLine: 'underline' as const },
};