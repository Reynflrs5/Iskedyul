import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, StatusBar, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../../../utils/supabase';
import { colors, radius, spacing, type, shadows } from '../../styles/welcome.styles';
import * as Notifications from 'expo-notifications';

export default function AdminDashboard() {
  const [totalDecks, setTotalDecks] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [totalClasses, setTotalClasses] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGlobalStats();
  }, []);

  const fetchGlobalStats = async () => {
    setLoading(true);
    try {
      // NOTE: In a real production environment with Row Level Security (RLS) enabled,
      // these queries will only return counts for rows the admin is allowed to see.
      // If RLS is off or if the admin bypasses it via a service role, it counts everything.
      
      const { count: decksCount } = await supabase.from('decks').select('*', { count: 'exact', head: true });
      const { count: tasksCount } = await supabase.from('tasks').select('*', { count: 'exact', head: true });
      const { count: classesCount } = await supabase.from('classes').select('*', { count: 'exact', head: true });

      setTotalDecks(decksCount || 0);
      setTotalTasks(tasksCount || 0);
      setTotalClasses(classesCount || 0);
    } catch (e) {
      console.log('Error fetching stats:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/pages/login');
  };

  const handleSendAnnouncement = async () => {
    Alert.alert(
      "Send Global Announcement",
      "Do you want to send a push notification to all users? (Simulated locally)",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Send", 
          onPress: async () => {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: "📣 Admin Announcement",
                body: "Iskedyul v1.1 is now live! Check out the new AI Notes Scanner.",
                sound: true,
              },
              trigger: null,
            });
            Alert.alert("Success", "Announcement broadcasted!");
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.paper} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>PLATFORM OVERVIEW</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: colors.sageSoft }]}>
              <Ionicons name="layers" size={20} color={colors.sage} />
            </View>
            <Text style={styles.statValue}>{loading ? '...' : totalDecks}</Text>
            <Text style={styles.statLabel}>Total Decks</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: colors.marigoldSoft }]}>
              <Ionicons name="checkbox" size={20} color={colors.marigold} />
            </View>
            <Text style={styles.statValue}>{loading ? '...' : totalTasks}</Text>
            <Text style={styles.statLabel}>Total Tasks</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: colors.periwinkleSoft }]}>
              <Ionicons name="calendar" size={20} color={colors.periwinkle} />
            </View>
            <Text style={styles.statValue}>{loading ? '...' : totalClasses}</Text>
            <Text style={styles.statLabel}>Classes Logged</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>

        <Pressable style={styles.actionCard} onPress={handleSendAnnouncement}>
          <View style={[styles.actionIconWrap, { backgroundColor: '#F3E8FF' }]}>
            <Ionicons name="megaphone" size={24} color="#A855F7" />
          </View>
          <View style={styles.actionTextCol}>
            <Text style={styles.actionTitle}>Broadcast Announcement</Text>
            <Text style={styles.actionSub}>Send a push notification to all users.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.inkFaint} />
        </Pressable>

        <Pressable style={styles.actionCard} onPress={fetchGlobalStats}>
          <View style={[styles.actionIconWrap, { backgroundColor: colors.paper }]}>
            <Ionicons name="refresh" size={24} color={colors.ink} />
          </View>
          <View style={styles.actionTextCol}>
            <Text style={styles.actionTitle}>Refresh Stats</Text>
            <Text style={styles.actionSub}>Sync latest data from the database.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.inkFaint} />
        </Pressable>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    backgroundColor: colors.paperRaised,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerTitle: { ...type.h2, color: colors.ink, fontSize: 20 },
  headerSub: { ...type.caption, color: colors.inkSoft },
  logoutBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.errorSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  
  content: { padding: spacing.lg, gap: spacing.md },
  sectionTitle: { ...type.caption, color: colors.inkSoft, fontWeight: '700', marginTop: spacing.sm },
  
  statsGrid: {
    flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap',
  },
  statCard: {
    flex: 1, minWidth: '45%',
    backgroundColor: colors.paperRaised, borderRadius: radius.md,
    padding: spacing.md, borderWidth: 1, borderColor: colors.border,
    alignItems: 'flex-start', ...shadows.soft,
  },
  statIconWrap: {
    width: 36, height: 36, borderRadius: radius.sm,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statValue: { ...type.h2, color: colors.ink, fontSize: 24, marginBottom: 2 },
  statLabel: { ...type.caption, color: colors.inkSoft },

  actionCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.paperRaised, borderRadius: radius.md,
    padding: spacing.md, borderWidth: 1, borderColor: colors.border,
    ...shadows.soft, marginBottom: spacing.xs,
  },
  actionIconWrap: {
    width: 48, height: 48, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  actionTextCol: { flex: 1 },
  actionTitle: { ...type.label, color: colors.ink, fontSize: 16 },
  actionSub: { ...type.caption, color: colors.inkSoft, marginTop: 2 },
});
