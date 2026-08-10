import { useEffect, useMemo, useRef, useState } from 'react';
import {
    View,
    Text,
    Pressable,
    ScrollView,
    StatusBar,
    Animated,
    Easing,
    useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { styles, colors } from '../styles/dashboard.styles';
import { styles as welcomeStyles, WEEK_DAYS } from '../styles/welcome.styles';
import BottomNav from '../../components/BottomNav';
import { supabase } from '../../utils/supabase';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

// --- We removed the mock data! The app now pulls directly from Supabase ---

const STUDY_STREAK_DAYS = 6;
const FLASHCARD_DECKS = 4;

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
    delayDriven,
    children,
}: {
    anim: Animated.Value;
    delayDriven?: boolean;
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

    const [userName, setUserName] = useState('Student');
    const [tasks, setTasks] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);

    const tasksDueToday = tasks.filter((t) => !t.done).length;

    // Fetch data from Supabase when the dashboard loads
    useEffect(() => {
        async function fetchDashboardData() {
            // 1. Get current logged-in user
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // The full name was saved in user metadata during signup
                setUserName(user.user_metadata?.full_name || 'Student');
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

            if (classesData) setClasses(classesData);
        }

        fetchDashboardData();
    }, []);

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

    const todayIndex = useMemo(() => (new Date().getDay() + 6) % 7, []);

    // --- Staggered entrance, same rhythm as welcome/login ---
    const headerAnim = useRef(new Animated.Value(0)).current;
    const weekAnim = useRef(new Animated.Value(0)).current;
    const statsAnim = useRef(new Animated.Value(0)).current;
    const scheduleAnim = useRef(new Animated.Value(0)).current;
    const tasksAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.stagger(90, [
            Animated.timing(headerAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.timing(weekAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.timing(statsAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.timing(scheduleAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.timing(tasksAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]).start();
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.paper} />

            {/* Subtle reuse of the app's ambient rule-lines, toned down so it
          doesn't compete with dashboard content. */}
            <View style={welcomeStyles.backgroundLayer} pointerEvents="none">
                <View
                    style={[
                        welcomeStyles.blob,
                        {
                            width: width * 0.8,
                            height: width * 0.8,
                            borderRadius: width * 0.4,
                            backgroundColor: colors.periwinkleSoft,
                            opacity: 0.3,
                            top: -width * 0.55,
                            right: -width * 0.35,
                        },
                    ]}
                />
            </View>

            <ScrollView
                contentContainerStyle={[
                    styles.scrollContent,
                    {
                        paddingHorizontal: horizontalPadding,
                        paddingTop: insets.top + 16,
                        paddingBottom: insets.bottom + 100, // Extra padding for BottomNav
                        width: '100%',
                        maxWidth: maxContentWidth,
                        alignSelf: 'center',
                    },
                ]}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <FadeInSection anim={headerAnim}>
                    <View style={styles.headerRow}>
                        <View style={styles.greetingCol}>
                            <Text style={styles.eyebrow}>{getTodayLabel()}</Text>
                            <Text style={styles.greetingText}>
                                {getGreeting()}, {userName.split(' ')[0]}
                            </Text>
                            <Text style={styles.dateText}>
                                {tasksDueToday > 0
                                    ? `You have ${tasksDueToday} task${tasksDueToday > 1 ? 's' : ''} due`
                                    : "You're all caught up"}
                            </Text>
                        </View>
                        <View style={[styles.avatar, { width: 46, height: 46 }]}>
                            <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
                        </View>
                    </View>
                </FadeInSection>

                {/* Mini week strip */}
                <FadeInSection anim={weekAnim}>
                    <View style={{ marginTop: 20, marginBottom: 4 }}>
                        <View style={[welcomeStyles.weekStripRow, { height: 34, marginTop: 0, marginBottom: 4 }]}>
                            {WEEK_DAYS.map((day, i) => {
                                const isToday = i === todayIndex;
                                return (
                                    <View key={i} style={[welcomeStyles.weekStripBarTrack, { height: 34 }]}>
                                        <View
                                            style={[
                                                welcomeStyles.weekStripBar,
                                                {
                                                    height: Math.max(8, day.height * 0.55),
                                                    backgroundColor: isToday ? colors.marigold : colors.periwinkle,
                                                    opacity: isToday ? 1 : 0.4,
                                                },
                                            ]}
                                        />
                                    </View>
                                );
                            })}
                        </View>
                        <View style={welcomeStyles.weekStripLabelRow}>
                            {WEEK_DAYS.map((day, i) => (
                                <Text
                                    key={i}
                                    style={[
                                        welcomeStyles.weekStripLabel,
                                        i === todayIndex && { color: colors.marigoldInk, fontWeight: '700' },
                                    ]}
                                >
                                    {day.label}
                                </Text>
                            ))}
                        </View>
                    </View>
                </FadeInSection>

                {/* Stats */}
                <FadeInSection anim={statsAnim}>
                    <View style={[styles.statsRow, { marginTop: 12, marginBottom: 24 }]}>
                        <View style={styles.statCard}>
                            <View style={[styles.statIconWrap, { backgroundColor: colors.marigoldSoft }]}>
                                <Ionicons name="flame" size={18} color={colors.marigold} />
                            </View>
                            <Text style={styles.statNumber}>{STUDY_STREAK_DAYS}</Text>
                            <Text style={styles.statLabel}>Day streak</Text>
                        </View>
                        <View style={styles.statCard}>
                            <View style={[styles.statIconWrap, { backgroundColor: colors.periwinkleSoft }]}>
                                <Ionicons name="checkbox-outline" size={18} color={colors.periwinkle} />
                            </View>
                            <Text style={styles.statNumber}>{tasksDueToday}</Text>
                            <Text style={styles.statLabel}>Tasks due</Text>
                        </View>
                        <View style={styles.statCard}>
                            <View style={[styles.statIconWrap, { backgroundColor: colors.sageSoft }]}>
                                <Ionicons name="layers-outline" size={18} color={colors.sage} />
                            </View>
                            <Text style={styles.statNumber}>{FLASHCARD_DECKS}</Text>
                            <Text style={styles.statLabel}>Decks</Text>
                        </View>
                    </View>
                </FadeInSection>

                {/* Today's schedule */}
                <FadeInSection anim={scheduleAnim}>
                    <View style={styles.sectionRow}>
                        <Text style={styles.sectionTitle}>Today's Schedule</Text>
                        <Pressable>
                            <Text style={styles.sectionLink}>See all</Text>
                        </Pressable>
                    </View>

                    {classes.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Text style={styles.emptyText}>No classes today — enjoy the free time</Text>
                        </View>
                    ) : (
                        classes.map((c) => (
                            <View key={c.id} style={styles.scheduleCard}>
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
                            </View>
                        ))
                    )}
                </FadeInSection>

                {/* Upcoming tasks */}
                <FadeInSection anim={tasksAnim}>
                    <View style={[styles.sectionRow, { marginTop: 8 }]}>
                        <Text style={styles.sectionTitle}>Upcoming Tasks</Text>
                        <Pressable>
                            <Text style={styles.sectionLink}>See all</Text>
                        </Pressable>
                    </View>

                    {tasks.map((t) => (
                        <Pressable key={t.id} onPress={() => toggleTask(t.id, t.done)} style={styles.taskRow}>
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
                    ))}
                </FadeInSection>
            </ScrollView>
            <BottomNav />
        </View>
    );
}