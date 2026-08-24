/**
 * Gamification utilities
 * - Streak tracking (local, via AsyncStorage)
 * - Badge award logic
 * - Streak reminder notifications
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

// ─── Keys ────────────────────────────────────────────────────────────────────
const KEY_STREAK        = 'gam_streak_count';
const KEY_LAST_STUDIED  = 'gam_last_studied_date'; // YYYY-MM-DD
const KEY_BADGES        = 'gam_earned_badges';
const KEY_TOTAL_CARDS   = 'gam_total_cards_learned';
const KEY_TOTAL_SESSIONS= 'gam_total_sessions';
const KEY_XP            = 'gam_xp';
const KEY_LEVEL         = 'gam_level';

// ─── Types ────────────────────────────────────────────────────────────────────
export type BadgeId =
  | 'first_card'
  | 'ten_cards'
  | 'fifty_cards'
  | 'hundred_cards'
  | 'first_deck'
  | 'streak_3'
  | 'streak_7'
  | 'streak_30'
  | 'perfect_session';

export const ALL_BADGES: { id: BadgeId; emoji: string; title: string; desc: string }[] = [
  { id: 'first_card',      emoji: '🃏', title: 'First Card',        desc: 'Review your first flashcard'          },
  { id: 'ten_cards',       emoji: '📚', title: 'Bookworm',          desc: 'Review 10 cards total'                },
  { id: 'fifty_cards',     emoji: '🏅', title: 'Scholar',           desc: 'Review 50 cards total'                },
  { id: 'hundred_cards',   emoji: '💎', title: 'Centurion',         desc: 'Review 100 cards total'               },
  { id: 'first_deck',      emoji: '🎴', title: 'Deck Cleared',      desc: 'Complete your first study session'    },
  { id: 'streak_3',        emoji: '🔥', title: '3-Day Streak',      desc: 'Study 3 days in a row'                },
  { id: 'streak_7',        emoji: '⚡', title: 'On Fire',           desc: 'Study 7 days in a row'                },
  { id: 'streak_30',       emoji: '🏆', title: 'Unstoppable',       desc: 'Study 30 days in a row'               },
  { id: 'perfect_session', emoji: '✨', title: 'Perfect Session',   desc: 'Get 100% on a study session'         },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function todayStr() {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

// ─── Streak ───────────────────────────────────────────────────────────────────
/**
 * Call this after every successful study session.
 * Returns the updated streak count.
 */
export async function updateStreak(): Promise<number> {
  const today = todayStr();
  const yesterday = yesterdayStr();

  const [lastStudied, streakStr] = await Promise.all([
    AsyncStorage.getItem(KEY_LAST_STUDIED),
    AsyncStorage.getItem(KEY_STREAK),
  ]);

  let streak = parseInt(streakStr || '0', 10);

  if (lastStudied === today) {
    // Already studied today, no change
    return streak;
  } else if (lastStudied === yesterday) {
    // Consecutive day → increment
    streak += 1;
  } else {
    // Streak broken or first ever study
    streak = 1;
  }

  await AsyncStorage.multiSet([
    [KEY_LAST_STUDIED, today],
    [KEY_STREAK, streak.toString()],
  ]);

  return streak;
}

export async function getStreak(): Promise<number> {
  const [lastStudied, streakStr] = await Promise.all([
    AsyncStorage.getItem(KEY_LAST_STUDIED),
    AsyncStorage.getItem(KEY_STREAK),
  ]);
  const streak = parseInt(streakStr || '0', 10);
  // If the last study was before yesterday, streak is broken
  if (lastStudied && lastStudied < yesterdayStr()) return 0;
  return streak;
}

// ─── Card / session counters ─────────────────────────────────────────────────
export async function incrementCardsLearned(count: number): Promise<number> {
  const existing = await AsyncStorage.getItem(KEY_TOTAL_CARDS);
  const total = parseInt(existing || '0', 10) + count;
  await AsyncStorage.setItem(KEY_TOTAL_CARDS, total.toString());
  return total;
}

export async function incrementSessions(): Promise<number> {
  const existing = await AsyncStorage.getItem(KEY_TOTAL_SESSIONS);
  const total = parseInt(existing || '0', 10) + 1;
  await AsyncStorage.setItem(KEY_TOTAL_SESSIONS, total.toString());
  return total;
}

