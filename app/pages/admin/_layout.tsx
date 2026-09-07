import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  Drawer,
  DrawerContentScrollView,
  DrawerItemList,
  DrawerContentComponentProps,
} from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../../../utils/supabase';
import { colors, radius, spacing, type, shadows } from '../../styles/welcome.styles';

function CustomAdminDrawerContent(props: any) {
  const [adminEmail, setAdminEmail] = useState<string>('jashleyflores0018@gmail.com');
  const [adminName, setAdminName] = useState<string>('Ashley (Admin)');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.email) {
        setAdminEmail(data.user.email);
        if (data.user.user_metadata?.full_name) {
          setAdminName(data.user.user_metadata.full_name);
        }
      }
    });
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to end your administrator session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            router.replace('/pages/login');
          },
        },
      ]
    );
  };

  const handleSwitchToStudent = () => {
    router.replace('/pages/dashboard');
  };

  return (
    <View style={styles.drawerContainer}>
      {/* 1. Header Profile & Portal Badge */}
      <View style={styles.drawerHeader}>
        <View style={styles.brandBadge}>
          <Ionicons name="shield-checkmark" size={13} color={colors.sage} />
          <Text style={styles.brandBadgeText}>ISKEDYUL ADMIN</Text>
        </View>

        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>AD</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={1}>
              {adminName}
            </Text>
            <Text style={styles.profileEmail} numberOfLines={1}>
              {adminEmail}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      {/* 2. Navigation Items */}
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>PLATFORM</Text>
        <DrawerItemList {...props} />

        <View style={styles.sectionDivider} />

        <Text style={styles.sectionLabel}>STUDENT APP</Text>
        <Pressable style={styles.quickActionItem} onPress={handleSwitchToStudent}>
          <View style={[styles.itemIconWrap, { backgroundColor: colors.periwinkleSoft }]}>
            <Ionicons name="school-outline" size={18} color={colors.periwinkle} />
          </View>
          <Text style={styles.quickActionLabel}>Switch to Student View</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.inkFaint} />
        </Pressable>
      </DrawerContentScrollView>

      {/* 3. Footer: Version tag & Logout Button */}
      <View style={styles.drawerFooter}>
        <View style={styles.versionRow}>
          <Ionicons name="cube-outline" size={14} color={colors.inkFaint} />
          <Text style={styles.versionText}>Iskedyul v1.1.0 (Admin Suite)</Text>
        </View>

        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={colors.error} />
          <Text style={styles.logoutBtnText}>Log Out</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function AdminLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={(props) => <CustomAdminDrawerContent {...props} />}
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.paperRaised,
          },
          headerTintColor: colors.ink,
          headerShadowVisible: false,
          drawerStyle: {
            backgroundColor: colors.paper,
            width: 290,
          },
          drawerActiveBackgroundColor: colors.marigoldSoft,
          drawerActiveTintColor: colors.marigoldInk,
          drawerInactiveTintColor: colors.inkSoft,
          drawerItemStyle: {
            borderRadius: radius.md,
            paddingHorizontal: 8,
            marginHorizontal: 12,
            marginVertical: 3,
          },
          drawerLabelStyle: {
            fontSize: 14,
            fontWeight: '600',
            marginLeft: -8,
          },
        }}
      >
        <Drawer.Screen
          name="index"
          options={{
            drawerLabel: 'Dashboard',
            title: 'Admin Dashboard',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="stats-chart" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="users"
          options={{
            drawerLabel: 'User Management',
            title: 'User Management',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="people" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="announcements"
          options={{
            drawerLabel: 'Announcements',
            title: 'Announcements',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="megaphone" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="system"
          options={{
            drawerLabel: 'System Health',
            title: 'System Health & Logs',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="pulse" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="moderation"
          options={{
            drawerLabel: 'Decks & Moderation',
            title: 'Content Moderation',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="folder-open" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="feedback"
          options={{
            drawerLabel: 'Student Feedback',
            title: 'Feedback & Bug Reports',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="chatbubbles" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="settings"
          options={{
            drawerLabel: 'System Settings',
            title: 'Platform Governance',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="settings" size={size} color={color} />
            ),
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  drawerHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: 54,
    paddingBottom: spacing.md,
    backgroundColor: colors.paperRaised,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.sageSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginBottom: 12,
  },
  brandBadgeText: {
    ...type.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.sage,
    letterSpacing: 0.5,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...type.label,
    color: colors.paper,
    fontWeight: '700',
    fontSize: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...type.label,
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
  },
  profileEmail: {
    ...type.caption,
    fontSize: 12,
    color: colors.inkFaint,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  scrollContent: {
    paddingTop: spacing.sm,
  },
  sectionLabel: {
    ...type.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.inkFaint,
    letterSpacing: 0.5,
    marginLeft: 20,
    marginTop: 10,
    marginBottom: 6,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 16,
    marginVertical: 12,
  },
  quickActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.paperRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  quickActionLabel: {
    ...type.label,
    fontSize: 14,
    color: colors.ink,
    flex: 1,
  },
  drawerFooter: {
    padding: spacing.md,
    backgroundColor: colors.paperRaised,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  versionText: {
    ...type.caption,
    fontSize: 11,
    color: colors.inkFaint,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.errorSoft || '#FBEAE5',
    paddingVertical: 12,
    borderRadius: radius.md,
  },
  logoutBtnText: {
    ...type.label,
    color: colors.error || '#C1543D',
    fontWeight: '700',
    fontSize: 14,
  },
});
