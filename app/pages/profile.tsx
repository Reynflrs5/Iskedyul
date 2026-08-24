import { useCallback, useRef, useState } from 'react';
import {
  View, Text, Pressable, ScrollView, StatusBar,
  Animated, Easing, useWindowDimensions, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { styles, colors } from '../styles/profile.styles';
import BottomNav from '../../components/BottomNav';
import { supabase } from '../../utils/supabase';
import { router, useFocusEffect } from 'expo-router';

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

function MenuItem({
  icon, bg, label, value, first, danger, onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  bg: string;
  label: string;
  value?: string;
  first?: boolean;
  danger?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable style={[styles.menuItem, first && styles.menuItemFirst]} onPress={onPress}>
      <View style={[styles.menuIconWrap, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={18} color={danger ? '#E53935' : colors.ink} />
      </View>
      <Text style={[styles.menuLabel, danger && { color: '#E53935' }]}>{label}</Text>
      {value ? <Text style={styles.menuValue}>{value}</Text> : null}
      {!danger && <Ionicons name="chevron-forward" size={16} color={colors.inkFaint} />}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const hPad = clamp(width * 0.06, 18, 32);
  const maxContentWidth = 460;

  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [taskCount, setTaskCount] = useState(0);
  const [classCount, setClassCount] = useState(0);

  const heroAnim = useRef(new Animated.Value(0)).current;
  const sheetAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      heroAnim.setValue(0);
      sheetAnim.setValue(0);
      Animated.stagger(100, [
        Animated.timing(heroAnim, { toValue: 1, duration: 440, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(sheetAnim, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();

      async function loadProfile() {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserName(user.user_metadata?.full_name || '');
          setUserEmail(user.email || '');
        }
        const { count: tCount } = await supabase.from('tasks').select('*', { count: 'exact', head: true });
        const { count: cCount } = await supabase.from('classes').select('*', { count: 'exact', head: true });
        setTaskCount(tCount ?? 0);
        setClassCount(cCount ?? 0);
      }

      loadProfile();
    }, [heroAnim, sheetAnim])
  );

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/');
        },
      },
    ]);
  };

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
        {/* --- HERO: avatar, name, stats --- */}
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
              { width: width * 0.9, height: width * 0.9, top: -width * 0.55, left: -width * 0.35 },
            ]}
          />

          <View style={{ width: '100%', maxWidth: maxContentWidth, alignItems: 'center' }}>
            <Pressable style={styles.heroSettingsButton}>
              <Ionicons name="settings-outline" size={17} color={colors.paper} />
            </Pressable>

            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{userName ? userName.charAt(0).toUpperCase() : '?'}</Text>
            </View>
            <Text style={styles.userName}>{userName || ' '}</Text>
            <Text style={styles.userEmail}>{userEmail}</Text>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{classCount}</Text>
                <Text style={styles.statLabel}>Classes</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{taskCount}</Text>
                <Text style={styles.statLabel}>Tasks</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>6</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* --- CONTENT SHEET: account, preferences, sign out --- */}
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
            {/* Account group */}
            <View style={styles.sectionGroup}>
              <Text style={styles.sectionGroupTitle}>ACCOUNT</Text>
              <MenuItem icon="person-outline" bg={colors.periwinkleSoft} label="Edit Profile" first />
              <MenuItem icon="notifications-outline" bg={colors.marigoldSoft} label="Notifications" value="On" />
              <MenuItem icon="lock-closed-outline" bg={colors.sageSoft} label="Change Password" />
            </View>

            {/* Preferences group */}
            <View style={styles.sectionGroup}>
              <Text style={styles.sectionGroupTitle}>PREFERENCES</Text>
              <MenuItem icon="color-palette-outline" bg={colors.periwinkleSoft} label="Appearance" value="Light" first />
              <MenuItem icon="language-outline" bg={colors.marigoldSoft} label="Language" value="English" />
            </View>

            {/* Sign out */}
            <Pressable style={styles.signOutButton} onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={20} color="#E53935" />
              <Text style={styles.signOutText}>Sign Out</Text>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>

      <BottomNav />
    </View>
  );
}