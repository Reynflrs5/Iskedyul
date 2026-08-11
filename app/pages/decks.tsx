import { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, Pressable, ScrollView, StatusBar,
  Animated, Easing, useWindowDimensions, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { styles, colors } from '../styles/decks.styles';
import { styles as welcomeStyles } from '../styles/welcome.styles';
import BottomNav from '../../components/BottomNav';
import { supabase } from '../../utils/supabase';

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
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }).start();

      refreshDecks();
    }, [fadeAnim])
  );

  const refreshDecks = async () => {
    const { data } = await supabase.from('decks').select('*').order('created_at', { ascending: false });
    if (data) setDecks(data);
  };

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
            <Pressable style={styles.addButton} onPress={() => router.push('/pages/decks/new')}>
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
                    </View>

                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: c.icon }]} />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </Animated.View>
      </ScrollView>

      <BottomNav />
    </View>
  );
}
