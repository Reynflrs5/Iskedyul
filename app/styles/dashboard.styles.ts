import { StyleSheet } from 'react-native';
import { colors, type, spacing, radius, shadows } from './welcome.styles';

export { colors, type, spacing, radius, shadows };

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.paper,
    },
    scrollContent: {
        paddingBottom: spacing.xxl,
    },

    // --- Header ---
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    greetingCol: {
        flex: 1,
        paddingRight: spacing.md,
    },
    eyebrow: {
        ...type.overline,
        color: colors.inkSoft,
        marginBottom: spacing.xxs,
    },
    greetingText: {
        ...type.h1,
        fontSize: 25,
        color: colors.ink,
    },
    dateText: {
        ...type.body,
        fontSize: 14,
        color: colors.inkSoft,
        marginTop: 2,
    },
    avatar: {
        borderRadius: radius.pill,
        backgroundColor: colors.ink,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.soft,
    },
    avatarText: {
        ...type.label,
        color: colors.paper,
        fontSize: 16,
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

    // --- Stat cards ---
    statsRow: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    statCard: {
        flex: 1,
        backgroundColor: colors.paperRaised,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.sm,
        alignItems: 'flex-start',
        gap: spacing.xxs,
        ...shadows.soft,
    },
    statIconWrap: {
        width: 34,
        height: 34,
        borderRadius: radius.sm,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xxs,
    },
    statNumber: {
        ...type.h1,
        fontSize: 22,
        color: colors.ink,
    },
    statLabel: {
        ...type.caption,
        color: colors.inkSoft,
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