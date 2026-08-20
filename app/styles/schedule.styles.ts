import { StyleSheet } from 'react-native';
import { colors, type, spacing, radius, shadows } from './welcome.styles';

export { colors, type, spacing, radius, shadows };

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ink, // hero sits flush at the top, no seam
  },
  scrollContent: {
    flexGrow: 1,
  },

  // --- Hero panel ---
  hero: {
    backgroundColor: colors.ink,
    paddingBottom: 40,
    overflow: 'hidden',
  },
  heroAccentRing: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: colors.periwinkle,
    opacity: 0.1,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.lg,
  },
  heroEyebrow: {
    ...type.overline,
    color: 'rgba(251,247,239,0.55)',
    marginBottom: spacing.xxs,
  },
  pageTitle: {
    ...type.h1,
    fontSize: 26,
    color: colors.paper,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.marigold,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },

  // --- Day tabs, on-dark ---
  dayTabRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  dayTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  dayTabActive: {
    backgroundColor: colors.marigold,
    borderColor: colors.marigold,
  },
  dayTabLabel: {
    ...type.caption,
    fontSize: 11,
    color: 'rgba(251,247,239,0.6)',
    fontWeight: '600',
  },
  dayTabLabelActive: {
    color: colors.marigoldInk,
  },
  dayTabNumber: {
    ...type.label,
    fontSize: 15,
    color: colors.paper,
    marginTop: 2,
  },
  dayTabNumberActive: {
    color: colors.marigoldInk,
  },
  dayTabTodayDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.marigold,
  },

  // --- Content sheet ---
  contentSheet: {
    flex: 1,
    backgroundColor: colors.paper,
    borderTopLeftRadius: radius.lg + 6,
    borderTopRightRadius: radius.lg + 6,
    marginTop: -24,
    paddingTop: spacing.lg,
    ...shadows.cta,
    shadowOpacity: 0.12,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sheetHeaderTitle: {
    ...type.h2,
    color: colors.ink,
  },
  sheetHeaderCount: {
    ...type.caption,
    color: colors.inkSoft,
  },

  // --- Class cards ---
  classCard: {
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
  classAccentBar: { width: 4 },
  classBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  classInfoCol: {
    flex: 1,
  },
  classSubject: { ...type.label, fontSize: 15, color: colors.ink },
  classLocation: { ...type.caption, color: colors.inkSoft, marginTop: 2 },
  classTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  classTime: { ...type.caption, color: colors.inkFaint },
  classDeleteHint: {
    marginLeft: spacing.sm,
  },

  emptyCard: {
    backgroundColor: colors.paperRaised,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    paddingVertical: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  emptyText: { ...type.body, fontSize: 14, color: colors.inkFaint, textAlign: 'center' },

  // --- Live Indicator Banner ---
  liveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  liveBannerPulse: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  liveBannerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  liveBannerTitle: {
    ...type.caption,
    fontWeight: '700',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  liveBannerSubject: {
    ...type.label,
    fontSize: 14,
    color: colors.ink,
    marginTop: 2,
  },
  liveBannerTime: {
    ...type.caption,
    fontSize: 12,
    fontWeight: '600',
    color: colors.inkSoft,
  },

  // --- Grid View Timetable ---
  gridContainer: {
    marginTop: spacing.md,
    backgroundColor: colors.paperRaised,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.soft,
  },
  gridInner: {
    flexDirection: 'row',
  },
  timeColumn: {
    width: 60,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    backgroundColor: colors.paper,
  },
  timeLabelContainer: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 8,
  },
  timeLabel: {
    ...type.caption,
    fontSize: 10,
    color: colors.inkSoft,
  },
  classesColumn: {
    flex: 1,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.border,
    opacity: 0.6,
  },
  classBlock: {
    position: 'absolute',
    left: 8,
    right: 8,
    borderRadius: radius.sm,
    padding: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    gap: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  classBlockSubject: {
    ...type.label,
    fontSize: 17,
    fontWeight: '800',
    color: '#132A4C',
    textAlign: 'center',
  },
  classBlockLocation: {
    ...type.caption,
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(19,42,76,0.85)',
    textAlign: 'center',
  },
  classBlockTime: {
    ...type.caption,
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(19,42,76,0.7)',
    textAlign: 'center',
  },
  // --- Current Time Indicator ---
  currentTimeLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.marigold, // Using marigold for the accent color
    zIndex: 10, // Ensure it's above the grid lines and class blocks
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentTimeDot: {
    position: 'absolute',
    left: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.marigold,
  },
  
  // --- Class Details Modal ---
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(19,42,76,0.6)',
  },
  modalContent: {
    backgroundColor: colors.paper,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    ...shadows.cta,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalColorStrip: {
    width: 6,
    height: '100%',
    borderRadius: 3,
    marginRight: spacing.sm,
  },
  modalSubject: {
    ...type.h2,
    color: colors.ink,
  },
  modalTime: {
    ...type.caption,
    color: colors.inkSoft,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  modalBody: {
    backgroundColor: colors.paperRaised,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  modalDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  modalDetailText: {
    ...type.body,
    fontSize: 15,
    color: colors.ink,
  },
  modalActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  modalActionText: {
    ...type.label,
  }
});