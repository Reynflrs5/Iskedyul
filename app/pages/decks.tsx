import { useCallback, useRef, useState } from 'react';
import {
  View, Text, Pressable, ScrollView, StatusBar,
  Animated, Easing, useWindowDimensions, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { styles, colors } from '../styles/decks.styles';
import BottomNav from '../../components/BottomNav';
import { supabase } from '../../utils/supabase';
import { getStreak, scheduleStreakReminder } from '../../utils/gamification';

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

const DECK_COLORS = [
  { bg: colors.marigoldSoft, icon: colors.marigold },
  { bg: colors.periwinkleSoft, bg2: colors.periwinkle, icon: colors.periwinkle },
  { bg: colors.sageSoft, icon: colors.sage },
  { bg: '#F3E8FF', icon: '#A855F7' },
  { bg: '#FEE2E2', icon: '#EF4444' },
];

export default function DecksScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const hPad = clamp(width * 0.06, 18, 32);
  const maxContentWidth = 560;

  const [decks, setDecks] = useState<any[]>([]);
  const [streak, setStreak] = useState(0);

  const heroAnim = useRef(new Animated.Value(0)).current;
  const sheetAnim = useRef(new Animated.Value(0)).current;

  const refreshDecks = async () => {
    const { data } = await supabase.from('decks').select('*').order('created_at', { ascending: false });
    if (data) setDecks(data);
  };

  useFocusEffect(
    useCallback(() => {
      heroAnim.setValue(0);
      sheetAnim.setValue(0);
      Animated.stagger(100, [
        Animated.timing(heroAnim, { toValue: 1, duration: 440, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(sheetAnim, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();

      refreshDecks();
      getStreak().then(setStreak);
      scheduleStreakReminder(20); // remind at 8 PM if they haven't studied
    }, [heroAnim, sheetAnim])
  );

  const confirmDeleteDeck = (id: string, title: string) => {
    Alert.alert('Delete Deck', `Are you sure you want to delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDecks((prev) => prev.filter((d) => d.id !== id));
          await supabase.from('decks').delete().eq('id', id);
        },
      },
    ]);
  };

  const totalTerms = decks.reduce((sum, d) => sum + (d.total || 0), 0);
  const totalReviewed = decks.reduce((sum, d) => sum + (d.reviewed || 0), 0);
  const overallProgress = totalTerms > 0 ? Math.round((totalReviewed / totalTerms) * 100) : 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.ink} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
      >
        {/* --- HERO: title, add button, summary chips --- */}
        <Animated.View
          style={[
            styles.hero,
            {
              paddingTop: insets.top + 16,
              paddingHorizontal: hPad,
              opacity: heroAnim,
              transform: [{ translateY: heroAnim.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) }],
            },
          ]}
        >
          <View
            style={[
              styles.heroAccentRing,
              { width: width * 0.85, height: width * 0.85, top: -width * 0.5, right: -width * 0.4 },
            ]}
          />

          <View style={{ width: '100%', maxWidth: maxContentWidth, alignSelf: 'center' }}>
            <View style={styles.heroTopRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.pageTitle}>Flashcard Decks</Text>
                <Text style={styles.subtitle}>
                  {decks.length > 0
                    ? `${decks.length} deck${decks.length > 1 ? 's' : ''} ready to review`
                    : 'Start learning with flashcards'}
                </Text>
              </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable
                  style={[styles.addButton, { backgroundColor: 'rgba(232,162,61,0.15)' }]}
                  onPress={() => router.push('/pages/decks/progress' as any)}
                >
                  <Text style={{ fontSize: 16 }}>{streak > 0 ? '🔥' : '🏅'}</Text>
                  {streak > 0 && <Text style={{ fontSize: 11, fontWeight: '700', color: colors.marigold, marginLeft: -2 }}>{streak}</Text>}
                </Pressable>
                <Pressable style={styles.addButton} onPress={() => router.push('/pages/decks/import' as any)}>
                  <Ionicons name="download-outline" size={20} color={colors.marigoldInk} />
                </Pressable>
                <Pressable style={styles.addButton} onPress={() => router.push('/pages/decks/new')}>
                  <Ionicons name="add" size={20} color={colors.marigoldInk} />
                </Pressable>
              </View>
            </View>

            {decks.length > 0 && (
              <View style={styles.heroStatsRow}>
                <View style={styles.heroStatChip}>
                  <View style={[styles.heroStatIconWrap, { backgroundColor: 'rgba(232,162,61,0.18)' }]}>
                    <Ionicons name="layers-outline" size={14} color={colors.marigold} />
                  </View>
                  <View>
                    <Text style={styles.heroStatNumber}>{totalTerms}</Text>
                    <Text style={styles.heroStatLabel}>Total terms</Text>
                  </View>
                </View>
                <View style={styles.heroStatChip}>
                  <View style={[styles.heroStatIconWrap, { backgroundColor: 'rgba(63,143,134,0.2)' }]}>
                    <Ionicons name="trending-up-outline" size={14} color={colors.sage} />
                  </View>
                  <View>
                    <Text style={styles.heroStatNumber}>{overallProgress}%</Text>
                    <Text style={styles.heroStatLabel}>Reviewed</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </Animated.View>

        {/* --- CONTENT SHEET: deck grid --- */}
        <Animated.View
          style={[
            styles.contentSheet,
            {
              opacity: sheetAnim,
              transform: [{ translateY: sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
              paddingHorizontal: hPad,
              paddingBottom: insets.bottom + 100,
            },
          ]}
        >
          <View style={{ width: '100%', maxWidth: maxContentWidth, alignSelf: 'center' }}>
            <Text style={styles.sheetHeaderTitle}>Your Decks</Text>

            {decks.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="layers-outline" size={36} color={colors.inkFaint} />
                <Text style={styles.emptyText}>No decks yet.{'\n'}Tap + to create your first flashcard deck!</Text>
              </View>
            ) : (
              <View style={styles.deckGrid}>
                {decks.map((deck, i) => {
                  const c = DECK_COLORS[i % DECK_COLORS.length];
                  const progress = deck.total > 0 ? (deck.reviewed / deck.total) * 100 : 0;
                  return (
                    <Pressable
                      key={deck.id}
                      style={styles.deckCard}
                      onPress={() => router.push(`/pages/decks/${deck.id}` as any)}
                      onLongPress={() => confirmDeleteDeck(deck.id, deck.title)}
                      delayLongPress={400}
                    >
                      <View style={[styles.deckIconWrap, { backgroundColor: c.bg }]}>
                        <Ionicons name="layers" size={24} color={c.icon} />
                      </View>
                      <Text style={styles.deckTitle}>{deck.title}</Text>

                      <View style={styles.deckMetaRow}>
                        <Text style={styles.deckTermCount}>{deck.total} terms</Text>
                        {deck.last_studied && (
                          <Text style={[styles.deckTermCount, { marginLeft: 8 }]}>
                            • {(() => {
                              const diff = Date.now() - new Date(deck.last_studied).getTime();
                              const mins = Math.floor(diff / 60000);
                              if (mins < 1) return 'Just now';
                              if (mins < 60) return `${mins}m ago`;
                              const hours = Math.floor(mins / 60);
                              if (hours < 24) return `${hours}h ago`;
                              const days = Math.floor(hours / 24);
                              return `${days}d ago`;
                            })()}
                          </Text>
                        )}
                      </View>

                      <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: c.icon }]} />
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        </Animated.View>
      </ScrollView>

      <BottomNav />
    </View>
  );
}