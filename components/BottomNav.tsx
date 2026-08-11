import React, { useRef, useState } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { colors, type, radius, shadows, spacing } from '../app/styles/welcome.styles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ActionMenuSheet from './ActionMenuSheet';

type NavItem = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  route: string;
};

// Route match is prefix-based ('/(tabs)/schedule' also matches
// '/(tabs)/schedule/123'), so a detail screen still highlights its tab.
const NAV_ITEMS: NavItem[] = [
  { key: 'home', label: 'Home', icon: 'home-outline', activeIcon: 'home', route: '/pages/dashboard' },
  { key: 'schedule', label: 'Schedule', icon: 'calendar-outline', activeIcon: 'calendar', route: '/pages/schedule' },
  { key: 'decks', label: 'Decks', icon: 'layers-outline', activeIcon: 'layers', route: '/pages/decks' },
  { key: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person', route: '/pages/profile' },
];

// One nav item — its own press-scale animation and active-state color, so
// each icon+label pair behaves independently.
function NavButton({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.88, useNativeDriver: true, speed: 50 }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 4 }).start();

  const tint = isActive ? colors.ink : colors.inkFaint;

  return (
    <Pressable
      style={styles.navItem}
      onPress={() => router.push(item.route as any)}
      onPressIn={pressIn}
      onPressOut={pressOut}
      hitSlop={6}
    >
      <Animated.View style={{ alignItems: 'center', transform: [{ scale }] }}>
        <Ionicons name={isActive ? item.activeIcon : item.icon} size={24} color={tint} />
        <Text
          style={[styles.navLabel, { color: tint, fontWeight: isActive ? '700' : '500' }]}
          numberOfLines={1}
        >
          {item.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export default function BottomNav() {
  const [showMenu, setShowMenu] = useState(false);
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  const isRouteActive = (route: string) =>
    route === '/(tabs)' ? pathname === '/(tabs)' || pathname === '/' : pathname.startsWith(route);

  const fabScale = useRef(new Animated.Value(1)).current;
  const fabPressIn = () =>
    Animated.spring(fabScale, { toValue: 0.9, useNativeDriver: true, speed: 50 }).start();
  const fabPressOut = () =>
    Animated.spring(fabScale, { toValue: 1, useNativeDriver: true, friction: 4 }).start();

  // Left pair / right pair around the center FAB, so the "+" stays visually
  // balanced instead of one side feeling heavier now that labels add width.
  const leftItems = NAV_ITEMS.slice(0, 2);
  const rightItems = NAV_ITEMS.slice(2);

  return (
    // Outer wrapper fills the entire bottom of the screen with the nav color,
    // so the iOS home-indicator zone never shows white underneath.
    <View style={[styles.safeAreaFill, { height: styles.container.paddingTop + 54 + insets.bottom }]}>
      <View style={styles.container}>
        <View style={styles.navBar}>
          {leftItems.map((item) => (
            <NavButton key={item.key} item={item} isActive={isRouteActive(item.route)} />
          ))}

          <Animated.View style={{ transform: [{ scale: fabScale }] }}>
            <Pressable
              style={styles.fab}
              onPress={() => setShowMenu(true)}
              onPressIn={fabPressIn}
              onPressOut={fabPressOut}
              hitSlop={6}
            >
              <Ionicons name="add" size={26} color={colors.paper} />
            </Pressable>
          </Animated.View>

          {rightItems.map((item) => (
            <NavButton key={item.key} item={item} isActive={isRouteActive(item.route)} />
          ))}
        </View>
      </View>
      <ActionMenuSheet visible={showMenu} onClose={() => setShowMenu(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.paperRaised,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  safeAreaFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.paperRaised,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 16,
    shadowOpacity: 0.06,
    elevation: 12,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  navLabel: {
    ...type.caption,
    fontSize: 11,
    marginTop: 3,
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.marigold,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28, // pops out of the top of the bar slightly
    borderWidth: 4,
    borderColor: colors.paperRaised,
  },
});