import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import {
  View, Text, Pressable, ScrollView, StatusBar,
  Animated, Easing, useWindowDimensions, Alert,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { styles, colors, spacing } from '../styles/schedule.styles';
import BottomNav from '../../components/BottomNav';
import { supabase } from '../../utils/supabase';
import { registerForPushNotificationsAsync, scheduleClassNotification } from '../../utils/notifications';

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const ACCENT_COLORS = [colors.periwinkle, colors.marigold, colors.sage, '#C084FC', '#FB923C', '#34D399', '#60A5FA'];

function getMonthLabel() {
  return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// Consistent hashing for color-coding subjects (Feature 4)
function getSubjectColor(subject: string) {
  if (!subject) return ACCENT_COLORS[0];
  let hash = 0;
  for (let i = 0; i < subject.length; i++) {
    hash = subject.charCodeAt(i) + ((hash << 5) - hash);
  }
  return ACCENT_COLORS[Math.abs(hash) % ACCENT_COLORS.length];
}

// Grid layout constants
const HOUR_HEIGHT = 120;
const START_HOUR = 7; // 7 AM
const END_HOUR = 21; // 9 PM
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

// Parse "09:30 AM" into hours since midnight (e.g., 9.5)
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

export default function ScheduleScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const hPad = clamp(width * 0.06, 18, 32);
  const maxContentWidth = 560;

  const todayIndex = useMemo(() => (new Date().getDay() + 6) % 7, []);
  const [selectedDay, setSelectedDay] = useState(todayIndex);
  const [classes, setClasses] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [decks, setDecks] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Modal state
  const [selectedClassDetails, setSelectedClassDetails] = useState<any>(null);

  // Update current time every minute for the live indicator
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const heroAnim = useRef(new Animated.Value(0)).current;
  const sheetAnim = useRef(new Animated.Value(0)).current;

  const refreshClasses = async () => {
    const { data } = await supabase.from('classes').select('*').order('time', { ascending: true });
    if (data) setClasses(data);

    const { data: tasksData } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    if (tasksData) setTasks(tasksData);

    const { data: decksData } = await supabase.from('decks').select('*').order('created_at', { ascending: false });
    if (decksData) setDecks(decksData);
  };

  // Re-fetch and re-play the entrance animation every time this tab regains
  // focus — so classes added from the "+" screen show up without a manual
  // reload, and the screen still feels alive on return instead of static.
  useFocusEffect(
    useCallback(() => {
      heroAnim.setValue(0);
      sheetAnim.setValue(0);
      Animated.stagger(100, [
        Animated.timing(heroAnim, { toValue: 1, duration: 440, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(sheetAnim, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();

      refreshClasses().then(() => {
        // Request notification permissions when screen is focused
        registerForPushNotificationsAsync();
      });
    }, [heroAnim, sheetAnim])
  );


  const confirmDeleteClass = (id: string, subject: string) => {
    Alert.alert('Delete Class', `Are you sure you want to delete "${subject}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setClasses((prev) => prev.filter((c) => c.id !== id));
          await supabase.from('classes').delete().eq('id', id);
        },
      },
    ]);
  };

  const handleRescan = () => {
    if (classes.length === 0) {
      router.push('/pages/classes/scan');
      return;
    }

    Alert.alert(
      'Rescan Schedule',
      'Do you want to clear all your existing classes before rescanning your new schedule?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Keep Existing',
          onPress: () => router.push('/pages/classes/scan'),
        },
        {
          text: 'Clear & Rescan',
          style: 'destructive',
          onPress: async () => {
            // Delete all classes for the current user
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              setClasses([]);
              await supabase.from('classes').delete().eq('user_id', user.id);
            }
            router.push('/pages/classes/scan');
          },
        },
      ]
    );
  };

  const dayClasses = classes.filter((c) => {
    // If the class has a 'day' field (0=Mon…6=Sun), filter by it.
    // Otherwise show all classes (fallback for older data without a day field).
    return c.day === undefined || c.day === selectedDay;
  });

  // Schedule notifications for today's classes whenever dayClasses changes and we are on today
  useEffect(() => {
    if (selectedDay === todayIndex && dayClasses.length > 0) {
      dayClasses.forEach(c => {
        if (c.time) {
          scheduleClassNotification(c.subject, c.location, c.time, selectedDay);
        }
      });
    }
  }, [dayClasses, selectedDay, todayIndex]);

  // --- OVERLAP HANDLING ALGORITHM ---
  const layoutClasses = useMemo(() => {
    const processed = dayClasses.map(c => {
      const start = parseTime(c.time);
      const end = parseTime(c.time_end) || (start ? start + 1 : 0);
      return { ...c, start, end };
    }).filter(c => c.start !== null);

    processed.sort((a, b) => a.start! - b.start!);

    const groups: any[][] = [];
    let currentGroup: any[] = [];
    let groupEnd = 0;

    processed.forEach(c => {
      if (currentGroup.length === 0) {
        currentGroup.push(c);
        groupEnd = c.end;
      } else if (c.start! < groupEnd) {
        currentGroup.push(c);
        groupEnd = Math.max(groupEnd, c.end);
      } else {
        groups.push(currentGroup);
        currentGroup = [c];
        groupEnd = c.end;
      }
    });
    if (currentGroup.length > 0) groups.push(currentGroup);

    const layouted: any[] = [];
    groups.forEach(group => {
      const columns: any[][] = [];
      group.forEach(c => {
        let placed = false;
        for (let i = 0; i < columns.length; i++) {
          const col = columns[i];
          const lastInCol = col[col.length - 1];
          if (lastInCol.end <= c.start) {
            col.push(c);
            c.colIndex = i;
            placed = true;
            break;
          }
        }
        if (!placed) {
          columns.push([c]);
          c.colIndex = columns.length - 1;
        }
      });
      const numCols = columns.length;
      group.forEach(c => {
        c.numCols = numCols;
        layouted.push(c);
      });
    });
    return layouted;
  }, [dayClasses]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.ink} />

      {/* --- HERO: title, add button, day-tab strip --- */}
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
              { width: width * 0.85, height: width * 0.85, top: -width * 0.55, left: -width * 0.35 },
            ]}
          />

          <View style={{ width: '100%', maxWidth: maxContentWidth, alignSelf: 'center' }}>
            <View style={styles.heroTopRow}>
              <View>
                <Text style={styles.heroEyebrow}>{getMonthLabel()}</Text>
                <Text style={styles.pageTitle}>Schedule</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Pressable style={[styles.addButton, { backgroundColor: colors.paperRaised }]} onPress={handleRescan}>
                  <Ionicons name="scan" size={20} color={colors.ink} />
                </Pressable>
                <Pressable style={styles.addButton} onPress={() => router.push('/pages/classes/new')}>
                  <Ionicons name="add" size={20} color={colors.marigoldInk} />
                </Pressable>
              </View>
            </View>

            <View style={styles.dayTabRow}>
              {DAYS.map((day, i) => {
                const isActive = i === selectedDay;
                const isToday = i === todayIndex;
                const date = new Date();
                const diff = i - todayIndex;
                date.setDate(date.getDate() + diff);
                return (
                  <Pressable
                    key={day}
                    style={[styles.dayTab, isActive && styles.dayTabActive]}
                    onPress={() => setSelectedDay(i)}
                  >
                    {isToday && !isActive && <View style={styles.dayTabTodayDot} />}
                    <Text style={[styles.dayTabLabel, isActive && styles.dayTabLabelActive]}>{day}</Text>
                    <Text style={[styles.dayTabNumber, isActive && styles.dayTabNumberActive]}>{date.getDate()}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Animated.View>

      <ScrollView
        style={{ marginTop: -40, zIndex: 10, elevation: 10 }}
        contentContainerStyle={[styles.scrollContent, { flexGrow: 1 }]}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
      >
        {/* --- CONTENT SHEET: classes for the selected day --- */}
        <Animated.View
          style={[
            styles.contentSheet,
            { marginTop: 0, flex: 0 },
            {
              opacity: sheetAnim,
              transform: [{ translateY: sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
              paddingHorizontal: hPad,
              paddingBottom: insets.bottom + 100,
            },
          ]}
        >
          <View style={{ width: '100%', maxWidth: maxContentWidth, alignSelf: 'center' }}>
            <View style={styles.sheetHeaderRow}>
              <Text style={styles.sheetHeaderTitle}>
                {selectedDay === todayIndex ? "Today's Classes" : `${DAYS[selectedDay]}'s Classes`}
              </Text>
              {dayClasses.length > 0 && (
                <Text style={styles.sheetHeaderCount}>
                  {dayClasses.length} class{dayClasses.length > 1 ? 'es' : ''}
                </Text>
              )}
            </View>

            {/* Live Indicator (Only on Today) */}
            {selectedDay === todayIndex && dayClasses.length > 0 && (() => {
              const currentHour = currentTime.getHours() + currentTime.getMinutes() / 60;
              const upcomingOrCurrent = dayClasses
                .map(c => ({ ...c, startH: parseTime(c.time) || 0, endH: parseTime(c.time_end) || ((parseTime(c.time) || 0) + 1) }))
                .filter(c => c.endH > currentHour)
                .sort((a, b) => a.startH - b.startH)[0];

              if (upcomingOrCurrent) {
                const isHappeningNow = currentHour >= upcomingOrCurrent.startH;
                return (
                  <View style={[styles.liveBanner, { backgroundColor: isHappeningNow ? colors.marigoldSoft : colors.periwinkleSoft }]}>
                    <View style={styles.liveBannerPulse}>
                      <View style={[styles.liveBannerDot, { backgroundColor: isHappeningNow ? colors.marigold : colors.periwinkle }]} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.liveBannerTitle, { color: isHappeningNow ? colors.marigoldInk : colors.ink }]}>
                        {isHappeningNow ? 'Happening Now' : 'Up Next'}
                      </Text>
                      <Text style={styles.liveBannerSubject} numberOfLines={1}>
                        {upcomingOrCurrent.subject}
                        {upcomingOrCurrent.location ? ` • ${upcomingOrCurrent.location}` : ''}
                        {upcomingOrCurrent.professor ? ` • ${upcomingOrCurrent.professor}` : ''}
                      </Text>
                    </View>
                    <Text style={styles.liveBannerTime}>
                      {isHappeningNow ? 'Ends ' : 'Starts '}{upcomingOrCurrent.time}
                    </Text>
                  </View>
                );
              }
              return null;
            })()}

            {dayClasses.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="calendar-outline" size={32} color={colors.inkFaint} />
                <Text style={styles.emptyText}>No classes on this day</Text>
              </View>
            ) : (
              <View style={styles.gridContainer}>
                <View style={styles.gridInner}>
                  {/* Left Column: Time Labels */}
                  <View style={styles.timeColumn}>
                    {HOURS.map((h) => (
                      <View key={h} style={[styles.timeLabelContainer, { height: HOUR_HEIGHT, position: 'relative' }]}>
                        {/* Align exactly with the hour grid line (top: 0) */}
                        <Text style={[styles.timeLabel, { position: 'absolute', top: -9 }]}>
                          {h === 12 ? '12:00 PM' : h > 12 ? `${h - 12}:00 PM` : `${h}:00 AM`}
                        </Text>
                        {/* Align exactly with the half-hour grid line */}
                        {h !== END_HOUR && (
                          <Text style={[styles.timeLabel, { position: 'absolute', top: (HOUR_HEIGHT / 2) - 9, opacity: 0.5 }]}>
                            {h === 12 ? '12:30 PM' : h > 12 ? `${h - 12}:30 PM` : `${h}:30 AM`}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>

                  {/* Right Column: Classes Grid */}
                  <View style={styles.classesColumn}>
                    {/* Horizontal Grid Lines */}
                    {HOURS.map((h) => (
                      <View key={`lines-${h}`}>
                        {/* Full hour line */}
                        <View
                          style={[
                            styles.gridLine,
                            { top: (h - START_HOUR) * HOUR_HEIGHT },
                          ]}
                        />
                        {/* Half hour dashed line */}
                        {h !== END_HOUR && (
                          <View
                            style={[
                              styles.gridLine,
                              { 
                                top: (h - START_HOUR + 0.5) * HOUR_HEIGHT,
                                backgroundColor: 'transparent',
                                borderTopWidth: 1,
                                borderTopColor: colors.border,
                                borderStyle: 'dashed',
                                opacity: 0.4,
                              },
                            ]}
                          />
                        )}
                      </View>
                    ))}

                    {/* Current Time Indicator (Now Line) */}
                    {selectedDay === todayIndex && (() => {
                      const currentHour = currentTime.getHours() + currentTime.getMinutes() / 60;
                      // Show the line if it falls within the grid's timeframe (plus an extra hour at the bottom for safety)
                      if (currentHour >= START_HOUR && currentHour <= END_HOUR + 1) {
                        return (
                          <View style={[styles.currentTimeLine, { top: (currentHour - START_HOUR) * HOUR_HEIGHT }]}>
                            <View style={styles.currentTimeDot} />
                          </View>
                        );
                      }
                      return null;
                    })()}

                    {/* Class Blocks */}
                    {layoutClasses.map((c, i) => {
                      const top = (c.start - START_HOUR) * HOUR_HEIGHT;
                      const height = Math.max((c.end - c.start) * HOUR_HEIGHT, 40); // Minimum height

                      const blockWidth = `${100 / c.numCols}%`;
                      const blockLeft = `${(c.colIndex * 100) / c.numCols}%`;

                      return (
                        <Pressable
                          key={c.id}
                          style={[
                            styles.classBlock,
                            {
                              top,
                              height,
                              width: blockWidth as any,
                              left: blockLeft as any,
                              backgroundColor: getSubjectColor(c.subject),
                              marginLeft: c.colIndex === 0 ? 8 : 2, // Slight padding depending on column
                              marginRight: c.colIndex === c.numCols - 1 ? 8 : 2,
                            },
                          ]}
                          onPress={() => setSelectedClassDetails(c)}
                          onLongPress={() => confirmDeleteClass(c.id, c.subject)}
                          delayLongPress={400}
                        >
                          <Text style={styles.classBlockSubject} numberOfLines={1}>
                            {c.subject}
                          </Text>
                          <Text style={styles.classBlockLocation} numberOfLines={1}>
                            {c.location}
                          </Text>
                          {c.professor ? (
                            <Text style={styles.classBlockLocation} numberOfLines={1}>
                              {c.professor}
                            </Text>
                          ) : null}
                          <Text style={styles.classBlockTime} numberOfLines={1}>
                            {c.time} {c.time_end ? `- ${c.time_end}` : ''}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </View>
            )}
          </View>
        </Animated.View>
      </ScrollView>

      {/* --- CLASS DETAILS MODAL --- */}
      <Modal
        visible={!!selectedClassDetails}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedClassDetails(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setSelectedClassDetails(null)} />
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            {selectedClassDetails && (
              <>
                <View style={styles.modalHeader}>
                  <View style={[styles.modalColorStrip, { backgroundColor: getSubjectColor(selectedClassDetails.subject) }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalSubject}>{selectedClassDetails.subject}</Text>
                    <Text style={styles.modalTime}>
                      {DAYS[selectedDay]} • {selectedClassDetails.time} {selectedClassDetails.time_end ? `- ${selectedClassDetails.time_end}` : ''}
                    </Text>
                  </View>
                  <Pressable style={styles.modalCloseBtn} onPress={() => setSelectedClassDetails(null)}>
                    <Ionicons name="close" size={24} color={colors.inkSoft} />
                  </Pressable>
                </View>

                <View style={styles.modalBody}>
                  <View style={styles.modalDetailRow}>
                    <Ionicons name="location" size={20} color={colors.marigold} />
                    <Text style={styles.modalDetailText}>
                      {selectedClassDetails.location || "No location specified"}
                    </Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Ionicons name="person" size={20} color={colors.marigold} />
                    <Text style={styles.modalDetailText}>
                      {selectedClassDetails.professor || "No professor specified"}
                    </Text>
                  </View>
                </View>

                {/* TASKS SECTION */}
                {(() => {
                  const subjectTasks = tasks.filter(t => !t.done && t.title.toLowerCase().includes(selectedClassDetails.subject.toLowerCase()));
                  if (subjectTasks.length > 0) {
                    return (
                      <View style={{ marginTop: spacing.md, paddingHorizontal: spacing.sm }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.ink, marginBottom: spacing.sm }}>Upcoming Tasks</Text>
                        {subjectTasks.slice(0, 3).map(t => (
                          <View key={t.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, backgroundColor: colors.paper, padding: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}>
                            <Ionicons name="ellipse" size={10} color={t.priority === 'high' ? colors.marigold : t.priority === 'medium' ? colors.periwinkle : colors.sage} />
                            <Text style={{ fontSize: 14, color: colors.ink, flex: 1 }} numberOfLines={1}>{t.title}</Text>
                            <Text style={{ fontSize: 12, color: colors.inkFaint }}>{t.due}</Text>
                          </View>
                        ))}
                      </View>
                    );
                  }
                  return null;
                })()}

                {/* DECKS SECTION */}
                {(() => {
                  const subjectDecks = decks.filter(d => d.title.toLowerCase().includes(selectedClassDetails.subject.toLowerCase()));
                  if (subjectDecks.length > 0) {
                    return (
                      <View style={{ marginTop: spacing.md, paddingHorizontal: spacing.sm }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.ink, marginBottom: spacing.sm }}>Related Decks</Text>
                        {subjectDecks.slice(0, 2).map(d => (
                          <Pressable 
                            key={d.id} 
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, backgroundColor: colors.paper, padding: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}
                            onPress={() => {
                              setSelectedClassDetails(null);
                              router.push(`/pages/decks/${d.id}` as any);
                            }}
                          >
                            <Ionicons name="layers" size={16} color={colors.marigold} />
                            <Text style={{ fontSize: 14, color: colors.ink, flex: 1 }} numberOfLines={1}>{d.title}</Text>
                            <Text style={{ fontSize: 12, color: colors.inkFaint }}>{d.total} terms</Text>
                          </Pressable>
                        ))}
                      </View>
                    );
                  }
                  return null;
                })()}
                
                {/* Action Buttons */}
                <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
                  <Pressable
                    style={[styles.modalActionBtn, { flex: 1, backgroundColor: colors.periwinkle }]}
                    onPress={() => {
                      const classData = selectedClassDetails;
                      setSelectedClassDetails(null);
                      router.push({
                        pathname: '/pages/classes/edit',
                        params: classData,
                      });
                    }}
                  >
                    <Ionicons name="pencil" size={18} color={colors.paper} />
                    <Text style={[styles.modalActionText, { color: colors.paper }]}>Edit Class</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.modalActionBtn, { flex: 1, backgroundColor: '#FEE2E2' }]}
                    onPress={() => {
                      setSelectedClassDetails(null);
                      confirmDeleteClass(selectedClassDetails.id, selectedClassDetails.subject);
                    }}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    <Text style={[styles.modalActionText, { color: '#EF4444' }]}>Delete</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      <BottomNav />
    </View>
  );
}