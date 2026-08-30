import { useCallback, useRef, useState } from 'react';
import {
  View, Text, Pressable, ScrollView, StatusBar,
  Animated, Easing, useWindowDimensions, Alert,
  TextInput, Switch, ActivityIndicator, Modal,
  TouchableWithoutFeedback, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles, colors, spacing, radius, type, shadows } from '../styles/profile.styles';
import BottomNav from '../../components/BottomNav';
import { supabase } from '../../utils/supabase';
import { router, useFocusEffect } from 'expo-router';

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

// ─── Animated focus input (reusing login page pattern) ─────────────────────
function SheetInput({
  label, value, onChangeText, placeholder, secureTextEntry,
  rightIcon, onRightIconPress, autoCapitalize, keyboardType,
}: {
  label: string; value: string; onChangeText: (t: string) => void;
  placeholder: string; secureTextEntry?: boolean;
  rightIcon?: React.ReactNode; onRightIconPress?: () => void;
  autoCapitalize?: 'none' | 'sentences' | 'words';
  keyboardType?: 'default' | 'email-address';
}) {
  const focusAnim = useRef(new Animated.Value(0)).current;
  const anim = (v: number) =>
    Animated.timing(focusAnim, { toValue: v, duration: 160, useNativeDriver: false, easing: Easing.out(Easing.quad) }).start();

  const borderColor = focusAnim.interpolate({ inputRange: [0, 1], outputRange: [colors.border, colors.periwinkle] });
  const bg = focusAnim.interpolate({ inputRange: [0, 1], outputRange: [colors.paperRaised, colors.periwinkleSoft] });

  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={[type.caption, { color: colors.inkSoft, marginBottom: 6, letterSpacing: 0.3 }]}>{label}</Text>
      <Animated.View style={{
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1.5, borderColor, borderRadius: radius.md,
        backgroundColor: bg, paddingHorizontal: spacing.md,
      }}>
        <TextInput
          style={[type.body, { flex: 1, color: colors.ink, paddingVertical: spacing.sm }]}
          placeholder={placeholder}
          placeholderTextColor={colors.inkFaint}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => anim(1)}
          onBlur={() => anim(0)}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize ?? 'sentences'}
          keyboardType={keyboardType}
        />
        {rightIcon && (
          <Pressable onPress={onRightIconPress} hitSlop={8}>
            {rightIcon}
          </Pressable>
        )}
      </Animated.View>
    </View>
  );
}

// ─── Generic slide-up bottom sheet ─────────────────────────────────────────
function ProfileSheet({ visible, onClose, title, children }: {
  visible: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useCallback(() => { /* reset */ }, []);

  // run animation when visible changes
  const prevVisible = useRef(false);
  if (prevVisible.current !== visible) {
    prevVisible.current = visible;
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 1, useNativeDriver: true, damping: 22, stiffness: 200 }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 240, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 210, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, justifyContent: 'flex-end' }}>
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.45)',
          }, { opacity: backdropAnim }]} />
        </TouchableWithoutFeedback>
        <Animated.View style={{
          backgroundColor: colors.paper,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.sm,
          paddingBottom: insets.bottom + spacing.lg,
          maxHeight: '85%',
          ...shadows.cta,
          transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [600, 0] }) }],
        }}>
          {/* Drag handle */}
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.md }} />
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg }}>
            <Text style={[type.h2, { color: colors.ink }]}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={8} style={{
              width: 32, height: 32, borderRadius: radius.pill,
              backgroundColor: colors.paperRaised, alignItems: 'center', justifyContent: 'center',
              borderWidth: 1, borderColor: colors.border,
            }}>
              <Ionicons name="close" size={18} color={colors.inkSoft} />
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Save button inside a sheet ─────────────────────────────────────────────
function SaveButton({ label, onPress, loading }: { label: string; onPress: () => void; loading?: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ transform: [{ scale }], marginTop: spacing.sm }}>
      <Pressable
        style={{
          backgroundColor: colors.ink, borderRadius: radius.md,
          paddingVertical: spacing.md, alignItems: 'center',
          opacity: loading ? 0.65 : 1,
        }}
        onPress={onPress}
        disabled={loading}
        onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 4 }).start()}
      >
        {loading
          ? <ActivityIndicator size="small" color={colors.paper} />
          : <Text style={[type.label, { color: colors.paper }]}>{label}</Text>}
      </Pressable>
    </Animated.View>
  );
}

