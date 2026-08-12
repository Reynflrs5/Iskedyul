import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    View,
    Text,
    Pressable,
    ScrollView,
    StatusBar,
    Animated,
    Easing,
    useWindowDimensions,
    Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, router } from 'expo-router';
import { styles, colors } from '../styles/dashboard.styles';
import { WEEK_DAYS } from '../styles/welcome.styles';
import BottomNav from '../../components/BottomNav';
import { supabase } from '../../utils/supabase';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

// --- All data is pulled live from Supabase ---

const PRIORITY_COLOR: Record<string, string> = {
    high: colors.marigold,
    medium: colors.periwinkle,
    low: colors.sage,
};

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
}

function getTodayLabel() {
    return new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    });
}

// A small fade+slide wrapper so every section shares the same entrance
// motion without repeating the same three Animated props everywhere.
function FadeInSection({
    anim,
    children,
}: {
    anim: Animated.Value;
    children: React.ReactNode;
}) {
    return (
        <Animated.View
            style={{
                opacity: anim,
                transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
            }}
        >
            {children}
        </Animated.View>
    );
}

export default function DashboardScreen() {
    const { width } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const horizontalPadding = clamp(width * 0.06, 18, 32);
    const maxContentWidth = 560;

    const [userName, setUserName] = useState('');
    const [tasks, setTasks] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [classesToday, setClassesToday] = useState(0);

    const tasksDueToday = tasks.filter((t) => !t.done).length;
    const tasksDone = tasks.filter((t) => t.done).length;

    // Fetch data from Supabase when the dashboard loads or comes into focus
    useFocusEffect(
        useCallback(() => {
            async function fetchDashboardData() {
                // 1. Get current logged-in user
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    // The full name was saved in user metadata during signup
                    setUserName(user.user_metadata?.full_name || '');
                }

                // 2. Fetch Tasks from Supabase
                const { data: tasksData } = await supabase
                    .from('tasks')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (tasksData) setTasks(tasksData);

                // 3. Fetch Classes from Supabase
                const { data: classesData } = await supabase
                    .from('classes')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (classesData) {
                    setClasses(classesData);
                    // Count classes that match today's day index (0=Mon…6=Sun)
                    const todayIdx = (new Date().getDay() + 6) % 7;
                    const todayCount = classesData.filter(
                        (c: any) => c.day === todayIdx || c.day === null || c.day === undefined
                    ).length;
                    setClassesToday(todayCount);
                }
            }

            fetchDashboardData();
        }, [])
    );

    const refreshTasks = async () => {
        const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
        if (data) setTasks(data);
    };

    // Update task in state AND in Supabase Database
    const toggleTask = async (id: string, currentStatus: boolean) => {
        // Optimistic UI update (feels instant to the user)
        setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !currentStatus } : t)));

        // Send update to database in background
        await supabase
            .from('tasks')
            .update({ done: !currentStatus })
            .eq('id', id);
    };

    const confirmDeleteTask = (id: string, title: string) => {
        Alert.alert('Delete Task', `Are you sure you want to delete "${title}"?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    setTasks((prev) => prev.filter((t) => t.id !== id));
                    await supabase.from('tasks').delete().eq('id', id);
                },
            },
        ]);
    };

    const confirmDeleteClass = (id: string, subject: string) => {
        Alert.alert('Delete Class', `Are you sure you want to delete "${subject}"?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    setClasses((prev) => prev.filter((c) => c.id !== id));
                    setClassesToday((prev) => Math.max(0, prev - 1));
                    await supabase.from('classes').delete().eq('id', id);
                },
            },
        ]);
    };

    const todayIndex = useMemo(() => (new Date().getDay() + 6) % 7, []);

    const todaysClasses = useMemo(() => {
        return classes.filter(
            (c) => c.day === todayIndex || c.day === null || c.day === undefined
        );
    }, [classes, todayIndex]);

    // --- Staggered entrance ---
    const heroAnim = useRef(new Animated.Value(0)).current;
    const sheetAnim = useRef(new Animated.Value(0)).current;
    const scheduleAnim = useRef(new Animated.Value(0)).current;
    const tasksAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.stagger(100, [
            Animated.timing(heroAnim, { toValue: 1, duration: 460, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.timing(sheetAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.timing(scheduleAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.timing(tasksAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]).start();
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.ink} />

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* --- HERO: elevated dark panel, greeting + week + quick stats --- */}
                <Animated.View
                    style={[
                        styles.hero,
                        {
                            paddingTop: insets.top + 16,
                            paddingHorizontal: horizontalPadding,
                            opacity: heroAnim,
                            transform: [
                                { translateY: heroAnim.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) },
                            ],
                        },
                    ]}
                >
                    {/* Faint decorative ring — texture, not clutter */}
                    <View
                        style={[
                            styles.heroAccentRing,
                            { width: width * 0.9, height: width * 0.9, top: -width * 0.55, right: -width * 0.4 },
                        ]}
                    />

                    <View style={{ width: '100%', maxWidth: maxContentWidth, alignSelf: 'center' }}>
                        <View style={styles.heroTopRow}>
                            <View style={styles.heroGreetingCol}>
                                <Text style={styles.heroEyebrow}>{getTodayLabel()}</Text>
                                <Text style={styles.heroGreeting}>
                                    {getGreeting()}{userName ? `, ${userName.split(' ')[0]}` : ''}
                                </Text>
                                <Text style={styles.heroSubtitle}>
                                    {tasksDueToday > 0
                                        ? `You have ${tasksDueToday} task${tasksDueToday > 1 ? 's' : ''} due`
                                        : "You're all caught up"}
                                </Text>
                            </View>
                            <View style={styles.heroActions}>
                                <Pressable
                                  style={styles.heroIconButton}
                                  onPress={() => {
                                    const pendingCount = tasks.filter((t) => !t.done).length;
                                    Alert.alert(
                                      '🔔 Notifications',
                                      pendingCount > 0
                                        ? `You have ${pendingCount} pending task${pendingCount > 1 ? 's' : ''}.`
                                        : 'No pending notifications.',
                                      [{ text: 'OK' }]
                                    );
                                  }}
                                >
                                    <Ionicons name="notifications-outline" size={18} color={colors.paper} />
                                </Pressable>
                                <Pressable onPress={() => router.push('/pages/profile' as any)}>
                                  <View style={[styles.avatar, { width: 40, height: 40 }]}>
                                      <Text style={styles.avatarText}>{userName ? userName.charAt(0).toUpperCase() : '?'}</Text>
                                  </View>
                                </Pressable>
                            </View>
                        </View>

                        {/* Mini week strip, on-dark colors */}
                        <View style={styles.heroWeekRow}>
                            {WEEK_DAYS.map((day, i) => {
                                const isToday = i === todayIndex;
                                return (
                                    <View key={i} style={styles.heroWeekBarTrack}>
                                        <View
                                            style={[
                                                styles.heroWeekBar,
                                                {
                                                    height: Math.max(6, day.height * 0.4),
                                                    backgroundColor: isToday ? colors.marigold : 'rgba(251,247,239,0.3)',
                                                },
                                            ]}
                                        />
                                        <Text style={[styles.heroWeekLabel, isToday && { color: colors.marigold, fontWeight: '700' }]}>
                                            {day.label}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>

                        {/* Quick stats, on-dark chips */}
                        <View style={styles.heroStatsRow}>
                            <View style={styles.heroStatChip}>
                                <View style={[styles.heroStatIconWrap, { backgroundColor: 'rgba(232,162,61,0.18)' }]}>
                                    <Ionicons name="time-outline" size={14} color={colors.marigold} />
                                </View>
                                <Text style={styles.heroStatNumber}>{tasksDueToday}</Text>
                                <Text style={styles.heroStatLabel}>Pending</Text>
                            </View>
                            <View style={styles.heroStatChip}>
                                <View style={[styles.heroStatIconWrap, { backgroundColor: 'rgba(63,143,134,0.2)' }]}>
                                    <Ionicons name="checkmark-circle-outline" size={14} color={colors.sage} />
                                </View>
                                <Text style={styles.heroStatNumber}>{tasksDone}</Text>
                                <Text style={styles.heroStatLabel}>Done</Text>
                            </View>
                            <View style={styles.heroStatChip}>
                                <View style={[styles.heroStatIconWrap, { backgroundColor: 'rgba(108,123,209,0.2)' }]}>
                                    <Ionicons name="calendar-outline" size={14} color={colors.periwinkle} />
                                </View>
                                <Text style={styles.heroStatNumber}>{classesToday}</Text>
                                <Text style={styles.heroStatLabel}>Classes today</Text>
                            </View>
                        </View>
                    </View>
                </Animated.View>

                {/* --- CONTENT SHEET: floats up over the hero --- */}
                <Animated.View
                    style={[
                        styles.contentSheet,
                        {
                            opacity: sheetAnim,
                            transform: [
                                { translateY: sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) },
                            ],
                            paddingHorizontal: horizontalPadding,
                            paddingBottom: insets.bottom + 100, // clears BottomNav
                        },
                    ]}
                >
                    <View style={{ width: '100%', maxWidth: maxContentWidth, alignSelf: 'center' }}>
                        {/* Today's schedule */}
                        <FadeInSection anim={scheduleAnim}>
                            <View style={styles.sectionRow}>
                                <Text style={styles.sectionTitle}>Today's Schedule</Text>
                                <Pressable onPress={() => router.push('/pages/schedule' as any)}>
                                    <Text style={styles.sectionLink}>See all</Text>
                                </Pressable>
                            </View>

                            {todaysClasses.length === 0 ? (
                                <View style={styles.emptyCard}>
                                    <Text style={styles.emptyText}>No classes today — enjoy the free time</Text>
                                </View>
                            ) : (
                                todaysClasses.map((c) => (
                                    <Pressable
                                        key={c.id}
                                        style={styles.scheduleCard}
                                        onLongPress={() => confirmDeleteClass(c.id, c.subject)}
                                        delayLongPress={400}
                                    >
                                        <View style={styles.scheduleAccentBar} />
                                        <View style={styles.scheduleBody}>
                                            <View style={styles.scheduleTimeCol}>
                                                <Text style={styles.scheduleTime}>{c.time}</Text>
                                                <Text style={styles.scheduleTimeEnd}>{c.time_end}</Text>
                                            </View>
                                            <View style={styles.scheduleInfoCol}>
                                                <Text style={styles.scheduleSubject}>{c.subject}</Text>
                                                <Text style={styles.scheduleLocation}>{c.location}</Text>
                                            </View>
                                            <Ionicons name="chevron-forward" size={18} color={colors.inkFaint} />
                                        </View>
                                    </Pressable>
                                ))
                            )}
                        </FadeInSection>

                        {/* Upcoming tasks */}
                        <FadeInSection anim={tasksAnim}>
                            <View style={[styles.sectionRow, { marginTop: 8 }]}>
                                <Text style={styles.sectionTitle}>Upcoming Tasks</Text>
                                <Pressable onPress={() => router.push('/pages/decks' as any)}>
                                    <Text style={styles.sectionLink}>See all</Text>
                                </Pressable>
                            </View>

                            {tasks.length === 0 ? (
                                <View style={styles.emptyCard}>
                                    <Text style={styles.emptyText}>No tasks yet — tap + to add one</Text>
                                </View>
                            ) : (
                                tasks.map((t) => (
                                    <Pressable
                                        key={t.id}
                                        onPress={() => toggleTask(t.id, t.done)}
                                        onLongPress={() => confirmDeleteTask(t.id, t.title)}
                                        delayLongPress={400}
                                        style={styles.taskRow}
                                    >
                                        <View style={[styles.checkbox, t.done && styles.checkboxChecked]}>
                                            {t.done && <Ionicons name="checkmark" size={14} color={colors.paper} />}
                                        </View>
                                        <View style={styles.taskInfoCol}>
                                            <Text style={[styles.taskTitle, t.done && styles.taskTitleDone]}>{t.title}</Text>
                                            <View style={styles.taskMetaRow}>
                                                <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLOR[t.priority] }]} />
                                                <Text style={styles.taskMetaText}>{t.due}</Text>
                                            </View>
                                        </View>
                                    </Pressable>
                                ))
                            )}
                        </FadeInSection>
                    </View>
                </Animated.View>
            </ScrollView>

            <BottomNav />
        </View>
    );
}