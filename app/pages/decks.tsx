import { useEffect, useRef, useState } from 'react';
import {
  View, Text, Pressable, ScrollView, StatusBar,
  Animated, Easing, useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { styles, colors } from '../styles/decks.styles';
import { styles as welcomeStyles } from '../styles/welcome.styles';
import BottomNav from '../../components/BottomNav';
import { supabase } from '../../utils/supabase';
import AddDeckSheet from '../../components/AddDeckSheet';

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

  const [decks, setDecks] = useState<any[]>([]);
  const [showAddDeck, setShowAddDeck] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start();

    // Fetch decks from Supabase (table: decks)
    supabase.from('decks').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setDecks(data); });
  }, []);

  const refreshDecks = async () => {
    const { data } = await supabase.from('decks').select('*').order('created_at', { ascending: false });
    if (data) setDecks(data);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.paper} />

      <View style={welcomeStyles.backgroundLayer} pointerEvents="none">
        <View style={[welcomeStyles.blob, {
          width: width * 0.7, height: width * 0.7,
          borderRadius: width * 0.35,
          backgroundColor: colors.sageSoft,
          opacity: 0.3, top: -width * 0.4, right: -width * 0.2,
        }]} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: hPad,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.pageTitle}>Flashcard Decks</Text>
              <Text style={styles.subtitle}>
                {decks.length > 0 ? `${decks.length} deck${decks.length > 1 ? 's' : ''} ready to review` : 'Start learning with flashcards'}
              </Text>
            </View>
            <Pressable style={styles.addButton} onPress={() => setShowAddDeck(true)}>
              <Ionicons name="add" size={20} color={colors.paper} />
            </Pressable>
          </View>

          {/* Deck grid */}
          {decks.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="layers-outline" size={36} color={colors.inkFaint} />
              <Text style={styles.emptyText}>No decks yet.{'\n'}Tap + to create your first flashcard deck!</Text>
            </View>
          ) : (
            <View style={styles.deckGrid}>
              {decks.map((deck, i) => {
                const palette = DECK_COLORS[i % DECK_COLORS.length];
                const progress = deck.total > 0 ? deck.reviewed / deck.total : 0;
                return (
                  <Pressable key={deck.id} style={styles.deckCard}>
                    <View style={[styles.deckIconWrap, { backgroundColor: palette.bg }]}>
                      <Ionicons name="layers" size={20} color={palette.icon} />
                    </View>
                    <Text style={styles.deckTitle} numberOfLines={2}>{deck.title}</Text>
                    <Text style={styles.deckCount}>{deck.total ?? 0} cards</Text>
                    <View style={styles.deckProgressBar}>
                      <View style={[styles.deckProgressFill, { width: `${progress * 100}%`, backgroundColor: palette.icon }]} />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </Animated.View>
      </ScrollView>

      <BottomNav />
      <AddDeckSheet
        visible={showAddDeck}
        onClose={() => setShowAddDeck(false)}
        onAdded={refreshDecks}
      />
    </View>
  );
}
