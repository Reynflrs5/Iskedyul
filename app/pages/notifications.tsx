import React, { useCallback, useState } from 'react';
import {
  View, Text, Pressable, ScrollView, StatusBar, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '../../utils/supabase';
import { colors, radius, spacing, shadows } from '../styles/welcome.styles';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function parseTime(timeStr: string) {
  if (!timeStr) return null;
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM|am|pm)?/);
  if (!match) return null;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const isPM = match[3] && match[3].toLowerCase() === 'pm';
  if (isPM && h !== 12) h += 12;
  if (!isPM && h === 12) h = 0;
  return h + m / 60;
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const [classes, setClasses] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      async function fetchData() {
        const todayIdx = (new Date().getDay() + 6) % 7;

        const { data: classesData } = await supabase
          .from('classes')
          .select('*')
          .order('time', { ascending: true });

        if (classesData) {
          const todayClasses = classesData.filter(
            (c: any) => c.day === todayIdx || c.day === null || c.day === undefined
          );
          setClasses(todayClasses);
        }

        const { data: tasksData } = await supabase
          .from('tasks')
          .select('*')
          .eq('done', false)
          .order('created_at', { ascending: false });

        if (tasksData) setTasks(tasksData);
      }
      fetchData();
    }, [])
  );

  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;
  const todayIdx = (now.getDay() + 6) % 7;

  // Separate: happening now, up next, later
  const happeningNow = classes.filter(c => {
    const start = parseTime(c.time);
    const end = parseTime(c.time_end) ?? ((start ?? 0) + 1);
    return start != null && currentHour >= start && currentHour < end;
  });
  const upcoming = classes.filter(c => {
    const start = parseTime(c.time);
    return start != null && start > currentHour;
  });
  const later = classes.filter(c => {
    const start = parseTime(c.time);
    const end = parseTime(c.time_end) ?? ((start ?? 0) + 1);
    return start != null && end <= currentHour;
  });

  const highTasks = tasks.filter(t => t.priority === 'high');
  const medLowTasks = tasks.filter(t => t.priority !== 'high');

  const totalNotifs = happeningNow.length + upcoming.length + tasks.length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.paper} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.ink} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSub}>
            {totalNotifs > 0 ? `${totalNotifs} active alert${totalNotifs > 1 ? 's' : ''}` : 'All clear!'}
          </Text>
        </View>
        {totalNotifs > 0 && (
          <View style={styles.badgePill}>
            <Text style={styles.badgePillText}>{totalNotifs}</Text>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
      >
        {/* ── Happening Now ── */}
        {happeningNow.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <View style={[styles.dot, { backgroundColor: colors.marigold }]} />
              <Text style={styles.sectionTitle}>Happening Now</Text>
            </View>
            {happeningNow.map(c => (
              <Pressable
                key={c.id}
                style={[styles.card, { borderLeftColor: colors.marigold }]}
                onPress={() => router.push('/pages/schedule' as any)}
              >
                <View style={styles.cardIconWrap}>
                  <Ionicons name="radio-button-on" size={18} color={colors.marigold} />
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{c.subject}</Text>
                  <Text style={styles.cardMeta}>
                    {c.time}{c.time_end ? ` – ${c.time_end}` : ''}{c.location ? ` • ${c.location}` : ''}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.inkFaint} />
              </Pressable>
            ))}
          </View>
        )}

        {/* ── Up Next ── */}
        {upcoming.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <View style={[styles.dot, { backgroundColor: colors.periwinkle }]} />
              <Text style={styles.sectionTitle}>Up Next Today</Text>
            </View>
            {upcoming.map(c => {
              const start = parseTime(c.time)!;
              const minsLeft = Math.round((start - currentHour) * 60);
              const label = minsLeft < 60 ? `In ${minsLeft} min` : `In ${Math.round(minsLeft / 60)}h`;
              return (
                <Pressable
                  key={c.id}
                  style={[styles.card, { borderLeftColor: colors.periwinkle }]}
                  onPress={() => router.push('/pages/schedule' as any)}
                >
                  <View style={styles.cardIconWrap}>
                    <Ionicons name="time-outline" size={18} color={colors.periwinkle} />
                  </View>
                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle}>{c.subject}</Text>
                    <Text style={styles.cardMeta}>
                      {c.time}{c.location ? ` • ${c.location}` : ''}
                    </Text>
                  </View>
                  <View style={[styles.timePill, { backgroundColor: colors.periwinkleSoft }]}>
                    <Text style={[styles.timePillText, { color: colors.periwinkle }]}>{label}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* ── Pending Tasks ── */}
        {tasks.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <View style={[styles.dot, { backgroundColor: colors.marigold }]} />
              <Text style={styles.sectionTitle}>Pending Tasks</Text>
              <Text style={styles.sectionCount}>{tasks.length}</Text>
            </View>

            {highTasks.map(t => (
              <Pressable
                key={t.id}
                style={[styles.card, { borderLeftColor: colors.marigold }]}
                onPress={() => router.push('/pages/tasks' as any)}
              >
                <View style={styles.cardIconWrap}>
                  <Ionicons name="alert-circle" size={18} color={colors.marigold} />
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{t.title}</Text>
                  <Text style={styles.cardMeta}>{t.due || 'No due date'}</Text>
                </View>
                <View style={[styles.timePill, { backgroundColor: colors.marigoldSoft }]}>
                  <Text style={[styles.timePillText, { color: colors.marigoldInk }]}>High</Text>
                </View>
              </Pressable>
            ))}

            {medLowTasks.map(t => (
              <Pressable
                key={t.id}
                style={[styles.card, { borderLeftColor: colors.sage }]}
                onPress={() => router.push('/pages/tasks' as any)}
              >
                <View style={styles.cardIconWrap}>
                  <Ionicons name="checkmark-circle-outline" size={18} color={colors.sage} />
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{t.title}</Text>
                  <Text style={styles.cardMeta}>{t.due || 'No due date'}</Text>
                </View>
                <View style={[styles.timePill, { backgroundColor: colors.sageSoft }]}>
                  <Text style={[styles.timePillText, { color: colors.sage }]}>
                    {t.priority === 'medium' ? 'Med' : 'Low'}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* ── Done classes ── */}
        {later.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <View style={[styles.dot, { backgroundColor: colors.inkFaint }]} />
              <Text style={[styles.sectionTitle, { color: colors.inkSoft }]}>Earlier Today</Text>
            </View>
            {later.map(c => (
              <View key={c.id} style={[styles.card, { borderLeftColor: colors.border, opacity: 0.55 }]}>
                <View style={styles.cardIconWrap}>
                  <Ionicons name="checkmark-done" size={18} color={colors.inkFaint} />
                </View>
                <View style={styles.cardBody}>
                  <Text style={[styles.cardTitle, { color: colors.inkSoft }]}>{c.subject}</Text>
                  <Text style={styles.cardMeta}>{c.time}{c.time_end ? ` – ${c.time_end}` : ''}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── All clear ── */}
        {totalNotifs === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="notifications-off-outline" size={40} color={colors.inkFaint} />
            </View>
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptySub}>No pending tasks or upcoming classes right now.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.paperRaised, borderWidth: 1, borderColor: colors.border,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.ink },
  headerSub: { fontSize: 12, color: colors.inkSoft, marginTop: 1 },
  badgePill: {
    backgroundColor: colors.marigold, borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  badgePillText: { fontSize: 13, fontWeight: '700', color: colors.marigoldInk },

  scroll: { padding: spacing.lg, gap: spacing.md },

  section: { gap: spacing.sm },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.ink, flex: 1 },
  sectionCount: {
    fontSize: 12, fontWeight: '600', color: colors.inkSoft,
    backgroundColor: colors.paperRaised, borderRadius: 8,
    paddingHorizontal: 7, paddingVertical: 2,
    borderWidth: 1, borderColor: colors.border,
  },

  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.paperRaised,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    borderLeftWidth: 3,
    paddingVertical: 12, paddingRight: 12, paddingLeft: 10,
    gap: 10,
    ...shadows.soft,
  },
  cardIconWrap: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: colors.paper,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: colors.ink },
  cardMeta: { fontSize: 12, color: colors.inkSoft, marginTop: 2 },
  timePill: {
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  },
  timePillText: { fontSize: 11, fontWeight: '700' },

  emptyState: {
    alignItems: 'center', paddingVertical: 60, gap: 10,
  },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.paperRaised, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.ink },
  emptySub: { fontSize: 13, color: colors.inkSoft, textAlign: 'center' },
});