// ─── MenuItem — now supports toggle (Switch) or chevron ────────────────────
function MenuItem({
  icon, bg, label, value, first, danger, onPress,
  toggle, toggleValue, onToggleChange,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  bg: string; label: string; value?: string;
  first?: boolean; danger?: boolean; onPress?: () => void;
  toggle?: boolean; toggleValue?: boolean; onToggleChange?: (v: boolean) => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      style={[styles.menuItem, first && styles.menuItemFirst]}
      onPress={toggle ? undefined : onPress}
      onPressIn={() => !toggle && Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 60 }).start()}
      onPressOut={() => !toggle && Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 4 }).start()}
    >
      <Animated.View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md, transform: [{ scale }] }}>
        <View style={[styles.menuIconWrap, { backgroundColor: bg }]}>
          <Ionicons name={icon} size={18} color={danger ? '#E53935' : colors.ink} />
        </View>
        <Text style={[styles.menuLabel, danger && { color: '#E53935' }]}>{label}</Text>
        {value && !toggle && <Text style={styles.menuValue}>{value}</Text>}
        {toggle
          ? <Switch
              value={toggleValue}
              onValueChange={onToggleChange}
              trackColor={{ false: colors.border, true: colors.periwinkle }}
              thumbColor={colors.paperRaised}
            />
          : !danger && <Ionicons name="chevron-forward" size={16} color={colors.inkFaint} />
        }
      </Animated.View>
    </Pressable>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════════════════════════════════════════
