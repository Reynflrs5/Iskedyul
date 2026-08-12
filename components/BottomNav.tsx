import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { colors, type, radius, shadows, spacing } from '../app/styles/welcome.styles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ActionMenuSheet from './ActionMenuSheet';

const NAV_BAR_HEIGHT = 58; // fixed, explicit — not read back off a StyleSheet object

type NavItem = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  route: string;
  tint: string; // each destination gets its own accent for the active pill
  tintSoft: string;
};

// Route match is prefix-based ('/pages/schedule' also matches
// '/pages/schedule/123'), so a detail screen still highlights its tab.
const NAV_ITEMS: NavItem[] = [
  { key: 'home', label: 'Home', icon: 'home-outline', activeIcon: 'home', route: '/pages/dashboard', tint: colors.ink, tintSoft: colors.border },
  { key: 'schedule', label: 'Schedule', icon: 'calendar-outline', activeIcon: 'calendar', route: '/pages/schedule', tint: colors.periwinkle, tintSoft: colors.periwinkleSoft },
  { key: 'decks', label: 'Decks', icon: 'layers-outline', activeIcon: 'layers', route: '/pages/decks', tint: colors.sage, tintSoft: colors.sageSoft },
  { key: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person', route: '/pages/profile', tint: colors.ink, tintSoft: colors.border },
];

// One nav item — its own press-scale animation, plus a soft "pill" that
// fades and scales in behind the icon when this tab becomes active, instead
// of relying on color change alone to signal state.
function NavButton({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const pressScale = useRef(new Animated.Value(1)).current;
  const indicatorAnim = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(indicatorAnim, {
      toValue: isActive ? 1 : 0,
      useNativeDriver: true,
      speed: 18,
      bounciness: 6,
    }).start();
  }, [isActive]);

  const pressIn = () =>
    Animated.spring(pressScale, { toValue: 0.88, useNativeDriver: true, speed: 50 }).start();
  const pressOut = () =>
    Animated.spring(pressScale, { toValue: 1, useNativeDriver: true, friction: 4 }).start();

  const tint = isActive ? item.tint : colors.inkFaint;

  return (
    <Pressable
      style={styles.navItem}
      onPress={() => router.push(item.route as any)}
      onPressIn={pressIn}
      onPressOut={pressOut}
      hitSlop={6}
    >
      <Animated.View style={{ alignItems: 'center', transform: [{ scale: pressScale }] }}>
        <View style={styles.iconSlot}>
          <Animated.View
            style={[
              styles.activePill,
              {
                backgroundColor: item.tintSoft,
                opacity: indicatorAnim,
                transform: [{ scale: indicatorAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
              },
            ]}
          />
          <Ionicons name={isActive ? item.activeIcon : item.icon} size={22} color={tint} />
        </View>
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
    route === '/pages/dashboard' ? pathname === '/pages/dashboard' || pathname === '/' : pathname.startsWith(route);

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
    <>
      {/* Single wrapper — fills all the way to the physical bottom edge so
          the iOS home-indicator zone is never left showing raw background. */}
      <View
        style={[
          styles.container,
          { paddingBottom: insets.bottom, height: NAV_BAR_HEIGHT + 10 + insets.bottom },
        ]}
      >
        <View style={styles.navBar}>
          {leftItems.map((item) => (
            <NavButton key={item.key} item={item} isActive={isRouteActive(item.route)} />
          ))}

          <Animated.View style={{ transform: [{ scale: fabScale }] }}>
            {/* Soft glow ring behind the FAB — static, just for depth */}
            <View style={styles.fabGlow} pointerEvents="none" />
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
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.paperRaised,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    shadowColor: colors.shadowInk,
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
  iconSlot: {
    width: 40,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePill: {
    position: 'absolute',
    width: 40,
    height: 32,
    borderRadius: radius.md,
  },
  navLabel: {
    ...type.caption,
    fontSize: 11,
    marginTop: 2,
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
    ...shadows.cta,
  },
  fabGlow: {
    position: 'absolute',
    top: -32,
    left: -4,
    width: 60,
    height: 60,
    borderRadius: radius.pill,
    backgroundColor: colors.marigold,
    opacity: 0.18,
  },
});