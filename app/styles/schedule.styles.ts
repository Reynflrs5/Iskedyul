import { StyleSheet } from 'react-native';
import { colors, type, spacing, radius, shadows } from './welcome.styles';

export { colors, type, spacing, radius, shadows };

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  scrollContent: { paddingBottom: spacing.xxl },

  // Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  pageTitle: { ...type.h1, color: colors.ink, fontSize: 25 },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Day tabs
  dayTabRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  dayTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.paperRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayTabActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  dayTabLabel: { ...type.caption, fontSize: 11, color: colors.inkSoft, fontWeight: '600' },
  dayTabLabelActive: { color: colors.paper },
  dayTabNumber: { ...type.label, fontSize: 15, color: colors.ink, marginTop: 2 },
  dayTabNumberActive: { color: colors.paper },

  // Class cards
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
  classAccentBar: { width: 4, backgroundColor: colors.periwinkle },
  classBody: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  classSubject: { ...type.label, fontSize: 15, color: colors.ink },
  classLocation: { ...type.caption, color: colors.inkSoft, marginTop: 2 },
  classTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  classTime: { ...type.caption, color: colors.inkFaint },

  emptyCard: {
    backgroundColor: colors.paperRaised,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    paddingVertical: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyText: { ...type.body, fontSize: 14, color: colors.inkFaint, textAlign: 'center' },
});
