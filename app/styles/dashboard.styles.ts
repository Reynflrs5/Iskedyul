import { StyleSheet } from 'react-native';
import { colors, type, spacing, radius, shadows } from './welcome.styles';

export { colors, type, spacing, radius, shadows };

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
    heroEyebrow: {
        ...type.overline,
        color: 'rgba(251,247,239,0.55)', // paper at low opacity
        marginBottom: spacing.xxs,
    },
    heroGreeting: {
        ...type.h1,
        fontSize: 25,
        color: colors.paper,
    },
    heroSubtitle: {
        ...type.body,
        fontSize: 14,
        color: 'rgba(251,247,239,0.65)',
        marginTop: 2,
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
        width: 22,
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

    // --- Hero stat chips ---
    heroStatsRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginTop: spacing.lg,
    },
    heroStatChip: {
        flex: 1,
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
});