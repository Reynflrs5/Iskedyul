import { Platform, StyleSheet } from 'react-native';
import { colors, type, spacing, radius, shadows } from './welcome.styles';

export { colors, type, spacing, radius, shadows };

// Small cross-platform shadow helper so new elements look right on both
// iOS (shadow*) and Android (elevation) without depending on whatever
// `shadows.soft` happens to contain.
const platformCard = Platform.select({
    ios: {
        shadowColor: '#1A1A1A',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
    },
    android: { elevation: 2 },
    default: {},
});

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.ink, // hero sits flush at the very top, no seam
    },
    scrollContent: {
        flexGrow: 1,
    },

    // --- Hero panel (dark, elevated) ---
    hero: {
        backgroundColor: colors.ink,
        paddingBottom: 64,
        overflow: 'hidden',
    },
    heroAccentRing: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: colors.marigold,
        opacity: 0.08,
    },
    heroTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    heroGreetingCol: {
        flex: 1,
        paddingRight: spacing.md,
    },

    // --- Redesigned date badge (replaces the plain eyebrow text) ---
    heroDateBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 6,
        backgroundColor: 'rgba(232,162,61,0.14)',
        borderWidth: 1,
        borderColor: 'rgba(232,162,61,0.28)',
        borderRadius: radius.pill,
        paddingVertical: 5,
        paddingHorizontal: 10,
        marginBottom: spacing.xs,
    },
    heroDateBadgeText: {
        ...type.overline,
        fontSize: 11,
        letterSpacing: 0.4,
        color: colors.marigold,
    },
    heroGreeting: {
        ...type.h1,
        fontSize: 25,
        color: colors.paper,
    },
    heroSubtitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 3,
    },
    heroSubtitle: {
        ...type.body,
        fontSize: 14,
        color: 'rgba(251,247,239,0.65)',
    },
    heroSubtitleDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(251,247,239,0.35)',
    },
    heroActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    heroIconButton: {
        width: 40,
        height: 40,
        borderRadius: radius.pill,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroNotifDot: {
        position: 'absolute',
        top: 8,
        right: 9,
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: colors.marigold,
        borderWidth: 1.5,
        borderColor: colors.ink,
    },
    avatar: {
        borderRadius: radius.pill,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.25)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        ...type.label,
        color: colors.paper,
        fontSize: 16,
    },

    // --- Hero mini week strip ---
    heroWeekRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginTop: spacing.lg,
    },
    heroWeekBarTrack: {
        alignItems: 'center',
        justifyContent: 'flex-end',
        flex: 1,
        height: 30,
    },
    heroWeekBar: {
        width: 5,
        borderRadius: 3,
    },
    heroWeekLabel: {
        ...type.dayLetter,
        fontSize: 10,
        color: 'rgba(251,247,239,0.45)',
        marginTop: 6,
    },

    // --- Today's task progress bar (new) ---
    heroProgressCard: {
        marginTop: spacing.lg,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: radius.md,
        padding: spacing.sm,
    },
    heroProgressTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    heroProgressLabel: {
        ...type.label,
        fontSize: 12.5,
        color: 'rgba(251,247,239,0.85)',
    },
    heroProgressPct: {
        ...type.label,
        fontSize: 12.5,
        color: colors.marigold,
    },
    heroProgressTrack: {
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.12)',
        overflow: 'hidden',
    },
    heroProgressFill: {
        height: '100%',
        borderRadius: 3,
        backgroundColor: colors.marigold,
    },

    // --- Compact Stats Pill ---
    compactStatsPill: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: radius.pill,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        marginTop: spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    compactStat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    compactStatText: {
        ...type.label,
        fontSize: 14,
        color: colors.paper,
    },
    compactStatDivider: {
        width: 1,
        height: 16,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },

    // --- Modal Styles ---
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(19,42,76,0.6)', // dark ink overlay
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.paper,
        borderTopLeftRadius: radius.xl,
        borderTopRightRadius: radius.xl,
        padding: spacing.lg,
        paddingBottom: spacing.xxl, // extra padding for bottom safe area
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    modalTitle: {
        ...type.h1,
        fontSize: 22,
        color: colors.ink,
    },
    modalStatChip: {
        backgroundColor: colors.paperRaised,
        borderColor: colors.border,
        ...shadows.soft,
    },

    // --- Hero stat chips (responsive grid: 4-across on wide screens,
    // 2x2 on narrow phones) ---
    heroStatsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        marginTop: spacing.sm,
    },
    heroStatChip: {
        flexGrow: 1,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: radius.md,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.sm,
        alignItems: 'flex-start',
        gap: 4,
    },
    heroStatIconWrap: {
        width: 28,
        height: 28,
        borderRadius: radius.sm,
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroStatNumber: {
        ...type.h1,
        fontSize: 19,
        color: colors.paper,
    },
    heroStatLabel: {
        ...type.caption,
        fontSize: 10.5,
        color: 'rgba(251,247,239,0.6)',
    },

    // --- Content sheet (floats up over the hero) ---
    contentSheet: {
        flex: 1,
        backgroundColor: colors.paper,
        borderTopLeftRadius: radius.lg + 6,
        borderTopRightRadius: radius.lg + 6,
        marginTop: -40,
        paddingTop: spacing.lg,
        ...shadows.cta,
        shadowOpacity: 0.12,
    },

    // --- Section headers ---
    sectionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    sectionTitle: {
        ...type.h2,
        color: colors.ink,
    },
    sectionLink: {
        ...type.label,
        fontSize: 13,
        color: colors.ink,
        textDecorationLine: 'underline',
        textDecorationColor: colors.marigold,
    },

    // --- Today's schedule cards ---
    scheduleCard: {
        flexDirection: 'row',
        alignItems: 'stretch',
        backgroundColor: colors.paperRaised,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.sm,
        overflow: 'hidden',
        ...shadows.soft,
    },
    scheduleAccentBar: {
        width: 4,
        backgroundColor: colors.periwinkle,
    },
    scheduleBody: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
    },
    scheduleTimeCol: {
        width: 64,
    },
    scheduleTime: {
        ...type.label,
        fontSize: 13,
        color: colors.ink,
    },
    scheduleTimeEnd: {
        ...type.caption,
        color: colors.inkFaint,
    },
    scheduleInfoCol: {
        flex: 1,
    },
    scheduleSubject: {
        ...type.label,
        fontSize: 15,
        color: colors.ink,
    },
    scheduleLocation: {
        ...type.caption,
        color: colors.inkSoft,
        marginTop: 2,
    },

    // --- Task rows ---
    taskRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.paperRaised,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.sm,
        gap: spacing.sm,
        ...shadows.soft,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: radius.pill,
        borderWidth: 1.5,
        borderColor: colors.borderStrong,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: colors.sage,
        borderColor: colors.sage,
    },
    taskInfoCol: {
        flex: 1,
    },
    taskTitle: {
        ...type.body,
        fontSize: 15,
        color: colors.ink,
        fontWeight: '500',
    },
    taskTitleDone: {
        color: colors.inkFaint,
        textDecorationLine: 'line-through',
    },
    taskMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xxs,
        marginTop: 3,
    },
    priorityDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    taskMetaText: {
        ...type.caption,
        color: colors.inkSoft,
    },

    emptyCard: {
        backgroundColor: colors.paperRaised,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        borderStyle: 'dashed',
        paddingVertical: spacing.lg,
        alignItems: 'center',
    },
    emptyText: {
        ...type.body,
        fontSize: 13,
        color: colors.inkFaint,
    },
    
    // --- Urgent Deadlines Widget ---
    urgentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF4F2', // very faint red/orange tint
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: '#FCA5A5',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.sm,
        gap: spacing.md,
        ...shadows.soft,
    },
    urgentIconWrap: {
        width: 40, height: 40,
        borderRadius: 20,
        backgroundColor: '#FEE2E2',
        alignItems: 'center', justifyContent: 'center',
    },
    urgentInfoCol: {
        flex: 1,
    },
    urgentTitle: {
        ...type.label,
        fontSize: 15,
        color: '#991B1B', // Dark red
    },
    urgentMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    urgentMetaText: {
        ...type.caption,
        color: '#DC2626',
        fontWeight: '700',
    },
});

