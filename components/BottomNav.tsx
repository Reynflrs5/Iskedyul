import React from 'react';
import { View, Pressable, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadows, spacing } from '../app/styles/welcome.styles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BottomNav() {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 16) }]}>
      <View style={styles.navBar}>
        <Pressable style={styles.navItem}>
          <Ionicons name="home" size={26} color={colors.ink} />
        </Pressable>
        
        <Pressable style={styles.navItem}>
          <Ionicons name="calendar-outline" size={26} color={colors.inkSoft} />
        </Pressable>
        
        <Pressable style={styles.fab}>
          <Ionicons name="add" size={28} color={colors.paper} />
        </Pressable>
        
        <Pressable style={styles.navItem}>
          <Ionicons name="layers-outline" size={26} color={colors.inkSoft} />
        </Pressable>
        
        <Pressable style={styles.navItem}>
          <Ionicons name="person-outline" size={26} color={colors.inkSoft} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.paperRaised,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    ...shadows.cta, // Add a nice shadow dropping downwards and upwards
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 16,
    shadowOpacity: 0.06,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  navItem: {
    padding: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.marigold,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28, // Pops out of the top of the bar slightly
    borderWidth: 4,
    borderColor: colors.paperRaised,
  }
});