export async function getStats(): Promise<{ streak: number; totalCards: number; totalSessions: number; xp: number; level: number }> {
  const [streakStr, cardsStr, sessionsStr, xpStr, levelStr] = await Promise.all([
    AsyncStorage.getItem(KEY_STREAK),
    AsyncStorage.getItem(KEY_TOTAL_CARDS),
    AsyncStorage.getItem(KEY_TOTAL_SESSIONS),
    AsyncStorage.getItem(KEY_XP),
    AsyncStorage.getItem(KEY_LEVEL),
  ]);
  const lastStudied = await AsyncStorage.getItem(KEY_LAST_STUDIED);
  const rawStreak = parseInt(streakStr || '0', 10);
  const streak = (lastStudied && lastStudied < yesterdayStr()) ? 0 : rawStreak;
  return {
    streak,
    totalCards:    parseInt(cardsStr    || '0', 10),
    totalSessions: parseInt(sessionsStr || '0', 10),
    xp:            parseInt(xpStr       || '0', 10),
    level:         parseInt(levelStr    || '1', 10),
  };
}

export async function addXP(points: number): Promise<{ xp: number; level: number; leveledUp: boolean }> {
  const stats = await getStats();
  let newXp = stats.xp + points;
  let newLevel = stats.level;
  let leveledUp = false;

  const xpNeeded = newLevel * 100; // e.g. 100 XP to reach level 2, 200 for level 3
  if (newXp >= xpNeeded) {
    newLevel += 1;
    newXp -= xpNeeded; // carry over remaining XP
    leveledUp = true;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Level Up! 🎉`,
        body: `You are now Level ${newLevel}!`,
        sound: true,
      },
      trigger: null,
    });
  }

  await AsyncStorage.multiSet([
    [KEY_XP, newXp.toString()],
    [KEY_LEVEL, newLevel.toString()],
  ]);

  return { xp: newXp, level: newLevel, leveledUp };
}

// ─── Badges ───────────────────────────────────────────────────────────────────
export async function getEarnedBadges(): Promise<BadgeId[]> {
  const raw = await AsyncStorage.getItem(KEY_BADGES);
  return raw ? JSON.parse(raw) : [];
}

async function awardBadge(id: BadgeId, earned: BadgeId[]): Promise<BadgeId[]> {
  if (earned.includes(id)) return earned;
  const updated = [...earned, id];
  await AsyncStorage.setItem(KEY_BADGES, JSON.stringify(updated));

  // Fire a local notification for the new badge
  const badge = ALL_BADGES.find(b => b.id === id);
  if (badge) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${badge.emoji} Badge Unlocked: ${badge.title}`,
        body: badge.desc,
        sound: true,
      },
      trigger: null, // immediate
    });
  }
  return updated;
}

/**
 * Check and award any newly-earned badges.
 * Call after every study session.
 * Returns array of newly-earned badge IDs.
 */
export async function checkAndAwardBadges({
  totalCards,
  totalSessions,
  streak,
  perfectSession,
}: {
  totalCards: number;
  totalSessions: number;
  streak: number;
  perfectSession: boolean;
}): Promise<BadgeId[]> {
  let earned = await getEarnedBadges();
  const newlyEarned: BadgeId[] = [];

  const maybeAward = async (id: BadgeId) => {
    if (!earned.includes(id)) {
      earned = await awardBadge(id, earned);
      newlyEarned.push(id);
    }
  };

  if (totalCards >= 1)   await maybeAward('first_card');
  if (totalCards >= 10)  await maybeAward('ten_cards');
  if (totalCards >= 50)  await maybeAward('fifty_cards');
  if (totalCards >= 100) await maybeAward('hundred_cards');
  if (totalSessions >= 1) await maybeAward('first_deck');
  if (streak >= 3)  await maybeAward('streak_3');
  if (streak >= 7)  await maybeAward('streak_7');
  if (streak >= 30) await maybeAward('streak_30');
  if (perfectSession) await maybeAward('perfect_session');

  return newlyEarned;
}

// ─── Streak reminder notification ────────────────────────────────────────────
/**
 * Schedule a daily streak-reminder notification at a given hour (default 8 PM).
 * Call this once on app startup.
 */
export async function scheduleStreakReminder(hour = 20) {
  // Cancel any existing streak reminder
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if ((n.content.data as any)?.type === 'streak_reminder') {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔥 Keep your streak alive!',
      body: "You haven't studied today. Open Iskedyul and review some flashcards!",
      sound: true,
      data: { type: 'streak_reminder' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute: 0,
    },
  });
}