// --- Streak & badges card (exported separately so dashboard.tsx keeps a
// single import for all its styling, same pattern as before) ---
export const dashGamStyles = StyleSheet.create({
    card: {
        backgroundColor: colors.paperRaised,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.md,
        marginBottom: spacing.md,
        ...platformCard,
    },
    cardTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    streakBlock: {
        alignItems: 'center',
        minWidth: 66,
        gap: 2,
    },
    streakBadge: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(232,162,61,0.14)',
        borderWidth: 1.5,
        borderColor: 'rgba(232,162,61,0.35)',
        marginBottom: 4,
    },
    streakEmoji: { fontSize: 22 },
    streakNum: { ...type.h1, fontSize: 22, color: colors.ink, lineHeight: 26 },
    streakLabel: { ...type.caption, color: colors.inkSoft, fontSize: 10 },
    divider: {
        width: 1,
        alignSelf: 'stretch',
        backgroundColor: colors.border,
    },
    badgesBlock: {
        flex: 1,
        gap: 4,
        minWidth: 0,
    },
    badgesTitle: { ...type.label, color: colors.ink, fontSize: 13 },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        flexWrap: 'wrap',
    },
    badgeEmoji: { fontSize: 20 },
    badgeMore: { ...type.caption, color: colors.inkSoft, fontSize: 11, marginLeft: 2 },
    cardsSub: { ...type.caption, color: colors.inkFaint, fontSize: 10 },
    chevronWrap: {
        marginLeft: spacing.xs,
    },

    // Milestone progress footer
    milestoneRow: {
        marginTop: spacing.sm,
        paddingTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    milestoneTextRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    milestoneText: {
        ...type.caption,
        fontSize: 11,
        color: colors.inkSoft,
    },
    milestoneTextStrong: {
        ...type.caption,
        fontSize: 11,
        fontWeight: '700',
        color: colors.marigold,
    },
    milestoneTrack: {
        height: 5,
        borderRadius: 3,
        backgroundColor: colors.border,
        overflow: 'hidden',
    },
    milestoneFill: {
        height: '100%',
        borderRadius: 3,
        backgroundColor: colors.marigold,
    },
});