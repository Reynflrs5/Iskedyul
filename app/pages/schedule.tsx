import { useEffect, useRef, useState, useMemo } from 'react';
import {
  View, Text, Pressable, ScrollView, StatusBar,
  Animated, Easing, useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { styles, colors, spacing } from '../styles/schedule.styles';
import { styles as welcomeStyles } from '../styles/welcome.styles';
import BottomNav from '../../components/BottomNav';
import { supabase } from '../../utils/supabase';
import AddClassSheet from '../../components/AddClassSheet';

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const ACCENT_COLORS = [colors.periwinkle, colors.marigold, colors.sage, '#C084FC', '#FB923C', '#34D399', '#60A5FA'];

export default function ScheduleScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const hPad = clamp(width * 0.06, 18, 32);

  const todayIndex = useMemo(() => (new Date().getDay() + 6) % 7, []);
  const [selectedDay, setSelectedDay] = useState(todayIndex);
  const [classes, setClasses] = useState<any[]>([]);
  const [showAddClass, setShowAddClass] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start();

    supabase.from('classes').select('*').order('time', { ascending: true })
      .then(({ data }) => { if (data) setClasses(data); });
  }, []);

  const refreshClasses = async () => {
    const { data } = await supabase.from('classes').select('*').order('time', { ascending: true });
    if (data) setClasses(data);
  };

  const dayClasses = classes.filter((c) => {
    // If the class has a 'day' field (0=Mon…6=Sun), filter by it.
    // Otherwise show all classes (fallback for older data without a day field).
    return c.day === undefined || c.day === selectedDay;
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.paper} />

      {/* Background blob */}
      <View style={welcomeStyles.backgroundLayer} pointerEvents="none">
        <View style={[welcomeStyles.blob, {
          width: width * 0.7, height: width * 0.7,
          borderRadius: width * 0.35,
          backgroundColor: colors.periwinkleSoft,
          opacity: 0.25, top: -width * 0.4, left: -width * 0.2,
        }]} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: hPad,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }}>
          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.pageTitle}>Schedule</Text>
            <Pressable style={styles.addButton} onPress={() => setShowAddClass(true)}>
              <Ionicons name="add" size={20} color={colors.paper} />
            </Pressable>
          </View>

          {/* Day tab strip */}
          <View style={styles.dayTabRow}>
            {DAYS.map((day, i) => {
              const isActive = i === selectedDay;
              const date = new Date();
              // shift so Monday=0
              const diff = i - todayIndex;
              date.setDate(date.getDate() + diff);
              return (
                <Pressable
                  key={day}
                  style={[styles.dayTab, isActive && styles.dayTabActive]}
                  onPress={() => setSelectedDay(i)}
                >
                  <Text style={[styles.dayTabLabel, isActive && styles.dayTabLabelActive]}>{day}</Text>
                  <Text style={[styles.dayTabNumber, isActive && styles.dayTabNumberActive]}>{date.getDate()}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Classes list */}
          {dayClasses.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="calendar-outline" size={32} color={colors.inkFaint} />
              <Text style={styles.emptyText}>No classes on this day</Text>
            </View>
          ) : (
            dayClasses.map((c, i) => (
              <View key={c.id} style={styles.classCard}>
                <View style={[styles.classAccentBar, { backgroundColor: ACCENT_COLORS[i % ACCENT_COLORS.length] }]} />
                <View style={styles.classBody}>
                  <Text style={styles.classSubject}>{c.subject}</Text>
                  <Text style={styles.classLocation}>{c.location}</Text>
                  <View style={styles.classTimeRow}>
                    <Ionicons name="time-outline" size={12} color={colors.inkFaint} />
                    <Text style={styles.classTime}>{c.time} – {c.time_end}</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </Animated.View>
      </ScrollView>

      <BottomNav />
      <AddClassSheet
        visible={showAddClass}
        onClose={() => setShowAddClass(false)}
        onAdded={refreshClasses}
      />
    </View>
  );
}
