import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import {
  View, Text, Pressable, ScrollView, StatusBar,
  Animated, Easing, useWindowDimensions, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { styles, colors } from '../styles/schedule.styles';
import BottomNav from '../../components/BottomNav';
import { supabase } from '../../utils/supabase';

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
const HOUR_HEIGHT = 70;
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
  const [currentTime, setCurrentTime] = useState(new Date());

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

      refreshClasses();
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

  const dayClasses = classes.filter((c) => {
    // If the class has a 'day' field (0=Mon…6=Sun), filter by it.
    // Otherwise show all classes (fallback for older data without a day field).
    return c.day === undefined || c.day === selectedDay;
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.ink} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
              <Pressable style={styles.addButton} onPress={() => router.push('/pages/classes/new')}>
                <Ionicons name="add" size={20} color={colors.marigoldInk} />
              </Pressable>
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

        {/* --- CONTENT SHEET: classes for the selected day --- */}
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
                      <Text style={styles.liveBannerSubject}>
                        {upcomingOrCurrent.subject} • {upcomingOrCurrent.location}
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
                      <View key={h} style={[styles.timeLabelContainer, { height: HOUR_HEIGHT }]}>
                        <Text style={styles.timeLabel}>
                          {h === 12 ? '12 PM' : h > 12 ? `${h - 12} PM` : `${h} AM`}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Right Column: Classes Grid */}
                  <View style={styles.classesColumn}>
                    {/* Horizontal Grid Lines */}
                    {HOURS.map((h) => (
                      <View
                        key={`line-${h}`}
                        style={[
                          styles.gridLine,
                          { top: (h - START_HOUR) * HOUR_HEIGHT },
                        ]}
                      />
                    ))}

                    {/* Class Blocks */}
                    {dayClasses.map((c, i) => {
                      const start = parseTime(c.time);
                      let end = parseTime(c.time_end);
                      if (start === null) return null;
                      if (end === null) end = start + 1; // Default to 1 hour if end time missing

                      const top = (start - START_HOUR) * HOUR_HEIGHT;
                      const height = Math.max((end - start) * HOUR_HEIGHT, 40); // Minimum height

                      return (
                        <Pressable
                          key={c.id}
                          style={[
                            styles.classBlock,
                            {
                              top,
                              height,
                              backgroundColor: getSubjectColor(c.subject),
                            },
                          ]}
                          onLongPress={() => confirmDeleteClass(c.id, c.subject)}
                          delayLongPress={400}
                        >
                          <Text style={styles.classBlockSubject} numberOfLines={1}>
                            {c.subject}
                          </Text>
                          <Text style={styles.classBlockLocation} numberOfLines={1}>
                            {c.location}
                          </Text>
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

      <BottomNav />
    </View>
  );
}