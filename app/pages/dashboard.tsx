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
    Platform,
    Modal,
    RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, router } from 'expo-router';
import { styles, colors, dashGamStyles, spacing } from '../styles/dashboard.styles';
import { WEEK_DAYS } from '../styles/welcome.styles';
import BottomNav from '../../components/BottomNav';
import { supabase } from '../../utils/supabase';
import { getStats, getEarnedBadges, ALL_BADGES, addXP } from '../../utils/gamification';
import { 
    registerForPushNotificationsAsync, 
    clearAllNotifications, 
    scheduleClassNotification, 
    scheduleTaskNotification 
} from '../../utils/notifications';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

// --- All data is pulled live from Supabase ---

const PRIORITY_COLOR: Record<string, string> = {
    high: colors.marigold,
    medium: colors.periwinkle,
    low: colors.sage,
};

// Streak milestones used to show "next goal" progress on the streak card.
const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100, 200, 365];

function getStreakMilestone(streak: number) {
    const next = STREAK_MILESTONES.find((m) => m > streak) ?? streak + 30;
    const prev = [...STREAK_MILESTONES].reverse().find((m) => m <= streak) ?? 0;
    const span = next - prev;
    const progress = span > 0 ? clamp((streak - prev) / span, 0, 1) : 1;
    return { next, progress };
}

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

    // --- Responsive breakpoints ---
    // Covers small phones (e.g. iPhone SE / compact Android) up through
    // tablets, on both iOS and Android, without hardcoding one device size.
    const isCompact = width < 380; // stat chips fold into a 2x2 grid
    const isTablet = width >= 700; // wider max content column + larger type
    const maxContentWidth = isTablet ? 680 : 560;
    const heroTitleSize = isTablet ? 28 : isCompact ? 22 : 25;

    const [userName, setUserName] = useState('');
    const [tasks, setTasks] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [classesToday, setClassesToday] = useState(0);
    const [streak, setStreak] = useState(0);
    const [level, setLevel] = useState(1);
    const [xp, setXp] = useState(0);
    const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
    const [totalCardsLearned, setTotalCardsLearned] = useState(0);
    const [showStatsModal, setShowStatsModal] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const tasksDueToday = tasks.filter((t) => !t.done).length;
    const tasksDone = tasks.filter((t) => t.done).length;
    const totalTasks = tasksDueToday + tasksDone;
    const tasksCompletionPct = totalTasks > 0 ? Math.round((tasksDone / totalTasks) * 100) : 0;

    // Fetch data from Supabase when the dashboard loads or comes into focus
    const fetchDashboardData = useCallback(async () => {
        // 1. Get current logged-in user
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
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
            const todayIdx = (new Date().getDay() + 6) % 7;
            const todayCount = classesData.filter(
                (c: any) => c.day === todayIdx || c.day === null || c.day === undefined
            ).length;
            setClassesToday(todayCount);
        }

        // 4. Load gamification stats
        const stats = await getStats();
        setStreak(stats.streak);
        setLevel(stats.level);
        setXp(stats.xp);
        setTotalCardsLearned(stats.totalCards);
        const badges = await getEarnedBadges();
        setEarnedBadges(badges);

        // 5. Schedule Notifications
        await registerForPushNotificationsAsync();
        await clearAllNotifications();

        const todayIdx = (new Date().getDay() + 6) % 7;
        if (classesData) {
            const todaysClasses = classesData.filter(
                (c: any) => c.day === todayIdx || c.day === null || c.day === undefined
            );
            todaysClasses.forEach((c: any) => {
                if (c.time) scheduleClassNotification(c.subject, c.location, c.time, todayIdx);
            });
        }
        if (tasksData) {
            tasksData.forEach((t: any) => {
                if (!t.done && t.due) scheduleTaskNotification(t.title, t.due);
            });
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchDashboardData();
        }, [fetchDashboardData])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchDashboardData();
        setRefreshing(false);
    }, [fetchDashboardData]);

    const refreshTasks = async () => {
        const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
        if (data) setTasks(data);
    };

    // Update task in state AND in Supabase Database
    const toggleTask = async (id: string, currentStatus: boolean) => {
        if (currentStatus) return; // Prevent unchecking

        // Optimistic UI update (feels instant to the user)
        setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: true } : t)));

        // Send update to database in background
        await supabase
            .from('tasks')
            .update({ done: true })
            .eq('id', id);
        
        // Add XP
        const { xp: newXp, level: newLevel } = await addXP(10);
        setXp(newXp);
        setLevel(newLevel);
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

    // Calculate urgent deadlines (tasks due within 3 days)
    const urgentTasks = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return tasks
            .filter((t) => !t.done && t.due)
            .map((t) => {
                const dueDate = new Date(t.due);
                dueDate.setHours(0, 0, 0, 0);
                const diffTime = dueDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return { ...t, daysLeft: diffDays };
            })
            .filter((t) => t.daysLeft >= 0 && t.daysLeft <= 3)
            .sort((a, b) => a.daysLeft - b.daysLeft);
    }, [tasks]);

    // Streak milestone progress — drives the little bar on the streak card
    // so "3 day streak" visibly means something instead of a bare number.
    const { next: nextMilestone, progress: milestoneProgress } = useMemo(
        () => getStreakMilestone(streak),
        [streak]
    );
    const daysToMilestone = Math.max(0, nextMilestone - streak);
    const streakEmoji = streak === 0 ? '😴' : streak >= 30 ? '🏆' : streak >= 7 ? '⚡' : streak >= 3 ? '🔥' : '✨';
    const streakMessage =
        streak === 0
            ? 'Review a deck today to start your streak'
            : `${daysToMilestone} day${daysToMilestone === 1 ? '' : 's'} to your ${nextMilestone}-day milestone`;

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
                                {/* Redesigned date: a small pill badge instead of plain caps text,
                                    so "today" reads as a distinct, glanceable chip. */}
                                <View style={styles.heroDateBadge}>
                                    <Ionicons name="calendar-outline" size={12} color={colors.marigold} />
                                    <Text
                                        style={styles.heroDateBadgeText}
                                        numberOfLines={1}
                                        adjustsFontSizeToFit
                                    >
                                        {getTodayLabel()}
                                    </Text>
                                </View>
                                <Text
                                    style={[styles.heroGreeting, { fontSize: heroTitleSize }]}
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                    minimumFontScale={0.8}
                                >
                                    {getGreeting()}{userName ? `, ${userName.split(' ')[0]}` : ''}
                                </Text>
                                <View style={styles.heroSubtitleRow}>
                                    <Text style={styles.heroSubtitle}>
                                        {tasksDueToday > 0
                                            ? `${tasksDueToday} task${tasksDueToday > 1 ? 's' : ''} due`
                                            : "You're all caught up"}
                                    </Text>
                                    {classesToday > 0 && (
                                        <>
                                            <View style={styles.heroSubtitleDot} />
                                            <Text style={styles.heroSubtitle}>
                                                {classesToday} class{classesToday > 1 ? 'es' : ''} today
                                            </Text>
                                        </>
                                    )}
                                </View>
                            </View>
                            <View style={styles.heroActions}>
                                <Pressable
                                    style={styles.heroIconButton}
                                    hitSlop={8}
                                    onPress={() => router.push('/pages/notifications' as any)}
                                >
                                    <Ionicons name="notifications-outline" size={18} color={colors.paper} />
                                    {tasksDueToday > 0 && <View style={styles.heroNotifDot} />}
                                </Pressable>
                                <Pressable onPress={() => router.push('/pages/profile' as any)} hitSlop={8}>
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

                        {/* Today's task progress — makes "pending vs done" legible
                            at a glance instead of two disconnected numbers. */}
                        {totalTasks > 0 && (
                            <View style={styles.heroProgressCard}>
                                <View style={styles.heroProgressTopRow}>
                                    <Text style={styles.heroProgressLabel}>
                                        {tasksDone} of {totalTasks} tasks done today
                                    </Text>
                                    <Text style={styles.heroProgressPct}>{tasksCompletionPct}%</Text>
                                </View>
                                <View style={styles.heroProgressTrack}>
                                    <View style={[styles.heroProgressFill, { width: `${tasksCompletionPct}%` }]} />
                                </View>
                            </View>
                        )}

                        {/* Compact summary pill to save vertical space */}
                        <Pressable 
                            style={styles.compactStatsPill}
                            onPress={() => setShowStatsModal(true)}
                        >
                            <View style={styles.compactStat}>
                                <Ionicons name="time-outline" size={14} color={colors.marigold} />
                                <Text style={styles.compactStatText}>{tasksDueToday}</Text>
                            </View>
                            <View style={styles.compactStatDivider} />
                            <View style={styles.compactStat}>
                                <Ionicons name="checkmark-circle-outline" size={14} color={colors.sage} />
                                <Text style={styles.compactStatText}>{tasksDone}</Text>
                            </View>
                            <View style={styles.compactStatDivider} />
                            <View style={styles.compactStat}>
                                <Ionicons name="calendar-outline" size={14} color={colors.periwinkle} />
                                <Text style={styles.compactStatText}>{classesToday}</Text>
                            </View>
                            <View style={styles.compactStatDivider} />
                            <View style={styles.compactStat}>
                                <Text style={{ fontSize: 13 }}>{streakEmoji}</Text>
                                <Text style={styles.compactStatText}>{streak}</Text>
                            </View>
                            <View style={styles.compactStatDivider} />
                            <Ionicons name="chevron-forward" size={14} color="rgba(251,247,239,0.5)" />
                        </Pressable>
                    </View>
                </Animated.View>

            <ScrollView
                style={{ flex: 1, marginTop: -40 }}
                contentContainerStyle={{ flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
                bounces={false}
                overScrollMode="never"
            >
                {/* --- CONTENT SHEET: floats up over the hero --- */}
                <Animated.View
                    style={[
                        styles.contentSheet,
                        { marginTop: 0, flex: 0 },
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

                        {/* ── Study Streak & Badges card — redesigned ── */}
                        <FadeInSection anim={sheetAnim}>
                            <Pressable
                                style={dashGamStyles.card}
                                onPress={() => router.push('/pages/decks/progress' as any)}
                                android_ripple={{ color: colors.border }}
                            >
                                <View style={dashGamStyles.cardTopRow}>
                                    {/* Left: Level badge (Replaced Streak to highlight XP) */}
                                    <View style={dashGamStyles.streakBlock}>
                                        <View style={dashGamStyles.streakBadge}>
                                            <Text style={dashGamStyles.streakEmoji}>⭐</Text>
                                        </View>
                                        <Text style={dashGamStyles.streakNum}>Lvl {level}</Text>
                                        <Text style={dashGamStyles.streakLabel}>
                                            {xp} / {level * 100} XP
                                        </Text>
                                    </View>

                                    <View style={dashGamStyles.divider} />

                                    {/* Right: earned badges preview */}
                                    <View style={dashGamStyles.badgesBlock}>
                                        <Text style={dashGamStyles.badgesTitle}>
                                            🏅 {earnedBadges.length} / {ALL_BADGES.length} Badges
                                        </Text>
                                        <View style={dashGamStyles.badgeRow}>
                                            {ALL_BADGES.slice(0, isCompact ? 4 : 5).map(b => (
                                                <Text
                                                    key={b.id}
                                                    style={[
                                                        dashGamStyles.badgeEmoji,
                                                        !earnedBadges.includes(b.id) && { opacity: 0.18 }
                                                    ]}
                                                >
                                                    {b.emoji}
                                                </Text>
                                            ))}
                                            {ALL_BADGES.length > (isCompact ? 4 : 5) && (
                                                <Text style={dashGamStyles.badgeMore}>
                                                    +{ALL_BADGES.length - (isCompact ? 4 : 5)}
                                                </Text>
                                            )}
                                        </View>
                                        <Text style={dashGamStyles.cardsSub}>{totalCardsLearned} cards reviewed</Text>
                                    </View>

                                    <View style={dashGamStyles.chevronWrap}>
                                        <Ionicons name="chevron-forward" size={16} color={colors.inkFaint} />
                                    </View>
                                </View>

                                {/* Milestone progress — turns the streak into a visible
                                    goal instead of a static number that never explains
                                    itself. */}
                                <View style={dashGamStyles.milestoneRow}>
                                    <View style={dashGamStyles.milestoneTextRow}>
                                        <Text style={dashGamStyles.milestoneText} numberOfLines={1}>
                                            {streakMessage}
                                        </Text>
                                        {streak > 0 && (
                                            <Text style={dashGamStyles.milestoneTextStrong}>{nextMilestone}d</Text>
                                        )}
                                    </View>
                                    <View style={dashGamStyles.milestoneTrack}>
                                        <View
                                            style={[
                                                dashGamStyles.milestoneFill,
                                                { width: `${Math.round(milestoneProgress * 100)}%` },
                                            ]}
                                        />
                                    </View>
                                </View>
                            </Pressable>
                        </FadeInSection>

                        {/* Today's schedule */}
                        <FadeInSection anim={scheduleAnim}>
                            <View style={styles.sectionRow}>
                                <Text style={styles.sectionTitle}>Today's Schedule</Text>
                                <Pressable onPress={() => router.push('/pages/schedule' as any)} hitSlop={8}>
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
                                        android_ripple={{ color: colors.border }}
                                    >
                                        <View style={styles.scheduleAccentBar} />
                                        <View style={styles.scheduleBody}>
                                            <View style={styles.scheduleTimeCol}>
                                                <Text style={styles.scheduleTime}>{c.time}</Text>
                                                <Text style={styles.scheduleTimeEnd}>{c.time_end}</Text>
                                            </View>
                                            <View style={styles.scheduleInfoCol}>
                                                <Text style={styles.scheduleSubject} numberOfLines={1}>{c.subject}</Text>
                                                <Text style={styles.scheduleLocation} numberOfLines={1}>{c.location}</Text>
                                            </View>
                                            <Ionicons name="chevron-forward" size={18} color={colors.inkFaint} />
                                        </View>
                                    </Pressable>
                                ))
                            )}
                        </FadeInSection>

                        {/* Upcoming tasks */}
                        <FadeInSection anim={tasksAnim}>
                            {/* --- Urgent Deadlines Widget --- */}
                            {urgentTasks.length > 0 && (
                                <View style={{ marginTop: 8, marginBottom: spacing.md }}>
                                    <View style={styles.sectionRow}>
                                        <Text style={styles.sectionTitle}>Urgent Deadlines</Text>
                                    </View>
                                    {urgentTasks.map((t) => {
                                        let urgencyText = '';
                                        let iconName: any = 'alert-circle';
                                        
                                        if (t.daysLeft === 0) {
                                            urgencyText = '🔥 Due Today!';
                                            iconName = 'flame';
                                        } else if (t.daysLeft === 1) {
                                            urgencyText = '⚠️ Due Tomorrow';
                                            iconName = 'warning';
                                        } else {
                                            urgencyText = `⏳ ${t.daysLeft} Days Left`;
                                            iconName = 'hourglass';
                                        }

                                        return (
                                            <Pressable
                                                key={`urgent-${t.id}`}
                                                onPress={() => toggleTask(t.id, t.done)}
                                                style={styles.urgentCard}
                                                android_ripple={{ color: '#FCA5A5' }}
                                            >
                                                <View style={styles.urgentIconWrap}>
                                                    <Ionicons name={iconName} size={22} color="#DC2626" />
                                                </View>
                                                <View style={styles.urgentInfoCol}>
                                                    <Text style={styles.urgentTitle} numberOfLines={1}>{t.title}</Text>
                                                    <View style={styles.urgentMetaRow}>
                                                        <Text style={styles.urgentMetaText}>{urgencyText}</Text>
                                                    </View>
                                                </View>
                                                <Ionicons name="checkmark-circle-outline" size={24} color="#FCA5A5" />
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            )}

                            <View style={[styles.sectionRow, { marginTop: urgentTasks.length > 0 ? 0 : 8 }]}>
                                <Text style={styles.sectionTitle}>Upcoming Tasks</Text>
                                <Pressable onPress={() => router.push('/pages/tasks' as any)} hitSlop={8}>
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
                                        android_ripple={{ color: colors.border }}
                                    >
                                        <View style={[styles.checkbox, t.done && styles.checkboxChecked]}>
                                            {t.done && <Ionicons name="checkmark" size={14} color={colors.paper} />}
                                        </View>
                                        <View style={styles.taskInfoCol}>
                                            <Text style={[styles.taskTitle, t.done && styles.taskTitleDone]} numberOfLines={1}>
                                                {t.title}
                                            </Text>
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

            {/* --- Stats Modal --- */}
            <Modal
                visible={showStatsModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowStatsModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Daily Overview</Text>
                            <Pressable onPress={() => setShowStatsModal(false)} hitSlop={10}>
                                <Ionicons name="close" size={24} color={colors.ink} />
                            </Pressable>
                        </View>
                        
                        <View style={[styles.heroStatsRow, { marginTop: 0 }]}>
                            <View style={[styles.heroStatChip, !isTablet && { flexBasis: '47%' }, styles.modalStatChip]}>
                                <View style={[styles.heroStatIconWrap, { backgroundColor: 'rgba(232,162,61,0.18)' }]}>
                                    <Ionicons name="time-outline" size={14} color={colors.marigold} />
                                </View>
                                <Text style={[styles.heroStatNumber, { color: colors.ink }]}>{tasksDueToday}</Text>
                                <Text style={[styles.heroStatLabel, { color: colors.inkSoft }]}>Pending</Text>
                            </View>
                            <View style={[styles.heroStatChip, !isTablet && { flexBasis: '47%' }, styles.modalStatChip]}>
                                <View style={[styles.heroStatIconWrap, { backgroundColor: 'rgba(63,143,134,0.2)' }]}>
                                    <Ionicons name="checkmark-circle-outline" size={14} color={colors.sage} />
                                </View>
                                <Text style={[styles.heroStatNumber, { color: colors.ink }]}>{tasksDone}</Text>
                                <Text style={[styles.heroStatLabel, { color: colors.inkSoft }]}>Done</Text>
                            </View>
                            <View style={[styles.heroStatChip, !isTablet && { flexBasis: '47%' }, styles.modalStatChip]}>
                                <View style={[styles.heroStatIconWrap, { backgroundColor: 'rgba(108,123,209,0.2)' }]}>
                                    <Ionicons name="calendar-outline" size={14} color={colors.periwinkle} />
                                </View>
                                <Text style={[styles.heroStatNumber, { color: colors.ink }]}>{classesToday}</Text>
                                <Text style={[styles.heroStatLabel, { color: colors.inkSoft }]}>Classes today</Text>
                            </View>
                            <View style={[styles.heroStatChip, !isTablet && { flexBasis: '47%' }, styles.modalStatChip]}>
                                <View style={[styles.heroStatIconWrap, { backgroundColor: 'rgba(232,162,61,0.18)' }]}>
                                    <Text style={{ fontSize: 13 }}>{streakEmoji}</Text>
                                </View>
                                <Text style={[styles.heroStatNumber, { color: colors.ink }]}>{streak}</Text>
                                <Text style={[styles.heroStatLabel, { color: colors.inkSoft }]}>Day Streak</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}