export default function ProfileScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const hPad = clamp(width * 0.06, 18, 32);
  const maxContentWidth = 460;

  // ── User data ──
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [taskCount, setTaskCount] = useState(0);
  const [classCount, setClassCount] = useState(0);
  const [dayStreak, setDayStreak] = useState(0);

  // ── Preferences ──
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [appearance, setAppearance] = useState<'Light' | 'Dark'>('Light');
  const [language, setLanguage] = useState('English');

  // ── Sheet visibility ──
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showLanguage, setShowLanguage] = useState(false);

  // ── Edit Profile state ──
  const [editName, setEditName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // ── Change Password state ──
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // ── Entrance animation ──
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
        if (!user) return;
        setUserName(user.user_metadata?.full_name || '');
        setUserEmail(user.email || '');

        // Tasks count — current user only
        const { count: tCount } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // Classes count — current user only
        const { count: cCount } = await supabase
          .from('classes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        setTaskCount(tCount ?? 0);
        setClassCount(cCount ?? 0);

        // Day streak — count consecutive days (backwards from today)
        // that have at least 1 completed task for this user.
        // We fetch all done tasks with their created_at timestamp.
        const { data: doneTasks } = await supabase
          .from('tasks')
          .select('created_at')
          .eq('user_id', user.id)
          .eq('done', true);

        let streak = 0;
        if (doneTasks && doneTasks.length > 0) {
          // Build a Set of date strings "YYYY-MM-DD" that have done tasks
          const doneDays = new Set(
            doneTasks.map((t) => new Date(t.created_at).toISOString().slice(0, 10))
          );
          // Walk backwards from today until a day with no done tasks
          const cursor = new Date();
          while (true) {
            const key = cursor.toISOString().slice(0, 10);
            if (doneDays.has(key)) {
              streak++;
              cursor.setDate(cursor.getDate() - 1);
            } else {
              break;
            }
          }
        }
        setDayStreak(streak);

        // Load saved preferences
        const notif = await AsyncStorage.getItem('pref_notifications');
        const app = await AsyncStorage.getItem('pref_appearance');
        const lang = await AsyncStorage.getItem('pref_language');
        if (notif !== null) setNotifEnabled(notif === 'true');
        if (app !== null) setAppearance(app as 'Light' | 'Dark');
        if (lang !== null) setLanguage(lang);
      }

      loadProfile();
    }, [heroAnim, sheetAnim])
  );

  // ── Handlers ────────────────────────────────────────────────────────────

  const openEditProfile = () => {
    setEditName(userName);
    setShowEditProfile(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Name Required', 'Please enter your display name.');
      return;
    }
    setSavingProfile(true);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: editName.trim() },
    });
    setSavingProfile(false);
    if (error) {
      Alert.alert('Update Failed', error.message);
    } else {
      setUserName(editName.trim());
      setShowEditProfile(false);
      Alert.alert('Profile Updated', 'Your display name has been saved.');
    }
  };

  const openChangePassword = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
    setShowChangePassword(true);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Missing Fields', 'Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Passwords Do Not Match', 'New password and confirm password must be the same.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Too Short', 'Password must be at least 6 characters.');
      return;
    }

    setSavingPassword(true);
    // Re-authenticate by signing in first
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: currentPassword,
    });
    if (authError) {
      setSavingPassword(false);
      Alert.alert('Wrong Password', 'Your current password is incorrect.');
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) {
      Alert.alert('Update Failed', error.message);
    } else {
      setShowChangePassword(false);
      Alert.alert('Password Changed', 'Your password has been updated successfully.');
    }
  };

  const handleNotifToggle = async (value: boolean) => {
    setNotifEnabled(value);
    await AsyncStorage.setItem('pref_notifications', String(value));
  };

  const handleAppearanceToggle = async () => {
    const next = appearance === 'Light' ? 'Dark' : 'Light';
    setAppearance(next);
    await AsyncStorage.setItem('pref_appearance', next);
  };

  const handleSignOut = () => {
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

  const LANGUAGES = ['English', 'Filipino', 'Cebuano', 'Ilocano'];

  const handleLanguageSelect = async (lang: string) => {
    setLanguage(lang);
    await AsyncStorage.setItem('pref_language', lang);
    setShowLanguage(false);
  };

  // ── Render ───────────────────────────────────────────────────────────────
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
        {/* ── HERO ── */}
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
          <View style={[styles.heroAccentRing, { width: width * 0.9, height: width * 0.9, top: -width * 0.55, left: -width * 0.35 }]} />

          <View style={{ width: '100%', maxWidth: maxContentWidth, alignItems: 'center' }}>
            {/* Settings → opens Edit Profile */}
            <Pressable style={styles.heroSettingsButton} onPress={openEditProfile} hitSlop={8}>
              <Ionicons name="create-outline" size={17} color={colors.paper} />
            </Pressable>

            {/* Avatar — tap to edit profile */}
            <Pressable onPress={openEditProfile}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{userName ? userName.charAt(0).toUpperCase() : '?'}</Text>
              </View>
            </Pressable>
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
                <Text style={styles.statNumber}>{dayStreak}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ── CONTENT SHEET ── */}
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
            {/* ACCOUNT */}
            <View style={styles.sectionGroup}>
              <Text style={styles.sectionGroupTitle}>ACCOUNT</Text>
              <MenuItem
                icon="person-outline" bg={colors.periwinkleSoft}
                label="Edit Profile" first
                onPress={openEditProfile}
              />
              <MenuItem
                icon="notifications-outline" bg={colors.marigoldSoft}
                label="Notifications"
                toggle toggleValue={notifEnabled}
                onToggleChange={handleNotifToggle}
              />
              <MenuItem
                icon="lock-closed-outline" bg={colors.sageSoft}
                label="Change Password"
                onPress={openChangePassword}
              />
            </View>

            {/* PREFERENCES */}
            <View style={styles.sectionGroup}>
              <Text style={styles.sectionGroupTitle}>PREFERENCES</Text>
              <MenuItem
                icon={appearance === 'Dark' ? 'moon-outline' : 'sunny-outline'}
                bg={colors.periwinkleSoft}
                label="Appearance" value={appearance} first
                onPress={handleAppearanceToggle}
              />
              <MenuItem
                icon="language-outline" bg={colors.marigoldSoft}
                label="Language" value={language}
                onPress={() => setShowLanguage(true)}
              />
            </View>

            {/* TOOLS */}
            <View style={styles.sectionGroup}>
              <Text style={styles.sectionGroupTitle}>TOOLS</Text>
              <MenuItem
                icon="calculator-outline" bg={colors.sageSoft}
                label="GWA Calculator" first
                onPress={() => router.push('/pages/gwa-calculator' as any)}
              />
              <MenuItem
                icon="timer-outline" bg={colors.periwinkleSoft}
                label="Focus Timer"
                onPress={() => router.push('/pages/focus-timer' as any)}
              />
              <MenuItem
                icon="walk-outline" bg={colors.marigoldSoft}
                label="Attendance Tracker"
                onPress={() => router.push('/pages/attendance-tracker' as any)}
              />
            </View>

            {/* Sign Out */}
            <Pressable style={styles.signOutButton} onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={20} color="#E53935" />
              <Text style={styles.signOutText}>Sign Out</Text>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>

      <BottomNav />

      {/* ── EDIT PROFILE SHEET ── */}
      <ProfileSheet visible={showEditProfile} onClose={() => setShowEditProfile(false)} title="Edit Profile">
        <SheetInput
          label="Display Name"
          value={editName}
          onChangeText={setEditName}
          placeholder="Your full name"
          autoCapitalize="words"
        />
        <View style={{ marginBottom: spacing.md, padding: spacing.md, backgroundColor: colors.paperRaised, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border }}>
          <Text style={[type.caption, { color: colors.inkFaint, marginBottom: 2 }]}>Email Address</Text>
          <Text style={[type.body, { color: colors.inkSoft }]}>{userEmail}</Text>
        </View>
        <Text style={[type.caption, { color: colors.inkFaint, marginBottom: spacing.md, lineHeight: 18 }]}>
          Email address cannot be changed here. Contact support if you need to update your email.
        </Text>
        <SaveButton label="Save Changes" onPress={handleSaveProfile} loading={savingProfile} />
        <View style={{ height: spacing.sm }} />
      </ProfileSheet>

      {/* ── CHANGE PASSWORD SHEET ── */}
      <ProfileSheet visible={showChangePassword} onClose={() => setShowChangePassword(false)} title="Change Password">
        <SheetInput
          label="Current Password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="Enter current password"
          secureTextEntry={!showCurrent}
          autoCapitalize="none"
          rightIcon={<Ionicons name={showCurrent ? 'eye-off' : 'eye'} size={18} color={colors.inkFaint} />}
          onRightIconPress={() => setShowCurrent(v => !v)}
        />
        <SheetInput
          label="New Password"
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="At least 6 characters"
          secureTextEntry={!showNew}
          autoCapitalize="none"
          rightIcon={<Ionicons name={showNew ? 'eye-off' : 'eye'} size={18} color={colors.inkFaint} />}
          onRightIconPress={() => setShowNew(v => !v)}
        />
        <SheetInput
          label="Confirm New Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Repeat new password"
          secureTextEntry={!showConfirm}
          autoCapitalize="none"
          rightIcon={<Ionicons name={showConfirm ? 'eye-off' : 'eye'} size={18} color={colors.inkFaint} />}
          onRightIconPress={() => setShowConfirm(v => !v)}
        />
        <SaveButton label="Update Password" onPress={handleChangePassword} loading={savingPassword} />
        <View style={{ height: spacing.sm }} />
      </ProfileSheet>

      {/* ── LANGUAGE PICKER SHEET ── */}
      <ProfileSheet visible={showLanguage} onClose={() => setShowLanguage(false)} title="Choose Language">
        {LANGUAGES.map((lang) => {
          const selected = lang === language;
          return (
            <Pressable
              key={lang}
              onPress={() => handleLanguageSelect(lang)}
              style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                paddingVertical: spacing.md, paddingHorizontal: spacing.md,
                borderRadius: radius.md, marginBottom: spacing.xs,
                backgroundColor: selected ? colors.periwinkleSoft : colors.paperRaised,
                borderWidth: 1.5,
                borderColor: selected ? colors.periwinkle : colors.border,
              }}
            >
              <Text style={[type.label, { color: selected ? colors.periwinkle : colors.ink }]}>{lang}</Text>
              {selected && <Ionicons name="checkmark-circle" size={20} color={colors.periwinkle} />}
            </Pressable>
          );
        })}
        <View style={{ height: spacing.sm }} />
      </ProfileSheet>
    </View>
  );
}