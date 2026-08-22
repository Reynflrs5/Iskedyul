/**
 * Progress & Gamification Screen
 * - Daily streak display
 * - Lifetime stats (cards learned, sessions, retention %)
 * - All badges (earned / locked)
 */
import React, { useCallback, useRef, useState } from 'react';
import {
  View, Text, Pressable, ScrollView, StatusBar,
  StyleSheet, Animated, Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '../../../utils/supabase';
import { getStats, getEarnedBadges, ALL_BADGES, type BadgeId } from '../../../utils/gamification';
import { colors, radius, spacing, type, shadows } from '../../styles/welcome.styles';

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [streak, setStreak]         = useState(0);
  const [totalCards, setTotalCards]   = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [earnedBadges, setEarnedBadges]   = useState<BadgeId[]>([]);

  // Supabase-based stats
  const [totalDecks, setTotalDecks]         = useState(0);
  const [totalDeckCards, setTotalDeckCards] = useState(0);
  const [avgMastery, setAvgMastery]         = useState(0);

  useFocusEffect(
    useCallback(() => {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }).start();

      async function load() {
        const stats = await getStats();
        setStreak(stats.streak);
        setTotalCards(stats.totalCards);
        setTotalSessions(stats.totalSessions);

        const badges = await getEarnedBadges();
        setEarnedBadges(badges);

        const { data: decks } = await supabase.from('decks').select('total, reviewed');
        if (decks) {
          setTotalDecks(decks.length);
          const tc = decks.reduce((s, d) => s + (d.total || 0), 0);
          const tr = decks.reduce((s, d) => s + (d.reviewed || 0), 0);
          setTotalDeckCards(tc);
          setAvgMastery(tc > 0 ? Math.round((tr / tc) * 100) : 0);
        }
      }
      load();
    }, [])
  );

  const streakEmoji = streak === 0 ? '😴' : streak >= 30 ? '🏆' : streak >= 7 ? '⚡' : streak >= 3 ? '🔥' : '✨';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.paper} />

      {/* Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }] }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>Progress & Badges</Text>
        <View style={{ width: 36 }} />
      </Animated.View>

      <Animated.ScrollView
        style={{ flex: 1, opacity: fadeAnim }}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Streak Hero ── */}
        <View style={styles.streakHero}>
          <Text style={styles.streakEmoji}>{streakEmoji}</Text>
          <Text style={styles.streakCount}>{streak}</Text>
          <Text style={styles.streakLabel}>Day Streak</Text>
          {streak === 0 && (
            <Text style={styles.streakSub}>Study today to start a new streak!</Text>
          )}
          {streak > 0 && (
            <Text style={styles.streakSub}>You've studied {streak} day{streak !== 1 ? 's' : ''} in a row. Keep it up!</Text>
          )}
        </View>

        {/* ── Stats Grid ── */}
        <Text style={styles.sectionTitle}>LIFETIME STATS</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.marigoldSoft }]}>
            <Ionicons name="checkmark-circle" size={22} color={colors.marigold} />
            <Text style={[styles.statNumber, { color: colors.marigold }]}>{totalCards}</Text>
            <Text style={styles.statLabel}>Cards Reviewed</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.periwinkleSoft }]}>
            <Ionicons name="book" size={22} color={colors.periwinkle} />
            <Text style={[styles.statNumber, { color: colors.periwinkle }]}>{totalSessions}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.sageSoft }]}>
            <Ionicons name="trending-up" size={22} color={colors.sage} />
            <Text style={[styles.statNumber, { color: colors.sage }]}>{avgMastery}%</Text>
            <Text style={styles.statLabel}>Avg Mastery</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#F3E8FF' }]}>
            <Ionicons name="layers" size={22} color="#A855F7" />
            <Text style={[styles.statNumber, { color: '#A855F7' }]}>{totalDecks}</Text>
            <Text style={styles.statLabel}>Total Decks</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FEE2E2' }]}>
            <Ionicons name="flash" size={22} color="#EF4444" />
            <Text style={[styles.statNumber, { color: '#EF4444' }]}>{streak}</Text>
            <Text style={styles.statLabel}>Current Streak</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.marigoldSoft }]}>
            <Ionicons name="ribbon" size={22} color={colors.marigold} />
            <Text style={[styles.statNumber, { color: colors.marigold }]}>{earnedBadges.length}</Text>
            <Text style={styles.statLabel}>Badges</Text>
          </View>
        </View>

        {/* ── Badges ── */}
        <Text style={styles.sectionTitle}>BADGES</Text>
        <View style={styles.badgesGrid}>
          {ALL_BADGES.map(badge => {
            const earned = earnedBadges.includes(badge.id);
            return (
              <View key={badge.id} style={[styles.badgeCard, !earned && styles.badgeCardLocked]}>
                <Text style={[styles.badgeEmoji, !earned && { opacity: 0.25 }]}>{badge.emoji}</Text>
                <Text style={[styles.badgeTitle, !earned && styles.badgeTitleLocked]}>{badge.title}</Text>
                <Text style={styles.badgeDesc}>{badge.desc}</Text>
                {earned && (
                  <View style={styles.earnedPill}>
                    <Text style={styles.earnedPillText}>Earned</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </Animated.ScrollView>
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
  backBtn: {
    width: 36, height: 36, borderRadius: radius.pill,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.paperRaised, borderWidth: 1, borderColor: colors.border,
  },
  headerTitle: { ...type.h2, color: colors.ink },
  content: { padding: spacing.lg, gap: spacing.lg },

  // Streak hero
  streakHero: {
    alignItems: 'center',
    backgroundColor: colors.paperRaised,
    borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    gap: 4,
    ...shadows.soft,
  },
  streakEmoji: { fontSize: 52, marginBottom: 4 },
  streakCount: { ...type.h1, fontSize: 52, color: colors.ink, lineHeight: 58 },
  streakLabel: { ...type.label, color: colors.inkSoft, fontSize: 16 },
  streakSub: { ...type.caption, color: colors.inkFaint, textAlign: 'center', marginTop: 4 },

  sectionTitle: {
    ...type.overline,
    color: colors.inkSoft,
    marginBottom: -spacing.xs,
  },

  // Stats grid (2 columns)
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    minWidth: '28%',
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statNumber: { ...type.h1, fontSize: 26, lineHeight: 30 },
  statLabel: { ...type.caption, color: colors.inkSoft, textAlign: 'center' },

  // Badges grid (2 columns)
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  badgeCard: {
    flex: 1,
    minWidth: '44%',
    backgroundColor: colors.paperRaised,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
    ...shadows.soft,
  },
  badgeCardLocked: {
    backgroundColor: colors.paper,
    borderColor: colors.border,
    opacity: 0.6,
  },
  badgeEmoji: { fontSize: 36, marginBottom: 4 },
  badgeTitle: { ...type.label, color: colors.ink, textAlign: 'center', fontSize: 13 },
  badgeTitleLocked: { color: colors.inkFaint },
  badgeDesc: { ...type.caption, color: colors.inkSoft, textAlign: 'center', fontSize: 10 },
  earnedPill: {
    backgroundColor: colors.sageSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 4,
  },
  earnedPillText: { ...type.caption, color: colors.sage, fontSize: 10, fontWeight: '700' },
});
