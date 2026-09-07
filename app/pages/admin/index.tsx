import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  StatusBar,
  Alert,
  RefreshControl,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../../../utils/supabase';
import { colors, radius, spacing, type, shadows } from '../../styles/welcome.styles';
import * as Notifications from 'expo-notifications';

const TIME_RANGES = [
  { key: '7d', label: '7D', days: 7 },
  { key: '30d', label: '30D', days: 30 },
  { key: '90d', label: '90D', days: 90 },
];

type StatKey = 'decks' | 'tasks' | 'classes' | 'activeUsers';

interface StatMetric {
  total: number;
  prevTotal: number;
}

interface DailyActivity {
  date: string;
  count: number;
  label: string;
}

interface RecentActivity {
  id: string | number;
  title: string | null;
  created_at: string;
  kind: 'deck' | 'task';
}

interface StatCardConfig {
  key: StatKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Record<StatKey, StatMetric>>({
    decks: { total: 0, prevTotal: 0 },
    tasks: { total: 0, prevTotal: 0 },
    classes: { total: 0, prevTotal: 0 },
    activeUsers: { total: 0, prevTotal: 0 },
  });
  const [dailyActivity, setDailyActivity] = useState<DailyActivity[]>([]); // [{ label, count }]
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [range, setRange] = useState(TIME_RANGES[0]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.key]);

  const isoDaysAgo = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString();
  };

  const countBetween = async (table: string, from?: string, to?: string) => {
    let q = supabase.from(table).select('*', { count: 'exact', head: true });
    if (from) q = q.gte('created_at', from);
    if (to) q = q.lt('created_at', to);
    const { count, error: err } = await q;
    if (err) throw err;
    return count || 0;
  };

  const loadDashboard = async () => {
    setError(null);
    setLoading(true);
    try {
      const nowIso = new Date().toISOString();
      const periodStart = isoDaysAgo(range.days);
      const prevPeriodStart = isoDaysAgo(range.days * 2);

      const [
        decksTotal, decksPrev,
        tasksTotal, tasksPrev,
        classesTotal, classesPrev,
        usersTotal, usersPrev,
      ] = await Promise.all([
        countBetween('decks', periodStart, nowIso),
        countBetween('decks', prevPeriodStart, periodStart),
        countBetween('tasks', periodStart, nowIso),
        countBetween('tasks', prevPeriodStart, periodStart),
        countBetween('classes', periodStart, nowIso),
        countBetween('classes', prevPeriodStart, periodStart),
        countBetween('users', periodStart, nowIso).catch(() => 0),
        countBetween('users', prevPeriodStart, periodStart).catch(() => 0),
      ]);

      setStats({
        decks: { total: decksTotal, prevTotal: decksPrev },
        tasks: { total: tasksTotal, prevTotal: tasksPrev },
        classes: { total: classesTotal, prevTotal: classesPrev },
        activeUsers: { total: usersTotal, prevTotal: usersPrev },
      });

      await Promise.all([loadDailyActivity(), loadRecentActivity()]);
    } catch (e) {
      console.log('Error fetching stats:', e);
      setError('Could not load dashboard data. Pull down to try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadDailyActivity = async () => {
    try {
      const since = isoDaysAgo(6); // last 7 days including today
      const { data, error: err } = await supabase
        .from('tasks')
        .select('created_at')
        .gte('created_at', since);
      if (err) throw err;

      const buckets: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        buckets[key] = 0;
      }
      (data || []).forEach((row: { created_at: string | Date }) => {
        const key = String(row.created_at).slice(0, 10);
        if (key in buckets) buckets[key] += 1;
      });

      const labels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
      const result: DailyActivity[] = Object.entries(buckets).map(([date, count]) => ({
        date,
        count,
        label: labels[new Date(date).getDay()],
      }));
      setDailyActivity(result);
    } catch (e) {
      console.log('Error fetching daily activity:', e);
      setDailyActivity([]);
    }
  };

  const loadRecentActivity = async () => {
    try {
      const { data: recentDecks } = await supabase
        .from('decks')
        .select('id, title, created_at')
        .order('created_at', { ascending: false })
        .limit(3);
      const { data: recentTasks } = await supabase
        .from('tasks')
        .select('id, title, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      const combined: RecentActivity[] = [
        ...(recentDecks || []).map((d: any) => ({ ...d, kind: 'deck' as const })),
        ...(recentTasks || []).map((t: any) => ({ ...t, kind: 'task' as const })),
      ]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      setRecentActivity(combined);
    } catch (e) {
      console.log('Error fetching recent activity:', e);
      setRecentActivity([]);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.key]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/pages/login');
  };

  const handleSendAnnouncement = async () => {
    Alert.alert(
      'Send Global Announcement',
      'Do you want to send a push notification to all users? (Simulated locally)',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: '📣 Admin Announcement',
                body: 'Iskedyul v1.1 is now live! Check out the new AI Notes Scanner.',
                sound: true,
              },
              trigger: null,
            });
            Alert.alert('Success', 'Announcement broadcasted!');
          },
        },
      ]
    );
  };

  const handleUserSearch = () => {
    if (!query.trim()) return;
    router.push({ pathname: '/pages/admin/users', params: { q: query.trim() } });
  };

  const trendOf = (current: number, prev: number) => {
    if (!prev) return current > 0 ? 100 : 0;
    return Math.round(((current - prev) / prev) * 100);
  };

  const maxDaily = useMemo(
    () => Math.max(1, ...dailyActivity.map((d) => d.count)),
    [dailyActivity]
  );

  const statCards: StatCardConfig[] = [
    {
      key: 'decks',
      label: 'Decks Created',
      icon: 'layers',
      color: colors.sage,
      bg: colors.sageSoft,
    },
    {
      key: 'tasks',
      label: 'Tasks Added',
      icon: 'checkbox',
      color: colors.marigold,
      bg: colors.marigoldSoft,
    },
    {
      key: 'classes',
      label: 'Classes Logged',
      icon: 'calendar',
      color: colors.periwinkle,
      bg: colors.periwinkleSoft,
    },
    {
      key: 'activeUsers',
      label: 'Active Users',
      icon: 'people',
      color: '#A855F7',
      bg: '#F3E8FF',
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.paper} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ink} />
        }
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.eyebrow}>ADMIN DASHBOARD</Text>
            <Text style={styles.title}>Platform Overview</Text>
          </View>
          <View style={styles.adminBadge}>
            <Ionicons name="shield-checkmark" size={14} color={colors.sage} />
            <Text style={styles.adminBadgeText}>Admin</Text>
          </View>
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={16} color="#B45309" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Time range switcher */}
        <View style={styles.rangeSwitch}>
          {TIME_RANGES.map((r) => (
            <Pressable
              key={r.key}
              style={[styles.rangePill, range.key === r.key && styles.rangePillActive]}
              onPress={() => setRange(r)}
            >
              <Text
                style={[styles.rangePillText, range.key === r.key && styles.rangePillTextActive]}
              >
                {r.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          {statCards.map((card) => {
            const s = stats[card.key];
            const trend = trendOf(s.total, s.prevTotal);
            const isUp = trend >= 0;
            return (
              <View key={card.key} style={styles.statCard}>
                <View style={[styles.statIconWrap, { backgroundColor: card.bg }]}>
                  <Ionicons name={card.icon} size={20} color={card.color} />
                </View>
                <Text style={styles.statValue}>{loading ? '—' : s.total}</Text>
                <Text style={styles.statLabel}>{card.label}</Text>
                {!loading && (
                  <View style={styles.trendRow}>
                    <Ionicons
                      name={isUp ? 'trending-up' : 'trending-down'}
                      size={12}
                      color={isUp ? colors.sage : (colors.error || '#D9534F')}
                    />
                    <Text
                      style={[
                        styles.trendText,
                        { color: isUp ? colors.sage : (colors.error || '#D9534F') },
                      ]}
                    >
                      {Math.abs(trend)}% vs prev {range.label}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Mini activity chart */}
        <Text style={styles.sectionTitle}>TASK ACTIVITY — LAST 7 DAYS</Text>
        <View style={styles.chartCard}>
          <View style={styles.chartBars}>
            {dailyActivity.map((d, idx) => (
              <View key={idx} style={styles.chartBarCol}>
                <View
                  style={[
                    styles.chartBar,
                    {
                      height: 8 + (d.count / maxDaily) * 64,
                      backgroundColor: idx === dailyActivity.length - 1 ? colors.marigold : colors.sage,
                    },
                  ]}
                />
                <Text style={styles.chartLabel}>{d.label}</Text>
              </View>
            ))}
            {dailyActivity.length === 0 && (
              <Text style={styles.emptyText}>No task activity yet this week.</Text>
            )}
          </View>
        </View>

        {/* Quick user lookup */}
        <Text style={styles.sectionTitle}>USER LOOKUP</Text>
        <View style={styles.searchRow}>
          <Ionicons name="search" size={18} color={colors.inkFaint} style={{ marginRight: 8 }} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name or email…"
            placeholderTextColor={colors.inkFaint}
            style={styles.searchInput}
            onSubmitEditing={handleUserSearch}
            returnKeyType="search"
          />
          <Pressable onPress={handleUserSearch} style={styles.searchGo}>
            <Ionicons name="arrow-forward" size={16} color={colors.ink} />
          </Pressable>
        </View>

        {/* Quick actions */}
        <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>

        <Pressable
          style={styles.actionCard}
          onPress={() => router.push('/pages/admin/announcements' as any)}
        >
          <View style={[styles.actionIconWrap, { backgroundColor: '#F3E8FF' }]}>
            <Ionicons name="megaphone" size={24} color="#A855F7" />
          </View>
          <View style={styles.actionTextCol}>
            <Text style={styles.actionTitle}>Broadcast Announcement</Text>
            <Text style={styles.actionSub}>Send a push notification to all users.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.inkFaint} />
        </Pressable>

        <Pressable style={styles.actionCard} onPress={() => router.push('/pages/admin/users')}>
          <View style={[styles.actionIconWrap, { backgroundColor: colors.periwinkleSoft }]}>
            <Ionicons name="people" size={24} color={colors.periwinkle} />
          </View>
          <View style={styles.actionTextCol}>
            <Text style={styles.actionTitle}>Manage Users</Text>
            <Text style={styles.actionSub}>View, search, and moderate accounts.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.inkFaint} />
        </Pressable>

        <Pressable style={styles.actionCard} onPress={() => router.push('/pages/admin/system' as any)}>
          <View style={[styles.actionIconWrap, { backgroundColor: colors.sageSoft }]}>
            <Ionicons name="pulse" size={24} color={colors.sage} />
          </View>
          <View style={styles.actionTextCol}>
            <Text style={styles.actionTitle}>System Health</Text>
            <Text style={styles.actionSub}>Check API status and error logs.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.inkFaint} />
        </Pressable>

        <Pressable
          style={styles.actionCard}
          onPress={() => router.push('/pages/admin/moderation' as any)}
        >
          <View style={[styles.actionIconWrap, { backgroundColor: colors.marigoldSoft }]}>
            <Ionicons name="folder-open" size={24} color={colors.marigoldInk} />
          </View>
          <View style={styles.actionTextCol}>
            <Text style={styles.actionTitle}>Decks & Moderation</Text>
            <Text style={styles.actionSub}>Review flagged decks & publish templates.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.inkFaint} />
        </Pressable>

        <Pressable
          style={styles.actionCard}
          onPress={() => router.push('/pages/admin/feedback' as any)}
        >
          <View style={[styles.actionIconWrap, { backgroundColor: colors.periwinkleSoft }]}>
            <Ionicons name="chatbubbles" size={24} color={colors.periwinkle} />
          </View>
          <View style={styles.actionTextCol}>
            <Text style={styles.actionTitle}>Student Feedback & Bugs</Text>
            <Text style={styles.actionSub}>Resolve issues and review student ratings.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.inkFaint} />
        </Pressable>

        <Pressable
          style={styles.actionCard}
          onPress={() => router.push('/pages/admin/settings' as any)}
        >
          <View style={[styles.actionIconWrap, { backgroundColor: colors.paperLine }]}>
            <Ionicons name="settings-sharp" size={24} color={colors.ink} />
          </View>
          <View style={styles.actionTextCol}>
            <Text style={styles.actionTitle}>Platform Governance</Text>
            <Text style={styles.actionSub}>Maintenance mode, term dates & AI toggles.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.inkFaint} />
        </Pressable>

        <Pressable style={styles.actionCard} onPress={onRefresh}>
          <View style={[styles.actionIconWrap, { backgroundColor: colors.paper }]}>
            <Ionicons name="refresh" size={24} color={colors.ink} />
          </View>
          <View style={styles.actionTextCol}>
            <Text style={styles.actionTitle}>Refresh Stats</Text>
            <Text style={styles.actionSub}>Sync latest data from the database.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.inkFaint} />
        </Pressable>

        {/* Recent activity feed */}
        <Text style={styles.sectionTitle}>RECENT ACTIVITY</Text>
        <View style={styles.feedCard}>
          {recentActivity.length === 0 && !loading && (
            <Text style={styles.emptyText}>Nothing new yet.</Text>
          )}
          {recentActivity.map((item, idx) => (
            <View
              key={`${item.kind}-${item.id}`}
              style={[
                styles.feedRow,
                idx !== recentActivity.length - 1 && styles.feedRowDivider,
              ]}
            >
              <View
                style={[
                  styles.feedIconWrap,
                  { backgroundColor: item.kind === 'deck' ? colors.sageSoft : colors.marigoldSoft },
                ]}
              >
                <Ionicons
                  name={item.kind === 'deck' ? 'layers' : 'checkbox'}
                  size={14}
                  color={item.kind === 'deck' ? colors.sage : colors.marigold}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.feedTitle} numberOfLines={1}>
                  {item.title || 'Untitled'}
                </Text>
                <Text style={styles.feedSub}>
                  New {item.kind} · {timeAgo(item.created_at)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function timeAgo(iso: string) {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },

  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl || 40 },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  eyebrow: { ...type.caption, color: colors.inkFaint, fontWeight: '700', letterSpacing: 0.5 },
  title: { ...type.h2, color: colors.ink, fontSize: 24, marginTop: 2 },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.sageSoft,
  },
  adminBadgeText: {
    ...type.caption,
    color: colors.sage,
    fontWeight: '700',
    fontSize: 12,
  },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  errorText: { ...type.caption, color: '#92400E', flex: 1 },

  rangeSwitch: {
    flexDirection: 'row',
    backgroundColor: colors.paperRaised,
    borderRadius: radius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: 'flex-start',
  },
  rangePill: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: radius.sm },
  rangePillActive: { backgroundColor: colors.ink },
  rangePillText: { ...type.caption, color: colors.inkSoft, fontWeight: '600' },
  rangePillTextActive: { color: colors.paper },

  sectionTitle: {
    ...type.caption,
    color: colors.inkSoft,
    fontWeight: '700',
    marginTop: spacing.sm,
    letterSpacing: 0.5,
  },

  statsGrid: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.paperRaised,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'flex-start',
    ...shadows.soft,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statValue: { ...type.h2, color: colors.ink, fontSize: 24, marginBottom: 2 },
  statLabel: { ...type.caption, color: colors.inkSoft },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  trendText: { ...type.caption, fontSize: 11, fontWeight: '600' },

  chartCard: {
    backgroundColor: colors.paperRaised,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 90,
  },
  chartBarCol: { alignItems: 'center', flex: 1, gap: 6 },
  chartBar: { width: 14, borderRadius: 6 },
  chartLabel: { ...type.caption, fontSize: 11, color: colors.inkFaint },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paperRaised,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 46,
  },
  searchInput: { flex: 1, ...type.label, color: colors.ink, fontSize: 14 },
  searchGo: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },

  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.paperRaised,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
    marginBottom: spacing.xs,
  },
  actionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextCol: { flex: 1 },
  actionTitle: { ...type.label, color: colors.ink, fontSize: 16 },
  actionSub: { ...type.caption, color: colors.inkSoft, marginTop: 2 },

  feedCard: {
    backgroundColor: colors.paperRaised,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
    overflow: 'hidden',
  },
  feedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  feedRowDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  feedIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedTitle: { ...type.label, color: colors.ink, fontSize: 14 },
  feedSub: { ...type.caption, color: colors.inkFaint, marginTop: 1 },

  emptyText: { ...type.caption, color: colors.inkFaint, padding: spacing.sm },
});